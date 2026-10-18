const { redisClient } = require("../config/redis");

/**
 * Safely invalidates all product list cache entries in Redis using scanIterator
 * to avoid blocking Redis with the synchronous KEYS command.
 */
const invalidateProductListCache = async () => {
    try {
        if (!redisClient.isOpen) {
            return;
        }

        const keysToDelete = [];
        for await (const key of redisClient.scanIterator({ MATCH: "products:list:*" })) {
            keysToDelete.push(key);
        }

        if (keysToDelete.length > 0) {
            await redisClient.del(keysToDelete);
            console.log(`Product list cache cleared (${keysToDelete.length} keys deleted)`);
        }
    } catch (error) {
        console.error("Error invalidating product list cache:", error.message);
    }
};

module.exports = {
    invalidateProductListCache
};
