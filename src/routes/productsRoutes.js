const express = require("express");
const protect = require("../middleware/authmiddleware");
const authorize = require("../middleware/roleMiddleware");


const {
    createProduct,
    getProducts
} = require("../controllers/productControllers");

const router = express.Router();

router.post(
    "/",
    protect,
    authorize("admin"),
    createProduct
);
router.get("/", getProducts);

module.exports = router;