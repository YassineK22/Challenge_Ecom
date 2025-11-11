const Product = require("../models/Product");
const { uploadToCloudinary, cloudinary } = require("../utils/uploadsImages");
const mongoose = require("mongoose");
const Category = require("../models/Category");

// Helper function to process images
const processImages = async (files) => {
  const imageUrls = [];
  for (const file of files) {
    try {
      const result = await uploadToCloudinary(file.buffer);
      imageUrls.push({
        url: result.secure_url,
        publicId: result.public_id,
      });
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    }
  }
  return imageUrls;
};

// Helper function to transform product data
const transformProductData = (product) => {
  const transformed = product.toObject ? product.toObject() : product;

  // Simplify category details
  if (transformed.categoryDetails && transformed.categoryDetails.category) {
    transformed.categoryDetails = {
      category: {
        _id: transformed.categoryDetails.category._id,
        name: transformed.categoryDetails.category.name,
      },
      subcategory: transformed.categoryDetails.subcategory,
    };
  }

  return transformed;
};

// Get all products
exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.find()
      .populate({
        path: "categoryDetails.category",
        select: "name",
      })
      .populate("tags", "name")
      .populate("createdBy")
      .populate({
        path: "activePromotion",
        select: "name discountRate startDate endDate image isActive",
      })
      .lean();

    const transformedProducts = products.map(transformProductData);
    res.status(200).json(transformedProducts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get product by ID
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const product = await Product.findById(id)
      .populate({
        path: "categoryDetails.category",
        select: "name",
      })
      .populate("createdBy")
      .populate("tags", "name")
      .populate({
        path: "activePromotion",
        select: "name discountRate startDate endDate image isActive",
      })
      .lean();

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const transformedProduct = transformProductData(product);
    res.status(200).json({ product: transformedProduct });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get product by reference
exports.getProductByReference = async (req, res) => {
  try {
    const { reference } = req.params;

    if (!reference || typeof reference !== "string") {
      return res.status(400).json({ message: "Invalid product reference" });
    }

    const product = await Product.findOne({ reference })
      .populate({
        path: "categoryDetails.category",
        select: "name",
      })
      .populate({
        path: "activePromotion",
        select: "name discountRate startDate endDate image isActive",
      })
      .populate("reviews", "rating comment createdAt userName")
      .populate("createdBy");

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (!product.categoryDetails?.subcategory) {
      product.categoryDetails.subcategory = { group: "", item: "" };
    }

    const transformedProduct = transformProductData(product);
    res.status(200).json(transformedProduct);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Create new product
exports.createProduct = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No images uploaded" });
    }

    if (!req.body.reference) {
      return res.status(400).json({ error: "Product reference is required" });
    }

    if (!req.body.createdBy || typeof req.body.createdBy !== "string") {
      return res.status(400).json({ error: "Valid createdBy is required" });
    }

    if (
      !req.body.categoryDetails ||
      !req.body.categoryDetails.category ||
      !req.body.categoryDetails.subcategory ||
      !req.body.categoryDetails.subcategory.group ||
      !req.body.categoryDetails.subcategory.item
    ) {
      return res.status(400).json({
        error:
          "Complete category details are required (category, subcategory group, and item)",
      });
    }

    const existingProduct = await Product.findOne({
      reference: req.body.reference,
    });
    if (existingProduct) {
      return res.status(400).json({
        error: "Product with this reference already exists",
        existingProductId: existingProduct._id,
      });
    }

    const uploadedImages = await processImages(req.files);

    const productData = {
      reference: req.body.reference,
      name: req.body.name,
      description: req.body.description,
      price: req.body.price,
      stock: req.body.stock,
      images: uploadedImages,
      createdBy: req.body.createdBy,
      categoryDetails: {
        category: req.body.categoryDetails.category,
        subcategory: {
          group: req.body.categoryDetails.subcategory.group,
          item: req.body.categoryDetails.subcategory.item,
        },
      },
      tags: req.body.tags || [],  // <-- ADD THIS
    };


    const product = await Product.create(productData);
    const transformedProduct = transformProductData(product);
    res.status(201).json(transformedProduct);
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(400).json({
      error: error.message,
      details: error.errors,
    });
  }
};

