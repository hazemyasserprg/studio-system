import { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  eachDayOfInterval,
  isToday
} from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { useTranslation } from '../../context/LanguageContext';

const CustomDatePicker = ({ value, onChange, label, placeholder = 'Select date...', openUp = false }) => {
  const { lang, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(value ? new Date(value) : new Date());
  
  const locale = lang === 'ar' ? ar : enUS;
  const containerRef = useRef(null);

  const selectedDate = value ? new Date(value) : null;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const renderHeader = () => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', padding: '0 0.5rem' }}>
      <button type="button" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="btn btn-ghost" style={{ padding: '0.25rem' }}>
        {lang === 'ar' ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </button>
      <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{format(currentMonth, 'MMMM yyyy', { locale })}</span>
      <button type="button" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="btn btn-ghost" style={{ padding: '0.25rem' }}>
        {lang === 'ar' ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
      </button>
    </div>
  );

  const renderDays = () => {
    const days = lang === 'ar' 
      ? ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س']
      : ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: '0.5rem' }}>
        {days.map(day => (
          <div key={day} style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            {day}
          </div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
        {calendarDays.map((day, i) => {
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const isCurrentMonth = isSameMonth(day, monthStart);
          
          return (
            <div
              key={i}
              onClick={() => {
                onChange(format(day, 'yyyy-MM-dd'));
                setIsOpen(false);
              }}
              style={{
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                borderRadius: '6px',
                fontSize: '0.8125rem',
                transition: 'all 0.2s',
                background: isSelected ? 'var(--accent)' : 'transparent',
                color: isSelected ? 'white' : !isCurrentMonth ? 'var(--text-mute)' : 'var(--text-primary)',
                fontWeight: isSelected || isToday(day) ? 600 : 400,
                border: isToday(day) && !isSelected ? '1px solid var(--accent)' : 'none'
              }}
              onMouseEnter={(e) => {
                if (!isSelected) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              }}
              onMouseLeave={(e) => {
                if (!isSelected) e.currentTarget.style.background = 'transparent';
              }}
            >
              {format(day, 'd')}
            </div>
          );
        })}
      </div>
    );
  };

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
        <span style={{ color: value ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
          {value ? format(new Date(value), 'PPP', { locale }) : placeholder}
        </span>
        <CalendarIcon size={18} style={{ color: 'var(--text-secondary)' }} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 5, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'absolute',
              [openUp ? 'bottom' : 'top']: '100%',
              left: 0,
              zIndex: 3000,
              background: 'var(--bg-secondary)',
              backdropFilter: 'blur(16px)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              marginBottom: openUp ? '10px' : '0',
              marginTop: openUp ? '0' : '10px',
              padding: '1rem',
              boxShadow: 'var(--shadow-lg)',
              width: '280px'
            }}
          >
            {renderHeader()}
            {renderDays()}
            {renderCells()}
            
            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'center' }}>
              <button 
                type="button" 
                className="btn btn-ghost" 
                style={{ fontSize: '0.75rem', color: 'var(--accent)' }}
                onClick={() => {
                  onChange(format(new Date(), 'yyyy-MM-dd'));
                  setIsOpen(false);
                }}
              >
                {lang === 'ar' ? 'اليوم' : 'Today'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CustomDatePicker;
