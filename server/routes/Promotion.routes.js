const express = require("express");
const router = express.Router();
const {
  createPromotion,
  getPromotionById,
} = require("../controllers/promotionController");

// Create promotion with image upload
router.post("/", createPromotion);

// Get all promotions for a specific user
router.get("/id/:promotionId", getPromotionById);

module.exports = router;
