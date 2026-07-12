export default function EmptyState({ icon = '📭', title, description, action }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{typeof icon === 'string' ? icon : <span style={{ fontSize: '3rem' }}>{icon}</span>}</div>
      {title && <h3>{title}</h3>}
      {description && <p>{description}</p>}
      {action && <div>{action}</div>}
    </div>
  );
}
