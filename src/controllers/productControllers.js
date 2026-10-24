const Product = require("../models/Product");
const { redisClient } = require("../config/redis");
const { invalidateProductListCache } = require("../utils/cache");
const { uploadToCloudinary, deleteFromCloudinary } = require("../utils/cloudinary");
const mongoose = require("mongoose");

// Create product
const createProduct = async (req, res, next) => {
    let uploadedImageData = null;

    try {
        const productData = { ...req.body };

        // Handle image upload if file is attached in req.file
        if (req.file) {
            uploadedImageData = await uploadToCloudinary(req.file.buffer, "products");
            productData.image = uploadedImageData;
        } else if (req.body.image && typeof req.body.image === "string") {
            productData.image = { url: req.body.image, publicId: "" };
        }

        const product = await Product.create(productData);

        // Invalidate all product list caches safely
        await invalidateProductListCache();

        res.status(201).json({
            success: true,
            message: "Product created successfully",
            data: product
        });
    } catch (error) {
        // Cleanup uploaded image if database product creation fails
        if (uploadedImageData && uploadedImageData.publicId) {
            await deleteFromCloudinary(uploadedImageData.publicId);
        }

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

// Get all products
const getProducts = async (req, res) => {
    try {
        const cacheKey = `products:list:${req.originalUrl}`;

        const cachedProducts = await redisClient.get(cacheKey);

        if (cachedProducts) {
            console.log("Redis Cache HIT");
            return res.status(200).json(JSON.parse(cachedProducts));
        }

        console.log("Redis Cache MISS");

        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100);
        const skip = (page - 1) * limit;

        const minPrice = Number(req.query.minPrice);
        const maxPrice = Number(req.query.maxPrice);

        if (req.query.minPrice && (Number.isNaN(minPrice) || minPrice < 0)) {
            return res.status(400).json({
                success: false,
                message: "minPrice must be a valid positive number"
            });
        }

        if (req.query.maxPrice && (Number.isNaN(maxPrice) || maxPrice < 0)) {
            return res.status(400).json({
                success: false,
                message: "maxPrice must be a valid positive number"
            });
        }

        const filter = {};

        if (req.query.search) {
            filter.$or = [
                { name: { $regex: req.query.search, $options: "i" } },
                { description: { $regex: req.query.search, $options: "i" } }
            ];
        }

        if (req.query.category) {
            filter.category = req.query.category;
        }

        if (req.query.minPrice) {
            filter.price = { $gte: Number(req.query.minPrice) };
        }

        if (req.query.maxPrice) {
            filter.price = { ...filter.price, $lte: Number(req.query.maxPrice) };
        }

        const sort = req.query.sort || "createdAt";
        const sortOption = {};

        if (sort.startsWith("-")) {
            sortOption[sort.substring(1)] = -1;
        } else {
            sortOption[sort] = 1;
        }

        const products = await Product.find(filter)
            .sort(sortOption)
            .skip(skip)
            .limit(limit);

        const totalProducts = await Product.countDocuments(filter);

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

        await redisClient.setEx(cacheKey, 60, JSON.stringify(response));

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
    let newImageData = null;

    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID"
            });
        }

        const existingProduct = await Product.findById(id);

        if (!existingProduct) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        const allowedFields = ["name", "description", "price", "category", "stock"];
        const updates = {};

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        }

        // Handle image replacement if a new file is uploaded
        if (req.file) {
            newImageData = await uploadToCloudinary(req.file.buffer, "products");
            updates.image = newImageData;
        } else if (req.body.image && typeof req.body.image === "string") {
            updates.image = { url: req.body.image, publicId: "" };
        }

        if (Object.keys(updates).length === 0 && !req.file) {
            return res.status(400).json({
                success: false,
                message: "No valid fields provided to update"
            });
        }

        const oldPublicId = existingProduct.image?.publicId;

        const product = await Product.findByIdAndUpdate(id, updates, {
            new: true,
            runValidators: true
        });

        // Only after database update succeeds, delete the old Cloudinary image if it exists
        if (req.file && oldPublicId) {
            await deleteFromCloudinary(oldPublicId);
        }

        // Invalidate all product list + single-product caches
        await invalidateProductListCache();
        await redisClient.del(`products:single:${id}`);

        res.status(200).json({
            success: true,
            message: "Product updated successfully",
            data: product
        });
    } catch (error) {
        // If DB update fails, clean up the newly uploaded image so it's not orphaned
        if (newImageData && newImageData.publicId) {
            await deleteFromCloudinary(newImageData.publicId);
        }

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

        // Clean up Cloudinary image if publicId exists
        if (product.image && product.image.publicId) {
            await deleteFromCloudinary(product.image.publicId);
        }

        // Invalidate all product list + single-product caches
        await invalidateProductListCache();
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
