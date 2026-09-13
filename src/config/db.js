const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        console.log("Mongo URI exists:", !!process.env.MONGO_URI);

        const connection = await mongoose.connect(process.env.MONGO_URI, {
            // Maximum number of connections in the pool
            maxPoolSize: 10,

            // Keep at least 2 connections ready
            minPoolSize: 2,

            // Stop trying to find a MongoDB server after 5 seconds
            serverSelectionTimeoutMS: 5000,

            // Close inactive socket after 45 seconds
            socketTimeoutMS: 45000
        });

        console.log(`MongoDB connected: ${connection.connection.host}`);
    } catch (error) {
        console.error(`MongoDB connection failed: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;