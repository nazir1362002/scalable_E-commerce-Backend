import React, { useState, useEffect } from 'react';
import { getWishlist, removeFromWishlist } from '../api/wishlist';
import { useCart } from '../context/CartContext';
import { getImageUrl } from '../utils/image';
import Spinner from '../components/Spinner';
import EmptyState from '../components/EmptyState';
import Alert from '../components/Alert';
import './Wishlist.css';

export default function Wishlist() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionMsg, setActionMsg] = useState(null);
  const { addItem } = useCart();

  const fetchWishlist = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getWishlist();
      setItems(response.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load wishlist');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  const handleRemove = async (productId, productName) => {
    try {
      await removeFromWishlist(productId);
      setItems((prev) => prev.filter((item) => item.product._id !== productId));
      setActionMsg(`Removed ${productName} from wishlist`);
      setTimeout(() => setActionMsg(null), 3000);
    } catch (err) {
      setError(err.message || 'Failed to remove item');
    }
  };

  const handleMoveToCart = (product) => {
    addItem(product, 1);
    setActionMsg(`Added ${product.name} to cart`);
    setTimeout(() => setActionMsg(null), 3000);
  };

  if (loading) {
    return <Spinner text="Loading your wishlist..." />;
  }

  return (
    <div className="wishlist-container page-container">
      <div className="wishlist-header">
        <h1 className="page-title">My Wishlist</h1>
        <p className="page-subtitle">Save items you love and move them to cart anytime</p>
      </div>

      {actionMsg && <Alert type="success" message={actionMsg} onClose={() => setActionMsg(null)} />}
      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

      {items.length === 0 ? (
        <EmptyState
          title="Your wishlist is empty"
          description="Explore our catalog and save items you like to view them later!"
          actionText="Browse Catalog"
          actionLink="/products"
        />
      ) : (
        <div className="wishlist-grid">
          {items.map((item) => {
            const product = item.product;
            if (!product) return null;

            const imageUrl = getImageUrl(product.image);

            return (
              <div className="wishlist-card" key={item._id}>
                <div className="wishlist-image-wrapper">
                  {imageUrl ? (
                    <img src={imageUrl} alt={product.name} className="wishlist-img" />
                  ) : (
                    <div className="wishlist-placeholder">
                      <span>{product.category}</span>
                    </div>
                  )}
                  <span className="wishlist-category-badge">{product.category}</span>
                </div>

                <div className="wishlist-body">
                  <h3 className="wishlist-title">{product.name}</h3>
                  <p className="wishlist-price">${Number(product.price).toFixed(2)}</p>

                  <div className="wishlist-actions">
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleMoveToCart(product)}
                      disabled={product.stock === 0}
                    >
                      {product.stock > 0 ? 'Move to Cart' : 'Out of Stock'}
                    </button>
                    <button
                      className="btn btn-secondary btn-sm remove-btn"
                      onClick={() => handleRemove(product._id, product.name)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
