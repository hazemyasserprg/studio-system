import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Palette, Globe, Save, Trash2, Moon, Sun, Loader2, Image as ImageIcon } from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';
import Toast from '../components/common/Toast';

const Settings = () => {
  const { lang, setLang, t } = useTranslation();
  const [isDarkMode, setIsDarkMode] = useState(localStorage.getItem('dark_mode') === 'true');
  const [studioName, setStudioName] = useState(localStorage.getItem('studio_name') || 'StudioBiz');
  const [studioEmail, setStudioEmail] = useState(localStorage.getItem('studio_email') || 'contact@studiobiz.com');
  const [accentColor, setAccentColor] = useState(localStorage.getItem('studio_color') || '#6366f1');
  const [logo, setLogo] = useState(localStorage.getItem('studio_logo') || null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [isLoading, setIsLoading] = useState(false);

  // Animation variants
  const pageVariants = {
    initial: { opacity: 0, x: lang === 'ar' ? 20 : -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: lang === 'ar' ? -20 : 20 }
  };

  useEffect(() => {
    document.body.classList.toggle('dark-theme', isDarkMode);
    localStorage.setItem('dark_mode', isDarkMode);
  }, [isDarkMode]);

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setIsLoading(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const max_size = 400;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > max_size) {
              height *= max_size / width;
              width = max_size;
            }
          } else {
            if (height > max_size) {
              width *= max_size / height;
              height = max_size;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/png');
          setLogo(dataUrl);
          localStorage.setItem('studio_logo', dataUrl);
          window.dispatchEvent(new Event('studio_logo_updated'));
          setToast({ show: true, message: t('logo_changed'), type: 'success' });
          setIsLoading(false);
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    setIsLoading(true);
    localStorage.setItem('studio_name', studioName);
    localStorage.setItem('studio_email', studioEmail);
    localStorage.setItem('studio_color', accentColor);
    document.documentElement.style.setProperty('--accent', accentColor);
    window.dispatchEvent(new Event('studio_name_updated'));
    
    setTimeout(() => {
      setToast({ show: true, message: t('settings_saved'), type: 'success' });
      setIsLoading(false);
    }, 800);
  };

  return (
    <motion.div 
      variants={pageVariants}
      initial="initial" 
      animate="animate" 
      exit="exit" 
      transition={{ duration: 0.4 }}
      className="settings-page"
    >
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, show: false, message: '' })} />

      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>{t('settings')}</h1>
          <p style={{ color: 'var(--text-secondary)' }}>{t('settings_subtitle') || 'Manage your studio preferences.'}</p>
        </div>
        <button onClick={handleSave} className="btn btn-primary" disabled={isLoading}>
          {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          <span>{t('save_changes')}</span>
        </button>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
        {/* Studio Identity */}
        <section className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
            <div style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent)', padding: '0.5rem', borderRadius: '8px' }}><Camera size={20} /></div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{t('studio_identity')}</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2.5rem' }}>
            <div style={{ position: 'relative', width: '120px', height: '120px', marginBottom: '1.5rem' }}>
              <div style={{ width: '100%', height: '100%', borderRadius: '24px', background: 'var(--bg-surface)', border: '2px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {logo ? <img src={logo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '10px' }} /> : <ImageIcon size={40} style={{ color: 'var(--text-secondary)' }} />}
              </div>
              <label htmlFor="logo-upload" style={{ position: 'absolute', bottom: '-10px', right: '-10px', background: 'var(--accent)', color: 'white', padding: '0.5rem', borderRadius: '50%', cursor: 'pointer', boxShadow: 'var(--shadow-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Camera size={18} />
                <input id="logo-upload" type="file" hidden accept="image/*" onChange={handleLogoUpload} />
              </label>
            </div>
            {logo && (
              <button 
                onClick={() => { setLogo(null); localStorage.removeItem('studio_logo'); window.dispatchEvent(new Event('studio_logo_updated')); }} 
                className="btn btn-ghost" 
                style={{ color: 'var(--danger)', fontSize: '0.875rem' }}
              >
                <Trash2 size={14} />
                <span>{t('remove_logo')}</span>
              </button>
            )}
          </div>

          <div className="input-group">
            <label className="input-label">{t('studio_name')}</label>
            <input type="text" className="input-field" value={studioName} onChange={(e) => setStudioName(e.target.value)} />
          </div>
          <div className="input-group">
            <label className="input-label">{t('studio_email_label')}</label>
            <input type="email" className="input-field" value={studioEmail} onChange={(e) => setStudioEmail(e.target.value)} />
          </div>
        </section>

        {/* Global Configuration */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', padding: '0.5rem', borderRadius: '8px' }}><Palette size={20} /></div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{t('appearance')}</h2>
            </div>
            
            <div className="input-group">
              <label className="input-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{t('brand_color')}</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-secondary)' }}>{accentColor}</span>
              </label>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <input type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} style={{ width: '60px', height: '44px', padding: '2px', borderRadius: '8px', border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer' }} />
                <div style={{ display: 'flex', gap: '0.5rem', flex: 1 }}>
                  {['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#ec4899'].map(c => (
                    <button key={c} onClick={() => setAccentColor(c)} style={{ width: '28px', height: '28px', borderRadius: '50%', background: c, border: accentColor === c ? '2px solid white' : 'none', boxShadow: accentColor === c ? '0 0 0 2px var(--accent)' : 'none', cursor: 'pointer' }} />
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--bg-surface)', borderRadius: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {isDarkMode ? <Moon size={20} color="var(--accent)" /> : <Sun size={20} color="#f59e0b" />}
                <div>
                  <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>{t('dark_mode')}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsDarkMode(!isDarkMode)}
                style={{ width: '44px', height: '24px', borderRadius: '12px', background: isDarkMode ? 'var(--accent)' : 'var(--border)', position: 'relative', border: 'none', cursor: 'pointer', transition: 'background 0.3s' }}
              >
                <div style={{ position: 'absolute', top: '2px', [lang === 'ar' ? (isDarkMode ? 'left' : 'right') : (isDarkMode ? 'right' : 'left')]: '2px', width: '20px', height: '20px', borderRadius: '50%', background: 'white', transition: 'all 0.3s' }} />
              </button>
            </div>
          </div>

          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
              <div style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)', padding: '0.5rem', borderRadius: '8px' }}><Globe size={20} /></div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{t('language')}</h2>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <button 
                onClick={() => setLang('en')}
                className={`btn ${lang === 'en' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ padding: '1rem', height: 'auto', flexDirection: 'column', gap: '0.5rem' }}
              >
                <span style={{ fontSize: '1rem', fontWeight: 700 }}>English</span>
                <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>LTR Direction</span>
              </button>
              <button 
                onClick={() => setLang('ar')}
                className={`btn ${lang === 'ar' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ padding: '1rem', height: 'auto', flexDirection: 'column', gap: '0.5rem' }}
              >
                <span style={{ fontSize: '1rem', fontWeight: 700 }}>العربية</span>
                <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>اتجاه راست لليسار</span>
              </button>
            </div>
          </div>
        </section>
      </div>
    </motion.div>
  );
};

export default Settings;
