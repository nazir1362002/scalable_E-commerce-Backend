
const Product = require("../models/Product");
const { redisClient } = require("../config/redis");
const mongoose = require("mongoose");

// Create product
const createProduct = async (req, res) => {
    try {
        const product = await Product.create(req.body);

        // Invalidate all product list caches
        const keys = await redisClient.keys("products:*");

        if (keys.length > 0) {
            await redisClient.del(keys);
        }

        console.log("Product cache invalidated");

        res.status(201).json({
            success: true,
            message: "Product created successfully",
            data: product
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get all products
const getProducts = async (req, res) => {
    try {
        // -------------------------
        // Redis Cache Key
        // -------------------------

        const cacheKey = `products:${req.originalUrl} `;

        // -------------------------
        // Check Redis Cache
        // -------------------------

        const cachedProducts = await redisClient.get(cacheKey);

        if (cachedProducts) {
            console.log("Redis Cache HIT");

            return res.status(200).json(
                JSON.parse(cachedProducts)
            );
        }

        console.log("Redis Cache MISS");

        // -------------------------
        // Pagination
        // -------------------------

        const page = Math.max(
            parseInt(req.query.page) || 1,
            1
        );

        const limit = Math.min(
            Math.max(parseInt(req.query.limit) || 10, 1),
            100
        );

        const skip = (page - 1) * limit;

        // -------------------------
        // Filtering
        // -------------------------

        const minPrice = Number(req.query.minPrice);
        const maxPrice = Number(req.query.maxPrice);

        if (
            req.query.minPrice &&
            (Number.isNaN(minPrice) || minPrice < 0)
        ) {
            return res.status(400).json({
                success: false,
                message: "minPrice must be a valid positive number"
            });
        }

        if (
            req.query.maxPrice &&
            (Number.isNaN(maxPrice) || maxPrice < 0)
        ) {
            return res.status(400).json({
                success: false,
                message: "maxPrice must be a valid positive number"
            });
        }

        const filter = {};

        // -------------------------
        // Search
        // -------------------------

        if (req.query.search) {
            filter.$or = [
                {
                    name: {
                        $regex: req.query.search,
                        $options: "i"
                    }
                },
                {
                    description: {
                        $regex: req.query.search,
                        $options: "i"
                    }
                }
            ];
        }

        // -------------------------
        // Category Filter
        // -------------------------

        if (req.query.category) {
            filter.category = req.query.category;
        }

        // -------------------------
        // Minimum Price
        // -------------------------

        if (req.query.minPrice) {
            filter.price = {
                $gte: Number(req.query.minPrice)
            };
        }

        // -------------------------
        // Maximum Price
        // -------------------------

        if (req.query.maxPrice) {
            filter.price = {
                ...filter.price,
                $lte: Number(req.query.maxPrice)
            };
        }

        // -------------------------
        // Sorting
        // -------------------------

        const sort = req.query.sort || "createdAt";

        const sortOption = {};

        if (sort.startsWith("-")) {
            sortOption[sort.substring(1)] = -1;
        } else {
            sortOption[sort] = 1;
        }

        // -------------------------
        // Database Query
        // -------------------------

        const products = await Product.find(filter)
            .sort(sortOption)
            .skip(skip)
            .limit(limit);

        const totalProducts = await Product.countDocuments(filter);

        // -------------------------
        // Response Object
        // -------------------------

        const response = {
            success: true,
            page,
            limit,
            totalProducts,
            totalPages: Math.ceil(totalProducts / limit),
            filters: {
                category: req.query.category || null,
                minPrice: req.query.minPrice || null,
                maxPrice: req.query.maxPrice || null
            },
            data: products
        };

        // -------------------------
        // Store Response in Redis
        // TTL = 60 seconds
        // -------------------------

        await redisClient.setEx(
            cacheKey,
            60,
            JSON.stringify(response)
        );

        console.log("Product data cached in Redis");

        // -------------------------
        // Send Response
        // -------------------------

        res.status(200).json(response);

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get single product by ID
const getProduct = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID"
            });
        }

        const cacheKey = `products:single:${id}`;

        const cachedProduct = await redisClient.get(cacheKey);

        if (cachedProduct) {
            console.log("Redis Cache HIT");
            return res.status(200).json(JSON.parse(cachedProduct));
        }

        console.log("Redis Cache MISS");

        const product = await Product.findById(id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        const response = {
            success: true,
            data: product
        };

        await redisClient.setEx(cacheKey, 60, JSON.stringify(response));

        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Update product (admin only)
const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID"
            });
        }

        // -------------------------
        // Whitelist updatable fields so callers can't
        // inject arbitrary keys (e.g. _id) via req.body
        // -------------------------

        const allowedFields = ["name", "description", "price", "category", "stock", "image"];

        const updates = {};

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                success: false,
                message: "No valid fields provided to update"
            });
        }

        const product = await Product.findByIdAndUpdate(id, updates, {
            new: true,
            runValidators: true
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        // Invalidate all product list + single-product caches
        //await invalidateProductCache();
        await redisClient.del(`products:single:${id}`);

        res.status(200).json({
            success: true,
            message: "Product updated successfully",
            data: product
        });
    } catch (error) {
        if (error.name === "ValidationError") {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Delete product (admin only)
const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID"
            });
        }

        const product = await Product.findByIdAndDelete(id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        // Invalidate all product list + single-product caches
        //await invalidateProductCache();
        await redisClient.del(`products:single:${id}`);

        res.status(200).json({
            success: true,
            message: "Product deleted successfully",
            data: product
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    createProduct,
    getProducts,
    getProduct,
    updateProduct,
    deleteProduct
};
