// ============================================
// HUNTLO SALES OS — SIGN UP PAGE (Premium)
// ============================================
import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Loader, CheckCircle, AlertCircle } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
const logoImg = "https://res.cloudinary.com/dxlsyh1qj/image/upload/v1783768087/Group_39_olh8ld.png";
import bgImg from '../../assets/auth_bg.png';
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
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
        <div className="auth-left">
          <img src={bgImg} alt="Background" className="auth-bg-image" />
          <div className="auth-left-content">
            <div className="auth-brand">
              <div className="auth-brand-icon">
                <img src={logoImg} alt="Huntlo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div className="auth-brand-text">Huntlo<span> OS</span></div>
            </div>
          </div>
        </div>
        <div className="auth-right">
          <div className="auth-card" style={{ textAlign: 'center' }}>
            <div style={{ background: 'var(--success-glow)', width: 80, height: 80, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <CheckCircle size={40} color="var(--success)" />
            </div>
            <h2 className="auth-heading">Check your email</h2>
            <p className="auth-sub" style={{ fontSize: 16 }}>
              We sent a confirmation link to <strong>{form.email}</strong>.<br/><br/>
              Click the link to activate your account and start using your workspace.
            </p>
            <Link to="/signin" className="btn btn-primary btn-lg w-full" style={{ marginTop: 32, display: 'flex', justifyContent: 'center' }}>
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
            <h2>{isInvited ? `Join the ${orgName} team.` : 'Sign up to get started.'}</h2>
            <p>{isInvited ? 'Complete your profile to access shared pipelines and collaborate.' : 'Set up your admin account to bring your entire sales operation into one AI-driven platform.'}</p>
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

          <h1 className="auth-heading">
            {isInvited ? `Join ${orgName}` : 'Sign up'}
          </h1>
          <p className="auth-sub">
            {isInvited ? `Complete your profile to join as a ${invitedRole}` : 'No credit card required. Setup takes 2 minutes.'}
          </p>

          <form className="auth-form" onSubmit={handleSubmit}>
            {(error || validationError) && (
              <div className="auth-error">
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{error || validationError}</span>
              </div>
            )}

            <div className="form-group">
              <label className="label" htmlFor="signup-name">Full name</label>
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
              <label className="label" htmlFor="signup-email">Work email</label>
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
              <label className="label" htmlFor="signup-password">Password</label>
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
                  style={{ paddingRight: '42px', width: '100%' }}
                />
                <button type="button" className="password-toggle" onClick={() => setShowPw(p => !p)}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="label" htmlFor="signup-confirm-password">Confirm password</label>
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
              style={{ marginTop: '12px' }}
            >
              {loading ? <><Loader size={16} className="cc-spinner" /> Processing...</> : isInvited ? 'Accept Invite & Join →' : 'Sign up →'}
            </button>
          </form>

          <p className="auth-footer">
            Already have an account? <Link to="/signin">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
