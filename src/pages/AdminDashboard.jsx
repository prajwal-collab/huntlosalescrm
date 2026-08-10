// ============================================
// HUNTLO SALES OS — FOUNDER / SALES LEADER DASHBOARD
// Executive-level revenue analytics, pipeline health & AI insights
// ============================================
import { useMemo, useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid
} from 'recharts';
import {
  TrendingUp, Clock, Target, ArrowUpRight, BarChart2,
  DollarSign, Briefcase, Star, Sparkles, Users, Phone,
  UserPlus, Activity, CheckCircle, Calendar, MapPin
} from 'lucide-react';
import useDataStore from '../store/useDataStore';
import useAuthStore from '../store/useAuthStore';
import { format, isValid, subDays, startOfDay, startOfWeek, startOfMonth, formatDistanceToNow } from 'date-fns';
import { generateExecutiveSummary } from '../lib/gemini';
import LeadDrawer from '../components/leads/LeadDrawer';
import './AdminDashboard.css';

const TIMEFRAME_LABELS = { today: 'Today', week: 'This Week', month: 'This Month', all: 'All Time' };

function safeDate(str) {
  if (!str) return null;
  const d = new Date(str);
  return isValid(d) ? d : null;
}

function getInitials(name = '') {
  return name.split(' ').map(w => w[0] || '').join('').slice(0, 2).toUpperCase() || '??';
}

function matchesTimeframe(date, tf) {
  if (!date) return false;
  const now = new Date();
  if (tf === 'today')  return date >= startOfDay(now);
  if (tf === 'week')   return date >= startOfWeek(now, { weekStartsOn: 1 });
  if (tf === 'month')  return date >= startOfMonth(now);
  return true; // 'all'
}

function fmtINR(amount) {
  const n = Number(amount) || 0;
  if (n >= 10000000) return `₹${(n/10000000).toFixed(2)}Cr`;
  if (n >= 100000)   return `₹${(n/100000).toFixed(1)}L`;
  if (n >= 1000)     return `₹${(n/1000).toFixed(0)}k`;
  return `₹${n}`;
}

