import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, Plus, Calendar, BarChart3, Clock, PlayCircle, Archive, AlertCircle, TrendingUp } from 'lucide-react';
import useDataStore from '../store/useDataStore';
import { format, isPast, parseISO } from 'date-fns';
import './Webinars.css';

export default function Webinars() {
  const { webinars, tasks, createWebinar, webinar_registrants, deals } = useDataStore();
  const navigate = useNavigate();
  const [view, setView] = useState('roadmap'); // 'roadmap' | 'kpi'
  const [isAdding, setIsAdding] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    theme_month: '',
    segment: '',
    date_time: '',
    status: 'Planned'
  });

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.date_time) return;
    try {
      const newWebinar = await createWebinar(formData);
      setIsAdding(false);
      setFormData({ title: '', theme_month: '', segment: '', date_time: '', status: 'Planned' });
      navigate(`/webinars/${newWebinar.id}`);
    } catch (err) {
      console.error(err);
    }
  };

  const groupedWebinars = useMemo(() => {
    const groups = { Planned: [], 'In Promotion': [], Live: [], 'Follow-up': [], Closed: [], Archived: [] };
    webinars.forEach(w => {
      if (groups[w.status]) groups[w.status].push(w);
      else groups.Planned.push(w); // fallback
    });
    return groups;
  }, [webinars]);

  // KPI calculations
  const totalRegistrations = webinar_registrants.length;
  const totalAttended = webinar_registrants.filter(r => r.attended).length;
  const totalDemos = webinar_registrants.filter(r => r.demo_requested).length;
  
  const attendanceRate = totalRegistrations > 0 ? ((totalAttended / totalRegistrations) * 100).toFixed(1) : 0;
  const demoRate = totalAttended > 0 ? ((totalDemos / totalAttended) * 100).toFixed(1) : 0;

  return (
    <div className="webinars-page">
      <div className="page-header-row" style={{ padding: '24px 24px 12px' }}>
        <div>
          <h1 className="page-big-title" style={{ fontSize: 22, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Video size={22} color="var(--accent-blue)" /> Webinars
          </h1>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary btn-sm" onClick={() => setIsAdding(true)}>
            <Plus size={13} /> Create Webinar
          </button>
        </div>
      </div>

      <div className="apollo-tabs-bar" style={{ padding: '0 24px' }}>
        <div className={`apollo-tab ${view === 'roadmap' ? 'active' : ''}`} onClick={() => setView('roadmap')}>
          <Calendar size={14} style={{ marginRight: 6 }}/> 90-Day Roadmap
        </div>
        <div className={`apollo-tab ${view === 'kpi' ? 'active' : ''}`} onClick={() => setView('kpi')}>
          <BarChart3 size={14} style={{ marginRight: 6 }}/> KPI Dashboard
        </div>
      </div>

      <div className="webinars-content" style={{ padding: 24 }}>
        {view === 'roadmap' && (
          <div className="kanban-board">
            {['Planned', 'In Promotion', 'Live', 'Follow-up', 'Closed'].map(status => (
              <div key={status} className="kanban-col">
                <div className="kanban-col-header">
                  <h3>{status}</h3>
                  <span className="count">{groupedWebinars[status]?.length || 0}</span>
                </div>
                <div className="kanban-cards">
                  {groupedWebinars[status]?.map(webinar => {
                    const webinarTasks = tasks.filter(t => t.webinar_id === webinar.id);
                    const isAtRisk = webinarTasks.some(t => t.status !== 'completed' && isPast(parseISO(t.due)));
                    return (
                    <div key={webinar.id} className={`kanban-card ${isAtRisk ? 'at-risk' : ''}`} onClick={() => navigate(`/webinars/${webinar.id}`)} style={isAtRisk ? { borderLeft: '3px solid var(--danger)' } : {}}>
                      <div className="card-title">
                        {webinar.title}
                        {isAtRisk && <AlertCircle size={14} color="var(--danger)" style={{ marginLeft: 6, verticalAlign: 'middle' }} title="Overdue tasks" />}
                      </div>
                      <div className="card-meta">
                        <span className="badge badge-gray">{webinar.segment || 'General'}</span>
                      </div>
                      <div className="card-footer">
                        <Clock size={12} />
                        <span>{format(parseISO(webinar.date_time), 'MMM d, yyyy h:mm a')}</span>
                      </div>
                    </div>
                  )})}
                  {groupedWebinars[status]?.length === 0 && (
                    <div className="kanban-empty">No webinars</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {view === 'kpi' && (
          <div className="kpi-dashboard">
            <div className="kpi-grid">
              <div className="kpi-card">
                <div className="kpi-title">Total Registrations</div>
                <div className="kpi-value">{totalRegistrations}</div>
              </div>
              <div className="kpi-card">
                <div className="kpi-title">Attendance Rate</div>
                <div className="kpi-value">{attendanceRate}%</div>
                <div className="kpi-subtext">{totalAttended} attended</div>
              </div>
              <div className="kpi-card">
                <div className="kpi-title">Demo Request Rate</div>
                <div className="kpi-value">{demoRate}%</div>
                <div className="kpi-subtext">{totalDemos} demos requested</div>
              </div>
              <div className="kpi-card">
                <div className="kpi-title">Pipeline Generated</div>
                <div className="kpi-value">
                  {/* Simplistic sum of deals generated from webinars */}
                  ${deals.filter(d => d.notes?.includes('Webinar registration')).reduce((sum, d) => sum + Number(d.arr), 0).toLocaleString()}
                </div>
              </div>
            </div>
            
            <div className="kpi-chart-placeholder" style={{ marginTop: 24, background: 'var(--bg-surface)', padding: 24, borderRadius: 8, border: '1px solid var(--bg-border)', height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', flexDirection: 'column' }}>
              <TrendingUp size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
              <p>Historical trend chart will populate as multiple webinars complete.</p>
            </div>
          </div>
        )}
      </div>

      {isAdding && (
        <div className="global-slider-overlay" onClick={() => setIsAdding(false)}>
          <div className="global-slider-content" onClick={e => e.stopPropagation()}>
            <div className="global-slider-header">
              <h2>Create New Webinar</h2>
            </div>
            <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div className="global-slider-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="label">Webinar Title *</label>
                <input required className="input-base" placeholder="e.g. Q3 Hiring Trends" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="label">Theme / Month</label>
                <input className="input-base" placeholder="e.g. October AI Series" value={formData.theme_month} onChange={e => setFormData({...formData, theme_month: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="label">Target Segment</label>
                <select className="input-base" value={formData.segment} onChange={e => setFormData({...formData, segment: e.target.value})}>
                  <option value="">Select Segment</option>
                  <option value="HR Leaders">HR Leaders</option>
                  <option value="Recruiters">Recruiters</option>
                  <option value="Staffing Firms">Staffing Firms</option>
                  <option value="Founders">Founders</option>
                </select>
              </div>
              <div className="form-group">
                <label className="label">Date & Time *</label>
                <input required type="datetime-local" className="input-base" value={formData.date_time} onChange={e => setFormData({...formData, date_time: e.target.value})} />
              </div>
              </div>
              <div className="global-slider-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setIsAdding(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Webinar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
