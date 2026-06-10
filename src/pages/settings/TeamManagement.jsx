// ============================================
// HUNTLO SALES OS — TEAM MANAGEMENT COMPONENT
// ============================================
import { useState, useEffect } from 'react';
import { Mail, Plus, Shield, Loader, CheckCircle } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import { sendTeamInvitation, generateInviteToken } from '../../lib/resend';
import { useDialog } from '../../context/DialogContext';
import { supabase } from '../../lib/supabase';

export default function TeamManagement() {
  const { team, inviteMember, removeMember, updateMemberRole, user, fetchTeam } = useAuthStore();
  const { showSuccess, showError, showConfirm } = useDialog();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Member');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

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

    try {
      await inviteMember({ email, role, token });
      const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;
      const shareLink = `${appUrl}/accept-invite?token=${token}`;

      if (result.success) {
        showSuccess(
          'Invitation Sent',
          `An invitation has been sent to ${email}.${result.demo ? ' (Demo mode: no real email sent)' : ''}`
        );
        setEmail('');
        setInviteOpen(false);
      } else {
        await showSuccess(
          'Invitation Created',
          `The invitation has been successfully created in the database, but we couldn't send the automated email (${result.error || 'Email service not configured'}).\n\nShare this registration link manually:\n\n${shareLink}`
        );
        setEmail('');
        setInviteOpen(false);
      }
    } catch (err) {
      showError('Failed to Create Invite', err.message || 'Could not save invitation to database.');
    } finally {
      setLoading(false);
    }
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
              onChange={async (e) => {
                const targetRole = e.target.value;
                const confirmed = await showConfirm(
                  'Change Member Role',
                  `Are you sure you want to change this member's role to ${targetRole}?`
                );
                if (confirmed) {
                  try {
                    await updateMemberRole(member.id, targetRole);
                    showSuccess('Role Updated', 'Member role has been changed successfully.');
                  } catch (err) {
                    showError('Failed to Update Role', err.message);
                  }
                }
              }}
            >
              <option value="Admin">Admin</option>
              <option value="Member">Member</option>
              <option value="Viewer">Viewer</option>
            </select>
            {member.status === 'invited' && (
              <button 
                className="btn btn-ghost btn-sm text-primary" 
                onClick={async () => {
                  try {
                    const { data, error } = await supabase
                      .from('invitations')
                      .select('token')
                      .eq('id', member.id)
                      .maybeSingle();

                    let token = data?.token;
                    if (!token) {
                      token = member.token || Math.random().toString(36).substring(2);
                    }

                    const inviterName = user?.user_metadata?.full_name || user?.email || 'A team member';
                    
                    const result = await sendTeamInvitation({
                      toEmail: member.email,
                      toName: member.name || member.email.split('@')[0],
                      inviterName,
                      role: member.role,
                      inviteToken: token
                    });

                    const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;
                    const shareLink = `${appUrl}/accept-invite?token=${token}`;

                    if (result.success) {
                      showSuccess(
                        'Invitation Resent',
                        `Invitation email has been resent to ${member.email}.${result.demo ? ' (Demo mode: no real email sent)' : ''}`
                      );
                    } else {
                      await showSuccess(
                        'Copy Invitation Link',
                        `We couldn't send the email automatically (${result.error || 'Email service not configured'}).\n\nShare this registration link manually:\n\n${shareLink}`
                      );
                    }
                  } catch (err) {
                    showError('Failed to Resend', err.message || 'Could not fetch invitation token.');
                  }
                }}
              >
                Resend
              </button>
            )}
            <button 
              className="btn btn-ghost btn-sm text-danger" 
              onClick={async () => {
                const confirmed = await showConfirm(
                  'Remove Team Member',
                  `Are you sure you want to remove ${member.name || member.email} from this workspace?`
                );
                if (confirmed) {
                  try {
                    await removeMember(member.id);
                    showSuccess('Member Removed', 'Team member has been removed successfully.');
                  } catch (err) {
                    showError('Failed to Remove Member', err.message);
                  }
                }
              }}
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
