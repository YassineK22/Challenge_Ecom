const mongoose = require("mongoose");
const Review = require("../models/Review");
const Product = require("../models/Product");

// Add a new review for a product
exports.addReview = async (req, res) => {
  try {
    const { productId, userId, rating, comment } = req.body;

    // Validate input
    if (!mongoose.Types.ObjectId.isValid(productId) || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid product or user ID" });
    }
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }
    if (comment && comment.length > 500) {
      return res.status(400).json({ message: "Comment cannot exceed 500 characters" });
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    // Check if user already reviewed this product
    const existingReview = await Review.findOne({ product: productId, user: userId });
    if (existingReview) {
      return res.status(400).json({ message: "You have already reviewed this product" });
    }

    // Create review
    const review = new Review({ product: productId, user: userId, rating, comment });
    await review.save();

    // Add review reference to product
    await Product.updateOne({ _id: productId }, { $push: { reviews: review._id } });

    res.status(201).json({ message: "Review added successfully", review });
  } catch (error) {
    console.error("Error adding review:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get all reviews for a product
exports.getReviewsByProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const reviews = await Review.find({ product: productId })
      .populate("user", "name email")
      .lean();

    res.status(200).json(reviews);
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update a review
exports.updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { userId, rating, comment } = req.body;

    if (!mongoose.Types.ObjectId.isValid(reviewId) || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid review or user ID" });
    }
    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }
    if (comment && comment.length > 500) {
      return res.status(400).json({ message: "Comment cannot exceed 500 characters" });
    }

    const review = await Review.findOne({ _id: reviewId, user: userId });
    if (!review) return res.status(404).json({ message: "Review not found or not authorized" });

    if (rating) review.rating = rating;
    if (comment !== undefined) review.comment = comment;
    review.updatedAt = Date.now();

    await review.save();
    res.status(200).json({ message: "Review updated successfully", review });
  } catch (error) {
    console.error("Error updating review:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete a review
exports.deleteReview = async (req, res) => {
  try {
    const { reviewId, userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(reviewId) || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid review or user ID" });
    }

    const review = await Review.findOne({ _id: reviewId, user: userId });
    if (!review) return res.status(404).json({ message: "Review not found or not authorized" });

    // Remove review reference from product
    await Product.updateOne({ _id: review.product }, { $pull: { reviews: reviewId } });

    await Review.deleteOne({ _id: reviewId });
    res.status(200).json({ message: "Review deleted successfully" });
  } catch (error) {
    console.error("Error deleting review:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
