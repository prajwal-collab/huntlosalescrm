// ============================================
// HUNTLO SALES OS — SIGN IN PAGE (Production)
// ============================================
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Loader, AlertCircle } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import logoImg from '../../assets/logo.png';
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
      <div className="auth-bg-glow" />
      <div className="auth-card">

        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <img src={logoImg} alt="Huntlo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div className="auth-logo-text">Huntlo<span> OS</span></div>
        </div>

        <h1 className="auth-heading">Welcome back</h1>
        <p className="auth-sub">Sign in to your Sales OS workspace</p>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {error && (
            <div className="auth-error">
              <AlertCircle size={14} />
              {error}
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
                style={{ paddingRight: '42px' }}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPw(p => !p)}
                tabIndex={-1}
                aria-label={showPw ? 'Hide password' : 'Show password'}
              >
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Link to="/forgot-password" className="auth-link" style={{ fontSize: 'var(--text-sm)' }}>
              Forgot password?
            </Link>
          </div>

          <button
            id="signin-submit"
            type="submit"
            className="btn btn-primary btn-lg w-full"
            disabled={loading}
            style={{ marginTop: '4px' }}
          >
            {loading
              ? <><Loader size={14} className="cc-spinner" /> Signing in…</>
              : 'Sign in'}
          </button>
        </form>

        <p className="auth-footer">
          Don't have an account?{' '}
          <Link to="/signup">Create workspace</Link>
        </p>
      </div>
    </div>
  );
}