export default function AdminDashboard() {
  const { deals, tasks, leads, meetings } = useDataStore();
  const { user, team, fetchTeam } = useAuthStore();
  const [timeframe, setTimeframe] = useState('week'); // today, week, month, all
  const [activeTab, setActiveTab] = useState('overview'); // overview, activity, leaderboard, field-ops, ai-insights
  const [expandedRepId, setExpandedRepId] = useState(null);
  
  // AI Insights
  const [aiSummary, setAiSummary] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState(null);

  useEffect(() => { fetchTeam(); }, [fetchTeam]);

  // ── Role guard ───────────────────────────────────────────────────────────
  const userProfile = team?.find(m => m.id === user?.id);
  const isAdmin = user?.email === 'prajwal@earlyjobs.in' || userProfile?.role === 'Admin' || userProfile?.role === 'Manager';

  if (!isAdmin) {
    return (
      <div className="adm-access-denied">
        <div className="adm-denied-icon">🔒</div>
        <div className="adm-denied-title">Executive Access Required</div>
        <div className="adm-denied-desc">
          This dashboard is restricted to Founders and Sales Leaders only. Contact your workspace admin if you need access.
        </div>
      </div>
    );
  }

  // ── Process Deals Data ─────────────────────────────────────────────────
  const allDeals = useMemo(() => {
    return deals.map(d => ({
      ...d,
      createdAt: safeDate(d.created_at),
      lastActivity: safeDate(d.last_activity),
      amount: Number(d.arr) || 0,
    }));
  }, [deals]);

  const filteredDeals = useMemo(
    () => allDeals.filter(d => matchesTimeframe(d.createdAt, timeframe)),
    [allDeals, timeframe]
  );

  // ── Process Tasks Data ──────────────────────────────────────────────────
  const allCallTasks = useMemo(() => {
    return tasks
      .filter(t =>
        t.type === 'cold_call' ||
        (t.type === 'calling_list_item' && t.status === 'completed') ||
        (t.type === 'call' && t.notes?.includes('cold_call_log'))
      )
      .map(t => {
        let data = {};
        try { data = JSON.parse(t.notes || '{}'); } catch (_) {}
        const createdAt = safeDate(data.timestamp || t.created_at);
        return {
          ...t,
          createdAt,
          outcome: data.outcome || 'unknown',
        };
      });
  }, [tasks]);

  const filteredCalls = useMemo(
    () => allCallTasks.filter(c => matchesTimeframe(c.createdAt, timeframe)),
    [allCallTasks, timeframe]
  );

  // ── Active team members ─────────────────────────────────
  const activeTeam = useMemo(
    () => (team || []).filter(m => m.type !== 'invite'),
    [team]
  );

  // ── Revenue & Pipeline KPIs ─────────────────────────────────────────────
  const kpis = useMemo(() => {
    // Pipeline MRR (Total open deals created in timeframe)
    const pipelineDeals = filteredDeals.filter(d => !['Closed Won', 'Closed Lost'].includes(d.stage));
    const pipelineMRR = pipelineDeals.reduce((sum, d) => sum + d.amount, 0);

    // Won MRR (Deals won in timeframe)
    const wonDeals = allDeals.filter(d => d.stage === 'Closed Won' && matchesTimeframe(d.lastActivity || d.createdAt, timeframe));
    const wonMRR = wonDeals.reduce((sum, d) => sum + d.amount, 0);

    // Win Rate (Won / (Won + Lost))
    const wonCount = wonDeals.length;
    const lostDeals = allDeals.filter(d => d.stage === 'Closed Lost' && matchesTimeframe(d.lastActivity || d.createdAt, timeframe));
    const lostCount = lostDeals.length;
    const totalClosed = wonCount + lostCount;
    const winRate = totalClosed > 0 ? ((wonCount / totalClosed) * 100).toFixed(1) : 0;

    // Average Deal Size (based on all won deals in timeframe)
    const avgDealSize = wonCount > 0 ? (wonMRR / wonCount) : 0;

    return { pipelineMRR, wonMRR, winRate, avgDealSize, pipelineDealsCount: pipelineDeals.length, wonCount };
  }, [filteredDeals, allDeals, timeframe]);

  // ── SDR Performance (enriched with leads, meetings, tasks, calls) ─────────
  const sdrStats = useMemo(() => {
    return activeTeam.map(member => {
      const memberDeals = filteredDeals.filter(d => d.owner_id === member.id);
      const memberCalls = filteredCalls.filter(c => c.owner_id === member.id);

      // Leads added in timeframe
      const memberLeads = leads.filter(l =>
        l.owner_id === member.id && matchesTimeframe(safeDate(l.created_at), timeframe)
      );

      // Meetings set in timeframe
      const memberMeetings = (meetings || []).filter(m =>
        m.owner_id === member.id && matchesTimeframe(safeDate(m.created_at || m.date), timeframe)
      );
      const demosScheduled = memberMeetings.filter(m => m.type === 'Demo' || m.type === 'demo').length;
      const demosAttended = memberMeetings.filter(m =>
        (m.type === 'Demo' || m.type === 'demo') && (m.attended || m.status === 'completed')
      ).length;

      // Tasks completed in timeframe
      const memberTasksDone = tasks.filter(t =>
        (t.owner_id === member.id || t.assigned_to === member.id) &&
        t.status === 'completed' &&
        t.type !== 'cold_call' && t.type !== 'calling_list_item' &&
        matchesTimeframe(safeDate(t.updated_at || t.created_at), timeframe)
      );

      const dealsCreated = memberDeals.length;
      const pipelineGenerated = memberDeals.reduce((sum, d) => sum + d.amount, 0);

      const memberWonDeals = allDeals.filter(d =>
        d.owner_id === member.id && d.stage === 'Closed Won' &&
        matchesTimeframe(d.lastActivity || d.createdAt, timeframe)
      );
      const revenueClosed = memberWonDeals.reduce((sum, d) => sum + d.amount, 0);

      const totalCalls = memberCalls.length;
      const connectedCalls = memberCalls.filter(c => c.outcome === 'connected').length;
      const voicemailCalls = memberCalls.filter(c => c.outcome === 'voicemail').length;
      const noAnswerCalls = memberCalls.filter(c => c.outcome === 'no_answer' || c.outcome === 'busy').length;
      const connectRate = totalCalls > 0 ? Math.round((connectedCalls / totalCalls) * 100) : 0;

      // Recent call logs (last 20)
      const recentCalls = memberCalls
        .filter(c => c.createdAt)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 20);

      // Recent leads (last 10)
      const recentLeads = memberLeads
        .filter(l => l.created_at)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 10);

      return {
        ...member,
        dealsCreated,
        pipelineGenerated,
        revenueClosed,
        totalCalls,
        connectedCalls,
        voicemailCalls,
        noAnswerCalls,
        connectRate,
        leadsAdded: memberLeads.length,
        meetingsSet: memberMeetings.length,
        demosScheduled,
        demosAttended,
        tasksDone: memberTasksDone.length,
        recentCalls,
        recentLeads,
      };
    }).sort((a, b) => b.revenueClosed - a.revenueClosed || b.pipelineGenerated - a.pipelineGenerated);
  }, [activeTeam, filteredDeals, filteredCalls, allDeals, leads, meetings, tasks, timeframe]);

  // ── Pipeline Health / Funnel ─────────────────────────────────────────
  const funnelStages = useMemo(() => {
    // A simplified funnel view across all open deals (regardless of timeframe)
    const openDeals = allDeals.filter(d => !['Closed Won', 'Closed Lost'].includes(d.stage));
    
    let leadCount = leads.length; 
    let discoveryCount = openDeals.filter(d => ['Discovery', 'Qualification'].includes(d.stage)).length;
    let proposalCount = openDeals.filter(d => ['Proposal', 'Trial'].includes(d.stage)).length;
    let negotiationCount = openDeals.filter(d => d.stage === 'Negotiation').length;
    
    return [
      { name: 'Leads', count: leadCount, color: '#3b82f6' },
      { name: 'Discovery', count: discoveryCount, color: '#8b5cf6' },
      { name: 'Proposal', count: proposalCount, color: '#f59e0b' },
      { name: 'Negotiation', count: negotiationCount, color: '#ef4444' }
    ];
  }, [allDeals, leads]);

  // ── Field Visits ───────────────────────────────────────────────────────────
  const fieldVisits = useMemo(() => {
    return tasks
      .filter(t => t.type === 'field_visit')
      .map(t => {
        let parsed = {};
        try { parsed = JSON.parse(t.notes || '{}'); } catch(e) {}
        const lead = leads.find(l => l.id === parsed.lead_id);
        const owner = team?.find(m => m.id === t.owner_id);
        return {
          id: t.id,
          leadId: lead?.id,
          status: t.status,
          ownerName: owner?.name || owner?.email || 'Unknown Rep',
          leadName: lead?.contact_name || lead?.company_name || 'Unknown Lead',
          lat: parsed.check_in_lat,
          lng: parsed.check_in_lng,
          checkInTime: parsed.check_in_time,
          checkOutTime: parsed.check_out_time,
          photo: parsed.photo_url,
          notes: parsed.meeting_notes,
          timestamp: new Date(t.created_at).getTime()
        };
      })
      .sort((a, b) => b.timestamp - a.timestamp)
      .filter(v => matchesTimeframe(v.timestamp, timeframe));
  }, [tasks, leads, team, timeframe]);

  // ── Generate Executive Summary ──────────────────────────────────────────
  const handleGenerateAI = async () => {
    setAiLoading(true);
    try {
      const payload = {
        timeframe,
        metrics: kpis,
        topPerformers: sdrStats.slice(0, 3).map(s => ({ name: s.full_name || s.name || s.email, pipeline: s.pipelineGenerated, closed: s.revenueClosed, connectRate: s.connectRate })),
        funnel: funnelStages
      };
      const res = await generateExecutiveSummary(JSON.stringify(payload));
      setAiSummary(res);
    } catch (e) {
      setAiSummary("Failed to generate insights. Ensure your Gemini API key is configured.");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="adm-container">
      {/* ── Header ── */}
      <header className="adm-header">
        <div className="adm-header-top">
          <div className="adm-title-section">
            <div className="adm-title-icon"><BarChart2 size={22} /></div>
            <div>
              <h1 className="adm-title">Executive Dashboard</h1>
              <p className="adm-subtitle">Revenue analytics, pipeline health & intelligence for leadership</p>
            </div>
          </div>
          <div className="adm-header-actions">
            <div className="adm-live-badge">
              <span className="adm-live-dot" /> Live
            </div>
            <div className="adm-timeframe-tabs">
              {Object.entries(TIMEFRAME_LABELS).map(([k, v]) => (
                <button
                  key={k}
                  className={`adm-tf-btn ${timeframe === k ? 'active' : ''}`}
                  onClick={() => setTimeframe(k)}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="adm-tabs">
          {[
            { id: 'overview',     label: '📊 Overview' },
            { id: 'sdr-activity', label: '👤 SDR Activity' },
            { id: 'leaderboard',  label: '🏆 Team Performance' },
            { id: 'field-ops',    label: '📍 Field Ops' },
            { id: 'ai-insights',  label: '🧠 Founder Insights' },
          ].map(t => (
            <button
              key={t.id}
              className={`adm-tab ${activeTab === t.id ? 'active' : ''}`}
              onClick={() => setActiveTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>

      <main className="adm-main">

        {/* ── KPI cards (always visible) ── */}
        <div className="adm-metrics-row">
          <div className="adm-metric-card" style={{ '--card-accent': '#3b82f6', '--icon-bg': 'rgba(59,130,246,0.12)' }}>
            <div className="adm-metric-top">
              <span className="adm-metric-label">Pipeline Generated</span>
              <span className="adm-metric-icon"><Target size={15} /></span>
            </div>
            <div className="adm-metric-value">{fmtINR(kpis.pipelineMRR)}</div>
            <div className="adm-metric-sub">{kpis.pipelineDealsCount} open deals</div>
          </div>

          <div className="adm-metric-card" style={{ '--card-accent': '#16a34a', '--icon-bg': 'rgba(22,163,74,0.12)' }}>
            <div className="adm-metric-top">
              <span className="adm-metric-label">Revenue Closed</span>
              <span className="adm-metric-icon"><DollarSign size={15} /></span>
            </div>
            <div className="adm-metric-value" style={{ color: '#16a34a' }}>{fmtINR(kpis.wonMRR)}</div>
            <div className="adm-metric-sub up"><ArrowUpRight size={12} />{kpis.wonCount} won deals</div>
          </div>

          <div className="adm-metric-card" style={{ '--card-accent': '#8b5cf6', '--icon-bg': 'rgba(139,92,246,0.12)' }}>
            <div className="adm-metric-top">
              <span className="adm-metric-label">Win Rate</span>
              <span className="adm-metric-icon"><TrendingUp size={15} /></span>
            </div>
            <div className="adm-metric-value">{kpis.winRate}%</div>
            <div className="adm-metric-sub">Closed Won / Total Closed</div>
          </div>

          <div className="adm-metric-card" style={{ '--card-accent': '#f59e0b', '--icon-bg': 'rgba(245,158,11,0.12)' }}>
            <div className="adm-metric-top">
              <span className="adm-metric-label">Avg Deal Size</span>
              <span className="adm-metric-icon"><Briefcase size={15} /></span>
            </div>
            <div className="adm-metric-value">{fmtINR(kpis.avgDealSize)}</div>
            <div className="adm-metric-sub">Based on won deals</div>
          </div>
        </div>

        {/* ── Overview tab ── */}
        {activeTab === 'overview' && (
          <>
            <div className="adm-charts-row">
              {/* Funnel: Deal Velocity */}
              <div className="adm-chart-card">
                <div className="adm-chart-title">🔄 Pipeline Health (All Open)</div>
                <div style={{ display: 'flex', gap: 0, alignItems: 'stretch', marginTop: 16 }}>
                  {funnelStages.map((step, i) => (
                    <div key={i} style={{ flex: 1, padding: '16px 20px', borderRight: i < funnelStages.length - 1 ? '1px solid var(--border-subtle)' : 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{step.name}</div>
                      <div style={{ fontSize: 32, fontWeight: 900, color: step.color }}>{step.count}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top SDRs Snapshot */}
              <div className="adm-chart-card">
                <div className="adm-chart-title">⭐ Top Performers (Revenue)</div>
                <div className="adm-leaderboard" style={{ marginTop: 16 }}>
                  {sdrStats.slice(0, 3).map((u, i) => (
                    <div key={u.id} className="adm-lb-row" style={{ padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                      <span className={`adm-lb-rank`} style={{ color: i === 0 ? '#fbbf24' : i === 1 ? '#94a3b8' : '#b45309', fontWeight: 800, fontSize: 16 }}>#{i + 1}</span>
                      <div className="adm-lb-avatar">{getInitials(u.full_name || u.name || u.email)}</div>
                      <div className="adm-lb-info">
                        <div className="adm-lb-name">{u.full_name || u.name || 'Unknown'}</div>
                        <div className="adm-lb-detail">{u.dealsCreated} deals created</div>
                      </div>
                      <div className="adm-lb-stats">
                        <span className="adm-lb-calls" style={{ color: '#16a34a' }}>{fmtINR(u.revenueClosed)}</span>
                      </div>
                    </div>
                  ))}
                  {sdrStats.length === 0 && <div className="adm-empty">No SDR data available.</div>}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── SDR Activity tab ── */}
        {activeTab === 'sdr-activity' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* Summary strip */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
              {[
                { label: 'Leads Added', value: sdrStats.reduce((s, m) => s + m.leadsAdded, 0), color: '#3b82f6', icon: '👤' },
                { label: 'Call Logs', value: sdrStats.reduce((s, m) => s + m.totalCalls, 0), color: '#ef4444', icon: '📞' },
                { label: 'Connected', value: sdrStats.reduce((s, m) => s + m.connectedCalls, 0), color: '#16a34a', icon: '✅' },
                { label: 'Demos Set', value: sdrStats.reduce((s, m) => s + m.demosScheduled, 0), color: '#8b5cf6', icon: '📅' },
                { label: 'Demos Attended', value: sdrStats.reduce((s, m) => s + m.demosAttended, 0), color: '#10b981', icon: '🎥' },
                { label: 'Tasks Done', value: sdrStats.reduce((s, m) => s + m.tasksDone, 0), color: '#f59e0b', icon: '✔️' },
              ].map(m => (
                <div key={m.label} className="adm-metric-card" style={{ '--card-accent': m.color, '--icon-bg': m.color + '18', padding: '16px 20px' }}>
                  <div style={{ fontSize: 22, marginBottom: 4 }}>{m.icon}</div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: m.color, lineHeight: 1 }}>{m.value}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{m.label}</div>
                </div>
              ))}
            </div>

            {/* Per-SDR cards grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 20 }}>
              {sdrStats.length === 0 && (
                <div className="adm-empty" style={{ gridColumn: '1/-1', padding: 40 }}>No team members found. Invite users in Settings to see activity here.</div>
              )}
              {sdrStats.map(sdr => {
                const name = sdr.full_name || sdr.name || sdr.email || 'Unknown';
                const initials = getInitials(name);
                const isExpanded = selectedSdr === sdr.id;
                const connectPct = sdr.totalCalls > 0 ? Math.round((sdr.connectedCalls / sdr.totalCalls) * 100) : 0;

                return (
                  <div key={sdr.id} className="adm-chart-card" style={{ padding: 0, overflow: 'hidden', border: isExpanded ? '1px solid var(--accent-blue)' : '1px solid var(--border-subtle)' }}>

                    {/* Card header */}
                    <div
                      style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', cursor: 'pointer', background: isExpanded ? 'rgba(59,130,246,0.06)' : 'transparent' }}
                      onClick={() => setSelectedSdr(isExpanded ? null : sdr.id)}
                    >
                      <div className="adm-lb-avatar" style={{ width: 44, height: 44, fontSize: 15, flexShrink: 0, background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)' }}>{initials}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>{sdr.role || 'SDR'} {sdr.team ? `· ${sdr.team}` : ''}</div>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{isExpanded ? '▲ collapse' : '▼ details'}</div>
                    </div>

                    {/* Stat pills */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0, borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
                      {[
                        { label: 'Leads Added', value: sdr.leadsAdded, color: '#3b82f6' },
                        { label: 'Calls Logged', value: sdr.totalCalls, color: '#ef4444' },
                        { label: 'Connected', value: sdr.connectedCalls, color: '#16a34a' },
                        { label: 'Demos Set', value: sdr.demosScheduled, color: '#8b5cf6' },
                        { label: 'Demos Att.', value: sdr.demosAttended, color: '#10b981' },
                        { label: 'Tasks Done', value: sdr.tasksDone, color: '#f59e0b' },
                      ].map((stat, i) => (
                        <div key={i} style={{
                          padding: '12px 16px',
                          borderRight: (i + 1) % 3 !== 0 ? '1px solid var(--border-subtle)' : 'none',
                          borderBottom: i < 3 ? '1px solid var(--border-subtle)' : 'none',
                          textAlign: 'center'
                        }}>
                          <div style={{ fontSize: 22, fontWeight: 800, color: stat.color }}>{stat.value}</div>
                          <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{stat.label}</div>
                        </div>
                      ))}
                    </div>

                    {/* Call connect rate bar */}
                    <div style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: isExpanded ? '1px solid var(--border-subtle)' : 'none' }}>
                      <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 600, minWidth: 90 }}>Connect Rate</span>
                      <div style={{ flex: 1, height: 6, borderRadius: 99, background: 'var(--bg-elevated)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${connectPct}%`, background: connectPct >= 30 ? '#16a34a' : connectPct >= 15 ? '#f59e0b' : '#ef4444', borderRadius: 99, transition: 'width 0.5s ease' }} />
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: connectPct >= 30 ? '#16a34a' : connectPct >= 15 ? '#f59e0b' : '#ef4444', minWidth: 36, textAlign: 'right' }}>{connectPct}%</span>
                      {sdr.voicemailCalls > 0 && <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>📩 {sdr.voicemailCalls} VM</span>}
                      {sdr.noAnswerCalls > 0 && <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>📵 {sdr.noAnswerCalls} NA</span>}
                    </div>

                    {/* Expanded: Recent Call Logs + Recent Leads */}
                    {isExpanded && (
                      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>

                        {/* Recent Call Logs */}
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 6 }}>
                            📞 Recent Call Logs
                          </div>
                          {sdr.recentCalls.length === 0 ? (
                            <div style={{ fontSize: 12, color: 'var(--text-tertiary)', padding: '8px 0' }}>No call logs in this timeframe.</div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              {sdr.recentCalls.slice(0, 8).map((call, i) => {
                                let parsed = {};
                                try { parsed = JSON.parse(call.notes || '{}'); } catch (_) {}
                                const outcome = call.outcome || parsed.outcome || 'unknown';
                                const company = parsed.company || call.company || call.title || 'Unknown';
                                const outcomeMeta = {
                                  connected:  { color: '#16a34a', emoji: '✅' },
                                  voicemail:  { color: '#f59e0b', emoji: '📩' },
                                  no_answer:  { color: '#64748b', emoji: '📵' },
                                  busy:       { color: '#ef4444', emoji: '🔴' },
                                  callback:   { color: '#3b82f6', emoji: '🔄' },
                                  wrong_number:{ color: '#94a3b8', emoji: '❌' },
                                }[outcome] || { color: '#94a3b8', emoji: '❓' };

                                return (
                                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 10px', borderRadius: 8, background: 'var(--bg-elevated)', fontSize: 12 }}>
                                    <span style={{ fontSize: 14 }}>{outcomeMeta.emoji}</span>
                                    <span style={{ flex: 1, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{company}</span>
                                    <span style={{ color: outcomeMeta.color, fontWeight: 600, fontSize: 10, textTransform: 'uppercase' }}>{outcome.replace('_', ' ')}</span>
                                    {call.createdAt && (
                                      <span style={{ color: 'var(--text-tertiary)', fontSize: 10, flexShrink: 0 }}>
                                        {formatDistanceToNow(call.createdAt, { addSuffix: true })}
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                              {sdr.recentCalls.length > 8 && (
                                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', textAlign: 'center', paddingTop: 4 }}>+{sdr.recentCalls.length - 8} more calls</div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Recent Leads Added */}
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            👤 Recent Leads Added
                          </div>
                          {sdr.recentLeads.length === 0 ? (
                            <div style={{ fontSize: 12, color: 'var(--text-tertiary)', padding: '8px 0' }}>No leads added in this timeframe.</div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              {sdr.recentLeads.map((lead, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 10px', borderRadius: 8, background: 'var(--bg-elevated)', fontSize: 12 }}>
                                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#3b82f620', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 10, flexShrink: 0 }}>
                                    {(lead.company_name || '?').charAt(0).toUpperCase()}
                                  </div>
                                  <span style={{ flex: 1, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {lead.company_name || 'Unknown'}
                                  </span>
                                  <span className="badge badge-gray" style={{ fontSize: 9, padding: '2px 6px' }}>{lead.stage || 'New Lead'}</span>
                                  {lead.created_at && (
                                    <span style={{ color: 'var(--text-tertiary)', fontSize: 10, flexShrink: 0 }}>
                                      {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Leaderboard tab ── */}
        {activeTab === 'leaderboard' && (
          <div className="adm-table-card">
            <div className="adm-table-header">
              <span className="adm-table-title">👥 Team Performance — {TIMEFRAME_LABELS[timeframe]}</span>
              <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{activeTeam.length} members</span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="adm-user-table">
                <thead>
                  <tr>
                    <th>Sales Rep</th>
                    <th>Revenue Closed</th>
                    <th>Pipeline Generated</th>
                    <th>Deals Created</th>
                    <th title="Leads added in timeframe">Leads Added</th>
                    <th title="Completed cold call / calling_list_item tasks">Calls Dialed</th>
                    <th title="Demos scheduled in timeframe">Demos Set</th>
                    <th>Connect Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {sdrStats.length === 0 ? (
                    <tr><td colSpan="8" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-tertiary)' }}>No data found for this timeframe.</td></tr>
                  ) : (
                    sdrStats.map(u => (
                      <tr key={u.id}>
                        <td>
                          <div className="adm-user-cell">
                            <div className="adm-u-avatar">{getInitials(u.full_name || u.name || u.email)}</div>
                            <div>
                              <div className="adm-u-name">{u.full_name || u.name || 'Unknown'}</div>
                              <div className="adm-u-email">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="adm-num-cell" style={{ color: '#16a34a', fontWeight: 600 }}>{fmtINR(u.revenueClosed)}</td>
                        <td className="adm-num-cell" style={{ color: '#3b82f6', fontWeight: 600 }}>{fmtINR(u.pipelineGenerated)}</td>
                        <td className="adm-num-cell">{u.dealsCreated}</td>
                        <td className="adm-num-cell" style={{ color: '#3b82f6', fontWeight: 700 }}>{u.leadsAdded}</td>
                        <td className="adm-num-cell" style={{ color: '#ef4444', fontWeight: 700 }}>{u.totalCalls}</td>
                        <td className="adm-num-cell" style={{ color: '#8b5cf6', fontWeight: 700 }}>{u.demosScheduled}</td>
                        <td>
                          <div className="adm-conv-bar">
                            <div className="adm-conv-track">
                              <div className="adm-conv-fill" style={{ width: `${Math.min(u.connectRate, 100)}%` }} />
                            </div>
                            <span className="adm-conv-pct">{u.connectRate}%</span>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Field Ops tab ── */}
        {activeTab === 'field-ops' && (
          <div className="adm-table-card" style={{ padding: '24px' }}>
            <div className="adm-table-header" style={{ marginBottom: '24px' }}>
              <span className="adm-table-title">📍 Field Operations Tracking — {TIMEFRAME_LABELS[timeframe]}</span>
              <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{fieldVisits.length} visits logged</span>
            </div>

            {fieldVisits.length === 0 ? (
              <div style={{ padding: 60, textAlign: 'center', color: '#9ca3af', background: '#f9fafb', borderRadius: 20, border: '1px dashed #d1d5db' }}>
                <MapPin size={48} style={{ opacity: 0.5, margin: '0 auto 16px auto' }} />
                No field visits logged in this timeframe.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                {fieldVisits.map(visit => (
                  <div 
                    key={visit.id} 
                    style={{ background: '#fff', borderRadius: '16px', padding: '20px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', cursor: visit.leadId ? 'pointer' : 'default' }}
                    onClick={() => { if(visit.leadId) setSelectedLeadId(visit.leadId); }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#eff6ff', color: '#1b66f2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '16px' }}>
                          {visit.ownerName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: '600', color: '#111827', fontSize: '14px' }}>{visit.ownerName}</div>
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>
                            {visit.checkInTime ? new Date(visit.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Unknown time'}
                          </div>
                        </div>
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: '600', padding: '4px 8px', borderRadius: '12px', background: visit.status === 'in_progress' ? '#fef3c7' : '#d1fae5', color: visit.status === 'in_progress' ? '#d97706' : '#059669', textTransform: 'uppercase' }}>
                        {visit.status === 'in_progress' ? 'Active' : 'Completed'}
                      </span>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#4b5563', marginBottom: '16px', background: '#f9fafb', padding: '8px 12px', borderRadius: '8px' }}>
                      <Briefcase size={14} color="#6b7280" /> 
                      {visit.leadName}
                    </div>
                    
                    {visit.photo && (
                      <img src={visit.photo} alt="Verification" style={{ width: '100%', height: '160px', objectFit: 'cover', borderRadius: '8px', marginBottom: '16px' }} />
                    )}
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid #f3f4f6' }}>
                      {visit.lat && visit.lng ? (
                        <a href={`https://maps.google.com/?q=${visit.lat},${visit.lng}`} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#1b66f2', textDecoration: 'none', fontWeight: '500' }}>
                          <MapPin size={16} /> View on Map
                        </a>
                      ) : (
                        <span style={{ fontSize: '13px', color: '#9ca3af' }}>No GPS</span>
                      )}
                      
                      {visit.status === 'completed' && visit.checkOutTime && (
                        <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>
                          Out: {new Date(visit.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )}
                    </div>

                    {visit.notes && (
                      <div style={{ marginTop: '16px', padding: '12px', background: '#f9fafb', borderRadius: '8px', fontSize: '13px', color: '#4b5563', border: '1px solid #e5e7eb' }}>
                        {visit.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Founder Insights tab ── */}
        {activeTab === 'ai-insights' && (
          <div className="adm-chart-card" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 800, margin: '0 auto' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 48, height: 48, borderRadius: '50%', background: 'rgba(139,92,246,0.1)', color: '#8b5cf6', margin: '0 auto 16px auto' }}>
                <Sparkles size={24} />
              </div>
              <h2 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 8px 0', color: 'var(--text-primary)' }}>Generative AI Executive Summary</h2>
              <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: 14 }}>
                Get an instant, data-driven analysis of your team's pipeline health, win rates, and bottlenecks.
              </p>
            </div>

            <button 
              className="btn btn-primary" 
              style={{ alignSelf: 'center', minWidth: 200, padding: '12px 24px', fontSize: 14 }}
              onClick={handleGenerateAI}
              disabled={aiLoading}
            >
              {aiLoading ? 'Generating Insights...' : 'Generate Executive Summary'}
            </button>

            {aiSummary && (
              <div style={{ padding: 24, background: 'var(--bg-elevated)', borderRadius: 12, border: '1px solid var(--border-subtle)', lineHeight: 1.6, color: 'var(--text-primary)' }}>
                {aiSummary.split('\n').map((paragraph, i) => (
                  paragraph ? <p key={i} style={{ marginBottom: 12 }}>{paragraph}</p> : null
                ))}
              </div>
            )}
          </div>
        )}

      </main>
      
      {selectedLeadId && (
        <LeadDrawer
          leadId={selectedLeadId}
          onClose={() => setSelectedLeadId(null)}
        />
      )}
    </div>
  );
}
