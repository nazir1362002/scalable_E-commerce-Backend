const dns = require("dns");

dns.setServers([
    "8.8.8.8",
    "1.1.1.1"
]);

require("dotenv").config();

const mongoose = require("mongoose");
const app = require("./app");
const connectDB = require("./config/db");
const { connectRedis, redisClient } = require("./config/redis");

const PORT = process.env.PORT || 5000;

let server;

const startServer = async () => {
    try {
        await connectDB();
        await connectRedis();

        await redisClient.set("test:key", "Hello Redis");

        const value = await redisClient.get("test:key");

        console.log("Redis test value:", value);

        server = app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });

    } catch (error) {
        console.error("Server startup failed:", error.message);
        process.exit(1);
    }
};

const gracefulShutdown = async () => {
    console.log("Shutdown signal received");

    try {
        // 1. Stop accepting new HTTP requests
        console.log("Closing HTTP server...");

        if (server) {
            server.close(() => {
                console.log("HTTP server closed");
            });
        }

        // 2. Close MongoDB connection
        console.log("Closing MongoDB...");

        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.close(false);
            console.log("MongoDB connection closed");
        } else {
            console.log("MongoDB connection already closed");
        }

        // 3. Close Redis connection
        console.log("Closing Redis...");

        if (redisClient.isOpen) {
            await redisClient.quit();
            console.log("Redis connection closed");
        } else {
            console.log("Redis connection already closed");
        }

        console.log("Graceful shutdown completed");

        process.exit(0);

    } catch (error) {
        console.error("Error during shutdown:", error.message);
        process.exit(1);
    }
};
process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);

startServer();