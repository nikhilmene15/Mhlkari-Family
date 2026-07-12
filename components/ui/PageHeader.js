export default function PageHeader({ icon, title, subtitle, badge, action }) {
  return (
    <div style={{ marginBottom: 40 }}>
      {badge && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          fontSize: '0.72rem', fontWeight: 700, letterSpacing: 3,
          textTransform: 'uppercase', color: 'var(--accent-purple-light)',
          marginBottom: 12,
        }}>
          <span style={{ display: 'block', width: 24, height: 2, background: 'var(--gradient-primary)', borderRadius: 1 }} />
          {badge}
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{
            fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)',
            fontWeight: 900, marginBottom: 8, lineHeight: 1.2,
            display: 'flex', alignItems: 'center', gap: 14,
          }}>
            {icon && (
              <span style={{
                width: 52, height: 52, borderRadius: 15,
                background: 'var(--gradient-primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.4rem', flexShrink: 0,
                boxShadow: '0 4px 16px rgba(123,47,255,0.35)',
              }}>
                {icon}
              </span>
            )}
            {title}
          </h1>
          {subtitle && (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0 }}>
              {subtitle}
            </p>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>
    </div>
  );
}
