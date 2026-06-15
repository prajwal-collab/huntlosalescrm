import { useState } from 'react';
import { X, Mail, CheckCircle, Copy, Check, Loader, Users } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import { sendTeamInvitation, generateInviteToken } from '../../lib/resend';
import './InviteModal.css';

export default function InviteModal({ isOpen, onClose }) {
  const { inviteMember, user } = useAuthStore();
  const [emails, setEmails] = useState('');
  const [role, setRole] = useState('Member');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null); // { success: [], manual: [] }

  if (!isOpen) return null;

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!emails.trim()) return;
    
    setLoading(true);
    setResults(null);

    const emailList = emails.split(',').map(e => e.trim()).filter(e => e.includes('@'));
    const successList = [];
    const manualList = [];

    const inviterName = user?.user_metadata?.full_name || user?.email || 'A team member';
    const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;

    for (const email of emailList) {
      try {
        const token = generateInviteToken();
        const resendResult = await sendTeamInvitation({
          toEmail: email,
          toName: email.split('@')[0],
          inviterName,
          role,
          inviteToken: token
        });

        await inviteMember({ email, role, token });

        if (resendResult.success) {
          successList.push({ email });
        } else {
          manualList.push({ email, link: `${appUrl}/accept-invite?token=${token}` });
        }
      } catch (err) {
        console.error(`Failed to invite ${email}:`, err);
        // Fallback to manual if insert succeeded but resend threw
      }
    }

    setResults({ success: successList, manual: manualList });
    setLoading(false);
  };

  const handleCopy = (link, idx) => {
    navigator.clipboard.writeText(link);
    const btns = document.querySelectorAll('.invite-copy-btn');
    if (btns[idx]) {
      const originalText = btns[idx].innerHTML;
      btns[idx].innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> Copied';
      btns[idx].style.color = '#16a34a';
      setTimeout(() => {
        if (btns[idx]) {
          btns[idx].innerHTML = originalText;
          btns[idx].style.color = '';
        }
      }, 2000);
    }
  };

  return (
    <div className="invite-modal-overlay">
      <div className="invite-modal-content">
        {!results ? (
          <>
            <div className="invite-modal-header">
              <div>
                <h2>Invite Team Members</h2>
                <p>Add colleagues to your workspace to collaborate.</p>
              </div>
              <button className="drawer-close" onClick={onClose}><X size={18} /></button>
            </div>
            
            <form onSubmit={handleInvite} style={{ display: 'contents' }}>
              <div className="invite-modal-body">
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 8, color: 'var(--text-secondary)' }}>
                  Email Addresses
                </label>
                <textarea 
                  className="invite-emails-input"
                  placeholder="e.g. sarah@company.com, john@company.com"
                  value={emails}
                  onChange={e => setEmails(e.target.value)}
                  required
                />
                <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 8 }}>
                  Separate multiple emails with commas.
                </p>

                <select className="invite-role-select" value={role} onChange={e => setRole(e.target.value)}>
                  <option value="Admin">Admin (Full Access)</option>
                  <option value="Member">Member (Can edit data)</option>
                  <option value="Viewer">Viewer (Read-only)</option>
                </select>
              </div>

              <div className="invite-modal-footer">
                <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading || !emails.trim()}>
                  {loading ? <Loader size={16} className="cc-spinner" /> : <><Mail size={16} /> Send Invites</>}
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="invite-success-view">
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
              <div style={{ background: 'rgba(34,197,94,0.1)', padding: 16, borderRadius: '50%' }}>
                <CheckCircle size={40} color="#16a34a" />
              </div>
            </div>
            <h3>Invitations Processed</h3>
            <p>We've successfully processed your invites.</p>

            <div style={{ textAlign: 'left', marginTop: 24 }}>
              {results.success.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <h4 style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>Emails Sent To:</h4>
                  {results.success.map((s, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--text-primary)', marginBottom: 6 }}>
                      <Check size={14} color="#16a34a" /> {s.email}
                    </div>
                  ))}
                </div>
              )}

              {results.manual.length > 0 && (
                <div>
                  <h4 style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>Manual Links (Email delivery unavailable):</h4>
                  {results.manual.map((m, i) => (
                    <div key={i} className="invite-copy-box" style={{ marginBottom: 8 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 2 }}>{m.email}</div>
                        <div className="invite-copy-text">{m.link}</div>
                      </div>
                      <button className="invite-copy-btn" onClick={() => handleCopy(m.link, i)}>
                        <Copy size={14} style={{ marginRight: 4 }} /> Copy
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button className="btn btn-primary" style={{ width: '100%', marginTop: 32 }} onClick={() => {
              onClose();
              setEmails('');
              setResults(null);
            }}>
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
