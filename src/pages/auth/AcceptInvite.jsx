// ============================================
// HUNTLO SALES OS — ACCEPT INVITATION PAGE
// ============================================
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Mail, Shield, CheckCircle, AlertCircle, Loader, ArrowRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import logoImg from '../../assets/logo.png';
import bgImg from '../../assets/auth_bg.png';
import './Auth.css';

export default function AcceptInvite() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [invite, setInvite] = useState(null);

  useEffect(() => {
    async function verifyInvite() {
      if (!token) {
        setError('No invitation token was provided. Please check your link.');
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .rpc('verify_invitation_token', { p_token: token })
          .single();

        if (error || !data) {
          setError('Invalid or expired invitation token.');
        } else if (data.accepted_at) {
          setError('This invitation has already been accepted.');
        } else {
          setInvite(data);
        }
      } catch (err) {
        console.error('Error verifying invite:', err);
        setError('An unexpected error occurred. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    verifyInvite();
  }, [token]);

  const handleAccept = () => {
    if (!invite) return;
    const email = encodeURIComponent(invite.email);
    const orgId = encodeURIComponent(invite.organization_id);
    const role = encodeURIComponent(invite.role);
    const orgName = encodeURIComponent(invite.organization_name || 'Workspace');
    const inviteToken = encodeURIComponent(token);

    navigate(`/signup?email=${email}&org_id=${orgId}&role=${role}&token=${inviteToken}&org_name=${orgName}`);
  };

  if (loading) {
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
            <Loader size={40} className="cc-spinner" style={{ margin: '0 auto 24px', color: 'var(--accent-blue)' }} />
            <h2 className="auth-heading">Verifying invitation...</h2>
            <p className="auth-sub">Checking secure token</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
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
            <div style={{ background: 'var(--danger-glow)', width: 80, height: 80, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <AlertCircle size={40} color="var(--danger)" />
            </div>
            <h2 className="auth-heading">Invite Error</h2>
            <p className="auth-sub" style={{ fontSize: 16 }}>{error}</p>
            <Link to="/signin" className="btn btn-primary btn-lg w-full" style={{ marginTop: 24, display: 'flex', justifyContent: 'center' }}>
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
            <h2>You've been invited.</h2>
            <p>Join your team's workspace to start collaborating on deals and managing pipelines together.</p>
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

          <h1 className="auth-heading">Accept Invite</h1>
          <p className="auth-sub">Review your invitation details before joining.</p>

          <div className="invite-details-premium">
            <div className="invite-row">
              <div className="invite-icon-box" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa' }}>
                <Shield size={20} />
              </div>
              <div>
                <div className="invite-label">Workspace</div>
                <div className="invite-value">{invite?.organization_name}</div>
              </div>
            </div>

            <div className="invite-row">
              <div className="invite-icon-box" style={{ background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-secondary)' }}>
                <Mail size={20} />
              </div>
              <div>
                <div className="invite-label">Your Email</div>
                <div className="invite-value">{invite?.email}</div>
              </div>
            </div>

            <div className="invite-row">
              <div className="invite-icon-box" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#34d399' }}>
                <CheckCircle size={20} />
              </div>
              <div>
                <div className="invite-label">Assigned Role</div>
                <div className="invite-value" style={{ color: '#34d399' }}>{invite?.role}</div>
              </div>
            </div>
          </div>

          <button 
            onClick={handleAccept}
            className="btn btn-primary btn-lg w-full" 
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            Complete Profile to Join <ArrowRight size={18} />
          </button>

          <p className="auth-footer" style={{ marginTop: 24 }}>
            Invited to a different account? <Link to="/signin">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
