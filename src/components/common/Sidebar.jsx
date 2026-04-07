import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Package,
  CalendarClock,
  FileText,
  BarChart3,
  LogOut,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  Languages
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useTranslation } from '../../context/LanguageContext';
import './Sidebar.css';

const Sidebar = ({ onLogout, isCollapsed, setIsCollapsed }) => {
  const { lang, setLang, t } = useTranslation();
  const [studioName, setStudioName] = useState(localStorage.getItem('studio_name') || 'StudioBiz');
  const [studioLogo, setStudioLogo] = useState(localStorage.getItem('studio_logo') || null);

  useEffect(() => {
    const handleNameChange = () => setStudioName(localStorage.getItem('studio_name') || 'StudioBiz');
    const handleLogoChange = () => setStudioLogo(localStorage.getItem('studio_logo') || null);

    window.addEventListener('storage', handleNameChange);
    window.addEventListener('studio_name_updated', handleNameChange);
    window.addEventListener('studio_logo_updated', handleLogoChange);

    return () => {
      window.removeEventListener('storage', handleNameChange);
      window.removeEventListener('studio_name_updated', handleNameChange);
      window.removeEventListener('studio_logo_updated', handleLogoChange);
    };
  }, []);

  const menuItems = [
    { name: t('dashboard'), path: '/dashboard', icon: LayoutDashboard },
    { name: t('clients'), path: '/clients', icon: Users },
    { name: t('packages'), path: '/packages', icon: Package },
    { name: t('bookings'), path: '/bookings', icon: CalendarClock },
    { name: t('invoices'), path: '/invoices', icon: FileText },
    { name: t('reports'), path: '/reports', icon: BarChart3 },
  ];

  return (
    <>
      <button className="mobile-toggle" onClick={() => setIsCollapsed(!isCollapsed)}>
        <Menu size={24} />
      </button>

      <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
        <button
          className="collapse-btn"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? (lang === 'ar' ? <ChevronLeft size={16} /> : <ChevronRight size={16} />) : (lang === 'ar' ? <ChevronRight size={16} /> : <ChevronLeft size={16} />)}
        </button>

        <div className="sidebar-header">
          <div className="logo-container">
            <div className="logo-icon" style={{ overflow: 'hidden', padding: studioLogo ? '2px' : 0 }}>
              {studioLogo ? (
                <img src={studioLogo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              ) : (
                'S'
              )}
            </div>
            <AnimatePresence>
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0, x: lang === 'ar' ? 10 : -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: lang === 'ar' ? 10 : -10 }}
                  className="logo-text"
                >
                  {studioName}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              title={isCollapsed ? item.name : ''}
            >
              <item.icon size={20} />
              {!isCollapsed && <span>{item.name}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button 
            onClick={() => setLang(lang === 'en' ? 'ar' : 'en')} 
            className="nav-link" 
            title={isCollapsed ? t('language') : ''}
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'inherit' }}
          >
            <Languages size={20} />
            {!isCollapsed && <span>{lang === 'en' ? 'العربية' : 'English'}</span>}
          </button>
          
          <NavLink to="/settings" className="nav-link" title={isCollapsed ? t('settings') : ''}>
            <Settings size={20} />
            {!isCollapsed && <span>{t('settings')}</span>}
          </NavLink>
          
          <button onClick={onLogout} className="nav-link logout-btn" title={isCollapsed ? t('logout') : ''}>
            <LogOut size={20} />
            {!isCollapsed && <span>{t('logout')}</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
