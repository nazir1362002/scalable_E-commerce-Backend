import React from 'react';

export default function StatusBadge({ status = 'pending' }) {
  const normalized = (status || '').toLowerCase();

  const configs = {
    pending: {
      bg: 'var(--warning-bg)',
      color: 'var(--warning)',
      border: 'var(--warning-border)',
      label: 'Pending'
    },
    processing: {
      bg: '#eff6ff',
      color: '#1d4ed8',
      border: '#bfdbfe',
      label: 'Processing'
    },
    shipped: {
      bg: '#f3e8ff',
      color: '#6b21a8',
      border: '#e9d5ff',
      label: 'Shipped'
    },
    delivered: {
      bg: 'var(--success-bg)',
      color: 'var(--success)',
      border: 'var(--success-border)',
      label: 'Delivered'
    },
    cancelled: {
      bg: 'var(--danger-bg)',
      color: 'var(--danger)',
      border: 'var(--danger-border)',
      label: 'Cancelled'
    }
  };

  const current = configs[normalized] || {
    bg: 'var(--bg-muted)',
    color: 'var(--text-secondary)',
    border: 'var(--border-color)',
    label: status
  };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '0.2rem 0.6rem',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: '600',
        textTransform: 'capitalize',
        backgroundColor: current.bg,
        color: current.color,
        border: `1px solid ${current.border}`,
        letterSpacing: '0.025em',
        whiteSpace: 'nowrap'
      }}
    >
      {current.label}
    </span>
  );
}
