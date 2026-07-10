import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, CheckCircle, Clock, Plus, Users, FileText, Settings, Target, DownloadCloud } from 'lucide-react';
import useDataStore from '../store/useDataStore';
import { format, parseISO } from 'date-fns';
import LumaSheetsSyncModal from '../components/webinars/LumaSheetsSyncModal';
import './Webinars.css';

export default function WebinarDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { 
    webinars, 
    tasks, 
    webinar_registrants, 
    contacts, 
    updateWebinar, 
    updateTask, 
    updateWebinarRegistrant,
    webinar_content_assets,
    webinar_follow_ups
  } = useDataStore();

  const webinar = webinars.find(w => w.id === id);
  const [activeTab, setActiveTab] = useState('registrants');
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);

  // Related data
  const webinarTasks = useMemo(() => tasks.filter(t => t.webinar_id === id), [tasks, id]);
  const registrants = useMemo(() => webinar_registrants.filter(r => r.webinar_id === id), [webinar_registrants, id]);
  
  if (!webinar) {
    return <div style={{ padding: 24 }}>Webinar not found.</div>;
  }

  const handleStatusChange = async (e) => {
    try {
      await updateWebinar(id, { status: e.target.value });
    } catch (err) { console.error(err); }
  };

  const toggleTask = async (taskId, currentStatus) => {
    try {
      await updateTask(taskId, { status: currentStatus === 'completed' ? 'pending' : 'completed' });
    } catch (err) { console.error(err); }
  };

  const handleDemoRequest = async (registrantId, currentVal) => {
    try {
      await updateWebinarRegistrant(registrantId, { demo_requested: !currentVal });
    } catch (err) { console.error(err); }
  };

  return (
    <div className="webinars-page">
      {/* Header */}
      <div className="page-header-row" style={{ padding: '24px 24px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-ghost" onClick={() => navigate('/webinars')} style={{ padding: 4 }}>
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="page-big-title" style={{ fontSize: 22, margin: 0 }}>{webinar.title}</h1>
            <div style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 4 }}>
              {format(parseISO(webinar.date_time), 'MMM d, yyyy h:mm a')} • {webinar.segment || 'General Segment'}
            </div>
          </div>
        </div>
        <div className="page-header-actions" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <select className="input-base" style={{ width: 140 }} value={webinar.status} onChange={handleStatusChange}>
            <option value="Planned">Planned</option>
            <option value="In Promotion">In Promotion</option>
            <option value="Live">Live</option>
            <option value="Follow-up">Follow-up</option>
            <option value="Closed">Closed</option>
            <option value="Archived">Archived</option>
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="apollo-tabs-bar" style={{ padding: '0 24px' }}>
        <div className={`apollo-tab ${activeTab === 'registrants' ? 'active' : ''}`} onClick={() => setActiveTab('registrants')}>
          <Users size={14} style={{ marginRight: 6 }}/> Registrants ({registrants.length})
        </div>
        <div className={`apollo-tab ${activeTab === 'tasks' ? 'active' : ''}`} onClick={() => setActiveTab('tasks')}>
          <CheckCircle size={14} style={{ marginRight: 6 }}/> Tasks ({webinarTasks.length})
        </div>
        <div className={`apollo-tab ${activeTab === 'assets' ? 'active' : ''}`} onClick={() => setActiveTab('assets')}>
          <FileText size={14} style={{ marginRight: 6 }}/> Content Assets
        </div>
        <div className={`apollo-tab ${activeTab === 'funnel' ? 'active' : ''}`} onClick={() => setActiveTab('funnel')}>
          <Target size={14} style={{ marginRight: 6 }}/> Funnel & Follow-ups
        </div>
      </div>

      {/* Tab Content */}
      <div className="webinars-content" style={{ padding: 24, overflowY: 'auto' }}>
        
        {activeTab === 'registrants' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
              <button className="btn btn-primary btn-sm" onClick={() => setIsSyncModalOpen(true)}>
                <DownloadCloud size={14} /> Sync from Luma / Sheets
              </button>
            </div>
            <table className="apollo-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Company</th>
                  <th>Lead Score</th>
                  <th>Attended</th>
                  <th>Demo Requested</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {registrants.length === 0 ? (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: 24, color: 'var(--text-tertiary)' }}>No registrants yet.</td></tr>
                ) : registrants.map(reg => {
                  const contact = contacts.find(c => c.id === reg.contact_id);
                  return (
                    <tr key={reg.id}>
                      <td>{contact?.name || contact?.email || 'Unknown Contact'}</td>
                      <td>{contact?.company_name || '—'}</td>
                      <td>
                        <span className="badge badge-gray">{reg.lead_score}</span>
                      </td>
                      <td>{reg.attended ? 'Yes' : 'No'}</td>
                      <td>
                        <button 
                          className={`btn btn-sm ${reg.demo_requested ? 'btn-primary' : 'btn-ghost'}`}
                          onClick={() => handleDemoRequest(reg.id, reg.demo_requested)}
                        >
                          {reg.demo_requested ? 'Requested (Deal Created)' : 'Mark as Requested'}
                        </button>
                      </td>
                      <td>
                        <button className="btn btn-ghost btn-sm">View Details</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="tasks-list" style={{ maxWidth: 800 }}>
            {webinarTasks.map(task => {
              const isCompleted = task.status === 'completed';
              return (
                <div key={task.id} className={`task-row ${isCompleted ? 'completed' : ''}`} style={{ padding: 12, border: '1px solid var(--bg-border)', marginBottom: 8, borderRadius: 6, display: 'flex', alignItems: 'center' }}>
                  <button
                    className={`task-checkbox ${isCompleted ? 'checked' : ''}`}
                    onClick={() => toggleTask(task.id, task.status)}
                    style={{ marginRight: 12 }}
                  >
                    {isCompleted && <CheckCircle size={12} strokeWidth={3} />}
                  </button>
                  <div style={{ flex: 1 }}>
                    <div style={{ textDecoration: isCompleted ? 'line-through' : 'none', opacity: isCompleted ? 0.6 : 1, fontWeight: 500 }}>
                      {task.title}
                    </div>
                  </div>
                  <div style={{ color: 'var(--text-tertiary)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={12} /> {format(parseISO(task.due), 'MMM d')}
                  </div>
                </div>
              );
            })}
            {webinarTasks.length === 0 && (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-tertiary)' }}>No tasks for this webinar.</div>
            )}
          </div>
        )}

        {activeTab === 'assets' && (
          <div className="assets-list" style={{ maxWidth: 800 }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
              <button className="btn btn-primary btn-sm">
                <Plus size={14} /> Add Asset
              </button>
            </div>
            {webinar_content_assets.filter(a => a.webinar_id === id).length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-tertiary)', background: 'var(--bg-surface)', border: '1px dashed var(--bg-border)', borderRadius: 8 }}>
                <FileText size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                <h3>No Content Assets</h3>
                <p style={{ marginTop: 8 }}>Add slide decks, worksheets, or lead magnets associated with this webinar.</p>
              </div>
            ) : (
              <table className="apollo-table">
                <thead>
                  <tr>
                    <th>Asset Name</th>
                    <th>Type</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {webinar_content_assets.filter(a => a.webinar_id === id).map(asset => (
                    <tr key={asset.id}>
                      <td style={{ fontWeight: 500 }}>{asset.title || asset.name}</td>
                      <td><span className="badge badge-gray">{asset.type || 'Document'}</span></td>
                      <td>
                        <button className="btn btn-ghost btn-sm">View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === 'funnel' && (
          <div className="funnel-list" style={{ maxWidth: 800 }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
              <button className="btn btn-primary btn-sm">
                <Plus size={14} /> Add Follow-up Step
              </button>
            </div>
            {webinar_follow_ups.filter(f => f.webinar_id === id).length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-tertiary)', background: 'var(--bg-surface)', border: '1px dashed var(--bg-border)', borderRadius: 8 }}>
                <Target size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                <h3>No Follow-up Sequence</h3>
                <p style={{ marginTop: 8 }}>Create an automated email or task sequence for attendees and no-shows.</p>
              </div>
            ) : (
              <div className="follow-up-sequence" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {webinar_follow_ups.filter(f => f.webinar_id === id).map((step, idx) => (
                  <div key={step.id} style={{ padding: 16, border: '1px solid var(--bg-border)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      {idx + 1}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600 }}>{step.title || step.subject || 'Follow-up Step'}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>
                        {step.type === 'email' ? '📧 Email Automaton' : '✅ Manual Task'} • Day {step.day_offset}
                      </div>
                    </div>
                    <button className="btn btn-ghost btn-sm">Edit</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
      <LumaSheetsSyncModal 
        isOpen={isSyncModalOpen} 
        onClose={() => setIsSyncModalOpen(false)} 
        webinarId={id} 
      />
    </div>
  );
}
