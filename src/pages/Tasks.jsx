// ============================================
// HUNTLO SALES OS — TASKS PAGE
// ============================================
import React, { useState, useMemo, useEffect } from 'react';
import { Search, Plus, CheckCircle, Clock, AlertCircle, X, Loader, Filter, BookOpen, Phone, Link2, ChevronDown, UploadCloud, Play, Save } from 'lucide-react';
import { format, isPast, isValid } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
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

const CALL_OUTCOMES = [
  { value: 'connected', label: 'Connected', color: '#16a34a', emoji: '✅' },
  { value: 'voicemail', label: 'Voicemail', color: '#f59e0b', emoji: '📩' },
  { value: 'no_answer', label: 'No Answer', color: '#64748b', emoji: '📵' },
  { value: 'busy', label: 'Busy', color: '#ef4444', emoji: '🔴' },
  { value: 'wrong_number', label: 'Wrong Number', color: '#94a3b8', emoji: '❌' },
  { value: 'callback', label: 'Callback Requested', color: '#3b82f6', emoji: '🔄' },
];

const LEAD_STAGES = ['New Lead', 'Researching', 'Ready for Outreach', 'Outreach Started', 'Engaged', 'Qualified', 'Demo Scheduled', 'Demo Complete', 'Trial Started', 'Customer', 'Lost'];

function safeFormatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (!isValid(d)) return '—';
  return format(d, 'MMM d, h:mm a');
}

function safeIsPast(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (!isValid(d)) return false;
  return isPast(d);
}


