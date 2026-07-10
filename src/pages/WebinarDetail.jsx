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
    updateWebinarRegistrant 
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
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-tertiary)', background: 'var(--bg-surface)', border: '1px dashed var(--bg-border)', borderRadius: 8 }}>
            Content Assets view is currently a placeholder.
          </div>
        )}

        {activeTab === 'funnel' && (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-tertiary)', background: 'var(--bg-surface)', border: '1px dashed var(--bg-border)', borderRadius: 8 }}>
            Funnel & Follow-up sequences view is currently a placeholder.
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
