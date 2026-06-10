import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Star, Share, Zap, MoreHorizontal, ChevronUp, ChevronRight, RefreshCw, Monitor, Smartphone, Check, X, Sparkles, Filter, Plus, Trash2, AlertTriangle } from 'lucide-react';
import useDataStore from '../../store/useDataStore';
import { parseTemplate } from '../../utils/personalization';
import { useDialog } from '../../context/DialogContext';
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

// ── Add Contacts Modal ─────────────────────────
function AddContactsModal({ onClose, onEnroll, leads }) {
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [isEnrolling, setIsEnrolling] = useState(false);

  const toggleLead = (id) => {
    if (selectedLeads.includes(id)) {
      setSelectedLeads(selectedLeads.filter(l => l !== id));
    } else {
      setSelectedLeads([...selectedLeads, id]);
    }
  };

  const handleEnroll = async () => {
    if (selectedLeads.length === 0) return;
    setIsEnrolling(true);
    await onEnroll(selectedLeads);
    setIsEnrolling(false);
    onClose();
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 12, padding: 24, width: 600, maxWidth: '90%', maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-xl)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 18, color: 'var(--text-primary)', fontWeight: 600 }}>Add Contacts to Sequence</h3>
          <X size={20} color="var(--text-secondary)" style={{ cursor: 'pointer' }} onClick={onClose} />
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: 8, marginBottom: 16, background: 'var(--bg-body)' }}>
          {leads.map(lead => (
            <div key={lead.id} onClick={() => toggleLead(lead.id)} style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid var(--border-color)', cursor: 'pointer', background: selectedLeads.includes(lead.id) ? 'var(--warning-glow)' : 'transparent' }}>
              <input type="checkbox" checked={selectedLeads.includes(lead.id)} readOnly style={{ accentColor: 'var(--warning)' }} />
              <div>
                <div style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 500 }}>{lead.name || lead.contact_name}</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{lead.company_name} • {lead.email}</div>
              </div>
            </div>
          ))}
          {leads.length === 0 && <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-secondary)' }}>No contacts found in CRM.</div>}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{selectedLeads.length} contacts selected</span>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn-dark" onClick={onClose}>Cancel</button>
            <button className="btn-yellow" disabled={selectedLeads.length === 0 || isEnrolling} onClick={handleEnroll}>
              {isEnrolling ? 'Enrolling...' : 'Enroll Contacts'}
            </button>
          </div>
        </div>
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
              <div style={{ position: 'absolute', right: 0, top: 24, background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 8, padding: 4, zIndex: 10, boxShadow: 'var(--shadow-md)' }}>
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
        <EyeIcon size={16} style={{ cursor: 'pointer', color: 'var(--text-secondary)' }} />
        <SettingsIcon size={16} style={{ cursor: 'pointer', color: 'var(--text-secondary)' }} />
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
              <label style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>Select contact</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <select className="dark-input" value={selectedLeadId} onChange={e => setSelectedLeadId(e.target.value)}>
                  {availableLeads.map(l => (
                    <option key={l.id} value={l.id}>{l.name || l.contact_name} ({l.company_name})</option>
                  ))}
                </select>
                <div style={{ padding: '8px', background: 'var(--bg-hover)', borderRadius: 6, display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <Filter size={16} color="var(--text-secondary)" />
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
  const { updateSequence, leads, fetchEmailSettings } = useDataStore();
  const { showConfirm } = useDialog();
  const navigate = useNavigate();
  const [nodes, setNodes] = useState(sequence.nodes || []);
  const [showAIPopup, setShowAIPopup] = useState(true);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showAddContacts, setShowAddContacts] = useState(false);
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
      const confirmed = await showConfirm(
        'Update Active Campaign',
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

  const handleToggleActive = async () => {
    if (!isActive) {
      // Trying to activate, pre-flight check
      const settings = await fetchEmailSettings();
      if (!settings || !settings.smtp_user) {
        setShowEmailModal(true);
        return;
      }
    }
    const newStatus = !isActive;
    setIsActive(newStatus);
    handleSave(nodes, newStatus ? 'Active' : 'Draft');
  };

  const handleEnrollContacts = async (leadIds) => {
    try {
      // useDataStore function enrollLeadsInSequence is already implemented
      await useDataStore.getState().enrollLeadsInSequence({
        sequenceId: sequence.id,
        leadIds: leadIds,
        config: {}
      });
      // Optionally show a success toast here
    } catch (err) {
      console.error('Failed to enroll contacts:', err);
    }
  };

  return (
    <div className="seq-editor-page">
      {/* Top Header */}
      <div className="seq-editor-header">
        <div className="seq-header-left">
          <button className="btn-dark" onClick={onBack} style={{ padding: '6px' }}><ArrowLeft size={16} /></button>
          <div style={{ color: 'var(--text-secondary)', fontSize: 13, marginRight: 4, fontWeight: 500 }}>Sequences &gt;</div>
          <h2 className="seq-header-title">
            {sequence.name} <Star size={16} className="seq-header-title-icon" />
          </h2>
        </div>
        <div className="seq-header-right">
          <button className="btn-dark"><Share size={14} /> Share</button>
          <button className="btn-dark"><Zap size={14} /> Workflows 0 <ChevronUp size={12} style={{ transform: 'rotate(180deg)' }} /></button>
          <button className="btn-yellow" onClick={() => setShowAddContacts(true)}>Add Contacts</button>
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
        {activeTab === 'Editor' && (
          <>
        
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
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', width: 40, textAlign: 'center', borderRadius: 6, outline: 'none' }}
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
        </>
        )}

        {activeTab === 'Overview' && (
          <div style={{ padding: 40, maxWidth: 1000, margin: '0 auto' }}>
            <h2 style={{ color: 'var(--text-primary)', marginBottom: 32, fontSize: 24, fontWeight: 700 }}>Campaign Overview</h2>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 40, background: 'var(--bg-elevated)', padding: 32, borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid var(--border-color)' }}>
              
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, fontWeight: 600 }}>Enrolled</div>
                <div style={{ fontSize: 42, fontWeight: 800, color: 'var(--text-primary)' }}>{sequence.enrolled || 0}</div>
              </div>
              <ChevronRight size={32} color="var(--border-color)" />
              
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, fontWeight: 600 }}>Active</div>
                <div style={{ fontSize: 42, fontWeight: 800, color: 'var(--text-primary)' }}>{isActive ? sequence.enrolled || 0 : 0}</div>
              </div>
              <ChevronRight size={32} color="var(--border-color)" />

              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, fontWeight: 600 }}>Bounced</div>
                <div style={{ fontSize: 42, fontWeight: 800, color: 'var(--danger)' }}>0%</div>
              </div>
              <ChevronRight size={32} color="var(--border-color)" />

              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, fontWeight: 600 }}>Reply Rate</div>
                <div style={{ fontSize: 42, fontWeight: 800, color: 'var(--success)' }}>{sequence.reply_rate || 0}%</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
              <div style={{ background: 'var(--bg-elevated)', borderRadius: 12, padding: 24, border: '1px solid var(--border-color)' }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>Recent Activity</h3>
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-tertiary)' }}>
                  {isActive ? 'Campaign is warming up. Activity will appear here soon.' : 'Activate the campaign to start logging activity.'}
                </div>
              </div>
              <div style={{ background: 'var(--bg-elevated)', borderRadius: 12, padding: 24, border: '1px solid var(--border-color)' }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>Sequence Health</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)' }}></div>
                  <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Deliverability: Excellent</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)' }}></div>
                  <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Spam Score: Safe</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Contacts' && (
          <div style={{ padding: 40, maxWidth: 1000, margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ color: 'var(--text-primary)', fontSize: 24, fontWeight: 700 }}>Enrolled Contacts</h2>
              <button className="btn-yellow" onClick={() => setShowAddContacts(true)}><Plus size={14} style={{ marginRight: 6 }}/> Add Contacts</button>
            </div>
            <div className="seq-card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-tertiary)', background: 'var(--bg-elevated)', borderRadius: 12, border: '1px solid var(--border-color)' }}>
              No contacts enrolled in this sequence yet.
            </div>
          </div>
        )}

        {activeTab === 'Settings' && (
          <div style={{ padding: 40, maxWidth: 800, margin: '0 auto' }}>
            <h2 style={{ color: 'var(--text-primary)', fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Sequence Settings</h2>
            <div style={{ padding: 32, background: 'var(--bg-elevated)', borderRadius: 12, border: '1px solid var(--border-color)' }}>
              <div className="editor-field" style={{ marginBottom: 24 }}>
                <label style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Sequence Name</label>
                <input className="input-base" value={sequence.name} readOnly style={{ marginTop: 8 }} />
              </div>
              <div className="editor-field" style={{ marginBottom: 24 }}>
                <label style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Sending Schedule</label>
                <select className="input-base" style={{ marginTop: 8 }}>
                  <option>Weekdays 9:00 AM - 5:00 PM</option>
                  <option>Everyday 9:00 AM - 5:00 PM</option>
                </select>
              </div>
            </div>
          </div>
        )}

      </div>

      {showAIPopup && <AIPopup onClose={() => setShowAIPopup(false)} />}
      
      {showAddContacts && (
        <AddContactsModal 
          onClose={() => setShowAddContacts(false)} 
          onEnroll={handleEnrollContacts} 
          leads={leads} 
        />
      )}
      
      {showEmailModal && (
        <InlineEmailConfigModal 
          onClose={() => setShowEmailModal(false)} 
          onSuccess={() => {
            setShowEmailModal(false);
            const newStatus = !isActive;
            setIsActive(newStatus);
            handleSave(nodes, newStatus ? 'Active' : 'Draft');
          }}
        />
      )}
    </div>
  );
}

