// ============================================
// HUNTLO — ADD TEAM MEMBER MODAL
// Production Grade | Invite via link OR create credentials directly
// ============================================
import { useState, useCallback } from 'react';
import {
  X, Mail, CheckCircle, Copy, Check, Loader,
  AlertCircle, KeyRound, Eye, EyeOff, UserPlus, Link2
} from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import { sendTeamInvitation, generateInviteToken } from '../../lib/resend';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import './InviteModal.css';

// ── Helpers ────────────────────────────────────────────────────
function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button className="im-copy-btn" onClick={handleCopy} type="button" title="Copy to clipboard">
      {copied ? <Check size={13} /> : <Copy size={13} />}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

function TabBtn({ id, active, onClick, icon: Icon, label }) {
  return (
    <button
      type="button"
      className={`im-tab ${active ? 'active' : ''}`}
      onClick={() => onClick(id)}
    >
      <Icon size={14} />
      {label}
    </button>
  );
}

// ── Main Component ─────────────────────────────────────────────
export default function InviteModal({ isOpen, onClose }) {
  const { inviteMember, user, fetchTeam } = useAuthStore();

  // Tab
  const [activeTab, setActiveTab] = useState('invite');

  // --- Send Invite state ---
  const [emails, setEmails] = useState('');
  const [inviteRole, setInviteRole] = useState('Member');

  // --- Create Credentials state ---
  const [createName, setCreateName] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createRole, setCreateRole] = useState('Member');
  const [showPwd, setShowPwd] = useState(false);

  // Shared
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); // { mode, items: [], errors: [] }

  if (!isOpen) return null;

  // ── Handle Invite ──────────────────────────────────────────
  const handleInvite = async (e) => {
    e.preventDefault();
    const emailList = emails
      .split(/[\n,]+/)
      .map(s => s.trim())
      .filter(s => s.includes('@'));

    if (!emailList.length) return;
    setLoading(true);
    setResult(null);

    const inviterName = user?.user_metadata?.full_name || user?.email || 'A team member';
    const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;
    const items = [];

    for (const email of emailList) {
      const token = generateInviteToken();
      const link = `${appUrl}/accept-invite?token=${token}`;
      let dbSaved = false;

      // 1. Save to DB
      try {
        await inviteMember({ email, role: inviteRole, token });
        dbSaved = true;
      } catch (err) {
        items.push({ email, status: 'error', message: err.message, link });
        continue;
      }

      // 2. Try email delivery
      try {
        const emailResult = await sendTeamInvitation({
          toEmail: email,
          toName: email.split('@')[0],
          inviterName,
          role: inviteRole,
          inviteToken: token,
        });
        if (emailResult.success) {
          items.push({ email, status: 'emailed', link });
        } else {
          items.push({ email, status: 'link', link, message: emailResult.error });
        }
      } catch {
        items.push({ email, status: 'link', link });
      }
    }

    await fetchTeam();
    setResult({ mode: 'invite', items });
    setLoading(false);
  };

  // ── Handle Create Credentials ─────────────────────────────
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!createEmail.trim() || createPassword.length < 6) return;
    setLoading(true);
    setResult(null);

    try {
      // Use a separate isolated client so we don't sign out the admin
      const tempClient = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY,
        { auth: { persistSession: false, autoRefreshToken: false } }
      );

      const { data, error } = await tempClient.auth.signUp({
        email: createEmail.trim(),
        password: createPassword,
        options: {
          data: { full_name: createName.trim() || createEmail.split('@')[0] },
        },
      });

      if (error) throw error;

      // Update role in profiles (best effort, may need a moment to propagate)
      if (data?.user?.id) {
        await supabase
          .from('profiles')
          .update({ role: createRole, full_name: createName.trim() || createEmail.split('@')[0] })
          .eq('id', data.user.id);
      }

      await fetchTeam();

      setResult({
        mode: 'create',
        items: [{
          email: createEmail.trim(),
          password: createPassword,
          name: createName.trim() || createEmail.split('@')[0],
          role: createRole,
          status: 'created',
        }],
        errors: [],
      });
    } catch (err) {
      setResult({
        mode: 'create',
        items: [],
        errors: [{ email: createEmail, message: err.message }],
      });
    }

    setLoading(false);
  };

  // ── Reset & Close ─────────────────────────────────────────
  const handleDone = useCallback(() => {
    setEmails('');
    setInviteRole('Member');
    setCreateName('');
    setCreateEmail('');
    setCreatePassword('');
    setCreateRole('Member');
    setResult(null);
    setActiveTab('invite');
    onClose();
  }, [onClose]);

  // ── Result Screen ─────────────────────────────────────────
  if (result) {
    const isCreate = result.mode === 'create';
    const success = result.items?.filter(i => i.status === 'created' || i.status === 'emailed' || i.status === 'link') || [];
    const errors  = result.errors || result.items?.filter(i => i.status === 'error') || [];
    const links   = result.items?.filter(i => i.status === 'link') || [];

    return (
      <div className="invite-modal-overlay" onClick={e => e.target === e.currentTarget && handleDone()}>
        <div className="invite-modal-content im-result">
          <div className="invite-modal-header">
            <div>
              <h2>{isCreate ? '✅ User Created' : '✅ Invitations Sent'}</h2>
              <p>{isCreate
                ? 'Share the credentials below with your team member.'
                : 'Team members have been notified and added to the workspace.'
              }</p>
            </div>
            <button className="drawer-close" onClick={handleDone} type="button"><X size={18} /></button>
          </div>

          <div className="im-result-body">
            {/* Created user credentials */}
            {isCreate && success.length > 0 && success.map((item, i) => (
              <div key={i} className="im-cred-card">
                <div className="im-cred-header">
                  <CheckCircle size={18} color="#16a34a" />
                  <span className="im-cred-name">{item.name}</span>
                  <span className="im-role-badge" data-role={item.role}>{item.role}</span>
                </div>
                <div className="im-cred-row">
                  <span className="im-cred-key">Email</span>
                  <span className="im-cred-val">{item.email}</span>
                  <CopyButton text={item.email} />
                </div>
                <div className="im-cred-row">
                  <span className="im-cred-key">Password</span>
                  <span className="im-cred-val im-cred-pwd">{item.password}</span>
                  <CopyButton text={item.password} />
                </div>
                <div className="im-cred-note">
                  <AlertCircle size={13} />
                  Share these credentials privately (Slack, WhatsApp). They can log in immediately at <strong>{window.location.origin}/signin</strong>
                </div>
              </div>
            ))}

            {/* Emailed invites */}
            {!isCreate && result.items?.filter(i => i.status === 'emailed').length > 0 && (
              <div className="im-result-section">
                <div className="im-result-label success">📧 Invitation emails sent</div>
                {result.items.filter(i => i.status === 'emailed').map((item, i) => (
                  <div key={i} className="im-result-row">
                    <Check size={14} color="#16a34a" />
                    <span>{item.email}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Manual invite links */}
            {!isCreate && links.length > 0 && (
              <div className="im-result-section">
                <div className="im-result-label warn">
                  <Link2 size={13} /> Email not configured — share these invite links manually
                </div>
                {links.map((item, i) => (
                  <div key={i} className="im-link-row">
                    <div className="im-link-info">
                      <span className="im-link-email">{item.email}</span>
                      <span className="im-link-url">{item.link}</span>
                    </div>
                    <CopyButton text={item.link} />
                  </div>
                ))}
              </div>
            )}

            {/* Errors */}
            {errors.length > 0 && (
              <div className="im-result-section">
                <div className="im-result-label error">⚠ Failed</div>
                {errors.map((e, i) => (
                  <div key={i} className="im-result-row error">
                    <AlertCircle size={13} color="#dc2626" />
                    <span>{e.email || e.message}: <em>{e.message}</em></span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="invite-modal-footer">
            <button className="btn btn-ghost" onClick={() => setResult(null)} type="button">
              Add Another
            </button>
            <button className="btn btn-primary" onClick={handleDone} type="button">
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Form Screen ───────────────────────────────────────────
  return (
    <div className="invite-modal-overlay" onClick={e => e.target === e.currentTarget && handleDone()}>
      <div className="invite-modal-content">

        {/* Header */}
        <div className="invite-modal-header">
          <div>
            <h2>Add Team Member</h2>
            <p>Invite via email or create login credentials directly.</p>
          </div>
          <button className="drawer-close" onClick={handleDone} type="button"><X size={18} /></button>
        </div>

        {/* Tabs */}
        <div className="im-tabs">
          <TabBtn id="invite" active={activeTab === 'invite'} onClick={setActiveTab} icon={Mail} label="Send Invite Link" />
          <TabBtn id="create" active={activeTab === 'create'} onClick={setActiveTab} icon={KeyRound} label="Create Credentials" />
        </div>

        {/* ── Tab: Send Invite ─────────────────────── */}
        {activeTab === 'invite' && (
          <form onSubmit={handleInvite} style={{ display: 'contents' }}>
            <div className="invite-modal-body">
              <div className="im-field-group">
                <label className="im-label">Email Addresses</label>
                <textarea
                  className="invite-emails-input"
                  placeholder={'sarah@company.com, john@company.com\nor one per line'}
                  value={emails}
                  onChange={e => setEmails(e.target.value)}
                  rows={4}
                  required
                />
                <p className="im-hint">Separate multiple emails with commas or new lines.</p>
              </div>

              <div className="im-field-group">
                <label className="im-label">Role</label>
                <select className="invite-role-select" value={inviteRole} onChange={e => setInviteRole(e.target.value)}>
                  <option value="Admin">Admin — Full access, can manage team</option>
                  <option value="Member">Member (SDR) — Can create and edit data</option>
                  <option value="Viewer">Viewer — Read-only access</option>
                </select>
              </div>

              <div className="im-info-box">
                <Mail size={14} />
                <span>An invite link will be saved to your workspace and emailed if email is configured. They must click the link to activate their account.</span>
              </div>
            </div>

            <div className="invite-modal-footer">
              <button type="button" className="btn btn-ghost" onClick={handleDone}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={loading || !emails.trim()}>
                {loading
                  ? <><Loader size={15} className="cc-spinner" /> Sending…</>
                  : <><UserPlus size={15} /> Send Invites</>
                }
              </button>
            </div>
          </form>
        )}

        {/* ── Tab: Create Credentials ───────────────── */}
        {activeTab === 'create' && (
          <form onSubmit={handleCreate} style={{ display: 'contents' }}>
            <div className="invite-modal-body">
              <div className="im-two-col">
                <div className="im-field-group">
                  <label className="im-label">Full Name</label>
                  <input
                    type="text"
                    className="input-base"
                    placeholder="e.g. Rahul Sharma"
                    value={createName}
                    onChange={e => setCreateName(e.target.value)}
                  />
                </div>
                <div className="im-field-group">
                  <label className="im-label">Role</label>
                  <select className="invite-role-select" value={createRole} onChange={e => setCreateRole(e.target.value)}>
                    <option value="Admin">Admin</option>
                    <option value="Member">Member (SDR)</option>
                    <option value="Viewer">Viewer</option>
                  </select>
                </div>
              </div>

              <div className="im-field-group">
                <label className="im-label">Work Email *</label>
                <input
                  type="email"
                  className="input-base"
                  placeholder="rahul@yourcompany.com"
                  value={createEmail}
                  onChange={e => setCreateEmail(e.target.value)}
                  required
                />
              </div>

              <div className="im-field-group">
                <label className="im-label">Initial Password *</label>
                <div className="im-pwd-wrap">
                  <input
                    type={showPwd ? 'text' : 'password'}
                    className="input-base"
                    placeholder="Min. 6 characters"
                    value={createPassword}
                    onChange={e => setCreatePassword(e.target.value)}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    className="im-pwd-toggle"
                    onClick={() => setShowPwd(v => !v)}
                    tabIndex={-1}
                  >
                    {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {createPassword.length > 0 && createPassword.length < 6 && (
                  <p className="im-hint error">Password must be at least 6 characters.</p>
                )}
              </div>

              <div className="im-info-box success">
                <KeyRound size={14} />
                <span>
                  The user account is created instantly. Share the <strong>email + password</strong> with your SDR via Slack or WhatsApp — they can log in right away at <strong>{window.location.origin}/signin</strong>.
                  They can change their password from Settings after first login.
                </span>
              </div>
            </div>

            <div className="invite-modal-footer">
              <button type="button" className="btn btn-ghost" onClick={handleDone}>Cancel</button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || !createEmail.trim() || createPassword.length < 6}
              >
                {loading
                  ? <><Loader size={15} className="cc-spinner" /> Creating…</>
                  : <><KeyRound size={15} /> Create User</>
                }
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
