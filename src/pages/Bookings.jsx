import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Calendar, Clock, User, Package as PkgIcon, X, Loader2, Trash2 } from 'lucide-react';
import { supabase } from '../utils/supabase/client';
import Toast from '../components/common/Toast';
import CustomSelect from '../components/common/CustomSelect';
import CustomDatePicker from '../components/common/CustomDatePicker';
import ConfirmModal from '../components/common/ConfirmModal';
import { useTranslation } from '../context/LanguageContext';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  addDays, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths 
} from 'date-fns';

const Bookings = () => {
  const { lang, t } = useTranslation();
  const location = useLocation();
  const [bookings, setBookings] = useState([]);
  const [clients, setClients] = useState([]);
  const [packages, setPackages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState('calendar'); // Default to calendar
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysOfWeek = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  
  const calendarDays = (() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    const startDate = startOfWeek(start);
    const endDate = endOfWeek(end);
    
    const days = [];
    let day = startDate;
    while (day <= endDate) {
      days.push(day);
      day = addDays(day, 1);
    }
    return days;
  })();

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  // UI State
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [form, setForm] = useState({ client_id: '', package_id: '', event_date: '', status: 'Confirmed' });

  // Animation variants
  const pageVariants = {
    initial: { opacity: 0, x: lang === 'ar' ? 20 : -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: lang === 'ar' ? -20 : 20 }
  };

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    const { data: bData } = await supabase.from('bookings').select('*, clients(name, phone), packages(name, price)').order('event_date', { ascending: true });
    const { data: cData } = await supabase.from('clients').select('id, name');
    const { data: pData } = await supabase.from('packages').select('id, name, price');

    setBookings(bData || []);
    setClients(cData || []);
    setPackages(pData || []);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    if (location.state?.openModal) {
      setIsModalOpen(true);
    }
  }, [fetchData, location.state]);

  const handleCreate = async () => {
    if (!form.client_id || !form.package_id || !form.event_date) return;
    const pkg = packages.find(p => p.id === form.package_id);
    const { data, error } = await supabase.from('bookings').insert([{ ...form, total_price: pkg?.price || 0 }]).select('*, clients(name, phone), packages(name, price)');

    if (!error) {
      setBookings([...bookings, data[0]]);
      setToast({ message: t('booking_created'), type: 'success' });
      setIsModalOpen(false);
      setForm({ client_id: '', package_id: '', event_date: '', status: 'Confirmed' });
    }
    setTimeout(() => setToast({ message: '', type: 'success' }), 3000);
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    const { error } = await supabase.from('bookings').delete().eq('id', deletingId);
    if (!error) {
      setBookings(bookings.filter(b => b.id !== deletingId));
      setToast({ message: t('booking_deleted'), type: 'info' });
    }
    setIsConfirmOpen(false);
    setDeletingId(null);
    setTimeout(() => setToast({ message: '', type: 'success' }), 3000);
  };

  if (isLoading) return <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Loader2 className="animate-spin" size={32} color="var(--accent)" /></div>;

  return (
    <motion.div 
      variants={pageVariants}
      initial="initial" 
      animate="animate" 
      exit="exit" 
      transition={{ duration: 0.4 }}
      className="bookings-page"
    >
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />
      <ConfirmModal isOpen={isConfirmOpen} title={t('delete_confirm_title')} message={t('delete_confirm_msg')} onConfirm={handleDelete} onCancel={() => setIsConfirmOpen(false)} />

      <header className="flex-between-responsive" style={{ marginBottom: '2rem', gap: '1.5rem' }}>
        <div style={{ flex: 1 }}>
          <h1 className="h1">{t('bookings_title')}</h1>
          <p className="text-mute">{t('bookings_subtitle')}</p>
        </div>
        <div className="flex-wrap" style={{ gap: '0.75rem' }}>
          <div className="card" style={{ padding: '0.25rem', display: 'flex', gap: '0.25rem', marginBottom: 0 }}>
            <button 
              onClick={() => setViewMode('calendar')} 
              className={`btn ${viewMode === 'calendar' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
            >
              {t('calendar_view')}
            </button>
            <button 
              onClick={() => setViewMode('list')} 
              className={`btn ${viewMode === 'list' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
            >
              {t('list_view')}
            </button>
          </div>
          <button onClick={() => setIsModalOpen(true)} className="btn btn-primary" style={{ width: 'fit-content' }}>
            <Plus size={20} />
            <span>{t('add_booking')}</span>
          </button>
        </div>
      </header>

      {viewMode === 'list' ? (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="flex-between" style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>{t('all_sessions')}</h3>
            <div className="badge badge-accent">{bookings.length} {t('sessions')}</div>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>{t('client')}</th>
                  <th>{t('package')}</th>
                  <th>{t('event_date')}</th>
                  <th>{t('amount')}</th>
                  <th>{t('status')}</th>
                  <th style={{ textAlign: lang === 'ar' ? 'left' : 'right' }}>{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.id}>
                    <td style={{ textAlign: 'inherit' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'inherit' }}>
                        <div style={{ background: 'var(--bg-surface)', padding: '0.5rem', borderRadius: '8px', color: 'var(--accent)' }}><User size={16} /></div>
                        <div style={{ textAlign: 'inherit' }}><p style={{ fontWeight: 600 }}>{b.clients?.name}</p><p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{b.clients?.phone}</p></div>
                      </div>
                    </td>
                    <td style={{ textAlign: 'inherit' }}><div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'inherit' }}><PkgIcon size={14} className="text-secondary" /><span>{b.packages?.name}</span></div></td>
                    <td style={{ textAlign: 'inherit' }}><div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'inherit' }}><Clock size={14} className="text-secondary" /><span>{new Date(b.event_date).toLocaleDateString()}</span></div></td>
                    <td style={{ fontWeight: 600, textAlign: 'inherit' }}>{t('currency')} {b.total_price}</td>
                    <td style={{ textAlign: 'inherit' }}><span className={`badge ${b.status === 'Confirmed' ? 'badge-success' : 'badge-warning'}`}>{t(b.status.toLowerCase())}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button onClick={() => { setDeletingId(b.id); setIsConfirmOpen(true); }} className="btn btn-ghost" style={{ padding: '0.5rem', color: 'var(--danger)' }}><Trash2 size={18} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {bookings.length === 0 && <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>{t('no_events')}</div>}
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: '1.5rem' }}>
          <div className="flex-between" style={{ marginBottom: '2rem' }}>
            <h2 className="h2" style={{ marginBottom: 0 }}>{format(currentDate, 'MMMM yyyy')}</h2>
            <div className="flex-wrap" style={{ gap: '0.5rem' }}>
              <button onClick={prevMonth} className="btn btn-ghost" style={{ padding: '0.5rem' }}>&larr; {t('prev_month')}</button>
              <button 
                onClick={() => setCurrentDate(new Date())} 
                className="btn btn-ghost" 
                style={{ fontSize: '0.875rem' }}
              >
                Today
              </button>
              <button onClick={nextMonth} className="btn btn-ghost" style={{ padding: '0.5rem' }}>{t('next_month')} &rarr;</button>
            </div>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(7, 1fr)', 
            border: '1px solid var(--border)',
            borderRadius: '12px',
            overflow: 'hidden'
          }}>
            {/* Days of week */}
            {daysOfWeek.map(day => (
              <div key={day} style={{ 
                padding: '1rem', 
                textAlign: 'center', 
                fontWeight: 700, 
                fontSize: '0.75rem', 
                textTransform: 'uppercase',
                background: 'var(--bg-surface)',
                borderBottom: '1px solid var(--border)',
                color: 'var(--text-secondary)'
              }}>
                {t(day)}
              </div>
            ))}

            {/* Calendar grid */}
            {calendarDays.map((day, i) => {
              const dayBookings = bookings.filter(b => isSameDay(new Date(b.event_date), day));
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isToday = isSameDay(day, new Date());

              return (
                <div key={i} style={{ 
                  minHeight: '120px', 
                  padding: '0.75rem', 
                  borderRight: (i + 1) % 7 !== 0 ? '1px solid var(--border)' : 'none',
                  borderBottom: '1px solid var(--border)',
                  background: isCurrentMonth ? 'transparent' : 'rgba(0,0,0,0.02)',
                  opacity: isCurrentMonth ? 1 : 0.4,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem'
                }}>
                  <div style={{ 
                    fontSize: '0.875rem', 
                    fontWeight: isToday ? 800 : 500,
                    color: isToday ? 'var(--accent)' : 'inherit',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span>{format(day, 'd')}</span>
                    {isToday && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent)' }}></div>}
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    {dayBookings.map(b => (
                      <div 
                        key={b.id} 
                        style={{ 
                          fontSize: '0.7rem', 
                          padding: '0.25rem 0.5rem', 
                          background: 'var(--accent-light)', 
                          color: 'var(--accent)',
                          borderRadius: '4px',
                          borderLeft: '3px solid var(--accent)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          cursor: 'pointer'
                        }}
                        title={`${b.clients?.name} - ${b.packages?.name}`}
                      >
                        {b.clients?.name}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <AnimatePresence>
        {isModalOpen && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
             <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="card" style={{ width: '90%', maxWidth: '500px', padding: '2rem', overflow: 'visible', margin: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{t('confirm_booking')}</h2>
                <button onClick={() => setIsModalOpen(false)} className="btn btn-ghost"><X size={20} /></button>
              </div>
              <CustomSelect label={t('select_client')} value={form.client_id} onChange={(val) => setForm({ ...form, client_id: val })} options={clients.map(c => ({ label: c.name, value: c.id }))} placeholder={t('select_client_placeholder')} />
              <CustomSelect label={t('select_package')} value={form.package_id} onChange={(val) => setForm({ ...form, package_id: val })} options={packages.map(p => ({ label: `${p.name} (${t('currency')} ${p.price})`, value: p.id }))} placeholder={t('select_package_placeholder')} />
              <CustomDatePicker label={t('event_date')} value={form.event_date} onChange={(val) => setForm({ ...form, event_date: val })} openUp={true} />
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button onClick={() => setIsModalOpen(false)} className="btn btn-ghost" style={{ flex: 1 }}>{t('cancel')}</button>
                <button onClick={handleCreate} className="btn btn-primary" style={{ flex: 1 }}>{t('add_booking')}</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Bookings;
