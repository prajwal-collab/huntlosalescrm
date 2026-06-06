import { useState } from 'react';
import { Search, Plus, Play, Pause, GitMerge, Mail, Globe, Clock, X, Save, Trash2, MoreVertical, BarChart2, Activity, Users, Zap, Sparkles, FileText, LayoutTemplate, RefreshCw } from 'lucide-react';
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
          <div className="sequence-builder animate-slide-right" style={{ borderLeft: '1px solid var(--bg-border)', position: 'absolute', right: 0, top: 0, bottom: 0, width: 600, maxWidth: '100%', background: 'var(--bg-surface)', zIndex: 10, boxShadow: 'var(--shadow-xl)', display: 'flex', flexDirection: 'column' }}>
            <div className="seq-builder-header" style={{ padding: '32px 40px 24px', borderBottom: '1px solid var(--bg-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, letterSpacing: '-0.5px' }}>Create Workflow</h2>
                  <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Configure a new automated outreach campaign.</p>
                </div>
                <button style={{ background: 'var(--bg-hover)', border: 'none', width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)' }} onClick={() => setIsAdding(false)}><X size={18}/></button>
              </div>
            </div>

            <form onSubmit={handleAdd} style={{ flex: 1, overflowY: 'auto', padding: '32px 40px', display: 'flex', flexDirection: 'column', gap: 32 }}>
              {error && (
                <div style={{ padding: 16, borderRadius: 8, background: 'var(--danger-glow)', color: 'var(--danger)', fontSize: 13, display: 'flex', gap: 8, alignItems: 'center' }}>
                  <X size={16} /> {error}
                </div>
              )}

              {/* Template Selection */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)', marginBottom: 16 }}>Select Framework</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  
                  {/* AI Generator Card */}
                  <div 
                    onClick={() => setFormData({...formData, template: 'Generate with AI', name: 'Generate with AI'})}
                    style={{ padding: 20, borderRadius: 12, border: formData.template === 'Generate with AI' ? '2px solid var(--accent-indigo)' : '1px solid var(--border-color)', background: formData.template === 'Generate with AI' ? '#f5f3ff' : 'var(--bg-surface)', cursor: 'pointer', transition: 'all 0.2s', position: 'relative', overflow: 'hidden' }}
                  >
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--accent-indigo)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                      <Sparkles size={20} />
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>AI Campaign Generator</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>Let Huntlo AI build a hyper-personalized workflow for your persona.</div>
                  </div>

                  {/* Blank Card */}
                  <div 
                    onClick={() => setFormData({...formData, template: 'Blank Sequence', name: ''})}
                    style={{ padding: 20, borderRadius: 12, border: formData.template === 'Blank Sequence' ? '2px solid var(--accent-blue)' : '1px solid var(--border-color)', background: formData.template === 'Blank Sequence' ? 'var(--accent-blue-muted)' : 'var(--bg-surface)', cursor: 'pointer', transition: 'all 0.2s' }}
                  >
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--bg-hover)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                      <FileText size={20} />
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>Start from Scratch</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>Build your own custom multi-channel workflow step-by-step.</div>
                  </div>

                </div>

                <div style={{ marginTop: 24 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 8 }}>Or choose a proven SaaS framework:</label>
                  <select className="input-base" style={{ background: 'var(--bg-hover)', border: 'none', padding: '12px 16px', borderRadius: 8, fontSize: 14, color: 'var(--text-primary)', width: '100%', outline: 'none', cursor: 'pointer' }} value={formData.template} onChange={e => {
                    const val = e.target.value;
                    setFormData({...formData, template: val, name: val !== 'Blank Sequence' && val !== 'Generate with AI' ? val : formData.name});
                  }}>
                    <option value="" disabled>Select a proven framework...</option>
                    {TEMPLATES.filter(t => t !== 'Blank Sequence' && t !== 'Generate with AI').map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              {/* Dynamic Inputs */}
              {formData.template === 'Generate with AI' ? (
                <div style={{ padding: 24, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
                      <Users size={14} color="var(--accent-indigo)" /> Target Persona
                    </label>
                    <input className="input-base" style={{ background: '#fff', border: '1px solid #cbd5e1', padding: '12px 16px', borderRadius: 8, fontSize: 14 }} autoFocus required value={formData.persona || ''} onChange={e => setFormData({...formData, persona: e.target.value})} placeholder="e.g. VP of Engineering" />
                  </div>
                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
                      <Activity size={14} color="var(--accent-indigo)" /> Key Pain Point / Value Prop
                    </label>
                    <textarea className="input-base" style={{ background: '#fff', border: '1px solid #cbd5e1', padding: '12px 16px', borderRadius: 8, fontSize: 14, resize: 'vertical', minHeight: 80 }} required rows={3} value={formData.painPoint || ''} onChange={e => setFormData({...formData, painPoint: e.target.value})} placeholder="e.g. Reducing cloud costs and improving deployment speeds" />
                  </div>
                </div>
              ) : (
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)', marginBottom: 12 }}>Sequence Name *</label>
                  <input className="input-base" style={{ padding: '12px 16px', borderRadius: 8, fontSize: 14, background: 'var(--bg-surface)' }} autoFocus required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Outbound Q3 Founders" />
                </div>
              )}

              {/* Channel Toggles */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)', marginBottom: 12 }}>Primary Channel</label>
                <div style={{ display: 'flex', gap: 12, background: 'var(--bg-hover)', padding: 4, borderRadius: 10 }}>
                  {['Email', 'LinkedIn', 'Multi-channel'].map(channel => (
                    <div 
                      key={channel}
                      onClick={() => setFormData({...formData, channel})}
                      style={{ flex: 1, padding: '10px 0', textAlign: 'center', borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s', background: formData.channel === channel ? 'var(--bg-surface)' : 'transparent', color: formData.channel === channel ? 'var(--text-primary)' : 'var(--text-secondary)', boxShadow: formData.channel === channel ? '0 2px 4px rgba(0,0,0,0.05)' : 'none' }}
                    >
                      {channel === 'Email' ? 'Email Only' : channel}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 16, marginTop: 'auto', paddingTop: 24, borderTop: '1px solid var(--border-color)' }}>
                <button type="button" style={{ flex: 1, padding: '14px 0', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer' }} onClick={() => setIsAdding(false)} disabled={isGenerating}>Cancel</button>
                <button type="submit" style={{ flex: 2, padding: '14px 0', background: formData.template === 'Generate with AI' ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' : 'var(--accent-blue)', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} disabled={isGenerating}>
                  {isGenerating ? (
                    <><RefreshCw size={16} className="spin" /> Generating Magic...</>
                  ) : formData.template === 'Generate with AI' ? (
                    <><Sparkles size={16} /> Generate AI Campaign</>
                  ) : (
                    'Create Workflow'
                  )}
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
