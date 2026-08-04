// ============================================
// HUNTLO SALES OS — FOUNDER / SALES LEADER DASHBOARD
// Executive-level revenue analytics, pipeline health & AI insights
// ============================================
import { useMemo, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid
} from 'recharts';
import {
  TrendingUp, Clock, Target, ArrowUpRight, BarChart2,
  DollarSign, Briefcase, Star, Sparkles
} from 'lucide-react';
import useDataStore from '../store/useDataStore';
import useAuthStore from '../store/useAuthStore';
import { format, isValid, subDays, startOfDay, startOfWeek, startOfMonth } from 'date-fns';
import { generateExecutiveSummary } from '../lib/gemini';
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
  const { deals, tasks, leads } = useDataStore();
  const { user, team } = useAuthStore();
  const [timeframe, setTimeframe] = useState('month');
  const [activeTab, setActiveTab] = useState('overview');

  const [aiSummary, setAiSummary] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // ── Role guard ───────────────────────────────────────────────────────────
  const userProfile = team?.find(m => m.id === user?.id);
  const isAdmin = user?.email === 'prajwal@earlyjobs.in' || userProfile?.role === 'Admin';

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

  // ── SDR Performance (Revenue & Pipeline focus) ─────────────────────────
  const sdrStats = useMemo(() => {
    return activeTeam.map(member => {
      const memberDeals = filteredDeals.filter(d => d.owner_id === member.id);
      const memberCalls = filteredCalls.filter(c => c.owner_id === member.id);
      
      const dealsCreated = memberDeals.length;
      const pipelineGenerated = memberDeals.reduce((sum, d) => sum + d.amount, 0);
      
      const memberWonDeals = allDeals.filter(d => d.owner_id === member.id && d.stage === 'Closed Won' && matchesTimeframe(d.lastActivity || d.createdAt, timeframe));
      const revenueClosed = memberWonDeals.reduce((sum, d) => sum + d.amount, 0);
      
      const totalCalls = memberCalls.length;
      const connectedCalls = memberCalls.filter(c => c.outcome === 'connected').length;
      const connectRate = totalCalls > 0 ? Math.round((connectedCalls / totalCalls) * 100) : 0;

      return {
        ...member,
        dealsCreated,
        pipelineGenerated,
        revenueClosed,
        totalCalls,
        connectRate
      };
    }).sort((a, b) => b.revenueClosed - a.revenueClosed || b.pipelineGenerated - a.pipelineGenerated);
  }, [activeTeam, filteredDeals, filteredCalls, allDeals, timeframe]);

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
            { id: 'overview',    label: '📊 Overview' },
            { id: 'leaderboard', label: '🏆 Team Performance' },
            { id: 'ai-insights', label: '🧠 Founder Insights' },
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
                    <th>Calls Dialed</th>
                    <th>Call Connect Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {sdrStats.length === 0 ? (
                    <tr><td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-tertiary)' }}>No data found for this timeframe.</td></tr>
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
                        <td className="adm-num-cell">{u.totalCalls}</td>
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
    </div>
  );
}
