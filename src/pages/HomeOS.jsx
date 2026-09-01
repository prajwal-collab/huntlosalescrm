// ============================================
// HUNTLO — HOME OS PAGE
// AI-Native Signal-Driven Dashboard
// ============================================
import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Sparkles, AlertCircle, Calendar, FileText, Clock, TrendingUp, ArrowRight,
  Zap, Activity, Users, BarChart3, CheckCircle2, Presentation, Send, Trophy,
  Phone, Target, Flame, Coffee, Star, ChevronRight, DollarSign,
  PhoneCall, Award, ArrowUpRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow, format, isToday } from 'date-fns';
import usePipelineStore from '../store/usePipelineStore';
import useDataStore from '../store/useDataStore';
import useAuthStore from '../store/useAuthStore';
import { queryGemini } from '../lib/gemini';
import { useDialog } from '../context/DialogContext';
import { computeSignalScore, getPriority, computeCompleteness, isLeadStale } from '../utils/leadScoring';
import { fmtINR } from '../utils/formatINR';
import './HomeOS.css';

// ── Dot color palette for avatars ───────────────────────────────────────────
const AVATAR_COLORS = ['#3b82f6','#8b5cf6','#06b6d4','#f97316','#22c55e','#ec4899','#6366f1','#14b8a6'];

// ── Apollo-style stat card ──────────────────────────────────────────────────
function StatCard({ label, value, delta, deltaType = 'green', icon: Icon, iconBg, iconColor, accent, onClick }) {
  return (
    <div
      className="dash-stat-card"
      style={{ '--dash-accent': accent || '#2563eb', cursor: onClick ? 'pointer' : 'default' }}
      onClick={onClick}
    >
      {Icon && (
        <div className="dash-stat-icon" style={{ background: iconBg || 'rgba(37,99,235,0.08)' }}>
          <Icon size={14} color={iconColor || '#2563eb'} />
        </div>
      )}
      <span className="dash-stat-label">{label}</span>
      <span className="dash-stat-value">{value}</span>
      {delta && <span className={`dash-stat-delta ${deltaType}`}>{delta}</span>}
    </div>
  );
}

// ── Priority action card ────────────────────────────────────────────────────
function PriorityCard({ icon: Icon, label, count, urgency, color, onClick }) {
  return (
    <button className={`dash-priority-card urg-${urgency}`} onClick={onClick}>
      <div className="dash-priority-icon" style={{ background: color + '15' }}>
        <Icon size={16} color={color} />
      </div>
      <div className="dash-priority-info">
        <span className="dash-priority-count">{count}</span>
        <span className="dash-priority-label">{label}</span>
      </div>
      <ChevronRight size={13} className="dash-priority-arrow" />
    </button>
  );
}

