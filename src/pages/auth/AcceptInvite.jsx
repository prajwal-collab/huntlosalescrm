// ============================================
// HUNTLO SALES OS — ACCEPT INVITATION PAGE
// ============================================
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Mail, Shield, CheckCircle, AlertCircle, Loader, ArrowRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import logoImg from '../../assets/logo.png';
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
        <div className="auth-bg-glow" />
        <div className="auth-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <Loader size={36} className="cc-spinner" style={{ margin: '0 auto 16px', color: 'var(--accent-blue)' }} />
          <h2 className="auth-heading" style={{ fontSize: '18px' }}>Verifying your invitation...</h2>
          <p className="auth-sub">Please wait while we check our secure servers.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="auth-shell">
        <div className="auth-bg-glow" />
        <div className="auth-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <AlertCircle size={48} color="var(--danger)" style={{ margin: '0 auto 20px' }} />
          <h2 className="auth-heading">{error}</h2>
          <p className="auth-sub">Ask your workspace administrator to send a new invite if necessary.</p>
          <Link to="/signin" className="btn btn-primary btn-md w-full" style={{ marginTop: 24, display: 'flex', justifyContent: 'center' }}>
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

        <h1 className="auth-heading">Join the workspace</h1>
        <p className="auth-sub" style={{ marginBottom: 24 }}>You have been invited to join a collaborative sales team.</p>

        <div className="invite-details-box" style={{ 
          background: 'rgba(255, 255, 255, 0.03)', 
          border: '1px solid var(--bg-border)', 
          borderRadius: '12px', 
          padding: '20px', 
          marginBottom: '28px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--accent-blue-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-blue)' }}>
              <Shield size={16} />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Workspace</div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>{invite?.organization_name}</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
              <Mail size={16} />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Your Email</div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>{invite?.email}</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--success)' }}>
              <CheckCircle size={16} />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Assigned Role</div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--success)' }}>{invite?.role}</div>
            </div>
          </div>
        </div>

        <button 
          onClick={handleAccept}
          className="btn btn-primary btn-lg w-full" 
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
        >
          Create Account & Join Workspace <ArrowRight size={16} />
        </button>

        <p className="auth-footer" style={{ marginTop: 24 }}>
          Invited to a different account? <Link to="/signin">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
