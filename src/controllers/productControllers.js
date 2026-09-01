const Product = require("../models/Product");

// Create product
const createProduct = async (req, res) => {
    try {
        const product = await Product.create(req.body);

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

// Get all products for basic use like 10 products
// const getProducts = async (req, res) => {
//     try {
//         const products = await Product.find();

//         res.status(200).json({
//             success: true,
//             count: products.length,
//             data: products
//         });
//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: error.message
//         });
//     }
// };
// Get all products for basic use like 1000 products(Pagination->get/api/products?page=1&limit=10)
const getProducts = async (req, res) => {
    try {
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
        //Search
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

        // Category filter
        if (req.query.category) {
            filter.category = req.query.category;
        }

        // Minimum price
        if (req.query.minPrice) {
            filter.price = {
                $gte: Number(req.query.minPrice)
            };
        }

        // Maximum price
        if (req.query.maxPrice) {
            filter.price = {
                ...filter.price,
                $lte: Number(req.query.maxPrice)
            };
        }
        //Sorting
        // Sorting
        let sort = req.query.sort || "createdAt";

        let sortOption = {};

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
        // Response
        // -------------------------

        res.status(200).json({
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
    getProducts
};