import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import './ProductCard.css';

export default function ProductCard({ product }) {
  const { addItem, items } = useCart();
  const [added, setAdded] = useState(false);

  // Find existing cart quantity for stock check
  const inCartItem = items.find((i) => i.product._id === product._id);
  const cartQty = inCartItem ? inCartItem.quantity : 0;
  const isMaxStock = cartQty >= product.stock;

  const handleAdd = () => {
    if (isMaxStock || product.stock === 0) return;
    addItem(product, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="product-card">
      {/* Product Image / Placeholder */}
      <div className="product-card-image-wrapper">
        {product.image ? (
          <img src={product.image} alt={product.name} className="product-card-img" />
        ) : (
          <div className="product-card-placeholder">
            <svg className="placeholder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.59 13.41 11 3.83A2 2 0 0 0 9.59 3.24L4 3a1 1 0 0 0-1 1l.24 5.59a2 2 0 0 0 .59 1.41l9.58 9.59a2 2 0 0 0 2.83 0l4.35-4.35a2 2 0 0 0 0-2.83Z" />
              <circle cx="8.5" cy="8.5" r="1.5" />
            </svg>
            <span className="placeholder-brand">{product.category}</span>
          </div>
        )}
        <span className="product-card-category-badge">{product.category}</span>
        {product.stock === 0 && (
          <div className="product-card-out-of-stock">Sold Out</div>
        )}
      </div>

      {/* Product Info */}
      <div className="product-card-body">
        <h3 className="product-card-title" title={product.name}>
          {product.name}
        </h3>
        <p className="product-card-description">
          {product.description || 'High quality item from our collection.'}
        </p>

        <div className="product-card-price-row">
          <span className="product-card-price">${Number(product.price).toFixed(2)}</span>
          <span className={`product-card-stock-label ${product.stock < 5 ? 'low-stock' : ''}`}>
            {product.stock === 0
              ? 'Out of stock'
              : product.stock < 5
              ? `Only ${product.stock} left`
              : `${product.stock} in stock`}
          </span>
        </div>

        <button
          className={`btn ${added ? 'btn-secondary' : 'btn-primary'} btn-sm product-card-action-btn`}
          onClick={handleAdd}
          disabled={product.stock === 0 || isMaxStock}
          id={`add-to-cart-${product._id}`}
        >
          {added
            ? '✓ Added to Cart'
            : isMaxStock
            ? 'Max Stock in Cart'
            : product.stock === 0
            ? 'Out of Stock'
            : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
}
