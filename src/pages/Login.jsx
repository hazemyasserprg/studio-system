import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Mail, ArrowRight, Loader2, AlertCircle, Shield, Building2, UserPlus, KeyRound } from 'lucide-react';
import { supabase } from '../utils/supabase/client';
import './Login.css';

const Login = ({ onLogin }) => {
  const [mode, setMode] = useState('login'); // 'login' | 'signup' | 'forgot'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [studioName, setStudioName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const switchMode = (newMode) => {
    setMode(newMode);
    setError('');
    setSuccessMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      if (mode === 'login') {
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) throw authError;
        onLogin(true);

      } else if (mode === 'signup') {
        const { error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { studio_name: studioName || 'My Studio' } }
        });
        if (authError) throw authError;
        setSuccessMsg('Account created! Check your email to confirm, then sign in.');
        switchMode('login');
        setPassword('');

      } else if (mode === 'forgot') {
        const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}`,
        });
        if (authError) throw authError;
        setSuccessMsg('Password reset link sent! Check your email inbox.');
        setEmail('');
      }
    } catch (err) {
      setError(
        err.message === 'Invalid login credentials'
          ? 'Invalid email or password. Please try again.'
          : err.message
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-bg-orbs">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="login-card"
      >
        {/* Header */}
        <div className="login-header">
          <motion.div
            className="login-logo"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          >
            S
          </motion.div>
          <h1>Studio Business</h1>
          <p>
            {mode === 'login' && 'Sign in to your studio account'}
            {mode === 'signup' && 'Create your studio account'}
            {mode === 'forgot' && 'Reset your password'}
          </p>
        </div>

        {/* Mode Tabs (only login/signup) */}
        {mode !== 'forgot' && (
          <div className="login-tabs">
            <button className={`login-tab ${mode === 'login' ? 'active' : ''}`} onClick={() => switchMode('login')}>
              <Lock size={14} /> Sign In
            </button>
            <button className={`login-tab ${mode === 'signup' ? 'active' : ''}`} onClick={() => switchMode('signup')}>
              <UserPlus size={14} /> New Studio
            </button>
          </div>
        )}

        {/* Back button for forgot mode */}
        {mode === 'forgot' && (
          <button className="btn btn-ghost" style={{ marginBottom: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)', padding: '0.375rem 0' }} onClick={() => switchMode('login')}>
            ← Back to Sign In
          </button>
        )}

        {/* Success */}
        {successMsg && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="login-success">
            <Shield size={16} /><span>{successMsg}</span>
          </motion.div>
        )}

        {/* Error */}
        {error && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="login-error">
            <AlertCircle size={16} /><span>{error}</span>
          </motion.div>
        )}

        {/* Form */}
        <AnimatePresence mode="wait">
          <motion.form
            key={mode}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            onSubmit={handleSubmit}
            className="login-form"
          >
            {mode === 'signup' && (
              <div className="input-group">
                <label className="input-label">Studio Name</label>
                <div className="input-with-icon">
                  <Building2 size={18} className="input-icon" />
                  <input type="text" id="signup-studio" className="input-field" placeholder="e.g. Nour Photography Studio"
                    value={studioName} onChange={(e) => setStudioName(e.target.value)} autoComplete="organization" />
                </div>
              </div>
            )}

            <div className="input-group">
              <label className="input-label">Email Address</label>
              <div className="input-with-icon">
                <Mail size={18} className="input-icon" />
                <input type="email" id="login-email" className="input-field" placeholder="studio@example.com"
                  value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
              </div>
            </div>

            {mode !== 'forgot' && (
              <div className="input-group">
                <label className="input-label">Password</label>
                <div className="input-with-icon">
                  <Lock size={18} className="input-icon" />
                  <input type="password" id="login-password" className="input-field" placeholder="••••••••"
                    value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
                </div>
                {mode === 'signup' && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.375rem' }}>Minimum 6 characters</p>
                )}
              </div>
            )}

            {mode === 'login' && (
              <button type="button" className="btn btn-ghost" style={{ alignSelf: 'flex-end', fontSize: '0.8rem', color: 'var(--accent)', padding: '0.25rem 0', marginTop: '-0.75rem' }}
                onClick={() => switchMode('forgot')}>
                <KeyRound size={13} /> Forgot password?
              </button>
            )}

            <button id="login-submit" type="submit" className="btn btn-primary login-submit-btn" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <>
                  <span>
                    {mode === 'login' && 'Sign In'}
                    {mode === 'signup' && 'Create Studio Account'}
                    {mode === 'forgot' && 'Send Reset Link'}
                  </span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </motion.form>
        </AnimatePresence>

        <div className="login-footer">
          <Shield size={13} />
          <p>Each studio account has isolated, private data.</p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
