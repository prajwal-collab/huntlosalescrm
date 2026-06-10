// ============================================
// HUNTLO — ENROLL IN SEQUENCE MODAL
// World-class 3-step flow:
//   1. Confirm leads
//   2. Pick sequence
//   3. Configure & launch
// ============================================
import { useState, useEffect } from 'react';
import {
  X, ChevronRight, ChevronLeft, Mail, Clock, Zap,
  Check, AlertCircle, Globe, Users, Calendar, Send
} from 'lucide-react';
import useDataStore from '../../store/useDataStore';
import { useDialog } from '../../context/DialogContext';
import './EnrollSequence.css';

const AVATAR_COLORS = [
  '#3b82f6','#8b5cf6','#06b6d4','#f97316',
  '#22c55e','#ec4899','#6366f1','#14b8a6',
];

function avatarColor(name) {
  return AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];
}

const CHANNEL_ICON = {
  email:    <Mail size={16} />,
  linkedin: <Globe size={16} />,
  delay:    <Clock size={16} />,
};

const CHANNEL_BG = {
  email:    { background: 'rgba(59,130,246,0.12)', color: '#3b82f6' },
  linkedin: { background: 'rgba(14,165,233,0.12)', color: '#0ea5e9' },
  delay:    { background: 'rgba(148,163,184,0.12)', color: '#94a3b8' },
};

