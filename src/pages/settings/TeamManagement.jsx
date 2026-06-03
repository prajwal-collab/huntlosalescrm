// ============================================
// HUNTLO SALES OS — TEAM MANAGEMENT COMPONENT
// ============================================
import { useState } from 'react';
import { Mail, Plus, Shield, Loader, CheckCircle } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import { sendTeamInvitation, generateInviteToken } from '../../lib/resend';

export default function TeamManagement() {
  const { team, inviteMember, removeMember, updateMemberRole, user } = useAuthStore();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Member');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setStatus(null);

    const token = generateInviteToken();
    const inviterName = user?.user_metadata?.full_name || user?.email || 'A team member';

    const result = await sendTeamInvitation({
      toEmail: email,
      toName: email.split('@')[0],
      inviterName,
      role,
      inviteToken: token
    });

    if (result.success) {
      inviteMember({ email, role });
      setStatus({ type: 'success', message: result.demo ? 'Demo: Invite added (no email sent).' : 'Invitation sent successfully!' });
      setEmail('');
      setTimeout(() => { setInviteOpen(false); setStatus(null); }, 2000);
    } else {
      setStatus({ type: 'error', message: result.error || 'Failed to send invitation.' });
    }
    setLoading(false);
  };

  return (
    <div className="settings-panel animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h2 className="panel-title">Team Management</h2>
          <p className="panel-sub">Manage your workspace members and their roles.</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setInviteOpen(true)}>
          <Plus size={13} /> Invite Member
        </button>
      </div>

      {inviteOpen && (
        <div className="invite-box" style={{ background: 'var(--bg-elevated)', padding: 16, borderRadius: 8, marginBottom: 24, border: '1px solid var(--accent-blue)' }}>
          <h3 className="text-sm font-semibold mb-3">Invite new member</h3>
          <form className="flex gap-3 items-center" onSubmit={handleInvite}>
            <input 
              type="email" 
              className="input-base" 
              placeholder="colleague@company.com" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required 
            />
            <select className="input-base" style={{ width: 140 }} value={role} onChange={e => setRole(e.target.value)}>
              <option value="Admin">Admin</option>
              <option value="Member">Member</option>
              <option value="Viewer">Viewer</option>
            </select>
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? <Loader size={14} className="cc-spinner" /> : <><Mail size={13} /> Send Invite</>}
            </button>
            <button className="btn btn-ghost" type="button" onClick={() => setInviteOpen(false)}>Cancel</button>
          </form>
          {status && (
            <div className={`mt-3 p-2 rounded text-sm ${status.type === 'success' ? 'bg-success-glow text-success border-success' : 'bg-danger-glow text-danger border-danger'}`} style={{ border: '1px solid' }}>
              {status.message}
            </div>
          )}
        </div>
      )}

      <div className="team-list" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {team.map(member => (
          <div key={member.id} className="team-member-row" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 16px', background: 'var(--bg-elevated)', borderRadius: 8, border: '1px solid var(--bg-border)' }}>
            <div className="avatar avatar-md" style={{ background: member.color, color: '#fff' }}>
              {member.initials}
            </div>
            <div style={{ flex: 1 }}>
              <div className="text-sm font-medium text-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {member.name}
                {member.status === 'invited' && <span className="badge badge-yellow">Pending Invite</span>}
              </div>
              <div className="text-xs text-tertiary">{member.email}</div>
            </div>
            <select 
              className="input-base" 
              style={{ width: 120, padding: '4px 8px', fontSize: 12 }} 
              value={member.role}
              onChange={(e) => updateMemberRole(member.id, e.target.value)}
            >
              <option value="Admin">Admin</option>
              <option value="Member">Member</option>
              <option value="Viewer">Viewer</option>
            </select>
            <button className="btn btn-ghost btn-sm text-danger" onClick={() => removeMember(member.id)}>Remove</button>
          </div>
        ))}
      </div>
    </div>
  );
}
