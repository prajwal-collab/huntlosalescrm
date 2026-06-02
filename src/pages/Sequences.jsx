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
  const { sequences, createSequence, updateSequence } = useDataStore();
  const navigate = useNavigate();
  const [selected, setSelected] = useState(sequences[0] || null);
  const [isAdding, setIsAdding] = useState(false);
  const [isNodeModalOpen, setIsNodeModalOpen] = useState(false);
  const [nodeFormData, setNodeFormData] = useState({ type: 'email', day: 1, subject: '', content: '', label: '' });
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
      { id: '1', type: 'email', day: 1, subject: 'Quick feedback on your workflow?', content: 'Hi {{first_name}}, would love to get your thoughts on a new design.' },
      { id: '2', type: 'delay', label: 'Wait 3 Days' },
      { id: '3', type: 'email', day: 4, subject: 'Following up - Demo?', content: 'Let me show you what we built based on similar feedback.' },
      { id: '4', type: 'delay', label: 'Wait 2 Days' },
      { id: '5', type: 'linkedin', day: 6, subject: 'Connection Request', content: 'Connecting to share updates on the Design Partner program.' }
    ],
    "FLOW 2 — RECRUITER WORKFLOW AUDIT": [
      { id: '1', type: 'email', day: 1, subject: 'Your recruiting workflow', content: 'Hi {{first_name}}, how are you currently managing outbound sourcing?' },
      { id: '2', type: 'delay', label: 'Wait 2 Days' },
      { id: '3', type: 'email', day: 3, subject: 'Audit template', content: 'Here is a free template we use to audit recruiting workflows.' },
    ],
    "FLOW 3 — THE CONTRARIAN CAMPAIGN": [
      { id: '1', type: 'linkedin', day: 1, subject: 'Profile view & connect', content: 'Loved your post about sales strategies.' },
      { id: '2', type: 'delay', label: 'Wait 1 Day' },
      { id: '3', type: 'email', day: 2, subject: 'Unpopular opinion on outbound', content: 'Most people think volume is key. We think differently.' },
      { id: '4', type: 'delay', label: 'Wait 3 Days' },
      { id: '5', type: 'email', day: 5, subject: 'Any thoughts?', content: 'Curious if you agree with the approach.' },
    ],
    "FLOW 4 — THE DESIGN PARTNER PROGRAM": [
      { id: '1', type: 'email', day: 1, subject: 'Exclusive invite: Design Partner', content: 'We are looking for 5 forward-thinking companies to shape our product.' },
      { id: '2', type: 'delay', label: 'Wait 2 Days' },
      { id: '3', type: 'linkedin', day: 3, subject: 'Checking in', content: 'Sent you an email about our design partner program.' },
    ],
    "FLOW 5 — THE MARKET INSIGHT SERIES": [
      { id: '1', type: 'email', day: 1, subject: 'New insights on Q3 sales trends', content: 'We just analyzed 1M+ emails. Here is what works.' },
      { id: '2', type: 'delay', label: 'Wait 4 Days' },
      { id: '3', type: 'email', day: 5, subject: 'Part 2: The Follow-Up Strategy', content: 'Following up on the Q3 insights.' },
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

  const handleAddNode = async (e) => {
    e.preventDefault();
    if (!selected) return;
    try {
      const newNode = {
        id: Date.now().toString(),
        type: nodeFormData.type,
        day: nodeFormData.day,
        subject: nodeFormData.subject,
        content: nodeFormData.content,
        label: nodeFormData.type === 'delay' ? `Wait ${nodeFormData.day} Days` : ''
      };
      const updatedNodes = [...(selected.nodes || []), newNode];
      const updatedSeq = await updateSequence(selected.id, { nodes: updatedNodes, steps: updatedNodes.length });
      setSelected(updatedSeq);
      setIsNodeModalOpen(false);
      setNodeFormData({ type: 'email', day: 1, subject: '', content: '', label: '' });
    } catch (err) {
      console.error(err);
      alert('Failed to add node: ' + err.message);
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

        {selected && !isAdding && (
          <div className="sequence-builder animate-fade-in">
            <div className="seq-builder-header">
               <div>
                 <h2 className="seq-builder-title">{selected.name}</h2>
                 <div className="seq-builder-stats">
                   <span className="badge badge-gray">{selected.channel}</span>
                   <span>{selected.enrolled || 0} currently enrolled</span>
                   <span>{selected.reply_rate || 0}% reply rate</span>
                 </div>
               </div>
               <div style={{ display: 'flex', gap: 8 }}>
                 <button className="btn btn-ghost btn-sm" onClick={() => setIsNodeModalOpen(true)}>Add Step</button>
                 <button className="btn btn-primary btn-sm" onClick={() => navigate('/leads')}>Add Prospects</button>
               </div>
            </div>

            <div className="seq-canvas">
              {(selected.nodes || []).length > 0 ? (
                <div className="seq-flow">
                  {selected.nodes.map((node, i) => (
                    <SequenceNode key={node.id || i} node={node} isLast={i === selected.nodes.length - 1} />
                  ))}
                  <button className="add-node-btn" onClick={() => setIsNodeModalOpen(true)}><Plus size={16} /></button>
                </div>
              ) : (
                <div className="empty-state">
                  <GitMerge size={32} />
                  <h3>Empty Sequence</h3>
                  <p>Start building your automated workflow</p>
                  <button className="btn btn-primary btn-sm" style={{ marginTop: 12 }} onClick={() => setIsNodeModalOpen(true)}>Add First Step</button>
                </div>
              )}
            </div>
          </div>
        )}

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

        {isNodeModalOpen && (
          <div className="sequence-builder animate-slide-right" style={{ borderLeft: '1px solid var(--bg-border)', position: 'absolute', right: 0, top: 0, bottom: 0, width: 400, background: 'var(--bg-surface)', zIndex: 10, boxShadow: 'var(--shadow-lg)' }}>
            <div className="seq-builder-header" style={{ marginBottom: 24, padding: 24, borderBottom: '1px solid var(--bg-border)' }}>
              <h2 className="panel-title">Add Step</h2>
              <button className="drawer-close" style={{ position: 'absolute', top: 24, right: 24 }} onClick={() => setIsNodeModalOpen(false)}><X size={16}/></button>
            </div>
            <form onSubmit={handleAddNode} style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '0 24px' }}>
              <div className="form-group">
                <label className="label">Step Type</label>
                <select className="input-base" value={nodeFormData.type} onChange={e => setNodeFormData({...nodeFormData, type: e.target.value})}>
                  <option value="email">Email</option>
                  <option value="linkedin">LinkedIn Message</option>
                  <option value="delay">Time Delay</option>
                </select>
              </div>

              {nodeFormData.type !== 'delay' ? (
                <>
                  <div className="form-group">
                    <label className="label">Subject / Title</label>
                    <input className="input-base" autoFocus required value={nodeFormData.subject} onChange={e => setNodeFormData({...nodeFormData, subject: e.target.value})} placeholder="Message Subject" />
                  </div>
                  <div className="form-group">
                    <label className="label">Message Content</label>
                    <textarea className="input-base" required rows={4} value={nodeFormData.content} onChange={e => setNodeFormData({...nodeFormData, content: e.target.value})} placeholder="Hi {{first_name}}..." style={{ resize: 'vertical' }} />
                  </div>
                </>
              ) : (
                <div className="form-group">
                  <label className="label">Wait For (Days)</label>
                  <input className="input-base" type="number" min="1" required value={nodeFormData.day} onChange={e => setNodeFormData({...nodeFormData, day: parseInt(e.target.value) || 1})} />
                </div>
              )}

              <button type="submit" className="btn btn-primary btn-md w-full" style={{ marginTop: 8 }}><Save size={14} style={{ marginRight: 6 }}/> Save Step</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
