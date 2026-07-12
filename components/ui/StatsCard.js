export default function StatsCard({ icon, value, label, gradient = 'var(--gradient-primary)', change, changeLabel }) {
  return (
    <div className="card-custom" style={{ padding: '24px 20px' }}>
      <div style={{
        width: 48, height: 48, borderRadius: 14,
        background: gradient, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        fontSize: '1.4rem', marginBottom: 16,
        boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
      }}>
        {icon}
      </div>
      <div style={{ fontSize: '2rem', fontWeight: 900, lineHeight: 1, color: 'var(--text-primary)', marginBottom: 4 }}>
        {value}
      </div>
      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
        {label}
      </div>
      {change !== undefined && (
        <div style={{
          marginTop: 8, fontSize: '0.75rem', fontWeight: 600,
          color: change >= 0 ? 'var(--accent-green)' : 'var(--accent-red)',
          display: 'flex', alignItems: 'center', gap: 4,
        }}>
          {change >= 0 ? '↑' : '↓'} {Math.abs(change)} {changeLabel}
        </div>
      )}
    </div>
  );
}
