import { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Sidebar from './components/common/Sidebar';
import ResetPasswordModal from './components/common/ResetPasswordModal';
import { supabase } from './utils/supabase/client';
import './index.css';

// Lazy load pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Clients = lazy(() => import('./pages/Clients'));
const Packages = lazy(() => import('./pages/Packages'));
const Bookings = lazy(() => import('./pages/Bookings'));
const Invoices = lazy(() => import('./pages/Invoices'));
const Expenses = lazy(() => import('./pages/Expenses'));
const Reports = lazy(() => import('./pages/Reports'));
const Settings = lazy(() => import('./pages/Settings'));
const Login = lazy(() => import('./pages/Login'));

function App() {
  const [session, setSession] = useState(undefined);
  const [isCollapsed, setIsCollapsed] = useState(false);
  // const [showReset, setShowReset] = useState(false);

  useEffect(() => {
    // Auto-collapse sidebar on smaller screens
    const handleResize = () => {
      if (window.innerWidth <= 1024) {
        setIsCollapsed(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    // Apply theme from localStorage
    const savedTheme = localStorage.getItem('dark_mode');
    if (savedTheme === 'true') {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }

    const savedColor = localStorage.getItem('studio_color');
    if (savedColor) {
      document.documentElement.style.setProperty('--accent', savedColor);
    }

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // 1. Check for PASSWORD_RECOVERY in URL fragment (fallback for initial load)
    /*
    if (window.location.hash.includes('type=recovery')) {
      setShowReset(true);
    }
    */

    // 2. Get initial session (null if none)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session ?? null);
    });

    // 3. Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      /*
      if (event === 'PASSWORD_RECOVERY') {
        setShowReset(true);
      }
      */
      setSession(session ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    // session will be set to null by the onAuthStateChange listener
  };

  // Loading state — show a centered spinner while we determine auth status
  if (session === undefined) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-primary)',
        gap: '1rem'
      }}>
        <div style={{
          width: '52px',
          height: '52px',
          background: 'var(--accent)',
          color: 'white',
          borderRadius: '14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.75rem',
          fontWeight: 800,
          boxShadow: '0 10px 30px -5px rgba(99,102,241,0.4)'
        }}>S</div>
        <div style={{ width: '32px', height: '3px', background: 'var(--bg-surface)', borderRadius: '9999px', overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            background: 'var(--accent)',
            animation: 'loading-bar 1.2s ease-in-out infinite',
            borderRadius: '9999px'
          }} />
        </div>
        <style>{`
          @keyframes loading-bar {
            0% { width: 0%; margin-left: 0%; }
            50% { width: 100%; margin-left: 0%; }
            100% { width: 0%; margin-left: 100%; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <Router>
      {/* 
      {showReset && <ResetPasswordModal onDone={() => {
        setShowReset(false);
        // Clear the recovery fragment from the URL
        if (window.location.hash.includes('type=recovery')) {
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }
      }} />}
      */}
      <Suspense fallback={null}>
        {session === null ? (
          <Routes>
            <Route path="*" element={<Login onLogin={() => { }} />} />
          </Routes>
        ) : (
          <AppContent
            isCollapsed={isCollapsed}
            setIsCollapsed={setIsCollapsed}
            handleLogout={handleLogout}
          />
        )}
      </Suspense>
    </Router>
  );
}

const AppContent = ({ isCollapsed, setIsCollapsed, handleLogout }) => {
  const location = useLocation();

  return (
    <div className="app-container">
      <Sidebar
        onLogout={handleLogout}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />
      <main className={`main-content ${isCollapsed ? 'collapsed' : ''}`}>
        <AnimatePresence mode="wait">
          <Suspense fallback={<div style={{ padding: '2rem', color: 'var(--accent)' }}>Loading...</div>}>
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/clients" element={<Clients />} />
              <Route path="/packages" element={<Packages />} />
              <Route path="/bookings" element={<Bookings />} />
              <Route path="/invoices" element={<Invoices />} />
              <Route path="/expenses" element={<Expenses />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Suspense>
        </AnimatePresence>
      </main>
    </div>
  );
};

export default App;
