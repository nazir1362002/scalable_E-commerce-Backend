const express = require("express");

const {
    createOrder,
    getMyOrders,
    getOrderById,
    cancelOrder,
    getAllOrders,
    updateOrderStatus
} = require("../controllers/orderController");

const protect = require("../middleware/authmiddleware");
const authorize = require("../middleware/roleMiddleware")
const validatePagination = require("../middleware/paginationMiddleware");

const router = express.Router();


router.post("/", protect, createOrder);
router.get("/my-orders", protect, validatePagination, getMyOrders);
router.patch("/:id/cancel", protect, cancelOrder);
router.get("/:id", protect, getOrderById);
router.patch(
    "/:id/status",
    protect,
    authorize("admin"),
    updateOrderStatus
);
router.get(
    "/",
    protect,
    authorize("admin"),
    validatePagination,
    getAllOrders
);

module.exports = router;