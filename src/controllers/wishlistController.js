const mongoose = require("mongoose");
const Wishlist = require("../models/Wishlist");
const Product = require("../models/Product");

/**
 * Add a product to user's wishlist
 * POST /api/v1/wishlist
 */
const addToWishlist = async (req, res, next) => {
    try {
        const { productId } = req.body;

        if (!productId) {
            return res.status(400).json({
                success: false,
                message: "productId is required"
            });
        }

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID format"
            });
        }

        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        // Check if already in wishlist
        const existingItem = await Wishlist.findOne({
            user: req.user.id,
            product: productId
        });

        if (existingItem) {
            return res.status(400).json({
                success: false,
                message: "Product is already in your wishlist"
            });
        }

        const wishlistItem = await Wishlist.create({
            user: req.user.id,
            product: productId
        });

        res.status(201).json({
            success: true,
            message: "Product added to wishlist successfully",
            data: wishlistItem
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: "Product is already in your wishlist"
            });
        }
        next(error);
    }
};

/**
 * Get user's wishlist with pagination
 * GET /api/v1/wishlist
 */
const getWishlist = async (req, res, next) => {
    try {
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 50);
        const skip = (page - 1) * limit;

        const filter = { user: req.user.id };

        const totalItems = await Wishlist.countDocuments(filter);

        const items = await Wishlist.find(filter)
            .populate("product", "name price category image stock")
            .sort("-createdAt")
            .skip(skip)
            .limit(limit);

        res.status(200).json({
            success: true,
            page,
            limit,
            totalItems,
            totalPages: Math.ceil(totalItems / limit),
            data: items
        });

    } catch (error) {
        next(error);
    }
};

/**
 * Remove a product from user's wishlist
 * DELETE /api/v1/wishlist/:productId
 */
const removeFromWishlist = async (req, res, next) => {
    try {
        const { productId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID format"
            });
        }

        const wishlistItem = await Wishlist.findOneAndDelete({
            user: req.user.id,
            product: productId
        });

        if (!wishlistItem) {
            return res.status(404).json({
                success: false,
                message: "Wishlist item not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Product removed from wishlist successfully"
        });

    } catch (error) {
        next(error);
    }
};

module.exports = {
    addToWishlist,
    getWishlist,
    removeFromWishlist
};
