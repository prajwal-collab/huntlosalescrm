// ============================================
// HUNTLO — LEAD DRAWER
// Right-side context panel for lead details
// ============================================
import { useState, useRef } from 'react';
import {
  X, Mail, Phone, Link2, Globe, Edit3, Trash2,
  Save, AlertCircle, ExternalLink, CheckCircle2,
  Calendar, DollarSign, Target, Zap, TrendingUp,
  MessageCircle, Users, Building2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDialog } from '../../context/DialogContext';
import useAuthStore from '../../store/useAuthStore';
import { computeSignalScore } from '../../utils/leadScoring';

const STAGES = [
  'New Lead', 'Researching', 'Ready for Outreach', 'Outreach Started',
  'Engaged', 'Qualified', 'Demo Scheduled', 'Demo Complete',
  'Trial Started', 'Customer', 'Lost'
];

const SIGNALS_CONFIG = [
  { key: 'hiring_activity',      emoji: '💼', label: 'Hiring Activity' },
  { key: 'recruiter_hiring',     emoji: '🎯', label: 'Recruiter Hiring' },
  { key: 'funding_activity',     emoji: '💰', label: 'Funding Activity' },
  { key: 'linkedin_activity',    emoji: '🔗', label: 'LinkedIn Activity' },
  { key: 'job_posting_activity', emoji: '📋', label: 'Job Postings Active' },
  { key: 'company_growth',       emoji: '📈', label: 'Company Growth' },
];

const EMAIL_STATUSES  = ['Not Sent','Sent','Opened','Clicked','Replied','Bounced'];
const LI_STATUSES     = ['Not Sent','Requested','Connected','Messaged','Replied'];
const WA_STATUSES     = ['Not Sent','Sent','Delivered','Read','Replied'];
const REPLY_STATUSES  = ['No Reply','Positive','Neutral','Negative','Not Interested'];
const BUY_POTENTIALS  = ['High','Medium','Low','Unknown'];
const PRIORITIES      = ['High','Medium','Low'];

function Field({ label, value, children }) {
  return (
    <div className="d-field">
      <span className="d-field-label">{label}</span>
      {children || (
        <span className={`d-field-value${!value ? ' empty' : ''}`}>
          {value || 'Not set'}
        </span>
      )}
    </div>
  );
}

