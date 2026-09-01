const express = require("express");
const cors = require("cors");

const productRoutes = require("./routes/productsRoutes");

const app = express();

// Middleware
const errorHandler = (err, req, res, next) => {
    console.error(err);

    res.status(500).json({
        success: false,
        message: err.message || "Internal Server Error"
    });
};

app.use(cors());
app.use(express.json());
app.use(errorHandler);

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