export default function Tasks() {
  const { tasks, deals, leads, createTask, toggleTaskCompletion, teamMembers, appendLeadNotes } = useDataStore();
  const [filter, setFilter] = useState('pending');
  const [search, setSearch] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({ title: '', deal_id: '', priority: 'medium', type: 'follow-up', due: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  

  const [scratchpad, setScratchpad] = useState(() => localStorage.getItem('huntlo_scratchpad') || '');





  useEffect(() => {
    localStorage.setItem('huntlo_scratchpad', scratchpad);
  }, [scratchpad]);



  const pendingCount = tasks.filter(t => t.status !== 'completed' && t.type !== 'calling_list_item').length;
  const callCount = tasks.filter(t => t.type === 'call' && t.status !== 'completed').length;
  const emailCount = tasks.filter(t => t.type === 'email' && t.status !== 'completed').length;
  const linkedinCount = tasks.filter(t => t.type === 'linkedin' && t.status !== 'completed').length;
  const overdueCount = tasks.filter(t => t.status !== 'completed' && safeIsPast(t.due)).length;

  const filteredTasks = useMemo(() => {
    let result = tasks;

    if (filter === 'pending') {
      result = result.filter(t => t.status !== 'completed' && t.type !== 'calling_list_item');
    } else if (filter === 'completed') {
      result = result.filter(t => t.status === 'completed' && t.type !== 'calling_list_item');
    } else if (filter === 'call') {
      result = result.filter(t => t.type === 'call' && t.status !== 'completed');
    } else if (filter === 'email') {
      result = result.filter(t => t.type === 'email' && t.status !== 'completed');
    } else if (filter === 'linkedin') {
      result = result.filter(t => t.type === 'linkedin' && t.status !== 'completed');
    } else if (filter === 'overdue') {
      result = result.filter(t => t.status !== 'completed' && safeIsPast(t.due) && t.type !== 'calling_list_item');
    } else if (filter === 'cold_call_log') {
      result = result.filter(t => (t.type === 'cold_call' || t.type === 'call') && t.status === 'completed');
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(t =>
        (t.title || '').toLowerCase().includes(q) ||
        (t.type || '').toLowerCase().includes(q) ||
        (t.company || '').toLowerCase().includes(q)
      );
    }

    return result;
  }, [tasks, filter, search]);

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
    <div className="tasks-split-layout">
      {/* Left Pane: Tasks */}
      <div className="tasks-page">
        <div className="page-header-row" style={{ padding: '24px 24px 12px' }}>
        <div>
          <h1 className="page-big-title" style={{ fontSize: 22 }}>Tasks</h1>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary btn-sm" onClick={() => setIsAdding(true)}><Plus size={13} /> Create task</button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="apollo-tabs-bar">
        <div className={`apollo-tab ${filter === 'pending' ? 'active' : ''}`} onClick={() => setFilter('pending')}>
          All tasks <span className="apollo-tab-count">{pendingCount}</span>
        </div>
        <div className={`apollo-tab ${filter === 'call' ? 'active' : ''}`} onClick={() => setFilter('call')}>
          Call tasks <span className="apollo-tab-count">{callCount}</span>
        </div>
        <div className={`apollo-tab ${filter === 'email' ? 'active' : ''}`} onClick={() => setFilter('email')}>
          Email tasks <span className="apollo-tab-count">{emailCount}</span>
        </div>
        <div className={`apollo-tab ${filter === 'linkedin' ? 'active' : ''}`} onClick={() => setFilter('linkedin')}>
          LinkedIn tasks <span className="apollo-tab-count">{linkedinCount}</span>
        </div>

        <div className={`apollo-tab ${filter === 'overdue' ? 'active' : ''}`} onClick={() => setFilter('overdue')}>
          Overdue <span className="apollo-tab-count" style={{ background: overdueCount > 0 ? 'var(--danger)' : undefined }}>{overdueCount}</span>
        </div>
        <div className={`apollo-tab ${filter === 'completed' ? 'active' : ''}`} onClick={() => setFilter('completed')}>
          Completed
        </div>
      </div>

      {/* Sub-bar with working search */}
      <div className="apollo-sub-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="search-box" style={{ width: 260, background: 'transparent', border: '1px solid var(--border-light)' }}>
            <Search size={14} color="var(--text-tertiary)" />
            <input
              placeholder="Search tasks..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && <X size={12} style={{ cursor: 'pointer', color: 'var(--text-tertiary)' }} onClick={() => setSearch('')} />}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500 }}>
          <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Task list */}
      <div className="tasks-list">
        {filteredTasks.length === 0 ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="apollo-empty-state">
            <div className="apollo-empty-img">
              <CheckCircle size={24} /> <span style={{ marginLeft: 8 }}>All clear!</span>
            </div>
            <h3 style={{ fontSize: 18, color: 'var(--text-primary)', fontWeight: 500 }}>
              {search ? `No tasks match "${search}"` : 'No tasks in this view'}
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
              {!search && filter === 'pending' && 'Create your first task to get started.'}
              {!search && filter === 'overdue' && 'Great job — nothing is overdue!'}
              {!search && filter === 'completed' && 'No completed tasks yet.'}
            </p>
            {filter === 'pending' && !search && (
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button className="btn btn-primary btn-sm" onClick={() => setIsAdding(true)}>New task</button>
              </div>
            )}
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredTasks.map((task, idx) => {
              const isCompleted = task.status === 'completed';
              const isOverdue = !isCompleted && safeIsPast(task.due);
              const owner = teamMembers?.find(tm => tm.id === task.owner_id);
              const ownerName = owner?.name || 'ME';
              const ownerInitials = ownerName !== 'ME' ? ownerName.substring(0, 2).toUpperCase() : 'ME';
              const relatedWebinar = task.webinar_id ? useDataStore.getState().webinars.find(w => w.id === task.webinar_id) : null;

              return (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2, delay: idx * 0.03 }}
                  key={task.id}
                  className={`task-row ${idx === selectedIdx ? 'selected' : ''} ${isCompleted ? 'completed' : ''}`}
                  onClick={() => setSelectedIdx(idx)}
                >
                <button
                  className={`task-checkbox ${isCompleted ? 'checked' : ''}`}
                  onClick={(e) => { e.stopPropagation(); handleComplete(task.id, task.status); }}
                >
                  {isCompleted && <CheckCircle size={12} strokeWidth={3} />}
                </button>

                <div className="task-main">
                  <span className="task-title" style={{ textDecoration: isCompleted ? 'line-through' : 'none', opacity: isCompleted ? 0.5 : 1 }}>{task.title}</span>
                  <div className="task-meta">
                    <span className="badge badge-gray">{task.type}</span>
                    {isOverdue && <span className="badge" style={{ background: 'rgba(239,68,68,0.1)', color: '#dc2626', fontSize: 10 }}>⚠ Overdue</span>}
                    {task.company && <span className="task-company">{task.company}</span>}
                    {relatedWebinar && <span className="badge" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6', marginLeft: 4 }}>Webinar: {relatedWebinar.title}</span>}
                  </div>
                </div>

                <div className="task-right">
                  <div className="task-priority" style={{ color: PRIORITY_COLORS[task.priority] || 'var(--text-tertiary)' }}>
                    {ICONS[task.priority] || <Clock size={14} />}
                    <span style={{ textTransform: 'capitalize' }}>{task.priority || 'medium'}</span>
                  </div>
                  <div className={`task-due ${isOverdue ? 'overdue' : ''}`}>
                    {safeFormatDate(task.due)}
                  </div>
                  <div className="avatar avatar-sm" style={{ background: owner?.color || '#3b82f6', color: '#fff', fontSize: '10px' }} title={ownerName !== 'ME' ? ownerName : undefined}>
                    {ownerInitials}
                  </div>
                </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Keyboard hints */}
      <div className="keyboard-hints" style={{ padding: '8px', fontSize: '11px', color: 'var(--text-tertiary)', borderTop: '1px solid var(--bg-border)', marginTop: 'auto' }}>
        <kbd>j/k</kbd> navigate list • <kbd>space</kbd> mark complete
      </div>

      {/* Add Task panel */}
      <AnimatePresence>
      {isAdding && (
        <>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="drawer-overlay" onClick={() => setIsAdding(false)} />
        <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="contact-detail" style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: 400, background: 'var(--bg-surface)', borderLeft: '1px solid var(--bg-border)', zIndex: 50, overflowY: 'auto' }}>
          <div className="panel-header" style={{ marginBottom: 24, padding: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 className="panel-title">Add Task</h2>
            <button className="drawer-close" onClick={() => setIsAdding(false)}><X size={16}/></button>
          </div>
          <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '0 24px 24px' }}>
            {error && (
              <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={14} /> {error}
              </div>
            )}
            <div className="form-group">
              <label className="label">Task Title *</label>
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
                <option value="cold_call">Cold Call</option>
                <option value="linkedin">LinkedIn</option>
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
              <label className="label">Due Date & Time</label>
              <input className="input-base" type="datetime-local" value={formData.due} onChange={e => setFormData({...formData, due: e.target.value})} />
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setIsAdding(false)} style={{ flex: 1 }}>Cancel</button>
              <button type="submit" className="btn btn-primary btn-sm" style={{ flex: 2 }} disabled={saving}>
                {saving ? <Loader size={14} className="cc-spinner" /> : 'Save Task'}
              </button>
            </div>
          </form>
        </motion.div>
        </>
      )}
      </AnimatePresence>


      </div>

      {/* Right Pane: Daily Scratchpad */}
      <div className="daily-scratchpad-pane">
        <div className="scratchpad-container">
          <div className="scratchpad-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BookOpen size={18} color="var(--accent-blue)" />
              <h2>Daily Notes</h2>
            </div>
            <span className="scratchpad-date">{format(new Date(), 'EEEE, MMMM do')}</span>
          </div>
          <textarea
            className="scratchpad-textarea"
            value={scratchpad}
            onChange={(e) => setScratchpad(e.target.value)}
            placeholder="What's on your mind today? Write down meeting notes, ideas, or quick to-dos..."
          />
          <div className="scratchpad-footer">
            <span className="save-indicator"><CheckCircle size={14} /> Saved just now</span>
          </div>
        </div>
      </div>
    </div>
  );
}
