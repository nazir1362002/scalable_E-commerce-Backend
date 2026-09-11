const dns = require("dns");

dns.setServers([
    "8.8.8.8",
    "1.1.1.1"
]);


require("dotenv").config();


const app = require("./app");
const connectDB = require("./config/db");
const { connectRedis,redisClient } = require("./config/redis");


const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await connectDB();
        await connectRedis();
        await redisClient.set("test:key", "Hello Redis");

        const value = await redisClient.get("test:key");

        console.log("Redis test value:", value);

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Server startup failed:", error.message);
        process.exit(1);
    }
};

startServer();