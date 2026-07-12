export default function LoadingSpinner({ size = 40, text = 'Loading...' }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '64px 24px', gap: 16,
    }}>
      <div style={{
        width: size, height: size,
        borderRadius: '50%',
        border: `3px solid var(--border)`,
        borderTopColor: 'var(--accent-purple)',
        animation: 'spin-slow 0.8s linear infinite',
      }} />
      {text && (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>{text}</p>
      )}
      <style>{`
        @keyframes spin-slow {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
