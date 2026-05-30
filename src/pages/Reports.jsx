// ============================================
// HUNTLO SALES OS — REPORTS PAGE
// ============================================
import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';
import './Reports.css';

const REVENUE_DATA = [
  { month: 'Jan', won: 45, pipeline: 120 },
  { month: 'Feb', won: 62, pipeline: 140 },
  { month: 'Mar', won: 85, pipeline: 160 },
  { month: 'Apr', won: 72, pipeline: 190 },
  { month: 'May', won: 120, pipeline: 240 },
];

const ACTIVITY_DATA = [
  { week: 'W1', demos: 12, emails: 140 },
  { week: 'W2', demos: 15, emails: 160 },
  { week: 'W3', demos: 11, emails: 180 },
  { week: 'W4', demos: 18, emails: 210 },
];

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

  return (
    <div className="reports-page">
      <div className="page-header-row">
        <div>
          <h1 className="page-big-title">Reports</h1>
          <p className="page-big-sub">Operational analytics and revenue forecasting</p>
        </div>
        <div className="filter-chips">
          {['Q1', 'Q2', 'YTD', 'All Time'].map(f => (
            <button key={f} className={`filter-chip ${timeframe === f ? 'active' : ''}`} onClick={() => setTimeframe(f)}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="rep-stats-grid">
        <StatCard label="Total Revenue (YTD)" value="$384k" trend="24% vs last year" isPositive={true} />
        <StatCard label="Pipeline Value" value="$1.2M" trend="12% vs last month" isPositive={true} />
        <StatCard label="Demo Win Rate" value="32%" trend="4% vs last month" isPositive={true} />
        <StatCard label="Avg Sales Cycle" value="42 days" trend="5 days slower" isPositive={false} />
      </div>

      <div className="rep-charts-grid">
        <div className="rep-chart-card">
          <div className="rep-chart-header">
            <h3>Revenue Growth</h3>
            <span className="badge badge-blue">Won vs Pipeline</span>
          </div>
          <div className="rep-chart-area">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={REVENUE_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--bg-border)" vertical={false} />
                <XAxis dataKey="month" stroke="var(--text-tertiary)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-tertiary)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `$${v}k`} />
                <Tooltip cursor={{ fill: 'var(--bg-elevated)' }} contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-border)', borderRadius: '8px' }} />
                <Bar dataKey="won" name="Closed Won" fill="var(--success)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="pipeline" name="Pipeline" fill="var(--accent-blue-muted)" stroke="var(--accent-blue)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rep-chart-card">
          <div className="rep-chart-header">
            <h3>Sales Activity</h3>
            <span className="badge badge-gray">Demos & Outreach</span>
          </div>
          <div className="rep-chart-area">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ACTIVITY_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--bg-border)" vertical={false} />
                <XAxis dataKey="week" stroke="var(--text-tertiary)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-tertiary)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-border)', borderRadius: '8px' }} />
                <Line type="monotone" dataKey="demos" name="Demos" stroke="var(--accent-purple)" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="emails" name="Outreach" stroke="var(--text-secondary)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
