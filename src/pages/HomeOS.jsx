// ============================================
// HUNTLO SALES OS — HOME OS PAGE
// ============================================
import { useState, useMemo } from 'react';
import { Sparkles, AlertCircle, Calendar, FileText, Clock, TrendingUp, ArrowRight, Zap, Activity } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import usePipelineStore from '../store/usePipelineStore';
import useDataStore from '../store/useDataStore';
import { queryGemini } from '../lib/gemini';
import './HomeOS.css';

const AI_INSIGHTS = [];
const ACTIVITY_FEED = [];

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
  const { deals, tasks, meetings } = useDataStore();
  const [aiQuery, setAiQuery] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [now] = useState(() => Date.now());
  
  const pendingTasks = tasks.filter(t => t.status !== 'completed');
  const overdueTasks = tasks.filter(t => t.status !== 'completed' && new Date(t.due).getTime() < now);
  const todayMeetings = meetings.filter(m => {
    const d = new Date(m.date);
    const today = new Date(now);
    return d.toDateString() === today.toDateString() || m.status === 'scheduled';
  });
  const hotDeals = deals.filter(d => d.engagement_score >= 75 && d.stage !== 'Closed Won' && d.stage !== 'Closed Lost');
  const staleDeals = deals.filter(d => {
    const days = (now - new Date(d.updated_at).getTime()) / 86400000;
    return days > 5 && d.stage !== 'Closed Won' && d.stage !== 'Closed Lost';
  });

  const totalARR = deals
    .filter(d => d.stage !== 'Closed Lost')
    .reduce((sum, d) => sum + (d.arr || 0), 0);

  const wonARR = deals
    .filter(d => d.stage === 'Closed Won')
    .reduce((sum, d) => sum + (d.arr || 0), 0);

  const handleAIQuery = async (e) => {
    e.preventDefault();
    if (!aiQuery.trim()) return;
    setAiLoading(true);
    try {
      const res = await queryGemini(aiQuery);
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

      {/* Stats Row */}
      <section className="stats-row">
        <div className="stat-card">
          <span className="stat-label">Pipeline ARR</span>
          <span className="stat-value">${(totalARR / 1000).toFixed(0)}k</span>
          <span className="stat-delta up">↑ 22% vs last month</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Won This Month</span>
          <span className="stat-value">${(wonARR / 1000).toFixed(0)}k</span>
          <span className="stat-delta up">↑ 1 deal closed</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Active Deals</span>
          <span className="stat-value">{deals.filter(d => d.stage !== 'Closed Won' && d.stage !== 'Closed Lost').length}</span>
          <span className="stat-delta up">↑ 3 new this week</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Hot Leads</span>
          <span className="stat-value">{hotDeals.length}</span>
          <span className="stat-delta up">Score ≥ 75</span>
        </div>
      </section>

      {/* Today's Priorities */}
      <section className="section">
        <h2 className="section-title">Today's Priorities</h2>
        <div className="priorities-grid">
          <PriorityCard icon={AlertCircle} label="Overdue Tasks" count={overdueTasks.length} urgency="urgent" color="var(--danger)" onClick={() => alert('Viewing overdue tasks')} />
          <PriorityCard icon={Calendar} label="Demos Today" count={todayMeetings.length} urgency="high" color="var(--accent-blue)" onClick={() => alert('Viewing today\'s demos')} />
          <PriorityCard icon={Clock} label="Pending Tasks" count={pendingTasks.length} urgency="medium" color="var(--warning)" onClick={() => alert('Viewing pending tasks')} />
          <PriorityCard icon={FileText} label="Proposals Out" count={deals.filter(d => d.stage === 'Proposal Sent').length} urgency="low" color="var(--accent-purple)" onClick={() => alert('Viewing active proposals')} />
          <PriorityCard icon={TrendingUp} label="Stale Deals" count={staleDeals.length} urgency="warning" color="var(--orange)" onClick={() => alert('Viewing stale deals')} />
          <PriorityCard icon={Zap} label="Hot Leads" count={hotDeals.length} urgency="positive" color="var(--success)" onClick={() => alert('Viewing hot leads')} />
        </div>
      </section>

      <div className="home-bottom-grid">
        {/* AI Insights */}
        <section className="section">
          <h2 className="section-title"><Sparkles size={14} /> AI Insights</h2>
          <div className="insights-list">
            {AI_INSIGHTS.length > 0 ? AI_INSIGHTS.map((ins, i) => (
              <div key={i} className={`insight-card insight-${ins.type}`}>
                <span className="insight-icon">{ins.icon}</span>
                <span className="insight-text">{ins.text}</span>
                <button className="insight-action" onClick={() => alert('Applying AI recommendation...')}>{ins.action} →</button>
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
            {ACTIVITY_FEED.length > 0 ? ACTIVITY_FEED.map((item, i) => (
              <div key={i} className="activity-item animate-fade-in" style={{ animationDelay: `${i * 40}ms` }}>
                <span className="activity-icon">{item.icon}</span>
                <div className="activity-body">
                  <span className="activity-text">{item.text}</span>
                  <span className="activity-time">
                    {formatDistanceToNow(new Date(item.time), { addSuffix: true })}
                  </span>
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
