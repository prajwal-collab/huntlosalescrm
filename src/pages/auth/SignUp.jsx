// ============================================
// HUNTLO SALES OS — SIGN UP PAGE
// ============================================
import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Sparkles, Eye, EyeOff, Loader, CheckCircle } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import logoImg from '../../assets/logo.png';
import './Auth.css';

export default function SignUp() {
  const { signUp, error, loading, clearError } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const invitedEmail = searchParams.get('email') || '';
  const invitedOrgId = searchParams.get('org_id') || '';
  const invitedRole = searchParams.get('role') || '';
  const inviteToken = searchParams.get('token') || '';
  const orgName = searchParams.get('org_name') || '';
  const isInvited = !!inviteToken;

  const [form, setForm] = useState({ fullName: '', email: invitedEmail, password: '', confirmPassword: '' });
  const [showPw, setShowPw] = useState(false);
  const [success, setSuccess] = useState(false);
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    if (invitedEmail) {
      setForm(f => ({ ...f, email: invitedEmail }));
    }
  }, [invitedEmail]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    setValidationError('');

    if (form.password.length < 8) {
      setValidationError('Password must be at least 8 characters.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setValidationError('Passwords do not match.');
      return;
    }

    const metadata = isInvited ? {
      organization_id: invitedOrgId,
      role: invitedRole,
      invite_token: inviteToken
    } : {};

    const result = await signUp(form.email, form.password, form.fullName, metadata);
    if (result.success) {
      if (result.needsConfirmation) {
        setSuccess(true);
      } else {
        navigate('/');
      }
    }
  };

  if (success) {
    return (
      <div className="auth-shell">
        <div className="auth-bg-glow" />
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <CheckCircle size={48} color="var(--success)" style={{ margin: '0 auto 20px' }} />
          <h2 className="auth-heading">Check your email</h2>
          <p className="auth-sub">
            We sent a confirmation link to <strong>{form.email}</strong>.
            Click it to activate your account.
          </p>
          <Link to="/signin" className="btn btn-primary btn-lg w-full" style={{ marginTop: 24, display: 'flex', justifyContent: 'center' }}>
            Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

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

        <h1 className="auth-heading">
          {isInvited ? `Join ${orgName}` : 'Create your workspace'}
        </h1>
        <p className="auth-sub">
          {isInvited ? `Join as an onboarding ${invitedRole} of the team` : 'Start running sales operations at enterprise speed'}
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          {(error || validationError) && (
            <div className="auth-error">{error || validationError}</div>
          )}

          <div className="form-group">
            <label className="label">Full name</label>
            <input
              id="signup-name"
              className="input-base"
              type="text"
              placeholder="Alex Reid"
              value={form.fullName}
              onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
              required
              autoComplete="name"
            />
          </div>

          <div className="form-group">
            <label className="label">Work email</label>
            <input
              id="signup-email"
              className="input-base"
              type="email"
              placeholder="you@company.com"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              required
              autoComplete="email"
              disabled={isInvited}
              style={isInvited ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
            />
          </div>

          <div className="form-group">
            <label className="label">Password</label>
            <div className="password-wrapper">
              <input
                id="signup-password"
                className="input-base"
                type={showPw ? 'text' : 'password'}
                placeholder="At least 8 characters"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                required
                autoComplete="new-password"
                style={{ paddingRight: '38px' }}
              />
              <button type="button" className="password-toggle" onClick={() => setShowPw(p => !p)}>
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="label">Confirm password</label>
            <input
              id="signup-confirm-password"
              className="input-base"
              type="password"
              placeholder="Repeat password"
              value={form.confirmPassword}
              onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
              required
              autoComplete="new-password"
            />
          </div>

          <button
            id="signup-submit"
            type="submit"
            className="btn btn-primary btn-lg w-full"
            disabled={loading}
          >
            {loading ? <><Loader size={14} className="cc-spinner" /> Joining workspace...</> : isInvited ? 'Accept Invite & Join →' : 'Create workspace →'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/signin">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
