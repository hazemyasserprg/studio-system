import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Sidebar from './components/common/Sidebar';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Packages from './pages/Packages';
import Bookings from './pages/Bookings';
import Invoices from './pages/Invoices';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Login from './pages/Login';
import { supabase } from './utils/supabase/client';
import './index.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    // Auto-collapse sidebar on smaller screens
    const handleResize = () => {
      if (window.innerWidth <= 1024) {
        setIsCollapsed(true);
      } else {
        setIsCollapsed(false);
      }
    };
    
    handleResize(); // Initial check
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
    // 1. Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      setIsLoading(false);
    });

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
        setIsAuthenticated(true);
      } else if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--accent)', fontSize: '2rem', fontWeight: 800 }}>S</div>
      </div>
    );
  }

  return (
    <Router>
      {!isAuthenticated ? (
        <>
          <Navigate to="/" replace />
          <Login onLogin={() => setIsAuthenticated(true)} />
        </>
      ) : (
        <AppContent isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} handleLogout={handleLogout} />
      )}
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
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/packages" element={<Packages />} />
            <Route path="/bookings" element={<Bookings />} />
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<div style={{ padding: '2rem' }}>404 - Not Found</div>} />
          </Routes>
        </AnimatePresence>
      </main>
    </div>
  );
};

export default App;
