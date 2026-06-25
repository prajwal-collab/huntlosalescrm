// ============================================
// HUNTLO SALES OS — DEAL DRAWER (v2 — INR + Proposals)
// ============================================
import { useState } from 'react';
import {
  X, Mail, Sparkles, Plus, CheckSquare, Calendar, FileText,
  Send, Clock, CheckCircle2, AlertCircle, IndianRupee, TrendingUp,
  Edit3, Trash2, ExternalLink, Copy, Check
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import usePipelineStore from '../../store/usePipelineStore';
import useDataStore from '../../store/useDataStore';
import useAuthStore from '../../store/useAuthStore';
import { generateFollowUp, generateCompanyInsight } from '../../lib/gemini';
import { useDialog } from '../../context/DialogContext';
import './DealDrawer.css';

const TABS = ['Overview', 'Proposals', 'Activity', 'Contacts', 'Notes', 'Tasks', 'AI Insights'];
const ACTIVITY_ICONS = { email: '📧', call: '📞', meeting: '📅', note: '📝', proposal: '📋', default: '•' };

// ── Format INR ─────────────────────────────
function formatINR(amount) {
  if (!amount && amount !== 0) return '—';
  const num = Number(amount);
  if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)}Cr`;
  if (num >= 100000)   return `₹${(num / 100000).toFixed(1)}L`;
  if (num >= 1000)     return `₹${(num / 1000).toFixed(1)}k`;
  return `₹${num.toLocaleString('en-IN')}`;
}

// ── Proposal Status Badge ────────────────────
const PROPOSAL_STATUS = {
  draft:    { label: 'Draft',    color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' },
  sent:     { label: 'Sent',     color: '#3b82f6', bg: 'rgba(59,130,246,0.08)' },
  viewed:   { label: 'Viewed',   color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)' },
  accepted: { label: 'Accepted', color: '#10b981', bg: 'rgba(16,185,129,0.08)' },
  rejected: { label: 'Rejected', color: '#ef4444', bg: 'rgba(239,68,68,0.08)' },
  expired:  { label: 'Expired',  color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
};

function ProposalStatusBadge({ status }) {
  const s = PROPOSAL_STATUS[status] || PROPOSAL_STATUS.draft;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontSize: 11, fontWeight: 700, padding: '3px 9px',
      borderRadius: 20, color: s.color, background: s.bg,
      border: `1px solid ${s.color}30`,
    }}>
      {status === 'accepted' && <CheckCircle2 size={10} />}
      {status === 'sent'     && <Send size={10} />}
      {status === 'viewed'   && <TrendingUp size={10} />}
      {status === 'expired'  && <Clock size={10} />}
      {status === 'rejected' && <AlertCircle size={10} />}
      {s.label}
    </span>
  );
}

// ── Proposals Tab ──────────────────────────────
function ProposalsTab({ deal, showAlert, showSuccess }) {
  const [proposals, setProposals] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(`huntlo_proposals_${deal.id}`) || '[]');
    } catch { return []; }
  });
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [copied, setCopied] = useState(null);
  const [form, setForm] = useState({
    title: '',
    amount: '',
    validity: '30',
    status: 'draft',
    notes: '',
    items: [{ description: '', amount: '' }],
  });

  const saveProposals = (updated) => {
    setProposals(updated);
    localStorage.setItem(`huntlo_proposals_${deal.id}`, JSON.stringify(updated));
  };

  const handleAddItem = () => {
    setForm(f => ({ ...f, items: [...f.items, { description: '', amount: '' }] }));
  };

  const handleItemChange = (idx, field, val) => {
    setForm(f => {
      const items = [...f.items];
      items[idx] = { ...items[idx], [field]: val };
      return { ...f, items };
    });
  };

  const handleRemoveItem = (idx) => {
    setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));
  };

  const totalAmount = form.items.reduce((sum, it) => sum + (Number(it.amount) || 0), 0);

  const handleSave = () => {
    if (!form.title) return;
    const proposal = {
      id: editId || `prop-${Date.now()}`,
      ...form,
      amount: totalAmount || Number(form.amount) || 0,
      createdAt: editId ? proposals.find(p => p.id === editId)?.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = editId
      ? proposals.map(p => p.id === editId ? proposal : p)
      : [proposal, ...proposals];
    saveProposals(updated);
    setShowForm(false);
    setEditId(null);
    setForm({ title: '', amount: '', validity: '30', status: 'draft', notes: '', items: [{ description: '', amount: '' }] });
    showSuccess('Proposal Saved', `"${proposal.title}" has been saved.`);
  };

  const handleEdit = (p) => {
    setEditId(p.id);
    setForm({ ...p, items: p.items?.length ? p.items : [{ description: '', amount: '' }] });
    setShowForm(true);
  };

  const handleDelete = (id) => {
    showAlert('Delete Proposal', 'Are you sure you want to delete this proposal?', () => {
      saveProposals(proposals.filter(p => p.id !== id));
    });
  };

  const handleStatusChange = (id, status) => {
    const updated = proposals.map(p => p.id === id ? { ...p, status, updatedAt: new Date().toISOString() } : p);
    saveProposals(updated);
  };

  const handleCopyLink = (id) => {
    const link = `${window.location.origin}/proposal/${id}`;
    navigator.clipboard.writeText(link);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  // ── Summary Stats ──
  const totalSent     = proposals.filter(p => p.status !== 'draft').length;
  const totalAccepted = proposals.filter(p => p.status === 'accepted').length;
  const totalValue    = proposals.filter(p => p.status === 'accepted').reduce((s, p) => s + (p.amount || 0), 0);

  return (
    <div className="proposals-tab">
      {/* Stats Bar */}
      {proposals.length > 0 && (
        <div className="proposal-stats-row">
          <div className="prop-stat">
            <span className="prop-stat-num">{proposals.length}</span>
            <span className="prop-stat-lbl">Total</span>
          </div>
          <div className="prop-stat">
            <span className="prop-stat-num" style={{ color: 'var(--accent-blue)' }}>{totalSent}</span>
            <span className="prop-stat-lbl">Sent</span>
          </div>
          <div className="prop-stat">
            <span className="prop-stat-num" style={{ color: 'var(--success)' }}>{totalAccepted}</span>
            <span className="prop-stat-lbl">Accepted</span>
          </div>
          <div className="prop-stat">
            <span className="prop-stat-num" style={{ color: 'var(--success)' }}>{formatINR(totalValue)}</span>
            <span className="prop-stat-lbl">Won Value</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="proposals-header">
        <button
          className="btn btn-primary btn-sm"
          onClick={() => { setShowForm(true); setEditId(null); setForm({ title: '', amount: '', validity: '30', status: 'draft', notes: '', items: [{ description: '', amount: '' }] }); }}
        >
          <Plus size={13} /> New Proposal
        </button>
      </div>

      {/* Proposal Form */}
      {showForm && (
        <div className="proposal-form-card">
          <div className="prop-form-header">
            <span className="prop-form-title">{editId ? 'Edit Proposal' : 'Create Proposal'}</span>
            <button className="drawer-close" onClick={() => { setShowForm(false); setEditId(null); }}>
              <X size={14} />
            </button>
          </div>

          <div className="prop-form-group">
            <label className="prop-label">Proposal Title *</label>
            <input
              className="input-base"
              placeholder="e.g. Q3 Enterprise Package"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            />
          </div>

          <div className="prop-form-row">
            <div className="prop-form-group">
              <label className="prop-label">Status</label>
              <select className="input-base" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                {Object.entries(PROPOSAL_STATUS).map(([key, val]) => (
                  <option key={key} value={key}>{val.label}</option>
                ))}
              </select>
            </div>
            <div className="prop-form-group">
              <label className="prop-label">Valid for (days)</label>
              <input className="input-base" type="number" min="1" value={form.validity} onChange={e => setForm(f => ({ ...f, validity: e.target.value }))} />
            </div>
          </div>

          {/* Line Items */}
          <div className="prop-form-group">
            <label className="prop-label">Line Items</label>
            <div className="prop-items-list">
              {form.items.map((item, idx) => (
                <div key={idx} className="prop-item-row">
                  <input
                    className="input-base prop-item-desc"
                    placeholder="Description..."
                    value={item.description}
                    onChange={e => handleItemChange(idx, 'description', e.target.value)}
                  />
                  <div className="prop-item-amount-wrap">
                    <IndianRupee size={12} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
                    <input
                      className="input-base prop-item-amount"
                      type="number"
                      placeholder="0"
                      value={item.amount}
                      onChange={e => handleItemChange(idx, 'amount', e.target.value)}
                    />
                  </div>
                  {form.items.length > 1 && (
                    <button className="prop-item-remove" onClick={() => handleRemoveItem(idx)}>
                      <X size={12} />
                    </button>
                  )}
                </div>
              ))}
              <button className="prop-add-item-btn" onClick={handleAddItem}>
                <Plus size={12} /> Add Line Item
              </button>
            </div>
            <div className="prop-total-row">
              <span className="prop-total-label">Total</span>
              <span className="prop-total-amount">{formatINR(totalAmount)}</span>
            </div>
          </div>

          <div className="prop-form-group">
            <label className="prop-label">Notes / Terms</label>
            <textarea
              className="input-base"
              rows={3}
              placeholder="Payment terms, conditions..."
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              style={{ resize: 'vertical' }}
            />
          </div>

          <div className="prop-form-actions">
            <button className="btn btn-ghost btn-sm" onClick={() => { setShowForm(false); setEditId(null); }}>Cancel</button>
            <button className="btn btn-primary btn-sm" onClick={handleSave}>
              {editId ? 'Update Proposal' : 'Save Proposal'}
            </button>
          </div>
        </div>
      )}

      {/* Proposal Cards */}
      {proposals.length === 0 && !showForm ? (
        <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
          <FileText size={28} />
          <h3>No Proposals Yet</h3>
          <p>Create your first proposal for this deal to start tracking</p>
          <button className="btn btn-primary btn-sm" style={{ marginTop: 12 }} onClick={() => setShowForm(true)}>
            <Plus size={13} /> Create Proposal
          </button>
        </div>
      ) : (
        <div className="proposals-list">
          {proposals.map(p => (
            <div key={p.id} className={`proposal-card status-${p.status}`}>
              <div className="prop-card-top">
                <div className="prop-card-left">
                  <span className="prop-card-title">{p.title}</span>
                  <div className="prop-card-meta">
                    <ProposalStatusBadge status={p.status} />
                    <span className="prop-card-date">
                      {p.createdAt ? `Created ${formatDistanceToNow(new Date(p.createdAt), { addSuffix: true })}` : ''}
                    </span>
                  </div>
                </div>
                <div className="prop-card-amount">{formatINR(p.amount)}</div>
              </div>

              {p.items?.length > 0 && (
                <div className="prop-card-items">
                  {p.items.slice(0, 3).map((item, i) => (
                    <div key={i} className="prop-item-preview">
                      <span className="prop-item-preview-desc">{item.description || 'Item'}</span>
                      <span className="prop-item-preview-amount">{formatINR(item.amount)}</span>
                    </div>
                  ))}
                  {p.items.length > 3 && (
                    <span className="prop-more-items">+{p.items.length - 3} more items</span>
                  )}
                </div>
              )}

              {p.validity && (
                <div className="prop-card-validity">
                  <Clock size={11} /> Valid for {p.validity} days
                  {p.status === 'draft' && <span style={{ color: 'var(--text-tertiary)' }}> · Not yet sent</span>}
                </div>
              )}

              {p.notes && (
                <div className="prop-card-notes">{p.notes}</div>
              )}

              <div className="prop-card-actions">
                <select
                  className="prop-status-select"
                  value={p.status}
                  onChange={e => handleStatusChange(p.id, e.target.value)}
                  onClick={e => e.stopPropagation()}
                >
                  {Object.entries(PROPOSAL_STATUS).map(([key, val]) => (
                    <option key={key} value={key}>{val.label}</option>
                  ))}
                </select>
                <button className="prop-action-btn" onClick={() => handleCopyLink(p.id)} title="Copy share link">
                  {copied === p.id ? <Check size={12} style={{ color: 'var(--success)' }} /> : <Copy size={12} />}
                </button>
                <button className="prop-action-btn" onClick={() => handleEdit(p)} title="Edit">
                  <Edit3 size={12} />
                </button>
                <button className="prop-action-btn danger" onClick={() => handleDelete(p.id)} title="Delete">
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main DealDrawer ────────────────────────────
export default function DealDrawer({ dealId, onClose }) {
  const { getSelectedDeal, updateDeal, addActivity } = usePipelineStore();
  const { showAlert, showSuccess } = useDialog();
  const deal = getSelectedDeal();
  const [activeTab, setActiveTab] = useState('Overview');
  const [aiInsight, setAiInsight] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [followUp, setFollowUp] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [editedNotes, setEditedNotes] = useState('');

  if (!deal) return null;

  const ownerInfo = typeof deal.owner === 'object' ? deal.owner : { name: deal.owner || 'Unknown', color: '#3b82f6', initials: 'UN' };

  const handleGenerateInsight = async () => {
    setAiLoading(true);
    try {
      const res = await generateCompanyInsight(deal.company, deal.industry || 'SaaS', deal.engagementScore, deal.stage);
      setAiInsight(res);
    } finally {
      setAiLoading(false);
    }
  };

  const handleGenerateFollowUp = async () => {
    setAiLoading(true);
    try {
      const res = await generateFollowUp(deal.company, deal.stage, deal.lastActivity, deal.contacts?.[0] || 'the team');
      setFollowUp(res);
    } finally {
      setAiLoading(false);
    }
  };

  const handleAddNote = () => {
    if (!note.trim()) return;
    if (addActivity) addActivity(deal.id, { type: 'note', text: note, user: 'You' });
    setNote('');
  };

  const handleSaveNotes = async () => {
    setSaving(true);
    try {
      await updateDeal?.(deal.id, { notes: editedNotes || deal.notes });
      showSuccess('Notes Saved', 'Deal notes have been updated.');
    } catch (e) {
      showAlert('Error', 'Failed to save notes.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="drawer-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="deal-drawer animate-slide-right">
        {/* Header */}
        <div className="drawer-header">
          <div className="drawer-deal-logo" style={{ background: (deal.color || '#3b82f6') + '22', color: deal.color || '#3b82f6' }}>
            {deal.logo || deal.company?.charAt(0) || 'D'}
          </div>
          <div className="drawer-deal-info">
            <h2 className="drawer-deal-name">{deal.company || deal.title}</h2>
            <div className="drawer-deal-meta">
              <span className="badge badge-blue">{deal.stage}</span>
              <span className="drawer-arr">
                <IndianRupee size={12} style={{ display: 'inline', verticalAlign: 'middle' }} />
                {deal.arr ? (deal.arr >= 100000 ? `${(deal.arr/100000).toFixed(1)}L` : `${(deal.arr/1000).toFixed(0)}k`) : '0'} MRR
              </span>
              <div className="drawer-owner-chip" style={{ background: (ownerInfo.color || '#3b82f6') + '18' }}>
                <div className="owner-dot" style={{ background: ownerInfo.color || '#3b82f6' }} />
                <span>{ownerInfo.name || 'Unknown'}</span>
              </div>
            </div>
          </div>
          <button className="drawer-close" onClick={onClose}><X size={16} /></button>
        </div>

        {/* Tabs */}
        <div className="tabs">
          {TABS.map(tab => (
            <button
              key={tab}
              className={`tab-item ${activeTab === tab ? 'active' : ''} ${tab === 'Proposals' ? 'tab-proposals' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'Proposals' && <FileText size={11} style={{ marginRight: 4 }} />}
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="drawer-body">

          {/* ── Overview ── */}
          {activeTab === 'Overview' && (
            <div className="drawer-overview">
              <div className="overview-stats">
                <div className="ov-stat">
                  <span className="ov-stat-label">Engagement</span>
                  <span className="ov-stat-val" style={{ color: deal.engagementScore >= 75 ? 'var(--success)' : 'var(--warning)' }}>
                    {deal.engagementScore}/100
                  </span>
                </div>
                <div className="ov-stat">
                  <span className="ov-stat-label">Urgency</span>
                  <span className="ov-stat-val" style={{ textTransform: 'capitalize' }}>{deal.urgency || '—'}</span>
                </div>
                <div className="ov-stat">
                  <span className="ov-stat-label">Deal Value</span>
                  <span className="ov-stat-val" style={{ color: 'var(--success)' }}>
                    {formatINR(deal.arr)}
                  </span>
                </div>
                <div className="ov-stat">
                  <span className="ov-stat-label">Last Activity</span>
                  <span className="ov-stat-val">
                    {deal.lastActivity || deal.last_activity
                      ? formatDistanceToNow(new Date(deal.lastActivity || deal.last_activity), { addSuffix: true })
                      : 'New'}
                  </span>
                </div>
              </div>

              {deal.notes && (
                <div className="ov-notes">
                  <p className="ov-notes-label">Deal Notes</p>
                  <p className="ov-notes-text">{deal.notes}</p>
                </div>
              )}

              {deal.nextStep && (
                <div className="ov-next-step">
                  <span className="ov-next-label">Next Step</span>
                  <span className="ov-next-text">{deal.nextStep}</span>
                </div>
              )}

              <div className="drawer-quick-actions">
                <button className="btn btn-ghost btn-sm" onClick={handleGenerateFollowUp}>
                  <Mail size={13} /> {aiLoading ? 'Generating...' : 'Draft Follow-up'}
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => setActiveTab('Proposals')}>
                  <FileText size={13} /> Proposals
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => showAlert('Schedule Meeting', 'Opening meeting scheduler...')}>
                  <Calendar size={13} /> Schedule Meeting
                </button>
              </div>

              {followUp && (
                <div className="ai-generated-box">
                  <div className="ai-generated-label"><Sparkles size={11} /> AI Generated Follow-up</div>
                  <pre className="ai-generated-text">{followUp}</pre>
                </div>
              )}
            </div>
          )}

          {/* ── Proposals ── */}
          {activeTab === 'Proposals' && (
            <ProposalsTab deal={deal} showAlert={showAlert} showSuccess={showSuccess} />
          )}

          {/* ── Activity ── */}
          {activeTab === 'Activity' && (
            <div className="drawer-activity">
              <div className="add-note-row">
                <input
                  className="input-base"
                  placeholder="Add a note or log activity..."
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddNote()}
                />
                <button className="btn btn-primary btn-sm" onClick={handleAddNote}><Plus size={13} /></button>
              </div>
              <div className="activity-timeline">
                {deal.activities && deal.activities.length > 0 ? deal.activities.map((act, i) => (
                  <div key={i} className="timeline-item">
                    <span className="timeline-icon">{ACTIVITY_ICONS[act.type] || ACTIVITY_ICONS.default}</span>
                    <div className="timeline-body">
                      <span className="timeline-text">{act.text}</span>
                      <span className="timeline-meta">{act.user} · {formatDistanceToNow(new Date(act.time), { addSuffix: true })}</span>
                    </div>
                  </div>
                )) : (
                  <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
                    <p>No activity yet. Add a note above to get started.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Contacts ── */}
          {activeTab === 'Contacts' && (
            <div className="drawer-contacts">
              {deal.contacts && deal.contacts.length > 0 ? deal.contacts.map((c, i) => (
                <div key={i} className="contact-row">
                  <div className="avatar avatar-sm" style={{ background: `hsl(${i * 60}, 60%, 50%)`, color: '#fff' }}>
                    {c.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="contact-info">
                    <span className="contact-name">{c}</span>
                    <span className="contact-role">Contact</span>
                  </div>
                  <button className="icon-btn" onClick={() => showAlert('Draft Email', `Drafting email to ${c}`)}><Mail size={13} /></button>
                </div>
              )) : <p className="text-secondary" style={{ padding: 'var(--space-4)' }}>No contacts linked to this deal.</p>}
            </div>
          )}

          {/* ── Notes ── */}
          {activeTab === 'Notes' && (
            <div className="drawer-notes">
              <textarea
                className="input-base"
                rows={10}
                defaultValue={deal.notes}
                onChange={e => setEditedNotes(e.target.value)}
                placeholder="Add deal notes, context, next steps..."
                style={{ resize: 'vertical' }}
              />
              <button
                className="btn btn-primary btn-sm"
                style={{ marginTop: 8 }}
                disabled={saving}
                onClick={handleSaveNotes}
              >
                {saving ? 'Saving...' : 'Save Notes'}
              </button>
            </div>
          )}

          {/* ── Tasks ── */}
          {activeTab === 'Tasks' && (
            <div className="drawer-tasks">
              <button className="btn btn-ghost btn-sm" style={{ marginBottom: 12 }}>
                <Plus size={13} /> Add Task
              </button>
              <div className="empty-state">
                <CheckSquare size={28} />
                <h3>No tasks yet</h3>
                <p>Add tasks to track next steps for this deal</p>
              </div>
            </div>
          )}

          {/* ── AI Insights ── */}
          {activeTab === 'AI Insights' && (
            <div className="drawer-ai">
              <button
                className="btn btn-primary btn-md w-full"
                onClick={handleGenerateInsight}
                disabled={aiLoading}
              >
                <Sparkles size={14} />
                {aiLoading ? 'Analyzing...' : 'Generate AI Insights'}
              </button>
              {aiInsight && (
                <div className="ai-generated-box" style={{ marginTop: 16 }}>
                  <div className="ai-generated-label"><Sparkles size={11} /> AI Analysis</div>
                  <pre className="ai-generated-text">{aiInsight}</pre>
                </div>
              )}
              {!aiInsight && !aiLoading && (
                <div className="empty-state">
                  <Sparkles size={28} />
                  <h3>AI Insights</h3>
                  <p>Click above to get AI-powered tactical recommendations for this deal</p>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
