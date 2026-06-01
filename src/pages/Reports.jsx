// ============================================
// HUNTLO SALES OS — REPORTS PAGE
// ============================================
import { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';
import useDataStore from '../store/useDataStore';
import useAuthStore from '../store/useAuthStore';
import { useEffect } from 'react';
import { format, subMonths, isSameMonth, subWeeks, isSameWeek } from 'date-fns';
import './Reports.css';

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
  const { deals, meetings, tasks, companies, contacts } = useDataStore();
  const { team, fetchTeam } = useAuthStore();

  useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  const leaderboard = useMemo(() => {
    return team.map(member => {
      const addedAccounts = companies.filter(c => c.owner_id === member.id).length;
      const addedContacts = contacts.filter(c => c.owner_id === member.id).length;
      const setMeetings = meetings.filter(m => m.owner_id === member.id).length;
      
      let wonRevenue = 0;
      deals.forEach(d => {
        if (d.owner_id === member.id && d.stage === 'Closed Won') {
          wonRevenue += Number(d.value) || 0;
        }
      });

      return {
        ...member,
        addedAccounts,
        addedContacts,
        setMeetings,
        wonRevenue
      };
    }).sort((a, b) => b.wonRevenue - a.wonRevenue);
  }, [team, companies, contacts, meetings, deals]);

  const metrics = useMemo(() => {
    let totalRevenue = 0;
    let pipelineValue = 0;
    
    deals.forEach(d => {
      const val = Number(d.value) || 0;
      if (d.stage === 'Closed Won') {
        totalRevenue += val;
      } else if (d.stage !== 'Closed Lost') {
        pipelineValue += val;
      }
    });

    const totalDemos = meetings.filter(m => m.type === 'Demo').length;
    const wonDealsCount = deals.filter(d => d.stage === 'Closed Won').length;
    const winRate = totalDemos > 0 ? Math.round((wonDealsCount / totalDemos) * 100) : 0;

    return {
      revenue: `$${(totalRevenue / 1000).toFixed(1)}k`,
      pipeline: `$${(pipelineValue / 1000).toFixed(1)}k`,
      winRate: `${winRate}%`
    };
  }, [deals, meetings]);

  const revenueData = useMemo(() => {
    const data = [];
    for (let i = 4; i >= 0; i--) {
      const d = subMonths(new Date(), i);
      const monthLabel = format(d, 'MMM');
      
      let won = 0;
      let pipeline = 0;

      deals.forEach(deal => {
        const dealDate = new Date(deal.created_at || new Date());
        if (isSameMonth(dealDate, d)) {
          const val = (Number(deal.value) || 0) / 1000;
          if (deal.stage === 'Closed Won') won += val;
          else if (deal.stage !== 'Closed Lost') pipeline += val;
        }
      });

      data.push({ month: monthLabel, won: Math.round(won), pipeline: Math.round(pipeline) });
    }
    return data;
  }, [deals]);

  const activityData = useMemo(() => {
    const data = [];
    for (let i = 3; i >= 0; i--) {
      const d = subWeeks(new Date(), i);
      const weekLabel = `W${4 - i}`; // W1 to W4
      
      let demos = 0;
      let emails = 0;

      meetings.forEach(m => {
        const mDate = new Date(m.date);
        if (isSameWeek(mDate, d) && m.type === 'Demo') demos++;
      });

      tasks.forEach(t => {
        const tDate = new Date(t.due || t.created_at);
        if (isSameWeek(tDate, d) && t.type === 'email') emails++;
      });

      data.push({ week: weekLabel, demos, emails });
    }
    return data;
  }, [meetings, tasks]);

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
            <div className="filter-chips">
              {['Q1', 'Q2', 'YTD', 'All Time'].map(f => (
                <button key={f} className={`filter-chip ${timeframe === f ? 'active' : ''}`} onClick={() => setTimeframe(f)}>
                  {f}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {activeTab === 'overview' ? (
        <>
          <div className="rep-stats-grid">
            <StatCard label="Total Revenue" value={metrics.revenue} trend="Calculated from Won Deals" isPositive={true} />
            <StatCard label="Pipeline Value" value={metrics.pipeline} trend="Active Deals" isPositive={true} />
            <StatCard label="Demo Win Rate" value={metrics.winRate} trend="Won vs Demos" isPositive={true} />
            <StatCard label="Avg Sales Cycle" value="42 days" trend="Estimate" isPositive={true} />
          </div>

          <div className="rep-charts-grid">
            <div className="rep-chart-card">
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

            <div className="rep-chart-card">
              <div className="rep-chart-header">
                <h3>Sales Activity</h3>
                <span className="badge badge-gray">Demos & Emails (Past 4 Weeks)</span>
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
    </div>
  );
}
