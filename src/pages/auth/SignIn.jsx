// ============================================
// HUNTLO SALES OS — SIGN IN PAGE
// ============================================
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Sparkles, Eye, EyeOff, Loader } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import logoImg from '../../assets/logo.png';
import './Auth.css';

export default function SignIn() {
  const { signIn, error, loading, clearError, isDemo } = useAuthStore();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);

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
        <div className="auth-logo">
          <div className="auth-logo-icon" style={{ padding: 0, overflow: 'hidden' }}>
            <img src={logoImg} alt="Huntlo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div className="auth-logo-text">Huntlo<span> OS</span></div>
        </div>

        <h1 className="auth-heading">Welcome back</h1>
        <p className="auth-sub">Sign in to your Sales OS workspace</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error && <div className="auth-error">{error}</div>}

          <div className="form-group">
            <label className="label">Email address</label>
            <input
              id="signin-email"
              className="input-base"
              type="email"
              placeholder="you@company.com"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="label">Password</label>
            <div className="password-wrapper">
              <input
                id="signin-password"
                className="input-base"
                type={showPw ? 'text' : 'password'}
                placeholder="Enter your password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                required
                autoComplete="current-password"
                style={{ paddingRight: '38px' }}
              />
              <button type="button" className="password-toggle" onClick={() => setShowPw(p => !p)}>
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
          >
            {loading ? <><Loader size={14} className="cc-spinner" /> Signing in...</> : 'Sign in'}
          </button>
        </form>

        <p className="auth-footer">
          Don't have an account? <Link to="/signup">Create workspace</Link>
        </p>
      </div>
    </div>
  );
}
