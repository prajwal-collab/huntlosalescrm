import { useState } from 'react';
import { Search, Plus, Play, Pause, GitMerge, Mail, Globe, Clock, X } from 'lucide-react';
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
  const [selected, setSelected] = useState(sequences[0] || null);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({ name: '', channel: 'Multi-channel' });

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!formData.name) return;
    try {
      const newSeq = await createSequence({
        name: formData.name,
        channel: formData.channel,
        status: 'inactive',
        steps: 0,
        enrolled: 0,
        reply_rate: 0,
        nodes: []
      });
      setIsAdding(false);
      setSelected(newSeq);
      setFormData({ name: '', channel: 'Multi-channel' });
    } catch (error) {
      console.error(error);
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
                 <button className="btn btn-ghost btn-sm" onClick={() => alert('Editor opening soon...')}>Edit Workflow</button>
                 <button className="btn btn-primary btn-sm" onClick={() => alert('Add prospects feature integrated.')}>Add Prospects</button>
               </div>
            </div>

            <div className="seq-canvas">
              {(selected.nodes || []).length > 0 ? (
                <div className="seq-flow">
                  {selected.nodes.map((node, i) => (
                    <SequenceNode key={node.id || i} node={node} isLast={i === selected.nodes.length - 1} />
                  ))}
                  <button className="add-node-btn" onClick={() => alert('Add node triggered')}><Plus size={16} /></button>
                </div>
              ) : (
                <div className="empty-state">
                  <GitMerge size={32} />
                  <h3>Empty Sequence</h3>
                  <p>Start building your automated workflow</p>
                  <button className="btn btn-primary btn-sm" style={{ marginTop: 12 }} onClick={() => alert('Node creation modal triggered')}>Add First Step</button>
                </div>
              )}
            </div>
          </div>
        )}

        {isAdding && (
          <div className="sequence-builder animate-fade-in">
            <div className="seq-builder-header" style={{ marginBottom: 24 }}>
              <h2 className="panel-title">Create Sequence</h2>
              <button className="drawer-close" style={{ position: 'absolute', top: 24, right: 24 }} onClick={() => setIsAdding(false)}><X size={16}/></button>
            </div>
            <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '0 24px' }}>
              <div className="form-group">
                <label className="label">Sequence Name</label>
                <input className="input-base" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Outbound Q3 Founders" />
              </div>
              <div className="form-group">
                <label className="label">Primary Channel</label>
                <select className="input-base" value={formData.channel} onChange={e => setFormData({...formData, channel: e.target.value})}>
                  <option value="Multi-channel">Multi-channel</option>
                  <option value="Email">Email Only</option>
                  <option value="LinkedIn">LinkedIn Only</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary btn-md w-full" style={{ marginTop: 8 }}>Create Workflow</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
