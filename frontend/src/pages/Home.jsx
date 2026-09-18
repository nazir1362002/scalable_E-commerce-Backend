import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productsApi } from '../api/products';
import ProductCard from '../components/ProductCard';
import Spinner from '../components/Spinner';
import EmptyState from '../components/EmptyState';
import './Home.css';

const CATEGORIES = ['Electronics', 'Clothing', 'Books', 'Home', 'Sports', 'Beauty'];

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [activeCategory, setActiveCategory] = useState(null);

  useEffect(() => {
    setLoading(true);
    productsApi.getAll({ limit: 8, sort: '-createdAt', ...(activeCategory ? { category: activeCategory } : {}) })
      .then((res) => setProducts(res.data || []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [activeCategory]);

  return (
    <div className="home-container">
      {/* ── HERO BANNER ── */}
      <section className="home-hero">
        <div className="home-hero-content">
          <h1 className="home-hero-title">
            Good goods, kept in stock and sent your way.
          </h1>
          <p className="home-hero-description">
            A tightly curated catalog of everyday essentials, electronics, apparel
            and home items — with live stock counts, so what you see is what ships.
          </p>
          <div className="home-hero-actions">
            <Link to="/products" className="btn btn-accent btn-lg" id="hero-shop-now">
              Shop the catalog
            </Link>
            <Link to="/register" className="btn btn-secondary btn-lg" id="hero-join">
              Create an account
            </Link>
          </div>
        </div>
        <div className="home-hero-panel">
          <ul className="hero-panel-list">
            <li>
              <strong>Live inventory</strong>
              <span>Stock counts update the moment an order is placed</span>
            </li>
            <li>
              <strong>Tracked orders</strong>
              <span>Follow every order from checkout to delivery</span>
            </li>
            <li>
              <strong>Secure checkout</strong>
              <span>Authenticated, encrypted from cart to confirmation</span>
            </li>
          </ul>
        </div>
      </section>

      {/* ── CATEGORY BAR ── */}
      <section className="home-section">
        <div className="section-header">
          <div>
            <h2 className="section-title">Shop by Category</h2>
            <p className="section-subtitle">Select a category to filter products</p>
          </div>
        </div>

        <div className="category-pills-bar">
          <button
            className={`category-pill ${activeCategory === null ? 'active' : ''}`}
            onClick={() => setActiveCategory(null)}
            id="category-all"
          >
            All Products
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={`category-pill ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
              id={`category-${cat.toLowerCase()}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* ── FEATURED PRODUCTS ── */}
      <section className="home-section" style={{ paddingTop: 0 }}>
        <div className="section-header">
          <div>
            <h2 className="section-title">
              {activeCategory ? activeCategory : 'Featured'} Items
            </h2>
            <p className="section-subtitle">Showing latest items in store</p>
          </div>
          <Link to="/products" className="btn btn-secondary btn-sm">
            View all products ({products.length})
          </Link>
        </div>

        {loading ? (
          <Spinner text="Loading store products..." />
        ) : products.length === 0 ? (
          <EmptyState
            title="No items found in this category"
            description="Try selecting another category or view all products in the catalog."
            actionText="View All Products"
            actionLink="/products"
          />
        ) : (
          <div className="home-products-grid">
            {products.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
