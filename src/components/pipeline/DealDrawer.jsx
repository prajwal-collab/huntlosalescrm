// ============================================
// HUNTLO SALES OS — DEAL DRAWER
// ============================================
import { useState } from 'react';
import { X, ExternalLink, Mail, Phone, Sparkles, Plus, CheckSquare, Calendar, FileText } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import usePipelineStore from '../../store/usePipelineStore';
import { generateFollowUp, generateCompanyInsight } from '../../lib/gemini';
import './DealDrawer.css';

const TABS = ['Overview', 'Activity', 'Contacts', 'Notes', 'Tasks', 'AI Insights'];
const ACTIVITY_ICONS = { email: '📧', call: '📞', meeting: '📅', note: '📝', default: '•' };

export default function DealDrawer({ dealId, onClose }) {
  const { getSelectedDeal, updateDeal, addActivity } = usePipelineStore();
  const deal = getSelectedDeal();
  const [activeTab, setActiveTab] = useState('Overview');
  const [aiInsight, setAiInsight] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [followUp, setFollowUp] = useState('');
  const [note, setNote] = useState('');

  if (!deal) return null;

  const handleGenerateInsight = async () => {
    setAiLoading(true);
    try {
      const res = await generateCompanyInsight(deal.company, deal.industry || 'SaaS', deal.engagementScore, deal.stage);
      setAiInsight(res);
    } finally {
      setAiLoading(false);
    }
  };

  const handleGenerateFollowUp = async () => {
    setAiLoading(true);
    try {
      const res = await generateFollowUp(deal.company, deal.stage, deal.lastActivity, deal.contacts[0] || 'the team');
      setFollowUp(res);
    } finally {
      setAiLoading(false);
    }
  };

  const handleAddNote = () => {
    if (!note.trim()) return;
    addActivity(deal.id, { type: 'note', text: note, user: 'You' });
    setNote('');
  };

  return (
    <div className="drawer-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="deal-drawer animate-slide-right">
        {/* Header */}
        <div className="drawer-header">
          <div className="drawer-deal-logo" style={{ background: deal.color + '22', color: deal.color }}>
            {deal.logo}
          </div>
          <div className="drawer-deal-info">
            <h2 className="drawer-deal-name">{deal.company}</h2>
            <div className="drawer-deal-meta">
              <span className="badge badge-blue">{deal.stage}</span>
              <span className="drawer-arr">${(deal.arr / 1000).toFixed(0)}k ARR</span>
              <span className="drawer-owner" style={{ color: deal.ownerColor }}>● {deal.owner}</span>
            </div>
          </div>
          <button className="drawer-close" onClick={onClose}><X size={16} /></button>
        </div>

        {/* Tabs */}
        <div className="tabs">
          {TABS.map(tab => (
            <button key={tab} className={`tab-item ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="drawer-body">
          {activeTab === 'Overview' && (
            <div className="drawer-overview">
              <div className="overview-stats">
                <div className="ov-stat">
                  <span className="ov-stat-label">Engagement</span>
                  <span className="ov-stat-val" style={{ color: deal.engagementScore >= 75 ? 'var(--success)' : 'var(--warning)' }}>
                    {deal.engagementScore}/100
                  </span>
                </div>
                <div className="ov-stat">
                  <span className="ov-stat-label">Urgency</span>
                  <span className="ov-stat-val" style={{ textTransform: 'capitalize' }}>{deal.urgency}</span>
                </div>
                <div className="ov-stat">
                  <span className="ov-stat-label">Tasks</span>
                  <span className="ov-stat-val">{deal.taskCount}</span>
                </div>
                <div className="ov-stat">
                  <span className="ov-stat-label">Last Activity</span>
                  <span className="ov-stat-val">{formatDistanceToNow(new Date(deal.lastActivity), { addSuffix: true })}</span>
                </div>
              </div>

              {deal.notes && (
                <div className="ov-notes">
                  <p className="ov-notes-label">Deal Notes</p>
                  <p className="ov-notes-text">{deal.notes}</p>
                </div>
              )}

              {deal.nextStep && (
                <div className="ov-next-step">
                  <span className="ov-next-label">Next Step</span>
                  <span className="ov-next-text">{deal.nextStep}</span>
                </div>
              )}

              <div className="drawer-quick-actions">
                <button className="btn btn-ghost btn-sm" onClick={handleGenerateFollowUp}>
                  <Mail size={13} /> {aiLoading ? 'Generating...' : 'Draft Follow-up'}
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => alert('Meeting scheduling integration triggered.')}>
                  <Calendar size={13} /> Schedule Meeting
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => alert('Proposal generation triggered.')}>
                  <FileText size={13} /> Send Proposal
                </button>
              </div>

              {followUp && (
                <div className="ai-generated-box">
                  <div className="ai-generated-label"><Sparkles size={11} /> AI Generated Follow-up</div>
                  <pre className="ai-generated-text">{followUp}</pre>
                </div>
              )}
            </div>
          )}

          {activeTab === 'Activity' && (
            <div className="drawer-activity">
              <div className="add-note-row">
                <input
                  className="input-base"
                  placeholder="Add a note..."
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddNote()}
                />
                <button className="btn btn-primary btn-sm" onClick={handleAddNote}><Plus size={13} /></button>
              </div>
              <div className="activity-timeline">
                {deal.activities && deal.activities.length > 0 ? deal.activities.map((act, i) => (
                  <div key={i} className="timeline-item">
                    <span className="timeline-icon">{ACTIVITY_ICONS[act.type] || ACTIVITY_ICONS.default}</span>
                    <div className="timeline-body">
                      <span className="timeline-text">{act.text}</span>
                      <span className="timeline-meta">{act.user} · {formatDistanceToNow(new Date(act.time), { addSuffix: true })}</span>
                    </div>
                  </div>
                )) : (
                  <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
                    <p>No activity yet</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'Contacts' && (
            <div className="drawer-contacts">
              {deal.contacts && deal.contacts.length > 0 ? deal.contacts.map((c, i) => (
                <div key={i} className="contact-row">
                  <div className="avatar avatar-sm" style={{ background: `hsl(${i * 60}, 60%, 50%)`, color: '#fff' }}>
                    {c.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="contact-info">
                    <span className="contact-name">{c}</span>
                    <span className="contact-role">Contact</span>
                  </div>
                  <button className="icon-btn" onClick={() => alert(`Drafting email to ${c}`)}><Mail size={13} /></button>
                </div>
              )) : <p className="text-secondary" style={{ padding: 'var(--space-4)' }}>No contacts linked</p>}
            </div>
          )}

          {activeTab === 'Notes' && (
            <div className="drawer-notes">
              <textarea
                className="input-base"
                rows={10}
                defaultValue={deal.notes}
                placeholder="Add deal notes..."
                style={{ resize: 'vertical' }}
              />
              <button className="btn btn-primary btn-sm" style={{ marginTop: 8 }} onClick={() => alert('Notes saved successfully.')}>Save Notes</button>
            </div>
          )}

          {activeTab === 'Tasks' && (
            <div className="drawer-tasks">
              <button className="btn btn-ghost btn-sm" style={{ marginBottom: 12 }}>
                <Plus size={13} /> Add Task
              </button>
              <div className="empty-state">
                <CheckSquare size={28} />
                <h3>No tasks yet</h3>
                <p>Add tasks to track next steps for this deal</p>
              </div>
            </div>
          )}

          {activeTab === 'AI Insights' && (
            <div className="drawer-ai">
              <button
                className="btn btn-primary btn-md w-full"
                onClick={handleGenerateInsight}
                disabled={aiLoading}
              >
                <Sparkles size={14} />
                {aiLoading ? 'Analyzing...' : 'Generate AI Insights'}
              </button>
              {aiInsight && (
                <div className="ai-generated-box" style={{ marginTop: 16 }}>
                  <div className="ai-generated-label"><Sparkles size={11} /> AI Analysis</div>
                  <pre className="ai-generated-text">{aiInsight}</pre>
                </div>
              )}
              {!aiInsight && !aiLoading && (
                <div className="empty-state">
                  <Sparkles size={28} />
                  <h3>AI Insights</h3>
                  <p>Click above to get AI-powered tactical recommendations for this deal</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