export default function HomeOS() {
  const { deals, tasks, meetings, leads, documents, contacts, proposals, migrateLocalProposals } = useDataStore();
  const { user, team, updateProfileMeta } = useAuthStore();
  const { showAlert } = useDialog();
  const navigate = useNavigate();
  const [aiQuery, setAiQuery] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [now] = useState(() => Date.now());

  useEffect(() => {
    migrateLocalProposals().catch(console.error);
  }, [migrateLocalProposals]);

  // ── Streak Tracker ─────────────────────────────────────────────────────
  const streak = useMemo(() => {
    const raw = user?.user_metadata?.huntlo_call_streak || localStorage.getItem('huntlo_call_streak');
    if (!raw) return 0;
    try {
      const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
      const lastD = new Date(data.lastDate);
      const today = new Date();
      const diffDays = Math.floor((today - lastD) / 86400000);
      if (diffDays === 0) return data.count;
      if (diffDays === 1) return data.count;
      return 0;
    } catch { return 0; }
  }, [user]);

  // ── Daily call goal ────────────────────────────────────────────────────
  const [callGoal, setCallGoal] = useState(() => {
    return parseInt(user?.user_metadata?.huntlo_daily_call_goal || localStorage.getItem('huntlo_daily_call_goal') || '30', 10);
  });
  const [editingGoal, setEditingGoal] = useState(false);

  const saveCallGoal = async (newGoal) => {
    setCallGoal(newGoal);
    setEditingGoal(false);
    localStorage.setItem('huntlo_daily_call_goal', newGoal);
    if (updateProfileMeta) {
      await updateProfileMeta({ huntlo_daily_call_goal: newGoal });
    }
  };

  const callsLoggedToday = useMemo(() => {
    const today = new Date().toDateString();
    return tasks.filter(t =>
      (t.type === 'cold_call' || t.type === 'calling_list_item') &&
      t.status === 'completed' &&
      new Date(t.created_at || t.updated_at).toDateString() === today
    ).length;
  }, [tasks]);

  const pendingCallLogs = useMemo(() => {
    return tasks.filter(t => {
      if (t.type !== 'cold_call' && t.type !== 'calling_list_item') return false;
      try {
        const data = JSON.parse(t.notes || '{}');
        return !data.pushedToLead;
      } catch { return false; }
    }).length;
  }, [tasks]);

  // ── SDR Demo Targets ───────────────────────────────────────────────────
  const { completedDemosThisWeek, completedDemosThisMonth } = useMemo(() => {
    let weekCount = 0;
    let monthCount = 0;
    const nowTime = now;
    const today = new Date(now);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).getTime();
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const currentDay = today.getDay();
    const startOfWeek = todayMidnight - (currentDay * 86400000);

    meetings.forEach(m => {
      if (m.owner_id && m.owner_id !== user?.id) return;
      if ((m.type === 'Demo' || m.type === 'demo' || m.type === 'Discovery') && m.status === 'completed') {
        const d = new Date(m.date).getTime();
        if (d >= startOfMonth && d <= nowTime) monthCount++;
        if (d >= startOfWeek && d <= nowTime) weekCount++;
      }
    });
    return { completedDemosThisWeek: weekCount, completedDemosThisMonth: monthCount };
  }, [meetings, now, user]);

  const DEMO_TARGET_MONTH = 25;
  const DEMO_TARGET_WEEK = 6;

  // ── Top 5 leads to call today ─────────────────────────────────────────
  const topLeadsToCall = useMemo(() => {
    const today = new Date().toDateString();
    return leads
      .filter(l => {
        if (l.stage === 'Lost' || l.stage === 'Customer') return false;
        const lastMod = l.updated_at || l.created_at;
        const wasUpdatedToday = lastMod && new Date(lastMod).toDateString() === today;
        return !wasUpdatedToday;
      })
      .map(l => ({ ...l, _score: computeSignalScore(l) }))
      .sort((a, b) => b._score - a._score)
      .slice(0, 5);
  }, [leads]);

  // ── Computed metrics ──────────────────────────────────────────────────
  const staleLeads      = useMemo(() => leads.filter(l => isLeadStale(l, 14) && l.stage !== 'Lost' && l.stage !== 'Customer').length, [leads]);
  const incompleteLeads = useMemo(() => leads.filter(l => computeCompleteness(l) < 50).length, [leads]);

  const pendingTasks   = tasks.filter(t => t.status !== 'completed');
  const overdueTasks   = tasks.filter(t => t.status !== 'completed' && new Date(t.due).getTime() < now);
  const tasksDueToday  = tasks.filter(t => { if (t.status === 'completed') return false; return new Date(t.due).toDateString() === new Date(now).toDateString(); });
  const todayMeetings  = meetings.filter(m => { const d = new Date(m.date); return d.toDateString() === new Date(now).toDateString() || m.status === 'scheduled'; });
  const meetingsThisWeek = meetings.filter(m => { const d = new Date(m.date).getTime(); return d >= now && d <= now + 7 * 86400000; });
  const hotLeads       = leads.filter(l => computeSignalScore(l) >= 70 && l.stage !== 'Lost');
  const staleDeals     = deals.filter(d => { const days = (now - new Date(d.updated_at).getTime()) / 86400000; return days > 5 && d.stage !== 'Closed Won' && d.stage !== 'Closed Lost'; });

  const trialsNeedingReview = deals.filter(d => {
    if (d.stage !== 'Trial') return false;
    const recentMeeting = meetings.find(m => { if (m.deal_id !== d.id) return false; return (now - new Date(m.date).getTime()) < 7 * 86400000; });
    return !recentMeeting;
  });

  const proposalStats = useMemo(() => {
    let total = 0, sent = 0, accepted = 0, totalValue = 0;
    if (proposals) {
      total = proposals.length;
      sent = proposals.filter(p => p.status !== 'draft').length;
      accepted = proposals.filter(p => p.status === 'accepted').length;
      totalValue = proposals.filter(p => p.status === 'accepted').reduce((s, p) => s + (Number(p.amount) || 0), 0);
    }
    return { total, sent, accepted, totalValue };
  }, [proposals]);

  const conversionRate = leads.length > 0 ? Math.round((deals.length / leads.length) * 100) : 0;
  const totalARR = deals.filter(d => d.stage !== 'Closed Lost').reduce((sum, d) => sum + (d.arr || 0), 0);
  const wonARR   = deals.filter(d => d.stage === 'Closed Won').reduce((sum, d) => sum + (d.arr || 0), 0);
  const newDealsThisWeek = deals.filter(d => (now - new Date(d.created_at).getTime()) < 7 * 86400000).length;
  const closedThisMonth  = deals.filter(d => d.stage === 'Closed Won' && (now - new Date(d.updated_at || d.created_at).getTime()) < 30 * 86400000).length;

  const tasksCompletedToday = tasks.filter(t => { if (t.status !== 'completed') return false; return new Date(t.updated_at || now).toDateString() === new Date(now).toDateString(); });
  const meetingsHeldThisWeek = meetings.filter(m => { const d = new Date(m.date).getTime(); return d <= now && d >= now - 7 * 86400000; });
  const newLeadsThisWeek = leads.filter(l => (now - new Date(l.created_at).getTime()) < 7 * 86400000);
  const proposalsSentThisWeek = proposals ? proposals.filter(p => p.status !== 'draft' && (now - new Date(p.created_at).getTime()) < 7 * 86400000) : [];

  const topPerformerData = useMemo(() => {
    if (!team || team.length === 0) return { name: 'N/A', count: 0 };
    const wonThisMonthDeals = deals.filter(d => d.stage === 'Closed Won' && (now - new Date(d.updated_at || d.created_at).getTime()) < 30 * 86400000);
    const ownerCounts = {};
    wonThisMonthDeals.forEach(d => { if (d.owner_id) ownerCounts[d.owner_id] = (ownerCounts[d.owner_id] || 0) + 1; });
    let topId = null, maxCount = 0;
    Object.entries(ownerCounts).forEach(([id, count]) => { if (count > maxCount) { maxCount = count; topId = id; } });
    const topMember = team.find(m => m.id === topId);
    return { name: topMember?.name || 'N/A', count: maxCount };
  }, [deals, team, now]);

  const activityFeed = useMemo(() => {
    const feed = [];
    const teamMap = new Map((team || []).map(m => [m.id, m.name || m.email]));
    const ownerName = (id) => teamMap.get(id) || 'Team';
    deals.forEach(d => feed.push({ icon: '💼', text: `Deal: ${d.title} → ${d.stage}`, owner: ownerName(d.owner_id), time: d.updated_at || d.created_at }));
    meetings.forEach(m => feed.push({ icon: '📅', text: `Meeting: ${m.title} scheduled`, owner: ownerName(m.owner_id), time: m.created_at }));
    tasks.forEach(t => feed.push({ icon: '✅', text: `Task: ${t.title} — ${t.status}`, owner: ownerName(t.owner_id), time: t.updated_at || t.created_at }));
    documents.forEach(doc => feed.push({ icon: '📄', text: `Document: ${doc.name} added`, owner: ownerName(doc.owner_id), time: doc.created_at }));
    leads.forEach(l => feed.push({ icon: '👤', text: `Lead: ${l.company_name} added`, owner: ownerName(l.owner_id), time: l.created_at }));
    return feed.sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 12);
  }, [deals, meetings, tasks, documents, leads, team]);

  const aiInsights = useMemo(() => {
    const insights = [];
    if (staleDeals.length > 0) insights.push({ type: 'warning', icon: '⚠️', text: `${staleDeals.length} stale deals need your attention.`, action: 'View Deals', color: '#d97706', onClick: () => navigate('/pipeline') });
    if (trialsNeedingReview.length > 0) insights.push({ type: 'danger', icon: '🔔', text: `${trialsNeedingReview.length} trial deal${trialsNeedingReview.length > 1 ? 's' : ''} with no success review in 7 days.`, action: 'Schedule', color: '#dc2626', onClick: () => navigate('/meetings') });
    if (hotLeads.length > 0) insights.push({ type: 'success', icon: '🔥', text: `${hotLeads.length} hot leads are ready for outreach.`, action: 'Contact Now', color: '#16a34a', onClick: () => navigate('/leads') });
    if (overdueTasks.length > 0) insights.push({ type: 'danger', icon: '⏰', text: `${overdueTasks.length} tasks are overdue.`, action: 'View Tasks', color: '#dc2626', onClick: () => navigate('/tasks') });
    if (insights.length === 0 && deals.length > 0) insights.push({ type: 'info', icon: '💡', text: 'Pipeline is looking healthy. Keep pushing new leads.', action: 'Add Lead', color: '#2563eb', onClick: () => navigate('/leads') });
    return insights;
  }, [staleDeals, hotLeads, overdueTasks, navigate, deals.length]);

  const handleAIQuery = async (e) => {
    e.preventDefault();
    if (!aiQuery.trim()) return;
    setAiLoading(true);
    try {
      const context = `
        Total Pipeline MRR: ${fmtINR(totalARR)}
        Active Deals: ${deals.slice(0,10).map(d => `${d.title} (${d.stage}, ${fmtINR(d.arr || 0)})`).join(' | ')}
        Hot Leads: ${hotLeads.slice(0,10).map(l => l.company_name).join(', ')}
        Stale Deals: ${staleDeals.slice(0,10).map(d => d.title).join(', ')}
        Overdue Tasks: ${overdueTasks.slice(0,10).map(t => t.title).join(', ')}
        Meetings Today: ${todayMeetings.slice(0,10).map(m => m.title).join(', ')}
      `.trim();
      const res = await queryGemini(aiQuery, context);
      setAiResponse(res);
    } finally {
      setAiLoading(false);
    }
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || 'there';

  return (
    <div className="home-os">

      {/* ── Hero Header ─────────────────────────────────────────── */}
      <div className="dash-hero">
        <div className="dash-greeting-wrap">
          <div className="dash-greeting-line">
            {greeting}, <span>{firstName}!</span>
          </div>
          <div className="dash-date-line">{format(new Date(), 'EEEE, MMMM d, yyyy')}</div>
          {streak > 0 && (
            <div className="dash-streak-pill" style={{ marginTop: 10 }}>
              🔥 {streak}-day streak
            </div>
          )}
        </div>

        {/* KPI strip */}
        <div className="dash-hero-kpis">
          <div className="dash-hero-kpi" onClick={() => navigate('/tasks')}>
            <span className="dash-kpi-val" style={tasksDueToday.length > 0 ? {} : { color: 'var(--text-tertiary)' }}>{tasksDueToday.length}</span>
            <span className="dash-kpi-label">Tasks Today</span>
          </div>
          <div className="dash-hero-kpi" onClick={() => navigate('/meetings')}>
            <span className="dash-kpi-val">{todayMeetings.length}</span>
            <span className="dash-kpi-label">Meetings</span>
          </div>
          <div className="dash-hero-kpi" onClick={() => navigate('/tasks')}>
            <span className="dash-kpi-val" style={{ color: overdueTasks.length > 0 ? '#dc2626' : 'var(--text-primary)' }}>{overdueTasks.length}</span>
            <span className="dash-kpi-label">Overdue</span>
            {overdueTasks.length > 0 && <span className="dash-kpi-delta hot">⚠ action needed</span>}
          </div>
          <div className="dash-hero-kpi" onClick={() => navigate('/leads')}>
            <span className="dash-kpi-val" style={{ color: '#dc2626' }}>{hotLeads.length}</span>
            <span className="dash-kpi-label">🔥 Hot Leads</span>
            <span className="dash-kpi-delta hot">Score ≥ 70</span>
          </div>
          <div className="dash-hero-kpi" onClick={() => navigate('/leads')}>
            <span className="dash-kpi-val" style={{ color: staleLeads > 0 ? '#d97706' : 'var(--text-primary)' }}>{staleLeads}</span>
            <span className="dash-kpi-label">Stale Leads</span>
          </div>
          <div className="dash-hero-kpi" onClick={() => navigate('/call-logs')}>
            <span className="dash-kpi-val">{callsLoggedToday}</span>
            <span className="dash-kpi-label">Calls Today</span>
            <span className="dash-kpi-delta" style={{ color: callsLoggedToday >= callGoal ? '#16a34a' : 'var(--text-tertiary)' }}>
              of {callGoal} goal
            </span>
          </div>
        </div>

        {/* Right side actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/leads')} style={{ fontSize: 12, gap: 5 }}>
            <Zap size={13} /> New Lead
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/call-logs')} style={{ fontSize: 12, gap: 5 }}>
            <PhoneCall size={13} /> Log Call
          </button>
        </div>
      </div>

      {/* ── Performance KPI Cards ────────────────────────────────── */}
      <div className="dash-section">
        <div className="dash-section-header">
          <span className="dash-section-title"><BarChart3 size={11} /> Pipeline Performance</span>
          <button className="dash-section-link" onClick={() => navigate('/pipeline')}>View Pipeline →</button>
        </div>
        <div className="dash-stats-row">
          <StatCard
            label="Pipeline MRR"
            value={fmtINR(totalARR)}
            delta="Real-time total"
            deltaType="green"
            icon={DollarSign}
            iconBg="rgba(22,163,74,0.08)"
            iconColor="#16a34a"
            accent="#16a34a"
            onClick={() => navigate('/pipeline')}
          />
          <StatCard
            label="Won MRR"
            value={fmtINR(wonARR)}
            delta={`${closedThisMonth} closed this month`}
            deltaType="green"
            icon={TrendingUp}
            iconBg="rgba(22,163,74,0.08)"
            iconColor="#16a34a"
            accent="#16a34a"
            onClick={() => navigate('/pipeline')}
          />
          <StatCard
            label="Active Deals"
            value={deals.filter(d => d.stage !== 'Closed Won' && d.stage !== 'Closed Lost').length}
            delta={`↑ ${newDealsThisWeek} new this week`}
            deltaType="blue"
            icon={BarChart3}
            iconBg="rgba(37,99,235,0.08)"
            iconColor="#2563eb"
            accent="#2563eb"
            onClick={() => navigate('/pipeline')}
          />
          <StatCard
            label="Hot Leads"
            value={hotLeads.length}
            delta="Signal score ≥ 70"
            deltaType="hot"
            icon={Flame}
            iconBg="rgba(220,38,38,0.08)"
            iconColor="#dc2626"
            accent="#dc2626"
            onClick={() => navigate('/leads')}
          />
          <StatCard
            label="Proposals Out"
            value={proposalStats.sent}
            delta={`${proposalStats.accepted} accepted`}
            deltaType="green"
            icon={FileText}
            iconBg="rgba(124,58,237,0.08)"
            iconColor="#7c3aed"
            accent="#7c3aed"
            onClick={() => navigate('/pipeline')}
          />
          <StatCard
            label="Lead → Deal Rate"
            value={`${conversionRate}%`}
            delta={`${leads.length} leads · ${deals.length} deals`}
            deltaType="blue"
            icon={Target}
            iconBg="rgba(8,145,178,0.08)"
            iconColor="#0891b2"
            accent="#0891b2"
            onClick={() => navigate('/leads')}
          />
        </div>
      </div>

      {/* ── AI Command Bar ───────────────────────────────────────── */}
      <div className="dash-ai-bar">
        <div className="dash-ai-header">
          <div className="dash-ai-icon-wrap"><Sparkles size={15} /></div>
          <div>
            <div className="dash-ai-title">AI Sales Intelligence</div>
            <div className="dash-ai-sub">Ask anything about your pipeline, deals, or get AI-generated content</div>
          </div>
        </div>
        <form className="dash-ai-form" onSubmit={handleAIQuery}>
          <input
            className="dash-ai-input"
            value={aiQuery}
            onChange={e => setAiQuery(e.target.value)}
            placeholder="e.g. 'Show hot leads', 'Generate follow-up for Notion', 'Pipeline forecast'…"
          />
          <button className="btn btn-primary btn-sm" type="submit" disabled={aiLoading} style={{ height: 36, paddingLeft: 16, paddingRight: 16, gap: 6 }}>
            {aiLoading ? 'Thinking…' : <><Sparkles size={13} /> Ask AI</>}
          </button>
        </form>
        {aiResponse && (
          <div className="dash-ai-response">
            <pre className="dash-ai-response-text">{aiResponse}</pre>
          </div>
        )}
      </div>

      {/* ── Main 2-col grid: Goals + Top Leads ──────────────────── */}
      <div className="dash-main-grid">

        {/* Left: Goal Trackers */}
        <div className="dash-panel">
          <div className="dash-panel-header">
            <span className="dash-panel-title"><PhoneCall size={13} color="#2563eb" /> Daily Goals & Targets</span>
            <button className="dash-panel-link" onClick={() => navigate('/call-logs')}>Call Logs →</button>
          </div>
          <div className="dash-panel-body">
            {/* Call Goal */}
            <div className="dash-goal-block">
              <div className="dash-goal-row">
                <span className="dash-goal-label">📞 Daily Call Goal</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {editingGoal ? (
                    <input
                      className="dash-goal-input"
                      type="number"
                      defaultValue={callGoal}
                      autoFocus
                      onBlur={e => { const v = parseInt(e.target.value, 10); if (v > 0) saveCallGoal(v); else setEditingGoal(false); }}
                      onKeyDown={e => { if (e.key === 'Enter') e.target.blur(); }}
                    />
                  ) : (
                    <button className="dash-goal-edit-btn" onClick={() => setEditingGoal(true)} title="Click to change goal">
                      {callGoal} calls ✏
                    </button>
                  )}
                </div>
              </div>
              <div className="dash-goal-bar">
                <div className="dash-goal-fill blue" style={{ width: `${Math.min((callsLoggedToday / callGoal) * 100, 100)}%` }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                <span className="dash-goal-note">
                  <strong style={{ color: 'var(--text-primary)' }}>{callsLoggedToday}</strong> of {callGoal} calls logged today
                </span>
                {pendingCallLogs > 0 && (
                  <button className="dash-pending-badge" onClick={() => navigate('/call-logs')} title={`${pendingCallLogs} call logs not pushed to Leads`}>
                    ⚠ {pendingCallLogs} unpushed → Push Now
                  </button>
                )}
              </div>
            </div>

            {/* Demo Target — Monthly */}
            <div className="dash-goal-block">
              <div className="dash-goal-row">
                <span className="dash-goal-label">🎯 Demo Target — Month</span>
                <span className="dash-goal-nums">Target: <strong>{DEMO_TARGET_MONTH}</strong></span>
              </div>
              <div className="dash-goal-bar">
                <div className="dash-goal-fill purple" style={{ width: `${Math.min((completedDemosThisMonth / DEMO_TARGET_MONTH) * 100, 100)}%` }} />
              </div>
              <div className="dash-goal-note">
                <strong style={{ color: 'var(--text-primary)' }}>{completedDemosThisMonth}</strong> of {DEMO_TARGET_MONTH} demos completed this month
              </div>
            </div>

            {/* Demo Target — Weekly */}
            <div className="dash-goal-block">
              <div className="dash-goal-row">
                <span className="dash-goal-label">📅 Demo Target — Week</span>
                <span className="dash-goal-nums">Target: <strong>{DEMO_TARGET_WEEK}</strong></span>
              </div>
              <div className="dash-goal-bar">
                <div className="dash-goal-fill green" style={{ width: `${Math.min((completedDemosThisWeek / DEMO_TARGET_WEEK) * 100, 100)}%` }} />
              </div>
              <div className="dash-goal-note">
                <strong style={{ color: 'var(--text-primary)' }}>{completedDemosThisWeek}</strong> of {DEMO_TARGET_WEEK} demos this week
              </div>
            </div>

            {/* Team Activity snapshot */}
            <div className="dash-goal-block" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {[
                { label: 'Tasks Done Today', val: tasksCompletedToday.length, color: '#16a34a' },
                { label: 'Meetings (7d)',     val: meetingsHeldThisWeek.length, color: '#2563eb' },
                { label: 'New Leads (7d)',    val: newLeadsThisWeek.length, color: '#7c3aed' },
              ].map(m => (
                <div key={m.label} style={{ textAlign: 'center', padding: '8px 4px', background: 'var(--bg-base)', borderRadius: 8, border: '1px solid var(--bg-border)' }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: m.color, letterSpacing: '-0.04em' }}>{m.val}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-tertiary)', fontWeight: 600, marginTop: 2 }}>{m.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Top Leads to Call */}
        <div className="dash-panel">
          <div className="dash-panel-header">
            <span className="dash-panel-title">
              <Flame size={13} color="#dc2626" /> Top Leads to Call
              <span className="dash-panel-badge">{topLeadsToCall.length}</span>
            </span>
            <button className="dash-panel-link" onClick={() => navigate('/leads')}>See All →</button>
          </div>
          <div className="dash-panel-body">
            {topLeadsToCall.length === 0 ? (
              <div className="dash-lead-empty">🎉 All leads contacted today! Great work.</div>
            ) : (
              topLeadsToCall.map((lead, i) => {
                const scoreColor = lead._score >= 70 ? '#dc2626' : lead._score >= 35 ? '#d97706' : '#94a3b8';
                const avatarColor = AVATAR_COLORS[lead.company_name?.charCodeAt(0) % AVATAR_COLORS.length] || '#3b82f6';
                return (
                  <div key={lead.id} className="dash-lead-row" style={{ animationDelay: `${i * 50}ms` }} onClick={() => navigate('/leads')}>
                    <span className="dash-lead-rank">#{i + 1}</span>
                    <div className="dash-lead-avatar" style={{ background: avatarColor + '18', color: avatarColor }}>
                      {(lead.company_name || '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="dash-lead-info">
                      <span className="dash-lead-company">{lead.company_name || 'Unknown'}</span>
                      <span className="dash-lead-sub">{lead.contact_name || lead.stage}</span>
                    </div>
                    <div className="dash-lead-score" style={{ background: scoreColor + '12', color: scoreColor }}>
                      {lead._score}
                    </div>
                    {lead.phone && (
                      <a href={`tel:${lead.phone}`} className="dash-lead-phone-btn" onClick={e => e.stopPropagation()} title={lead.phone}>
                        <Phone size={11} />
                      </a>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ── Today's Priorities ──────────────────────────────────── */}
      <div className="dash-section">
        <div className="dash-section-header">
          <span className="dash-section-title"><AlertCircle size={11} /> Today's Priorities</span>
        </div>
        <div className="dash-priority-grid">
          <PriorityCard icon={AlertCircle}  label="Overdue Tasks"         count={overdueTasks.length}        urgency="urgent"   color="var(--danger)"       onClick={() => navigate('/tasks')} />
          <PriorityCard icon={Calendar}     label="Demos Today"            count={todayMeetings.length}       urgency="high"     color="var(--accent-blue)"  onClick={() => navigate('/meetings')} />
          <PriorityCard icon={Clock}        label="Due Today"              count={tasksDueToday.length}       urgency="medium"   color="var(--warning)"      onClick={() => navigate('/tasks')} />
          <PriorityCard icon={FileText}     label="Proposals Out"          count={proposalStats.sent}         urgency="low"      color="var(--accent-purple)"onClick={() => navigate('/pipeline')} />
          <PriorityCard icon={TrendingUp}   label="Stale Deals"            count={staleDeals.length}          urgency="warning"  color="var(--orange)"       onClick={() => navigate('/pipeline')} />
          <PriorityCard icon={Zap}          label="Hot Leads"              count={hotLeads.length}            urgency="positive" color="var(--success)"      onClick={() => navigate('/leads')} />
          <PriorityCard icon={BarChart3}    label="Trials Needing Review"  count={trialsNeedingReview.length} urgency={trialsNeedingReview.length > 0 ? 'urgent' : 'low'} color={trialsNeedingReview.length > 0 ? 'var(--danger)' : 'var(--text-secondary)'} onClick={() => navigate('/pipeline')} />
          <PriorityCard icon={Users}        label="Total Contacts"         count={contacts?.length || 0}      urgency="low"      color="var(--text-secondary)"onClick={() => navigate('/contacts')} />
        </div>
      </div>

      {/* ── Team Activity & Performance ──────────────────────────── */}
      <div className="dash-section">
        <div className="dash-section-header">
          <span className="dash-section-title"><Trophy size={11} /> Team Activity & Performance</span>
          <button className="dash-section-link" onClick={() => navigate('/team')}>View Team →</button>
        </div>
        <div className="dash-priority-grid">
          <PriorityCard icon={CheckCircle2} label="Tasks Done Today"    count={tasksCompletedToday.length}   urgency="positive" color="var(--success)"      onClick={() => navigate('/tasks')} />
          <PriorityCard icon={Presentation} label="Meetings This Week"  count={meetingsHeldThisWeek.length}  urgency="high"     color="var(--accent-blue)"  onClick={() => navigate('/meetings')} />
          <PriorityCard icon={Users}        label="New Leads (7d)"      count={newLeadsThisWeek.length}      urgency="medium"   color="var(--accent-purple)"onClick={() => navigate('/leads')} />
          <PriorityCard icon={Send}         label="Proposals Sent (7d)" count={proposalsSentThisWeek.length} urgency="low"      color="var(--text-secondary)"onClick={() => navigate('/pipeline')} />
          <PriorityCard icon={TrendingUp}   label="Deals Won (30d)"     count={closedThisMonth}              urgency="warning"  color="var(--orange)"       onClick={() => navigate('/pipeline')} />
          <PriorityCard icon={Trophy}       label={`Top: ${topPerformerData.name}`} count={topPerformerData.count} urgency="urgent" color="var(--danger)"  onClick={() => navigate('/team')} />
        </div>
      </div>

      {/* ── Bottom: Insights + Activity Feed ────────────────────── */}
      <div className="dash-bottom-grid">

        {/* AI Insights */}
        <div className="dash-panel">
          <div className="dash-panel-header">
            <span className="dash-panel-title"><Sparkles size={13} color="#2563eb" /> AI Insights</span>
            <span className="dash-panel-badge">{aiInsights.length}</span>
          </div>
          <div className="dash-panel-body">
            <div className="dash-insights-list">
              {aiInsights.length > 0 ? aiInsights.map((ins, i) => (
                <div key={i} className="dash-insight-row" style={{ animationDelay: `${i * 40}ms` }}>
                  <div className="dash-insight-accent" style={{ background: ins.color }} />
                  <span className="dash-insight-emoji">{ins.icon}</span>
                  <span className="dash-insight-text">{ins.text}</span>
                  <button className="dash-insight-btn" onClick={ins.onClick}>{ins.action} →</button>
                </div>
              )) : (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '12px' }}>
                  No active insights. Add more data to generate AI recommendations.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="dash-panel">
          <div className="dash-panel-header">
            <span className="dash-panel-title"><Activity size={13} color="#7c3aed" /> Activity Feed</span>
            <span className="dash-panel-badge">{activityFeed.length}</span>
          </div>
          <div className="dash-panel-body">
            <div className="dash-activity-list">
              {activityFeed.length > 0 ? activityFeed.map((item, i) => (
                <div key={i} className="dash-activity-row" style={{ animationDelay: `${i * 30}ms` }}>
                  <span className="dash-activity-icon">{item.icon}</span>
                  <div className="dash-activity-body">
                    <span className="dash-activity-text">{item.text}</span>
                    <div className="dash-activity-meta">
                      {item.owner && <span className="dash-activity-owner">{item.owner}</span>}
                      <span className="dash-activity-time">
                        {item.time ? formatDistanceToNow(new Date(item.time), { addSuffix: true }) : 'Just now'}
                      </span>
                    </div>
                  </div>
                </div>
              )) : (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '12px' }}>
                  No recent activity. Actions by your team will appear here.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

