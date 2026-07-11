// ============================================
// HUNTLO SALES OS — SIGN IN PAGE (Premium)
// ============================================
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Loader, AlertCircle } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
const logoImg = "https://res.cloudinary.com/dxlsyh1qj/image/upload/v1783768087/Group_39_olh8ld.png";
import bgImg from '../../assets/auth_bg.png';
import './Auth.css';

export default function SignIn() {
  const { signIn, error, loading, clearError } = useAuthStore();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);

  const handleChange = (field) => (e) => {
    clearError();
    setForm(f => ({ ...f, [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    const result = await signIn(form.email, form.password);
    if (result.success) navigate('/');
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
            <h2>Welcome back.</h2>
            <p>Access your pipeline, follow up with hot leads, and close more deals with Huntlo's AI-driven Sales OS.</p>
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

          <h1 className="auth-heading">Sign in</h1>
          <p className="auth-sub">Enter your details to access your workspace.</p>

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            {error && (
              <div className="auth-error">
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            <div className="form-group">
              <label className="label" htmlFor="signin-email">Email address</label>
              <input
                id="signin-email"
                className="input-base"
                type="email"
                placeholder="you@company.com"
                value={form.email}
                onChange={handleChange('email')}
                required
                autoComplete="email"
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="label" htmlFor="signin-password">Password</label>
              <div className="password-wrapper">
                <input
                  id="signin-password"
                  className="input-base"
                  type={showPw ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={handleChange('password')}
                  required
                  autoComplete="current-password"
                  style={{ paddingRight: '42px', width: '100%' }}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPw(p => !p)}
                  tabIndex={-1}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                <Link to="/forgot-password" className="auth-link" style={{ fontSize: '13px' }}>
                  Forgot password?
                </Link>
              </div>
            </div>

            <button
              id="signin-submit"
              type="submit"
              className="btn btn-primary btn-lg w-full"
              disabled={loading}
              style={{ marginTop: '12px' }}
            >
              {loading
                ? <><Loader size={16} className="cc-spinner" /> Signing in…</>
                : 'Sign in →'}
            </button>
          </form>

          <p className="auth-footer">
            Don't have an account?{' '}
            <Link to="/signup">Create workspace</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
