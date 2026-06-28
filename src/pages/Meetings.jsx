// ============================================
// HUNTLO SALES OS — MEETINGS PAGE
// ============================================
import { useState } from 'react';
import { Calendar, Clock, Video, Users, ExternalLink, Search, Plus, Sparkles, X, AlertCircle, Loader, ChevronLeft, ChevronRight, CheckCircle2, Edit3, Save, Mail } from 'lucide-react';
import { format } from 'date-fns';
import useDataStore from '../store/useDataStore';
import { useDialog } from '../context/DialogContext';
import { queryGemini } from '../lib/gemini';
import './Meetings.css';

function MeetingCard({ meeting, onSelect, selected, ownerName }) {
  const date = new Date(meeting.date);
  const isPast = meeting.status === 'completed';
  const nameToUse = ownerName || 'Unknown';
  const initials = nameToUse.substring(0, 2).toUpperCase();

  return (
    <div className={`meeting-card ${selected ? 'selected' : ''} ${isPast ? 'past' : ''}`} onClick={() => onSelect(meeting)}>
      <div className="mc-time">
        <span className="mc-time-hour">{format(date, 'h:mm a')} IST</span>
        <span className="mc-time-date">{format(date, 'MMM d')}</span>
      </div>
      
      <div className="mc-main">
        <div className="mc-top">
          <span className="mc-title">{meeting.title}</span>
          <span className={`badge ${isPast ? 'badge-gray' : 'badge-blue'}`}>{meeting.status}</span>
        </div>
        <div className="mc-meta">
          <span className="badge badge-gray">{meeting.type}</span>
          <span className="mc-duration"><Clock size={11} /> {meeting.duration}m</span>
          <span className="mc-platform"><Video size={11} /> {meeting.platform}</span>
          {meeting.meeting_link && <span className="mc-link" style={{ color: 'var(--accent-blue)', fontSize: '10px' }}>🔗 Link Attached</span>}
        </div>
      </div>
      
      <div className="mc-owner" title={`Owner: ${nameToUse}`}>
        <div className="avatar avatar-sm" style={{ background: 'var(--accent-blue)', color: '#fff', fontSize: '10px' }}>
          {initials}
        </div>
      </div>
    </div>
  );
}

