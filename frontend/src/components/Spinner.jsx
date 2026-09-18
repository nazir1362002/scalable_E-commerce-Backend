export default function Spinner({ text }) {
  return (
    <div className="spinner-container">
      <div style={{ textAlign: 'center' }}>
        <div className="spinner" />
        {text && <p style={{ marginTop: 16, color: 'var(--text-muted)', fontSize: '0.9rem' }}>{text}</p>}
      </div>
    </div>
  );
}
