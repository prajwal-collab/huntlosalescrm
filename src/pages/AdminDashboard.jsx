// ============================================
// HUNTLO SALES OS — ADMIN ANALYTICS DASHBOARD
// Full team-wide call analytics, activity, insights & SDR leaderboard
// ============================================
import { useMemo, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid
} from 'recharts';
import {
  Phone, TrendingUp, Users, Clock, Target, Zap,
  ArrowUpRight, Award, AlertTriangle, Activity, BarChart2
} from 'lucide-react';
import useDataStore from '../store/useDataStore';
import useAuthStore from '../store/useAuthStore';
import { format, isValid, subDays, startOfDay, startOfWeek, startOfMonth } from 'date-fns';
import './AdminDashboard.css';

const OUTCOME_CONFIG = {
  connected:    { label: 'Connected',          color: '#16a34a', emoji: '✅' },
  voicemail:    { label: 'Voicemail',           color: '#f59e0b', emoji: '📩' },
  no_answer:    { label: 'No Answer',           color: '#64748b', emoji: '📵' },
  busy:         { label: 'Busy',                color: '#ef4444', emoji: '🔴' },
  wrong_number: { label: 'Wrong Number',        color: '#94a3b8', emoji: '❌' },
  callback:     { label: 'Callback Requested',  color: '#3b82f6', emoji: '🔄' },
};

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

