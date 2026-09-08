const mongoose = require("mongoose");
const Order = require("../models/Order");
const Product = require("../models/Product");

const createOrder = async (req, res, next) => {
    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        const { items } = req.body;

        if (!items || items.length === 0) {
            await session.abortTransaction();

            return res.status(400).json({
                success: false,
                message: "Order must contain at least one product"
            });
        }

        let totalPrice = 0;
        const orderItems = [];

        for (const item of items) {

            const product = await Product.findOneAndUpdate(
                {
                    _id: item.product,
                    stock: { $gte: item.quantity }
                },
                {
                    $inc: {
                        stock: -item.quantity
                    }
                },
                {
                    returnDocument: "after",
                    session
                }
            );

            if (!product) {
                await session.abortTransaction();

                return res.status(400).json({
                    success: false,
                    message: `Product not found or insufficient stock: ${item.product}`
                });
            }

            const itemTotal = product.price * item.quantity;

            totalPrice += itemTotal;

            orderItems.push({
                product: product._id,
                quantity: item.quantity,
                price: product.price
            });
        }

        const order = await Order.create(
            [
                {
                    user: req.user.id,
                    items: orderItems,
                    totalPrice
                }
            ],
            { session }
        );

        await session.commitTransaction();

        res.status(201).json({
            success: true,
            message: "Order created successfully",
            order: order[0]
        });

    } catch (error) {
        await session.abortTransaction();
        next(error);

    } finally {
        session.endSession();
    }
};
const getMyOrders = async (req, res, next) => {
    try {
        const orders = await Order.find({
            user: req.user.id
        })
            .populate("items.product", "name price")
            .sort("-createdAt");

        res.status(200).json({
            success: true,
            count: orders.length,
            orders
        });

    } catch (error) {
        next(error);
    }
};
const getOrderById = async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate("items.product", "name price");

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        // Check order ownership
        if (order.user.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "Access denied"
            });
        }

        res.status(200).json({
            success: true,
            order
        });

    } catch (error) {
        next(error);
    }
};
const cancelOrder = async (req, res, next) => {
    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        const order = await Order.findById(req.params.id).session(session);

        if (!order) {
            await session.abortTransaction();

            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        // Check ownership
        if (order.user.toString() !== req.user.id) {
            await session.abortTransaction();

            return res.status(403).json({
                success: false,
                message: "Access denied"
            });
        }

        // Only pending orders can be cancelled
        if (order.status !== "pending") {
            await session.abortTransaction();

            return res.status(400).json({
                success: false,
                message: `Order cannot be cancelled because its status is ${order.status}`
            });
        }

        // Restore product stock
        for (const item of order.items) {
            await Product.findByIdAndUpdate(
                item.product,
                {
                    $inc: {
                        stock: item.quantity
                    }
                },
                {
                    session
                }
            );
        }

        // Update order status
        order.status = "cancelled";

        await order.save({ session });

        await session.commitTransaction();

        res.status(200).json({
            success: true,
            message: "Order cancelled and stock restored successfully",
            order
        });

    } catch (error) {
        await session.abortTransaction();
        next(error);

    } finally {
        session.endSession();
    }
};
// For the admin 
const getAllOrders = async (req, res, next) => {
    try {
        const orders = await Order.find()
            .populate("user", "name email")
            .populate("items.product", "name price")
            .sort("-createdAt");

        res.status(200).json({
            success: true,
            count: orders.length,
            orders
        });

    } catch (error) {
        next(error);
    }
};
const updateOrderStatus = async (req, res, next) => {
    try {
        const { status } = req.body;

        const validTransitions = {
            pending: ["processing", "cancelled"],
            processing: ["shipped"],
            shipped: ["delivered"],
            delivered: [],
            cancelled: []
        };

        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        const allowedNextStatuses = validTransitions[order.status];

        if (!allowedNextStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Cannot change order status from ${order.status} to ${status}`
            });
        }

        order.status = status;

        await order.save();

        res.status(200).json({
            success: true,
            message: "Order status updated successfully",
            order
        });

    } catch (error) {
        next(error);
    }
};

module.exports = {
    createOrder,
    getMyOrders,
    getOrderById,
    cancelOrder,
    getAllOrders,
    updateOrderStatus
};