// Update common product info
exports.updateProduct = async (req, res) => {
  try {
    const productData = {
      name: req.body.name,
      description: req.body.description,
      price: req.body.price,
      stock: req.body.stock,
      warranty: req.body.warranty,
    };

    if (req.body.categoryDetails) {
      productData.categoryDetails = {
        category: req.body.categoryDetails.category,
        subcategory: {
          group: req.body.categoryDetails.subcategory.group,
          item: req.body.categoryDetails.subcategory.item,
        },
      };
    }

    if (req.files && req.files.length > 0) {
      const newImages = await processImages(req.files);
      productData.$push = { images: { $each: newImages } };
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      productData,
      { new: true, runValidators: true }
    )
      .populate({
        path: "categoryDetails.category",
        select: "name",
      })
      .populate("createdBy");

    if (!product) return res.status(404).json({ message: "Product not found" });

    const transformedProduct = transformProductData(product);
    res.status(200).json(transformedProduct);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete product
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    if (product.images && product.images.length > 0) {
      for (const image of product.images) {
        await cloudinary.uploader.destroy(image.publicId);
      }
    }

    await product.remove();
    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Add images to product
exports.addProductImages = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const newImages = await processImages(req.files);
    product.images.push(...newImages);
    await product.save();

    const updatedProduct = await Product.findById(req.params.id)
      .populate({
        path: "categoryDetails.category",
        select: "name",
      })
      .populate("createdBy");

    const transformedProduct = transformProductData(updatedProduct);
    res.status(200).json(transformedProduct);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete product image
exports.deleteProductImage = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const imageIndex = product.images.findIndex(
      (img) => img.publicId === req.params.publicId
    );

    if (imageIndex === -1) {
      return res.status(404).json({ message: "Image not found" });
    }

    await cloudinary.uploader.destroy(req.params.publicId);

    product.images.splice(imageIndex, 1);
    await product.save();

    const updatedProduct = await Product.findById(req.params.id)
      .populate({
        path: "categoryDetails.category",
        select: "name",
      })
      .populate("createdBy");

    const transformedProduct = transformProductData(updatedProduct);
    res.status(200).json(transformedProduct);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Search products by reference or name
// Search products by reference, name, filters, etc.
exports.searchProducts = async (req, res) => {
  try {
    const {
      q = "",
      category = "",
      minPrice = "",
      maxPrice = "",
      rating = "",
      inStock = false,
      page = 1,
      limit = 20,
    } = req.query;

    const trimmedQuery = q.trim();

    // Base query
    let query = {};

    // 🔍 Text search (name, description, reference)
    if (trimmedQuery) {
      query.$or = [
        { name: { $regex: trimmedQuery, $options: "i" } },
        { description: { $regex: trimmedQuery, $options: "i" } },
        { reference: { $regex: trimmedQuery, $options: "i" } },
      ];
    }

    // 🏷️ Category filter
    if (category) {
      query["categoryDetails.category"] =
        mongoose.Types.ObjectId.isValid(category)
          ? new mongoose.Types.ObjectId(category)
          : { $exists: false };
    }

    // 💰 Price range filter
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // ⭐ Rating filter
    if (rating) {
      query.averageRating = { $gte: Number(rating) }; // assumes your Product model has an averageRating field
    }

    // 📦 Stock filter
    if (inStock === "true" || inStock === true) {
      query.stock = { $gt: 0 };
    }

    // 🔢 Pagination
    const skip = (Number(page) - 1) * Number(limit);

    // 📦 Fetch products
    const products = await Product.find(query)
      .populate({
        path: "categoryDetails.category",
        select: "name",
      })
      .populate("createdBy")
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const totalProducts = await Product.countDocuments(query);

    res.status(200).json({
      products,
      total: totalProducts,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(totalProducts / Number(limit)),
    });
  } catch (error) {
    res.status(500).json({
      message: "Error performing search",
      error: error.message,
    });
  }
};

// Get suggestions
exports.getSuggestions = async (req, res) => {
  try {
    const { q = "" } = req.query;

    if (!q || q.length < 2) {
      return res.status(200).json({ suggestions: [] });
    }

    const query = {
      $or: [
        { name: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
        { reference: { $regex: q, $options: "i" } },
      ],
    };

    const products = await Product.find(query, { name: 1 }).limit(10).lean();
    const suggestions = [...new Set(products.map((product) => product.name))];

    res.status(200).json({ suggestions });
  } catch (error) {
    res.status(500).json({ message: "Error fetching suggestions", error: error.message });
  }
};
// Get products with optional pagination and search
exports.getProducts = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;

    const skip = (page - 1) * limit;
    const query = {};

    if (search && search.trim().length > 0) {
      query.$or = [
        { reference: { $regex: search, $options: "i" } },
        { name: { $regex: search, $options: "i" } },
      ];
    }

    const products = await Product.find(query)
      .populate({
        path: "categoryDetails.category",
        select: "name",
      })
      .populate({
        path: "promotions.promotionId",
        select: "name discountRate startDate endDate isActive image",
      })
      .populate({
        path: "activePromotion",
        select: "name discountRate startDate endDate isActive image",
      })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Transform promotions to include oldPrice and newPrice
    const transformedProducts = products.map((product) => {
      if (product.promotions) {
        product.promotions = product.promotions.map((promo) => ({
          ...promo,
          oldPrice: promo.oldPrice || null,
          newPrice: promo.newPrice || null,
        }));
      }
      return transformProductData(product);
    });

    const total = await Product.countDocuments(query);

    res.status(200).json({
      products: transformedProducts,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      limit: parseInt(limit),
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Internal server error", details: error.message });
  }
};


exports.getProductsByCategory = async (req, res) => {
  try {
    const { categoryDetails, group, item } = req.query;
    const query = {};

    // Convert category name to ObjectId(s)
    if (categoryDetails) {
      const categories = await Category.find({ name: categoryDetails });
      const categoryIds = categories.map(c => c._id);
      query["categoryDetails.category"] = { $in: categoryIds };
    }

    if (group) query["categoryDetails.subcategory.group"] = group;
    if (item) query["categoryDetails.subcategory.item"] = item;

    const products = await Product.find(query)
      .populate({ path: "categoryDetails.category", select: "name" })
      .populate({ path: "activePromotion", select: "name discountRate startDate endDate isActive image" })
      .lean();

    const transformedProducts = products.map(transformProductData);
    res.json(transformedProducts);
  } catch (err) {
    console.error("Error in getProductsByCategory:", err);
    res.status(500).json({ message: err.message });
  }
};


// Get related products
exports.getRelatedProducts = async (req, res) => {
  try {
    const { productId } = req.params;
    const limit = parseInt(req.query.limit) || 4;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const currentProduct = await Product.findById(productId)
      .populate("tags")
      .populate("activePromotion", "name discountRate startDate endDate isActive image")
      .lean();

    if (!currentProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    const existingIds = new Set([productId]);
    let relatedProducts = [];

    const currentTags = new Set(currentProduct.tags?.map((tag) => tag._id.toString()) || []);
    const promotionNames = currentProduct.activePromotion ? [currentProduct.activePromotion.name] : [];
    const discountRates = currentProduct.activePromotion ? [currentProduct.activePromotion.discountRate] : [];

    const categoryId = currentProduct.categoryDetails?.category?._id || null;
    const subcategoryGroup = currentProduct.categoryDetails?.subcategory?.group || "";
    const subcategoryItem = currentProduct.categoryDetails?.subcategory?.item || "";

    // Strategy 1: Tags match
    if (currentTags.size >= 2) {
      const tagMatches = await Product.aggregate([
        { $match: { _id: { $ne: new mongoose.Types.ObjectId(productId) }, tags: { $in: Array.from(currentTags).map(mongoose.Types.ObjectId) } } },
        { $limit: limit },
      ]);
      tagMatches.forEach((p) => { if (!existingIds.has(p._id.toString())) { relatedProducts.push(p); existingIds.add(p._id.toString()); } });
    }

    // Strategy 2: Promotion match
    if (relatedProducts.length < limit && (promotionNames.length > 0 || discountRates.length > 0)) {
      const additionalNeeded = limit - relatedProducts.length;
      const promotionMatches = await Product.find({
        _id: { $nin: Array.from(existingIds) },
        $or: [
          { "activePromotion.name": { $in: promotionNames } },
          { "activePromotion.discountRate": { $in: discountRates } },
        ],
      }).limit(additionalNeeded);
      promotionMatches.forEach((p) => { relatedProducts.push(p); existingIds.add(p._id.toString()); });
    }

    // Strategy 3: Category/subcategory match
    if (relatedProducts.length < limit && categoryId) {
      const additionalNeeded = limit - relatedProducts.length;
      const categoryMatches = await Product.find({
        _id: { $nin: Array.from(existingIds) },
        "categoryDetails.category": categoryId,
        "categoryDetails.subcategory.group": subcategoryGroup,
        "categoryDetails.subcategory.item": subcategoryItem,
      }).limit(additionalNeeded);
      categoryMatches.forEach((p) => { relatedProducts.push(p); existingIds.add(p._id.toString()); });
    }

    // Strategy 4: Name similarity
    if (relatedProducts.length < limit) {
      const additionalNeeded = limit - relatedProducts.length;
      const allProducts = await Product.find({ _id: { $nin: Array.from(existingIds) } }).lean();
      const nameKeywords = currentProduct.name.toLowerCase().split(/\s+/).filter(w => w.length > 2);
      const scored = allProducts.map((p) => {
        const productName = p.name.toLowerCase();
        let score = 0;
        nameKeywords.forEach(k => { if (productName.includes(k)) score++; });
        return score > 0 ? { product: p, score } : null;
      }).filter(Boolean).sort((a, b) => b.score - a.score).slice(0, additionalNeeded);
      scored.forEach(s => { relatedProducts.push(s.product); existingIds.add(s.product._id.toString()); });
    }

    // Fallback random
    if (relatedProducts.length < limit) {
      const additionalNeeded = limit - relatedProducts.length;
      const randomProducts = await Product.aggregate([
        { $match: { _id: { $nin: Array.from(existingIds).map(mongoose.Types.ObjectId) } } },
        { $sample: { size: additionalNeeded } },
      ]);
      randomProducts.forEach(p => { relatedProducts.push(p); existingIds.add(p._id.toString()); });
    }

    const populatedProducts = await Product.populate(relatedProducts, [
      { path: "categoryDetails.category", select: "name" },
      { path: "activePromotion", select: "name discountRate startDate endDate isActive image" },
      { path: "images", select: "url" },
      { path: "tags", select: "name" },
    ]);

    const transformedProducts = populatedProducts.map(p => {
      if (p.promotions) {
        p.promotions = p.promotions.map(promo => ({ ...promo, oldPrice: promo.oldPrice || null, newPrice: promo.newPrice || null }));
      }
      return transformProductData(p);
    });

    res.status(200).json(transformedProducts.slice(0, limit));
  } catch (error) {
    console.error("Error getting related products:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get similar products (score-based)
exports.getSimilarProducts = async (req, res) => {
  try {
    const { productId, limit = 5 } = req.query;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const referenceProduct = await Product.findById(productId)
      .populate("categoryDetails.category", "name")
      .lean();

    if (!referenceProduct) return res.status(404).json({ message: "Product not found" });

    const query = { _id: { $ne: productId } };
    const weights = { category: 30, subcategoryGroup: 20, subcategoryItem: 10, tags: 25, promotion: 15 };

    const products = await Product.find(query)
      .populate("categoryDetails.category", "name")
      .populate("activePromotion", "name discountRate startDate endDate isActive image")
      .populate("tags", "name")
      .lean();

    const scoredProducts = products.map(p => {
      let score = 0;

      if (p.categoryDetails.category._id.toString() === referenceProduct.categoryDetails.category._id.toString()) {
        score += weights.category;
        if (p.categoryDetails.subcategory.group === referenceProduct.categoryDetails.subcategory.group) score += weights.subcategoryGroup;
        if (p.categoryDetails.subcategory.item === referenceProduct.categoryDetails.subcategory.item) score += weights.subcategoryItem;
      }

      const referenceTags = referenceProduct.tags?.map(t => t.toString()) || [];
      const productTags = p.tags?.map(t => t.toString()) || [];
      const commonTags = referenceTags.filter(tag => productTags.includes(tag));
      score += (commonTags.length / (referenceTags.length || 1)) * weights.tags;

      if (p.activePromotion && referenceProduct.activePromotion && p.activePromotion._id.toString() === referenceProduct.activePromotion._id.toString()) {
        score += weights.promotion;
      }

      return { product: p, score };
    });

    const similarProducts = scoredProducts
      .sort((a, b) => b.score - a.score)
      .slice(0, parseInt(limit))
      .map(({ product }) => {
        if (product.promotions) product.promotions = product.promotions.map(p => ({ ...p, oldPrice: p.oldPrice || null, newPrice: p.newPrice || null }));
        return transformProductData(product);
      });

    res.json(similarProducts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