export default function AdminDashboard() {
  const { tasks, leads } = useDataStore();
  const { user, team } = useAuthStore();
  const [timeframe, setTimeframe] = useState('today');
  const [activeTab, setActiveTab] = useState('overview');

  // ── Role guard removed ───────────────────────────────────────────────────────────
  // Allow all team members to view workspace analytics as requested

  // ── Parse all call tasks ─────────────────────────────────────────────────
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
        const createdAt = safeDate(t.created_at || data.timestamp);
        return {
          id: t.id,
          owner_id: t.owner_id,
          createdAt,
          outcome: data.outcome || 'unknown',
          duration: parseFloat(data.duration) || 0,
          pushedToLead: data.pushedToLead || false,
          contactName: data.contactName || t.title || '',
          company: data.company || data.company_name || '',
        };
      });
  }, [tasks]);

  // ── Filter by timeframe ──────────────────────────────────────────────────
  const filteredCalls = useMemo(
    () => allCallTasks.filter(c => matchesTimeframe(c.createdAt, timeframe)),
    [allCallTasks, timeframe]
  );

  // ── Active team members (profiles only) ─────────────────────────────────
  const activeTeam = useMemo(
    () => (team || []).filter(m => m.type !== 'invite'),
    [team]
  );

  // ── Per-user stats ───────────────────────────────────────────────────────
  const userStats = useMemo(() => {
    return activeTeam.map(member => {
      const memberCalls = filteredCalls.filter(c => c.owner_id === member.id);
      const total        = memberCalls.length;
      const connected    = memberCalls.filter(c => c.outcome === 'connected').length;
      const voicemail    = memberCalls.filter(c => c.outcome === 'voicemail').length;
      const noAnswer     = memberCalls.filter(c => c.outcome === 'no_answer').length;
      const busy         = memberCalls.filter(c => c.outcome === 'busy').length;
      const talkTime     = memberCalls.reduce((s, c) => s + c.duration, 0);
      const pushed       = memberCalls.filter(c => c.pushedToLead).length;
      const convRate     = total > 0 ? Math.round((connected / total) * 100) : 0;

      // Today's activity flag
      const todayCalls   = memberCalls.filter(c => c.createdAt && c.createdAt >= startOfDay(new Date()));
      const activeToday  = todayCalls.length > 0;

      return {
        ...member,
        total, connected, voicemail, noAnswer, busy,
        talkTime: Math.round(talkTime),
        pushed, convRate, activeToday
      };
    }).sort((a, b) => b.total - a.total);
  }, [activeTeam, filteredCalls]);

  // ── Aggregate KPIs ───────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const total     = filteredCalls.length;
    const connected = filteredCalls.filter(c => c.outcome === 'connected').length;
    const talkTime  = Math.round(filteredCalls.reduce((s, c) => s + c.duration, 0));
    const pushed    = filteredCalls.filter(c => c.pushedToLead).length;
    const connRate  = total > 0 ? ((connected / total) * 100).toFixed(1) : '0';
    return { total, connected, talkTime, pushed, connRate };
  }, [filteredCalls]);

  // ── 7-day trend (always last 7 days regardless of timeframe filter) ──────
  const trendData = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = subDays(new Date(), 6 - i);
      const dayStart = startOfDay(d);
      const dayEnd   = startOfDay(subDays(d, -1));
      const dayCalls = allCallTasks.filter(c => c.createdAt && c.createdAt >= dayStart && c.createdAt < dayEnd);
      return {
        day: format(d, 'EEE'),
        calls: dayCalls.length,
        connected: dayCalls.filter(c => c.outcome === 'connected').length,
      };
    });
  }, [allCallTasks]);

  // ── Outcome distribution ─────────────────────────────────────────────────
  const outcomeData = useMemo(() => {
    const counts = {};
    filteredCalls.forEach(c => { counts[c.outcome] = (counts[c.outcome] || 0) + 1; });
    return Object.entries(counts)
      .map(([k, v]) => ({ outcome: k, count: v, config: OUTCOME_CONFIG[k] || { label: k, color: '#64748b', emoji: '📞' } }))
      .sort((a, b) => b.count - a.count);
  }, [filteredCalls]);

  // ── Calls per SDR (bar chart) ─────────────────────────────────────────────
  const sdrChartData = useMemo(() =>
    userStats.slice(0, 8).map(u => ({
      name: (u.full_name || u.name || u.email || 'Unknown').split(' ')[0],
      calls: u.total,
      connected: u.connected,
    })),
    [userStats]
  );

  // ── Strategy insights ─────────────────────────────────────────────────────
  const insights = useMemo(() => {
    const topPerformer = [...userStats].sort((a, b) => b.connected - a.connected)[0];
    const needsCoaching = [...userStats].filter(u => u.total > 0).sort((a, b) => a.convRate - b.convRate)[0];
    const totalLeadsToday = leads.filter(l => {
      const d = safeDate(l.created_at);
      return d && d >= startOfDay(new Date());
    }).length;

    // Best hour for connection (using connected calls from all time)
    const hourCounts = {};
    allCallTasks.filter(c => c.outcome === 'connected').forEach(c => {
      if (c.createdAt) {
        const h = c.createdAt.getHours();
        hourCounts[h] = (hourCounts[h] || 0) + 1;
      }
    });
    const bestHour = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0];
    const bestHourLabel = bestHour
      ? `${parseInt(bestHour[0]) % 12 || 12}${parseInt(bestHour[0]) >= 12 ? 'pm' : 'am'}`
      : 'N/A';

    return { topPerformer, needsCoaching, totalLeadsToday, bestHourLabel };
  }, [userStats, leads, allCallTasks]);

  // ── Recent activity feed ──────────────────────────────────────────────────
  const recentActivity = useMemo(() => {
    return allCallTasks
      .filter(c => c.createdAt)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 30)
      .map(c => {
        const owner = activeTeam.find(m => m.id === c.owner_id);
        const ownerName = owner?.full_name || owner?.name || owner?.email || 'Unknown';
        const oc = OUTCOME_CONFIG[c.outcome] || { label: c.outcome, color: '#64748b', emoji: '📞' };
        return { ...c, ownerName, oc };
      });
  }, [allCallTasks, activeTeam]);

  // ── Render ────────────────────────────────────────────────────────────────
  const rankClass = (i) => i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';
  const rateClass = (r) => r >= 30 ? 'high' : r >= 15 ? 'mid' : 'low';

  return (
    <div className="adm-container">
      {/* ── Header ── */}
      <header className="adm-header">
        <div className="adm-header-top">
          <div className="adm-title-section">
            <div className="adm-title-icon"><BarChart2 size={22} /></div>
            <div>
              <h1 className="adm-title">Admin Analytics</h1>
              <p className="adm-subtitle">Full team performance, activity &amp; strategy intelligence</p>
            </div>
          </div>
          <div className="adm-header-actions">
            <div className="adm-live-badge">
              <span className="adm-live-dot" />
              Live
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
            { id: 'leaderboard', label: '🏆 Leaderboard' },
            { id: 'activity',    label: '⚡ Activity Feed' },
            { id: 'insights',    label: '🧠 Insights' },
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
              <span className="adm-metric-label">Total Calls</span>
              <span className="adm-metric-icon"><Phone size={15} /></span>
            </div>
            <div className="adm-metric-value">{kpis.total}</div>
            <div className="adm-metric-sub">{TIMEFRAME_LABELS[timeframe]}</div>
          </div>

          <div className="adm-metric-card" style={{ '--card-accent': '#16a34a', '--icon-bg': 'rgba(22,163,74,0.12)' }}>
            <div className="adm-metric-top">
              <span className="adm-metric-label">Connect Rate</span>
              <span className="adm-metric-icon"><TrendingUp size={15} /></span>
            </div>
            <div className="adm-metric-value">{kpis.connRate}%</div>
            <div className="adm-metric-sub up"><ArrowUpRight size={12} />{kpis.connected} connected</div>
          </div>

          <div className="adm-metric-card" style={{ '--card-accent': '#8b5cf6', '--icon-bg': 'rgba(139,92,246,0.12)' }}>
            <div className="adm-metric-top">
              <span className="adm-metric-label">Talk Time</span>
              <span className="adm-metric-icon"><Clock size={15} /></span>
            </div>
            <div className="adm-metric-value">{kpis.talkTime}<small style={{ fontSize: 16 }}>m</small></div>
            <div className="adm-metric-sub">Total minutes</div>
          </div>

          <div className="adm-metric-card" style={{ '--card-accent': '#f59e0b', '--icon-bg': 'rgba(245,158,11,0.12)' }}>
            <div className="adm-metric-top">
              <span className="adm-metric-label">Leads Pushed</span>
              <span className="adm-metric-icon"><Target size={15} /></span>
            </div>
            <div className="adm-metric-value">{kpis.pushed}</div>
            <div className="adm-metric-sub">From dialer &amp; logs</div>
          </div>
        </div>

        {/* ── Overview tab ── */}
        {activeTab === 'overview' && (
          <>
            {/* Charts row */}
            <div className="adm-charts-row">
              {/* Bar: Calls per SDR */}
              <div className="adm-chart-card">
                <div className="adm-chart-title">📞 Calls Per SDR — {TIMEFRAME_LABELS[timeframe]}</div>
                {sdrChartData.length === 0 ? (
                  <div className="adm-empty">No call data for this timeframe.</div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={sdrChartData} barCategoryGap="30%">
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 8, fontSize: 12 }}
                        cursor={{ fill: 'rgba(59,130,246,0.05)' }}
                      />
                      <Bar dataKey="calls" name="Total" fill="#3b82f6" radius={[5,5,0,0]} />
                      <Bar dataKey="connected" name="Connected" fill="#16a34a" radius={[5,5,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Outcome distribution */}
              <div className="adm-chart-card">
                <div className="adm-chart-title">🎯 Outcome Breakdown</div>
                {outcomeData.length === 0 ? (
                  <div className="adm-empty">No data yet.</div>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={140}>
                      <PieChart>
                        <Pie
                          data={outcomeData}
                          dataKey="count"
                          innerRadius={38}
                          outerRadius={65}
                          paddingAngle={3}
                        >
                          {outcomeData.map((o, i) => (
                            <Cell key={i} fill={o.config.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 8, fontSize: 12 }}
                          formatter={(v, n, p) => [v, p.payload.config.label]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="adm-outcome-legend">
                      {outcomeData.map((o, i) => (
                        <div key={i} className="adm-outcome-row">
                          <span className="adm-outcome-dot" style={{ background: o.config.color }} />
                          <span className="adm-outcome-name">{o.config.emoji} {o.config.label}</span>
                          <span className="adm-outcome-count">{o.count}</span>
                          <span className="adm-outcome-pct">{filteredCalls.length > 0 ? ((o.count / filteredCalls.length) * 100).toFixed(0) : 0}%</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* 7-day trend line chart */}
            <div className="adm-chart-card">
              <div className="adm-chart-title">📈 7-Day Team Activity Trend</div>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 8, fontSize: 12 }}
                    cursor={{ stroke: 'rgba(59,130,246,0.2)', strokeWidth: 2 }}
                  />
                  <Line type="monotone" dataKey="calls" name="Total Calls" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4, fill: '#3b82f6' }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="connected" name="Connected" stroke="#16a34a" strokeWidth={2.5} dot={{ r: 4, fill: '#16a34a' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Per-user table */}
            <div className="adm-table-card">
              <div className="adm-table-header">
                <span className="adm-table-title">👥 SDR Performance — {TIMEFRAME_LABELS[timeframe]}</span>
                <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{activeTeam.length} team members</span>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table className="adm-user-table">
                  <thead>
                    <tr>
                      <th>SDR</th>
                      <th>Calls</th>
                      <th>✅ Connected</th>
                      <th>📩 Voicemail</th>
                      <th>📵 No Answer</th>
                      <th>🔴 Busy</th>
                      <th>Talk Time</th>
                      <th>Leads Pushed</th>
                      <th>Connect Rate</th>
                      <th>Today</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userStats.length === 0 ? (
                      <tr><td colSpan="10" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-tertiary)' }}>No data found for this timeframe.</td></tr>
                    ) : (
                      userStats.map(u => (
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
                          <td className="adm-num-cell">{u.total}</td>
                          <td className="adm-num-cell" style={{ color: '#16a34a' }}>{u.connected}</td>
                          <td className="adm-num-cell" style={{ color: '#f59e0b' }}>{u.voicemail}</td>
                          <td className="adm-num-cell" style={{ color: '#64748b' }}>{u.noAnswer}</td>
                          <td className="adm-num-cell" style={{ color: '#ef4444' }}>{u.busy}</td>
                          <td>{u.talkTime}m</td>
                          <td className="adm-num-cell">{u.pushed}</td>
                          <td>
                            <div className="adm-conv-bar">
                              <div className="adm-conv-track">
                                <div className="adm-conv-fill" style={{ width: `${Math.min(u.convRate, 100)}%` }} />
                              </div>
                              <span className="adm-conv-pct">{u.convRate}%</span>
                            </div>
                          </td>
                          <td>
                            <span className={`adm-active-dot ${u.activeToday ? 'online' : 'offline'}`} title={u.activeToday ? 'Active today' : 'No activity today'} />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ── Leaderboard tab ── */}
        {activeTab === 'leaderboard' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="adm-chart-card">
              <div className="adm-chart-title">🏆 Most Connected Calls</div>
              <div className="adm-leaderboard">
                {userStats.filter(u => u.total > 0).slice(0, 10).map((u, i) => (
                  <div key={u.id} className="adm-lb-row">
                    <span className={`adm-lb-rank ${rankClass(i)}`}>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}</span>
                    <div className="adm-lb-avatar">{getInitials(u.full_name || u.name || u.email)}</div>
                    <div className="adm-lb-info">
                      <div className="adm-lb-name">{u.full_name || u.name || 'Unknown'}</div>
                      <div className="adm-lb-detail">{u.connected} connected · {u.talkTime}m talk</div>
                    </div>
                    <div className="adm-lb-stats">
                      <span className="adm-lb-calls">{u.total}</span>
                      <span className={`adm-lb-rate ${rateClass(u.convRate)}`}>{u.convRate}%</span>
                    </div>
                  </div>
                ))}
                {userStats.filter(u => u.total > 0).length === 0 && (
                  <div className="adm-empty">No calls logged in this timeframe.</div>
                )}
              </div>
            </div>

            <div className="adm-chart-card">
              <div className="adm-chart-title">📈 Connect Rate Leaders</div>
              <div className="adm-leaderboard">
                {[...userStats].filter(u => u.total >= 5).sort((a, b) => b.convRate - a.convRate).slice(0, 10).map((u, i) => (
                  <div key={u.id} className="adm-lb-row">
                    <span className={`adm-lb-rank ${rankClass(i)}`}>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}</span>
                    <div className="adm-lb-avatar">{getInitials(u.full_name || u.name || u.email)}</div>
                    <div className="adm-lb-info">
                      <div className="adm-lb-name">{u.full_name || u.name || 'Unknown'}</div>
                      <div className="adm-lb-detail">{u.total} calls · {u.connected} connected</div>
                    </div>
                    <div className="adm-lb-stats">
                      <span className="adm-lb-calls">{u.convRate}%</span>
                      <span className={`adm-lb-rate ${rateClass(u.convRate)}`}>{u.connected} wins</span>
                    </div>
                  </div>
                ))}
                {userStats.filter(u => u.total >= 5).length === 0 && (
                  <div className="adm-empty">Need at least 5 calls per SDR to rank.</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Activity Feed tab ── */}
        {activeTab === 'activity' && (
          <div className="adm-chart-card" style={{ flex: 1 }}>
            <div className="adm-chart-title">⚡ Recent Team Activity (Last 30 Calls)</div>
            {recentActivity.length === 0 ? (
              <div className="adm-empty">No recent activity found.</div>
            ) : (
              <div className="adm-activity-feed">
                {recentActivity.map((c, i) => (
                  <div key={c.id || i} className="adm-activity-item">
                    <div className="adm-act-avatar">{getInitials(c.ownerName)}</div>
                    <div className="adm-act-body">
                      <div className="adm-act-main">
                        <strong>{c.ownerName}</strong> called <strong>{c.contactName || 'a contact'}</strong>
                        {c.company && <> at <strong>{c.company}</strong></>}
                      </div>
                      <div className="adm-act-time">
                        {c.createdAt ? format(c.createdAt, 'MMM d, h:mm a') : '—'}
                        {c.duration > 0 && ` · ${c.duration}min`}
                      </div>
                    </div>
                    <span
                      className="adm-act-outcome"
                      style={{
                        background: (OUTCOME_CONFIG[c.outcome]?.color || '#64748b') + '20',
                        color: OUTCOME_CONFIG[c.outcome]?.color || '#64748b',
                      }}
                    >
                      {c.oc.emoji} {c.oc.label}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Insights tab ── */}
        {activeTab === 'insights' && (
          <>
            <div className="adm-insights-row">
              <div className="adm-insight-card">
                <div className="adm-insight-header">
                  <span className="adm-insight-emoji">🏆</span>
                  <span className="adm-insight-label">Top Performer</span>
                </div>
                <div className="adm-insight-value">
                  {insights.topPerformer ? (insights.topPerformer.full_name || insights.topPerformer.name || 'Unknown') : 'N/A'}
                </div>
                <div className="adm-insight-desc">
                  {insights.topPerformer
                    ? `${insights.topPerformer.connected} connections from ${insights.topPerformer.total} calls (${insights.topPerformer.convRate}% rate)`
                    : 'No call data yet for this period.'}
                </div>
              </div>

              <div className="adm-insight-card">
                <div className="adm-insight-header">
                  <span className="adm-insight-emoji">⏰</span>
                  <span className="adm-insight-label">Best Calling Hour</span>
                </div>
                <div className="adm-insight-value">{insights.bestHourLabel}</div>
                <div className="adm-insight-desc">
                  Based on when connected calls are most frequently logged across the team. Schedule campaigns around this window.
                </div>
              </div>

              <div className="adm-insight-card">
                <div className="adm-insight-header">
                  <span className="adm-insight-emoji">🎯</span>
                  <span className="adm-insight-label">Leads Today</span>
                </div>
                <div className="adm-insight-value">{insights.totalLeadsToday}</div>
                <div className="adm-insight-desc">
                  New leads created today across all sources (Power Dialer, manual, import, webhook).
                </div>
              </div>

              <div className="adm-insight-card">
                <div className="adm-insight-header">
                  <span className="adm-insight-emoji">📊</span>
                  <span className="adm-insight-label">Team Connect Rate</span>
                </div>
                <div className="adm-insight-value">{kpis.connRate}%</div>
                <div className="adm-insight-desc">
                  Industry benchmark is 6–10%. Above 20% is excellent. Push your team to improve talk time and messaging.
                </div>
              </div>

              <div className="adm-insight-card">
                <div className="adm-insight-header">
                  <span className="adm-insight-emoji">🔔</span>
                  <span className="adm-insight-label">Needs Coaching</span>
                </div>
                <div className="adm-insight-value">
                  {insights.needsCoaching ? (insights.needsCoaching.full_name || insights.needsCoaching.name || 'N/A') : 'All great!'}
                </div>
                <div className="adm-insight-desc">
                  {insights.needsCoaching && insights.needsCoaching.total > 0
                    ? `${insights.needsCoaching.convRate}% connect rate from ${insights.needsCoaching.total} calls. Consider a 1:1 call review session.`
                    : 'All SDRs are performing at or above expectations this period.'}
                </div>
              </div>

              <div className="adm-insight-card">
                <div className="adm-insight-header">
                  <span className="adm-insight-emoji">📞</span>
                  <span className="adm-insight-label">Talk Time Avg</span>
                </div>
                <div className="adm-insight-value">
                  {kpis.total > 0 ? (kpis.talkTime / kpis.total).toFixed(1) : 0}m
                </div>
                <div className="adm-insight-desc">
                  Average call duration per dialed contact. Higher averages indicate better conversations and qualification.
                </div>
              </div>
            </div>

            {/* Conversion funnel */}
            <div className="adm-chart-card">
              <div className="adm-chart-title">🔄 Dialing Conversion Funnel — {TIMEFRAME_LABELS[timeframe]}</div>
              <div style={{ display: 'flex', gap: 0, alignItems: 'stretch', marginTop: 8 }}>
                {[
                  { label: 'Calls Dialed',  value: kpis.total,     color: '#3b82f6', pct: 100 },
                  { label: 'Connected',     value: kpis.connected,  color: '#8b5cf6', pct: kpis.total > 0 ? ((kpis.connected / kpis.total) * 100).toFixed(0) : 0 },
                  { label: 'Leads Pushed',  value: kpis.pushed,     color: '#16a34a', pct: kpis.total > 0 ? ((kpis.pushed / kpis.total) * 100).toFixed(0) : 0 },
                ].map((step, i) => (
                  <div key={i} style={{ flex: 1, padding: '20px 24px', borderRight: i < 2 ? '1px solid var(--border-subtle)' : 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{step.label}</div>
                    <div style={{ fontSize: 32, fontWeight: 900, color: step.color }}>{step.value}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'var(--bg-base)', overflow: 'hidden' }}>
                        <div style={{ width: `${step.pct}%`, height: '100%', background: step.color, borderRadius: 3, transition: 'width 0.7s ease' }} />
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{step.pct}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

      </main>
    </div>
  );
}
