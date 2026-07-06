// ============================================
// HUNTLO — TEAM COORDINATION PAGE
// Full visibility · Accountability · Tracking
// ============================================
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Target, BarChart3, CheckSquare, Calendar,
  TrendingUp, AlertCircle, Clock, Award, Zap,
  ArrowRight, ChevronDown, ChevronRight, Mail, Phone,
  Activity, Eye, Filter, Search
} from 'lucide-react';
import useDataStore from '../store/useDataStore';
import useAuthStore from '../store/useAuthStore';
import { computeSignalScore } from '../utils/leadScoring';
import { formatDistanceToNow } from 'date-fns';
import './Team.css';

// ── Helpers ──────────────────────────────────────────────────
function fmtINR(n) {
  if (!n || n === 0) return '₹0';
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000)   return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000)     return `₹${(n / 1000).toFixed(0)}K`;
  return `₹${n}`;
}

function Avatar({ name = '?', color = '#3b82f6', size = 36 }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: color, color: '#fff', fontWeight: 700,
      fontSize: size * 0.38, display: 'flex', alignItems: 'center',
      justifyContent: 'center', flexShrink: 0, letterSpacing: 0.5,
    }}>
      {initials}
    </div>
  );
}

function StatPill({ label, value, color = 'var(--accent-blue)', icon: Icon }) {
  return (
    <div className="tc-stat-pill">
      {Icon && <Icon size={12} style={{ color }} />}
      <span className="tc-stat-value" style={{ color }}>{value}</span>
      <span className="tc-stat-label">{label}</span>
    </div>
  );
}

