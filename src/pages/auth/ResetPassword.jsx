// ============================================
// HUNTLO SALES OS — RESET PASSWORD PAGE
// ============================================
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader, Eye, EyeOff, Lock } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import logoImg from '../../assets/logo.png';
import './Auth.css';
import { supabase } from '../../lib/supabase';

export default function ResetPassword() {
  const { updatePassword, loading } = useAuthStore();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Check if the user has a session hash in URL, typical for Supabase recovery links
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        // Ready to reset password
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: '', message: '' });
    
    if (password !== confirmPassword) {
      setStatus({ type: 'error', message: 'Passwords do not match.' });
      return;
    }
    
    if (password.length < 6) {
      setStatus({ type: 'error', message: 'Password must be at least 6 characters.' });
      return;
    }

    setIsSubmitting(true);
    
    const result = await updatePassword(password);
    
    setIsSubmitting(false);
    
    if (result.success) {
      setStatus({ type: 'success', message: 'Password successfully updated!' });
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } else {
      setStatus({ type: 'error', message: result.error || 'Failed to update password.' });
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-bg-glow" />
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon" style={{ padding: 0, overflow: 'hidden' }}>
            <img src={logoImg} alt="Huntlo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div className="auth-logo-text">Huntlo<span> OS</span></div>
        </div>

        <h1 className="auth-heading">Set New Password</h1>
        <p className="auth-sub">Please enter your new password below</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          {status.message && (
            <div className={status.type === 'error' ? 'auth-error' : 'auth-success'} style={{
              padding: '12px',
              borderRadius: '8px',
              backgroundColor: status.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
              color: status.type === 'error' ? '#ef4444' : '#22c55e',
              fontSize: '14px',
              marginBottom: '16px',
              border: `1px solid ${status.type === 'error' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)'}`
            }}>
              {status.message}
            </div>
          )}

          <div className="form-group">
            <label className="label">New Password</label>
            <div className="password-wrapper">
              <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', zIndex: 1 }} />
              <input
                className="input-base"
                type={showPw ? 'text' : 'password'}
                placeholder="Enter new password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                style={{ paddingLeft: '36px', paddingRight: '38px' }}
              />
              <button type="button" className="password-toggle" onClick={() => setShowPw(p => !p)}>
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
          
          <div className="form-group">
            <label className="label">Confirm New Password</label>
            <div className="password-wrapper">
              <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', zIndex: 1 }} />
              <input
                className="input-base"
                type={showPw ? 'text' : 'password'}
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                style={{ paddingLeft: '36px', paddingRight: '38px' }}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg w-full"
            disabled={isSubmitting || loading}
          >
            {(isSubmitting || loading) ? <><Loader size={14} className="cc-spinner" /> Updating...</> : 'Update password'}
          </button>
        </form>
      </div>
    </div>
  );
}
