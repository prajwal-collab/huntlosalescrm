import { useState, useEffect } from 'react';
import { ArrowLeft, Mail, Star, Share, Zap, MoreHorizontal, ChevronUp, RefreshCw, Monitor, Smartphone, Check, X, Sparkles, Filter, Plus, Trash2 } from 'lucide-react';
import useDataStore from '../../store/useDataStore';
import { parseTemplate } from '../../utils/personalization';
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
function DualPaneCard({ node, index, updateNode, deleteNode, leads }) {
  const [activeTest, setActiveTest] = useState('Test A');
  const [editorTab, setEditorTab] = useState('Template');
  const [isActive, setIsActive] = useState(true);
  const [showOptions, setShowOptions] = useState(false);

  // Default to first lead or fallback mock
  const fallbackLead = { id: 'mock', name: 'Sankaranarayanan V', company_name: 'Acme Corp', email: 'sankar@acme.co' };
  const availableLeads = leads && leads.length > 0 ? leads : [fallbackLead];
  const [selectedLeadId, setSelectedLeadId] = useState(availableLeads[0].id);

  const previewLead = availableLeads.find(l => l.id === selectedLeadId) || fallbackLead;

  // Render variables safely
  const renderedSubject = parseTemplate(node.subject || '', previewLead);
  const renderedContent = parseTemplate(node.content || '', previewLead);

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
            <ClockIcon size={14} /> Send email {node.day === 0 ? 'immediately' : `in ${node.day} days`}
          </div>
          <div style={{ position: 'relative' }}>
            <MoreHorizontal size={16} style={{ cursor: 'pointer' }} onClick={() => setShowOptions(!showOptions)} />
            {showOptions && (
              <div style={{ position: 'absolute', right: 0, top: 24, background: '#1e1e1e', border: '1px solid #333', borderRadius: 4, padding: 4, zIndex: 10 }}>
                <button 
                  className="btn-dark" 
                  style={{ color: '#ef4444', border: 'none', width: '100%', justifyContent: 'flex-start' }}
                  onClick={() => deleteNode(node.id)}
                >
                  <Trash2 size={14} /> Delete step
                </button>
              </div>
            )}
          </div>
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
                placeholder="Enter subject here..."
              />
            </div>
            <div className="editor-field" style={{ flex: 1 }}>
              <label>Type</label>
              <select className="dark-input" value={node.type} onChange={e => updateNode(node.id, { type: e.target.value })}>
                <option value="email">New thread</option>
                <option value="reply">Reply</option>
              </select>
            </div>
          </div>

          <textarea 
            className="dark-textarea"
            value={node.content || ''}
            onChange={e => updateNode(node.id, { content: e.target.value })}
            placeholder="Type your message... Use {{FirstName}}, {{CompanyName}} etc."
          />
        </div>

        {/* Preview Pane */}
        <div className="seq-preview-pane">
          <div className="preview-header">Generate preview for contact</div>
          
          <div className="preview-controls">
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, color: '#9ca3af' }}>Select contact</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <select className="dark-input" value={selectedLeadId} onChange={e => setSelectedLeadId(e.target.value)}>
                  {availableLeads.map(l => (
                    <option key={l.id} value={l.id}>{l.name || l.contact_name} ({l.company_name})</option>
                  ))}
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
                <span>{previewLead.email || 'No email set'}</span>
              </div>
              <div className="preview-meta-row">
                <span className="preview-meta-lbl">Subject:</span>
                <span>{renderedSubject || 'Welcome to Huntlo'}</span>
              </div>
            </div>
            <div style={{ whiteSpace: 'pre-wrap' }}>
              {renderedContent || 'Preview content will appear here...'}
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
  const { updateSequence, leads } = useDataStore();
  const [nodes, setNodes] = useState(sequence.nodes || []);
  const [showAIPopup, setShowAIPopup] = useState(true);
  const [activeTab, setActiveTab] = useState('Editor');
  const [isActive, setIsActive] = useState(sequence.status === 'Active');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!sequence.nodes || sequence.nodes.length === 0) {
      setNodes([
        { id: '1', type: 'email', day: 0, subject: '{{company_name}} <> <insert your company name>', content: 'Hey {{first_name}},\n\nI was doing some research about {{company_name}} because I think you fall within the exact profile of companies that we can drive high value for.' },
        { id: '2', type: 'reply', day: 3, subject: 'Re: [previous email subject line]', content: 'Just bubbling this up to the top of your inbox.' }
      ]);
    } else {
      setNodes(sequence.nodes);
    }
  }, [sequence]);

  const handleUpdateNode = (id, updates) => {
    setNodes(nodes.map(n => n.id === id ? { ...n, ...updates } : n));
  };

  const handleDeleteNode = (id) => {
    setNodes(nodes.filter(n => n.id !== id));
  };

  const handleAddStep = () => {
    const lastDay = nodes.length > 0 ? nodes[nodes.length - 1].day : -3;
    const newNode = {
      id: Date.now().toString(),
      type: 'email',
      day: lastDay + 3,
      subject: '',
      content: ''
    };
    setNodes([...nodes, newNode]);
  };

  const handleSave = async (nodesToSave = nodes, statusToSave = isActive ? 'Active' : 'Draft') => {
    if (statusToSave === 'Active') {
      const confirmed = window.confirm(
        `Warning: This campaign is currently Active${sequence.enrolled > 0 ? ` with ${sequence.enrolled} enrolled contacts` : ''}.\n\nAny edits you save will immediately update the template for future touchpoints. Do you want to proceed?`
      );
      if (!confirmed) return;
    }
    
    setIsSaving(true);
    try {
      await updateSequence(sequence.id, { nodes: nodesToSave, steps: nodesToSave.length, status: statusToSave });
    } catch (err) {
      console.error('Failed to save sequence', err);
    }
    setTimeout(() => setIsSaving(false), 800);
  };

  const handleToggleActive = () => {
    const newStatus = !isActive;
    setIsActive(newStatus);
    handleSave(nodes, newStatus ? 'Active' : 'Draft');
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
          <div className="btn-dark" onClick={handleToggleActive}>
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
          <button className="btn-dark"><span style={{ transform: 'rotate(90deg)' }}><Zap size={14} /></span> {nodes.length} steps &gt;&gt;</button>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn-dark"><span style={{ display: 'flex', gap: 2 }}>▶|◀</span> Collapse steps</button>
            <button className="btn-white" onClick={() => handleSave(nodes)} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </div>

        {nodes.map((node, i) => (
          <div key={node.id} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* Delay Connector */}
            <div className="seq-delay-block">
              <div className="seq-delay-line" />
              <div className="seq-delay-controls">
                <ClockIcon size={14} /> Send email in
                <input 
                  type="number" 
                  value={node.day} 
                  onChange={e => handleUpdateNode(node.id, { day: parseInt(e.target.value) || 0 })}
                  style={{ background: 'transparent', border: '1px solid #404040', color: '#fff', width: 40, textAlign: 'center', borderRadius: 4, outline: 'none' }}
                /> 
                {node.day === 1 ? 'day' : 'days'}
                <SettingsIcon size={12} style={{ marginLeft: 4 }} />
              </div>
            </div>

            {/* Email Card */}
            <DualPaneCard node={node} index={i} updateNode={handleUpdateNode} deleteNode={handleDeleteNode} leads={leads} />
          </div>
        ))}

        <div style={{ marginTop: 40, paddingBottom: 40 }}>
          <button className="btn-dark" onClick={handleAddStep} style={{ padding: '8px 16px', borderRadius: 20 }}>
            <Plus size={16} /> Add Step
          </button>
        </div>
      </div>

      {showAIPopup && <AIPopup onClose={() => setShowAIPopup(false)} />}
    </div>
  );
}
