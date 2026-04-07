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

const Bookings = () => {
  const { lang, t } = useTranslation();
  const location = useLocation();
  const [bookings, setBookings] = useState([]);
  const [clients, setClients] = useState([]);
  const [packages, setPackages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary" style={{ width: 'fit-content' }}>
          <Plus size={20} />
          <span>{t('add_booking')}</span>
        </button>
      </header>

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
                  <td style={{ fontWeight: 600, textAlign: 'inherit' }}>${b.total_price}</td>
                  <td style={{ textAlign: 'inherit' }}><span className={`badge ${b.status === 'Confirmed' ? 'badge-success' : 'badge-warning'}`}>{t(b.status.toLowerCase())}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: lang === 'ar' ? 'flex-start' : 'flex-end' }}>
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

      <AnimatePresence>
        {isModalOpen && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
             <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="card" style={{ width: '90%', maxWidth: '500px', padding: '2rem', overflow: 'visible', margin: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{t('confirm_booking')}</h2>
                <button onClick={() => setIsModalOpen(false)} className="btn btn-ghost"><X size={20} /></button>
              </div>
              <CustomSelect label={t('select_client')} value={form.client_id} onChange={(val) => setForm({ ...form, client_id: val })} options={clients.map(c => ({ label: c.name, value: c.id }))} placeholder={t('select_client_placeholder')} />
              <CustomSelect label={t('select_package')} value={form.package_id} onChange={(val) => setForm({ ...form, package_id: val })} options={packages.map(p => ({ label: `${p.name} ($${p.price})`, value: p.id }))} placeholder={t('select_package_placeholder')} />
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
