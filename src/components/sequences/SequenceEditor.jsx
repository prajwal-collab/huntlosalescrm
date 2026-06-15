// ============================================
// HUNTLO — SEQUENCE EDITOR (Apollo-grade)
// Full-featured sequence builder with:
//  - Working Editor, Contacts, Emails, Activity, Report, Settings tabs
//  - Variable insertion toolbar
//  - Duplicate step
//  - Live char count
//  - Proper save/activate flow
// ============================================
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Mail, Star, Share, Zap, MoreHorizontal, ChevronUp,
  RefreshCw, Monitor, Smartphone, Check, X, Sparkles, Filter,
  Plus, Trash2, Copy, Clock, Users, Activity, BarChart2, Settings,
  AlertTriangle, CheckCircle2, Send
} from 'lucide-react';
import useDataStore from '../../store/useDataStore';
import { parseTemplate } from '../../utils/personalization';
import { useDialog } from '../../context/DialogContext';
import './SequenceEditor.css';

// ── Variable insertion tokens ──────────────────
const VARIABLES = [
  { label: '{{first_name}}', display: 'First Name' },
  { label: '{{last_name}}', display: 'Last Name' },
  { label: '{{company_name}}', display: 'Company' },
  { label: '{{designation}}', display: 'Title' },
  { label: '{{location}}', display: 'Location' },
  { label: '{{industry}}', display: 'Industry' },
];

