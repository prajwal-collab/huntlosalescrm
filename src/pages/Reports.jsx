import { useState, useMemo, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { ArrowUpRight, ArrowDownRight, Settings, X, Activity, Download, BookOpen, Save } from 'lucide-react';
import useDataStore from '../store/useDataStore';
import useAuthStore from '../store/useAuthStore';
import { format, subMonths, isSameMonth, subWeeks, isSameWeek } from 'date-fns';
import './Reports.css';

const PIE_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#64748b'];

// ── INR formatter ─────────────────────────────────────────
function fmtINR(val) {
  const n = Number(val) || 0;
  if (n >= 10000000) return `₹${(n/10000000).toFixed(2)}Cr`;
  if (n >= 100000)   return `₹${(n/100000).toFixed(1)}L`;
  if (n >= 1000)     return `₹${(n/1000).toFixed(1)}k`;
  return `₹${n.toLocaleString('en-IN')}`;
}

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
  const [exportingType, setExportingType] = useState(null);

  const [widgets, setWidgets] = useState(() => {
    const saved = localStorage.getItem('huntlo_reports_config');
    return saved ? JSON.parse(saved) : { stats: true, revenue: true, activity: true, funnel: true, sources: true, tasks: true, pipelineNotes: true };
  });

  // Pipeline Notes state (persistent)
  const [pipelineNotes, setPipelineNotes] = useState(() => localStorage.getItem('huntlo_pipeline_notes') || '');
  const [notesSaved, setNotesSaved] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem('huntlo_pipeline_notes', pipelineNotes);
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 1500);
    }, 500);
    return () => clearTimeout(timer);
  }, [pipelineNotes]);

  // ── Export Functions ─────────────────────────────────────────
  const exportPipelineCSV = () => {
    const PIPELINE_STAGES = ['Discovery', 'Qualification', 'Trial', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'];
    const stageCounts = {};
    const stageMRR = {};
    PIPELINE_STAGES.forEach(s => { stageCounts[s] = 0; stageMRR[s] = 0; });
    deals.forEach(d => {
      if (stageCounts[d.stage] !== undefined) {
        stageCounts[d.stage]++;
        stageMRR[d.stage] += Number(d.arr) || 0;
      }
    });

    let csv = 'HUNTLO PIPELINE REPORT\n';
    csv += `Generated,${format(new Date(), 'dd MMM yyyy HH:mm')}\n\n`;
    csv += `Total Pipeline Value,${metrics.pipeline}\n`;
    csv += `Total Revenue Won,${metrics.revenue}\n`;
    csv += `Win Rate,${metrics.winRate}\n`;
    csv += `Tasks Done (30d),${metrics.tasksCompleted30d}\n\n`;

    csv += 'STAGE SUMMARY\n';
    csv += 'Stage,Deal Count,Total MRR\n';
    PIPELINE_STAGES.forEach(s => {
      csv += `${s},${stageCounts[s]},${stageMRR[s]}\n`;
    });

    csv += '\nDEAL DETAILS\n';
    csv += 'Deal Title,Company,Stage,MRR,Urgency,Engagement Score,Owner,Last Activity,Created At\n';
    deals.forEach(d => {
      const company = companies.find(c => c.id === d.company_id);
      const owner = team.find(t => t.id === d.owner_id);
      csv += `"${d.title || ''}","${company?.name || ''}","${d.stage || ''}",${d.arr || 0},"${d.urgency || 'medium'}",${d.engagement_score || 0},"${owner?.name || owner?.email || ''}","${d.last_activity || ''}","${d.created_at || ''}"\n`;
    });

    if (pipelineNotes.trim()) {
      csv += '\nPIPELINE NOTES\n';
      csv += `"${pipelineNotes.replace(/"/g, '""')}"\n`;
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `huntlo_pipeline_report_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportTeamActivityCSV = () => {
    let csv = 'HUNTLO TEAM ACTIVITY REPORT\n';
    csv += `Generated,${format(new Date(), 'dd MMM yyyy HH:mm')}\n\n`;
    csv += 'SDR Name,Role,Team,Trial Signups,Enrichments Done,Outreach Sent,Demos Scheduled,Demos Showed Up,Show Rate %,Cold Calls Made,Won Revenue\n';
    leaderboard.forEach(m => {
      const showRate = m.demosScheduled > 0 ? Math.round((m.demosAttended / m.demosScheduled) * 100) : 0;
      csv += `"${m.name || m.email}","${m.role || ''}","${m.team || ''}",${m.trialSignups},${m.enrichmentDone},${m.outreachSent},${m.demosScheduled},${m.demosAttended},${showRate}%,${m.coldCallsMade},${m.wonRevenue}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `huntlo_team_activity_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

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

      // 6 SDR Activity Metrics
      const memberLeads = leads.filter(l => l.owner_id === member.id);
      const memberTasks = tasks.filter(t => t.owner_id === member.id || t.assigned_to === member.id);
      const memberMeetings = meetings.filter(m => m.owner_id === member.id);

      const trialSignups = memberLeads.filter(l => l.trial_confirmed || l.stage === 'Trial Started').length;
      const enrichmentDone = memberLeads.filter(l => l.enrichment_done).length;
      const outreachSent = memberLeads.filter(l => l.outreach_sent || (l.email_status && l.email_status !== 'Not Sent') || l.stage === 'Outreach Started').length;
      const demosScheduled = memberMeetings.filter(m => m.type === 'Demo' || m.type === 'demo').length;
      const demosAttended = memberMeetings.filter(m => (m.type === 'Demo' || m.type === 'demo') && (m.attended || m.status === 'completed')).length;
      const coldCallsMade = memberTasks.filter(t => (t.type === 'call' || t.type === 'cold_call') && t.status === 'completed').length;

      let wonRevenue = 0;
      deals.forEach(d => {
        if (d.owner_id === member.id && d.stage === 'Closed Won') {
          wonRevenue += Number(d.arr) || 0;
        }
      });
      return { ...member, addedAccounts, addedContacts, setMeetings, wonRevenue,
        trialSignups, enrichmentDone, outreachSent, demosScheduled, demosAttended, coldCallsMade };
    }).sort((a, b) => b.wonRevenue - a.wonRevenue);
  }, [team, companies, contacts, meetings, deals, leads, tasks]);

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
      revenue: fmtINR(totalRevenue),
      pipeline: fmtINR(pipelineValue),
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
    const stages = { 'Discovery': 0, 'Qualification': 0, 'Trial': 0, 'Proposal': 0, 'Negotiation': 0, 'Closed Won': 0 };
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
              <button className="btn btn-ghost btn-sm" onClick={() => { setExportingType('pipeline'); exportPipelineCSV(); setTimeout(() => setExportingType(null), 1200); }}>
                <Download size={13} /> {exportingType === 'pipeline' ? '✓ Exported' : 'Export Pipeline'}
              </button>
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
              <StatCard label="Total Revenue Won" value={metrics.revenue} trend="Closed Won MRR" isPositive={true} />
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
                <div className="rep-chart-body" style={{ height: 250, width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--bg-border)" />
                      <XAxis dataKey="month" stroke="var(--text-tertiary)" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="var(--text-tertiary)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `₹${v}k`} />
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
                <div className="rep-chart-body" style={{ height: 250, width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--bg-border)" />
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
                <div className="rep-chart-body" style={{ height: 250, width: '100%' }}>
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
                <div className="rep-chart-body" style={{ height: 250, width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sourceData} layout="vertical" margin={{ top: 10, right: 30, left: 30, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--bg-border)" />
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
                <div className="rep-chart-area" style={{ height: 250, width: '100%' }}>
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

          {/* Pipeline Notes Widget */}
          {widgets.pipelineNotes && (
            <div className="rep-chart-card pipeline-notes-card">
              <div className="rep-chart-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <BookOpen size={16} color="var(--accent-blue)" />
                  <h3>Pipeline Notes</h3>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {notesSaved && <span style={{ fontSize: 11, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 4 }}><Save size={11} /> Saved</span>}
                  <span className="badge badge-gray">Manager Notes</span>
                </div>
              </div>
              <div style={{ padding: '16px 20px' }}>
                <textarea
                  className="pipeline-notes-textarea"
                  value={pipelineNotes}
                  onChange={(e) => setPipelineNotes(e.target.value)}
                  placeholder="Write pipeline observations, weekly summaries, strategy notes, blockers...\n\nThese notes are auto-saved locally and included in pipeline exports."
                  rows={5}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{pipelineNotes.length} characters · Auto-saved to browser</span>
                  {pipelineNotes.trim() && <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Included in CSV exports</span>}
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Export Team Activity Button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => { setExportingType('team'); exportTeamActivityCSV(); setTimeout(() => setExportingType(null), 1200); }}>
              <Download size={13} /> {exportingType === 'team' ? '✓ Exported' : 'Export Team Activity'}
            </button>
          </div>

          {/* ─ Team-wide 6 Metrics Summary ───────── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12 }}>
            {[
              { label: 'Trial Signups', icon: '🧪', value: leaderboard.reduce((s,m)=>s+m.trialSignups,0), color: '#16a34a' },
              { label: 'Enrichments Done', icon: '🔍', value: leaderboard.reduce((s,m)=>s+m.enrichmentDone,0), color: '#3b82f6' },
              { label: 'Outreach Sent', icon: '📨', value: leaderboard.reduce((s,m)=>s+m.outreachSent,0), color: '#8b5cf6' },
              { label: 'Demos Scheduled', icon: '📅', value: leaderboard.reduce((s,m)=>s+m.demosScheduled,0), color: '#f59e0b' },
              { label: 'Demos Showed Up', icon: '✅', value: leaderboard.reduce((s,m)=>s+m.demosAttended,0), color: '#10b981' },
              { label: 'Cold Calls Made', icon: '📞', value: leaderboard.reduce((s,m)=>s+m.coldCallsMade,0), color: '#ef4444' },
            ].map(metric => (
              <div key={metric.label} className="rep-stat-card" style={{ textAlign: 'center', padding: '16px 12px' }}>
                <div style={{ fontSize: 24, marginBottom: 4 }}>{metric.icon}</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: metric.color, lineHeight: 1 }}>{metric.value}</div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4, fontWeight: 500 }}>{metric.label}</div>
              </div>
            ))}
          </div>

          {/* ─ Per-SDR Activity Table ─────────── */}
          <div className="rep-chart-card" style={{ padding: 0 }}>
            <div className="rep-chart-header" style={{ padding: '20px 24px 0 24px' }}>
              <h3>SDR Activity Breakdown</h3>
              <span className="badge badge-blue">6 Key Metrics per Rep</span>
            </div>
            <div style={{ padding: '16px 24px 24px', overflowX: 'auto' }}>
              <table className="huntlo-table">
                <thead>
                  <tr>
                    <th style={{ minWidth: 160 }}>SDR Name</th>
                    <th title="Confirmed trial signups">🧪 Trials</th>
                    <th title="Leads with enrichment completed">🔍 Enriched</th>
                    <th title="Leads where outreach has been sent">📨 Outreach</th>
                    <th title="Demo meetings scheduled">📅 Demos Sched.</th>
                    <th title="Demos where prospect attended">✅ Showed Up</th>
                    <th title="Completed call/cold_call tasks">📞 Cold Calls</th>
                    <th title="Won revenue">Won Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.length > 0 ? leaderboard.map(member => (
                    <tr key={member.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div className="avatar avatar-sm" style={{ backgroundColor: member.color || '#3b82f6', flexShrink: 0 }}>
                            {member.initials || member.name?.slice(0,2).toUpperCase() || 'SR'}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            <span style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: 13 }}>{member.name || member.email}</span>
                            <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
                              {member.role && <span className="badge badge-gray" style={{ fontSize: '9px', padding: '2px 4px' }}>{member.role}</span>}
                              {member.team && <span className="badge badge-purple" style={{ fontSize: '9px', padding: '2px 4px' }}>{member.team}</span>}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, color: member.trialSignups > 0 ? '#16a34a' : 'var(--text-tertiary)' }}>
                          {member.trialSignups}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, color: member.enrichmentDone > 0 ? '#3b82f6' : 'var(--text-tertiary)' }}>
                          {member.enrichmentDone}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, color: member.outreachSent > 0 ? '#8b5cf6' : 'var(--text-tertiary)' }}>
                          {member.outreachSent}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, color: member.demosScheduled > 0 ? '#f59e0b' : 'var(--text-tertiary)' }}>
                          {member.demosScheduled}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontWeight: 700, color: member.demosAttended > 0 ? '#10b981' : 'var(--text-tertiary)' }}>
                            {member.demosAttended}
                          </span>
                          {member.demosScheduled > 0 && (
                            <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>
                              ({Math.round((member.demosAttended / member.demosScheduled) * 100)}%)
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, color: member.coldCallsMade > 0 ? '#ef4444' : 'var(--text-tertiary)' }}>
                          {member.coldCallsMade}
                        </span>
                      </td>
                      <td style={{ color: 'var(--success)', fontWeight: 600 }}>
                        {fmtINR(member.wonRevenue)}
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-tertiary)' }}>
                        No team members found. Invite users in Settings to track their activity.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
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

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'var(--bg-elevated)', borderRadius: 8 }}>
              <span style={{ fontWeight: 500 }}>Pipeline Notes</span>
              <input type="checkbox" checked={widgets.pipelineNotes} onChange={() => toggleWidget('pipelineNotes')} />
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
