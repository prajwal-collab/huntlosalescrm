import { useState, useEffect } from 'react';
import { ArrowLeft, Mail, Clock, Trash2, Plus } from 'lucide-react';
import useDataStore from '../../store/useDataStore';
import './SequenceEditor.css';

const TAGS = ['{{FirstName}}', '{{LastName}}', '{{CompanyName}}', '{{JobTitle}}', '{{SenderName}}'];

function EmailCard({ node, index, updateNode, deleteNode }) {
  return (
    <div className="seq-card">
      <div className="seq-card-header">
        <div className="seq-card-title">
          <Mail size={16} /> Email <span className="seq-card-badge">Step {index + 1}</span>
        </div>
        <div className="seq-card-actions">
          <button className="btn btn-ghost btn-sm">Preview and test</button>
          <button className="btn btn-ghost btn-sm" onClick={() => deleteNode(node.id)} style={{ color: 'var(--danger)', padding: '4px 8px' }}>
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      <div className="seq-card-body">
        <div className="seq-field">
          <label>From</label>
          <select className="seq-input">
            <option>user@company.com</option>
          </select>
        </div>
        <div className="seq-field">
          <label>Subject</label>
          <input 
            className="seq-input" 
            value={node.subject || ''} 
            onChange={e => updateNode(node.id, { subject: e.target.value })} 
            placeholder="Email Subject" 
          />
        </div>
        <div className="seq-field">
          <label>Message</label>
          <textarea 
            className="seq-textarea" 
            value={node.content || ''} 
            onChange={e => updateNode(node.id, { content: e.target.value })}
            placeholder="Type your message here..."
          />
        </div>
        <div className="seq-tags">
          <span style={{ fontSize: 11, color: '#64748b', marginRight: 8, display: 'flex', alignItems: 'center' }}>Personalization</span>
          {TAGS.map(tag => (
            <div 
              key={tag} 
              className="seq-tag"
              onClick={() => updateNode(node.id, { content: (node.content || '') + ' ' + tag })}
            >
              {tag}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DelayBlock({ node, updateNode }) {
  return (
    <div className="seq-delay-block">
      <div className="seq-delay-line" />
      <div className="seq-delay-controls">
        Wait 
        <input 
          className="seq-delay-input" 
          value={node.day || 1} 
          onChange={e => updateNode(node.id, { day: parseInt(e.target.value) || 1 })} 
        /> 
        days Send @ 
        <input 
          className="seq-delay-input" 
          style={{ width: 70 }} 
          value={node.time || '09:00'} 
          onChange={e => updateNode(node.id, { time: e.target.value })}
          placeholder="09:00"
        />
        IST
      </div>
    </div>
  );
}

export default function SequenceEditor({ sequence, onBack }) {
  const { updateSequence } = useDataStore();
  const [nodes, setNodes] = useState(sequence.nodes || []);
  const [activeTab, setActiveTab] = useState('Editor');

  // To prevent the back button from rendering stale data if updated, but we handle it locally mostly
  useEffect(() => {
    setNodes(sequence.nodes || []);
  }, [sequence]);

  const handleUpdateNode = (id, updates) => {
    setNodes(nodes.map(n => n.id === id ? { ...n, ...updates } : n));
  };

  const handleDeleteNode = (id) => {
    setNodes(nodes.filter(n => n.id !== id));
  };

  const handleAddStep = () => {
    const newNode = {
      id: Date.now().toString(),
      type: 'email',
      day: 3,
      time: '09:00',
      subject: '',
      content: ''
    };
    setNodes([...nodes, newNode]);
  };

  const handleSave = async () => {
    try {
      await updateSequence(sequence.id, { nodes, steps: nodes.length });
      alert('Sequence saved successfully!');
    } catch (err) {
      alert('Failed to save sequence');
    }
  };

  return (
    <div className="seq-editor-page">
      <div className="seq-editor-header">
        <div className="seq-header-left">
          <button className="seq-back-btn" onClick={onBack}>
            <ArrowLeft size={18} />
          </button>
          <h2 className="seq-header-title">{sequence.name}</h2>
        </div>
        <div className="seq-header-tabs">
          {['Editor', 'Contacts', 'Emails', 'Activity', 'Report', 'Settings'].map(tab => (
            <button 
              key={tab} 
              className={`seq-tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="seq-header-right">
          <button className="btn btn-primary" onClick={handleSave}>Save sequence</button>
          <button className="btn btn-ghost" style={{ background: '#dbeafe', color: '#1b66f2' }}>Launch campaign</button>
        </div>
      </div>

      <div className="seq-editor-body">
        <div className="seq-editor-sidebar">
          <div className="seq-sidebar-title">SEQUENCE STEPS</div>
          <div className="seq-outline-list">
            {nodes.map((node, i) => (
              <div key={node.id} style={{ display: 'flex', flexDirection: 'column' }}>
                {i > 0 && (
                  <div className="seq-outline-delay">
                    {node.day} days later
                  </div>
                )}
                <div className="seq-outline-item">
                  <div className="seq-outline-header">
                    <Mail size={14} color="#1b66f2" /> {i === 0 ? 'Email' : 'Reply'}
                  </div>
                  <div className="seq-outline-meta">
                    {i === 0 ? 'Start immediately' : `Wait ${node.day} days, ${node.time || '09:00'}`}
                  </div>
                  <div className="seq-outline-snippet">
                    {node.subject || 'No subject'}
                  </div>
                </div>
              </div>
            ))}
            <button className="btn btn-ghost" style={{ marginTop: 16, color: '#1b66f2' }} onClick={handleAddStep}>
              <Plus size={14} /> Add step
            </button>
          </div>
        </div>

        <div className="seq-editor-canvas">
          <div className="seq-start-pill">
            Start immediately
          </div>
          
          {nodes.map((node, i) => (
            <div key={node.id} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {i > 0 && <DelayBlock node={node} updateNode={handleUpdateNode} />}
              <EmailCard node={node} index={i} updateNode={handleUpdateNode} deleteNode={handleDeleteNode} />
            </div>
          ))}

          {nodes.length === 0 && (
            <div style={{ padding: 40, color: '#64748b', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
              <p>No steps yet.</p>
              <button className="btn btn-primary" onClick={handleAddStep}><Plus size={14}/> Add First Step</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
