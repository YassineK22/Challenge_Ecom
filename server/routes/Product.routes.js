const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const { upload, handleUploadErrors } = require("../utils/uploadsImages");

// Search and reference routes (should come first)
router.get("/search", productController.searchProducts);
router.get("/suggestions", productController.getSuggestions);
router.get("/reference/:reference", productController.getProductByReference);

// Product listing with filters
router.get("/", productController.getAllProducts);
router.get("/by-category", productController.getProductsByCategory);
router.get("/:productId/related", productController.getRelatedProducts);
router.get("/similar-products", productController.getSimilarProducts);

// Product CRUD operations
router.post(
  "/",
  upload.array("images", 10),
  handleUploadErrors,
  productController.createProduct
);

router.get("/:id", productController.getProductById);

router.put(
  "/:id",
  upload.array("images", 10),
  handleUploadErrors,
  productController.updateProduct
);

router.delete("/:id", productController.deleteProduct);

// Image management
router.post(
  "/:id/images",
  upload.array("images", 10),
  handleUploadErrors,
  productController.addProductImages
);

router.delete("/:id/images/:publicId", productController.deleteProductImage);

module.exports = router;
