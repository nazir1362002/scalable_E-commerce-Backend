import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import EmptyState from '../components/EmptyState';
import './Cart.css';

export default function Cart() {
  const { items, removeItem, updateQty, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="cart-page-container">
        <EmptyState
          title="Your Shopping Cart is Empty"
          description="You have no items in your cart. Explore our product catalog to discover high quality products."
          actionText="Browse Catalog Now"
          actionLink="/products"
        />
      </div>
    );
  }

  return (
    <div className="cart-page-container">
      <div className="cart-page-header">
        <h1 className="cart-title">Shopping Cart</h1>
        <span className="cart-item-count">
          ({items.length} unique item{items.length !== 1 ? 's' : ''})
        </span>
      </div>

      <div className="cart-layout-grid">
        {/* Cart Items Table / List */}
        <div className="cart-items-section">
          <div className="table-container">
            <table className="table cart-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Price</th>
                  <th>Quantity</th>
                  <th>Subtotal</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map(({ product, quantity }) => (
                  <tr key={product._id}>
                    <td>
                      <div className="cart-product-cell">
                        {product.image ? (
                          <img src={product.image} alt={product.name} className="cart-thumb" />
                        ) : (
                          <div className="cart-thumb-placeholder">🏷️</div>
                        )}
                        <div>
                          <strong className="cart-item-title">{product.name}</strong>
                          <span className="cart-item-category-tag">{product.category}</span>
                          <span className="cart-item-stock-notice">
                            {product.stock} in stock
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>${Number(product.price).toFixed(2)}</td>
                    <td>
                      <div className="qty-control-group">
                        <button
                          className="qty-btn"
                          onClick={() => updateQty(product._id, quantity - 1)}
                          id={`cart-dec-${product._id}`}
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <span className="qty-value">{quantity}</span>
                        <button
                          className="qty-btn"
                          onClick={() => updateQty(product._id, Math.min(quantity + 1, product.stock))}
                          disabled={quantity >= product.stock}
                          id={`cart-inc-${product._id}`}
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td style={{ fontWeight: '600' }}>
                      ${(product.price * quantity).toFixed(2)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => removeItem(product._id)}
                        id={`cart-remove-${product._id}`}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="cart-actions-row">
            <Link to="/products" className="btn btn-secondary btn-sm">
              Continue shopping
            </Link>
            <button
              className="btn btn-secondary btn-sm"
              onClick={clearCart}
              id="cart-clear"
            >
              Clear Cart
            </button>
          </div>
        </div>

        {/* Order Summary Sidebar */}
        <div className="cart-summary-card">
          <h3 className="summary-card-title">Order Summary</h3>

          <div className="summary-line">
            <span>Subtotal</span>
            <span>${totalPrice.toFixed(2)}</span>
          </div>
          <div className="summary-line">
            <span>Estimated Shipping</span>
            <span style={{ color: 'var(--success)', fontWeight: '600' }}>FREE</span>
          </div>
          <div className="summary-line">
            <span>Tax</span>
            <span>Calculated at checkout</span>
          </div>

          <div className="summary-divider" />

          <div className="summary-line summary-total-line">
            <span>Total</span>
            <span>${totalPrice.toFixed(2)}</span>
          </div>

          {user ? (
            <button
              className="btn btn-primary btn-lg summary-checkout-btn"
              onClick={() => navigate('/checkout')}
              id="cart-checkout"
            >
              Proceed to checkout
            </button>
          ) : (
            <div className="summary-auth-notice">
              <p>Please sign in to complete your purchase</p>
              <Link
                to="/login"
                className="btn btn-primary btn-lg"
                style={{ width: '100%' }}
                id="cart-login-link"
              >
                Sign In to Checkout
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
