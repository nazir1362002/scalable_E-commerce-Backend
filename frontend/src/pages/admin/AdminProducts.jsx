import React, { useState, useEffect } from 'react';
import { productsApi } from '../../api/products';
import Spinner from '../../components/Spinner';
import Alert from '../../components/Alert';
import './Admin.css';

const CATEGORIES = ['Electronics', 'Clothing', 'Books', 'Home', 'Sports', 'Beauty'];

const EMPTY_FORM = { name: '', description: '', price: '', category: '', stock: '', image: '' };

const toFormValues = (product) => ({
  name: product.name || '',
  description: product.description || '',
  price: product.price ?? '',
  category: product.category || '',
  stock: product.stock ?? '',
  image: product.image || '',
});

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [form, setForm]         = useState(EMPTY_FORM);
  const [creating, setCreating] = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');

  // Edit modal state
  const [editingProduct, setEditingProduct] = useState(null);
  const [editForm, setEditForm]     = useState(EMPTY_FORM);
  const [saving, setSaving]         = useState(false);
  const [modalError, setModalError] = useState('');

  // Delete state
  const [deletingId, setDeletingId] = useState(null);

  const loadProducts = () => {
    setLoading(true);
    productsApi.getAll({ limit: 50, sort: '-createdAt' })
      .then((res) => setProducts(res.data || []))
      .catch((err) => setError(err.message || 'Failed to load store products.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (Number(form.price) < 0 || Number(form.stock) < 0) {
      setError('Price and stock values cannot be negative.');
      return;
    }

    setCreating(true);
    try {
      await productsApi.create({
        name: form.name.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        category: form.category,
        stock: Number(form.stock),
        image: form.image.trim() || undefined,
      });
      setSuccess('Product successfully added to the catalog!');
      setForm(EMPTY_FORM);
      loadProducts();
    } catch (err) {
      setError(err.message || 'Failed to create product.');
    } finally {
      setCreating(false);
    }
  };

  // ---- Edit ----

  const openEdit = (product) => {
    setModalError('');
    setEditingProduct(product);
    setEditForm(toFormValues(product));
  };

  const closeEdit = () => {
    setEditingProduct(null);
    setModalError('');
  };

  const handleEditChange = (e) => {
    setEditForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setModalError('');

    if (Number(editForm.price) < 0 || Number(editForm.stock) < 0) {
      setModalError('Price and stock values cannot be negative.');
      return;
    }

    setSaving(true);
    try {
      await productsApi.update(editingProduct._id, {
        name: editForm.name.trim(),
        description: editForm.description.trim(),
        price: Number(editForm.price),
        category: editForm.category,
        stock: Number(editForm.stock),
        image: editForm.image.trim(),
      });
      setSuccess(`"${editForm.name.trim()}" was updated successfully.`);
      closeEdit();
      loadProducts();
    } catch (err) {
      setModalError(err.message || 'Failed to update product.');
    } finally {
      setSaving(false);
    }
  };

  // ---- Delete ----

  const handleDelete = async (product) => {
    const confirmed = window.confirm(
      `Remove "${product.name}" from the catalog? This can't be undone.`
    );
    if (!confirmed) return;

    setError('');
    setSuccess('');
    setDeletingId(product._id);
    try {
      await productsApi.remove(product._id);
      setSuccess(`"${product.name}" was removed from the catalog.`);
      setProducts((prev) => prev.filter((p) => p._id !== product._id));
    } catch (err) {
      setError(err.message || 'Failed to delete product.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Product Inventory Management</h1>
          <p className="admin-page-subtitle">Add, edit, or remove items in the catalog</p>
        </div>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

      {/* Creation Form */}
      <div className="admin-form-card">
        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1.25rem', color: 'var(--text-primary)' }}>
          Create New Product
        </h3>

        <form onSubmit={handleCreate}>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="prod-name">Product Name *</label>
              <input
                id="prod-name"
                name="name"
                type="text"
                className="form-input"
                placeholder="e.g. Wireless Ergonomic Mouse"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="prod-category">Category *</label>
              <select
                id="prod-category"
                name="category"
                className="form-select"
                value={form.category}
                onChange={handleChange}
                required
              >
                <option value="">Select category</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="prod-desc">Description *</label>
            <textarea
              id="prod-desc"
              name="description"
              className="form-textarea"
              placeholder="Provide a thorough overview of features..."
              value={form.description}
              onChange={handleChange}
              required
              rows={3}
            />
          </div>

          <div className="form-grid-3">
            <div className="form-group">
              <label className="form-label" htmlFor="prod-price">Price ($) *</label>
              <input
                id="prod-price"
                name="price"
                type="number"
                min="0"
                step="0.01"
                className="form-input"
                placeholder="29.99"
                value={form.price}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="prod-stock">Stock Qty *</label>
              <input
                id="prod-stock"
                name="stock"
                type="number"
                min="0"
                className="form-input"
                placeholder="50"
                value={form.stock}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="prod-image">Image URL (optional)</label>
              <input
                id="prod-image"
                name="image"
                type="url"
                className="form-input"
                placeholder="https://images.example.com/product.jpg"
                value={form.image}
                onChange={handleChange}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-accent"
            disabled={creating}
            id="admin-create-product"
          >
            {creating ? 'Saving product...' : 'Add product to store'}
          </button>
        </form>
      </div>

      {/* Existing Products List */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--text-primary)' }}>
          Current Products ({products.length})
        </h3>

        {loading ? (
          <Spinner text="Loading inventory table..." />
        ) : (
          <div className="table-container" style={{ border: 'none' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock Available</th>
                  <th>Date Added</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p._id}>
                    <td>
                      <strong style={{ fontSize: '0.875rem' }}>{p.name}</strong>
                      <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        ID: {p._id}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          backgroundColor: 'var(--bg-muted)',
                          padding: '0.2rem 0.5rem',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                        }}
                      >
                        {p.category}
                      </span>
                    </td>
                    <td style={{ fontWeight: '600' }}>${Number(p.price).toFixed(2)}</td>
                    <td style={{ fontWeight: '600', color: p.stock === 0 ? 'var(--danger)' : 'var(--text-primary)' }}>
                      {p.stock === 0 ? 'Out of stock (0)' : p.stock}
                    </td>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                      {new Date(p.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => openEdit(p)}
                          id={`edit-product-${p._id}`}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => handleDelete(p)}
                          disabled={deletingId === p._id}
                          id={`delete-product-${p._id}`}
                        >
                          {deletingId === p._id ? 'Removing...' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {products.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                      No inventory items found. Add your first product above.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingProduct && (
        <div className="modal-overlay" onClick={closeEdit}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ margin: 0 }}>Edit product</h3>
              <button type="button" className="modal-close-btn" onClick={closeEdit} aria-label="Close">
                ×
              </button>
            </div>

            {modalError && <Alert type="error" message={modalError} onClose={() => setModalError('')} />}

            <form onSubmit={handleUpdate}>
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="edit-name">Product Name *</label>
                  <input
                    id="edit-name"
                    name="name"
                    type="text"
                    className="form-input"
                    value={editForm.name}
                    onChange={handleEditChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="edit-category">Category *</label>
                  <select
                    id="edit-category"
                    name="category"
                    className="form-select"
                    value={editForm.category}
                    onChange={handleEditChange}
                    required
                  >
                    <option value="">Select category</option>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="edit-desc">Description *</label>
                <textarea
                  id="edit-desc"
                  name="description"
                  className="form-textarea"
                  value={editForm.description}
                  onChange={handleEditChange}
                  required
                  rows={3}
                />
              </div>

              <div className="form-grid-3">
                <div className="form-group">
                  <label className="form-label" htmlFor="edit-price">Price ($) *</label>
                  <input
                    id="edit-price"
                    name="price"
                    type="number"
                    min="0"
                    step="0.01"
                    className="form-input"
                    value={editForm.price}
                    onChange={handleEditChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="edit-stock">Stock Qty *</label>
                  <input
                    id="edit-stock"
                    name="stock"
                    type="number"
                    min="0"
                    className="form-input"
                    value={editForm.stock}
                    onChange={handleEditChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="edit-image">Image URL</label>
                  <input
                    id="edit-image"
                    name="image"
                    type="url"
                    className="form-input"
                    value={editForm.image}
                    onChange={handleEditChange}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={closeEdit} disabled={saving}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-accent" disabled={saving} id="admin-update-product">
                  {saving ? 'Saving changes...' : 'Save changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
