import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Phone, Calendar, UserPlus, X, Edit2, Trash2, Loader2 } from 'lucide-react';
import { supabase } from '../utils/supabase/client';
import Toast from '../components/common/Toast';
import ConfirmModal from '../components/common/ConfirmModal';
import Skeleton from '../components/common/Skeleton';
import useDebounce from '../hooks/useDebounce';
import CustomSelect from '../components/common/CustomSelect';
import { useTranslation } from '../context/LanguageContext';

const Clients = () => {
  const { lang, t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const debouncedSearch = useDebounce(searchTerm, 300);

  // UI State
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Client Form State
  const [clientForm, setClientForm] = useState({ name: '', phone: '', status: 'Lead' });

  // Animation variants
  const pageVariants = {
    initial: { opacity: 0, x: lang === 'ar' ? 20 : -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: lang === 'ar' ? -20 : 20 }
  };

  const modalVariants = {
    initial: { scale: 0.95, opacity: 0, y: 20 },
    animate: { scale: 1, opacity: 1, y: 0 },
    exit: { scale: 0.95, opacity: 0, y: 20 }
  };

  const fetchClients = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error) {
      setClients(data);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const handleOpenModal = (client = null) => {
    if (client) {
      setEditingId(client.id);
      setClientForm({ name: client.name, phone: client.phone || '', status: client.status });
    } else {
      setEditingId(null);
      setClientForm({ name: '', phone: '', status: 'Lead' });
    }
    setIsModalOpen(true);
  };

  const handleSaveClient = async () => {
    if (!clientForm.name) return;

    if (editingId) {
      const { data, error } = await supabase.from('clients').update(clientForm).eq('id', editingId).select();
      if (!error) {
        setClients(clients.map(c => c.id === editingId ? data[0] : c));
        setToast({ message: t('client_updated'), type: 'success' });
      }
    } else {
      const { data, error } = await supabase.from('clients').insert([clientForm]).select();
      if (!error) {
        setClients([data[0], ...clients]);
        setToast({ message: t('client_added'), type: 'success' });
      }
    }
    setIsModalOpen(false);
    setTimeout(() => setToast({ message: '', type: 'success' }), 3000);
  };

  const onConfirmDelete = async () => {
    if (!deletingId) return;
    const { error } = await supabase.from('clients').delete().eq('id', deletingId);
    if (!error) {
      setClients(clients.filter(c => c.id !== deletingId));
      setToast({ message: t('client_deleted'), type: 'info' });
    }
    setIsConfirmOpen(false);
    setDeletingId(null);
    setTimeout(() => setToast({ message: '', type: 'success' }), 3000);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Booked': return 'badge-accent';
      case 'Completed': return 'badge-success';
      case 'Lead': return 'badge-warning';
      case 'Cancelled': return 'badge-danger';
      default: return '';
    }
  };

  const filteredClients = clients.filter(client => {
    const name = client.name || '';
    const phone = client.phone || '';
    const matchesSearch = name.toLowerCase().includes(debouncedSearch.toLowerCase()) || phone.includes(debouncedSearch);
    const matchesStatus = statusFilter === 'All Statuses' || client.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <motion.div 
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.4 }}
      className="clients-page"
    >
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, message: '' })} />
      <ConfirmModal
        isOpen={isConfirmOpen}
        title={t('delete_confirm_title')}
        message={t('delete_confirm_msg')}
        onConfirm={onConfirmDelete}
        onCancel={() => setIsConfirmOpen(false)}
      />

      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>{t('clients_title')}</h1>
          <p style={{ color: 'var(--text-secondary)' }}>{t('clients_subtitle')}</p>
        </div>
        <button onClick={() => handleOpenModal()} className="btn btn-primary">
          <UserPlus size={20} />
          <span>{t('add_client')}</span>
        </button>
      </header>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', gap: '1rem' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', [lang === 'ar' ? 'left' : 'right']: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input
              type="text"
              placeholder={t('search')}
              className="input-field"
              style={{ paddingInlineStart: lang === 'ar' ? '1rem' : '2.5rem', paddingInlineEnd: lang === 'ar' ? '2.5rem' : '1rem', marginBottom: 0 }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div style={{ width: '200px' }}>
            <CustomSelect 
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { label: t('all_statuses'), value: 'All Statuses' },
                { label: t('lead'), value: 'Lead' },
                { label: t('booked'), value: 'Booked' },
                { label: t('completed'), value: 'Completed' },
                { label: t('cancelled'), value: 'Cancelled' }
              ]}
            />
          </div>
        </div>

        <div className="table-container">
          {isLoading ? (
            <div style={{ padding: '1rem' }}>
              {[1,2,3,4,5].map(i => (
                <div key={i} style={{ display: 'flex', gap: '1rem', padding: '1rem', borderBottom: '1px solid var(--border)' }}>
                  <Skeleton width="30%" />
                  <Skeleton width="20%" />
                  <Skeleton width="15%" />
                  <Skeleton width="20%" />
                  <Skeleton width="15%" />
                </div>
              ))}
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>{t('client_name')}</th>
                  <th>{t('phone')}</th>
                  <th>{t('status')}</th>
                  <th>{lang === 'ar' ? 'تاريخ الإضافة' : 'CREATED'}</th>
                  <th style={{ textAlign: lang === 'ar' ? 'left' : 'right' }}>{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.map((client) => (
                  <tr key={client.id}>
                    <td style={{ fontWeight: 600 }}>{client.name}</td>
                    <td><div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Phone size={14} /><span>{client.phone || 'N/A'}</span></div></td>
                    <td><span className={`badge ${getStatusBadge(client.status)}`}>{t(client.status.toLowerCase())}</span></td>
                    <td><div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Calendar size={14} /><span>{new Date(client.created_at).toLocaleDateString()}</span></div></td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: lang === 'ar' ? 'flex-start' : 'flex-end' }}>
                        <button onClick={() => handleOpenModal(client)} className="btn btn-ghost" style={{ padding: '0.5rem' }}><Edit2 size={16} /></button>
                        <button onClick={() => { setDeletingId(client.id); setIsConfirmOpen(true); }} className="btn btn-ghost" style={{ padding: '0.5rem', color: 'var(--danger)' }}><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
            <motion.div 
              variants={modalVariants}
              initial="initial" 
              animate="animate" 
              exit="exit" 
              className="card" 
              style={{ width: '100%', maxWidth: '500px', padding: '2rem', position: 'relative', overflow: 'visible' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{editingId ? t('edit_client') : t('new_client')}</h2>
                <button onClick={() => setIsModalOpen(false)} className="btn btn-ghost" style={{ padding: '0.5rem' }}><X size={20} /></button>
              </div>
              <div className="input-group">
                <label className="input-label">{t('full_name')}</label>
                <input type="text" className="input-field" placeholder="e.g. John Doe" value={clientForm.name} onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })} />
              </div>
              <div className="input-group">
                <label className="input-label">{t('phone')}</label>
                <input type="text" className="input-field" placeholder="+1 (555) 000-0000" value={clientForm.phone} onChange={(e) => setClientForm({ ...clientForm, phone: e.target.value })} />
              </div>
                <CustomSelect 
                  label={t('status')}
                  value={clientForm.status}
                  onChange={(val) => setClientForm({ ...clientForm, status: val })}
                  openUp={true}
                  options={[
                    { label: t('lead'), value: 'Lead' },
                    { label: t('booked'), value: 'Booked' },
                    { label: t('completed'), value: 'Completed' },
                    { label: t('cancelled'), value: 'Cancelled' }
                  ]}
                />
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button onClick={() => setIsModalOpen(false)} className="btn btn-ghost" style={{ flex: 1 }}>{t('cancel')}</button>
                <button onClick={handleSaveClient} className="btn btn-primary" style={{ flex: 1 }}>{editingId ? t('save_changes') : t('save_client')}</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Clients;
