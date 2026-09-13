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
    const mongoose = require("mongoose");
    const { redisClient } = require("./config/redis");

    const databaseStatus =
        mongoose.connection.readyState === 1
            ? "connected"
            : "disconnected";

    const redisStatus =
        redisClient.isOpen
            ? "connected"
            : "disconnected";

    const isHealthy =
        databaseStatus === "connected" &&
        redisStatus === "connected";

    res.status(isHealthy ? 200 : 503).json({
        success: isHealthy,
        status: isHealthy ? "healthy" : "unhealthy",
        services: {
            database: databaseStatus,
            redis: redisStatus
        }
    });
});

app.use(loggerMiddleware);
app.use("/api", apiLimiter);

// Routes
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/orders", orderRoutes);
app.use(errorMiddleware);

module.exports = app;