import { useState, useEffect } from 'react';
import { ArrowLeft, Mail, Star, Share, Zap, MoreHorizontal, ChevronUp, RefreshCw, Monitor, Smartphone, Check, X, Sparkles, Filter } from 'lucide-react';
import useDataStore from '../../store/useDataStore';
import './SequenceEditor.css';

// ── Floating AI Popup ─────────────────────────
function AIPopup({ onClose }) {
  return (
    <div className="ai-popup">
      <div className="ai-popup-icon"><Sparkles size={12} /></div>
      <span>This sequence has no contacts. Want me to find the right ones?</span>
      <div className="ai-popup-actions">
        <button className="ai-popup-btn" onClick={onClose}>OK</button>
        <button className="ai-popup-btn" onClick={onClose}><X size={12} /></button>
      </div>
    </div>
  );
}

// ── Dual Pane Email Card ──────────────────────
function DualPaneCard({ node, index, updateNode }) {
  const [activeTest, setActiveTest] = useState('Test A');
  const [editorTab, setEditorTab] = useState('Template');
  const [contactPreview, setContactPreview] = useState('Sankaranarayanan V');
  const [isActive, setIsActive] = useState(true);

  return (
    <div className="seq-card">
      <div className="seq-card-header">
        <div className="seq-card-header-left">
          <div className={`switch ${isActive ? 'on' : ''}`} onClick={() => setIsActive(!isActive)}></div>
          <Mail size={16} />
          <span>Step {index + 1}: Automatic email / {activeTest}</span>
        </div>
        <div className="seq-card-header-right">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <ClockIcon size={14} /> Send email in {node.day} days
          </div>
          <MoreHorizontal size={16} style={{ cursor: 'pointer' }} />
          <ChevronUp size={16} style={{ cursor: 'pointer' }} />
        </div>
      </div>

      <div className="seq-test-tabs">
        <div className={`test-tab ${activeTest === 'Test A' ? 'active' : ''}`} onClick={() => setActiveTest('Test A')}>
          Test A <span className="test-badge">Inactive</span>
        </div>
        <div className="test-tab" onClick={() => setActiveTest('Add test')}>
          + Add test
        </div>
        <div style={{ flex: 1 }} />
        <div className="btn-dark" style={{ border: 'none', background: 'transparent' }}>Check email <ChevronUp size={12} style={{ transform: 'rotate(180deg)' }} /></div>
        <EyeIcon size={16} style={{ cursor: 'pointer', color: '#9ca3af' }} />
        <SettingsIcon size={16} style={{ cursor: 'pointer', color: '#9ca3af' }} />
      </div>

      <div className="seq-card-body">
        {/* Editor Pane */}
        <div className="seq-editor-pane">
          <div className="editor-tabs">
            {['Assisted', 'Prompt', 'Template'].map(tab => (
              <div 
                key={tab} 
                className={`editor-tab ${editorTab === tab ? 'active' : ''}`}
                onClick={() => setEditorTab(tab)}
              >
                {tab}
              </div>
            ))}
          </div>

          <div className="editor-form-row">
            <div className="editor-field" style={{ flex: 2 }}>
              <label>Subject</label>
              <input 
                className="dark-input" 
                value={node.subject || ''}
                onChange={e => updateNode(node.id, { subject: e.target.value })}
                placeholder="{{company}} <> <insert your company name>"
              />
            </div>
            <div className="editor-field" style={{ flex: 1 }}>
              <label>Type</label>
              <select className="dark-input">
                <option>New thread</option>
                <option>Reply</option>
              </select>
            </div>
          </div>

          <textarea 
            className="dark-textarea"
            value={node.content || ''}
            onChange={e => updateNode(node.id, { content: e.target.value })}
            placeholder="Hey {{first_name}},\n\nI was doing some research about {{company}} because I think you fall within the exact profile..."
          />
        </div>

        {/* Preview Pane */}
        <div className="seq-preview-pane">
          <div className="preview-header">Generate preview for contact</div>
          
          <div className="preview-controls">
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, color: '#9ca3af' }}>Select contact</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <select className="dark-input" value={contactPreview} onChange={e => setContactPreview(e.target.value)}>
                  <option>{contactPreview}</option>
                  <option>Alex Reid</option>
                </select>
                <div style={{ padding: '8px', background: '#1e1e1e', borderRadius: 4, display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <Filter size={16} color="#9ca3af" />
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
              <button className="btn-dark"><RefreshCw size={14} /> Refresh</button>
              <button className="preview-icon-btn active"><Monitor size={16} /></button>
              <button className="preview-icon-btn"><Smartphone size={16} /></button>
            </div>
          </div>

          <div className="preview-window">
            <div className="preview-meta">
              <div className="preview-meta-row">
                <span className="preview-meta-lbl">To:</span>
                <span>{contactPreview}</span>
              </div>
              <div className="preview-meta-row">
                <span className="preview-meta-lbl">Subject:</span>
                <span>{node.subject ? node.subject.replace('{{company}}', 'Acme Corp') : 'Welcome to Huntlo'}</span>
              </div>
            </div>
            <div style={{ whiteSpace: 'pre-wrap' }}>
              {node.content 
                ? node.content.replace('{{first_name}}', contactPreview.split(' ')[0]).replace('{{company}}', 'Acme Corp') 
                : 'Preview content will appear here...'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Utility Icons (Mimicking screenshot) ──────
const ClockIcon = ({ size }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const EyeIcon = ({ size, style }) => <svg style={style} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
const SettingsIcon = ({ size, style }) => <svg style={style} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>;

// ── Main Page Component ───────────────────────
export default function SequenceEditor({ sequence, onBack }) {
  const { updateSequence } = useDataStore();
  const [nodes, setNodes] = useState(sequence.nodes || []);
  const [showAIPopup, setShowAIPopup] = useState(true);
  const [activeTab, setActiveTab] = useState('Editor');
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (!sequence.nodes || sequence.nodes.length === 0) {
      // Default to 2 nodes to mimic screenshots if empty
      setNodes([
        { id: '1', type: 'email', day: 0, subject: '{{company}} <> <insert your company name>', content: 'Hey {{first_name}},\n\nI was doing some research about {{company}} because I think you fall within the exact profile of companies that we can drive high value for.' },
        { id: '2', type: 'email', day: 3, subject: 'Re: [previous email subject line]', content: 'Just bubbling this up to the top of your inbox.' }
      ]);
    } else {
      setNodes(sequence.nodes);
    }
  }, [sequence]);

  const handleUpdateNode = (id, updates) => {
    setNodes(nodes.map(n => n.id === id ? { ...n, ...updates } : n));
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
      {/* Top Header */}
      <div className="seq-editor-header">
        <div className="seq-header-left">
          <button className="btn-dark" onClick={onBack} style={{ padding: '6px' }}><ArrowLeft size={16} /></button>
          <div style={{ color: '#9ca3af', fontSize: 13, marginRight: 4 }}>Sequences &gt;</div>
          <h2 className="seq-header-title">
            {sequence.name} <Star size={16} className="seq-header-title-icon" />
          </h2>
        </div>
        <div className="seq-header-right">
          <button className="btn-dark"><Share size={14} /> Share</button>
          <button className="btn-dark"><Zap size={14} /> Workflows 0 <ChevronUp size={12} style={{ transform: 'rotate(180deg)' }} /></button>
          <button className="btn-yellow">Add Contacts</button>
          <div className="btn-dark" onClick={() => setIsActive(!isActive)}>
            <div className={`switch ${isActive ? 'on' : ''}`} style={{ transform: 'scale(0.8)', margin: '-2px 0' }}></div>
            Activate
          </div>
          <button className="btn-dark" style={{ padding: '6px' }}><MoreHorizontal size={16} /></button>
        </div>
      </div>

      {/* Sub Header */}
      <div className="seq-editor-subheader">
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
      </div>

      {/* Main Canvas Area */}
      <div className="seq-editor-canvas">
        
        <div className="seq-action-bar">
          <button className="btn-dark"><span style={{ transform: 'rotate(90deg)' }}><Zap size={14} /></span> 4 steps &gt;&gt;</button>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn-dark"><span style={{ display: 'flex', gap: 2 }}>▶|◀</span> Collapse steps</button>
            <button className="btn-white" onClick={handleSave}>Save changes</button>
          </div>
        </div>

        {nodes.map((node, i) => (
          <div key={node.id} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* Delay Connector */}
            <div className="seq-delay-block">
              <div className="seq-delay-line" />
              <div className="seq-delay-controls">
                <ClockIcon size={14} /> Send email in {node.day === 0 ? '30 minutes' : `${node.day} days`}
                <SettingsIcon size={12} style={{ marginLeft: 4 }} />
              </div>
            </div>

            {/* Email Card */}
            <DualPaneCard node={node} index={i} updateNode={handleUpdateNode} />
          </div>
        ))}
      </div>

      {showAIPopup && <AIPopup onClose={() => setShowAIPopup(false)} />}
    </div>
  );
}
