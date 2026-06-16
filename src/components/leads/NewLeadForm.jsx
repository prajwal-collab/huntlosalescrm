// ============================================
// HUNTLO — NEW LEAD FORM
// Minimal data entry modal
// ============================================
import { useState } from 'react';
import { X, Building2, User, Zap } from 'lucide-react';
import useDataStore from '../../store/useDataStore';

const COMPANY_TYPES = ['Recruitment Agency', 'Staffing Firm', 'Startup', 'Enterprise', 'Other'];
const STAGES = [
  'New Lead', 'Researching', 'Ready for Outreach', 'Outreach Started',
  'Engaged', 'Qualified', 'Demo Scheduled', 'Demo Complete', 'Trial Started', 'Customer', 'Lost'
];
const PRIORITIES = ['High', 'Medium', 'Low'];

const defaultSignals = {
  hiring_activity: false,
  recruiter_hiring: false,
  funding_activity: false,
  linkedin_activity: false,
  job_posting_activity: false,
  company_growth: false,
};

export default function NewLeadForm({ onClose }) {
  const { createLead } = useDataStore();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    company_name: '',
    website: '',
    linkedin_url: '',
    industry: '',
    company_type: '',
    employee_size: '',
    recruiter_team_size: '',
    location: '',
    contact_name: '',
    designation: '',
    email: '',
    phone: '',
    contact_linkedin: '',
    stage: 'New Lead',
    signals: { ...defaultSignals },
    next_action: '',
    next_action_owner: '',
    next_action_due: '',
    next_action_priority: 'Medium',
    estimated_mrr: '',
    buying_potential: 'Unknown',
    notes: '',
  });

  const set = (key, value) => setForm(prev => ({ ...prev, [key]: value }));
  const setSignal = (key, value) =>
    setForm(prev => ({ ...prev, signals: { ...prev.signals, [key]: value } }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.company_name.trim()) {
      setError('Company name is required.');
      return;
    }
    if (!form.email.trim() && !form.phone.trim()) {
      setError('Please provide at least an Email or a Phone number.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        recruiter_team_size: form.recruiter_team_size ? parseInt(form.recruiter_team_size) : null,
        estimated_mrr: form.estimated_mrr ? parseInt(form.estimated_mrr) : 0,
        signal_score: 0,
        priority: 'Cold',
      };
      
      // Sanitize empty strings to avoid Postgres constraint errors
      if (!payload.company_type) delete payload.company_type;
      if (!payload.next_action_due) delete payload.next_action_due;
      if (!payload.next_action_owner) delete payload.next_action_owner;
      if (!payload.buying_potential) payload.buying_potential = 'Unknown';
      
      await createLead(payload);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create lead.');
    } finally {
      setSaving(false);
    }
  };

  const SIGNALS_CONFIG = [
    { key: 'hiring_activity',      emoji: '💼', label: 'Hiring Activity' },
    { key: 'recruiter_hiring',     emoji: '🎯', label: 'Recruiter Hiring' },
    { key: 'funding_activity',     emoji: '💰', label: 'Funding Activity' },
    { key: 'linkedin_activity',    emoji: '🔗', label: 'LinkedIn Activity' },
    { key: 'job_posting_activity', emoji: '📋', label: 'Job Postings Active' },
    { key: 'company_growth',       emoji: '📈', label: 'Company Growth' },
  ];

  return (
    <div className="lead-form-overlay" onClick={onClose}>
      <div className="lead-form-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">New Lead</span>
          <button className="drawer-close" onClick={onClose}><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'contents' }}>
          <div className="modal-body">
            {error && (
              <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--danger)' }}>
                {error}
              </div>
            )}

            {/* Company Info */}
            <div className="form-section-title">Company</div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Company Name *</label>
                <input className="form-input" placeholder="Acme Recruiting"
                  value={form.company_name}
                  onChange={e => set('company_name', e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Company Type</label>
                <select className="form-select"
                  value={form.company_type}
                  onChange={e => set('company_type', e.target.value)}>
                  <option value="">Select type…</option>
                  {COMPANY_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Website</label>
                <input className="form-input" placeholder="acmerecruiting.com"
                  value={form.website}
                  onChange={e => set('website', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">LinkedIn URL</label>
                <input className="form-input" placeholder="linkedin.com/company/…"
                  value={form.linkedin_url}
                  onChange={e => set('linkedin_url', e.target.value)} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Industry</label>
                <input className="form-input" placeholder="Recruitment, SaaS, Fintech…"
                  value={form.industry}
                  onChange={e => set('industry', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Location</label>
                <input className="form-input" placeholder="London, UK"
                  value={form.location}
                  onChange={e => set('location', e.target.value)} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Employee Size</label>
                <input className="form-input" placeholder="e.g. 50-200"
                  value={form.employee_size}
                  onChange={e => set('employee_size', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Recruiter Team Size</label>
                <input type="number" className="form-input" placeholder="e.g. 12"
                  value={form.recruiter_team_size}
                  onChange={e => set('recruiter_team_size', e.target.value)} />
              </div>
            </div>

            {/* Primary Contact */}
            <div className="form-section-title" style={{ marginTop: 4 }}>Primary Contact</div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Contact Name</label>
                <input className="form-input" placeholder="Jane Doe"
                  value={form.contact_name}
                  onChange={e => set('contact_name', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Designation</label>
                <input className="form-input" placeholder="Head of Talent"
                  value={form.designation}
                  onChange={e => set('designation', e.target.value)} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Email <span style={{fontSize:10, color:'var(--text-tertiary)'}}>(Required if no phone)</span></label>
                <input type="email" className="form-input" placeholder="jane@acme.com"
                  value={form.email}
                  onChange={e => set('email', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Phone / WhatsApp <span style={{fontSize:10, color:'var(--text-tertiary)'}}>(Required if no email)</span></label>
                <input className="form-input" placeholder="+44 7700 900000"
                  value={form.phone}
                  onChange={e => set('phone', e.target.value)} />
              </div>
            </div>

            {/* Signals */}
            <div className="form-section-title" style={{ marginTop: 4 }}>Initial Signals</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
              {SIGNALS_CONFIG.map(({ key, emoji, label }) => (
                <div key={key} 
                  onClick={() => setSignal(key, !form.signals[key])}
                  style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '7px 10px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 500,
                  border: `1px solid ${form.signals[key] ? 'rgba(34,197,94,0.3)' : 'var(--bg-border)'}`,
                  background: form.signals[key] ? 'rgba(34,197,94,0.06)' : 'var(--bg-base)',
                  color: form.signals[key] ? '#16a34a' : 'var(--text-secondary)',
                  transition: 'all 0.15s',
                }}>
                <label className="toggle-switch">
                  <input type="checkbox" checked={form.signals[key]}
                    onChange={e => setSignal(key, e.target.checked)} />
                  <span className="toggle-slider"></span>
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 14 }}>{emoji}</span>
                  {label}
                </div>
                </div>
              ))}
            </div>

            {/* Next Action */}
            <div className="form-section-title" style={{ marginTop: 4 }}>Next Action</div>
            <div className="form-group">
              <label className="form-label">Next Action *</label>
              <input className="form-input" placeholder="e.g. Send intro email, Connect on LinkedIn"
                value={form.next_action}
                onChange={e => set('next_action', e.target.value)} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Due Date</label>
                <input type="date" className="form-input"
                  value={form.next_action_due}
                  onChange={e => set('next_action_due', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select className="form-select"
                  value={form.next_action_priority}
                  onChange={e => set('next_action_priority', e.target.value)}>
                  {PRIORITIES.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
            </div>

            {/* Revenue */}
            <div className="form-section-title" style={{ marginTop: 4 }}>Revenue Signal</div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Est. MRR ($/mo)</label>
                <input type="number" className="form-input" placeholder="e.g. 500"
                  value={form.estimated_mrr}
                  onChange={e => set('estimated_mrr', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Stage</label>
                <select className="form-select"
                  value={form.stage}
                  onChange={e => set('stage', e.target.value)}>
                  {STAGES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={saving} style={{ gap: 6 }}>
              <Zap size={14} />{saving ? 'Creating…' : 'Create Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
