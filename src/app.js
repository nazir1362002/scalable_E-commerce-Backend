const express = require("express");
const cors = require("cors");

const productRoutes = require("./routes/productsRoutes");
const authRoutes = require("./routes/authRoutes");
const orderRoutes = require("./routes/orderRoutes");
const loggerMiddleware = require("./middleware/loggerMiddleware");
const apiLimiter = require("./middleware/rateLimiter");
const errorMiddleware = require("./middleware/errorMiddleware");
const securityMiddleware = require("./middleware/securityMiddleware");

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
app.use(securityMiddleware);
app.use(errorHandler);

// Health check
app.get("/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "E-commerce API is running"
    });
});

app.use(loggerMiddleware);
app.use("/api", apiLimiter);

// Routes
app.use("/api/products", productRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);
app.use(errorMiddleware);

module.exports = app;