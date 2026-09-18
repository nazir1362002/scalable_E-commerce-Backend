import React, { useState, useEffect } from 'react';
import { ordersApi } from '../../api/orders';
import StatusBadge from '../../components/StatusBadge';
import Spinner from '../../components/Spinner';
import Alert from '../../components/Alert';
import EmptyState from '../../components/EmptyState';
import './Admin.css';

const STATUS_TRANSITIONS = {
  pending:    ['processing', 'cancelled'],
  processing: ['shipped'],
  shipped:    ['delivered'],
  delivered:  [],
  cancelled:  [],
};

export default function AdminOrders() {
  const [orders, setOrders]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState('');
  const [page, setPage]           = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [updatingId, setUpdatingId] = useState(null);

  const loadOrders = (p = 1) => {
    setLoading(true);
    setError('');
    ordersApi.getAllOrders({ page: p, limit: 15 })
      .then((res) => {
        setOrders(res.orders || []);
        setTotalPages(res.totalPages || 1);
      })
      .catch((err) => setError(err.message || 'Failed to fetch customer orders.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadOrders(page);
  }, [page]);

  const handleStatusUpdate = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    setError('');
    setSuccess('');
    try {
      await ordersApi.updateStatus(orderId, newStatus);
      setSuccess(`Order #${orderId.slice(-8).toUpperCase()} updated to ${newStatus}.`);
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, status: newStatus } : o))
      );
    } catch (err) {
      setError(err.message || `Failed to transition status to ${newStatus}.`);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Order Management & Fulfillment</h1>
          <p className="admin-page-subtitle">Inspect customer orders and update status state machine</p>
        </div>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

      {loading ? (
        <Spinner text="Fetching store orders..." />
      ) : orders.length === 0 ? (
        <EmptyState
          title="No Orders Found"
          description="Customer orders will appear here for administrative fulfillment processing."
        />
      ) : (
        <div className="card" style={{ padding: '1.5rem' }}>
          <div className="table-container" style={{ border: 'none' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Order Reference</th>
                  <th>Customer Information</th>
                  <th>Item Qty</th>
                  <th>Total Price</th>
                  <th>Date Placed</th>
                  <th>Current Status</th>
                  <th style={{ textAlign: 'right' }}>Allowed Status Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const allowedTransitions = STATUS_TRANSITIONS[order.status] || [];
                  const isBusy = updatingId === order._id;

                  return (
                    <tr key={order._id}>
                      <td>
                        <strong style={{ fontSize: '0.8125rem' }}>
                          #{order._id.slice(-8).toUpperCase()}
                        </strong>
                        <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          ID: {order._id}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: '500', fontSize: '0.875rem' }}>
                          {order.user?.name || 'Customer'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {order.user?.email || 'N/A'}
                        </div>
                      </td>
                      <td>{order.items?.length || 0}</td>
                      <td style={{ fontWeight: '600' }}>
                        ${Number(order.totalPrice).toFixed(2)}
                      </td>
                      <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                        {new Date(order.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                      <td>
                        <StatusBadge status={order.status} />
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {allowedTransitions.length > 0 ? (
                          <div style={{ display: 'inline-flex', gap: '0.375rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                            {allowedTransitions.map((nextStatus) => (
                              <button
                                key={nextStatus}
                                className={`btn ${nextStatus === 'cancelled' ? 'btn-outline-danger' : 'btn-secondary'} btn-sm`}
                                onClick={() => handleStatusUpdate(order._id, nextStatus)}
                                disabled={isBusy}
                                id={`admin-order-${order._id}-${nextStatus}`}
                              >
                                Mark {nextStatus}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
                            No actions available
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {totalPages > 1 && !loading && (
        <div className="pagination">
          <button
            className="btn btn-secondary btn-sm"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            id="admin-orders-prev"
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
            id="admin-orders-next"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
