const multer = require("multer");

// Use memory storage to avoid writing uploaded images permanently to local disk
const storage = multer.memoryStorage();

// Validate file type (JPEG, PNG, WebP)
const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];

    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        const error = new Error("Invalid file type. Only JPEG, PNG, and WebP images are allowed.");
        error.statusCode = 400;
        cb(error, false);
    }
};

const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5 MB max file size
    },
    fileFilter
});

module.exports = upload;
