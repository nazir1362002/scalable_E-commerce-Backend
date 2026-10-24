const express = require("express");
const protect = require("../middleware/authmiddleware");
const authorize = require("../middleware/roleMiddleware");
const upload = require("../middleware/uploadMiddleware");

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
    upload.single("image"),
    createProduct
);

router.get("/", getProducts);
router.get("/:id", getProduct);

router.patch(
    "/:id",
    protect,
    authorize("admin"),
    upload.single("image"),
    updateProduct
);

router.delete(
    "/:id",
    protect,
    authorize("admin"),
    deleteProduct
);

module.exports = router;
