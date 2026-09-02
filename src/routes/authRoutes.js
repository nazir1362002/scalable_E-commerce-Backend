const express = require("express");

const {
    register,
    login,
    getProfile
} = require("../controllers/authController");
const protect = require("../middleware/authmiddleware");
const authorize = require("../middleware/roleMiddleware");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/profile", protect, getProfile);
router.get(
    "/admin",
    protect,
    authorize("admin"),
    (req, res) => {
        res.status(200).json({
            success: true,
            message: "Welcome Admin"
        });
    }
);

module.exports = router;