const express = require("express");
const {
    addToWishlist,
    getWishlist,
    removeFromWishlist
} = require("../controllers/wishlistController");
const protect = require("../middleware/authmiddleware");
const validatePagination = require("../middleware/paginationMiddleware");

const router = express.Router();

// All wishlist routes require authentication
router.use(protect);

router.post("/", addToWishlist);
router.get("/", validatePagination, getWishlist);
router.delete("/:productId", removeFromWishlist);

module.exports = router;