// ── Floating AI Popup ──────────────────────────
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
  const [search, setSearch] = useState('');
  const [isEnrolling, setIsEnrolling] = useState(false);

  const filtered = leads.filter(l =>
    !search ||
    (l.company_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (l.contact_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (l.email || '').toLowerCase().includes(search.toLowerCase())
  );

  const toggleLead = (id) => {
    setSelectedLeads(prev => prev.includes(id) ? prev.filter(l => l !== id) : [...prev, id]);
  };

  const toggleAll = () => {
    if (selectedLeads.length === filtered.length) setSelectedLeads([]);
    else setSelectedLeads(filtered.map(l => l.id));
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
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 14, width: 620, maxWidth: '90%', maxHeight: '82vh', display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-xl)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid var(--border-color)' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, color: 'var(--text-primary)', fontWeight: 700 }}>Add Contacts to Sequence</h3>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-tertiary)' }}>Select leads from your CRM to enroll</p>
          </div>
          <X size={20} color="var(--text-secondary)" style={{ cursor: 'pointer' }} onClick={onClose} />
        </div>

        {/* Search + select all */}
        <div style={{ padding: '12px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: 12, alignItems: 'center' }}>
          <input
            placeholder="Search leads..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ flex: 1, padding: '8px 12px', background: 'var(--bg-base)', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: 13, color: 'var(--text-primary)', outline: 'none' }}
          />
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            <input type="checkbox" checked={filtered.length > 0 && selectedLeads.length === filtered.length} onChange={toggleAll} style={{ accentColor: 'var(--accent-blue)' }} />
            Select all
          </label>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg-body)' }}>
          {filtered.map(lead => (
            <div key={lead.id} onClick={() => toggleLead(lead.id)} style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid var(--border-color)', cursor: 'pointer', background: selectedLeads.includes(lead.id) ? 'var(--accent-blue-muted)' : 'transparent', transition: 'background 0.12s' }}>
              <input type="checkbox" checked={selectedLeads.includes(lead.id)} readOnly style={{ accentColor: 'var(--accent-blue)' }} />
              <div style={{ width: 32, height: 32, borderRadius: 8, background: '#3b82f6', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                {(lead.company_name || '?').charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.company_name || '—'}</div>
                <div style={{ color: 'var(--text-tertiary)', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.contact_name} {lead.email ? `· ${lead.email}` : '· No email'}</div>
              </div>
              {!lead.email && <span style={{ fontSize: 10, padding: '2px 6px', background: 'rgba(239,68,68,0.1)', color: '#dc2626', borderRadius: 4, fontWeight: 600 }}>No email</span>}
            </div>
          ))}
          {filtered.length === 0 && <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-tertiary)' }}>{search ? 'No leads match your search.' : 'No leads in your CRM yet.'}</div>}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderTop: '1px solid var(--border-color)', background: 'var(--bg-surface)' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{selectedLeads.length} contact{selectedLeads.length !== 1 ? 's' : ''} selected</span>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn-dark" onClick={onClose}>Cancel</button>
            <button className="btn-yellow" disabled={selectedLeads.length === 0 || isEnrolling} onClick={handleEnroll}>
              {isEnrolling ? 'Enrolling...' : `Enroll ${selectedLeads.length > 0 ? selectedLeads.length : ''} Contact${selectedLeads.length !== 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Dual Pane Email Card ──────────────────────
function DualPaneCard({ node, index, updateNode, deleteNode, duplicateNode, leads }) {
  const [activeTest, setActiveTest] = useState('Test A');
  const [isActive, setIsActive] = useState(true);
  const [showOptions, setShowOptions] = useState(false);
  const textareaRef = useRef(null);

  const availableLeads = leads && leads.length > 0 ? leads : [];
  const [selectedLeadId, setSelectedLeadId] = useState(availableLeads[0]?.id || '');
  const previewLead = availableLeads.find(l => l.id === selectedLeadId) || availableLeads[0] || { company_name: 'Acme Corp', contact_name: 'John', email: 'john@acme.co', first_name: 'John' };

  const renderedSubject = parseTemplate(node.subject || '', previewLead);
  const renderedContent = parseTemplate(node.content || '', previewLead);
  const charCount = (node.content || '').length;
  const wordCount = (node.content || '').trim().split(/\s+/).filter(Boolean).length;

  const insertVariable = (variable) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      updateNode(node.id, { content: (node.content || '') + variable });
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = node.content || '';
    const newText = text.substring(0, start) + variable + text.substring(end);
    updateNode(node.id, { content: newText });
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + variable.length, start + variable.length);
    }, 0);
  };

  return (
    <div className="seq-card">
      <div className="seq-card-header">
        <div className="seq-card-header-left">
          <div className={`switch ${isActive ? 'on' : ''}`} onClick={() => setIsActive(!isActive)}></div>
          <Mail size={16} />
          <span>Step {index + 1}: {node.type === 'reply' ? 'Reply thread' : 'New email'} / {activeTest}</span>
        </div>
        <div className="seq-card-header-right">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-tertiary)' }}>
            <ClockIcon size={14} /> Send in {node.day === 0 ? 'immediately' : `${node.day} day${node.day !== 1 ? 's' : ''}`}
          </div>
          <div style={{ position: 'relative' }}>
            <MoreHorizontal size={16} style={{ cursor: 'pointer' }} onClick={() => setShowOptions(!showOptions)} />
            {showOptions && (
              <div style={{ position: 'absolute', right: 0, top: 28, background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 8, padding: 4, zIndex: 10, boxShadow: 'var(--shadow-md)', minWidth: 160 }}>
                <button
                  className="btn-dark"
                  style={{ border: 'none', width: '100%', justifyContent: 'flex-start', gap: 8 }}
                  onClick={() => { duplicateNode(node.id); setShowOptions(false); }}
                >
                  <Copy size={13} /> Duplicate step
                </button>
                <button
                  className="btn-dark"
                  style={{ color: '#ef4444', border: 'none', width: '100%', justifyContent: 'flex-start', gap: 8 }}
                  onClick={() => { deleteNode(node.id); setShowOptions(false); }}
                >
                  <Trash2 size={13} /> Delete step
                </button>
              </div>
            )}
          </div>
          <ChevronUp size={16} style={{ cursor: 'pointer' }} />
        </div>
      </div>

      <div className="seq-test-tabs">
        <div className={`test-tab ${activeTest === 'Test A' ? 'active' : ''}`} onClick={() => setActiveTest('Test A')}>
          Test A <span className="test-badge">Active</span>
        </div>
        <div style={{ flex: 1 }} />
      </div>

      <div className="seq-card-body">
        {/* Editor Pane */}
        <div className="seq-editor-pane">
          <div className="editor-form-row">
            <div className="editor-field" style={{ flex: 2 }}>
              <label>Subject</label>
              <input
                className="dark-input"
                value={node.subject || ''}
                onChange={e => updateNode(node.id, { subject: e.target.value })}
                placeholder="Enter subject line..."
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

          {/* Variable insertion toolbar */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
            {VARIABLES.map(v => (
              <button
                key={v.label}
                onClick={() => insertVariable(v.label)}
                style={{ fontSize: 11, padding: '3px 8px', borderRadius: 20, border: '1px solid var(--border-color)', background: 'var(--bg-hover)', color: 'var(--accent-blue-dim)', cursor: 'pointer', fontWeight: 500, transition: 'all 0.15s' }}
                title={`Insert ${v.label}`}
              >
                + {v.display}
              </button>
            ))}
          </div>

          <textarea
            ref={textareaRef}
            className="dark-textarea"
            value={node.content || ''}
            onChange={e => updateNode(node.id, { content: e.target.value })}
            placeholder="Type your message... Use {{first_name}}, {{company_name}} etc."
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 16, padding: '4px 0', fontSize: 11, color: 'var(--text-tertiary)' }}>
            <span>{wordCount} words</span>
            <span>{charCount} chars</span>
          </div>
        </div>

        {/* Preview Pane */}
        <div className="seq-preview-pane">
          <div className="preview-header">Live preview</div>

          <div className="preview-controls">
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>Preview for</label>
              <select className="dark-input" value={selectedLeadId} onChange={e => setSelectedLeadId(e.target.value)}>
                {availableLeads.length === 0 && <option value="">No leads yet</option>}
                {availableLeads.map(l => (
                  <option key={l.id} value={l.id}>{l.contact_name || l.company_name} ({l.company_name})</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
              <button className="preview-icon-btn active"><Monitor size={16} /></button>
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
                <span style={{ fontWeight: 600 }}>{renderedSubject || '(no subject)'}</span>
              </div>
            </div>
            <div style={{ whiteSpace: 'pre-wrap', fontSize: 13, lineHeight: 1.7 }}>
              {renderedContent || <span style={{ color: 'var(--text-tertiary)', fontStyle: 'italic' }}>Preview will appear as you type...</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Utility Icons ──────────────────────────────
const ClockIcon = ({ size }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;

// ── Main Page Component ───────────────────────
export default function SequenceEditor({ sequence, onBack }) {
  const { updateSequence, leads, fetchEmailSettings } = useDataStore();
  const { showConfirm } = useDialog();
  const [nodes, setNodes] = useState(sequence.nodes || []);
  const [showAIPopup, setShowAIPopup] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showAddContacts, setShowAddContacts] = useState(false);
  const [activeTab, setActiveTab] = useState('Editor');
  const [isActive, setIsActive] = useState(sequence.status === 'Active' || sequence.status === 'active');
  const [isSaving, setIsSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);

  useEffect(() => {
    if (!sequence.nodes || sequence.nodes.length === 0) {
      setNodes([
        { id: '1', type: 'email', day: 0, subject: '{{company_name}} <> [Your Company]', content: 'Hey {{first_name}},\n\nI was doing some research about {{company_name}} and noticed that you fit the exact profile of companies we can drive high value for.\n\nWould love to show you what we\'ve been building.\n\nWorth 15 minutes?' },
        { id: '2', type: 'reply', day: 3, subject: '', content: 'Just bumping this up — want to make sure it doesn\'t get lost in your inbox.\n\nHappy to share a quick 2-min demo video if that\'s easier.' }
      ]);
      setShowAIPopup(sequence.enrolled === 0);
    } else {
      setNodes(sequence.nodes);
      setShowAIPopup((sequence.enrolled || 0) === 0 && sequence.nodes.length < 3);
    }
  }, [sequence]);

  const handleUpdateNode = (id, updates) => {
    setNodes(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n));
  };

  const handleDeleteNode = (id) => {
    setNodes(prev => prev.filter(n => n.id !== id));
  };

  const handleDuplicateNode = (id) => {
    const idx = nodes.findIndex(n => n.id === id);
    if (idx === -1) return;
    const original = nodes[idx];
    const copy = { ...original, id: Date.now().toString(), day: original.day + 2 };
    const updated = [...nodes];
    updated.splice(idx + 1, 0, copy);
    setNodes(updated);
  };

  const handleAddStep = () => {
    const lastDay = nodes.length > 0 ? nodes[nodes.length - 1].day : -3;
    setNodes(prev => [...prev, {
      id: Date.now().toString(),
      type: 'email',
      day: lastDay + 3,
      subject: '',
      content: ''
    }]);
  };

  const handleSave = async (nodesToSave = nodes, statusToSave = isActive ? 'Active' : 'Draft') => {
    if (statusToSave === 'Active' && (sequence.status === 'Active' || sequence.status === 'active')) {
      const confirmed = await showConfirm(
        'Update Active Campaign',
        `Warning: This campaign is currently Active${sequence.enrolled > 0 ? ` with ${sequence.enrolled} enrolled contacts` : ''}.\n\nEdits will update the template for future touchpoints. Proceed?`
      );
      if (!confirmed) return;
    }

    setIsSaving(true);
    try {
      await updateSequence(sequence.id, { nodes: nodesToSave, steps: nodesToSave.length, status: statusToSave });
      setSavedAt(new Date());
    } catch (err) {
      console.error('Failed to save sequence', err);
    }
    setTimeout(() => setIsSaving(false), 600);
  };

  const handleToggleActive = async () => {
    if (!isActive) {
      // Activating — check email settings first
      const settings = await fetchEmailSettings().catch(() => null);
      if (!settings || !settings.smtp_user) {
        setShowEmailModal(true);
        return;
      }
    }
    const newActive = !isActive;
    setIsActive(newActive);
    handleSave(nodes, newActive ? 'Active' : 'Draft');
  };

  const handleEnrollContacts = async (leadIds) => {
    try {
      await useDataStore.getState().enrollLeadsInSequence({
        sequenceId: sequence.id,
        leadIds,
        config: {}
      });
    } catch (err) {
      console.error('Failed to enroll contacts:', err);
    }
  };

  const enrolledCount = sequence.enrolled || 0;

  return (
    <div className="seq-editor-page">
      {/* Top Header */}
      <div className="seq-editor-header">
        <div className="seq-header-left">
          <button className="btn-dark" onClick={onBack} style={{ padding: '6px' }}><ArrowLeft size={16} /></button>
          <div style={{ color: 'var(--text-secondary)', fontSize: 13, marginRight: 4, fontWeight: 500 }}>Sequences &gt;</div>
          <h2 className="seq-header-title">{sequence.name}</h2>
          {savedAt && <span style={{ fontSize: 11, color: 'var(--text-tertiary)', marginLeft: 8 }}>Saved {savedAt.toLocaleTimeString()}</span>}
        </div>
        <div className="seq-header-right">
          <button className="btn-yellow" onClick={() => setShowAddContacts(true)}><Users size={14} /> Add Contacts</button>
          <div
            className="btn-dark"
            onClick={handleToggleActive}
            style={{ border: isActive ? '1px solid rgba(34,197,94,0.4)' : undefined, background: isActive ? 'rgba(34,197,94,0.1)' : undefined }}
          >
            <div className={`switch ${isActive ? 'on' : ''}`} style={{ transform: 'scale(0.8)', margin: '-2px 0' }}></div>
            <span style={{ color: isActive ? '#16a34a' : 'var(--text-primary)' }}>{isActive ? 'Active' : 'Inactive'}</span>
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
              {tab === 'Contacts' && enrolledCount > 0 && (
                <span style={{ marginLeft: 4, fontSize: 10, background: 'var(--accent-blue)', color: '#fff', borderRadius: 10, padding: '1px 5px' }}>{enrolledCount}</span>
              )}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{nodes.length} steps · {enrolledCount} enrolled</span>
        </div>
      </div>

      {/* Main Canvas */}
      <div className="seq-editor-canvas">

        {/* ── EDITOR TAB ── */}
        {activeTab === 'Editor' && (
          <>
            <div className="seq-action-bar">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                <Zap size={14} color="var(--accent-blue)" /> {nodes.length} steps configured
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button className="btn-white" onClick={() => handleSave(nodes)} disabled={isSaving}>
                  {isSaving ? <><RefreshCw size={13} className="spin" /> Saving...</> : 'Save changes'}
                </button>
              </div>
            </div>

            {nodes.map((node, i) => (
              <div key={node.id} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {/* Delay Connector */}
                <div className="seq-delay-block">
                  <div className="seq-delay-line" />
                  <div className="seq-delay-controls">
                    <ClockIcon size={14} /> Wait
                    <input
                      type="number"
                      value={node.day}
                      min={0}
                      onChange={e => handleUpdateNode(node.id, { day: parseInt(e.target.value) || 0 })}
                      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', width: 44, textAlign: 'center', borderRadius: 6, outline: 'none', padding: '2px 4px' }}
                    />
                    {node.day === 1 ? 'day' : 'days'} {i === 0 && node.day === 0 && <span style={{ color: 'var(--success)', fontSize: 11 }}>(immediately)</span>}
                  </div>
                </div>
                <DualPaneCard
                  node={node}
                  index={i}
                  updateNode={handleUpdateNode}
                  deleteNode={handleDeleteNode}
                  duplicateNode={handleDuplicateNode}
                  leads={leads}
                />
              </div>
            ))}

            <div style={{ marginTop: 32, paddingBottom: 60, display: 'flex', justifyContent: 'center' }}>
              <button className="btn-dark" onClick={handleAddStep} style={{ padding: '10px 24px', borderRadius: 24, gap: 8, fontSize: 13 }}>
                <Plus size={16} /> Add Step
              </button>
            </div>
          </>
        )}

        {/* ── CONTACTS TAB ── */}
        {activeTab === 'Contacts' && (
          <div style={{ padding: 40, maxWidth: 900, margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div>
                <h2 style={{ color: 'var(--text-primary)', fontSize: 22, fontWeight: 700, margin: 0 }}>Enrolled Contacts</h2>
                <p style={{ color: 'var(--text-tertiary)', fontSize: 13, marginTop: 4 }}>{enrolledCount} contact{enrolledCount !== 1 ? 's' : ''} in this sequence</p>
              </div>
              <button className="btn-yellow" onClick={() => setShowAddContacts(true)} style={{ gap: 6 }}><Plus size={14} /> Add Contacts</button>
            </div>

            {enrolledCount === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--bg-elevated)', borderRadius: 14, border: '1px dashed var(--border-color)' }}>
                <Users size={40} style={{ color: 'var(--text-tertiary)', marginBottom: 16 }} />
                <h3 style={{ color: 'var(--text-secondary)', fontWeight: 600, marginBottom: 8 }}>No contacts enrolled yet</h3>
                <p style={{ color: 'var(--text-tertiary)', fontSize: 13, maxWidth: 360, margin: '0 auto 20px' }}>
                  Add leads from your CRM to start sending this sequence. All progress and replies will be tracked here.
                </p>
                <button className="btn-yellow" onClick={() => setShowAddContacts(true)} style={{ gap: 6 }}><Plus size={14} /> Add First Contacts</button>
              </div>
            ) : (
              <div style={{ background: 'var(--bg-elevated)', borderRadius: 12, border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border-color)', fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 16 }}>
                  <span>Contact</span><span>Status</span><span>Step</span><span>Last activity</span>
                </div>
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-tertiary)', fontSize: 13 }}>
                  Enrolled contacts will appear here with real-time status tracking.
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── EMAILS TAB ── */}
        {activeTab === 'Emails' && (
          <div style={{ padding: 40, maxWidth: 900, margin: '0 auto' }}>
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ color: 'var(--text-primary)', fontSize: 22, fontWeight: 700, margin: 0 }}>Email Log</h2>
              <p style={{ color: 'var(--text-tertiary)', fontSize: 13, marginTop: 4 }}>All emails sent via this sequence</p>
            </div>

            {/* Stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
              {[
                { label: 'Sent', value: 0, color: 'var(--text-primary)' },
                { label: 'Opened', value: '0%', color: '#3b82f6' },
                { label: 'Clicked', value: '0%', color: '#8b5cf6' },
                { label: 'Replied', value: `${sequence.reply_rate || 0}%`, color: '#16a34a' },
              ].map(stat => (
                <div key={stat.label} style={{ background: 'var(--bg-elevated)', borderRadius: 12, padding: '16px 20px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 8 }}>{stat.label}</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: stat.color }}>{stat.value}</div>
                </div>
              ))}
            </div>

            <div style={{ textAlign: 'center', padding: '48px 20px', background: 'var(--bg-elevated)', borderRadius: 14, border: '1px dashed var(--border-color)' }}>
              <Mail size={36} style={{ color: 'var(--text-tertiary)', marginBottom: 16 }} />
              <h3 style={{ color: 'var(--text-secondary)', fontWeight: 600, marginBottom: 8 }}>No emails sent yet</h3>
              <p style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>Activate this sequence and enroll contacts to start logging emails.</p>
            </div>
          </div>
        )}

        {/* ── ACTIVITY TAB ── */}
        {activeTab === 'Activity' && (
          <div style={{ padding: 40, maxWidth: 900, margin: '0 auto' }}>
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ color: 'var(--text-primary)', fontSize: 22, fontWeight: 700, margin: 0 }}>Activity Feed</h2>
              <p style={{ color: 'var(--text-tertiary)', fontSize: 13, marginTop: 4 }}>Real-time events for this sequence</p>
            </div>

            {!isActive ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--bg-elevated)', borderRadius: 14, border: '1px dashed var(--border-color)' }}>
                <Activity size={40} style={{ color: 'var(--text-tertiary)', marginBottom: 16 }} />
                <h3 style={{ color: 'var(--text-secondary)', fontWeight: 600, marginBottom: 8 }}>Sequence is inactive</h3>
                <p style={{ color: 'var(--text-tertiary)', fontSize: 13, maxWidth: 360, margin: '0 auto 20px' }}>Activate this sequence to start recording opens, clicks, and replies in real-time.</p>
                <button className="btn-dark" onClick={handleToggleActive} style={{ gap: 6 }}>
                  <Zap size={13} /> Activate Sequence
                </button>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--bg-elevated)', borderRadius: 14, border: '1px dashed var(--border-color)' }}>
                <CheckCircle2 size={40} style={{ color: '#16a34a', marginBottom: 16 }} />
                <h3 style={{ color: 'var(--text-secondary)', fontWeight: 600, marginBottom: 8 }}>Sequence is live</h3>
                <p style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>Activity events will appear here as contacts interact with your emails.</p>
              </div>
            )}
          </div>
        )}

        {/* ── REPORT TAB ── */}
        {activeTab === 'Report' && (
          <div style={{ padding: 40, maxWidth: 900, margin: '0 auto' }}>
            <div style={{ marginBottom: 32 }}>
              <h2 style={{ color: 'var(--text-primary)', fontSize: 22, fontWeight: 700, margin: 0 }}>Sequence Report</h2>
              <p style={{ color: 'var(--text-tertiary)', fontSize: 13, marginTop: 4 }}>Performance overview for {sequence.name}</p>
            </div>

            {/* Funnel */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 40, background: 'var(--bg-elevated)', borderRadius: 14, border: '1px solid var(--border-color)', overflow: 'hidden' }}>
              {[
                { label: 'Enrolled', value: enrolledCount, color: '#6366f1' },
                { label: 'Active', value: isActive ? enrolledCount : 0, color: '#3b82f6' },
                { label: 'Replied', value: 0, color: '#16a34a' },
                { label: 'Bounced', value: 0, color: '#ef4444' },
              ].map((item, i) => (
                <div key={item.label} style={{ flex: 1, textAlign: 'center', padding: '28px 16px', borderRight: i < 3 ? '1px solid var(--border-color)' : 'none' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>{item.label}</div>
                  <div style={{ fontSize: 40, fontWeight: 800, color: item.color }}>{item.value}</div>
                </div>
              ))}
            </div>

            <div style={{ background: 'var(--bg-elevated)', borderRadius: 12, padding: 28, border: '1px solid var(--border-color)' }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <BarChart2 size={16} /> Step-by-step performance
              </h3>
              {nodes.length === 0 ? (
                <div style={{ color: 'var(--text-tertiary)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>Add steps to see per-step analytics.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {nodes.map((node, i) => (
                    <div key={node.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 16px', background: 'var(--bg-body)', borderRadius: 8, border: '1px solid var(--border-color)' }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--accent-blue-muted)', color: 'var(--accent-blue-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>{i + 1}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{node.subject || `Step ${i + 1}`}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Day {node.day} · {node.type}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 20 }}>
                        {['Sent', 'Opened', 'Replied'].map(m => (
                          <div key={m} style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>0</div>
                            <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{m}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── SETTINGS TAB ── */}
        {activeTab === 'Settings' && (
          <div style={{ padding: 40, maxWidth: 700, margin: '0 auto' }}>
            <h2 style={{ color: 'var(--text-primary)', fontSize: 22, fontWeight: 700, marginBottom: 28 }}>Sequence Settings</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              <div style={{ background: 'var(--bg-elevated)', borderRadius: 12, padding: 28, border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: 20 }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>General</h3>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Sequence Name</label>
                  <input className="input-base" defaultValue={sequence.name} style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Channel</label>
                  <select className="input-base" defaultValue={sequence.channel || 'Email'} style={{ width: '100%' }}>
                    <option>Email</option>
                    <option>LinkedIn</option>
                    <option>Multi-channel</option>
                  </select>
                </div>
              </div>

              <div style={{ background: 'var(--bg-elevated)', borderRadius: 12, padding: 28, border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: 20 }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Sending Schedule</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Send Window</label>
                    <select className="input-base" style={{ width: '100%' }}>
                      <option>Weekdays 9:00 AM – 5:00 PM</option>
                      <option>Everyday 9:00 AM – 5:00 PM</option>
                      <option>Custom...</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Timezone</label>
                    <select className="input-base" style={{ width: '100%' }}>
                      <option>Contact's local time</option>
                      <option>IST (India Standard Time)</option>
                      <option>UTC</option>
                    </select>
                  </div>
                </div>
              </div>

              <div style={{ background: 'rgba(239,68,68,0.05)', borderRadius: 12, padding: 24, border: '1px solid rgba(239,68,68,0.2)' }}>
                <h3 style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 700, color: '#dc2626' }}>Danger Zone</h3>
                <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--text-tertiary)' }}>Deleting this sequence will remove all enrolled contacts and sending history. This cannot be undone.</p>
                <button style={{ padding: '8px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, color: '#dc2626', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  Delete Sequence
                </button>
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
            setIsActive(true);
            handleSave(nodes, 'Active');
          }}
        />
      )}
    </div>
  );
}

// ── Inline Email Config Modal ──────────────────
function InlineEmailConfigModal({ onClose, onSuccess }) {
  const { saveEmailSettings } = useDataStore();
  const [formData, setFormData] = useState({ smtp_host: 'smtp.gmail.com', smtp_port: 587, smtp_user: '', smtp_pass: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    if (!formData.smtp_user || !formData.smtp_pass) return;
    setIsSaving(true);
    setError(null);
    try {
      await saveEmailSettings(formData);
      onSuccess();
    } catch (err) {
      setError(err.message);
      setIsSaving(false);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
      <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', borderRadius: 16, padding: 32, width: 480, maxWidth: '90%', boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div style={{ padding: 12, background: 'rgba(234,179,8,0.12)', borderRadius: 12 }}>
            <Mail color="#eab308" size={24} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Connect Mailbox</h3>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Required to activate campaigns</div>
          </div>
        </div>

        {error && <div style={{ padding: 12, borderRadius: 8, background: 'rgba(239,68,68,0.1)', color: '#dc2626', fontSize: 13, marginBottom: 16 }}>{error}</div>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 28 }}>
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
            <div style={{ width: 90 }}>
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
