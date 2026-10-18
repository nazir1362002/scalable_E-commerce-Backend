const express = require("express");
const cors = require("cors");

const productRoutes = require("./routes/productsRoutes");
const authRoutes = require("./routes/authRoutes");
const orderRoutes = require("./routes/orderRoutes");
const wishlistRoutes = require("./routes/wishlistRoutes");
const loggerMiddleware = require("./middleware/loggerMiddleware");
const apiLimiter = require("./middleware/rateLimiter");
const errorMiddleware = require("./middleware/errorMiddleware");
const securityMiddleware = require("./middleware/securityMiddleware");

const app = express();

app.use(cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
}));
app.use(express.json());
app.use(securityMiddleware);

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
app.use("/api/v1/wishlist", wishlistRoutes);
app.use(errorMiddleware);

module.exports = app;
