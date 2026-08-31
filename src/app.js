const express = require("express");
const cors = require("cors");

const productRoutes = require("./routes/productsRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "E-commerce API is running"
    });
});

// Routes
app.use("/api/products", productRoutes);

module.exports = app;