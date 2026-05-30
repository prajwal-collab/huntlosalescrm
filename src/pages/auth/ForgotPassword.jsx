// ============================================
// HUNTLO SALES OS — FORGOT PASSWORD PAGE
// ============================================
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Loader, ArrowLeft, Mail } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import logoImg from '../../assets/logo.png';
import './Auth.css';

export default function ForgotPassword() {
  const { resetPassword, loading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: '', message: '' });
    setIsSubmitting(true);
    
    const result = await resetPassword(email);
    
    setIsSubmitting(false);
    
    if (result.success) {
      setStatus({ 
        type: 'success', 
        message: 'Password reset link sent! Check your email.' 
      });
      setEmail('');
    } else {
      setStatus({ 
        type: 'error', 
        message: result.error || 'Failed to send reset link.' 
      });
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

        <h1 className="auth-heading">Reset Password</h1>
        <p className="auth-sub">Enter your email and we'll send you a reset link</p>

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
            <label className="label">Email address</label>
            <div className="input-with-icon" style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                className="input-base"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                style={{ paddingLeft: '36px' }}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg w-full"
            disabled={isSubmitting || loading}
          >
            {(isSubmitting || loading) ? <><Loader size={14} className="cc-spinner" /> Sending link...</> : 'Send reset link'}
          </button>
        </form>

        <p className="auth-footer" style={{ marginTop: '24px' }}>
          <Link to="/signin" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <ArrowLeft size={14} /> Back to Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
