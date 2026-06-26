// ============================================
// HUNTLO SALES OS — HOME OS PAGE
// ============================================
import { useState, useMemo } from 'react';
import { Sparkles, AlertCircle, Calendar, FileText, Clock, TrendingUp, ArrowRight, Zap, Activity, Users, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import usePipelineStore from '../store/usePipelineStore';
import useDataStore from '../store/useDataStore';
import useAuthStore from '../store/useAuthStore';
import { queryGemini } from '../lib/gemini';
import { useDialog } from '../context/DialogContext';
import { computeSignalScore } from '../utils/leadScoring';
import './HomeOS.css';
import { useEffect } from 'react';

// ── INR Formatter ─────────────────────────────────────────
function fmtINR(val) {
  const n = Number(val) || 0;
  if (n >= 10000000) return `₹${(n/10000000).toFixed(2)}Cr`;
  if (n >= 100000)   return `₹${(n/100000).toFixed(1)}L`;
  if (n >= 1000)     return `₹${(n/1000).toFixed(0)}k`;
  return `₹${n.toLocaleString('en-IN')}`;
}


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
  const { team } = useAuthStore();
  const { showAlert } = useDialog();
  const navigate = useNavigate();
  const [aiQuery, setAiQuery] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [now] = useState(() => Date.now());

  useEffect(() => {
    // Automatically migrate local proposals to Supabase if any exist
    migrateLocalProposals().catch(console.error);
  }, [migrateLocalProposals]);
  
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
          <PriorityCard icon={BarChart3} label="Meetings This Week" count={meetingsThisWeek.length} urgency="medium" color="var(--accent-blue)" onClick={() => navigate('/meetings')} />
          <PriorityCard icon={Users} label="Total Contacts" count={contacts?.length || 0} urgency="low" color="var(--text-secondary)" onClick={() => navigate('/contacts')} />
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
