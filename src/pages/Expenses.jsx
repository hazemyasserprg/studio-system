import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Wallet, Trash2, Edit2, X, Loader2, Calendar, Tag, Paperclip, FileText, ExternalLink } from 'lucide-react';
import { supabase } from '../utils/supabase/client';
import Toast from '../components/common/Toast';
import ConfirmModal from '../components/common/ConfirmModal';
import Skeleton from '../components/common/Skeleton';
import CustomSelect from '../components/common/CustomSelect';
import CustomDatePicker from '../components/common/CustomDatePicker';
import { useTranslation } from '../context/LanguageContext';

const Expenses = () => {
  const { lang, t } = useTranslation();
  const [expenses, setExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  
  // UI State
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [form, setForm] = useState({ 
    description: '', 
    amount: '', 
    category: 'rent', 
    customCategory: '',
    expense_date: new Date().toISOString().split('T')[0],
    receipt: null
  });

  const [isUploading, setIsUploading] = useState(false);

  const predefinedValues = ['rent', 'equipment', 'marketing', 'software', 'others'];
  const categories = [
    { label: t('cat_rent'), value: 'rent' },
    { label: t('cat_equipment'), value: 'equipment' },
    { label: t('cat_marketing'), value: 'marketing' },
    { label: t('cat_software'), value: 'software' },
    { label: t('cat_others'), value: 'others' },
  ];

  const pageVariants = {
    initial: { opacity: 0, x: lang === 'ar' ? 20 : -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: lang === 'ar' ? -20 : 20 }
  };

  const fetchExpenses = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .order('expense_date', { ascending: false });
    
    if (!error) setExpenses(data || []);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const handleOpenModal = (expense = null) => {
    if (expense) {
      setEditingExpense(expense);
      const isCustom = !predefinedValues.includes(expense.category);
      setForm({
        description: expense.description,
        amount: expense.amount,
        category: isCustom ? 'others' : expense.category,
        customCategory: isCustom ? expense.category : '',
        expense_date: expense.expense_date,
        receipt: null,
        receipt_url: expense.receipt_url
      });
    } else {
      setEditingExpense(null);
      setForm({ 
        description: '', 
        amount: '', 
        category: 'rent', 
        customCategory: '',
        expense_date: new Date().toISOString().split('T')[0],
        receipt: null
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.description || !form.amount || !form.expense_date) return;

    const finalCategory = form.category === 'others' 
      ? (form.customCategory || 'others') 
      : form.category;

    setIsUploading(true);
    let receipt_url = editingExpense?.receipt_url || null;

    if (form.receipt) {
      const file = form.receipt;
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = fileName;

      const { error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        setToast({ message: `Upload failed: ${uploadError.message}`, type: 'danger' });
        setIsUploading(false);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('receipts')
        .getPublicUrl(filePath);
      
      receipt_url = publicUrl;
    }

    const expenseData = {
      description: form.description,
      amount: parseFloat(form.amount) || 0,
      category: finalCategory,
      expense_date: form.expense_date,
      receipt_url
    };

    if (editingExpense) {
      const { error } = await supabase
        .from('expenses')
        .update(expenseData)
        .eq('id', editingExpense.id);
      
      if (error) {
        console.error('Update expense error:', error);
        setToast({ message: error.message || t('export_failed'), type: 'danger' });
        setIsUploading(false);
        return;
      }
      
      setExpenses(expenses.map(ex => ex.id === editingExpense.id ? { ...ex, ...expenseData } : ex));
      setToast({ message: t('expense_updated'), type: 'success' });
    } else {
      const { data, error } = await supabase
        .from('expenses')
        .insert([expenseData])
        .select();
      
      if (error) {
        console.error('Add expense error:', error);
        setToast({ message: error.message || t('export_failed'), type: 'danger' });
        setIsUploading(false);
        return;
      }
      
      if (data && data[0]) {
        setExpenses([data[0], ...expenses]);
        setToast({ message: t('expense_added'), type: 'success' });
      }
    }
    
    setIsUploading(false);
    setIsModalOpen(false);
    setTimeout(() => setToast({ message: '', type: 'success' }), 3000);
  };

  const onConfirmDelete = async () => {
    if (!deletingId) return;
    const { error } = await supabase.from('expenses').delete().eq('id', deletingId);
    if (!error) {
      setExpenses(expenses.filter(ex => ex.id !== deletingId));
      setToast({ message: t('expense_deleted'), type: 'info' });
    }
    setIsConfirmOpen(false);
    setDeletingId(null);
    setTimeout(() => setToast({ message: '', type: 'success' }), 3000);
  };

  const getTotalExpenses = () => {
    return expenses.reduce((sum, ex) => sum + Number(ex.amount), 0);
  };

  return (
    <motion.div 
      variants={pageVariants}
      initial="initial" 
      animate="animate" 
      exit="exit" 
      transition={{ duration: 0.4 }}
      className="expenses-page"
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
          <h1 className="h1">{t('expenses_title')}</h1>
          <p className="text-mute">{t('expenses_subtitle')}</p>
        </div>
        <button onClick={() => handleOpenModal()} className="btn btn-primary" style={{ width: 'fit-content' }}>
          <Plus size={20} />
          <span>{t('add_expense')}</span>
        </button>
      </header>

      <div className="card" style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '1rem', borderRadius: '12px' }}>
          <Wallet size={32} />
        </div>
        <div>
          <p className="text-mute" style={{ fontSize: '0.875rem' }}>{t('total_expenses')}</p>
          <h2 style={{ fontSize: '2rem', fontWeight: 700 }}>{t('currency')} {getTotalExpenses().toLocaleString()}</h2>
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
                  <th>{t('expense_description')}</th>
                  <th>{t('expense_category')}</th>
                  <th>{t('expense_date')}</th>
                  <th>{t('amount')}</th>
                  <th>{t('receipt')}</th>
                  <th style={{ textAlign: lang === 'ar' ? 'left' : 'right' }}>{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((ex) => (
                  <tr key={ex.id}>
                    <td style={{ fontWeight: 600, textAlign: 'inherit' }}>{ex.description}</td>
                    <td style={{ textAlign: 'inherit' }}>
                      <span className="badge badge-accent">
                        {predefinedValues.includes(ex.category) ? t(`cat_${ex.category}`) : ex.category}
                      </span>
                    </td>
                    <td style={{ textAlign: 'inherit' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'inherit' }}>
                        <Calendar size={14} className="text-secondary" />
                        <span>{new Date(ex.expense_date).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td style={{ fontWeight: 700, textAlign: 'inherit' }}>{t('currency')} {Number(ex.amount).toLocaleString()}</td>
                    <td style={{ textAlign: 'inherit' }}>
                      {ex.receipt_url ? (
                        <a 
                          href={ex.receipt_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="btn btn-ghost"
                          style={{ padding: '0.4rem', color: 'var(--accent)' }}
                          title={t('view_receipt')}
                        >
                          <FileText size={18} />
                        </a>
                      ) : (
                        <span className="text-mute" style={{ fontSize: '0.8rem' }}>—</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button onClick={() => handleOpenModal(ex)} className="btn btn-ghost" style={{ padding: '0.5rem' }}><Edit2 size={18} /></button>
                        <button onClick={() => { setDeletingId(ex.id); setIsConfirmOpen(true); }} className="btn btn-ghost" style={{ padding: '0.5rem', color: 'var(--danger)' }}><Trash2 size={18} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {!isLoading && expenses.length === 0 && (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              {t('no_options')}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="card" style={{ width: '90%', maxWidth: '500px', padding: '2rem', overflow: 'visible', margin: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{editingExpense ? t('edit_expense') : t('new_expense')}</h2>
                <button onClick={() => setIsModalOpen(false)} className="btn btn-ghost"><X size={20} /></button>
              </div>
              
              <form onSubmit={handleSubmit}>
                <div className="input-group">
                  <label className="input-label">{t('expense_description')}</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="e.g. Camera repair"
                    value={form.description} 
                    onChange={(e) => setForm({...form, description: e.target.value})} 
                    required
                  />
                </div>

                <div className="grid-responsive" style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label">{t('amount')} ({t('currency')})</label>
                    <input 
                      type="number" 
                      className="input-field" 
                      value={form.amount} 
                      onChange={(e) => setForm({...form, amount: e.target.value})} 
                      required
                    />
                  </div>
                  <CustomSelect 
                    label={t('expense_category')} 
                    value={form.category} 
                    onChange={(val) => setForm({...form, category: val})} 
                    options={categories}
                  />
                </div>

                {form.category === 'others' && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }} 
                    animate={{ opacity: 1, height: 'auto' }}
                    className="input-group"
                  >
                    <label className="input-label">{t('custom_category')}</label>
                    <input 
                      type="text" 
                      className="input-field" 
                      placeholder={t('custom_category_placeholder')}
                      value={form.customCategory} 
                      onChange={(e) => setForm({...form, customCategory: e.target.value})} 
                      required
                    />
                  </motion.div>
                )}

                <CustomDatePicker 
                  label={t('expense_date')} 
                  value={form.expense_date} 
                  onChange={(val) => setForm({...form, expense_date: val})} 
                  openUp={true}
                />

                <div className="input-group" style={{ marginTop: '1.5rem' }}>
                  <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Paperclip size={16} />
                    {t('receipt')}
                  </label>
                  <div className="file-input-wrapper" style={{ position: 'relative' }}>
                    <input 
                      type="file" 
                      id="receipt-upload"
                      style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }}
                      onChange={(e) => setForm({...form, receipt: e.target.files[0]})}
                    />
                    <div className="input-field" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ color: form.receipt ? 'var(--text-primary)' : 'var(--text-secondary)', fontSize: '0.875rem' }}>
                        {form.receipt ? form.receipt.name : t('choose_file')}
                      </span>
                      <button type="button" className="btn btn-primary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}>
                        {t('upload')}
                      </button>
                    </div>
                  </div>
                  {editingExpense?.receipt_url && !form.receipt && (
                    <p style={{ fontSize: '0.75rem', marginTop: '0.5rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Tag size={12} /> {lang === 'ar' ? 'يوجد إيصال مرفق بالفعل' : 'Already has a receipt attached'}
                    </p>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-ghost" style={{ flex: 1 }}>{t('cancel')}</button>
                  <button type="submit" disabled={isUploading} className="btn btn-primary" style={{ flex: 1 }}>
                    {isUploading ? <Loader2 className="animate-spin" size={20} /> : (editingExpense ? t('save_changes') : t('add_expense'))}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Expenses;
