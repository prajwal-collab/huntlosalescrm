// ============================================
// HUNTLO SALES OS — FORGOT PASSWORD PAGE
// ============================================
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Loader, ArrowLeft, Mail, AlertCircle } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import logoImg from '../../assets/logo.png';
import bgImg from '../../assets/auth_bg.png';
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
            <h2>Forgot your password?</h2>
            <p>No worries, we'll send you instructions to reset it securely.</p>
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

          <h1 className="auth-heading">Reset Password</h1>
          <p className="auth-sub">Enter your email and we'll send you a reset link</p>

          <form className="auth-form" onSubmit={handleSubmit}>
            {status.message && (
              <div className={status.type === 'error' ? 'auth-error' : 'auth-success'}>
                {status.type === 'error' ? <AlertCircle size={16} /> : null}
                <span>{status.message}</span>
              </div>
            )}

            <div className="form-group">
              <label className="label">Email address</label>
              <div className="input-with-icon" style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                <input
                  className="input-base"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  style={{ paddingLeft: '44px', width: '100%' }}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg w-full"
              disabled={isSubmitting || loading}
              style={{ marginTop: '12px' }}
            >
              {(isSubmitting || loading) ? <><Loader size={16} className="cc-spinner" /> Sending link...</> : 'Send reset link →'}
            </button>
          </form>

          <p className="auth-footer" style={{ marginTop: '32px' }}>
            <Link to="/signin" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <ArrowLeft size={16} /> Back to Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