// ── Inline Email Config Modal ─────────────────────────
function InlineEmailConfigModal({ onClose, onSuccess }) {
  const { saveEmailSettings } = useDataStore();
  const [formData, setFormData] = useState({ smtp_host: 'smtp.gmail.com', smtp_port: 587, smtp_user: '', smtp_pass: '' });
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async () => {
    if (!formData.smtp_user || !formData.smtp_pass) return;
    setIsSaving(true);
    try {
      await saveEmailSettings(formData);
      onSuccess();
    } catch (err) {
      console.error(err);
      setIsSaving(false);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
      <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', borderRadius: 16, padding: 32, width: 500, maxWidth: '90%', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div style={{ padding: 12, background: 'rgba(234, 179, 8, 0.1)', borderRadius: '50%' }}>
            <Mail color="#eab308" size={24} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>Connect Mailbox</h3>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Required to activate campaigns</div>
          </div>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>Email Address</label>
            <input className="input-base" placeholder="you@company.com" value={formData.smtp_user} onChange={e => setFormData({...formData, smtp_user: e.target.value})} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>App Password</label>
            <input className="input-base" type="password" placeholder="••••••••••••" value={formData.smtp_pass} onChange={e => setFormData({...formData, smtp_pass: e.target.value})} />
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>SMTP Host</label>
              <input className="input-base" value={formData.smtp_host} onChange={e => setFormData({...formData, smtp_host: e.target.value})} />
            </div>
            <div style={{ width: 100 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>Port</label>
              <input className="input-base" type="number" value={formData.smtp_port} onChange={e => setFormData({...formData, smtp_port: parseInt(e.target.value)})} />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button className="btn-white" onClick={onClose}>Cancel</button>
          <button className="btn-yellow" disabled={isSaving || !formData.smtp_user || !formData.smtp_pass} onClick={handleSubmit} style={{ padding: '8px 20px' }}>
            {isSaving ? 'Connecting...' : 'Connect & Activate'}
          </button>
        </div>
      </div>
    </div>
  );
}
