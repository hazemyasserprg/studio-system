import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, DollarSign, CheckCircle, Clock, X, Trash2, FileDown, Loader2, FileText } from 'lucide-react';
import { supabase } from '../utils/supabase/client';
import Toast from '../components/common/Toast';
import ConfirmModal from '../components/common/ConfirmModal';
import Skeleton from '../components/common/Skeleton';
import EmptyState from '../components/common/EmptyState';
import { generateInvoicePDF } from '../utils/pdfGenerator';
import CustomSelect from '../components/common/CustomSelect';
import CustomDatePicker from '../components/common/CustomDatePicker';
import { useTranslation } from '../context/LanguageContext';

const Invoices = () => {
  const { lang, t } = useTranslation();
  const [invoices, setInvoices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [stats, setStats] = useState({ totalPaid: 0, outstanding: 0, overdue: 0 });

  // UI State
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [isExporting, setIsExporting] = useState(null);

  // New Invoice State
  const [newInvoice, setNewInvoice] = useState({ booking_id: '', amount: 0, due_date: '', id: '' });

  // Animation variants
  const pageVariants = {
    initial: { opacity: 0, x: lang === 'ar' ? 20 : -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: lang === 'ar' ? -20 : 20 }
  };

  const calculateStats = (data) => {
    const paid = data.reduce((acc, inv) => acc + (Number(inv.paid) || 0), 0);
    const totalAmount = data.reduce((acc, inv) => acc + (Number(inv.amount) || 0), 0);
    const outstanding = totalAmount - paid;
    const today = new Date();
    const overdue = data.reduce((acc, inv) => {
      const isOverdue = inv.due_date && new Date(inv.due_date) < today && inv.status !== 'Paid';
      return isOverdue ? acc + (Number(inv.amount) - (Number(inv.paid) || 0)) : acc;
    }, 0);
    setStats({ totalPaid: paid, outstanding, overdue });
  };

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    const { data: iData } = await supabase.from('invoices').select('*, clients(name)').order('created_at', { ascending: false });
    const { data: bData } = await supabase.from('bookings').select('*, clients(name), packages(name)').order('event_date', { ascending: false });

    setInvoices(iData || []);
    setBookings(bData || []);
    calculateStats(iData || []);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateInvoice = async () => {
    if (!newInvoice.booking_id || !newInvoice.id || !newInvoice.amount) return;

    const booking = bookings.find(b => b.id === newInvoice.booking_id);
    const client_id = booking?.client_id;

    const { data, error } = await supabase
      .from('invoices')
      .insert([{ ...newInvoice, client_id }])
      .select('*, clients(name)');

    if (!error) {
      const updated = [data[0], ...invoices];
      setInvoices(updated);
      setToast({ message: t('invoice_generated'), type: 'success' });
      setIsModalOpen(false);
      setNewInvoice({ booking_id: '', amount: 0, due_date: '', id: '' });
      calculateStats(updated);
    }
    setTimeout(() => setToast({ message: '', type: 'success' }), 3000);
  };

  const handleMarkAsPaid = async (invoice) => {
    const { error } = await supabase
      .from('invoices')
      .update({ 
        paid: invoice.amount, 
        status: 'Paid' 
      })
      .eq('id', invoice.id);

    if (!error) {
      const updated = invoices.map(inv => 
        inv.id === invoice.id ? { ...inv, paid: invoice.amount, status: 'Paid' } : inv
      );
      setInvoices(updated);
      calculateStats(updated);
      setToast({ message: t('invoice_updated') || 'Invoice updated successfully', type: 'success' });
    } else {
      setToast({ message: 'Error updating invoice', type: 'danger' });
    }
    setTimeout(() => setToast({ message: '', type: 'success' }), 3000);
  };

  const onConfirmDelete = async () => {
    if (!deletingId) return;
    const { error } = await supabase.from('invoices').delete().eq('id', deletingId);
    if (!error) {
      const updated = invoices.filter(i => i.id !== deletingId);
      setInvoices(updated);
      calculateStats(updated);
      setToast({ message: t('invoice_deleted'), type: 'info' });
    }
    setIsConfirmOpen(false);
    setDeletingId(null);
    setTimeout(() => setToast({ message: '', type: 'success' }), 3000);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Paid': return 'badge-success';
      case 'Partially Paid': return 'badge-warning';
      case 'Unpaid': return 'badge-danger';
      default: return 'badge-ghost';
    }
  };

  const tStatus = (status) => {
    switch (status) {
      case 'Paid': return t('paid_status');
      case 'Partially Paid': return t('partially_paid_status');
      case 'Unpaid': return t('unpaid_status');
      default: return status;
    }
  };

  return (
    <motion.div 
      variants={pageVariants}
      initial="initial" 
      animate="animate" 
      exit="exit" 
      transition={{ duration: 0.4 }}
      className="invoices-page"
    >
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, message: '' })} />
      <ConfirmModal 
        isOpen={isConfirmOpen} 
        title={t('delete')} 
        message={t('delete_confirm_msg')}
        onConfirm={onConfirmDelete}
        onCancel={() => setIsConfirmOpen(false)}
      />

      <header className="flex-between-responsive" style={{ marginBottom: '2rem', gap: '1.5rem' }}>
        <div style={{ flex: 1 }}>
          <h1 className="h1">{t('invoices_title')}</h1>
          <p className="text-mute">{t('invoices_subtitle')}</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary" style={{ width: 'fit-content' }}>
          <Plus size={20} />
          <span>{t('create_invoice')}</span>
        </button>
      </header>

      <div className="grid-responsive" style={{ marginBottom: '2rem' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', padding: '0.75rem', borderRadius: '10px' }}><CheckCircle size={24} /></div>
          <div><p className="text-mute" style={{ fontSize: '0.875rem' }}>{t('paid_amount')}</p><p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{t('currency')} {stats.totalPaid.toLocaleString()}</p></div>
        </div>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)', padding: '0.75rem', borderRadius: '10px' }}><Clock size={24} /></div>
          <div><p className="text-mute" style={{ fontSize: '0.875rem' }}>{t('outstanding')}</p><p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{t('currency')} {stats.outstanding.toLocaleString()}</p></div>
        </div>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '0.75rem', borderRadius: '10px' }}><DollarSign size={24} /></div>
          <div><p className="text-mute" style={{ fontSize: '0.875rem' }}>{t('overdue')}</p><p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{t('currency')} {stats.overdue.toLocaleString()}</p></div>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container">
          {isLoading ? (
            <div style={{ padding: '1rem' }}>
              {[1,2,3].map(i => <Skeleton key={i} height="60px" style={{ marginBottom: '1rem' }} />)}
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>{t('id')}</th>
                  <th>{t('client')}</th>
                  <th>{t('amount')}</th>
                  <th>{t('paid')}</th>
                  <th>{t('due_date')}</th>
                  <th>{t('status')}</th>
                  <th style={{ textAlign: lang === 'ar' ? 'left' : 'right' }}>{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td style={{ fontWeight: 600, color: 'var(--accent)', textAlign: 'inherit' }}>{inv.id}</td>
                    <td style={{ textAlign: 'inherit' }}>{inv.clients?.name || 'Unknown'}</td>
                    <td style={{ textAlign: 'inherit' }}>{t('currency')} {Number(inv.amount).toLocaleString()}</td>
                    <td style={{ textAlign: 'inherit' }}>{t('currency')} {Number(inv.paid).toLocaleString()}</td>
                    <td style={{ textAlign: 'inherit' }}>{inv.due_date || 'N/A'}</td>
                    <td style={{ textAlign: 'inherit' }}><span className={`badge ${getStatusBadge(inv.status)}`}>{tStatus(inv.status)}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        {inv.status !== 'Paid' && (
                          <button 
                            onClick={() => handleMarkAsPaid(inv)} 
                            className="btn btn-ghost" 
                            style={{ padding: '0.5rem', color: 'var(--success)' }}
                            title={t('mark_as_paid') || 'Mark as Paid'}
                          >
                            <DollarSign size={18} />
                          </button>
                        )}
                        <button 
                          onClick={() => {
                            setToast({ message: t('pdf_generating'), type: 'info' });
                            setIsExporting(inv.id);
                            
                            setTimeout(() => {
                                const studioInfo = {
                                  name: localStorage.getItem('studio_name') || 'StudioBiz',
                                  email: localStorage.getItem('studio_email') || 'contact@studiobiz.com',
                                  logo: localStorage.getItem('studio_logo') || null,
                                  color: localStorage.getItem('studio_color') || '#6366f1',
                                  lang: lang
                                 };
                              
                              try {
                                generateInvoicePDF(inv, inv.clients || { name: 'Unknown' }, studioInfo, 'EGP');
                                setToast({ message: t('download_started'), type: 'success' });
                              } catch (err) {
                                console.error(err);
                                setToast({ message: t('export_failed'), type: 'danger' });
                              }
                              setIsExporting(null);
                            }, 150);
                          }} 
                          disabled={isExporting === inv.id}
                          className={`btn btn-ghost ${isExporting === inv.id ? 'loading' : ''}`}
                          style={{ padding: '0.5rem', color: isExporting === inv.id ? 'var(--text-secondary)' : 'var(--accent)' }}
                        >
                          <FileDown size={18} />
                        </button>
                        <button onClick={() => { setDeletingId(inv.id); setIsConfirmOpen(true); }} className="btn btn-ghost" style={{ padding: '0.5rem', color: 'var(--danger)' }}><Trash2 size={18} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {!isLoading && invoices.length === 0 && (
            <EmptyState
              icon={<FileText size={36} />}
              title="No invoices yet"
              subtitle="Create your first invoice by linking it to a booking."
              action={{ label: t('create_invoice'), onClick: () => setIsModalOpen(true) }}
            />
          )}
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="card" style={{ width: '90%', maxWidth: '500px', padding: '2rem', overflow: 'visible', margin: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{t('create_invoice')}</h2>
                <button onClick={() => setIsModalOpen(false)} className="btn btn-ghost"><X size={20} /></button>
              </div>
              <div className="input-group">
                <label className="input-label">{t('invoice_number')}</label>
                <input type="text" className="input-field" placeholder="e.g. INV-1001" value={newInvoice.id} onChange={(e) => setNewInvoice({...newInvoice, id: e.target.value})} />
              </div>
              <CustomSelect label={t('select_booking')} value={newInvoice.booking_id} onChange={(val) => {
                  const b = bookings.find(x => x.id === val);
                  setNewInvoice({...newInvoice, booking_id: val, amount: b ? b.total_price : 0});
                }}
                options={bookings.map(b => ({ label: `${b.clients?.name} - ${b.packages?.name} (${t('currency')} ${b.total_price})`, value: b.id }))}
                placeholder={t('select_booking_placeholder')}
              />
              <div className="input-group">
                <label className="input-label">{t('amount')} ({t('currency')})</label>
                <input type="number" className="input-field" value={newInvoice.amount} onChange={(e) => setNewInvoice({...newInvoice, amount: e.target.value})} />
              </div>
              <CustomDatePicker label={t('due_date')} value={newInvoice.due_date} onChange={(val) => setNewInvoice({...newInvoice, due_date: val})} openUp={true} />
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button onClick={() => setIsModalOpen(false)} className="btn btn-ghost" style={{ flex: 1 }}>{t('cancel')}</button>
                <button onClick={handleCreateInvoice} className="btn btn-primary" style={{ flex: 1 }}>{t('create_invoice')}</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Invoices;
