const mongoose = require("mongoose");
const Promotion = require("../models/Promotion");
const Product = require("../models/Product");
const cloudinary = require("cloudinary").v2;
const multer = require("multer");
require("dotenv").config();

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer setup
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    if (filetypes.test(file.mimetype)) return cb(null, true);
    cb(new Error("Only JPEG, JPG, and PNG images are allowed"));
  },
}).single("image");

// Create a promotion
const createPromotion = async (req, res) => {
  try {
    upload(req, res, async (err) => {
      if (err) return res.status(400).json({ message: err.message });

      const { name, discountRate, startDate, endDate, applicableProducts } = req.body;

      if (!name || !discountRate || !startDate || !endDate || !req.file || !applicableProducts) {
        return res.status(400).json({ message: "All fields and an image are required" });
      }

      // Validate discount rate
      if (discountRate < 0 || discountRate > 100) {
        return res.status(400).json({ message: "Discount rate must be between 0 and 100" });
      }

      // Validate dates
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (start >= end) return res.status(400).json({ message: "End date must be after start date" });

      // Parse product IDs
      let productIds;
      try {
        productIds = typeof applicableProducts === "string" ? JSON.parse(applicableProducts) : applicableProducts;
        productIds = Array.isArray(productIds) ? productIds : [productIds].filter(Boolean);

        const invalidIds = productIds.filter((id) => !mongoose.isValidObjectId(id));
        if (invalidIds.length) return res.status(400).json({ message: `Invalid product IDs: ${invalidIds.join(", ")}` });
      } catch {
        return res.status(400).json({ message: "Invalid applicableProducts format" });
      }

      if (productIds.length === 0) return res.status(400).json({ message: "At least one product is required" });

      // Check all products exist
      const products = await Product.find({ _id: { $in: productIds } });
      if (products.length !== productIds.length) {
        return res.status(400).json({ message: "One or more product IDs are invalid" });
      }

      // Upload image to Cloudinary
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream({ folder: "promotions" }, (error, result) => {
          if (error) reject(error); else resolve(result);
        });
        stream.end(req.file.buffer);
      });

      // Create promotion
      const promotion = new Promotion({
        name,
        image: { url: result.secure_url, publicId: result.public_id },
        discountRate,
        startDate: start,
        endDate: end,
        applicableProducts: productIds,
      });

      await promotion.save();

      // Update products with promotion
      await Product.updateMany(
        { _id: { $in: productIds } },
        { $set: { activePromotion: promotion._id } }
      );

      res.status(201).json({ message: "Promotion created successfully", promotion });
    });
  } catch (error) {
    console.error("Error creating promotion:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all promotions
const getAllPromotions = async (req, res) => {
  try {
    const promotions = await Promotion.find()
      .populate({ path: "applicableProducts", select: "name price images" })
      .sort({ createdAt: -1 });

    res.status(200).json(promotions);
  } catch (error) {
    console.error("Error fetching promotions:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get promotion by ID
const getPromotionById = async (req, res) => {
  try {
    const { promotionId } = req.params;
    if (!mongoose.isValidObjectId(promotionId)) return res.status(400).json({ message: "Invalid promotion ID" });

    const promotion = await Promotion.findById(promotionId)
      .populate({ path: "applicableProducts", select: "name price images description" });

    if (!promotion) return res.status(404).json({ message: "Promotion not found" });

    res.status(200).json(promotion);
  } catch (error) {
    console.error("Error fetching promotion:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  createPromotion,
  getAllPromotions,
  getPromotionById,
};
