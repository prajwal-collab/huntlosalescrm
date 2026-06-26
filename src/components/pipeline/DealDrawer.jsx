// ============================================
// HUNTLO SALES OS — DEAL DRAWER (v3 — Intelligent)
// ============================================
import { useState, useMemo } from 'react';
import {
  X, Mail, Sparkles, Plus, CheckSquare, Calendar, FileText,
  Send, Clock, CheckCircle2, AlertCircle, IndianRupee, TrendingUp,
  Edit3, Trash2, ExternalLink, Copy, Check, Phone, User, Save
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
  const { proposals: allProposals, createProposal, updateProposal, deleteProposal } = useDataStore();
  const proposals = useMemo(() => allProposals.filter(p => p.deal_id === deal.id), [allProposals, deal.id]);
  
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

  const handleSave = async () => {
    if (!form.title) return;
    const amount = totalAmount || Number(form.amount) || 0;
    
    try {
      if (editId) {
        await updateProposal(editId, {
          title: form.title,
          amount,
          valid_until: form.validity ? new Date(Date.now() + Number(form.validity) * 86400000).toISOString() : null,
          status: form.status,
          notes: form.notes,
          line_items: form.items
        });
      } else {
        await createProposal({
          deal_id: deal.id,
          title: form.title,
          amount,
          valid_until: form.validity ? new Date(Date.now() + Number(form.validity) * 86400000).toISOString() : null,
          status: form.status,
          notes: form.notes,
          line_items: form.items
        });
      }
      
      setShowForm(false);
      setEditId(null);
      setForm({ title: '', amount: '', validity: '30', status: 'draft', notes: '', items: [{ description: '', amount: '' }] });
      showSuccess('Proposal Saved', `"${form.title}" has been saved.`);
    } catch (err) {
      showAlert('Error', 'Failed to save proposal.');
    }
  };

  const handleEdit = (p) => {
    setEditId(p.id);
    const validityDays = p.valid_until ? Math.ceil((new Date(p.valid_until).getTime() - new Date(p.created_at || Date.now()).getTime()) / 86400000) : '30';
    setForm({ 
      title: p.title || '',
      amount: p.amount || '',
      status: p.status || 'draft',
      validity: validityDays.toString(),
      notes: p.notes || '',
      items: Array.isArray(p.line_items) && p.line_items.length > 0 ? p.line_items : [{ description: '', amount: '' }] 
    });
    setShowForm(true);
  };

  const handleDelete = (id) => {
    showAlert('Delete Proposal', 'Are you sure you want to delete this proposal?', async () => {
      try {
        await deleteProposal(id);
      } catch (err) {
        showAlert('Error', 'Failed to delete proposal.');
      }
    });
  };

  const handleStatusChange = async (id, status) => {
    try {
      await updateProposal(id, { status });
    } catch (err) {
      showAlert('Error', 'Failed to update status.');
    }
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
                      {p.created_at ? `Created ${formatDistanceToNow(new Date(p.created_at), { addSuffix: true })}` : ''}
                    </span>
                  </div>
                </div>
                <div className="prop-card-amount">{formatINR(p.amount)}</div>
              </div>

              {Array.isArray(p.line_items) && p.line_items.length > 0 && (
                <div className="prop-card-items">
                  {p.line_items.slice(0, 3).map((item, i) => (
                    <div key={i} className="prop-item-preview">
                      <span className="prop-item-preview-desc">{item.description || 'Item'}</span>
                      <span className="prop-item-preview-amount">{formatINR(item.amount)}</span>
                    </div>
                  ))}
                  {p.line_items.length > 3 && (
                    <span className="prop-more-items">+{p.line_items.length - 3} more items</span>
                  )}
                </div>
              )}

              {p.valid_until && (
                <div className="prop-card-validity">
                  <Clock size={11} /> Valid until {new Date(p.valid_until).toLocaleDateString()}
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
  const { getSelectedDeal, addActivity } = usePipelineStore();
  const { contacts, tasks, createTask, updateTask, deleteTask, updateDeal, teamMembers } = useDataStore();
  const { showAlert, showSuccess } = useDialog();
  const deal = getSelectedDeal();
  const [activeTab, setActiveTab] = useState('Overview');
  const [aiInsight, setAiInsight] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [followUp, setFollowUp] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [editedNotes, setEditedNotes] = useState('');

  const [isEditingHeader, setIsEditingHeader] = useState(false);
  const [headerForm, setHeaderForm] = useState({ title: '', arr: '', stage: '', urgency: '', owner_id: '' });

  const handleEditHeaderClick = () => {
    setHeaderForm({
      title: deal.title || deal.company || '',
      arr: deal.arr || 0,
      stage: deal.stage || 'Discovery',
      urgency: deal.urgency || 'medium',
      owner_id: deal.owner_id || ''
    });
    setIsEditingHeader(true);
  };

  const handleSaveHeader = async () => {
    setSaving(true);
    try {
      await updateDeal(deal.id, {
        title: headerForm.title,
        arr: Number(headerForm.arr),
        stage: headerForm.stage,
        urgency: headerForm.urgency,
        owner_id: headerForm.owner_id
      });
      setIsEditingHeader(false);
      showSuccess('Deal Updated', 'Deal details saved successfully.');
    } catch (e) {
      showAlert('Error', 'Failed to update deal.');
    } finally {
      setSaving(false);
    }
  };

  // Task form state
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDue, setNewTaskDue] = useState('');
  const [taskSaving, setTaskSaving] = useState(false);

  if (!deal) return null;

  // ── Linked contacts from contacts table by company_id ────────────
  const linkedContacts = useMemo(() => {
    if (!deal.company_id) return [];
    return contacts.filter(c => c.company_id === deal.company_id);
  }, [contacts, deal.company_id]);

  // ── Deal tasks filtered from all tasks ────────────────────────────
  const dealTasks = useMemo(() => {
    return tasks.filter(t => t.deal_id === deal.id);
  }, [tasks, deal.id]);

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;
    setTaskSaving(true);
    try {
      await createTask({
        title: newTaskTitle,
        deal_id: deal.id,
        due: newTaskDue || null,
        status: 'pending',
        type: 'deal-task',
      });
      setNewTaskTitle('');
      setNewTaskDue('');
    } catch (err) {
      showAlert('Error', 'Failed to create task.');
    } finally {
      setTaskSaving(false);
    }
  };

  const handleToggleTask = async (task) => {
    try {
      await updateTask(task.id, { status: task.status === 'completed' ? 'pending' : 'completed' });
    } catch (_) {}
  };

  const handleDeleteTask = (taskId) => {
    showAlert('Delete Task', 'Delete this task?', async () => {
      try { await deleteTask(taskId); } catch (_) {}
    });
  };

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
          {isEditingHeader ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, paddingRight: 24 }}>
              <input
                className="input-base"
                style={{ fontSize: 18, fontWeight: 600, padding: '8px 12px' }}
                value={headerForm.title}
                onChange={e => setHeaderForm({ ...headerForm, title: e.target.value })}
                placeholder="Deal Name"
              />
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <select className="input-base" style={{ flex: 1, minWidth: 120 }} value={headerForm.stage} onChange={e => setHeaderForm({ ...headerForm, stage: e.target.value })}>
                  {['Discovery', 'Qualification', 'Trial', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 120, position: 'relative' }}>
                  <IndianRupee size={14} style={{ position: 'absolute', left: 10, color: 'var(--text-tertiary)' }} />
                  <input className="input-base" style={{ paddingLeft: 30, width: '100%' }} type="number" placeholder="MRR" value={headerForm.arr} onChange={e => setHeaderForm({ ...headerForm, arr: e.target.value })} />
                </div>
                <select className="input-base" style={{ flex: 1, minWidth: 120 }} value={headerForm.urgency} onChange={e => setHeaderForm({ ...headerForm, urgency: e.target.value })}>
                  <option value="low">Low Urgency</option>
                  <option value="medium">Medium Urgency</option>
                  <option value="high">High Urgency</option>
                  <option value="urgent">Urgent</option>
                </select>
                <select className="input-base" style={{ flex: 1, minWidth: 120 }} value={headerForm.owner_id} onChange={e => setHeaderForm({ ...headerForm, owner_id: e.target.value })}>
                  <option value="">Unassigned</option>
                  {(teamMembers || []).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-primary btn-sm" onClick={handleSaveHeader} disabled={saving}>
                  {saving ? 'Saving...' : <><Save size={13} /> Save</>}
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => setIsEditingHeader(false)}>Cancel</button>
              </div>
            </div>
          ) : (
            <>
              <div className="drawer-deal-logo" style={{ background: (deal.color || '#3b82f6') + '22', color: deal.color || '#3b82f6' }}>
                {deal.logo || deal.company?.charAt(0) || 'D'}
              </div>
              <div className="drawer-deal-info">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h2 className="drawer-deal-name">{deal.company || deal.title}</h2>
                  <button className="icon-btn" onClick={handleEditHeaderClick} title="Edit Deal">
                    <Edit3 size={14} />
                  </button>
                </div>
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
            </>
          )}
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
              {linkedContacts.length > 0 ? linkedContacts.map((c, i) => (
                <div key={c.id || i} className="contact-row">
                  <div className="avatar avatar-sm" style={{ background: `hsl(${(c.name?.charCodeAt(0) || i * 40) * 7}, 55%, 48%)`, color: '#fff', flexShrink: 0 }}>
                    {(c.name || '?').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="contact-info" style={{ flex: 1 }}>
                    <span className="contact-name">{c.name || '—'}</span>
                    <span className="contact-role" style={{ color: 'var(--text-tertiary)' }}>{c.designation || 'Contact'}</span>
                    {c.email && (
                      <span style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                        <Mail size={10} /> {c.email}
                      </span>
                    )}
                    {(c.whatsapp || c.phone) && (
                      <span style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Phone size={10} /> {c.whatsapp || c.phone}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {c.email && (
                      <a href={`mailto:${c.email}`} className="icon-btn" title={`Email ${c.name}`}><Mail size={13} /></a>
                    )}
                    {(c.whatsapp || c.phone) && (
                      <a href={`https://wa.me/${(c.whatsapp||c.phone).replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer" className="icon-btn" title="WhatsApp"><Phone size={13} /></a>
                    )}
                  </div>
                </div>
              )) : (
                <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
                  <User size={28} />
                  <h3>No Contacts Linked</h3>
                  <p>Create a Lead for this company to auto-generate a contact, or add one via the Contacts page.</p>
                </div>
              )}
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
              {/* Add task row */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                <input
                  className="input-base"
                  style={{ flex: 1, minWidth: 160 }}
                  placeholder="New task title..."
                  value={newTaskTitle}
                  onChange={e => setNewTaskTitle(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddTask()}
                />
                <input
                  className="input-base"
                  type="date"
                  style={{ width: 140 }}
                  value={newTaskDue}
                  onChange={e => setNewTaskDue(e.target.value)}
                />
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleAddTask}
                  disabled={taskSaving || !newTaskTitle.trim()}
                >
                  {taskSaving ? <Clock size={13} className="cc-spinner" /> : <><Plus size={13} /> Add</>}
                </button>
              </div>

              {/* Task list */}
              {dealTasks.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {dealTasks.map(task => (
                    <div
                      key={task.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '10px 12px', borderRadius: 8,
                        background: 'var(--bg-raised)',
                        border: '1px solid var(--bg-border)',
                        opacity: task.status === 'completed' ? 0.6 : 1,
                      }}
                    >
                      <button
                        onClick={() => handleToggleTask(task)}
                        style={{ flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                      >
                        {task.status === 'completed'
                          ? <CheckCircle2 size={18} style={{ color: 'var(--success)' }} />
                          : <CheckSquare size={18} style={{ color: 'var(--text-tertiary)' }} />}
                      </button>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, textDecoration: task.status === 'completed' ? 'line-through' : 'none', color: 'var(--text-primary)' }}>
                          {task.title}
                        </div>
                        {task.due && (
                          <div style={{ fontSize: 11, color: new Date(task.due) < new Date() && task.status !== 'completed' ? 'var(--danger)' : 'var(--text-tertiary)', marginTop: 2 }}>
                            <Clock size={10} style={{ display: 'inline', marginRight: 3 }} />
                            {format(new Date(task.due), 'MMM d, yyyy')}
                          </div>
                        )}
                      </div>
                      <button
                        className="prop-action-btn danger"
                        onClick={() => handleDeleteTask(task.id)}
                        title="Delete task"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <CheckSquare size={28} />
                  <h3>No tasks yet</h3>
                  <p>Add tasks above to track next steps for this deal</p>
                </div>
              )}
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
