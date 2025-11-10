const express = require("express");
const orderController = require("../controllers/OrderController");
const router = express.Router();

router.get("/:orderId", orderController.getOrderById);
router.post("/", orderController.createOrder);
router.get("/user/:userId", orderController.getUserOrders);
router.put("/:orderId/status", orderController.updateOrderStatus);
router.delete("/:orderId", orderController.deleteOrder);
module.exports = router;
