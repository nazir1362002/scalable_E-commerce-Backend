/**
 * Safely extracts the image URL from a product's image field.
 * Handles both Cloudinary object format ({ url, publicId }) and legacy string URLs.
 * @param {string | object | null | undefined} image
 * @returns {string | null}
 */
export const getImageUrl = (image) => {
  if (!image) return null;
  if (typeof image === 'string') return image.trim() || null;
  if (typeof image === 'object' && image.url && typeof image.url === 'string') {
    return image.url.trim() || null;
  }
  return null;
};
