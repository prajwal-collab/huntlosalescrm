import { useState } from 'react';
import { Search, Plus, Play, Pause, GitMerge, Mail, Globe, Clock, X, Save, Trash2, MoreVertical, BarChart2, Activity, Users, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useDataStore from '../store/useDataStore';
import { generateFullSequence } from '../lib/gemini';
import SequenceEditor from '../components/sequences/SequenceEditor';
import './Sequences.css';

const NODE_ICONS = {
  email: <Mail size={16} />,
  linkedin: <Globe size={16} />,
  delay: <Clock size={16} />,
};

function SequenceNode({ node, isLast }) {
  return (
    <div className="seq-node-wrap">
      <div className={`seq-node type-${node.type}`}>
        <div className="seq-node-icon">{NODE_ICONS[node.type] || <GitMerge size={16} />}</div>
        <div className="seq-node-content">
          <span className="seq-node-label">{node.type === 'delay' ? node.label : `Day ${node.day}`}</span>
          {node.subject && <span className="seq-node-title">{node.subject}</span>}
          {node.content && <span className="seq-node-desc">{node.content}</span>}
        </div>
      </div>
      {!isLast && <div className="seq-connector" />}
    </div>
  );
}

export default function Sequences() {
  const { sequences, createSequence, deleteSequence } = useDataStore();
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({ name: '', channel: 'Email', template: 'Blank Sequence', persona: '', painPoint: '' });
  const [error, setError] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const TEMPLATES = [
    "Blank Sequence",
    "Generate with AI",
    "FLOW 1 — FEEDBACK → DEMO → DESIGN PARTNER",
    "FLOW 2 — RECRUITER WORKFLOW AUDIT",
    "FLOW 3 — THE CONTRARIAN CAMPAIGN",
    "FLOW 4 — THE DESIGN PARTNER PROGRAM",
    "FLOW 5 — THE MARKET INSIGHT SERIES"
  ];

  const TEMPLATE_DATA = {
    "Blank Sequence": [],
    "FLOW 1 — FEEDBACK → DEMO → DESIGN PARTNER": [
      { id: '1', type: 'email', day: 1, time: '09:00', subject: 'Quick feedback on your workflow?', content: 'Hi {{first_name}}, would love to get your thoughts on a new design.' },
      { id: '3', type: 'email', day: 4, time: '09:00', subject: 'Following up - Demo?', content: 'Let me show you what we built based on similar feedback.' },
    ],
    "FLOW 2 — RECRUITER WORKFLOW AUDIT": [
      { id: '1', type: 'email', day: 1, time: '09:00', subject: 'Your recruiting workflow', content: 'Hi {{first_name}}, how are you currently managing outbound sourcing?' },
      { id: '3', type: 'email', day: 3, time: '09:00', subject: 'Audit template', content: 'Here is a free template we use to audit recruiting workflows.' },
    ],
    "FLOW 3 — THE CONTRARIAN CAMPAIGN": [
      { id: '1', type: 'email', day: 1, time: '09:00', subject: 'Unpopular opinion about SDRs', content: 'I think SDRs should stop personalizing emails.' },
      { id: '3', type: 'email', day: 4, time: '09:00', subject: 'The data behind the claim', content: 'We analyzed 10k emails and found that...' },
    ],
    "FLOW 4 — THE DESIGN PARTNER PROGRAM": [
      { id: '1', type: 'email', day: 1, time: '09:00', subject: 'Exclusive invite: Design Partner', content: 'We are looking for 5 forward-thinking companies to shape...' },
      { id: '3', type: 'email', day: 3, time: '09:00', subject: 'Checking in', content: 'Sent you an email about our design partner program.' },
    ],
    "FLOW 5 — THE MARKET INSIGHT SERIES": [
      { id: '1', type: 'email', day: 1, time: '09:00', subject: 'Market Insight: Series A Trends', content: 'We are seeing a massive shift in how Series A companies buy software.' },
      { id: '3', type: 'email', day: 4, time: '09:00', subject: 'Market Insight: The AI Impact', content: 'Following up on my last email, here is our data on AI...' },
    ]
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!formData.name) return;
    setError(null);
    try {
      let nodesToUse = [];
      let sequenceName = formData.name;
      
      if (formData.template === 'Generate with AI') {
        setIsGenerating(true);
        try {
          const rawResponse = await generateFullSequence(formData.persona || 'B2B Buyers', formData.painPoint || 'Increasing sales velocity', sequenceName);
          
          // Attempt to extract JSON from the raw response
          const jsonStr = rawResponse.replace(/```json/g, '').replace(/```/g, '').trim();
          const aiData = JSON.parse(jsonStr);
          if (aiData.planName) {
            sequenceName = aiData.planName;
          }
          if (aiData.touchpoints && Array.isArray(aiData.touchpoints)) {
            nodesToUse = aiData.touchpoints.map((tp, idx) => ({
              id: Date.now().toString() + idx,
              type: 'email',
              day: tp.waitDays > 0 ? tp.waitDays : 1,
              time: '09:00',
              subject: tp.subject,
              content: tp.body
            }));
          }
        } catch (parseErr) {
          console.error("Failed to parse AI response:", parseErr);
          throw new Error("AI generated an invalid format. Please try again.");
        } finally {
          setIsGenerating(false);
        }
      } else {
        nodesToUse = TEMPLATE_DATA[formData.template] || [];
      }

      const newSeq = await createSequence({
        name: sequenceName,
        channel: formData.channel,
        status: 'inactive',
        steps: nodesToUse.length,
        enrolled: 0,
        reply_rate: 0,
        nodes: nodesToUse
      });
      setIsAdding(false);
      setSelected(newSeq);
      setFormData({ name: '', channel: 'Email', template: 'Blank Sequence', persona: '', painPoint: '' });
    } catch (err) {
      console.error(err);
      setIsGenerating(false);
      setError(err.message || 'Failed to create sequence.');
    }
  };

  if (selected) {
    return <SequenceEditor sequence={selected} onBack={() => setSelected(null)} />;
  }

  return (
    <div className="sequences-page">
      <div className="page-header-row">
        <div>
          <h1 className="page-big-title">Sequences</h1>
          <p className="page-big-sub">Multi-channel outbound automation workflows</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setIsAdding(true)}><Plus size={13} /> Create Sequence</button>
      </div>

      <div className="sequences-layout">
        <div className="sequences-sidebar">
          <div className="search-box" style={{ marginBottom: 16 }}>
            <Search size={14} />
            <input placeholder="Search sequences..." />
          </div>

          <div className="seq-list">
            {sequences.map(seq => (
              <div 
                key={seq.id} 
                className={`seq-list-item ${selected?.id === seq.id ? 'selected' : ''}`}
                onClick={() => setSelected(seq)}
                style={{ position: 'relative' }}
              >
                <div className="seq-list-top" style={{ paddingRight: 24 }}>
                  <span className="seq-list-name truncate" style={{ maxWidth: 200 }}>{seq.name}</span>
                  {seq.status === 'active' || seq.status === 'Active' ? <Play size={12} color="var(--success)" /> : <Pause size={12} color="var(--text-tertiary)" />}
                </div>
                <div className="seq-list-meta">
                  <span>{seq.steps || 0} steps</span>
                  <span>•</span>
                  <span>{seq.enrolled || 0} enrolled</span>
                  <span>•</span>
                  <span style={{ color: 'var(--accent-blue)' }}>{seq.reply_rate || 0}% reply</span>
                </div>
                <button 
                  className="btn-icon" 
                  style={{ position: 'absolute', top: 12, right: 8, background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm('Are you sure you want to permanently delete this campaign and cancel all pending enrollments?')) {
                      deleteSequence(seq.id);
                    }
                  }}
                  title="Delete Campaign"
                >
                  <Trash2 size={14} className="hover-danger" />
                </button>
              </div>
            ))}
            {sequences.length === 0 && (
              <div className="empty-state" style={{ marginTop: 20 }}>
                <GitMerge size={24} />
                <p>No sequences created yet.</p>
              </div>
            )}
          </div>
        </div>

        {isAdding && (
          <div className="sequence-builder animate-slide-right" style={{ borderLeft: '1px solid var(--bg-border)', position: 'absolute', right: 0, top: 0, bottom: 0, width: 450, background: 'var(--bg-surface)', zIndex: 10, boxShadow: 'var(--shadow-lg)' }}>
            <div className="seq-builder-header" style={{ marginBottom: 12, padding: 24, paddingBottom: 16, borderBottom: '1px solid var(--bg-border)' }}>
              <div>
                <h2 className="panel-title" style={{ fontSize: 18 }}>Create Sequence</h2>
                <p className="page-big-sub" style={{ fontSize: 13, marginTop: 4 }}>Configure a new automated outreach workflow.</p>
              </div>
              <button className="drawer-close" style={{ position: 'absolute', top: 24, right: 24 }} onClick={() => setIsAdding(false)}><X size={16}/></button>
            </div>
            <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '24px' }}>
              {error && (
                <div style={{ padding: 12, borderRadius: 8, background: 'rgba(239,68,68,0.08)', color: 'var(--danger)', fontSize: 13, display: 'flex', gap: 8 }}>
                  <X size={14} /> {error}
                </div>
              )}
              <div className="form-group">
                <label className="label" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)' }}>Sequence Name *</label>
                <input className="input-base" autoFocus required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Outbound Q3 Founders" style={{ background: 'var(--bg-body)' }} />
              </div>
              <div className="form-group">
                <label className="label" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)' }}>Template</label>
                <select className="input-base" value={formData.template} onChange={e => {
                  const val = e.target.value;
                  setFormData({...formData, template: val, name: val !== 'Blank Sequence' && val !== 'Generate with AI' ? val : formData.name});
                }} style={{ background: 'var(--bg-body)' }}>
                  {TEMPLATES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              
              {formData.template === 'Generate with AI' && (
                <div style={{ padding: '16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="label" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)' }}>Target Persona</label>
                    <input className="input-base" value={formData.persona || ''} onChange={e => setFormData({...formData, persona: e.target.value})} placeholder="e.g. VP of Engineering" style={{ background: '#ffffff' }} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="label" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)' }}>Key Pain Point / Value Prop</label>
                    <textarea className="input-base" rows={2} value={formData.painPoint || ''} onChange={e => setFormData({...formData, painPoint: e.target.value})} placeholder="e.g. Reducing cloud costs and improving deployment speeds" style={{ background: '#ffffff', resize: 'vertical' }} />
                  </div>
                </div>
              )}

              <div className="form-group">
                <label className="label" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)' }}>Primary Channel</label>
                <select className="input-base" value={formData.channel} onChange={e => setFormData({...formData, channel: e.target.value})} style={{ background: 'var(--bg-body)' }}>
                  <option value="Multi-channel">Multi-channel</option>
                  <option value="Email">Email Only</option>
                  <option value="LinkedIn">LinkedIn Only</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                <button type="button" className="btn btn-ghost w-full" onClick={() => setIsAdding(false)} disabled={isGenerating}>Cancel</button>
                <button type="submit" className="btn btn-primary w-full" disabled={isGenerating}>
                  {isGenerating ? 'Generating with AI...' : 'Create Workflow'}
                </button>
              </div>
            </form>
          </div>
        )}

        {!isAdding && !selected && (
          <SequenceHubDashboard sequences={sequences} onCreateClick={() => setIsAdding(true)} />
        )}
      </div>
    </div>
  );
}

