/**
 * Reusable EmptyState component — shows when a page has no data.
 * Usage: <EmptyState icon={<Package size={40}/>} title="No packages yet" action={{ label: 'Add Package', onClick: () => ... }} />
 */
const EmptyState = ({ icon, title, subtitle, action }) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4rem 2rem',
    textAlign: 'center',
    gap: '1rem'
  }}>
    <div style={{
      width: '72px',
      height: '72px',
      background: 'var(--bg-surface)',
      borderRadius: '20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--text-secondary)',
      opacity: 0.6
    }}>
      {icon}
    </div>
    <div>
      <p style={{ fontWeight: 700, fontSize: '1.125rem', color: 'var(--text-primary)', marginBottom: '0.375rem' }}>
        {title}
      </p>
      {subtitle && (
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', maxWidth: '280px' }}>
          {subtitle}
        </p>
      )}
    </div>
    {action && (
      <button className="btn btn-primary" style={{ marginTop: '0.5rem' }} onClick={action.onClick}>
        {action.label}
      </button>
    )}
  </div>
);

export default EmptyState;
