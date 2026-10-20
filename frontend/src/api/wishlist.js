import { api } from './client';

export const getWishlist = async (page = 1, limit = 10) => {
  return api.get(`/wishlist?page=${page}&limit=${limit}`);
};

export const addToWishlist = async (productId) => {
  return api.post('/wishlist', { productId });
};

export const removeFromWishlist = async (productId) => {
  return api.delete(`/wishlist/${productId}`);
};