// ── Step indicator ───────────────────────────────────────────
function Steps({ current }) {
  const steps = ['Confirm Leads', 'Choose Sequence', 'Configure'];
  return (
    <div className="enroll-steps">
      {steps.map((label, i) => (
        <>
          <div key={label} className={`enroll-step${i < current ? ' done' : i === current ? ' active' : ''}`}>
            <div className="enroll-step-num">
              {i < current ? <Check size={10} /> : i + 1}
            </div>
            {label}
          </div>
          {i < steps.length - 1 && <div className="enroll-step-divider" key={`div-${i}`} />}
        </>
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────
export default function EnrollSequenceModal({ leads, onClose }) {
  const { sequences, enrollLeadsInSequence, fetchEmailSettings } = useDataStore();
  const { showError } = useDialog();
  const [step, setStep] = useState(0);
  const [selectedSeq, setSelectedSeq] = useState(null);
  const [emailConfig, setEmailConfig] = useState(null);
  const [config, setConfig] = useState({
    startDate: new Date().toISOString().split('T')[0],
    sendTime: '09:00',
    skipWeekends: true,
    dailyLimit: 50,
    personalise: true,
  });
  const [enrolling, setEnrolling] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Check if user has connected an email account
    fetchEmailSettings().then(data => {
      if (data && data.smtp_user) {
        setEmailConfig(data);
      }
    });
  }, [fetchEmailSettings]);

  const seqList = sequences || [];
  const chosenSeq = seqList.find(s => s.id === selectedSeq);
  const nodeCount = (chosenSeq?.nodes || []).filter(n => n.type !== 'delay').length;
  const lastDay = Math.max(...(chosenSeq?.nodes || [{ day: 1 }]).map(n => n.day || 0), 0) || 1;

  const handleEnroll = async () => {
    if (!selectedSeq) return;
    setEnrolling(true);
    try {
      if (typeof enrollLeadsInSequence === 'function') {
        await enrollLeadsInSequence({
          sequenceId: selectedSeq,
          leadIds: leads.map(l => l.id),
          config,
        });
      }
      setDone(true);
    } catch (err) {
      await showError('Enrollment Failed', err.message);
    } finally {
      setEnrolling(false);
    }
  };

  if (done) {
    return (
      <div className="enroll-overlay" onClick={onClose}>
        <div className="enroll-modal" onClick={e => e.stopPropagation()}>
          <div className="enroll-success">
            <div className="enroll-success-icon">✅</div>
            <div className="enroll-success-title">
              {leads.length} lead{leads.length > 1 ? 's' : ''} enrolled!
            </div>
            <p className="enroll-success-sub">
              They've been added to <strong>{chosenSeq?.name}</strong> and will start receiving outreach on {config.startDate}.
              {emailConfig && ` Sending from ${emailConfig.smtp_user}.`}
            </p>
            <button className="btn btn-primary btn-sm" style={{ marginTop: 8, gap: 6 }} onClick={onClose}>
              <Check size={14} /> Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="enroll-overlay" onClick={onClose}>
      <div className="enroll-modal" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="enroll-header">
          <div>
            <div className="enroll-title">
              {step === 0 ? 'Enroll in Sequence'
               : step === 1 ? 'Choose a Sequence'
               : 'Configure & Launch'}
            </div>
            <div className="enroll-subtitle">
              {leads.length} lead{leads.length > 1 ? 's' : ''} selected
            </div>
          </div>
          <button className="drawer-close" onClick={onClose}><X size={16} /></button>
        </div>

        {!emailConfig && (
          <div style={{ padding: '12px 24px', background: 'rgba(239,68,68,0.1)', borderBottom: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <AlertCircle size={16} color="var(--danger)" />
            <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>
              <strong>No email account connected!</strong> Go to <a href="/settings?tab=integrations" style={{ color: 'var(--accent-blue)', textDecoration: 'underline' }}>Settings &gt; Integrations</a> to connect your sender email.
            </div>
          </div>
        )}

        {/* Steps */}
        <Steps current={step} />

        {/* ─── STEP 0: Confirm leads ─── */}
        {step === 0 && (
          <div className="enroll-body">
            <div>
              <div className="seq-picker-label">Leads to be enrolled</div>
              <div className="enroll-leads-preview">
                {leads.map(lead => (
                  <div key={lead.id} className="enroll-lead-chip">
                    <div className="enroll-lead-avatar" style={{ background: avatarColor(lead.company_name || lead.name) }}>
                      {(lead.company_name || lead.contact_name || lead.name || '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="enroll-lead-info">
                      <span className="enroll-lead-name">{lead.company_name || lead.name}</span>
                      <span className="enroll-lead-sub">
                        {lead.contact_name && `${lead.contact_name} · `}
                        {lead.email || lead.contact_linkedin || 'No email set'}
                      </span>
                    </div>
                    <span className={`badge ${
                      lead.stage === 'Hot' || (lead.signal_score || 0) >= 70 ? 'badge-red'
                      : lead.stage === 'Warm' || (lead.signal_score || 0) >= 40 ? 'badge-yellow'
                      : 'badge-gray'
                    }`} style={{ fontSize: 10 }}>
                      {lead.stage || 'New Lead'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {leads.some(l => !l.email && !l.contact_linkedin) && (
              <div style={{ display: 'flex', gap: 8, padding: '10px 12px', borderRadius: 8, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', fontSize: 12.5, color: '#b45309' }}>
                <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                Some leads have no email or LinkedIn — those steps will be skipped.
              </div>
            )}
          </div>
        )}

        {/* ─── STEP 1: Pick sequence ─── */}
        {step === 1 && (
          <div className="enroll-body">
            {seqList.length === 0 ? (
              <div className="empty-state" style={{ marginTop: 20 }}>
                <Zap size={28} />
                <h3>No sequences yet</h3>
                <p>Create a sequence in the Sequences tab first.</p>
              </div>
            ) : (
              <div>
                <div className="seq-picker-label">Available sequences</div>
                <div className="seq-picker-list">
                  {seqList.map(seq => {
                    const steps = seq.nodes || [];
                    const emails = steps.filter(n => n.type === 'email').length;
                    const linkedIns = steps.filter(n => n.type === 'linkedin').length;
                    const lastDayNum = Math.max(...steps.map(n => n.day || 0), 0) || 1;
                    const enrolled = seq.enrolledCount || 0;

                    return (
                      <div
                        key={seq.id}
                        className={`seq-picker-card${selectedSeq === seq.id ? ' active' : ''}`}
                        onClick={() => setSelectedSeq(seq.id)}
                      >
                        <div className="seq-picker-icon" style={{ background: 'rgba(99,102,241,0.12)', color: '#6366f1' }}>
                          {seq.channel === 'LinkedIn' ? <Globe size={18} /> : <Mail size={18} />}
                        </div>
                        <div className="seq-picker-info">
                          <div className="seq-picker-name">{seq.name}</div>
                          <div className="seq-picker-meta">
                            {emails > 0 && (
                              <span className="seq-picker-badge" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
                                <Mail size={10} /> {emails} emails
                              </span>
                            )}
                            {linkedIns > 0 && (
                              <span className="seq-picker-badge" style={{ background: 'rgba(14,165,233,0.1)', color: '#0ea5e9' }}>
                                <Globe size={10} /> {linkedIns} LinkedIn
                              </span>
                            )}
                            <span className="seq-picker-badge" style={{ background: 'rgba(148,163,184,0.1)', color: '#94a3b8' }}>
                              <Clock size={10} /> {lastDayNum} days
                            </span>
                            {enrolled > 0 && (
                              <span className="seq-picker-badge" style={{ background: 'rgba(34,197,94,0.1)', color: '#16a34a' }}>
                                <Users size={10} /> {enrolled} enrolled
                              </span>
                            )}
                          </div>
                        </div>
                        <div style={{ width: 20, height: 20, borderRadius: '50%', border: `1.5px solid ${selectedSeq === seq.id ? 'var(--accent-blue-dim)' : 'var(--bg-border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', background: selectedSeq === seq.id ? 'var(--accent-blue-dim)' : 'transparent', transition: 'all 0.15s', flexShrink: 0 }}>
                          {selectedSeq === seq.id && <Check size={10} color="#fff" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── STEP 2: Configure ─── */}
        {step === 2 && (
          <div className="enroll-body">
            {/* Summary card */}
            <div className="enroll-review-card">
              <div className="enroll-review-row">
                <span className="enroll-review-key">Sequence</span>
                <span className="enroll-review-val">{chosenSeq?.name}</span>
              </div>
              <div className="enroll-review-row">
                <span className="enroll-review-key">Leads</span>
                <span className="enroll-review-val">{leads.length} contacts</span>
              </div>
              <div className="enroll-review-row">
                <span className="enroll-review-key">Touch points</span>
                <span className="enroll-review-val">{nodeCount} steps over {lastDay} days</span>
              </div>
            </div>

            <div className="enroll-config">
              <div>
                <div className="enroll-config-label">Start Date</div>
                <input
                  type="date"
                  className="enroll-input"
                  value={config.startDate}
                  onChange={e => setConfig({ ...config, startDate: e.target.value })}
                />
              </div>
              <div>
                <div className="enroll-config-label">Send Time (local)</div>
                <select
                  className="enroll-select"
                  value={config.sendTime}
                  onChange={e => setConfig({ ...config, sendTime: e.target.value })}
                >
                  {['07:00','08:00','09:00','10:00','11:00','12:00','14:00','15:00','16:00','17:00'].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <div className="enroll-config-label">Daily Send Limit</div>
                <input
                  type="number"
                  className="enroll-input"
                  value={config.dailyLimit}
                  min={1} max={500}
                  onChange={e => setConfig({ ...config, dailyLimit: +e.target.value })}
                />
              </div>

              <div className="enroll-toggle-row">
                <div className="enroll-toggle-info">
                  <span className="enroll-toggle-title">Skip weekends</span>
                  <span className="enroll-toggle-desc">Only send Mon – Fri</span>
                </div>
                <button
                  className={`toggle-switch${config.skipWeekends ? ' on' : ''}`}
                  onClick={() => setConfig({ ...config, skipWeekends: !config.skipWeekends })}
                />
              </div>

              <div className="enroll-toggle-row">
                <div className="enroll-toggle-info">
                  <span className="enroll-toggle-title">Personalise with AI</span>
                  <span className="enroll-toggle-desc">Auto-fill {"{{first_name}}"} and context</span>
                </div>
                <button
                  className={`toggle-switch${config.personalise ? ' on' : ''}`}
                  onClick={() => setConfig({ ...config, personalise: !config.personalise })}
                />
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="enroll-footer">
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => step === 0 ? onClose() : setStep(s => s - 1)}
          >
            {step === 0 ? 'Cancel' : <><ChevronLeft size={14} /> Back</>}
          </button>

          {step < 2 ? (
            <button
              className="btn btn-primary btn-sm"
              disabled={step === 1 && !selectedSeq}
              onClick={() => setStep(s => s + 1)}
              style={{ gap: 6 }}
            >
              {step === 0 ? 'Choose Sequence' : 'Configure'} <ChevronRight size={14} />
            </button>
          ) : (
            <button
              className="btn btn-primary btn-sm"
              onClick={handleEnroll}
              disabled={enrolling}
              style={{ gap: 6, background: '#16a34a', borderColor: '#16a34a' }}
            >
              {enrolling ? 'Enrolling…' : <><Send size={13} /> Launch Sequence</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
