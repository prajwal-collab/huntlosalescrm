// ============================================
// HUNTLO SALES OS — MEETINGS PAGE
// ============================================
import { useState } from 'react';
import { Calendar, Clock, Video, Users, ExternalLink, CalendarIcon, Search, Plus, Sparkles, X, AlertCircle, Loader, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import useDataStore from '../store/useDataStore';
import { useDialog } from '../context/DialogContext';
import './Meetings.css';

function MeetingCard({ meeting, onSelect, selected, ownerName }) {
  const date = new Date(meeting.date);
  const isPast = meeting.status === 'completed';
  const nameToUse = ownerName || 'Unknown';
  const initials = nameToUse.substring(0, 2).toUpperCase();

  return (
    <div className={`meeting-card ${selected ? 'selected' : ''} ${isPast ? 'past' : ''}`} onClick={() => onSelect(meeting)}>
      <div className="mc-time">
        <span className="mc-time-hour">{format(date, 'h:mm a')}</span>
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

export default function Meetings() {
  const { meetings, deals, createMeeting, teamMembers } = useDataStore();
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
        date: formData.date,
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
          <div className="meeting-detail animate-slide-up">
             <div className="md-header">
                <h2 className="md-title">{selected.title}</h2>
                <div className="md-meta">
                  <span className="badge badge-gray">{selected.type}</span>
                  <span>{format(new Date(selected.date), 'MMMM d, yyyy • h:mm a')}</span>
                  <span>{selected.duration} min</span>
                  <span>{selected.platform}</span>
                  {selected.meeting_link && (
                    <a href={selected.meeting_link} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <ExternalLink size={12} /> Join Meeting
                    </a>
                  )}
                </div>
             </div>

             {selected.aiSummary ? (
               <div className="ai-generated-box" style={{ margin: 'var(--space-4)' }}>
                  <div className="ai-generated-label"><Sparkles size={11} /> AI Meeting Summary</div>
                  <pre className="ai-generated-text">{selected.aiSummary}</pre>
               </div>
             ) : (
                <div className="md-section">
                   <button className="btn btn-primary btn-sm w-full" onClick={() => showSuccess('AI Summary', 'Gemini AI will generate a summary once you have meeting notes recorded.')}><Sparkles size={13} /> Generate AI Summary</button>
                </div>
             )}

             <div className="md-grid">
                <div className="md-section">
                  <h3 className="md-section-title">Attendees</h3>
                  <div className="md-attendees">
                    {(selected.attendees || []).map(a => (
                        <div key={a} className="md-attendee">
                          <div className="avatar avatar-sm" style={{ background: 'var(--bg-border)' }}>{(a || '').slice(0, 2).toUpperCase()}</div>
                          <span>{a}</span>
                        </div>
                      ))}
                    {(selected.attendees || []).length === 0 && <p className="text-tertiary text-sm">No attendees recorded</p>}
                    </div>
                </div>

                <div className="md-section">
                  <h3 className="md-section-title">Next Action</h3>
                  <div className="md-next-action">{selected.nextAction}</div>
                </div>
             </div>

             <div className="md-grid">
               <div className="md-section">
                 <h3 className="md-section-title">Pain Points</h3>
                  {(() => { const pts = selected.pain_points || selected.painPoints || []; return pts.length > 0 ? (<ul className="md-list">{pts.map((p, i) => <li key={i}>{p}</li>)}</ul>) : <p className="text-tertiary text-sm">None recorded</p>; })()}
               </div>

               <div className="md-section">
                 <h3 className="md-section-title">Objections</h3>
                  {(() => { const obs = selected.objections || []; return obs.length > 0 ? (<ul className="md-list">{obs.map((o, i) => <li key={i}>{o}</li>)}</ul>) : <p className="text-tertiary text-sm">None recorded</p>; })()}
               </div>
             </div>

              <div className="md-section">
               <h3 className="md-section-title">Notes</h3>
               <div className="ov-notes-text">{selected.notes || 'No notes added yet.'}</div>
             </div>
          </div>
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
                  <option value="Negotiation">Negotiation</option>
                  <option value="Onboarding">Onboarding</option>
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
