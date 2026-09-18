import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productsApi } from '../../api/products';
import { ordersApi } from '../../api/orders';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/StatusBadge';
import Spinner from '../../components/Spinner';
import Alert from '../../components/Alert';
import './Admin.css';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ products: 0, orders: 0, revenue: 0 });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      productsApi.getAll({ limit: 1 }),
      ordersApi.getAllOrders({ limit: 5 }),
    ])
      .then(([pRes, oRes]) => {
        const orders = oRes.orders || [];
        const revenue = orders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
        setStats({
          products: pRes.totalProducts || 0,
          orders: oRes.totalOrders || 0,
          revenue,
        });
        setRecentOrders(orders);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load administrative analytics.');
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Admin Dashboard</h1>
          <p className="admin-page-subtitle">Administrative control panel for user {user?.name}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link to="/admin/products" className="btn btn-primary btn-sm" id="admin-products-link">
            + Manage Products
          </Link>
          <Link to="/admin/orders" className="btn btn-secondary btn-sm" id="admin-orders-link">
            Manage Orders
          </Link>
        </div>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      {/* Analytics Cards */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-icon icon-pine">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 8v8a2 2 0 0 1-1 1.73l-7 4a2 2 0 0 1-2 0l-7-4A2 2 0 0 1 3 16V8a2 2 0 0 1 1-1.73l7-4a2 2 0 0 1 2 0l7 4A2 2 0 0 1 21 8Z" />
              <path d="m3.27 6.96 8.73 5.05 8.73-5.05M12 22.08V12" />
            </svg>
          </div>
          <div>
            <div className="admin-stat-value">{loading ? '...' : stats.products}</div>
            <div className="admin-stat-label">Total store products</div>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon icon-marigold">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
              <path d="M3 6h18M16 10a4 4 0 0 1-8 0" />
            </svg>
          </div>
          <div>
            <div className="admin-stat-value">{loading ? '...' : stats.orders}</div>
            <div className="admin-stat-label">Total customer orders</div>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon icon-brick">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <line x1="2" y1="10" x2="22" y2="10" />
            </svg>
          </div>
          <div>
            <div className="admin-stat-value">${loading ? '...' : stats.revenue.toFixed(2)}</div>
            <div className="admin-stat-label">Sample sales volume</div>
          </div>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
            Recent Customer Orders
          </h3>
          <Link to="/admin/orders" className="btn btn-secondary btn-sm">
            View all ({stats.orders})
          </Link>
        </div>

        {loading ? (
          <Spinner text="Loading recent orders..." />
        ) : recentOrders.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center', padding: '1.5rem 0' }}>
            No customer orders placed yet.
          </p>
        ) : (
          <div className="table-container" style={{ border: 'none' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Order Reference</th>
                  <th>Customer Info</th>
                  <th>Items</th>
                  <th>Total Amount</th>
                  <th>Fulfillment Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order._id}>
                    <td style={{ fontWeight: '600', fontSize: '0.8125rem' }}>
                      #{order._id.slice(-8).toUpperCase()}
                    </td>
                    <td>
                      <div style={{ fontWeight: '500' }}>{order.user?.name || 'Customer'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{order.user?.email}</div>
                    </td>
                    <td>{order.items?.length || 0} items</td>
                    <td style={{ fontWeight: '600' }}>
                      ${Number(order.totalPrice).toFixed(2)}
                    </td>
                    <td>
                      <StatusBadge status={order.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
