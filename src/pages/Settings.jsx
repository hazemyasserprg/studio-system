import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Camera, Palette, Globe, Save, Trash2, Moon, Sun, Loader2, Image as ImageIcon, User, Mail } from 'lucide-react';
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

  const pageVariants = {
    initial: { opacity: 0, x: lang === 'ar' ? 20 : -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: lang === 'ar' ? -20 : 20 }
  };

  const presetColors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#3b82f6', '#8b5cf6'];

  useEffect(() => {
    document.body.classList.toggle('dark-theme', isDarkMode);
    localStorage.setItem('dark_mode', isDarkMode);
  }, [isDarkMode]);

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsLoading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const max = 400;
        let w = img.width, h = img.height;
        if (w > h) { if (w > max) { h *= max / w; w = max; } }
        else { if (h > max) { w *= max / h; h = max; } }
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
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
    }, 600);
  };

  const SectionHeader = ({ icon, label, color = 'var(--accent)' }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1.5rem' }}>
      <div style={{ background: `${color}18`, color, padding: '0.45rem', borderRadius: '8px', display: 'flex' }}>
        {icon}
      </div>
      <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>{label}</h2>
    </div>
  );

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

      {/* Page header */}
      <header className="flex-between-responsive" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 className="h1">{t('settings')}</h1>
          <p className="text-mute">{t('settings_subtitle') || 'Manage your studio preferences.'}</p>
        </div>
        <button onClick={handleSave} className="btn btn-primary" disabled={isLoading} style={{ width: 'fit-content' }}>
          {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          <span>{t('save_changes')}</span>
        </button>
      </header>

      {/* Main grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>

        {/* ── Studio Identity ───────────────────────────────── */}
        <section className="card">
          <SectionHeader icon={<Camera size={18} />} label={t('studio_identity')} />

          {/* Logo row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1rem', background: 'var(--bg-surface)', borderRadius: '14px', marginBottom: '1.5rem' }}>
            {/* Logo preview */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{ width: '96px', height: '96px', borderRadius: '18px', background: logo ? 'var(--bg-secondary)' : 'var(--bg-surface)', border: logo ? '2px solid var(--border)' : '2px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {logo
                  ? <img src={logo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '8px' }} />
                  : <ImageIcon size={34} style={{ color: 'var(--text-secondary)', opacity: 0.4 }} />
                }
              </div>
              <label htmlFor="logo-upload" style={{ position: 'absolute', bottom: '-6px', right: '-6px', background: 'var(--accent)', color: 'white', width: '26px', height: '26px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
                <Camera size={13} />
                <input id="logo-upload" type="file" hidden accept="image/*" onChange={handleLogoUpload} />
              </label>
            </div>

            {/* Logo info */}
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                {logo ? 'Studio Logo' : 'No Logo Yet'}
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                {logo ? 'Showing on exported invoices & PDFs' : 'Upload to brand your invoices & PDFs'}
              </p>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <label htmlFor="logo-upload" className="btn btn-ghost" style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem', cursor: 'pointer', border: '1px solid var(--border)' }}>
                  {logo ? 'Change' : 'Upload'}
                </label>
                {logo && (
                  <button onClick={() => { setLogo(null); localStorage.removeItem('studio_logo'); window.dispatchEvent(new Event('studio_logo_updated')); }}
                    className="btn btn-ghost" style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem', color: 'var(--danger)', border: '1px solid var(--border)' }}>
                    <Trash2 size={12} /> Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Fields */}
          <div className="input-group">
            <label className="input-label">{t('studio_name')}</label>
            <div className="input-with-icon">
              <User size={16} className="input-icon" />
              <input type="text" className="input-field" value={studioName} onChange={(e) => setStudioName(e.target.value)} placeholder="Studio Name" />
            </div>
          </div>
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="input-label">{t('studio_email_label')}</label>
            <div className="input-with-icon">
              <Mail size={16} className="input-icon" />
              <input type="email" className="input-field" value={studioEmail} onChange={(e) => setStudioEmail(e.target.value)} placeholder="studio@example.com" />
            </div>
          </div>
        </section>

        {/* ── Right column ──────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Appearance */}
          <section className="card">
            <SectionHeader icon={<Palette size={18} />} label={t('appearance')} color="var(--success)" />

            {/* Color picker */}
            <div className="input-group">
              <label className="input-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{t('brand_color')}</span>
                <code style={{ fontSize: '0.7rem', background: 'var(--bg-surface)', padding: '2px 8px', borderRadius: '6px', color: 'var(--text-secondary)' }}>{accentColor}</code>
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                {/* Native color input as swatch */}
                <label style={{ position: 'relative', cursor: 'pointer' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: accentColor, border: '3px solid var(--bg-secondary)', boxShadow: '0 0 0 1px var(--border)' }} />
                  <input type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }} />
                </label>

                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  {presetColors.map(c => (
                    <button key={c} onClick={() => setAccentColor(c)} style={{ width: '26px', height: '26px', borderRadius: '50%', background: c, border: 'none', cursor: 'pointer', outline: accentColor === c ? `3px solid ${c}` : '3px solid transparent', outlineOffset: '2px', transition: 'outline 0.15s' }} />
                  ))}
                </div>
              </div>
            </div>

            {/* Dark mode toggle */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.875rem 1rem', background: 'var(--bg-surface)', borderRadius: '12px', marginBottom: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {isDarkMode ? <Moon size={18} color="var(--accent)" /> : <Sun size={18} color="#f59e0b" />}
                <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{t('dark_mode')}</span>
              </div>
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                style={{ width: '44px', height: '24px', borderRadius: '12px', background: isDarkMode ? 'var(--accent)' : 'var(--border)', position: 'relative', border: 'none', cursor: 'pointer', transition: 'background 0.3s', flexShrink: 0 }}
              >
                <div style={{ position: 'absolute', top: '2px', [isDarkMode ? 'right' : 'left']: '2px', width: '20px', height: '20px', borderRadius: '50%', background: 'white', transition: 'all 0.3s' }} />
              </button>
            </div>
          </section>

          {/* Language */}
          <section className="card">
            <SectionHeader icon={<Globe size={18} />} label={t('language')} color="var(--warning)" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <button onClick={() => setLang('en')}
                className={`btn ${lang === 'en' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ padding: '0.875rem', height: 'auto', flexDirection: 'column', gap: '0.35rem', border: lang !== 'en' ? '1px solid var(--border)' : 'none' }}>
                <span style={{ fontSize: '0.9375rem', fontWeight: 700 }}>English</span>
                <span style={{ fontSize: '0.7rem', opacity: 0.7, fontWeight: 400 }}>LTR Direction</span>
              </button>
              <button onClick={() => setLang('ar')}
                className={`btn ${lang === 'ar' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ padding: '0.875rem', height: 'auto', flexDirection: 'column', gap: '0.35rem', border: lang !== 'ar' ? '1px solid var(--border)' : 'none', direction: 'rtl' }}>
                <span style={{ fontSize: '0.9375rem', fontWeight: 700 }}>العربية</span>
                <span style={{ fontSize: '0.7rem', opacity: 0.7, fontWeight: 400 }}>اتجاه من اليمين</span>
              </button>
            </div>
          </section>

        </div>
      </div>
    </motion.div>
  );
};

export default Settings;
