import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Eye, EyeOff, Loader2, KeyRound } from 'lucide-react';
import { supabase } from '../../utils/supabase/client';

/**
 * Shown when the user clicks a "Reset Password" email link.
 * Supabase fires PASSWORD_RECOVERY auth event and we show this modal.
 */
const ResetPasswordModal = ({ onDone }) => {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setIsLoading(true);
    setError('');
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(updateError.message);
    } else {
      setSuccess(true);
      setTimeout(() => onDone(), 1500);
    }
    setIsLoading(false);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999
    }}>
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="card"
        style={{ width: '90%', maxWidth: '420px', padding: '2.5rem' }}
      >
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ width: '52px', height: '52px', background: 'var(--accent)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', color: 'white' }}>
            <KeyRound size={24} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Set New Password</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Choose a strong password for your studio account.</p>
        </div>

        {success ? (
          <div style={{ textAlign: 'center', color: 'var(--success)', fontWeight: 600, padding: '1rem' }}>
            ✓ Password updated! Signing you in…
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && (
              <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: 'var(--danger)', padding: '0.75rem 1rem', borderRadius: '10px', fontSize: '0.875rem', marginBottom: '1rem' }}>
                {error}
              </div>
            )}
            <div className="input-group">
              <label className="input-label">New Password</label>
              <div className="input-with-icon">
                <Lock size={18} className="input-icon" />
                <input type={show ? 'text' : 'password'} className="input-field" placeholder="••••••••"
                  value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} autoComplete="new-password" />
                <button type="button" onClick={() => setShow(!show)} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className="input-group">
              <label className="input-label">Confirm Password</label>
              <div className="input-with-icon">
                <Lock size={18} className="input-icon" />
                <input type={show ? 'text' : 'password'} className="input-field" placeholder="••••••••"
                  value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={6} autoComplete="new-password" />
              </div>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin" size={18} /> : 'Update Password'}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
};

export default ResetPasswordModal;
