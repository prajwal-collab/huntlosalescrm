// ============================================
// HUNTLO — TEAM MANAGEMENT SETTINGS
// Production Grade | Full member tracking + onboarding
// ============================================
import { useState, useEffect, useMemo } from 'react';
import {
  Plus, Activity, BarChart3, Users, ChevronRight,
  ShieldCheck, Eye, UserX, RefreshCw, Send, Clock,
  CheckCircle, AlertTriangle, XCircle, Search, Crown,
  Briefcase, User
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';
import useDataStore from '../../store/useDataStore';
import { sendTeamInvitation } from '../../lib/resend';
import { useDialog } from '../../context/DialogContext';
import { supabase } from '../../lib/supabase';
import InviteModal from '../../components/auth/InviteModal';
import { formatDistanceToNow } from 'date-fns';

// ── Role config ────────────────────────────────────────────────
const ROLE_CONFIG = {
  Admin:   { label: 'Admin',   color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)',  icon: Crown },
  Manager: { label: 'Manager', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  icon: Users },
  AE:      { label: 'AE',      color: '#10b981', bg: 'rgba(16,185,129,0.1)',  icon: Briefcase },
  SDR:     { label: 'SDR',     color: '#3b82f6', bg: 'rgba(59,130,246,0.1)',  icon: User },
  Viewer:  { label: 'Viewer',  color: '#64748b', bg: 'rgba(100,116,139,0.1)', icon: Eye   },
};

function RoleBadge({ role }) {
  const cfg = ROLE_CONFIG[role] || ROLE_CONFIG.SDR;
  const Icon = cfg.icon;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 8px', borderRadius: 99,
      fontSize: 11, fontWeight: 700, letterSpacing: '0.03em',
      background: cfg.bg, color: cfg.color,
    }}>
      <Icon size={10} /> {cfg.label}
    </span>
  );
}

function ActivityDot({ isActive }) {
  return (
    <span style={{
      display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
      background: isActive ? '#16a34a' : '#94a3b8',
      boxShadow: isActive ? '0 0 6px rgba(22,163,74,0.5)' : 'none',
      flexShrink: 0,
    }} title={isActive ? 'Active recently' : 'Not recently active'} />
  );
}

