// ============================================
// HUNTLO SALES OS — TASKS PAGE
// ============================================
import { useState, useEffect } from 'react';
import { Search, Plus, CheckCircle, Clock, AlertCircle, X, Loader } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import useDataStore from '../store/useDataStore';
import { useKeyboard } from '../hooks/useKeyboard';
import './Tasks.css';

const PRIORITY_COLORS = {
  urgent: 'var(--danger)',
  high: 'var(--warning)',
  medium: 'var(--accent-blue)',
  low: 'var(--text-tertiary)',
};

const ICONS = {
  urgent: <AlertCircle size={14} />,
  high: <AlertCircle size={14} />,
  medium: <Clock size={14} />,
  low: <Clock size={14} />,
};

export default function Tasks() {
  const { tasks, deals, createTask, toggleTaskCompletion } = useDataStore();
  const [filter, setFilter] = useState('pending'); // pending, completed, all
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({ title: '', deal_id: '', priority: 'medium', type: 'follow-up', due: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const filteredTasks = tasks.filter(t => {
    if (filter === 'pending') return t.status !== 'completed';
    if (filter === 'completed') return t.status === 'completed';
    return true;
  });

  const handleComplete = async (id, status) => {
    try {
      await toggleTaskCompletion(id, status);
    } catch (e) { console.error(e); }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!formData.title) return;
    setSaving(true);
    setError(null);
    try {
      await createTask({
        title: formData.title,
        deal_id: formData.deal_id || null,
        priority: formData.priority,
        type: formData.type,
        due: formData.due || new Date().toISOString(),
        status: 'pending'
      });
      setIsAdding(false);
      setFormData({ title: '', deal_id: '', priority: 'medium', type: 'follow-up', due: '' });
    } catch (error) {
      console.error(error);
      setError(error.message || 'Failed to create task');
    } finally {
      setSaving(false);
    }
  };

  useKeyboard({
    'j': () => setSelectedIdx(i => Math.min(i + 1, filteredTasks.length - 1)),
    'k': () => setSelectedIdx(i => Math.max(i - 1, 0)),
    'space': (e) => {
      e.preventDefault();
      if (filteredTasks[selectedIdx]) {
        handleComplete(filteredTasks[selectedIdx].id, filteredTasks[selectedIdx].status);
      }
    }
  });

  return (
    <div className="tasks-page">
      <div className="page-header-row">
        <div>
          <h1 className="page-big-title">Tasks</h1>
          <p className="page-big-sub">Manage your daily execution and follow-ups</p>
        </div>
        <div className="page-header-actions">
           <div className="filter-chips">
            {['pending', 'completed', 'all'].map(f => (
              <button key={f} className={`filter-chip ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => setIsAdding(true)}><Plus size={13} /> Add Task (N)</button>
        </div>
      </div>

      <div className="tasks-list">
        {filteredTasks.length === 0 ? (
           <div className="empty-state">
              <CheckCircle size={32} />
              <h3>All caught up</h3>
              <p>No tasks found for this view.</p>
           </div>
        ) : (
          filteredTasks.map((task, idx) => {
            const isCompleted = task.status === 'completed';
            const isOverdue = !isCompleted && new Date(task.due) < new Date();
            
            return (
              <div 
                key={task.id} 
                className={`task-row ${idx === selectedIdx ? 'selected' : ''} ${isCompleted ? 'completed' : ''}`}
                onClick={() => setSelectedIdx(idx)}
              >
                <button 
                  className={`task-checkbox ${isCompleted ? 'checked' : ''}`}
                  onClick={(e) => { e.stopPropagation(); handleComplete(task.id); }}
                >
                  {isCompleted && <CheckCircle size={14} />}
                </button>
                
                <div className="task-main">
                  <span className="task-title">{task.title}</span>
                  <div className="task-meta">
                    <span className="badge badge-gray">{task.type}</span>
                    {task.company && <span className="task-company">{task.company}</span>}
                  </div>
                </div>

                <div className="task-right">
                  <div className="task-priority" style={{ color: PRIORITY_COLORS[task.priority] }}>
                    {ICONS[task.priority]}
                    <span style={{ textTransform: 'capitalize' }}>{task.priority}</span>
                  </div>
                  <div className={`task-due ${isOverdue ? 'overdue' : ''}`}>
                    {format(new Date(task.due), 'MMM d, h:mm a')}
                  </div>
                  <div className="avatar avatar-sm" style={{ background: task.ownerColor, color: '#fff' }}>
                    {task.ownerInitials}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {isAdding && (
        <div className="contact-detail animate-slide-right" style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 400, background: 'var(--bg-surface)', borderLeft: '1px solid var(--bg-border)', zIndex: 50 }}>
          <div className="panel-header" style={{ marginBottom: 24, padding: 24 }}>
            <h2 className="panel-title">Add Task</h2>
            <button className="drawer-close" onClick={() => setIsAdding(false)}><X size={16}/></button>
          </div>
          <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '0 24px' }}>
            {error && (
              <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={14} /> {error}
              </div>
            )}
            <div className="form-group">
              <label className="label">Task Title</label>
              <input className="input-base" autoFocus required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. Send follow-up email" />
            </div>
            <div className="form-group">
              <label className="label">Related Deal</label>
              <select className="input-base" value={formData.deal_id} onChange={e => setFormData({...formData, deal_id: e.target.value})}>
                <option value="">No Deal</option>
                {deals.map(d => <option key={d.id} value={d.id}>{d.title}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="label">Type</label>
              <select className="input-base" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                <option value="follow-up">Follow-up</option>
                <option value="email">Email</option>
                <option value="call">Call</option>
                <option value="prep">Prep</option>
              </select>
            </div>
            <div className="form-group">
              <label className="label">Priority</label>
              <select className="input-base" value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div className="form-group">
              <label className="label">Due Date</label>
              <input className="input-base" type="datetime-local" value={formData.due} onChange={e => setFormData({...formData, due: e.target.value})} />
            </div>
            <button type="submit" className="btn btn-primary btn-md w-full" style={{ marginTop: 8 }} disabled={saving}>
              {saving ? <Loader size={14} className="cc-spinner" /> : 'Save Task'}
            </button>
          </form>
        </div>
      )}
      <div className="keyboard-hints" style={{ padding: '8px', fontSize: '11px', color: 'var(--text-tertiary)', borderTop: '1px solid var(--bg-border)', marginTop: 'auto' }}>
        <kbd>j/k</kbd> navigate list • <kbd>space</kbd> mark complete
      </div>
    </div>
  );
}