// ── Member Card ───────────────────────────────────────────────
function MemberCard({ member, leads, deals, tasks, meetings, now, onView }) {
  const [expanded, setExpanded] = useState(false);

  const myLeads   = leads.filter(l => l.owner_id === member.id);
  const myDeals   = deals.filter(d => d.owner_id === member.id);
  const myTasks   = tasks.filter(t => t.assigned_to === member.id || t.owner_id === member.id);
  const myMtgs    = meetings.filter(m => m.owner_id === member.id);

  const activeDeals  = myDeals.filter(d => d.stage !== 'Closed Won' && d.stage !== 'Closed Lost');
  const wonDeals     = myDeals.filter(d => d.stage === 'Closed Won');
  const overdueTasks = myTasks.filter(t => t.status !== 'completed' && t.due && new Date(t.due) < new Date(now));
  const pendingTasks = myTasks.filter(t => t.status !== 'completed');
  const hotLeads     = myLeads.filter(l => computeSignalScore(l) >= 70 && l.stage !== 'Lost');
  const pipelineMRR  = activeDeals.reduce((s, d) => s + (d.arr || 0), 0);
  const wonMRR       = wonDeals.reduce((s, d) => s + (d.arr || 0), 0);
  const convRate     = myLeads.length > 0 ? Math.round((myDeals.length / myLeads.length) * 100) : 0;

  // Activity score (simple: recent lead/deal updates)
  const recentActivity = [...myLeads, ...myDeals]
    .filter(x => (now - new Date(x.updated_at || x.created_at).getTime()) < 2 * 86400000).length;

  const activityStatus = recentActivity > 3 ? 'active' : recentActivity > 0 ? 'moderate' : 'idle';
  const activityColors = { active: '#16a34a', moderate: '#d97706', idle: '#94a3b8' };
  const activityLabels = { active: 'Active', moderate: 'Moderate', idle: 'Idle' };

  return (
    <div className={`tc-member-card ${expanded ? 'expanded' : ''}`}>
      {/* Header */}
      <div className="tc-member-header" onClick={() => setExpanded(e => !e)}>
        <div className="tc-member-left">
          <div className="tc-avatar-wrap">
            <Avatar name={member.name || member.email} color={member.color || '#3b82f6'} size={42} />
            <div
              className="tc-status-dot"
              style={{ background: activityColors[activityStatus] }}
              title={`Activity: ${activityLabels[activityStatus]}`}
            />
          </div>
          <div className="tc-member-info">
            <div className="tc-member-name">{member.name || member.email?.split('@')[0]}</div>
            <div className="tc-member-email">{member.email}</div>
            <div className="tc-member-role" style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
              <span className={`badge badge-${member.role === 'Admin' ? 'blue' : 'gray'}`}>{member.role || 'Member'}</span>
              {member.team && <span className="badge badge-purple">{member.team}</span>}
              <span className="tc-activity-label" style={{ color: activityColors[activityStatus] }}>
                ● {activityLabels[activityStatus]}
              </span>
            </div>
          </div>
        </div>

        {/* Quick stats */}
        <div className="tc-member-stats">
          <StatPill label="Active Deals" value={activeDeals.length} color="#3b82f6" icon={BarChart3} />
          <StatPill label="Hot Leads" value={hotLeads.length} color="#dc2626" icon={Target} />
          <StatPill label="Overdue Tasks" value={overdueTasks.length} color={overdueTasks.length > 0 ? '#dc2626' : '#94a3b8'} icon={AlertCircle} />
          <StatPill label="Pipeline MRR" value={fmtINR(pipelineMRR)} color="#8b5cf6" icon={TrendingUp} />
          <StatPill label="Won MRR" value={fmtINR(wonMRR)} color="#16a34a" icon={Award} />
          <StatPill label="Conv. Rate" value={`${convRate}%`} color="#f97316" icon={Zap} />
        </div>

        <div className="tc-expand-btn">
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="tc-member-detail animate-fade-in">
          {/* Tabs inside card */}
          <div className="tc-detail-grid">
            {/* Active Deals */}
            <div className="tc-detail-section">
              <div className="tc-ds-title">
                <BarChart3 size={13} style={{ color: '#3b82f6' }} />
                Active Deals ({activeDeals.length})
              </div>
              {activeDeals.length > 0 ? (
                <div className="tc-item-list">
                  {activeDeals.slice(0, 5).map(d => (
                    <div key={d.id} className="tc-item-row">
                      <div className="tc-item-main">
                        <span className="tc-item-name">{d.title || d.company}</span>
                        <span className={`badge badge-${d.stage === 'Proposal' ? 'purple' : d.stage === 'Negotiation' ? 'orange' : 'gray'}`}>{d.stage}</span>
                      </div>
                      <div className="tc-item-sub">
                        {fmtINR(d.arr)}/mo
                        {d.updated_at && <span> · {formatDistanceToNow(new Date(d.updated_at))} ago</span>}
                      </div>
                    </div>
                  ))}
                  {activeDeals.length > 5 && <div className="tc-item-more">+{activeDeals.length - 5} more deals</div>}
                </div>
              ) : <div className="tc-empty-mini">No active deals</div>}
            </div>

            {/* Hot Leads */}
            <div className="tc-detail-section">
              <div className="tc-ds-title">
                <Target size={13} style={{ color: '#dc2626' }} />
                Hot Leads ({hotLeads.length})
              </div>
              {hotLeads.length > 0 ? (
                <div className="tc-item-list">
                  {hotLeads.slice(0, 5).map(l => (
                    <div key={l.id} className="tc-item-row">
                      <div className="tc-item-main">
                        <span className="tc-item-name">{l.company_name}</span>
                        <span className="badge badge-red">Score: {computeSignalScore(l)}</span>
                      </div>
                      <div className="tc-item-sub">
                        {l.stage}
                        {l.next_action_due && new Date(l.next_action_due) < new Date(now) && (
                          <span style={{ color: '#dc2626', marginLeft: 6 }}>⚠ Overdue</span>
                        )}
                      </div>
                    </div>
                  ))}
                  {hotLeads.length > 5 && <div className="tc-item-more">+{hotLeads.length - 5} more</div>}
                </div>
              ) : <div className="tc-empty-mini">No hot leads</div>}
            </div>

            {/* Tasks */}
            <div className="tc-detail-section">
              <div className="tc-ds-title">
                <CheckSquare size={13} style={{ color: '#16a34a' }} />
                Tasks ({pendingTasks.length} pending, {overdueTasks.length} overdue)
              </div>
              {pendingTasks.length > 0 ? (
                <div className="tc-item-list">
                  {pendingTasks.slice(0, 5).map(t => (
                    <div key={t.id} className="tc-item-row">
                      <div className="tc-item-main">
                        <span className="tc-item-name">{t.title}</span>
                        {t.due && new Date(t.due) < new Date(now) && (
                          <span className="badge badge-red">Overdue</span>
                        )}
                      </div>
                      <div className="tc-item-sub">
                        {t.due ? `Due ${formatDistanceToNow(new Date(t.due), { addSuffix: true })}` : 'No due date'}
                        {t.priority && <span> · {t.priority}</span>}
                      </div>
                    </div>
                  ))}
                  {pendingTasks.length > 5 && <div className="tc-item-more">+{pendingTasks.length - 5} more tasks</div>}
                </div>
              ) : <div className="tc-empty-mini">All tasks completed ✓</div>}
            </div>

            {/* Upcoming Meetings */}
            <div className="tc-detail-section">
              <div className="tc-ds-title">
                <Calendar size={13} style={{ color: '#7c3aed' }} />
                Meetings ({myMtgs.length} total)
              </div>
              {myMtgs.length > 0 ? (
                <div className="tc-item-list">
                  {myMtgs.slice(0, 4).map(m => (
                    <div key={m.id} className="tc-item-row">
                      <div className="tc-item-main">
                        <span className="tc-item-name">{m.title}</span>
                        <span className={`badge badge-${m.status === 'scheduled' ? 'blue' : m.status === 'completed' ? 'green' : 'gray'}`}>{m.status}</span>
                      </div>
                      <div className="tc-item-sub">
                        {m.date ? new Date(m.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}
                        {m.platform && ` · ${m.platform}`}
                      </div>
                    </div>
                  ))}
                  {myMtgs.length > 4 && <div className="tc-item-more">+{myMtgs.length - 4} more</div>}
                </div>
              ) : <div className="tc-empty-mini">No meetings scheduled</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Activity Feed Row ────────────────────────────────────────
function FeedItem({ item, teamMap }) {
  const owner = teamMap.get(item.owner_id) || { name: 'Team', color: '#64748b' };
  const icons = { lead: '🎯', deal: '💼', task: '✅', meeting: '📅', company: '🏢', contact: '👤' };
  const relTime = item.ts ? formatDistanceToNow(new Date(item.ts), { addSuffix: true }) : '';
  return (
    <div className="tc-feed-item">
      <div className="tc-feed-icon">{icons[item.type] || '•'}</div>
      <div className="tc-feed-body">
        <div className="tc-feed-text">
          <Avatar name={owner.name} color={owner.color} size={22} />
          <span className="tc-feed-owner">{owner.name}</span>
          <span className="tc-feed-action">{item.text}</span>
        </div>
        <div className="tc-feed-time">{relTime}</div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export default function Team() {
  const { leads, deals, tasks, meetings, contacts, companies } = useDataStore();
  const { team, user } = useAuthStore();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [now] = useState(() => Date.now());

  const teamMap = useMemo(() =>
    new Map(team.map(m => [m.id, m])), [team]);

  const filteredTeam = useMemo(() => {
    if (!search.trim()) return team;
    const q = search.toLowerCase();
    return team.filter(m =>
      (m.name || '').toLowerCase().includes(q) ||
      (m.email || '').toLowerCase().includes(q)
    );
  }, [team, search]);

  // Team-wide stats
  const totalPipelineMRR = deals
    .filter(d => d.stage !== 'Closed Lost')
    .reduce((s, d) => s + (d.arr || 0), 0);
  const totalWonMRR = deals
    .filter(d => d.stage === 'Closed Won')
    .reduce((s, d) => s + (d.arr || 0), 0);
  const totalActiveDeals = deals.filter(d => d.stage !== 'Closed Won' && d.stage !== 'Closed Lost').length;
  const totalOverdueTasks = tasks.filter(t => t.status !== 'completed' && t.due && new Date(t.due) < new Date(now)).length;
  const totalHotLeads = leads.filter(l => computeSignalScore(l) >= 70 && l.stage !== 'Lost').length;
  const unassignedLeads = leads.filter(l => !l.owner_id).length;

  // Activity feed — last 30 events across team
  const activityFeed = useMemo(() => {
    const feed = [];
    deals.forEach(d => {
      if (d.updated_at || d.created_at) {
        feed.push({ type: 'deal', text: `${d.stage === 'Closed Won' ? '🎉 won' : 'updated'} deal: ${d.title || d.company}`, owner_id: d.owner_id, ts: d.updated_at || d.created_at });
      }
    });
    leads.forEach(l => {
      if (l.created_at && (now - new Date(l.created_at).getTime()) < 7 * 86400000) {
        feed.push({ type: 'lead', text: `added lead: ${l.company_name}`, owner_id: l.owner_id, ts: l.created_at });
      }
    });
    meetings.forEach(m => {
      if (m.created_at) {
        feed.push({ type: 'meeting', text: `scheduled meeting: ${m.title}`, owner_id: m.owner_id, ts: m.created_at });
      }
    });
    tasks.forEach(t => {
      if (t.status === 'completed' && t.updated_at) {
        feed.push({ type: 'task', text: `completed task: ${t.title}`, owner_id: t.assigned_to || t.owner_id, ts: t.updated_at });
      }
    });
    return feed
      .filter(f => f.ts)
      .sort((a, b) => new Date(b.ts) - new Date(a.ts))
      .slice(0, 40);
  }, [deals, leads, meetings, tasks, now]);

  // Leaderboard
  const leaderboard = useMemo(() => {
    return team.map(m => {
      const mDeals = deals.filter(d => d.owner_id === m.id && d.stage === 'Closed Won');
      const mLeads = leads.filter(l => l.owner_id === m.id);
      const mActive = deals.filter(d => d.owner_id === m.id && d.stage !== 'Closed Won' && d.stage !== 'Closed Lost');
      const wonMRR = mDeals.reduce((s, d) => s + (d.arr || 0), 0);
      return { ...m, wonMRR, wonCount: mDeals.length, leadCount: mLeads.length, activeCount: mActive.length };
    }).sort((a, b) => b.wonMRR - a.wonMRR);
  }, [team, deals, leads]);

  return (
    <div className="team-page">
      {/* Header */}
      <div className="page-header-row">
        <div>
          <h1 className="page-big-title">Team Coordination</h1>
          <p className="page-big-sub">Full visibility · Accountability · Real-time tracking across all reps</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div className="search-box" style={{ width: 240 }}>
            <Search size={14} style={{ color: 'var(--text-tertiary)' }} />
            <input
              placeholder="Search team members..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ fontSize: 13 }}
            />
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/settings?tab=team')}>
            <Users size={14} /> Manage Team
          </button>
        </div>
      </div>

      {/* Team-wide KPIs */}
      <div className="tc-kpi-row">
        <div className="tc-kpi-card">
          <div className="tc-kpi-label">Team Pipeline MRR</div>
          <div className="tc-kpi-value" style={{ color: '#3b82f6' }}>{fmtINR(totalPipelineMRR)}</div>
          <div className="tc-kpi-sub">{totalActiveDeals} active deals</div>
        </div>
        <div className="tc-kpi-card">
          <div className="tc-kpi-label">Total Won MRR</div>
          <div className="tc-kpi-value" style={{ color: '#16a34a' }}>{fmtINR(totalWonMRR)}</div>
          <div className="tc-kpi-sub">{deals.filter(d => d.stage === 'Closed Won').length} deals closed</div>
        </div>
        <div className="tc-kpi-card">
          <div className="tc-kpi-label">Hot Leads (Team)</div>
          <div className="tc-kpi-value" style={{ color: '#dc2626' }}>{totalHotLeads}</div>
          <div className="tc-kpi-sub">Signal score ≥ 70</div>
        </div>
        <div className="tc-kpi-card" style={{ borderColor: totalOverdueTasks > 0 ? 'rgba(220,38,38,0.25)' : undefined }}>
          <div className="tc-kpi-label">Overdue Tasks</div>
          <div className="tc-kpi-value" style={{ color: totalOverdueTasks > 0 ? '#dc2626' : '#94a3b8' }}>{totalOverdueTasks}</div>
          <div className="tc-kpi-sub">Needs attention</div>
        </div>
        <div className="tc-kpi-card" style={{ borderColor: unassignedLeads > 0 ? 'rgba(245,158,11,0.25)' : undefined }}>
          <div className="tc-kpi-label">Unassigned Leads</div>
          <div className="tc-kpi-value" style={{ color: unassignedLeads > 0 ? '#d97706' : '#94a3b8' }}>{unassignedLeads}</div>
          <div className="tc-kpi-sub">Need an owner</div>
        </div>
        <div className="tc-kpi-card">
          <div className="tc-kpi-label">Active Members</div>
          <div className="tc-kpi-value" style={{ color: '#8b5cf6' }}>{team.length}</div>
          <div className="tc-kpi-sub">In workspace</div>
        </div>
      </div>

      {/* Main two-column layout */}
      <div className="tc-main-grid">
        {/* Left: Member cards */}
        <div className="tc-members-col">
          <div className="tc-section-header">
            <Users size={16} style={{ color: 'var(--accent-blue)' }} />
            <span>Rep Workloads ({filteredTeam.length})</span>
          </div>

          {filteredTeam.length === 0 ? (
            <div className="empty-state">
              <Users size={32} />
              <h3>No team members</h3>
              <p>Invite team members from Settings → Team & Workspace</p>
              <button className="btn btn-primary btn-sm" onClick={() => navigate('/settings?tab=team')}>
                Invite Member
              </button>
            </div>
          ) : (
            <div className="tc-members-list">
              {filteredTeam.map(member => (
                <MemberCard
                  key={member.id}
                  member={member}
                  leads={leads}
                  deals={deals}
                  tasks={tasks}
                  meetings={meetings}
                  now={now}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right: Leaderboard + Activity */}
        <div className="tc-right-col">
          {/* Leaderboard */}
          <div className="tc-panel">
            <div className="tc-section-header">
              <Award size={16} style={{ color: '#d97706' }} />
              <span>Leaderboard — Won MRR</span>
            </div>
            <div className="tc-leaderboard">
              {leaderboard.map((m, i) => (
                <div key={m.id} className="tc-lb-row">
                  <div className="tc-lb-rank" style={{ color: i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : i === 2 ? '#cd7c3e' : 'var(--text-tertiary)' }}>
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                  </div>
                  <Avatar name={m.name || m.email} color={m.color || '#3b82f6'} size={30} />
                  <div className="tc-lb-info">
                    <div className="tc-lb-name">{m.name || m.email?.split('@')[0]}</div>
                    <div className="tc-lb-sub">
                      {m.role && <span className="badge badge-gray" style={{ fontSize: '9px', padding: '2px 4px', marginRight: '4px' }}>{m.role}</span>}
                      {m.team && <span className="badge badge-purple" style={{ fontSize: '9px', padding: '2px 4px', marginRight: '4px' }}>{m.team}</span>}
                      {m.wonCount} deals · {m.leadCount} leads
                    </div>
                  </div>
                  <div className="tc-lb-mrr" style={{ color: m.wonMRR > 0 ? '#16a34a' : 'var(--text-tertiary)' }}>
                    {fmtINR(m.wonMRR)}
                  </div>
                </div>
              ))}
              {leaderboard.length === 0 && (
                <div className="tc-empty-mini">No team data yet</div>
              )}
            </div>
          </div>

          {/* Unassigned leads alert */}
          {unassignedLeads > 0 && (
            <div className="tc-alert-card" onClick={() => navigate('/leads')}>
              <AlertCircle size={16} style={{ color: '#d97706', flexShrink: 0 }} />
              <div>
                <div className="tc-alert-title">{unassignedLeads} Leads Need an Owner</div>
                <div className="tc-alert-sub">Assign these leads to your team so nothing is missed</div>
              </div>
              <ArrowRight size={14} style={{ color: 'var(--text-tertiary)', marginLeft: 'auto' }} />
            </div>
          )}

          {/* Overdue tasks alert */}
          {totalOverdueTasks > 0 && (
            <div className="tc-alert-card danger" onClick={() => navigate('/tasks')}>
              <Clock size={16} style={{ color: '#dc2626', flexShrink: 0 }} />
              <div>
                <div className="tc-alert-title">{totalOverdueTasks} Overdue Tasks Across Team</div>
                <div className="tc-alert-sub">Review and reassign tasks to keep deals moving</div>
              </div>
              <ArrowRight size={14} style={{ color: 'var(--text-tertiary)', marginLeft: 'auto' }} />
            </div>
          )}

          {/* Activity Feed */}
          <div className="tc-panel" style={{ flex: 1 }}>
            <div className="tc-section-header">
              <Activity size={16} style={{ color: 'var(--accent-blue)' }} />
              <span>Team Activity Feed</span>
            </div>
            <div className="tc-feed">
              {activityFeed.length > 0 ? (
                activityFeed.map((item, i) => (
                  <FeedItem key={i} item={item} teamMap={teamMap} />
                ))
              ) : (
                <div className="tc-empty-mini">No recent activity</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
