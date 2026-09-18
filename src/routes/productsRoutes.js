const express = require("express");
const protect = require("../middleware/authmiddleware");
const authorize = require("../middleware/roleMiddleware");


const {
    createProduct,
    getProducts,
    getProduct,
    updateProduct,
    deleteProduct
} = require("../controllers/productControllers");

const router = express.Router();

router.post(
    "/",
    protect,
    authorize("admin"),
    createProduct
);
router.get("/", getProducts);
router.get("/:id", getProduct);
router.patch(
    "/:id",
    protect,
    authorize("admin"),
    updateProduct
);
router.delete(
    "/:id",
    protect,
    authorize("admin"),
    deleteProduct
);

module.exports = router;