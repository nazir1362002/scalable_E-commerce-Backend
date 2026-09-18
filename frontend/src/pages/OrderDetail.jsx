import React, { useState, useEffect } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { ordersApi } from '../api/orders';
import StatusBadge from '../components/StatusBadge';
import Spinner from '../components/Spinner';
import Alert from '../components/Alert';

const STATUS_PROGRESSION = ['pending', 'processing', 'shipped', 'delivered'];

export default function OrderDetail() {
  const { id } = useParams();
  const location = useLocation();
  const freshOrder = location.state?.freshOrder;

  const [order, setOrder]           = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError('');
    ordersApi.getById(id)
      .then((res) => setOrder(res.order))
      .catch((err) => setError(err.message || 'Failed to load order details.'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this pending order?')) return;
    setCancelling(true);
    setError('');
    try {
      const res = await ordersApi.cancel(id);
      setOrder(res.order);
    } catch (err) {
      setError(err.message || 'Unable to cancel order.');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return <Spinner text="Loading order details..." />;

  if (error && !order) {
    return (
      <div style={{ padding: '2rem 0' }}>
        <Alert type="error" message={error} />
        <Link to="/orders" className="btn btn-secondary btn-sm">
          Back to order history
        </Link>
      </div>
    );
  }

  if (!order) return null;

  const activeStatusIndex = STATUS_PROGRESSION.indexOf(order.status);

  return (
    <div style={{ maxWidth: '840px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Success banner if redirected from checkout */}
      {freshOrder && (
        <Alert
          type="success"
          message="Thank you! Your order has been placed successfully. Below are your order details."
        />
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
        <div>
          <Link to="/orders" style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', display: 'inline-block', marginBottom: '0.5rem' }}>
            Back to orders
          </Link>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', margin: '0 0 0.25rem 0' }}>
            Order #{order._id.slice(-8).toUpperCase()}
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0 }}>
            Placed on {new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
          <StatusBadge status={order.status} />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {order._id}</span>
        </div>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      {/* Status Progress Bar */}
      {order.status !== 'cancelled' ? (
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
            Fulfillment Progress
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
            {STATUS_PROGRESSION.map((statusName, idx) => {
              const isCompleted = activeStatusIndex > idx;
              const isCurrent = activeStatusIndex === idx;

              return (
                <div
                  key={statusName}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    flex: 1,
                    zIndex: 2,
                    position: 'relative',
                  }}
                >
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: isCompleted || isCurrent ? 'var(--primary)' : 'var(--bg-muted)',
                      color: isCompleted || isCurrent ? '#ffffff' : 'var(--text-muted)',
                      border: `2px solid ${isCompleted || isCurrent ? 'var(--primary)' : 'var(--border-dark)'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: '700',
                    }}
                  >
                    {isCompleted ? '✓' : idx + 1}
                  </div>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: isCurrent ? '700' : '500',
                      color: isCurrent ? 'var(--text-primary)' : 'var(--text-muted)',
                      marginTop: '0.5rem',
                      textTransform: 'capitalize',
                    }}
                  >
                    {statusName}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <Alert
          type="warning"
          message="This order has been cancelled and cannot be modified."
        />
      )}

      {/* Itemized Order Details */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--text-primary)' }}>
          Items Purchased
        </h3>
        <div className="table-container" style={{ border: 'none' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Product Description</th>
                <th>Price Each</th>
                <th>Quantity</th>
                <th style={{ textAlign: 'right' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items?.map((item) => (
                <tr key={item._id || item.product?._id}>
                  <td>
                    <strong style={{ fontSize: '0.875rem' }}>{item.product?.name || 'Product'}</strong>
                  </td>
                  <td>${Number(item.price).toFixed(2)}</td>
                  <td>{item.quantity}</td>
                  <td style={{ textAlign: 'right', fontWeight: '600' }}>
                    ${(item.price * item.quantity).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1px solid var(--border-color)',
            paddingTop: '1rem',
            marginTop: '1rem',
          }}
        >
          <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Payment Method: Standard Card / JWT Authorized
          </span>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginRight: '1rem' }}>
              Order Total:
            </span>
            <strong style={{ fontSize: '1.25rem', color: 'var(--text-primary)' }}>
              ${Number(order.totalPrice).toFixed(2)}
            </strong>
          </div>
        </div>
      </div>

      {/* Cancellation Action */}
      {order.status === 'pending' && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            className="btn btn-outline-danger"
            onClick={handleCancel}
            disabled={cancelling}
            id="order-cancel-btn"
          >
            {cancelling ? 'Processing Cancellation...' : 'Cancel Pending Order'}
          </button>
        </div>
      )}
    </div>
  );
}
