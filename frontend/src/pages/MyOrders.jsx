import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ordersApi } from '../api/orders';
import StatusBadge from '../components/StatusBadge';
import Spinner from '../components/Spinner';
import Alert from '../components/Alert';
import EmptyState from '../components/EmptyState';

export default function MyOrders() {
  const [orders, setOrders]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [page, setPage]           = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setLoading(true);
    setError('');
    ordersApi.getMyOrders({ page, limit: 10 })
      .then((res) => {
        setOrders(res.orders || []);
        setTotalPages(res.totalPages || 1);
      })
      .catch((err) => setError(err.message || 'Failed to load order history.'))
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: '700', margin: '0 0 0.25rem 0' }}>Order History</h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0 }}>
          View status and detail history for all your past purchases
        </p>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      {loading ? (
        <Spinner text="Fetching your order history..." />
      ) : orders.length === 0 ? (
        <EmptyState
          title="You Haven't Placed Any Orders Yet"
          description="Your completed orders will appear here once you place a purchase."
          actionText="Explore Store Catalog"
          actionLink="/products"
        />
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Order Reference</th>
                <th>Date Placed</th>
                <th>Items Count</th>
                <th>Total Price</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order._id} id={`order-item-${order._id}`}>
                  <td>
                    <strong style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                      #{order._id.slice(-8).toUpperCase()}
                    </strong>
                    <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      ID: {order._id}
                    </span>
                  </td>
                  <td>
                    {new Date(order.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>
                  <td>
                    {order.items?.length || 0} item{order.items?.length !== 1 ? 's' : ''}
                  </td>
                  <td style={{ fontWeight: '600' }}>
                    ${Number(order.totalPrice).toFixed(2)}
                  </td>
                  <td>
                    <StatusBadge status={order.status} />
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <Link
                      to={`/orders/${order._id}`}
                      className="btn btn-secondary btn-sm"
                    >
                      View details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && !loading && (
        <div className="pagination">
          <button
            className="btn btn-secondary btn-sm"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            id="orders-prev"
          >
            ← Previous
          </button>
          <span className="pagination-info">
            Page {page} of {totalPages}
          </span>
          <button
            className="btn btn-secondary btn-sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            id="orders-next"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