// ── Meeting Detail Panel (GAP 2 + GAP 4) ─────────────────────────────────────
function MeetingDetailPanel({ meeting, onClose, updateMeeting, deals }) {
  const [summaryForm, setSummaryForm] = useState({
    status: meeting.status || 'scheduled',
    notes: meeting.notes || '',
    next_action: meeting.next_action || '',
    ai_summary: meeting.ai_summary || '',
    pain_points: meeting.pain_points || [],
    objections: meeting.objections || [],
  });
  const [newPainPoint, setNewPainPoint] = useState('');
  const [newObjection, setNewObjection] = useState('');
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const deal = deals?.find(d => d.id === meeting.deal_id);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateMeeting(meeting.id, {
        status: summaryForm.status,
        notes: summaryForm.notes,
        next_action: summaryForm.next_action,
        ai_summary: summaryForm.ai_summary,
        pain_points: summaryForm.pain_points,
        objections: summaryForm.objections,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateAI = async () => {
    setAiLoading(true);
    try {
      const prompt = `Generate a concise professional meeting recap for a sales call.
Meeting: ${meeting.title}
Type: ${meeting.type}
Deal: ${deal?.title || 'Unknown'}
Pain Points: ${summaryForm.pain_points.join(', ') || 'Not captured'}
Objections: ${summaryForm.objections.join(', ') || 'None'}
Notes: ${summaryForm.notes || 'None'}
Next Action: ${summaryForm.next_action || 'Not set'}

Format as: Thank you note → Summary of discussion → Problems identified → Next steps agreed. Keep it under 200 words.`;
      const result = await queryGemini(prompt);
      setSummaryForm(f => ({ ...f, ai_summary: result }));
    } finally {
      setAiLoading(false);
    }
  };

  const handleSendRecap = () => {
    const subject = encodeURIComponent(`Meeting Recap — ${meeting.title}`);
    const body = encodeURIComponent(
`${summaryForm.ai_summary || `Thank you for the meeting today regarding ${meeting.title}.`}

---
Pain Points Discussed:
${summaryForm.pain_points.map(p => `• ${p}`).join('\n') || '• To be captured'}

Next Steps:
${summaryForm.next_action || '• To be agreed'}

Please let me know if I missed anything or if you have any questions.

Best,
[Your Name]`
    );
    window.open(`https://mail.google.com/mail/?view=cm&fs=1&su=${subject}&body=${body}`, '_blank');
  };

  const addPainPoint = (e) => {
    e.preventDefault();
    if (!newPainPoint.trim()) return;
    setSummaryForm(f => ({ ...f, pain_points: [...f.pain_points, newPainPoint.trim()] }));
    setNewPainPoint('');
  };

  const removePainPoint = (i) => setSummaryForm(f => ({ ...f, pain_points: f.pain_points.filter((_, idx) => idx !== i) }));

  const addObjection = (e) => {
    e.preventDefault();
    if (!newObjection.trim()) return;
    setSummaryForm(f => ({ ...f, objections: [...f.objections, newObjection.trim()] }));
    setNewObjection('');
  };

  const removeObjection = (i) => setSummaryForm(f => ({ ...f, objections: f.objections.filter((_, idx) => idx !== i) }));

  return (
    <div className="meeting-detail animate-slide-up">
      {/* Header */}
      <div className="md-header">
        <div style={{ flex: 1 }}>
          <h2 className="md-title">{meeting.title}</h2>
          <div className="md-meta">
            <span className="badge badge-gray">{meeting.type}</span>
            <span>{format(new Date(meeting.date), 'MMM d, yyyy • h:mm a')} IST</span>
            <span><Clock size={11} style={{ display: 'inline' }} /> {meeting.duration}m</span>
            {meeting.meeting_link && (
              <a href={meeting.meeting_link} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <ExternalLink size={12} /> Join
              </a>
            )}
          </div>
        </div>
        <button className="drawer-close" onClick={onClose}><X size={16} /></button>
      </div>

      {/* Mark Complete + Status */}
      <div className="md-section" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <select
          className="input-base"
          style={{ flex: 1 }}
          value={summaryForm.status}
          onChange={e => setSummaryForm(f => ({ ...f, status: e.target.value }))}
        >
          <option value="scheduled">Scheduled</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="rescheduled">Rescheduled</option>
        </select>
        <button
          className="btn btn-primary btn-sm"
          onClick={handleSave}
          disabled={saving}
          style={{ minWidth: 90 }}
        >
          {saved ? <><CheckCircle2 size={13} /> Saved</> : saving ? <Loader size={13} className="cc-spinner" /> : <><Save size={13} /> Save</>}
        </button>
        <button
          className="btn btn-ghost btn-sm"
          onClick={handleSendRecap}
          title="Open Gmail with pre-filled recap"
          style={{ gap: 5 }}
        >
          <Mail size={13} /> Send Recap
        </button>
      </div>

      {/* Notes */}
      <div className="md-section">
        <h3 className="md-section-title">Meeting Notes</h3>
        <textarea
          className="input-base"
          rows={4}
          style={{ resize: 'vertical', width: '100%' }}
          placeholder="Capture what was discussed, key context, observations..."
          value={summaryForm.notes}
          onChange={e => setSummaryForm(f => ({ ...f, notes: e.target.value }))}
        />
      </div>

      {/* Pain Points */}
      <div className="md-section">
        <h3 className="md-section-title">Pain Points Captured</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
          {summaryForm.pain_points.map((p, i) => (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(239,68,68,0.1)', color: '#ef4444', padding: '3px 8px', borderRadius: 20, fontSize: 12, fontWeight: 500 }}>
              {p}
              <button onClick={() => removePainPoint(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#ef4444', lineHeight: 1 }}><X size={10} /></button>
            </span>
          ))}
        </div>
        <form onSubmit={addPainPoint} style={{ display: 'flex', gap: 6 }}>
          <input
            className="input-base"
            style={{ flex: 1, fontSize: 12 }}
            placeholder="Add pain point and press Enter..."
            value={newPainPoint}
            onChange={e => setNewPainPoint(e.target.value)}
          />
          <button type="submit" className="btn btn-ghost btn-sm"><Plus size={13} /></button>
        </form>
      </div>

      {/* Objections */}
      <div className="md-section">
        <h3 className="md-section-title">Objections</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
          {summaryForm.objections.map((o, i) => (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(245,158,11,0.1)', color: '#d97706', padding: '3px 8px', borderRadius: 20, fontSize: 12, fontWeight: 500 }}>
              {o}
              <button onClick={() => removeObjection(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#d97706', lineHeight: 1 }}><X size={10} /></button>
            </span>
          ))}
        </div>
        <form onSubmit={addObjection} style={{ display: 'flex', gap: 6 }}>
          <input
            className="input-base"
            style={{ flex: 1, fontSize: 12 }}
            placeholder="Add objection and press Enter..."
            value={newObjection}
            onChange={e => setNewObjection(e.target.value)}
          />
          <button type="submit" className="btn btn-ghost btn-sm"><Plus size={13} /></button>
        </form>
      </div>

      {/* Next Action */}
      <div className="md-section">
        <h3 className="md-section-title">Next Action</h3>
        <input
          className="input-base"
          placeholder="What is the agreed next step?"
          value={summaryForm.next_action}
          onChange={e => setSummaryForm(f => ({ ...f, next_action: e.target.value }))}
        />
      </div>

      {/* AI Summary */}
      <div className="md-section">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <h3 className="md-section-title" style={{ margin: 0 }}>Recap / AI Summary</h3>
          <button className="btn btn-ghost btn-sm" onClick={handleGenerateAI} disabled={aiLoading} style={{ fontSize: 11, gap: 4 }}>
            <Sparkles size={12} /> {aiLoading ? 'Generating...' : 'Auto-Generate'}
          </button>
        </div>
        <textarea
          className="input-base"
          rows={5}
          style={{ resize: 'vertical', width: '100%', fontSize: 12 }}
          placeholder="AI-generated or manually written recap for the customer email..."
          value={summaryForm.ai_summary}
          onChange={e => setSummaryForm(f => ({ ...f, ai_summary: e.target.value }))}
        />
      </div>
    </div>
  );
}

export default function Meetings() {
  const { meetings, deals, createMeeting, updateMeeting, teamMembers } = useDataStore();
  const { showSuccess } = useDialog();
  const [selected, setSelected] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({ title: '', deal_id: '', type: 'Discovery', date: '', duration: 30, platform: 'Google Meet', meeting_link: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8; // showing 8 cards per page in the sidebar

  const sortedMeetings = [...meetings].sort((a, b) => new Date(b.date) - new Date(a.date));
  const totalPages = Math.ceil(sortedMeetings.length / itemsPerPage) || 1;
  const paginatedMeetings = sortedMeetings.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.date) return;
    setSaving(true);
    setError(null);
    try {
      await createMeeting({
        title: formData.title,
        deal_id: formData.deal_id || null,
        type: formData.type,
        date: new Date(formData.date).toISOString(),
        duration: Number(formData.duration),
        platform: formData.platform,
        meeting_link: formData.meeting_link,
        status: 'scheduled',
        attendees: [],
        pain_points: [],
        objections: []
      });
      setIsAdding(false);
      setFormData({ title: '', deal_id: '', type: 'Discovery', date: '', duration: 30, platform: 'Google Meet', meeting_link: '' });
    } catch (error) {
      console.error(error);
      setError(error.message || 'Failed to schedule meeting');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="meetings-page">
      <div className="page-header-row">
        <div>
          <h1 className="page-big-title">Meetings & Demos</h1>
          <p className="page-big-sub">Central hub for demos, discovery, and onboarding calls</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => { setIsAdding(true); setSelected(null); }}><Plus size={13} /> Schedule Meeting</button>
      </div>

      <div className="meetings-layout">
        <div className="meetings-list" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '4px' }}>
            {paginatedMeetings.map(m => (
              <MeetingCard key={m.id} meeting={m} selected={selected?.id === m.id} onSelect={(meeting) => { setSelected(meeting); setIsAdding(false); }} ownerName={teamMembers?.find(tm => tm.id === m.owner_id)?.name || 'Unknown User'} />
            ))}
            {meetings.length === 0 && (
               <div className="empty-state" style={{ marginTop: 40 }}>
                 <Video size={32} />
                 <h3>No meetings yet</h3>
                 <p>Schedule your first meeting.</p>
               </div>
            )}
          </div>
          
          {/* Pagination */}
          {meetings.length > 0 && (
            <div className="pagination-bar" style={{ padding: '12px 16px', borderRadius: '12px', marginTop: '12px', flexShrink: 0, justifyContent: 'center', background: 'var(--bg-surface)', border: '1px solid var(--bg-border)' }}>
              <div className="pagination-controls">
                <button 
                  className="pagination-btn" 
                  disabled={currentPage === 1} 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="pagination-info" style={{ fontSize: '12px' }}>Page {currentPage} of {totalPages}</span>
                <button 
                  className="pagination-btn" 
                  disabled={currentPage === totalPages} 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

        {selected && !isAdding && (
          <MeetingDetailPanel
            meeting={selected}
            onClose={() => setSelected(null)}
            updateMeeting={updateMeeting}
            deals={deals}
          />
        )}

        {isAdding && (
          <div className="meeting-detail animate-slide-up">
            <div className="md-header" style={{ marginBottom: 24 }}>
              <h2 className="md-title">Schedule Meeting</h2>
              <button className="drawer-close" style={{ position: 'absolute', top: 24, right: 24 }} onClick={() => setIsAdding(false)}><X size={16}/></button>
            </div>
            <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {error && (
                <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertCircle size={14} /> {error}
                </div>
              )}
              <div className="form-group">
                <label className="label">Meeting Title</label>
                <input className="input-base" autoFocus required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. Acme Corp Discovery" />
              </div>
              <div className="form-group">
                <label className="label">Related Deal</label>
                <select className="input-base" value={formData.deal_id} onChange={e => setFormData({...formData, deal_id: e.target.value})}>
                  <option value="">No Deal</option>
                  {deals.map(d => <option key={d.id} value={d.id}>{d.title}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="label">Meeting Type</label>
                <select className="input-base" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                  <option value="Discovery">Discovery</option>
                  <option value="Demo">Demo</option>
                  <option value="Success Review">Success Review</option>
                  <option value="Kickoff">Kickoff</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Negotiation">Negotiation</option>
                  <option value="Onboarding">Onboarding</option>
                  <option value="Business Review">Business Review</option>
                </select>
              </div>
              <div className="form-group">
                <label className="label">Date & Time</label>
                <input className="input-base" type="datetime-local" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="label">Duration (minutes)</label>
                <input className="input-base" type="number" required value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="label">Platform</label>
                <select className="input-base" value={formData.platform} onChange={e => setFormData({...formData, platform: e.target.value})}>
                  <option value="Google Meet">Google Meet</option>
                  <option value="Zoom">Zoom</option>
                  <option value="Microsoft Teams">Microsoft Teams</option>
                  <option value="In Person">In Person</option>
                </select>
              </div>
              <div className="form-group">
                <label className="label">Meeting Link</label>
                <input className="input-base" type="url" value={formData.meeting_link} onChange={e => setFormData({...formData, meeting_link: e.target.value})} placeholder="https://zoom.us/j/..." />
              </div>
              <button type="submit" className="btn btn-primary btn-md w-full" style={{ marginTop: 8 }} disabled={saving}>
                {saving ? <Loader size={14} className="cc-spinner" /> : 'Schedule Meeting'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
