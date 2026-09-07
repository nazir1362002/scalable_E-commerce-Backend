const Order = require("../models/Order");
const Product = require("../models/Product");

const createOrder = async (req, res, next) => {
    try {
        const { items } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Order must contain at least one product"
            });
        }

        let totalPrice = 0;
        const orderItems = [];

        for (const item of items) {
            const product = await Product.findById(item.product);

            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: `Product not found: ${item.product}`
                });
            }

            if (product.stock < item.quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Not enough stock for ${product.name}`
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

        const order = await Order.create({
            user: req.user.id,
            items: orderItems,
            totalPrice
        });

        res.status(201).json({
            success: true,
            message: "Order created successfully",
            order
        });

    } catch (error) {
        next(error);
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

module.exports = {
    createOrder,
    getMyOrders,
    getOrderById
};