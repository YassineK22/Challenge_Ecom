const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/ReviewsController");

// Routes
router.post("/", reviewController.addReview);
router.get("/:productId", reviewController.getReviewsByProduct);
router.put("/:reviewId", reviewController.updateReview);
router.delete("/:reviewId/:userId", reviewController.deleteReview);

module.exports = router;
