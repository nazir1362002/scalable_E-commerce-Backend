import React from 'react';

export default function Alert({ type = 'error', message, onClose }) {
  if (!message) return null;

  const styles = {
    error: {
      bg: 'var(--danger-bg)',
      border: 'var(--danger-border)',
      color: 'var(--danger)',
      icon: '⚠️'
    },
    success: {
      bg: 'var(--success-bg)',
      border: 'var(--success-border)',
      color: 'var(--success)',
      icon: '✓'
    },
    warning: {
      bg: 'var(--warning-bg)',
      border: 'var(--warning-border)',
      color: 'var(--warning)',
      icon: '⚡'
    },
    info: {
      bg: 'var(--accent-light)',
      border: 'var(--border-color)',
      color: 'var(--accent)',
      icon: 'ℹ'
    }
  };

  const current = styles[type] || styles.error;

  return (
    <div
      style={{
        backgroundColor: current.bg,
        border: `1px solid ${current.border}`,
        color: current.color,
        padding: '0.875rem 1rem',
        borderRadius: 'var(--radius-md)',
        marginBottom: '1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '0.875rem',
        fontWeight: '500',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
        <span>{current.icon}</span>
        <span>{message}</span>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'inherit',
            cursor: 'pointer',
            fontSize: '1rem',
            lineHeight: 1,
          }}
        >
          ×
        </button>
      )}
    </div>
  );
}
