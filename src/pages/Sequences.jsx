import { useState } from 'react';
import { Search, Plus, Play, Pause, GitMerge, Mail, Globe, Clock, X, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useDataStore from '../store/useDataStore';
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
  const { sequences, createSequence } = useDataStore();
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({ name: '', channel: 'Email', template: 'Blank Sequence' });
  const [error, setError] = useState(null);

  const TEMPLATES = [
    "Blank Sequence",
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
      const nodesToUse = TEMPLATE_DATA[formData.template] || [];
      const newSeq = await createSequence({
        name: formData.name,
        channel: formData.channel,
        status: 'inactive',
        steps: nodesToUse.length,
        enrolled: 0,
        reply_rate: 0,
        nodes: nodesToUse
      });
      setIsAdding(false);
      setSelected(newSeq);
      setFormData({ name: '', channel: 'Email', template: 'Blank Sequence' });
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to create sequence.');
    }
  };

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
              >
                <div className="seq-list-top">
                  <span className="seq-list-name">{seq.name}</span>
                  {seq.status === 'active' ? <Play size={12} color="var(--success)" /> : <Pause size={12} color="var(--text-tertiary)" />}
                </div>
                <div className="seq-list-meta">
                  <span>{seq.steps || 0} steps</span>
                  <span>•</span>
                  <span>{seq.enrolled || 0} enrolled</span>
                  <span>•</span>
                  <span style={{ color: 'var(--accent-blue)' }}>{seq.reply_rate || 0}% reply</span>
                </div>
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
                  setFormData({...formData, template: val, name: val !== 'Blank Sequence' ? val : formData.name});
                }} style={{ background: 'var(--bg-body)' }}>
                  {TEMPLATES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="label" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)' }}>Primary Channel</label>
                <select className="input-base" value={formData.channel} onChange={e => setFormData({...formData, channel: e.target.value})} style={{ background: 'var(--bg-body)' }}>
                  <option value="Multi-channel">Multi-channel</option>
                  <option value="Email">Email Only</option>
                  <option value="LinkedIn">LinkedIn Only</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                <button type="button" className="btn btn-ghost w-full" onClick={() => setIsAdding(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary w-full">Create Workflow</button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
