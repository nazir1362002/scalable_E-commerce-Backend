import React from 'react';
import { Link } from 'react-router-dom';

const linkStyle = { color: '#b7c0b6', fontSize: '0.875rem' };
const headingStyle = { fontSize: '0.9375rem', fontWeight: '600', marginBottom: '0.875rem', color: '#f2efe6' };

export default function Footer() {
  return (
    <footer
      style={{
        backgroundColor: 'var(--ink)',
        color: '#b7c0b6',
        padding: '3rem 0 1.5rem',
        marginTop: 'auto',
      }}
    >
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0 1.5rem',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '2.5rem',
            marginBottom: '2.5rem',
          }}
        >
          <div>
            <h4 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.875rem', color: '#f2efe6' }}>
              Storefront
            </h4>
            <p style={{ fontSize: '0.875rem', lineHeight: '1.6', maxWidth: '32ch' }}>
              A trusted destination for everyday goods, with fast checkout and dependable delivery.
            </p>
          </div>

          <div>
            <h5 style={headingStyle}>Shop</h5>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li style={{ marginBottom: '0.5rem' }}>
                <Link to="/products" style={linkStyle}>All products</Link>
              </li>
              <li style={{ marginBottom: '0.5rem' }}>
                <Link to="/cart" style={linkStyle}>Shopping cart</Link>
              </li>
              <li style={{ marginBottom: '0.5rem' }}>
                <Link to="/orders" style={linkStyle}>My orders</Link>
              </li>
            </ul>
          </div>

          <div>
            <h5 style={headingStyle}>Account &amp; support</h5>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li style={{ marginBottom: '0.5rem' }}>
                <Link to="/login" style={linkStyle}>Sign in</Link>
              </li>
              <li style={{ marginBottom: '0.5rem' }}>
                <Link to="/register" style={linkStyle}>Register an account</Link>
              </li>
              <li style={{ marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.875rem' }}>support@storefront.com</span>
              </li>
            </ul>
          </div>

          <div>
            <h5 style={headingStyle}>Payment &amp; guarantee</h5>
            <p style={{ fontSize: '0.8125rem', lineHeight: '1.5' }}>
              256-bit SSL encrypted checkout. Orders are processed instantly through our REST API.
            </p>
          </div>
        </div>

        <div
          style={{
            borderTop: '1px solid #384339',
            paddingTop: '1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <p style={{ fontSize: '0.8125rem', margin: 0 }}>
            © {new Date().getFullYear()} Storefront. All rights reserved.
          </p>
          <p style={{ fontSize: '0.8125rem', margin: 0 }}>
            Node.js, Express, MongoDB, JWT, Redis, BullMQ
          </p>
        </div>
      </div>
    </footer>
  );
}
