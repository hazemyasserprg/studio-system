import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Plus, Edit2, Trash2, Layers, Loader2, X } from 'lucide-react';
import { supabase } from '../utils/supabase/client';
import Toast from '../components/common/Toast';
import ConfirmModal from '../components/common/ConfirmModal';
import { useTranslation } from '../context/LanguageContext';

const Packages = () => {
  const { lang, t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [packages, setPackages] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPkg, setEditingPkg] = useState(null);
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [form, setForm] = useState({ name: '', description: '', price: '', duration: 60 });

  // Animation variants
  const pageVariants = {
    initial: { opacity: 0, x: lang === 'ar' ? 20 : -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: lang === 'ar' ? -20 : 20 }
  };

  const fetchPackages = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from('packages').select('*').order('price', { ascending: true });
    if (!error) setPackages(data);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);

  const handleOpenModal = (pkg = null) => {
    if (pkg) {
      setEditingPkg(pkg);
      setForm({ name: pkg.name, description: pkg.description || '', price: pkg.price, duration: pkg.duration });
    } else {
      setEditingPkg(null);
      setForm({ name: '', description: '', price: '', duration: 60 });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.price) return;
    if (editingPkg) {
      const { data, error } = await supabase.from('packages').update(form).eq('id', editingPkg.id).select();
      if (!error) {
        setPackages(packages.map(p => p.id === editingPkg.id ? data[0] : p));
        setToast({ message: t('package_updated'), type: 'success' });
      }
    } else {
      const { data, error } = await supabase.from('packages').insert([form]).select();
      if (!error) {
        setPackages([...packages, data[0]]);
        setToast({ message: t('package_created'), type: 'success' });
      }
    }
    setIsModalOpen(false);
    setTimeout(() => setToast({ message: '', type: 'success' }), 3000);
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    const { error } = await supabase.from('packages').delete().eq('id', deletingId);
    if (!error) {
      setPackages(packages.filter(p => p.id !== deletingId));
      setToast({ message: t('package_deleted'), type: 'info' });
    }
    setIsConfirmOpen(false);
    setDeletingId(null);
    setTimeout(() => setToast({ message: '', type: 'success' }), 3000);
  };

  if (isLoading) {
    return <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Loader2 className="animate-spin" size={32} color="var(--accent)" /></div>;
  }

  return (
    <motion.div 
      variants={pageVariants}
      initial="initial" 
      animate="animate" 
      exit="exit"
      transition={{ duration: 0.4 }}
      className="packages-page"
    >
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />
      <ConfirmModal isOpen={isConfirmOpen} title={t('delete_confirm_title')} message={t('delete_confirm_msg')} onConfirm={handleDelete} onCancel={() => setIsConfirmOpen(false)} />

      <header className="flex-between-responsive" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 className="h1">{t('packages_title')}</h1>
          <p className="text-mute">{t('packages_subtitle')}</p>
        </div>
        <button onClick={() => handleOpenModal()} className="btn btn-primary"><Plus size={20} /><span>{t('add_package')}</span></button>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {packages.map((pkg) => (
          <div key={pkg.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ background: 'var(--bg-surface)', padding: '0.75rem', borderRadius: '10px', color: 'var(--accent)' }}><Package size={24} /></div>
                <div style={{ textAlign: lang === 'ar' ? 'left' : 'right' }}><p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{t('price')}</p><p style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent)' }}>{t('currency')} {pkg.price}</p></div>
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>{pkg.name}</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>{pkg.description || 'No description provided.'}</p>
              <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div><p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{t('duration')}</p><p style={{ fontWeight: 600 }}>{pkg.duration} m</p></div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
              <button onClick={() => handleOpenModal(pkg)} className="btn btn-ghost" style={{ flex: 1, fontSize: '0.875rem' }}><Edit2 size={16} /><span>{t('edit')}</span></button>
              <button onClick={() => { setDeletingId(pkg.id); setIsConfirmOpen(true); }} className="btn btn-ghost" style={{ flex: 1, fontSize: '0.875rem', color: 'var(--danger)' }}><Trash2 size={16} /><span>{t('delete')}</span></button>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="card" style={{ width: '90%', maxWidth: '500px', padding: '2rem', margin: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{editingPkg ? t('edit_package') : t('new_package')}</h2>
                <button onClick={() => setIsModalOpen(false)} className="btn btn-ghost"><X size={20} /></button>
              </div>
              <div className="input-group"><label className="input-label">{t('package_name')}</label><input type="text" className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div className="input-group"><label className="input-label">{t('description')}</label><textarea className="input-field" style={{ minHeight: '80px' }} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="input-group"><label className="input-label">{t('price')} ({t('currency')})</label><input type="number" className="input-field" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
                <div className="input-group"><label className="input-label">{t('duration')}</label><input type="number" className="input-field" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} /></div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button onClick={() => setIsModalOpen(false)} className="btn btn-ghost" style={{ flex: 1 }}>{t('cancel')}</button>
                <button onClick={handleSave} className="btn btn-primary" style={{ flex: 1 }}>{t('save_changes')}</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Packages;
