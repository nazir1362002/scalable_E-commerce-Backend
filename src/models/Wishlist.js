const mongoose = require("mongoose");

const wishlistSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "User ID is required"]
        },
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: [true, "Product ID is required"]
        }
    },
    {
        timestamps: true
    }
);

// Prevent duplicate wishlist entries for the same user and product
wishlistSchema.index({ user: 1, product: 1 }, { unique: true });

// Optimize paginated queries sorted by creation date
wishlistSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("Wishlist", wishlistSchema);
