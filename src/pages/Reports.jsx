import { useState, useMemo, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { ArrowUpRight, ArrowDownRight, Settings, X, Activity } from 'lucide-react';
import useDataStore from '../store/useDataStore';
import useAuthStore from '../store/useAuthStore';
import { format, subMonths, isSameMonth, subWeeks, isSameWeek } from 'date-fns';
import './Reports.css';

const PIE_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#64748b'];

function StatCard({ label, value, trend, isPositive }) {
  return (
    <div className="rep-stat-card">
      <div className="rep-stat-label">{label}</div>
      <div className="rep-stat-val">{value}</div>
      <div className={`rep-stat-trend ${isPositive ? 'positive' : 'negative'}`}>
        {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
        {trend}
      </div>
    </div>
  );
}

export default function Reports() {
  const [timeframe, setTimeframe] = useState('YTD');
  const [activeTab, setActiveTab] = useState('overview');
  const [showCustomizer, setShowCustomizer] = useState(false);
  const { deals, meetings, tasks, companies, contacts, leads } = useDataStore();
  const { team, fetchTeam } = useAuthStore();

  const [widgets, setWidgets] = useState(() => {
    const saved = localStorage.getItem('huntlo_reports_config');
    return saved ? JSON.parse(saved) : { stats: true, revenue: true, activity: true, funnel: true, sources: true, tasks: true };
  });

  const toggleWidget = (key) => {
    const next = { ...widgets, [key]: !widgets[key] };
    setWidgets(next);
    localStorage.setItem('huntlo_reports_config', JSON.stringify(next));
  };

  useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  // Derived Data
  const leaderboard = useMemo(() => {
    return team.map(member => {
      const addedAccounts = companies.filter(c => c.owner_id === member.id).length;
      const addedContacts = contacts.filter(c => c.owner_id === member.id).length;
      const setMeetings = meetings.filter(m => m.owner_id === member.id).length;
      
      let wonRevenue = 0;
      deals.forEach(d => {
        if (d.owner_id === member.id && d.stage === 'Closed Won') {
          wonRevenue += Number(d.arr) || 0;
        }
      });
      return { ...member, addedAccounts, addedContacts, setMeetings, wonRevenue };
    }).sort((a, b) => b.wonRevenue - a.wonRevenue);
  }, [team, companies, contacts, meetings, deals]);

  const metrics = useMemo(() => {
    let totalRevenue = 0;
    let pipelineValue = 0;
    deals.forEach(d => {
      const val = Number(d.arr) || 0;
      if (d.stage === 'Closed Won') totalRevenue += val;
      else if (d.stage !== 'Closed Lost') pipelineValue += val;
    });
    const lostDeals = deals.filter(d => d.stage === 'Closed Lost').length;
    const wonDeals = deals.filter(d => d.stage === 'Closed Won').length;
    const totalClosed = wonDeals + lostDeals;
    const winRate = totalClosed > 0 ? Math.round((wonDeals / totalClosed) * 100) : 0;
    const tasksCompleted30d = tasks.filter(t => {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 30);
      return t.status === 'completed' && new Date(t.due || t.created_at) >= cutoff;
    }).length;
    return {
      revenue: `$${(totalRevenue / 1000).toFixed(1)}k`,
      pipeline: `$${(pipelineValue / 1000).toFixed(1)}k`,
      winRate: `${winRate}%`,
      tasksCompleted30d
    };
  }, [deals, meetings, tasks]);

  const revenueData = useMemo(() => {
    const data = [];
    for (let i = 4; i >= 0; i--) {
      const d = subMonths(new Date(), i);
      let won = 0; let pipeline = 0;
      deals.forEach(deal => {
        const dealDate = new Date(deal.created_at || new Date());
        if (isSameMonth(dealDate, d)) {
          const val = (Number(deal.arr) || 0) / 1000;
          if (deal.stage === 'Closed Won') won += val;
          else if (deal.stage !== 'Closed Lost') pipeline += val;
        }
      });
      data.push({ month: format(d, 'MMM'), won: Math.round(won), pipeline: Math.round(pipeline) });
    }
    return data;
  }, [deals]);

  const activityData = useMemo(() => {
    const data = [];
    for (let i = 3; i >= 0; i--) {
      const d = subWeeks(new Date(), i);
      let demos = 0; let emails = 0;
      meetings.forEach(m => { if (isSameWeek(new Date(m.date), d) && m.type === 'Demo') demos++; });
      tasks.forEach(t => { if (isSameWeek(new Date(t.due || t.created_at), d) && t.type === 'email') emails++; });
      data.push({ week: `W${4 - i}`, demos, emails });
    }
    return data;
  }, [meetings, tasks]);

  const funnelData = useMemo(() => {
    const stages = { 'Lead': 0, 'Demo': 0, 'Proposal': 0, 'Negotiation': 0, 'Closed Won': 0 };
    deals.forEach(d => { if (stages[d.stage] !== undefined) stages[d.stage]++; });
    return Object.keys(stages).map(k => ({ name: k, value: stages[k] })).filter(s => s.value > 0);
  }, [deals]);

  const sourceData = useMemo(() => {
    const sources = { 'Outbound': 0, 'Inbound': 0, 'Referral': 0, 'Partner': 0 };
    leads.forEach(l => {
      const source = l.campaign_type || l.outreach_channel || 'Outbound';
      if (sources[source] !== undefined) {
        sources[source]++;
      } else {
        sources[source] = 1;
      }
    });
    return Object.keys(sources).map(k => ({ name: k, value: sources[k] })).filter(s => s.value > 0);
  }, [leads]);

  const taskCompletion = useMemo(() => {
    const data = [];
    for (let i = 4; i >= 0; i--) {
      const d = subWeeks(new Date(), i);
      let completed = 0; let total = 0;
      tasks.forEach(t => { 
        if (isSameWeek(new Date(t.due || t.created_at), d)) {
          total++;
          if (t.status === 'completed') completed++;
        }
      });
      data.push({ week: `W${5 - i}`, completed, missed: total - completed });
    }
    return data;
  }, [tasks]);

  return (
    <div className="reports-page">
      <div className="page-header-row">
        <div>
          <h1 className="page-big-title">Reports</h1>
          <p className="page-big-sub">Operational analytics and team performance</p>
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          <div className="filter-chips">
            {['Overview', 'Team Activity'].map(tab => (
              <button 
                key={tab} 
                className={`filter-chip ${activeTab === tab.toLowerCase().replace(' ', '-') ? 'active' : ''}`} 
                onClick={() => setActiveTab(tab.toLowerCase().replace(' ', '-'))}
              >
                {tab}
              </button>
            ))}
          </div>
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', gap: 12 }}>
              <div className="filter-chips">
                {['Q1', 'Q2', 'YTD', 'All Time'].map(f => (
                  <button key={f} className={`filter-chip ${timeframe === f ? 'active' : ''}`} onClick={() => setTimeframe(f)}>
                    {f}
                  </button>
                ))}
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowCustomizer(true)}>
                <Settings size={14} /> Customize
              </button>
            </div>
          )}
        </div>
      </div>

      {activeTab === 'overview' ? (
        <>
          {widgets.stats && (
            <div className="rep-stats-grid">
              <StatCard label="Total Pipeline Value" value={metrics.pipeline} trend="All Active Deals" isPositive={true} />
              <StatCard label="Total Revenue Won" value={metrics.revenue} trend="Closed Won ARR" isPositive={true} />
              <StatCard label="Win / Loss Ratio" value={metrics.winRate} trend="Won vs. Total Closed" isPositive={parseInt(metrics.winRate) >= 50} />
              <StatCard label="Tasks Done (30d)" value={metrics.tasksCompleted30d} trend="Last 30 days" isPositive={true} />
            </div>
          )}

          <div className="rep-charts-grid">
            {widgets.revenue && (
              <div className="rep-chart-card" style={{ gridColumn: 'span 2' }}>
                <div className="rep-chart-header">
                  <h3>Revenue Growth</h3>
                  <span className="badge badge-blue">Won vs Pipeline (k)</span>
                </div>
                <div className="rep-chart-area">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--bg-border)" vertical={false} />
                      <XAxis dataKey="month" stroke="var(--text-tertiary)" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="var(--text-tertiary)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} />
                      <Tooltip cursor={{ fill: 'var(--bg-elevated)' }} contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-border)', borderRadius: '8px' }} />
                      <Bar dataKey="won" name="Closed Won" fill="var(--success)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="pipeline" name="Pipeline" fill="var(--accent-blue-muted)" stroke="var(--accent-blue)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {widgets.activity && (
              <div className="rep-chart-card">
                <div className="rep-chart-header">
                  <h3>Sales Activity</h3>
                  <span className="badge badge-gray">Demos & Emails</span>
                </div>
                <div className="rep-chart-area">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--bg-border)" vertical={false} />
                      <XAxis dataKey="week" stroke="var(--text-tertiary)" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="var(--text-tertiary)" fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-border)', borderRadius: '8px' }} />
                      <Line type="monotone" dataKey="demos" name="Demos" stroke="var(--accent-purple)" strokeWidth={2} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="emails" name="Emails" stroke="var(--text-secondary)" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {widgets.funnel && (
              <div className="rep-chart-card">
                <div className="rep-chart-header">
                  <h3>Pipeline Funnel</h3>
                  <span className="badge badge-gray">Active Deals</span>
                </div>
                <div className="rep-chart-area">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={funnelData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                        {funnelData.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-border)', borderRadius: '8px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {widgets.sources && (
              <div className="rep-chart-card">
                <div className="rep-chart-header">
                  <h3>Lead Sources</h3>
                  <span className="badge badge-gray">Distribution</span>
                </div>
                <div className="rep-chart-area">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sourceData} layout="vertical" margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--bg-border)" horizontal={false} />
                      <XAxis type="number" stroke="var(--text-tertiary)" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis dataKey="name" type="category" stroke="var(--text-tertiary)" fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip cursor={{ fill: 'var(--bg-elevated)' }} contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-border)', borderRadius: '8px' }} />
                      <Bar dataKey="value" name="Leads" fill="var(--accent-purple)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {widgets.tasks && (
              <div className="rep-chart-card">
                <div className="rep-chart-header">
                  <h3>Task Completion</h3>
                  <span className="badge badge-gray">Completed vs Missed</span>
                </div>
                <div className="rep-chart-area">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={taskCompletion} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} stackOffset="sign">
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--bg-border)" vertical={false} />
                      <XAxis dataKey="week" stroke="var(--text-tertiary)" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="var(--text-tertiary)" fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip cursor={{ fill: 'var(--bg-elevated)' }} contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-border)', borderRadius: '8px' }} />
                      <Bar dataKey="completed" name="Completed" stackId="a" fill="var(--success)" radius={[0, 0, 4, 4]} />
                      <Bar dataKey="missed" name="Missed" stackId="a" fill="var(--danger)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="rep-chart-card" style={{ marginTop: 24, padding: 0 }}>
          <div className="rep-chart-header" style={{ padding: '24px 24px 0 24px' }}>
            <h3>SDR Performance Leaderboard</h3>
            <span className="badge badge-blue">Sorted by Won Revenue</span>
          </div>
          <div style={{ padding: '24px' }}>
            <table className="huntlo-table">
              <thead>
                <tr>
                  <th>SDR Name</th>
                  <th>Accounts Added</th>
                  <th>Contacts Added</th>
                  <th>Meetings Set</th>
                  <th>Won Revenue</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.length > 0 ? leaderboard.map(member => (
                  <tr key={member.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="avatar avatar-sm" style={{ backgroundColor: member.color || '#3b82f6' }}>
                          {member.initials || member.name?.slice(0,2).toUpperCase() || 'SR'}
                        </div>
                        <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{member.name || member.email}</span>
                      </div>
                    </td>
                    <td>{member.addedAccounts}</td>
                    <td>{member.addedContacts}</td>
                    <td>{member.setMeetings}</td>
                    <td style={{ color: 'var(--success)', fontWeight: 600 }}>
                      ${(member.wonRevenue / 1000).toFixed(1)}k
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-tertiary)' }}>
                      No team members found. Invite users in Settings to see their activity.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showCustomizer && (
        <div className="company-panel animate-slide-right">
          <div className="panel-header" style={{ marginBottom: 24 }}>
            <h2 className="panel-title">Customize Dashboard</h2>
            <button className="drawer-close" onClick={() => setShowCustomizer(false)}><X size={16}/></button>
          </div>
          <div style={{ padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Toggle the widgets you want to see on your overview dashboard.</p>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'var(--bg-elevated)', borderRadius: 8 }}>
              <span style={{ fontWeight: 500 }}>KPI Stat Cards</span>
              <input type="checkbox" checked={widgets.stats} onChange={() => toggleWidget('stats')} />
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'var(--bg-elevated)', borderRadius: 8 }}>
              <span style={{ fontWeight: 500 }}>Revenue Growth Chart</span>
              <input type="checkbox" checked={widgets.revenue} onChange={() => toggleWidget('revenue')} />
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'var(--bg-elevated)', borderRadius: 8 }}>
              <span style={{ fontWeight: 500 }}>Sales Activity Chart</span>
              <input type="checkbox" checked={widgets.activity} onChange={() => toggleWidget('activity')} />
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'var(--bg-elevated)', borderRadius: 8 }}>
              <span style={{ fontWeight: 500 }}>Pipeline Funnel</span>
              <input type="checkbox" checked={widgets.funnel} onChange={() => toggleWidget('funnel')} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'var(--bg-elevated)', borderRadius: 8 }}>
              <span style={{ fontWeight: 500 }}>Lead Sources</span>
              <input type="checkbox" checked={widgets.sources} onChange={() => toggleWidget('sources')} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'var(--bg-elevated)', borderRadius: 8 }}>
              <span style={{ fontWeight: 500 }}>Task Completion</span>
              <input type="checkbox" checked={widgets.tasks} onChange={() => toggleWidget('tasks')} />
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
