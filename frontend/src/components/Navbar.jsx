import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import './Navbar.css';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const menuRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setDropdownOpen(false);
    logout();
    navigate('/');
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/products');
    }
  };

  return (
    <header className="navbar-header">
      {/* Top Notification / Utility Bar */}
      <div className="utility-bar">
        <div className="utility-container">
          <span>Free express shipping on orders over $100, every day</span>
          <div className="utility-links">
            <span>Help &amp; support</span>
            {isAdmin && <Link to="/admin" className="utility-admin-link">Admin portal</Link>}
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="navbar-main">
        <div className="navbar-container">
          {/* Logo */}
          <Link to="/" className="navbar-brand">
            Storefront
          </Link>

          {/* Navigation Links */}
          <nav className="navbar-nav">
            <Link to="/" className="nav-item">Home</Link>
            <Link to="/products" className="nav-item">Shop Catalog</Link>
            {user && <Link to="/orders" className="nav-item" id="nav-orders">My Orders</Link>}
            {isAdmin && <Link to="/admin" className="nav-item admin-badge-link">Admin Dashboard</Link>}
          </nav>

          {/* Search Bar */}
          <form className="navbar-search" onSubmit={handleSearchSubmit}>
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <button type="submit" className="search-btn" aria-label="Search">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="7" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>
          </form>

          {/* User & Cart Actions */}
          <div className="navbar-actions">
            <Link to="/cart" className="cart-action-btn" id="nav-cart" aria-label="Shopping Cart">
              <span className="cart-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="21" r="1" />
                  <circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                </svg>
              </span>
              <span className="cart-label">Cart</span>
              {totalItems > 0 && <span className="cart-count-badge">{totalItems}</span>}
            </Link>

            {user ? (
              <div
                className={`user-profile-menu ${dropdownOpen ? 'active' : ''}`}
                ref={menuRef}
                onMouseEnter={() => setDropdownOpen(true)}
                onMouseLeave={() => setDropdownOpen(false)}
              >
                <button
                  className="user-avatar-btn"
                  onClick={() => setDropdownOpen((prev) => !prev)}
                  aria-expanded={dropdownOpen}
                >
                  <span className="avatar-circle">{user.name?.[0]?.toUpperCase()}</span>
                  <span className="user-firstname">{user.name?.split(' ')[0]}</span>
                  <span className="dropdown-caret">▾</span>
                </button>

                <div className={`user-dropdown-card ${dropdownOpen ? 'open' : ''}`}>
                  <div className="dropdown-user-info">
                    <p className="dropdown-name">{user.name}</p>
                    <p className="dropdown-email">{user.email}</p>
                    <span className="dropdown-role">{user.role?.toUpperCase()}</span>
                  </div>
                  <div className="dropdown-divider" />
                  <Link
                    to="/orders"
                    className="dropdown-link"
                    onClick={() => setDropdownOpen(false)}
                  >
                    Order History
                  </Link>
                  {isAdmin && (
                    <Link
                      to="/admin"
                      className="dropdown-link"
                      onClick={() => setDropdownOpen(false)}
                    >
                      Admin Dashboard
                    </Link>
                  )}
                  <div className="dropdown-divider" />
                  <button className="dropdown-logout-btn" onClick={handleLogout}>
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <div className="auth-buttons">
                <Link to="/login" className="btn btn-secondary btn-sm" id="nav-login">Sign In</Link>
                <Link to="/register" className="btn btn-primary btn-sm" id="nav-register">Create Account</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
