const mongoose = require("mongoose");
const Cart = require("../models/Cart");
const Product = require("../models/Product");

// Add item to cart
exports.addToCart = async (req, res) => {
  try {
    const { userId, productId, quantity, price, variantId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId))
      return res.status(400).json({ success: false, message: "Invalid user ID" });

    if (!mongoose.Types.ObjectId.isValid(productId))
      return res.status(400).json({ success: false, message: "Invalid product ID" });

    if (!Number.isInteger(quantity) || quantity < 1)
      return res.status(400).json({ success: false, message: "Quantity must be a positive integer" });

    const product = await Product.findById(productId);

    if (!product)
      return res.status(404).json({ success: false, message: "Product not found" });

    // Stock check
    if (product.stock < quantity)
      return res.status(400).json({ success: false, message: `Insufficient stock. Available: ${product.stock}` });

    // Determine price (consider active promotion if exists)
    let finalPrice = product.price;
    let promotionDetails = null;

    if (product.activePromotion) {
      const promo = product.activePromotion;
      if (promo.isActive) {
        finalPrice = promo.newPrice;
        promotionDetails = {
          promotionId: promo._id,
          name: promo.name,
          discountRate: promo.discountRate,
          oldPrice: promo.oldPrice,
          newPrice: promo.newPrice,
          image: promo.image,
        };
      }
    }

    if (Math.abs(price - finalPrice) > 0.01)
      return res.status(400).json({ success: false, message: "Provided price does not match current price" });

    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = new Cart({
        userId,
        items: [{
          productId,
          quantity,
          price: finalPrice,
          stock: product.stock,
          promotion: promotionDetails,
          variantId: variantId ? mongoose.Types.ObjectId(variantId) : undefined,
        }],
      });
    } else {
      const itemIndex = cart.items.findIndex(
        item =>
          item.productId.toString() === productId &&
          (item.variantId?.toString() === variantId || (!item.variantId && !variantId))
      );

      if (itemIndex > -1) {
        cart.items[itemIndex].quantity += quantity;
        cart.items[itemIndex].stock = product.stock;
        cart.items[itemIndex].price = finalPrice;
        cart.items[itemIndex].promotion = promotionDetails;
      } else {
        cart.items.push({
          productId,
          quantity,
          price: finalPrice,
          stock: product.stock,
          promotion: promotionDetails,
          variantId: variantId ? mongoose.Types.ObjectId(variantId) : undefined,
        });
      }
    }

    await cart.save();
    res.status(200).json({ success: true, message: "Item added to cart", data: cart });
  } catch (err) {
    console.error("Add to cart error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get user's cart
exports.getCartByUserId = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!mongoose.Types.ObjectId.isValid(userId))
      return res.status(400).json({ success: false, message: "Invalid user ID" });

    let cart = await Cart.findOne({ userId })
      .populate({
        path: "items.productId",
        select: "reference name description images categoryDetails price stock activePromotion",
        populate: { path: "categoryDetails.category", select: "name" },
      });

    if (!cart) {
      return res.status(200).json({ success: true, items: [], userId });
    }

    const validItems = [];
    const invalidItemIds = [];

    await Promise.all(
      cart.items.map(async (item) => {
        const product = await Product.findById(item.productId._id);
        if (!product) {
          invalidItemIds.push(item._id);
          return;
        }

        let finalPrice = product.price;
        let promotionDetails = null;

        if (product.activePromotion?.isActive) {
          finalPrice = product.activePromotion.newPrice;
          promotionDetails = {
            promotionId: product.activePromotion._id,
            name: product.activePromotion.name,
            discountRate: product.activePromotion.discountRate,
            oldPrice: product.activePromotion.oldPrice,
            newPrice: product.activePromotion.newPrice,
            image: product.activePromotion.image,
          };
        }

        validItems.push({
          ...item.toObject(),
          price: finalPrice,
          stock: product.stock || 0,
          promotion: promotionDetails,
        });
      })
    );

    if (invalidItemIds.length > 0) {
      cart.items = cart.items.filter(item => !invalidItemIds.includes(item._id));
      await cart.save();
    }

    res.status(200).json({ success: true, items: validItems, userId: cart.userId });
  } catch (err) {
    console.error("Get cart error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};


// Delete an item from cart
exports.deleteCartItem = async (req, res) => {
  try {
    const { userId, itemId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(itemId))
      return res.status(400).json({ success: false, message: "Invalid ID(s)" });

    const cart = await Cart.findOne({ userId });
    if (!cart) return res.status(404).json({ success: false, message: "Cart not found" });

    const itemIndex = cart.items.findIndex(item => item._id.toString() === itemId);
    if (itemIndex === -1) return res.status(404).json({ success: false, message: "Item not found in cart" });

    cart.items.splice(itemIndex, 1);
    await cart.save();

    res.status(200).json({ success: true, message: "Item removed from cart", data: cart });
  } catch (err) {
    console.error("Delete cart item error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Update quantity of an item
exports.updateCartItemQuantity = async (req, res) => {
  try {
    const { userId, itemId, quantity } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(itemId))
      return res.status(400).json({ success: false, message: "Invalid ID(s)" });

    if (!Number.isInteger(quantity) || quantity < 1)
      return res.status(400).json({ success: false, message: "Quantity must be a positive integer" });

    const cart = await Cart.findOne({ userId });
    if (!cart) return res.status(404).json({ success: false, message: "Cart not found" });

    const item = cart.items.find(item => item._id.toString() === itemId);
    if (!item) return res.status(404).json({ success: false, message: "Item not found" });

    const product = await Product.findById(item.productId._id);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });

    if (product.stock < quantity)
      return res.status(400).json({ success: false, message: `Insufficient stock. Available: ${product.stock}` });

    let finalPrice = product.price;
    let promotionDetails = null;

    if (product.activePromotion?.isActive) {
      finalPrice = product.activePromotion.newPrice;
      promotionDetails = {
        promotionId: product.activePromotion._id,
        name: product.activePromotion.name,
        discountRate: product.activePromotion.discountRate,
        oldPrice: product.activePromotion.oldPrice,
        newPrice: product.activePromotion.newPrice,
        image: product.activePromotion.image,
      };
    }

    item.quantity = quantity;
    item.stock = product.stock;
    item.price = finalPrice;
    item.promotion = promotionDetails;

    await cart.save();

    res.status(200).json({ success: true, message: "Item quantity updated", data: cart });
  } catch (err) {
    console.error("Update cart item quantity error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Delete entire cart
exports.deleteCart = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId))
      return res.status(400).json({ success: false, message: "Invalid user ID" });

    const result = await Cart.deleteOne({ userId });
    if (result.deletedCount === 0)
      return res.status(404).json({ success: false, message: "Cart not found" });

    res.status(200).json({ success: true, message: "Cart deleted successfully" });
  } catch (err) {
    console.error("Delete cart error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