// ── Member Row ─────────────────────────────────────────────────
function MemberRow({ member, isCurrentUser, onRoleChange, onRemove, onResend, dealCount, taskCount, leadCount }) {
  const [roleChanging, setRoleChanging] = useState(false);
  const isPending = member.status === 'invited';
  const initials = (member.name || member.email || '?').substring(0, 2).toUpperCase();

  const handleRole = async (newRole) => {
    setRoleChanging(true);
    await onRoleChange(member.id, newRole);
    setRoleChanging(false);
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '14px 18px',
      background: 'var(--bg-elevated)',
      borderRadius: 10,
      border: `1px solid ${isPending ? 'rgba(245,158,11,0.2)' : 'var(--bg-border)'}`,
      transition: 'box-shadow 0.15s',
      position: 'relative',
    }}>
      {/* Avatar */}
      <div style={{
        width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
        background: member.color || '#3b82f6', color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 13, fontWeight: 700, letterSpacing: 0.5,
        position: 'relative',
      }}>
        {initials}
        <ActivityDot isActive={!isPending} />
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
            {member.name || member.email?.split('@')[0]}
          </span>
          {isCurrentUser && (
            <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 99,
              background: 'rgba(22,163,74,0.1)', color: '#16a34a' }}>You</span>
          )}
          <RoleBadge role={member.role} />
          {isPending && (
            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99,
              background: 'rgba(245,158,11,0.12)', color: '#d97706', letterSpacing: '0.04em' }}>
              ⏳ Pending
            </span>
          )}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{member.email}</div>
        {!isPending && (
          <div style={{ display: 'flex', gap: 12, marginTop: 5, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
              <span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>{dealCount}</span> deals
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
              <span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>{leadCount}</span> leads
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
              <span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>{taskCount}</span> tasks
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
        {/* Role select */}
        {!isCurrentUser && (
          <select
            style={{
              fontSize: 12, padding: '6px 8px', borderRadius: 7,
              border: '1px solid var(--bg-border)', background: 'var(--bg-surface)',
              color: 'var(--text-secondary)', cursor: 'pointer',
            }}
            value={member.role === 'Member' ? 'SDR' : (member.role || 'SDR')}
            onChange={e => handleRole(e.target.value)}
            disabled={roleChanging}
            title="Change role"
          >
            <option value="Admin">Admin</option>
            <option value="Manager">Manager</option>
            <option value="AE">Account Exec (AE)</option>
            <option value="SDR">Sales Dev Rep (SDR)</option>
            <option value="Viewer">Viewer</option>
          </select>
        )}

        {/* Resend invite */}
        {isPending && (
          <button
            className="btn btn-ghost btn-sm"
            style={{ color: '#3b82f6', gap: 5 }}
            onClick={() => onResend(member)}
            title="Resend invitation"
          >
            <Send size={13} /> Resend
          </button>
        )}

        {/* Remove */}
        {!isCurrentUser && (
          <button
            className="btn btn-ghost btn-sm"
            style={{ color: '#dc2626', gap: 5 }}
            onClick={() => onRemove(member)}
            title="Remove member"
          >
            <UserX size={13} />
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────
export default function TeamManagement() {
  const navigate = useNavigate();
  const { team, removeMember, updateMemberRole, user, fetchTeam } = useAuthStore();
  const { deals, leads, tasks } = useDataStore();
  const { showSuccess, showError, showConfirm } = useDialog();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Auto-refresh team every 10 seconds
  useEffect(() => {
    fetchTeam();
    const interval = setInterval(fetchTeam, 10000);
    return () => clearInterval(interval);
  }, [fetchTeam]);

  // ── Stats per member ────────────────────────────────────────
  const memberStats = useMemo(() => {
    const map = {};
    (team || []).forEach(m => {
      map[m.id] = {
        deals: deals.filter(d => d.owner_id === m.id).length,
        leads: leads.filter(l => l.owner_id === m.id).length,
        tasks: tasks.filter(t => (t.assigned_to === m.id || t.owner_id === m.id) && t.status !== 'completed').length,
      };
    });
    return map;
  }, [team, deals, leads, tasks]);

  // ── Team-wide KPIs ──────────────────────────────────────────
  const kpis = useMemo(() => {
    const active   = (team || []).filter(m => m.status !== 'invited').length;
    const pending  = (team || []).filter(m => m.status === 'invited').length;
    const admins   = (team || []).filter(m => m.role === 'Admin').length;
    const wonMRR   = deals.filter(d => d.stage === 'Closed Won').reduce((s, d) => s + (d.arr || 0), 0);
    return { active, pending, admins, wonMRR };
  }, [team, deals]);

  // ── Filtered team ───────────────────────────────────────────
  const filteredTeam = useMemo(() => {
    if (!search.trim()) return team || [];
    const q = search.toLowerCase();
    return (team || []).filter(m =>
      (m.name || '').toLowerCase().includes(q) ||
      (m.email || '').toLowerCase().includes(q) ||
      (m.role || '').toLowerCase().includes(q)
    );
  }, [team, search]);

  // Active members first, pending last
  const sortedTeam = useMemo(() => [
    ...filteredTeam.filter(m => m.status !== 'invited'),
    ...filteredTeam.filter(m => m.status === 'invited'),
  ], [filteredTeam]);

  // ── Handlers ────────────────────────────────────────────────
  const handleRoleChange = async (memberId, newRole) => {
    const confirmed = await showConfirm(
      'Change Role',
      `Set this member's role to "${newRole}"?`
    );
    if (!confirmed) return;
    try {
      await updateMemberRole(memberId, newRole);
      showSuccess('Role Updated', `Role changed to ${newRole}.`);
    } catch (err) {
      showError('Failed', err.message);
    }
  };

  const handleRemove = async (member) => {
    const confirmed = await showConfirm(
      'Remove Team Member',
      `Remove ${member.name || member.email} from this workspace? They will lose access immediately.`
    );
    if (!confirmed) return;
    try {
      await removeMember(member.id);
      showSuccess('Removed', `${member.name || member.email} has been removed.`);
    } catch (err) {
      showError('Failed to Remove', err.message);
    }
  };

  const handleResend = async (member) => {
    try {
      const { data } = await supabase
        .from('invitations')
        .select('token')
        .eq('id', member.id)
        .maybeSingle();

      const token = data?.token || member.token || Math.random().toString(36).substring(2);
      const inviterName = user?.user_metadata?.full_name || user?.email || 'Your team admin';
      const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;
      const shareLink = `${appUrl}/accept-invite?token=${token}`;

      const result = await sendTeamInvitation({
        toEmail: member.email,
        toName: member.name || member.email.split('@')[0],
        inviterName,
        role: member.role,
        inviteToken: token,
      });

      if (result.success) {
        showSuccess('Invite Resent', `Email sent to ${member.email}.`);
      } else {
        await showSuccess(
          'Copy Invite Link',
          `Email not configured. Share this link directly:\n\n${shareLink}`
        );
      }
    } catch (err) {
      showError('Failed to Resend', err.message);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTeam();
    setTimeout(() => setRefreshing(false), 600);
  };

  const fmtINR = (n) => {
    if (!n) return '₹0';
    if (n >= 10000000) return `₹${(n/10000000).toFixed(1)}Cr`;
    if (n >= 100000)   return `₹${(n/100000).toFixed(1)}L`;
    if (n >= 1000)     return `₹${(n/1000).toFixed(0)}K`;
    return `₹${n}`;
  };

  return (
    <div className="settings-panel animate-fade-in">

      {/* ── Header ──────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h2 className="panel-title">Team Management</h2>
          <p className="panel-sub">Onboard SDRs, manage roles, and track performance across your team.</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setInviteOpen(true)}>
          <Plus size={13} /> Add Member
        </button>
      </div>

      {/* ── KPI Strip ───────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Active Members', value: kpis.active,  color: '#16a34a', icon: CheckCircle  },
          { label: 'Pending Invites', value: kpis.pending, color: '#d97706', icon: Clock        },
          { label: 'Admins',          value: kpis.admins,  color: '#8b5cf6', icon: ShieldCheck  },
          { label: 'Team Won MRR',    value: fmtINR(kpis.wonMRR), color: '#3b82f6', icon: BarChart3 },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} style={{
            background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)',
            borderRadius: 10, padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 4,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-tertiary)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              <Icon size={12} style={{ color }} /> {label}
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color, letterSpacing: '-0.02em' }}>{value}</div>
          </div>
        ))}
      </div>

      {/* ── Team Analytics CTA ───────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(139,92,246,0.08) 100%)',
        border: '1px solid rgba(59,130,246,0.2)',
        borderRadius: 12, padding: '14px 18px', marginBottom: 20,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16,
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Activity size={15} style={{ color: '#3b82f6' }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
              Live Team Tracking Dashboard
            </span>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
            View per-rep workloads, deal pipeline, overdue tasks, leaderboard and live activity feed.
          </p>
        </div>
        <button
          className="btn btn-ghost btn-sm"
          style={{ color: '#3b82f6', background: 'rgba(59,130,246,0.1)', flexShrink: 0, gap: 6 }}
          onClick={() => navigate('/team')}
        >
          View Tracking <ChevronRight size={14} />
        </button>
      </div>

      {/* ── Search + Refresh ─────────────────────────── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', pointerEvents: 'none' }} />
          <input
            style={{ width: '100%', paddingLeft: 32, fontSize: 13 }}
            className="input-base"
            placeholder="Search by name, email or role…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button
          className="btn btn-ghost btn-sm"
          style={{ gap: 6, flexShrink: 0 }}
          onClick={handleRefresh}
          disabled={refreshing}
          title="Refresh team list"
        >
          <RefreshCw size={14} style={{ animation: refreshing ? 'spin 0.6s linear infinite' : 'none' }} />
          Refresh
        </button>
      </div>

      {/* ── Member List ──────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {sortedTeam.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-tertiary)', fontSize: 13 }}>
            {search.trim()
              ? `No members match "${search}"`
              : 'No team members yet. Click "+ Add Member" to get started.'
            }
          </div>
        ) : (
          sortedTeam.map(member => (
            <MemberRow
              key={member.id}
              member={member}
              isCurrentUser={member.id === user?.id}
              onRoleChange={handleRoleChange}
              onRemove={handleRemove}
              onResend={handleResend}
              dealCount={memberStats[member.id]?.deals ?? 0}
              leadCount={memberStats[member.id]?.leads ?? 0}
              taskCount={memberStats[member.id]?.tasks ?? 0}
            />
          ))
        )}
      </div>

      {/* ── Invite Modal ──────────────────────────────── */}
      <InviteModal
        isOpen={inviteOpen}
        onClose={() => { setInviteOpen(false); fetchTeam(); }}
      />

      {/* ── Footer note ──────────────────────────────── */}
      <p style={{ marginTop: 20, fontSize: 11, color: 'var(--text-tertiary)', textAlign: 'center', lineHeight: 1.5 }}>
        Role changes take effect immediately. Removing a member revokes their access but does not delete their data.
        For role definitions, visit the <span style={{ color: 'var(--accent-blue)', cursor: 'pointer' }} onClick={() => navigate('/settings?tab=guide')}>User Guide</span>.
      </p>
    </div>
  );
}
