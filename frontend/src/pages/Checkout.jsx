import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { ordersApi } from '../api/orders';
import Alert from '../components/Alert';
import './Checkout.css';

export default function Checkout() {
  const { items, totalPrice, clearCart } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  const handleOrder = async () => {
    setLoading(true);
    setError('');
    try {
      const orderItems = items.map(({ product, quantity }) => ({
        product: product._id,
        quantity,
      }));
      const res = await ordersApi.create({ items: orderItems });
      clearCart();
      navigate(`/orders/${res.order._id}`, { state: { freshOrder: true } });
    } catch (err) {
      setError(err.message || 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="checkout-page-container">
      <div className="checkout-page-header">
        <h1 className="checkout-title">Order Checkout</h1>
        <p className="checkout-subtitle">Review your items and confirm your order placement</p>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      <div className="checkout-grid">
        {/* Order Items Section */}
        <div className="checkout-section">
          <h2 className="section-card-title">Order Items ({items.length})</h2>
          
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Unit Price</th>
                  <th>Qty</th>
                  <th style={{ textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map(({ product, quantity }) => (
                  <tr key={product._id}>
                    <td>
                      <div className="checkout-product-item">
                        {product.image ? (
                          <img src={product.image} alt={product.name} className="checkout-thumb" />
                        ) : (
                          <div className="checkout-thumb-placeholder">🏷️</div>
                        )}
                        <div>
                          <strong style={{ fontSize: '0.875rem' }}>{product.name}</strong>
                          <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Category: {product.category}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>${Number(product.price).toFixed(2)}</td>
                    <td style={{ fontWeight: '600' }}>{quantity}</td>
                    <td style={{ textAlign: 'right', fontWeight: '600' }}>
                      ${(product.price * quantity).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payment Summary Sidebar */}
        <div className="checkout-summary-card">
          <h3 className="summary-card-title">Payment Summary</h3>

          <div className="summary-line">
            <span>Items Subtotal</span>
            <span>${totalPrice.toFixed(2)}</span>
          </div>
          <div className="summary-line">
            <span>Shipping & Handling</span>
            <span style={{ color: 'var(--success)', fontWeight: '600' }}>FREE</span>
          </div>
          <div className="summary-line">
            <span>Tax</span>
            <span>Included</span>
          </div>

          <div className="summary-divider" />

          <div className="summary-line summary-total-line">
            <span>Grand Total</span>
            <span>${totalPrice.toFixed(2)}</span>
          </div>

          <button
            className="btn btn-primary btn-lg checkout-submit-btn"
            onClick={handleOrder}
            disabled={loading}
            id="checkout-place-order"
          >
            {loading ? 'Processing Order...' : 'Confirm & Place Order'}
          </button>

          <p className="checkout-security-notice">
            🔒 Protected by 256-bit SSL encryption & atomic database transaction
          </p>
        </div>
      </div>
    </div>
  );
}
