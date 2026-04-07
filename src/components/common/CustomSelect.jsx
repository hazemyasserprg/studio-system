import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../../context/LanguageContext';

const CustomSelect = ({ options, value, onChange, placeholder = 'Select option...', label, openUp = false }) => {
  const { lang, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="input-group" style={{ position: 'relative' }} ref={containerRef}>
      {label && <label className="input-label">{label}</label>}
      
      <button
        type="button"
        className="input-field"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          textAlign: lang === 'ar' ? 'right' : 'left',
          width: '100%',
          marginBottom: 0
        }}
      >
        <span style={{ color: selectedOption ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown 
          size={18} 
          style={{ 
            transition: 'transform 0.2s', 
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            color: 'var(--text-secondary)'
          }} 
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.ul
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 5, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              [openUp ? 'bottom' : 'top']: '100%',
              left: 0,
              right: 0,
              zIndex: 3000,
              background: 'var(--bg-secondary)',
              backdropFilter: 'blur(16px)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              marginBottom: openUp ? '10px' : '0',
              marginTop: openUp ? '0' : '10px',
              padding: '0.5rem',
              boxShadow: 'var(--shadow-lg)',
              maxHeight: '250px',
              overflowY: 'auto',
              listStyle: 'none'
            }}
          >
            {options.map((option) => (
              <li
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'all 0.2s',
                  background: value === option.value ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                  color: value === option.value ? 'var(--accent)' : 'var(--text-primary)',
                  fontSize: '0.875rem',
                  fontWeight: value === option.value ? 600 : 400
                }}
                onMouseEnter={(e) => {
                  if (value !== option.value) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                }}
                onMouseLeave={(e) => {
                  if (value !== option.value) e.currentTarget.style.background = 'transparent';
                }}
              >
                <span>{option.label}</span>
                {value === option.value && <Check size={16} />}
              </li>
            ))}
            {options.length === 0 && (
              <li style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                {t('no_options')}
              </li>
            )}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CustomSelect;
