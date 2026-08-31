const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        console.log("Mongo URI exists:", !!process.env.MONGO_URI);

        const connection = await mongoose.connect(process.env.MONGO_URI);

        console.log(`MongoDB connected: ${connection.connection.host}`);
    } catch (error) {
        console.error(`MongoDB connection failed: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;