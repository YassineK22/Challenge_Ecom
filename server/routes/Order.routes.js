const express = require("express");
const orderController = require("../controllers/OrderController");
const router = express.Router();

router.get("/", orderController.getAllOrders); 
router.get("/:orderId", orderController.getOrderById);
router.get('/stats', orderController.getOrderStats);
router.post("/", orderController.createOrder);
router.get("/user/:userId", orderController.getUserOrders);
router.put("/:orderId/status", orderController.updateOrderStatus);
router.delete("/:orderId", orderController.deleteOrder);

module.exports = router;
