// ============================================
// HUNTLO SALES OS — HOME OS PAGE
// ============================================
import { useState, useMemo, useEffect, useCallback } from 'react';
import { Sparkles, AlertCircle, Calendar, FileText, Clock, TrendingUp, ArrowRight, Zap, Activity, Users, BarChart3, CheckCircle2, Presentation, Send, Trophy, Phone, Target, Flame, Coffee, Star, ChevronRight } from 'lucide-react';
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


function PriorityCard({ icon: Icon, label, count, urgency, color, onClick }) {
  return (
    <button className={`priority-card priority-${urgency}`} onClick={onClick}>
      <div className="priority-icon" style={{ background: color + '18', color }}><Icon size={16} /></div>
      <div className="priority-info">
        <span className="priority-count">{count}</span>
        <span className="priority-label">{label}</span>
      </div>
      <ArrowRight size={14} className="priority-arrow" />
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
      if (diffDays === 0) return data.count;      // same day
      if (diffDays === 1) return data.count;      // yesterday — still active
      return 0;                                   // streak broken
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
    
    // C1 FIX: Avoid mutating `today` — create a separate date for start-of-week
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const currentDay = today.getDay(); // 0 is Sunday
    const startOfWeek = todayMidnight - (currentDay * 86400000);

    meetings.forEach(m => {
      // H10 FIX: Only count current user's demos
      if (m.owner_id && m.owner_id !== user?.id) return;
      if ((m.type === 'Demo' || m.type === 'demo' || m.type === 'Discovery') && m.status === 'completed') {
        const d = new Date(m.date).getTime();
        if (d >= startOfMonth && d <= nowTime) {
          monthCount++;
        }
        if (d >= startOfWeek && d <= nowTime) {
          weekCount++;
        }
      }
    });
    return { completedDemosThisWeek: weekCount, completedDemosThisMonth: monthCount };
  }, [meetings, now, user]);
  
  const DEMO_TARGET_MONTH = 25;
  const DEMO_TARGET_WEEK = 6;

  // ── Top 5 leads to call today (hottest by score, not yet contacted today) ──
  const topLeadsToCall = useMemo(() => {
    const today = new Date().toDateString();
    return leads
      .filter(l => {
        if (l.stage === 'Lost' || l.stage === 'Customer') return false;
        // Not already contacted today
        const lastMod = l.updated_at || l.created_at;
        const wasUpdatedToday = lastMod && new Date(lastMod).toDateString() === today;
        return !wasUpdatedToday;
      })
      .map(l => ({ ...l, _score: computeSignalScore(l) }))
      .sort((a, b) => b._score - a._score)
      .slice(0, 5);
  }, [leads]);

  // ── Stale leads ──────────────────────────────────────────────────────────
  const staleLeads = useMemo(() => leads.filter(l => isLeadStale(l, 14) && l.stage !== 'Lost' && l.stage !== 'Customer').length, [leads]);

  // ── Incomplete leads ────────────────────────────────────────────────────
  const incompleteLeads = useMemo(() => leads.filter(l => computeCompleteness(l) < 50).length, [leads]);

  
  const pendingTasks = tasks.filter(t => t.status !== 'completed');
  const overdueTasks = tasks.filter(t => t.status !== 'completed' && new Date(t.due).getTime() < now);
  const tasksDueToday = tasks.filter(t => {
    if (t.status === 'completed') return false;
    const d = new Date(t.due);
    return d.toDateString() === new Date(now).toDateString();
  });
  const todayMeetings = meetings.filter(m => {
    const d = new Date(m.date);
    const today = new Date(now);
    return d.toDateString() === today.toDateString() || m.status === 'scheduled';
  });
  const meetingsThisWeek = meetings.filter(m => {
    const d = new Date(m.date).getTime();
    return d >= now && d <= now + 7 * 86400000;
  });
  const hotLeads = leads.filter(l => computeSignalScore(l) >= 70 && l.stage !== 'Lost');
  const staleDeals = deals.filter(d => {
    const days = (now - new Date(d.updated_at).getTime()) / 86400000;
    return days > 5 && d.stage !== 'Closed Won' && d.stage !== 'Closed Lost';
  });

  // GAP 5 — Trials Needing Review: deals in Trial with no meeting in last 7 days
  const trialsNeedingReview = deals.filter(d => {
    if (d.stage !== 'Trial') return false;
    const recentMeeting = meetings.find(m => {
      if (m.deal_id !== d.id) return false;
      return (now - new Date(m.date).getTime()) < 7 * 86400000;
    });
    return !recentMeeting;
  });
  // Count proposals from Supabase across all deals
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

  // Lead-to-Deal conversion rate
  const conversionRate = leads.length > 0 ? Math.round((deals.length / leads.length) * 100) : 0;

  const totalARR = deals
    .filter(d => d.stage !== 'Closed Lost')
    .reduce((sum, d) => sum + (d.arr || 0), 0);

  const wonARR = deals
    .filter(d => d.stage === 'Closed Won')
    .reduce((sum, d) => sum + (d.arr || 0), 0);

  const newDealsThisWeek = deals.filter(d => (now - new Date(d.created_at).getTime()) < 7 * 86400000).length;
  const closedThisMonth = deals.filter(d => d.stage === 'Closed Won' && (now - new Date(d.updated_at || d.created_at).getTime()) < 30 * 86400000).length;

  // ── Team Activity Metrics ──
  const tasksCompletedToday = tasks.filter(t => {
    if (t.status !== 'completed') return false;
    const d = new Date(t.updated_at || now);
    return d.toDateString() === new Date(now).toDateString();
  });

  const meetingsHeldThisWeek = meetings.filter(m => {
    const d = new Date(m.date).getTime();
    return d <= now && d >= now - 7 * 86400000;
  });

  const newLeadsThisWeek = leads.filter(l => (now - new Date(l.created_at).getTime()) < 7 * 86400000);
  
  const proposalsSentThisWeek = proposals ? proposals.filter(p => p.status !== 'draft' && (now - new Date(p.created_at).getTime()) < 7 * 86400000) : [];

  const topPerformerData = useMemo(() => {
    if (!team || team.length === 0) return { name: 'N/A', count: 0 };
    const wonThisMonthDeals = deals.filter(d => d.stage === 'Closed Won' && (now - new Date(d.updated_at || d.created_at).getTime()) < 30 * 86400000);
    const ownerCounts = {};
    wonThisMonthDeals.forEach(d => {
      if (d.owner_id) ownerCounts[d.owner_id] = (ownerCounts[d.owner_id] || 0) + 1;
    });
    let topId = null;
    let maxCount = 0;
    Object.entries(ownerCounts).forEach(([id, count]) => {
      if (count > maxCount) {
        maxCount = count;
        topId = id;
      }
    });
    const topMember = team.find(m => m.id === topId);
    return { name: topMember?.name || 'N/A', count: maxCount };
  }, [deals, team, now]);


  const activityFeed = useMemo(() => {
    const feed = [];
    const teamMap = new Map((team || []).map(m => [m.id, m.name || m.email]));
    const ownerName = (id) => teamMap.get(id) || 'Team';
    deals.forEach(d => feed.push({
      icon: '💼',
      text: `Deal: ${d.title} → ${d.stage}`,
      owner: ownerName(d.owner_id),
      time: d.updated_at || d.created_at
    }));
    meetings.forEach(m => feed.push({
      icon: '📅',
      text: `Meeting: ${m.title} scheduled`,
      owner: ownerName(m.owner_id),
      time: m.created_at
    }));
    tasks.forEach(t => feed.push({
      icon: '✅',
      text: `Task: ${t.title} — ${t.status}`,
      owner: ownerName(t.owner_id),
      time: t.updated_at || t.created_at
    }));
    documents.forEach(doc => feed.push({
      icon: '📄',
      text: `Document: ${doc.name} added`,
      owner: ownerName(doc.owner_id),
      time: doc.created_at
    }));
    leads.forEach(l => feed.push({
      icon: '👤',
      text: `Lead: ${l.company_name} added`,
      owner: ownerName(l.owner_id),
      time: l.created_at
    }));
    return feed.sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 12);
  }, [deals, meetings, tasks, documents, leads, team]);

  const aiInsights = useMemo(() => {
    const insights = [];
    if (staleDeals.length > 0) {
      insights.push({ type: 'warning', icon: '⚠️', text: `You have ${staleDeals.length} stale deals needing attention.`, action: 'View Deals', onClick: () => navigate('/pipeline') });
    }
    if (trialsNeedingReview.length > 0) {
      insights.push({ type: 'danger', icon: '🔔', text: `${trialsNeedingReview.length} trial deal${trialsNeedingReview.length > 1 ? 's' : ''} have had no success review in 7 days.`, action: 'Schedule Review', onClick: () => navigate('/meetings') });
    }
    if (hotLeads.length > 0) {
      insights.push({ type: 'success', icon: '🔥', text: `${hotLeads.length} hot leads are ready for outreach.`, action: 'Contact Now', onClick: () => navigate('/leads') });
    }
    if (overdueTasks.length > 0) {
      insights.push({ type: 'danger', icon: '⏰', text: `${overdueTasks.length} tasks are overdue.`, action: 'View Tasks', onClick: () => navigate('/tasks') });
    }
    if (insights.length === 0 && deals.length > 0) {
      insights.push({ type: 'info', icon: '💡', text: 'Pipeline is looking healthy. Keep pushing new leads.', action: 'Add Lead', onClick: () => navigate('/leads') });
    }
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

  return (
    <div className="home-os">

      {/* ── Morning Briefing ──────────────────────────────────── */}
      <section className="home-briefing">
        <div className="home-briefing-left">
          <div className="home-briefing-greeting">
            <span className="home-briefing-emoji">☀️</span>
            <div>
              <div className="home-briefing-title">Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.user_metadata?.full_name?.split(' ')[0] || 'there'}!</div>
              <div className="home-briefing-date">{format(new Date(), 'EEEE, MMMM d')}</div>
            </div>
          </div>

          {/* Call Goal Progress */}
          <div className="home-call-goal">
            <div className="home-goal-top">
              <span className="home-goal-label">📞 Call Goal</span>
              {editingGoal ? (
                <input
                  className="home-goal-input"
                  type="number"
                  defaultValue={callGoal}
                  autoFocus
                  onBlur={e => {
                    const v = parseInt(e.target.value, 10);
                    if (v > 0) { saveCallGoal(v); }
                    else setEditingGoal(false);
                  }}
                  onKeyDown={e => { if (e.key === 'Enter') e.target.blur(); }}
                  style={{ width: 48, fontSize: 12, padding: '2px 6px', borderRadius: 6, border: '1px solid var(--border-subtle)' }}
                />
              ) : (
                <span className="home-goal-target" onClick={() => setEditingGoal(true)} title="Click to change goal">{callGoal} calls</span>
              )}
            </div>
            <div className="home-goal-bar">
              <div className="home-goal-fill" style={{ width: `${Math.min((callsLoggedToday / callGoal) * 100, 100)}%` }} />
            </div>
            <div className="home-goal-bottom">
              <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{callsLoggedToday}</span>
              <span style={{ color: 'var(--text-tertiary)' }}>of {callGoal} calls logged today</span>
              {pendingCallLogs > 0 && (
                <button
                  className="home-pending-badge"
                  onClick={() => navigate('/call-logs')}
                  style={{ cursor: 'pointer', border: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                  title={`${pendingCallLogs} call logs have not been pushed to Leads yet`}
                >
                  ⚠ {pendingCallLogs} unpushed → Push Now
                </button>
              )}
            </div>
          </div>

          {/* SDR Demo Target Progress */}
          <div className="home-call-goal" style={{ marginTop: '16px' }}>
            <div className="home-goal-top">
              <span className="home-goal-label">🎯 Demo Target (SDR)</span>
              <span className="home-goal-target">Target: {DEMO_TARGET_MONTH} / mo</span>
            </div>
            
            <div className="home-goal-bar">
              <div className="home-goal-fill" style={{ width: `${Math.min((completedDemosThisMonth / DEMO_TARGET_MONTH) * 100, 100)}%`, background: 'var(--accent-purple)' }} />
            </div>
            <div className="home-goal-bottom">
              <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{completedDemosThisMonth}</span>
              <span style={{ color: 'var(--text-tertiary)' }}>of {DEMO_TARGET_MONTH} demos completed this month</span>
            </div>

            <div className="home-goal-bar" style={{ marginTop: '12px' }}>
              <div className="home-goal-fill" style={{ width: `${Math.min((completedDemosThisWeek / DEMO_TARGET_WEEK) * 100, 100)}%`, background: 'var(--accent-blue)' }} />
            </div>
            <div className="home-goal-bottom">
              <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{completedDemosThisWeek}</span>
              <span style={{ color: 'var(--text-tertiary)' }}>of {DEMO_TARGET_WEEK} demos completed this week</span>
            </div>
          </div>

          {/* Streak */}
          {streak > 0 && (
            <div className="home-streak">
              <span className="home-streak-fire">🔥</span>
              <span><strong>{streak}-day streak!</strong> Keep logging calls daily.</span>
            </div>
          )}
        </div>

        {/* Top 5 Leads to Call */}
        <div className="home-briefing-right">
          <div className="home-top-calls-header">
            <Flame size={14} style={{ color: '#dc2626' }} />
            <span>Top Leads to Call Today</span>
            <button className="home-see-all" onClick={() => navigate('/leads')}>See all →</button>
          </div>
          <div className="home-top-calls-list">
            {topLeadsToCall.length === 0 ? (
              <div className="home-top-calls-empty">🎉 All leads contacted today! Great work.</div>
            ) : (
              topLeadsToCall.map((lead, i) => {
                const scoreColor = lead._score >= 70 ? '#dc2626' : lead._score >= 35 ? '#d97706' : '#94a3b8';
                return (
                  <div key={lead.id} className="home-call-row" onClick={() => navigate('/leads')}>
                    <span className="home-call-rank">#{i + 1}</span>
                    <div className="home-call-avatar" style={{ background: scoreColor + '20', color: scoreColor }}>
                      {(lead.company_name || '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="home-call-info">
                      <span className="home-call-company">{lead.company_name || 'Unknown'}</span>
                      <span className="home-call-contact">{lead.contact_name || lead.stage}</span>
                    </div>
                    <div className="home-call-score" style={{ background: scoreColor + '15', color: scoreColor }}>
                      {lead._score}
                    </div>
                    {lead.phone && (
                      <a href={`tel:${lead.phone}`} className="home-call-phone-btn" onClick={e => e.stopPropagation()} title={lead.phone}>
                        <Phone size={12} />
                      </a>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>

      {/* Quick Stats strip */}
      <div className="home-quick-strip">
        <div className="home-qs-item" onClick={() => navigate('/tasks')}>
          <span className="home-qs-val">{tasksDueToday.length}</span>
          <span className="home-qs-label">Tasks Due Today</span>
        </div>
        <div className="home-qs-item" onClick={() => navigate('/meetings')}>
          <span className="home-qs-val">{todayMeetings.length}</span>
          <span className="home-qs-label">Meetings Today</span>
        </div>
        <div className="home-qs-item" onClick={() => navigate('/tasks')}>
          <span className="home-qs-val" style={{ color: '#dc2626' }}>{overdueTasks.length}</span>
          <span className="home-qs-label">Overdue Tasks</span>
        </div>
        <div className="home-qs-item" onClick={() => navigate('/leads')}>
          <span className="home-qs-val" style={{ color: '#d97706' }}>{staleLeads}</span>
          <span className="home-qs-label">Stale Leads</span>
        </div>
        <div className="home-qs-item" onClick={() => navigate('/leads')}>
          <span className="home-qs-val" style={{ color: '#6366f1' }}>{incompleteLeads}</span>
          <span className="home-qs-label">Incomplete Leads</span>
        </div>
        <div className="home-qs-item" onClick={() => navigate('/leads')}>
          <span className="home-qs-val" style={{ color: '#dc2626' }}>{hotLeads.length}</span>
          <span className="home-qs-label">🔥 Hot Leads</span>
        </div>
      </div>

      {/* AI Command Input */}
      <section className="home-ai-section">
        <div className="home-ai-header">
          <Sparkles size={18} className="home-ai-icon" />
          <div>
            <h2 className="home-ai-title">AI Sales Intelligence</h2>
            <p className="home-ai-sub">Ask anything about your pipeline, deals, or get AI-generated content</p>
          </div>
        </div>
        <form className="home-ai-form" onSubmit={handleAIQuery}>
          <input
            className="input-base home-ai-input"
            value={aiQuery}
            onChange={e => setAiQuery(e.target.value)}
            placeholder="e.g. 'Show hot leads', 'Generate follow-up for Notion', 'Pipeline forecast'..."
          />
          <button className="btn btn-primary btn-md" type="submit" disabled={aiLoading}>
            {aiLoading ? 'Thinking...' : <><Sparkles size={13} /> Ask AI</>}
          </button>
        </form>
        {aiResponse && (
          <div className="home-ai-response">
            <pre className="home-ai-response-text">{aiResponse}</pre>
          </div>
        )}
      </section>

      {/* Stats Row — 6 cards */}
      <section className="stats-row stats-row-6">
        <div className="stat-card">
          <span className="stat-label">Pipeline MRR</span>
          <span className="stat-value">{fmtINR(totalARR)}</span>
          <span className="stat-delta up">Real-time total</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Won MRR</span>
          <span className="stat-value">{fmtINR(wonARR)}</span>
          <span className="stat-delta up">{closedThisMonth} closed this month</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Active Deals</span>
          <span className="stat-value">{deals.filter(d => d.stage !== 'Closed Won' && d.stage !== 'Closed Lost').length}</span>
          <span className="stat-delta up">↑ {newDealsThisWeek} new this week</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Hot Leads</span>
          <span className="stat-value">{hotLeads.length}</span>
          <span className="stat-delta up">Score ≥ 70</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Proposals Out</span>
          <span className="stat-value">{proposalStats.sent}</span>
          <span className="stat-delta up">{proposalStats.accepted} accepted · {fmtINR(proposalStats.totalValue)} won</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Lead → Deal Rate</span>
          <span className="stat-value">{conversionRate}%</span>
          <span className="stat-delta up">{leads.length} leads · {deals.length} deals</span>
        </div>
      </section>

      {/* Today's Priorities */}
      <section className="section">
        <h2 className="section-title">Today's Priorities</h2>
        <div className="priorities-grid">
          <PriorityCard icon={AlertCircle} label="Overdue Tasks" count={overdueTasks.length} urgency="urgent" color="var(--danger)" onClick={() => navigate('/tasks')} />
          <PriorityCard icon={Calendar} label="Demos Today" count={todayMeetings.length} urgency="high" color="var(--accent-blue)" onClick={() => navigate('/meetings')} />
          <PriorityCard icon={Clock} label="Due Today" count={tasksDueToday.length} urgency="medium" color="var(--warning)" onClick={() => navigate('/tasks')} />
          <PriorityCard icon={FileText} label="Proposals Out" count={proposalStats.sent} urgency="low" color="var(--accent-purple)" onClick={() => navigate('/pipeline')} />
          <PriorityCard icon={TrendingUp} label="Stale Deals" count={staleDeals.length} urgency="warning" color="var(--orange)" onClick={() => navigate('/pipeline')} />
          <PriorityCard icon={Zap} label="Hot Leads" count={hotLeads.length} urgency="positive" color="var(--success)" onClick={() => navigate('/leads')} />
          <PriorityCard icon={BarChart3} label="Trials Needing Review" count={trialsNeedingReview.length} urgency={trialsNeedingReview.length > 0 ? 'urgent' : 'low'} color={trialsNeedingReview.length > 0 ? 'var(--danger)' : 'var(--text-secondary)'} onClick={() => navigate('/pipeline')} />
          <PriorityCard icon={Users} label="Total Contacts" count={contacts?.length || 0} urgency="low" color="var(--text-secondary)" onClick={() => navigate('/contacts')} />
        </div>
      </section>

      {/* Team Activity & Performance */}
      <section className="section">
        <h2 className="section-title">Team Activity & Performance</h2>
        <div className="priorities-grid">
          <PriorityCard icon={CheckCircle2} label="Tasks Done Today" count={tasksCompletedToday.length} urgency="positive" color="var(--success)" onClick={() => navigate('/tasks')} />
          <PriorityCard icon={Presentation} label="Meetings This Week" count={meetingsHeldThisWeek.length} urgency="high" color="var(--accent-blue)" onClick={() => navigate('/meetings')} />
          <PriorityCard icon={Users} label="New Leads (7d)" count={newLeadsThisWeek.length} urgency="medium" color="var(--accent-purple)" onClick={() => navigate('/leads')} />
          <PriorityCard icon={Send} label="Proposals Sent (7d)" count={proposalsSentThisWeek.length} urgency="low" color="var(--text-secondary)" onClick={() => navigate('/pipeline')} />
          <PriorityCard icon={TrendingUp} label="Deals Won (30d)" count={closedThisMonth} urgency="warning" color="var(--orange)" onClick={() => navigate('/pipeline')} />
          <PriorityCard icon={Trophy} label={`Top Performer: ${topPerformerData.name}`} count={topPerformerData.count} urgency="urgent" color="var(--danger)" onClick={() => navigate('/team')} />
        </div>
      </section>

      <div className="home-bottom-grid">
        {/* AI Insights */}
        <section className="section">
          <h2 className="section-title"><Sparkles size={14} /> AI Insights</h2>
          <div className="insights-list">
            {aiInsights.length > 0 ? aiInsights.map((ins, i) => (
              <div key={i} className={`insight-card insight-${ins.type}`}>
                <span className="insight-icon">{ins.icon}</span>
                <span className="insight-text">{ins.text}</span>
                <button className="insight-action" onClick={ins.onClick}>{ins.action} →</button>
              </div>
            )) : (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '13px' }}>
                No active insights. Connect more data sources to generate AI recommendations.
              </div>
            )}
          </div>
        </section>

        {/* Activity Feed */}
        <section className="section">
          <h2 className="section-title"><Activity size={14} /> Activity Feed</h2>
          <div className="activity-list">
            {activityFeed.length > 0 ? activityFeed.map((item, i) => (
              <div key={i} className="activity-item animate-fade-in" style={{ animationDelay: `${i * 40}ms` }}>
                <span className="activity-icon">{item.icon}</span>
                <div className="activity-body">
                  <span className="activity-text">{item.text}</span>
                  <div className="activity-footer">
                    {item.owner && <span className="activity-owner">{item.owner}</span>}
                    <span className="activity-time">
                      {item.time ? formatDistanceToNow(new Date(item.time), { addSuffix: true }) : 'Just now'}
                    </span>
                  </div>
                </div>
              </div>
            )) : (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '13px' }}>
                No recent activity. Actions taken by your team will appear here.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
