const cloudinary = require("../config/cloudinary");

/**
 * Uploads an image file buffer to Cloudinary using upload_stream
 * @param {Buffer} fileBuffer - File buffer from multer memoryStorage
 * @param {string} folder - Target folder in Cloudinary
 * @returns {Promise<{ url: string, publicId: string }>}
 */
const uploadToCloudinary = (fileBuffer, folder = "products") => {
    return new Promise((resolve, reject) => {
        if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY) {
            return reject(new Error("Cloudinary configuration is missing"));
        }

        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder,
                resource_type: "image"
            },
            (error, result) => {
                if (error) {
                    return reject(new Error(`Cloudinary upload failed: ${error.message}`));
                }
                resolve({
                    url: result.secure_url,
                    publicId: result.public_id
                });
            }
        );

        uploadStream.end(fileBuffer);
    });
};

/**
 * Deletes an image from Cloudinary by its public ID
 * @param {string} publicId - Cloudinary public ID
 * @returns {Promise<object>}
 */
const deleteFromCloudinary = async (publicId) => {
    if (!publicId) return;

    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY) {
        console.warn("Cloudinary credentials missing, skipping Cloudinary image deletion.");
        return;
    }

    try {
        const result = await cloudinary.uploader.destroy(publicId);
        return result;
    } catch (error) {
        console.error(`Failed to delete image from Cloudinary (${publicId}):`, error.message);
    }
};

module.exports = {
    uploadToCloudinary,
    deleteFromCloudinary
};
