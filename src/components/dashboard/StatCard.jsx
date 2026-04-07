import { motion } from 'framer-motion';

const StatCard = ({ title, value, icon: Icon, color, trend, trendType = 'neutral' }) => {
  const trendColor = trendType === 'positive' ? 'var(--success)' : trendType === 'negative' ? 'var(--danger)' : 'var(--text-secondary)';

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="card"
      style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', width: '100%' }}
    >
      <div 
        style={{ 
          background: `${color}15`, 
          color: color, 
          padding: '1rem', 
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Icon size={24} />
      </div>

      <div>
        <h3 style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>{title}</h3>
        <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>{value}</p>
        
        {trend && (
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: trendColor, marginTop: '0.25rem', display: 'block' }}>
            {trendType === 'positive' ? '↑' : trendType === 'negative' ? '↓' : '→'} {trend}
          </span>
        )}
      </div>
    </motion.div>
  );
};

export default StatCard;