// ── Global Sequence Hub Dashboard ─────────────────────────
function SequenceHubDashboard({ sequences, onCreateClick }) {
  const activeCount = sequences.filter(s => s.status === 'active' || s.status === 'Active').length;
  const totalEnrolled = sequences.reduce((acc, s) => acc + (s.enrolled || 0), 0);
  const avgReplyRate = sequences.length > 0 
    ? (sequences.reduce((acc, s) => acc + (s.reply_rate || 0), 0) / sequences.length).toFixed(1) 
    : 0;

  if (sequences.length === 0) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 60, background: 'var(--bg-body)' }}>
        <div style={{ textAlign: 'center', maxWidth: 480 }}>
          <div style={{ width: 80, height: 80, background: 'var(--bg-elevated)', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', border: '1px solid var(--border-color)' }}>
            <Zap size={40} color="var(--accent-blue)" />
          </div>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 12, letterSpacing: '-0.5px' }}>Sequence Engine</h2>
          <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 32 }}>
            Your outbound automation control center. Build multi-channel campaigns, leverage AI for personalization, and track real-time deliverability across your entire pipeline.
          </p>
          <button className="btn btn-primary" onClick={onCreateClick} style={{ padding: '12px 24px', fontSize: 15, borderRadius: 8 }}>
            <Plus size={16} /> Create Your First Workflow
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 40, background: 'var(--bg-body)' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <h2 style={{ color: 'var(--text-primary)', marginBottom: 32, fontSize: 24, fontWeight: 700 }}>Global Sequence Hub</h2>
        
        {/* Global Metrics Ribbon */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 40 }}>
          <div style={{ background: 'var(--bg-elevated)', padding: 24, borderRadius: 12, border: '1px solid var(--border-color)', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Zap size={16} color="var(--accent-blue)" />
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Active Campaigns</div>
            </div>
            <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--text-primary)' }}>{activeCount}</div>
          </div>
          <div style={{ background: 'var(--bg-elevated)', padding: 24, borderRadius: 12, border: '1px solid var(--border-color)', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Users size={16} color="var(--text-secondary)" />
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Total Enrolled</div>
            </div>
            <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--text-primary)' }}>{totalEnrolled}</div>
          </div>
          <div style={{ background: 'var(--bg-elevated)', padding: 24, borderRadius: 12, border: '1px solid var(--border-color)', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Mail size={16} color="var(--text-secondary)" />
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Emails Sent (Today)</div>
            </div>
            <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--text-primary)' }}>0</div>
          </div>
          <div style={{ background: 'var(--bg-elevated)', padding: 24, borderRadius: 12, border: '1px solid var(--border-color)', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Activity size={16} color="var(--success)" />
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Global Reply Rate</div>
            </div>
            <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--success)' }}>{avgReplyRate}%</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
          {/* Recent Global Activity */}
          <div style={{ background: 'var(--bg-elevated)', borderRadius: 12, padding: 24, border: '1px solid var(--border-color)', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Activity size={18} /> Global Activity Feed
            </h3>
            {activeCount === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-tertiary)' }}>
                No activity yet. Activate a campaign to start logging events.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Placeholder Activity Items */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, paddingBottom: 16, borderBottom: '1px solid var(--border-color)' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)', marginTop: 6 }}></div>
                  <div>
                    <div style={{ fontSize: 14, color: 'var(--text-primary)', marginBottom: 4 }}><strong>John Doe</strong> opened Step 1 email from <span style={{ color: 'var(--accent-blue)' }}>{sequences[0]?.name}</span></div>
                    <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>2 minutes ago</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--warning)', marginTop: 6 }}></div>
                  <div>
                    <div style={{ fontSize: 14, color: 'var(--text-primary)', marginBottom: 4 }}><strong>Sarah Smith</strong> clicked a link in <span style={{ color: 'var(--accent-blue)' }}>{sequences[0]?.name}</span></div>
                    <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>1 hour ago</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions / Getting Started */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: 'linear-gradient(135deg, #1b66f2 0%, #0d47a1 100%)', borderRadius: 12, padding: 24, color: '#fff', boxShadow: '0 10px 20px rgba(27,102,242,0.2)' }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                <BarChart2 size={20} />
                Scale Outbound
              </h3>
              <p style={{ fontSize: 13, lineHeight: 1.5, opacity: 0.9, marginBottom: 16 }}>
                Create a new sequence to target a different persona or industry vertical.
              </p>
              <button 
                onClick={onCreateClick}
                style={{ background: '#fff', color: '#1b66f2', border: 'none', padding: '8px 16px', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Plus size={14} /> New Workflow
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
