const mongoose = require("mongoose");
const Order = require("../models/Order");
const Product = require("../models/Product");
const Cart = require("../models/Cart");
const { User } = require("../models/User");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// Create a new order
const createOrder = async (req, res) => {
  try {
    const {
      userId,
      items,
      shippingInfo,
      deliveryMethod,
      paymentMethod,
      subtotal,
      shipping,
      tax,
      total,
      paymentResult,
    } = req.body;

    if (!userId || !items?.length || !shippingInfo || !paymentMethod) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (
      paymentMethod === "stripe" &&
      (!paymentResult || !paymentResult.id || paymentResult.status !== "succeeded")
    ) {
      return res.status(400).json({ message: "Valid Stripe payment result required" });
    }

    // Validate and update stock
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) return res.status(404).json({ message: `Product not found: ${item.productId}` });

      if (product.stock < item.quantity)
        return res.status(400).json({ message: `Insufficient stock for ${product.name}` });

      product.stock -= item.quantity;
      await product.save();
    }

    // Verify user
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Payment state
    const paymentStatus = paymentMethod === "stripe" ? "paid" : "pending";
    const stripePaymentIntentId = paymentMethod === "stripe" ? paymentResult.id : null;

    // Create order
    const order = new Order({
      userId,
      items,
      shippingInfo,
      deliveryMethod,
      paymentMethod,
      subtotal,
      shipping,
      tax,
      total,
      paymentStatus,
      stripePaymentIntentId,
    });

    const savedOrder = await order.save();

    // Clear cart
    const cart = await Cart.findOne({ userId });
    if (cart) {
      cart.items = cart.items.filter(
        (cartItem) =>
          !items.some((orderItem) => orderItem.productId.toString() === cartItem.productId.toString())
      );
      if (cart.items.length === 0) await Cart.deleteOne({ userId });
      else await cart.save();
    }

    // opulate & send confirmation
    const populatedOrder = await Order.findById(savedOrder._id)
      .populate("userId", "name email")
      .populate("items.productId", "name images price");

    res.status(201).json({
      message: "Order created successfully",
      order: populatedOrder,
      paymentIntentId: stripePaymentIntentId,
    });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ message: "Failed to create order", error: error.message });
  }
};

// Get a specific order
const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(orderId))
      return res.status(400).json({ message: "Invalid orderId" });

    const order = await Order.findById(orderId)
      .populate("userId", "name email")
      .populate("items.productId", "name images price description");

    if (!order) return res.status(404).json({ message: "Order not found" });

    res.status(200).json({ message: "Order retrieved successfully", order });
  } catch (error) {
    res.status(500).json({ message: "Failed to retrieve order", error: error.message });
  }
};

// Get all orders for a specific user
const getUserOrders = async (req, res) => {
  try {
    const { userId } = req.params;

    const orders = await Order.find({ userId })
      .populate("items.productId", "name images price")
      .sort({ createdAt: -1 });

    if (!orders || orders.length === 0) {
      return res.status(404).json({ message: "No orders found for this user" });
    }

    res.status(200).json({ orders });
  } catch (error) {
    console.error("Error fetching user orders:", error);
    res.status(500).json({ message: "Error fetching user orders", error: error.message });
  }
};

// 🔄 Update order status (admin only)
const updateOrderStatus = async (req, res) => {
  try {
    const { orderId, status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(orderId))
      return res.status(400).json({ message: "Invalid orderId" });

    const validStatuses = ["pending", "processing", "shipped", "delivered", "cancelled"];
    if (!validStatuses.includes(status))
      return res.status(400).json({ message: "Invalid status" });

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    order.status = status;
    order.statusUpdatedAt = Date.now();

    if (status === "delivered" && order.paymentMethod !== "stripe") {
      order.paymentStatus = "paid";
    }

    await order.save();

    const populatedOrder = await Order.findById(orderId)
      .populate("userId", "name email")
      .populate("items.productId", "name images price");

    res.status(200).json({ message: "Order updated successfully", order: populatedOrder });
  } catch (error) {
    res.status(500).json({ message: "Failed to update order", error: error.message });
  }
};

// Delete an order (admin or user if pending)
const deleteOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(orderId))
      return res.status(400).json({ message: "Invalid orderId" });

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.status !== "pending")
      return res.status(400).json({ message: "Only pending orders can be deleted" });

    // Restore product stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: item.quantity },
      });
    }

    // Refund if Stripe
    if (order.paymentMethod === "stripe" && order.stripePaymentIntentId) {
      await stripe.refunds.create({ payment_intent: order.stripePaymentIntentId });
    }

    await Order.deleteOne({ _id: orderId });
    res.status(200).json({ message: "Order deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete order", error: error.message });
  }
};

module.exports = {
  createOrder,
  getOrderById,
  getUserOrders,
  updateOrderStatus,
  deleteOrder,
};