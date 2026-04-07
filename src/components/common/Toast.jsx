import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, X, Info } from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';

const Toast = ({ message, type = 'success', onClose }) => {
  const { lang } = useTranslation();
  
  const icons = {
    success: <CheckCircle className="text-success" size={20} />,
    error: <AlertCircle className="text-danger" size={20} />,
    info: <Info className="text-accent" size={20} />
  };

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, x: lang === 'ar' ? -50 : 50, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9, x: lang === 'ar' ? -50 : 50 }}
          style={{
            position: 'fixed',
            top: '2rem',
            [lang === 'ar' ? 'left' : 'right']: '2rem',
            zIndex: 9999,
            padding: '1rem 1.5rem',
            background: 'var(--bg-secondary)',
            backdropFilter: 'blur(16px)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            minWidth: '300px',
            borderRight: lang !== 'ar' ? `4px solid var(--${type === 'error' ? 'danger' : type === 'info' ? 'accent' : 'success'})` : '1px solid var(--border)',
            borderLeft: lang === 'ar' ? `4px solid var(--${type === 'error' ? 'danger' : type === 'info' ? 'accent' : 'success'})` : '1px solid var(--border)',
          }}
        >
          {icons[type] || icons.success}
          <span style={{ fontSize: '0.875rem', fontWeight: 500, flex: 1 }}>{message}</span>
          <button 
            onClick={onClose}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'var(--text-secondary)', 
              cursor: 'pointer',
              padding: '0.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '6px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'}
            onMouseLeave={(e) => e.target.style.background = 'none'}
          >
            <X size={16} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Toast;
