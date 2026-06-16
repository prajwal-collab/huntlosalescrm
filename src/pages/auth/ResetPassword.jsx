// ============================================
// HUNTLO SALES OS — RESET PASSWORD PAGE
// ============================================
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader, Eye, EyeOff, Lock, AlertCircle } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import logoImg from '../../assets/logo.png';
import bgImg from '../../assets/auth_bg.png';
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
      {/* Left Branding Panel */}
      <div className="auth-left">
        <img src={bgImg} alt="Background" className="auth-bg-image" />
        <div className="auth-left-content">
          <div className="auth-brand">
            <div className="auth-brand-icon">
              <img src={logoImg} alt="Huntlo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div className="auth-brand-text">Huntlo<span> OS</span></div>
          </div>
          <div className="auth-value-prop">
            <h2>Secure your account.</h2>
            <p>Set a strong password to protect your workspace and sensitive data.</p>
          </div>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="auth-right">
        <div className="auth-card">
          <div className="auth-mobile-logo">
            <div className="auth-brand-icon" style={{ width: 32, height: 32 }}>
              <img src={logoImg} alt="Huntlo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div className="auth-brand-text" style={{ fontSize: 20 }}>Huntlo<span> OS</span></div>
          </div>

          <h1 className="auth-heading">Set New Password</h1>
          <p className="auth-sub">Please enter your new password below</p>

          <form className="auth-form" onSubmit={handleSubmit}>
            {status.message && (
              <div className={status.type === 'error' ? 'auth-error' : 'auth-success'}>
                {status.type === 'error' ? <AlertCircle size={16} /> : null}
                <span>{status.message}</span>
              </div>
            )}

            <div className="form-group">
              <label className="label" htmlFor="new-password">New Password</label>
              <div className="password-wrapper">
                <Lock size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', zIndex: 1 }} />
                <input
                  id="new-password"
                  name="new-password"
                  autoComplete="new-password"
                  className="input-base"
                  type={showPw ? 'text' : 'password'}
                  placeholder="Enter new password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  style={{ paddingLeft: '44px', paddingRight: '42px', width: '100%' }}
                />
                <button type="button" className="password-toggle" onClick={() => setShowPw(p => !p)}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            
            <div className="form-group">
              <label className="label" htmlFor="confirm-password">Confirm New Password</label>
              <div className="password-wrapper">
                <Lock size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', zIndex: 1 }} />
                <input
                  id="confirm-password"
                  name="confirm-password"
                  autoComplete="new-password"
                  className="input-base"
                  type={showPw ? 'text' : 'password'}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                  style={{ paddingLeft: '44px', paddingRight: '42px', width: '100%' }}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg w-full"
              disabled={isSubmitting || loading}
              style={{ marginTop: '12px' }}
            >
              {(isSubmitting || loading) ? <><Loader size={16} className="cc-spinner" /> Updating...</> : 'Update password →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