export default function LeadDrawer({ lead, onClose, onUpdate, onDelete }) {
  const { showConfirm } = useDialog();
  const { team, user } = useAuthStore();
  const [tab, setTab] = useState('intelligence');
  const [saving, setSaving] = useState(false);
  const saveTimeout = useRef(null);
  const [form, setForm] = useState({ ...lead });

  const isOwner = user?.id === lead.owner_id;
  const isAdmin = user?.email === 'prajwal@earlyjobs.in';
  const editMode = isOwner || isAdmin || !lead.owner_id;
  const signals = form.signals || {};

  const handleSignalToggle = (key) => {
    setForm(prev => ({
      ...prev,
      signals: { ...prev.signals, [key]: !prev.signals?.[key] }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdate(lead.id, form);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleStageChange = async (stage) => {
    setForm(prev => ({ ...prev, stage }));
    try { await onUpdate(lead.id, { stage }); } catch (_) {}
  };

  const set = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      onUpdate(lead.id, { [key]: value });
    }, 400);
  };

  // score computation inline
  const score = computeSignalScore(form);
  const scoreColor = score >= 70 ? '#dc2626' : score >= 35 ? '#d97706' : '#94a3b8';

  return (
    <div className="lead-drawer">
      {/* Drawer Header */}
      <div className="drawer-header">
        <div className="drawer-header-top">
          <div>
            <div className="drawer-company-name">{form.company_name}</div>
            <div className="drawer-contact">
              {form.contact_name || 'No contact'}{form.designation ? ` · ${form.designation}` : ''}
            </div>
            {/* Quick links */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
              {form.email && (
                <a href={`mailto:${form.email}`} style={{ color: 'var(--text-tertiary)', display: 'flex' }}>
                  <Mail size={14} />
                </a>
              )}
              {form.website && (
                <a href={form.website.startsWith('http') ? form.website : `https://${form.website}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ color: 'var(--text-tertiary)', display: 'flex' }}>
                  <Globe size={14} />
                </a>
              )}
              {form.linkedin_url && (
                <a href={form.linkedin_url} target="_blank" rel="noopener noreferrer"
                  style={{ color: 'var(--text-tertiary)', display: 'flex' }}>
                  <Link2 size={14} />
                </a>
              )}
              {form.phone && (
                <a href={`tel:${form.phone}`} style={{ color: 'var(--text-tertiary)', display: 'flex' }}>
                  <Phone size={14} />
                </a>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {isOwner && (
              <button onClick={async () => {
                const confirmed = await showConfirm(
                  'Delete Lead',
                  `Are you sure you want to permanently delete this lead from ${form.company_name || 'CRM'}?`
                );
                if (confirmed) onDelete(lead.id);
              }}
                className="btn btn-ghost btn-sm"
                style={{ fontSize: 12, color: 'var(--danger)', gap: 4 }}>
                <Trash2 size={13} /> Delete
              </button>
            )}
            <button onClick={onClose} className="drawer-close"><X size={16} /></button>
          </div>
        </div>

        {/* Stage Selector */}
        <div className="stage-select-wrap" style={{ paddingBottom: 12 }}>
          {STAGES.map(st => (
            <button
              key={st}
              className={`stage-btn${form.stage === st ? ' active' : ''}`}
              onClick={() => isOwner && handleStageChange(st)}
              style={{ cursor: isOwner ? 'pointer' : 'not-allowed', opacity: isOwner ? 1 : 0.7 }}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Tabs */}
        <div className="drawer-tabs">
          {[
            { id: 'intelligence', label: '⚡ Intelligence' },
            { id: 'qualification', label: '✅ Qualification' },
            { id: 'outreach', label: '📨 Outreach' },
            { id: 'activity', label: '🕰️ Activity' },
          ].map(t => (
            <button key={t.id} className={`drawer-tab${tab === t.id ? ' active' : ''}`}
              style={{ position: 'relative', borderBottom: 'none' }}
              onClick={() => setTab(t.id)}>
              {t.label}
              {tab === t.id && (
                <motion.div
                  layoutId="drawer-tab-indicator"
                  style={{
                    position: 'absolute',
                    bottom: -2,
                    left: 0,
                    right: 0,
                    height: 2,
                    background: 'var(--accent-blue)',
                    borderRadius: '2px 2px 0 0'
                  }}
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Drawer Body */}
      <div className="drawer-body">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}
          >
            {/* ── INTELLIGENCE TAB ── */}
            {tab === 'intelligence' && (
              <>
                {/* Score Ring */}
            <div className="score-ring-wrap">
              <div>
                <div className="score-number" style={{ color: scoreColor }}>{score}</div>
                <div className="score-label">Signal Score</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ height: 8, background: 'var(--bg-border)', borderRadius: 4, overflow: 'hidden', marginBottom: 8 }}>
                  <div style={{ height: '100%', width: `${score}%`, background: scoreColor, borderRadius: 4, transition: 'width 0.4s ease' }} />
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                  Priority: <strong style={{ color: scoreColor }}>
                    {score >= 70 ? '🔥 Hot' : score >= 35 ? '🌡 Warm' : '❄️ Cold'}
                  </strong>
                </div>
                {form.estimated_mrr > 0 && (
                  <div style={{ fontSize: 12, color: '#16a34a', fontWeight: 600, marginTop: 4 }}>
                    💰 ${form.estimated_mrr.toLocaleString()}/mo potential
                  </div>
                )}
              </div>
            </div>

            {/* Next Action Panel */}
            <div className="d-section">
              <div className="d-section-label">Next Action</div>
              {form.next_action ? (
                <div className="next-action-panel">
                  {editMode ? (
                    <>
                      <input className="d-input" placeholder="Next action…"
                        value={form.next_action || ''}
                        onChange={e => set('next_action', e.target.value)} />
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        <input type="date" className="d-input"
                          value={form.next_action_due || ''}
                          onChange={e => set('next_action_due', e.target.value)} />
                        <select className="d-select"
                          value={form.next_action_priority || 'Medium'}
                          onChange={e => set('next_action_priority', e.target.value)}>
                          {PRIORITIES.map(p => <option key={p}>{p}</option>)}
                        </select>
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>
                        {form.next_action}
                      </div>
                      <div style={{ display: 'flex', gap: 12, fontSize: 12 }}>
                        {form.next_action_due && (
                          <span style={{ color: new Date(form.next_action_due) < new Date() ? 'var(--danger)' : 'var(--text-secondary)' }}>
                            📅 {new Date(form.next_action_due).toLocaleDateString()}
                          </span>
                        )}
                        {form.next_action_owner && (
                          <span style={{ color: 'var(--text-secondary)' }}>👤 {form.next_action_owner}</span>
                        )}
                        <span className={`badge ${form.next_action_priority === 'High' ? 'badge-red' : form.next_action_priority === 'Low' ? 'badge-gray' : 'badge-yellow'}`}>
                          {form.next_action_priority || 'Medium'}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="next-action-warning">
                  No next action set.
                </div>
              )}
              {editMode && !form.next_action && (
                <input className="d-input" placeholder="Set next action…"
                  value={form.next_action || ''}
                  onChange={e => set('next_action', e.target.value)} />
              )}
            </div>

            {/* Signals Grid */}
            <div className="d-section">
              <div className="d-section-label">Signal Intelligence</div>
              <div className="signal-grid">
                {SIGNALS_CONFIG.map(({ key, emoji, label }) => (
                  <div
                    key={key}
                    className={`signal-item${signals[key] ? ' active' : ''}`}
                    onClick={() => editMode && handleSignalToggle(key)}
                    style={{ cursor: editMode ? 'pointer' : 'default' }}
                  >
                    <span style={{ fontSize: 16 }}>{emoji}</span>
                    <span>{label}</span>
                    {signals[key] && <CheckCircle2 size={12} style={{ marginLeft: 'auto', color: '#16a34a' }} />}
                  </div>
                ))}
              </div>
              {editMode && (
                <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>
                  Click signals to toggle them on/off.
                </p>
              )}
            </div>

            {/* Company Info */}
            <div className="d-section">
              <div className="d-section-label">Coordination & Details</div>
              <Field label="Owner">
                {editMode ? (
                  <select className="d-select" value={form.owner_id || ''} onChange={e => set('owner_id', e.target.value)}>
                    <option value="">Unassigned</option>
                    {team.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                ) : (
                  <span className="d-field-value" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {(() => {
                      const owner = team.find(t => t.id === form.owner_id);
                      if (!owner) return <span style={{ color: 'var(--text-tertiary)' }}>Unassigned</span>;
                      return (
                        <>
                          <div className="avatar" style={{ width: 16, height: 16, fontSize: 8, background: owner.color || '#3b82f6', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {owner.initials}
                          </div>
                          {owner.name}
                        </>
                      );
                    })()}
                  </span>
                )}
              </Field>
              <Field label="Industry" value={form.industry} />
              <Field label="Company Type" value={form.company_type} />
              <Field label="Employee Size" value={form.employee_size} />
              <Field label="Recruiter Team" value={form.recruiter_team_size ? `${form.recruiter_team_size} recruiters` : null} />
              <Field label="Location" value={form.location} />
              {form.website && (
                <Field label="Website">
                  <a href={form.website.startsWith('http') ? form.website : `https://${form.website}`}
                    target="_blank" rel="noopener noreferrer"
                    style={{ color: 'var(--accent-blue-dim)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
                    {form.website} <ExternalLink size={11} />
                  </a>
                </Field>
              )}
            </div>
          </>
        )}

        {/* ── QUALIFICATION TAB ── */}
        {tab === 'qualification' && (
          <>
            <div className="d-section">
              <div className="d-section-label">ICP & Revenue</div>
              <Field label="ICP Match Score">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1, height: 6, background: 'var(--bg-border)', borderRadius: 3, overflow: 'hidden', maxWidth: 80 }}>
                    <div style={{ height: '100%', width: `${form.icp_match_score || 0}%`, background: 'var(--accent-blue)', borderRadius: 3 }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-blue-dim)' }}>
                    {form.icp_match_score || 0}/100
                  </span>
                </div>
              </Field>
              <Field label="Buying Potential">
                {editMode ? (
                  <select className="d-select" value={form.buying_potential || 'Unknown'}
                    onChange={e => set('buying_potential', e.target.value)}>
                    {BUY_POTENTIALS.map(p => <option key={p}>{p}</option>)}
                  </select>
                ) : (
                  <span className={`badge ${
                    form.buying_potential === 'High' ? 'badge-green' :
                    form.buying_potential === 'Medium' ? 'badge-yellow' :
                    form.buying_potential === 'Low' ? 'badge-gray' : 'badge-gray'
                  }`}>{form.buying_potential || 'Unknown'}</span>
                )}
              </Field>
              <Field label="Est. MRR">
                {editMode ? (
                  <input type="number" className="d-input" placeholder="Monthly revenue potential"
                    value={form.estimated_mrr || ''}
                    onChange={e => set('estimated_mrr', parseInt(e.target.value) || 0)} />
                ) : (
                  <span style={{ fontWeight: 700, color: '#16a34a', fontSize: 14 }}>
                    {form.estimated_mrr ? `$${form.estimated_mrr.toLocaleString()}/mo` : 'Not estimated'}
                  </span>
                )}
              </Field>
              <Field label="ICP Score">
                {editMode ? (
                  <input type="number" min="0" max="100" className="d-input"
                    value={form.icp_match_score || 0}
                    onChange={e => set('icp_match_score', parseInt(e.target.value) || 0)} />
                ) : <span className="d-field-value">{form.icp_match_score || 0}/100</span>}
              </Field>
            </div>

            <div className="d-section">
              <div className="d-section-label">Pain Points & Workflow</div>
              <Field label="Pain Point">
                {editMode ? (
                  <textarea className="d-textarea" placeholder="What problem do they have?"
                    value={form.pain_point || ''}
                    onChange={e => set('pain_point', e.target.value)} />
                ) : <span className={`d-field-value${!form.pain_point ? ' empty' : ''}`}>{form.pain_point || 'Not captured'}</span>}
              </Field>
              <Field label="Current Workflow">
                {editMode ? (
                  <textarea className="d-textarea" placeholder="How do they currently work?"
                    value={form.current_workflow || ''}
                    onChange={e => set('current_workflow', e.target.value)} />
                ) : <span className={`d-field-value${!form.current_workflow ? ' empty' : ''}`}>{form.current_workflow || 'Not captured'}</span>}
              </Field>
              <Field label="Current Tools">
                {editMode ? (
                  <input className="d-input" placeholder="Existing tools (e.g. Bullhorn, Workday)"
                    value={form.current_tools || ''}
                    onChange={e => set('current_tools', e.target.value)} />
                ) : <span className={`d-field-value${!form.current_tools ? ' empty' : ''}`}>{form.current_tools || 'Unknown'}</span>}
              </Field>
            </div>

            <div className="d-section">
              <div className="d-section-label">Volume & Team</div>
              <Field label="Hiring Volume">
                {editMode ? (
                  <input className="d-input" placeholder="e.g. 50-100 hires/year"
                    value={form.hiring_volume || ''}
                    onChange={e => set('hiring_volume', e.target.value)} />
                ) : <span className={`d-field-value${!form.hiring_volume ? ' empty' : ''}`}>{form.hiring_volume || 'Unknown'}</span>}
              </Field>
              <Field label="Team Size" value={form.team_size} />
            </div>

            <div className="d-section">
              <div className="d-section-label">Notes</div>
              {editMode ? (
                <textarea className="d-textarea" placeholder="Add notes…"
                  value={form.notes || ''}
                  onChange={e => set('notes', e.target.value)} />
              ) : (
                <span className={`d-field-value${!form.notes ? ' empty' : ''}`}>
                  {form.notes || 'No notes yet'}
                </span>
              )}
            </div>
          </>
        )}

        {/* ── OUTREACH TAB ── */}
        {tab === 'outreach' && (
          <>
            <div className="d-section">
              <div className="d-section-label">Outreach Channels</div>
              <div className="outreach-channels">
                {/* Email */}
                <div className="channel-row">
                  <div className="channel-name"><Mail size={14} />Email</div>
                  {editMode ? (
                    <select className="d-select" style={{ width: 140 }}
                      value={form.email_status || 'Not Sent'}
                      onChange={e => set('email_status', e.target.value)}>
                      {EMAIL_STATUSES.map(s => <option key={s}>{s}</option>)}
                    </select>
                  ) : (
                    <span className={`badge ${
                      form.email_status === 'Replied' ? 'badge-green' :
                      form.email_status === 'Opened' || form.email_status === 'Clicked' ? 'badge-blue' :
                      form.email_status === 'Bounced' ? 'badge-red' :
                      form.email_status === 'Sent' ? 'badge-yellow' : 'badge-gray'
                    }`}>{form.email_status || 'Not Sent'}</span>
                  )}
                </div>
                {/* LinkedIn */}
                <div className="channel-row">
                  <div className="channel-name"><Link2 size={14} />LinkedIn</div>
                  {editMode ? (
                    <select className="d-select" style={{ width: 140 }}
                      value={form.linkedin_status || 'Not Sent'}
                      onChange={e => set('linkedin_status', e.target.value)}>
                      {LI_STATUSES.map(s => <option key={s}>{s}</option>)}
                    </select>
                  ) : (
                    <span className={`badge ${
                      form.linkedin_status === 'Replied' ? 'badge-green' :
                      form.linkedin_status === 'Connected' ? 'badge-blue' :
                      form.linkedin_status === 'Messaged' ? 'badge-yellow' : 'badge-gray'
                    }`}>{form.linkedin_status || 'Not Sent'}</span>
                  )}
                </div>
                {/* WhatsApp */}
                <div className="channel-row">
                  <div className="channel-name"><MessageCircle size={14} />WhatsApp</div>
                  {editMode ? (
                    <select className="d-select" style={{ width: 140 }}
                      value={form.whatsapp_status || 'Not Sent'}
                      onChange={e => set('whatsapp_status', e.target.value)}>
                      {WA_STATUSES.map(s => <option key={s}>{s}</option>)}
                    </select>
                  ) : (
                    <span className={`badge ${
                      form.whatsapp_status === 'Replied' ? 'badge-green' :
                      form.whatsapp_status === 'Read' ? 'badge-blue' :
                      form.whatsapp_status === 'Sent' ? 'badge-yellow' : 'badge-gray'
                    }`}>{form.whatsapp_status || 'Not Sent'}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="d-section">
              <div className="d-section-label">Engagement Status</div>
              <Field label="Reply Status">
                {editMode ? (
                  <select className="d-select"
                    value={form.reply_status || 'No Reply'}
                    onChange={e => set('reply_status', e.target.value)}>
                    {REPLY_STATUSES.map(s => <option key={s}>{s}</option>)}
                  </select>
                ) : (
                  <span className={`badge ${
                    form.reply_status === 'Positive' ? 'badge-green' :
                    form.reply_status === 'Neutral' ? 'badge-blue' :
                    form.reply_status === 'Negative' || form.reply_status === 'Not Interested' ? 'badge-red' : 'badge-gray'
                  }`}>{form.reply_status || 'No Reply'}</span>
                )}
              </Field>
              <Field label="Positive Interest">
                {editMode ? (
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13 }}>
                    <input type="checkbox"
                      checked={!!form.positive_interest}
                      onChange={e => set('positive_interest', e.target.checked)} />
                    Shown Positive Interest
                  </label>
                ) : (
                  <span className={`badge ${form.positive_interest ? 'badge-green' : 'badge-gray'}`}>
                    {form.positive_interest ? '✅ Yes' : 'No'}
                  </span>
                )}
              </Field>
              <Field label="Demo Requested">
                {editMode ? (
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13 }}>
                    <input type="checkbox"
                      checked={!!form.demo_requested}
                      onChange={e => set('demo_requested', e.target.checked)} />
                    Demo Requested
                  </label>
                ) : (
                  <span className={`badge ${form.demo_requested ? 'badge-purple' : 'badge-gray'}`}>
                    {form.demo_requested ? '🎯 Requested' : 'Not Yet'}
                  </span>
                )}
              </Field>
            </div>

            <div className="d-section">
              <div className="d-section-label">Dates & Sources</div>
              <Field label="First Contact">
                {editMode ? (
                  <input type="date" className="d-input"
                    value={form.first_contact_date || ''}
                    onChange={e => set('first_contact_date', e.target.value)} />
                ) : <span className={`d-field-value${!form.first_contact_date ? ' empty' : ''}`}>
                  {form.first_contact_date ? new Date(form.first_contact_date).toLocaleDateString() : 'Not set'}
                </span>}
              </Field>
              <Field label="Last Contact">
                {editMode ? (
                  <input type="date" className="d-input"
                    value={form.last_contact_date || ''}
                    onChange={e => set('last_contact_date', e.target.value)} />
                ) : <span className={`d-field-value${!form.last_contact_date ? ' empty' : ''}`}>
                  {form.last_contact_date ? new Date(form.last_contact_date).toLocaleDateString() : 'Not set'}
                </span>}
              </Field>
              <Field label="Campaign Type">
                {editMode ? (
                  <input className="d-input" placeholder="e.g. Cold Outbound"
                    value={form.campaign_type || ''}
                    onChange={e => set('campaign_type', e.target.value)} />
                ) : <span className={`d-field-value${!form.campaign_type ? ' empty' : ''}`}>{form.campaign_type || 'Not set'}</span>}
              </Field>
              <Field label="Outreach Channel">
                {editMode ? (
                  <input className="d-input" placeholder="e.g. LinkedIn Outbound"
                    value={form.outreach_channel || ''}
                    onChange={e => set('outreach_channel', e.target.value)} />
                ) : <span className={`d-field-value${!form.outreach_channel ? ' empty' : ''}`}>{form.outreach_channel || 'Not set'}</span>}
              </Field>
            </div>
          </>
        )}

        {/* ── ACTIVITY TAB ── */}
        {tab === 'activity' && (
          <div className="d-section" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div className="activity-composer" style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-border)', borderRadius: 8, padding: 12, marginBottom: 16 }}>
              <textarea 
                className="seamless-textarea" 
                placeholder="Type a note... Use @ to mention team members" 
                style={{ minHeight: 60, width: '100%', border: 'none', background: 'transparent', outline: 'none', fontSize: 13, resize: 'none' }}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    const note = e.target.value.trim();
                    if (note) {
                      const newActivity = { 
                        id: Date.now(), 
                        type: 'note', 
                        content: note, 
                        author: user?.name || 'You', 
                        timestamp: new Date().toISOString() 
                      };
                      const updatedActivities = [newActivity, ...(form.activities || [])];
                      set('activities', updatedActivities);
                      e.target.value = '';
                    }
                  }
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, borderTop: '1px dashed var(--bg-border)', paddingTop: 8 }}>
                <div style={{ display: 'flex', gap: 8, color: 'var(--text-tertiary)' }}>
                  <button className="btn btn-ghost btn-sm" style={{ padding: '2px 6px', fontSize: 11, height: 'auto', gap: 4 }}><Users size={12} /> Mention</button>
                  <button className="btn btn-ghost btn-sm" style={{ padding: '2px 6px', fontSize: 11, height: 'auto', gap: 4 }}><AlertCircle size={12} /> Log action</button>
                </div>
                <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Press <strong>Enter</strong> to save</span>
              </div>
            </div>

            <div className="activity-timeline" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {(form.activities || []).length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 12, padding: '20px 0' }}>
                  No activity or notes yet.
                </div>
              ) : (
                form.activities.map(act => (
                  <div key={act.id} style={{ display: 'flex', gap: 12 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--bg-surface)', border: '1px solid var(--bg-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0 }}>
                      {act.type === 'note' ? '📝' : '⚡'}
                    </div>
                    <div style={{ flex: 1, background: 'var(--bg-base)', border: '1px solid var(--bg-border)', borderRadius: 8, padding: '10px 12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 600 }}>{act.author}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{new Date(act.timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' })}</span>
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                        {act.content.split(/(@\w+)/g).map((part, i) => 
                          part.startsWith('@') ? <span key={i} style={{ color: 'var(--accent-blue)', fontWeight: 600, background: 'rgba(37, 99, 235, 0.1)', padding: '2px 4px', borderRadius: 4 }}>{part}</span> : part
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
              {/* Automatic creation audit log */}
              <div style={{ display: 'flex', gap: 12, opacity: 0.7 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0 }}>
                  🌱
                </div>
                <div style={{ flex: 1, padding: '4px 0', fontSize: 12, color: 'var(--text-tertiary)' }}>
                  Lead automatically added to pipeline {form.created_at ? new Date(form.created_at).toLocaleDateString() : 'initially'}
                </div>
              </div>
            </div>
          </div>
        )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
