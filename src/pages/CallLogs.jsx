// ============================================
// HUNTLO SALES OS — CALL LOGS PAGE
// ============================================
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, PhoneCall, PhoneOff, PhoneForwarded, 
  Clock, Calendar, User, Building2, FileText, 
  Filter, ChevronDown, Phone, Play, UploadCloud, Save, X
} from 'lucide-react';
import { format, isValid } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import useDataStore from '../store/useDataStore';
import CsvImporterModal from '../components/CsvImporterModal';
import './CallLogs.css';

const CALL_OUTCOMES = [
  { value: 'connected', label: 'Connected', color: '#16a34a', emoji: '✅', icon: PhoneCall },
  { value: 'voicemail', label: 'Voicemail', color: '#f59e0b', emoji: '📩', icon: PhoneForwarded },
  { value: 'no_answer', label: 'No Answer', color: '#64748b', emoji: '📵', icon: PhoneOff },
  { value: 'busy', label: 'Busy', color: '#ef4444', emoji: '🔴', icon: PhoneOff },
  { value: 'wrong_number', label: 'Wrong Number', color: '#94a3b8', emoji: '❌', icon: PhoneOff },
  { value: 'callback', label: 'Callback Requested', color: '#3b82f6', emoji: '🔄', icon: PhoneCall },
];

function safeFormatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (!isValid(d)) return '—';
  return format(d, 'MMM d, yyyy h:mm a');
}

export default function CallLogs() {
  const { tasks, leads, createTask, appendLeadNotes } = useDataStore();
  const [activeTab, setActiveTab] = useState('history'); // 'history' or 'dialer'
  
  // History Tab State
  const [search, setSearch] = useState('');
  const [filterOutcome, setFilterOutcome] = useState('all');
  const [selectedCall, setSelectedCall] = useState(null);

  // Dialer & Call Logger State
  const [showCallLogger, setShowCallLogger] = useState(false);
  const [callForm, setCallForm] = useState({
    contactName: '', company: '', phone: '', outcome: 'connected',
    duration: '', notes: '', createFollowUp: false, followUpDue: '',
    linkedLeadId: '', updateLeadStage: '',
  });
  const [callSaving, setCallSaving] = useState(false);
  const [error, setError] = useState(null);
  
  const [showImporter, setShowImporter] = useState(false);
  const [activeCallIdx, setActiveCallIdx] = useState(0);
  const [activeCallForm, setActiveCallForm] = useState({ outcome: '', duration: '', notes: '' });
  const [dialerDone, setDialerDone] = useState(false);
  const [saving, setSaving] = useState(false);

  // Extract and parse cold call logs from tasks (for History view)
  const callLogs = useMemo(() => {
    return tasks
      .filter(t => t.type === 'cold_call')
      .map(t => {
        let callData = {};
        try { callData = JSON.parse(t.notes); } catch (e) {}
        return {
          id: t.id,
          title: t.title,
          createdAt: t.created_at || callData.timestamp,
          contactName: callData.contactName || '',
          company: callData.company || '',
          phone: callData.phone || '',
          outcome: callData.outcome || 'unknown',
          duration: callData.duration || '',
          notes: callData.notes || '',
        };
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [tasks]);

  const filteredLogs = useMemo(() => {
    return callLogs.filter(call => {
      const matchesSearch = 
        (call.contactName || '').toLowerCase().includes(search.toLowerCase()) ||
        (call.company || '').toLowerCase().includes(search.toLowerCase()) ||
        (call.phone || '').includes(search);
      const matchesOutcome = filterOutcome === 'all' || call.outcome === filterOutcome;
      return matchesSearch && matchesOutcome;
    });
  }, [callLogs, search, filterOutcome]);

  const totalCalls = callLogs.length;
  const connectedCalls = callLogs.filter(c => c.outcome === 'connected').length;
  const totalDuration = callLogs.reduce((acc, curr) => acc + (parseFloat(curr.duration) || 0), 0);

  // Power Dialer Derived State
  const callingList = useMemo(() => {
    return tasks
      .filter(t => t.type === 'calling_list_item')
      .map(t => {
        let data = {};
        try { data = JSON.parse(t.notes); } catch(e) {}
        return {
          id: t.id,
          status: t.status,
          contact_name: t.title || '',
          company_name: data.company_name || '',
          phone: data.phone || '',
          email: data.email || '',
          outcome: data.outcome || '',
          outcomeLabel: data.outcomeLabel || '',
          duration: data.duration || '',
          notes: data.notes || '',
        };
      });
  }, [tasks]);

  useEffect(() => {
    if (callingList[activeCallIdx]) {
      const c = callingList[activeCallIdx];
      setActiveCallForm({ outcome: c.outcome || '', duration: c.duration || '', notes: c.notes || '' });
      setDialerDone(false);
    }
  }, [activeCallIdx, callingList]);

  // Lead matching for manual call log
  const matchedLead = useMemo(() => {
    if (!callForm.company && !callForm.contactName) return null;
    const q = (callForm.company || callForm.contactName).toLowerCase().trim();
    if (q.length < 2) return null;
    return leads.find(l =>
      (l.company_name && l.company_name.toLowerCase().includes(q)) ||
      (l.contact_name && l.contact_name.toLowerCase().includes(q)) ||
      (l.email && l.email.toLowerCase().includes(q))
    ) || null;
  }, [callForm.company, callForm.contactName, leads]);

  useEffect(() => {
    if (matchedLead && !callForm.linkedLeadId) {
      setCallForm(f => ({ ...f, linkedLeadId: matchedLead.id }));
    }
  }, [matchedLead]);

  // --- Handlers ---
  const handleImportCallingList = async (mappedData) => {
    if (!mappedData || mappedData.length === 0) {
      alert('No valid rows found. Please check your CSV and column mapping.');
      return;
    }
    const newTasks = mappedData.map(d => ({
      title: d.contact_name || d.company_name || 'Unknown',
      type: 'calling_list_item',
      status: 'pending',
      priority: 'medium',
      due: new Date().toISOString(),
      notes: JSON.stringify({
        _type: 'calling_list_data',
        company_name: d.company_name || '',
        phone: d.phone || '',
        email: d.email || '',
        outcome: '',
        duration: '',
        notes: ''
      })
    }));
    try {
      setSaving(true);
      await useDataStore.getState().bulkCreateTasks(newTasks);
      setShowImporter(false);
      setActiveCallIdx(0);
      setActiveTab('dialer');
    } catch(e) {
      alert("Error importing calling list: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePushToCRM = async () => {
    const processed = callingList.filter(c => c.status === 'completed');
    if (processed.length === 0) return;
    
    const leadsData = processed.map(c => ({
      company_name: c.company_name || c.contact_name || 'Unknown Company',
      contact_name: c.contact_name || '',
      phone: c.phone || '',
      ...(c.email ? { email: c.email } : {}),
      stage: c.outcome === 'connected' ? 'Engaged' : 'New Lead',
      source: 'Power Dialer',
      notes: `📞 [${new Date().toLocaleDateString()}] ${c.outcomeLabel || c.outcome || 'Called'} — ${c.duration ? c.duration + ' min' : 'N/A'} — ${c.notes || 'No notes'}`
    }));

    try {
      setSaving(true);
      const inserted = await useDataStore.getState().bulkCreateLeadsFromDialer(leadsData);
      
      const tasksToUpdate = processed.map(c => ({
        id: c.id,
        title: `Cold Call — ${c.company_name || c.contact_name || 'Unknown'} (${c.outcomeLabel || c.outcome})`,
        type: 'cold_call',
        status: 'completed',
        notes: JSON.stringify({
          _type: 'cold_call_log',
          contactName: c.contact_name,
          company: c.company_name,
          phone: c.phone,
          outcome: c.outcome,
          outcomeLabel: c.outcomeLabel || c.outcome,
          duration: c.duration,
          notes: c.notes,
          timestamp: new Date().toISOString()
        })
      }));
      await useDataStore.getState().bulkUpdateTasks(tasksToUpdate);
      const skipped = processed.length - inserted.length;
      const msg = skipped > 0
        ? `✅ ${inserted.length} new Lead${inserted.length !== 1 ? 's' : ''} created in CRM. ${skipped} skipped (already exist). Call logs updated.`
        : `✅ ${inserted.length} Lead${inserted.length !== 1 ? 's' : ''} created in CRM from ${processed.length} logged call${processed.length !== 1 ? 's' : ''}!`;
      alert(msg);
      setActiveCallIdx(0);
      setDialerDone(false);
    } catch (err) {
      alert("Error pushing to CRM: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const saveActiveCallWithForm = async (status, form) => {
    const curr = callingList[activeCallIdx];
    if (!curr) return;
    const task = tasks.find(t => t.id === curr.id);
    if (!task) return;
    let data = {};
    try { data = JSON.parse(task.notes || '{}'); } catch(e) {}
    const outcomeObj = CALL_OUTCOMES.find(o => o.value === form.outcome);
    const newNotes = JSON.stringify({
      ...data,
      outcome: form.outcome,
      outcomeLabel: outcomeObj?.label || '',
      duration: form.duration,
      notes: form.notes
    });
    await useDataStore.getState().updateTask(curr.id, { status, notes: newNotes });
  };

  const handleLogAndNext = async () => {
    if (!activeCallForm.outcome) { alert('Please select a call outcome first.'); return; }
    const savedForm = { ...activeCallForm };
    setActiveCallForm({ outcome: '', duration: '', notes: '' });
    await saveActiveCallWithForm('completed', savedForm);
    const nextIdx = activeCallIdx + 1;
    if (nextIdx >= callingList.length) {
      setDialerDone(true);
    } else {
      setActiveCallIdx(nextIdx);
    }
  };

  const handleSkip = async () => {
    const savedForm = { ...activeCallForm };
    setActiveCallForm({ outcome: '', duration: '', notes: '' });
    await saveActiveCallWithForm('skipped', savedForm);
    const nextIdx = activeCallIdx + 1;
    if (nextIdx >= callingList.length) {
      setDialerDone(true);
    } else {
      setActiveCallIdx(nextIdx);
    }
  };

  const handleLogColdCall = async (e) => {
    e.preventDefault();
    setCallSaving(true);
    setError(null);
    try {
      const outcomeInfo = CALL_OUTCOMES.find(o => o.value === callForm.outcome) || CALL_OUTCOMES[0];
      const callData = {
        _type: 'cold_call_log',
        contactName: callForm.contactName,
        company: callForm.company,
        phone: callForm.phone,
        outcome: callForm.outcome,
        outcomeLabel: outcomeInfo.label,
        duration: callForm.duration,
        notes: callForm.notes,
        linkedLeadId: callForm.linkedLeadId || null,
        timestamp: new Date().toISOString(),
      };

      await createTask({
        title: `Cold Call — ${callForm.company || callForm.contactName || 'Unknown'} (${outcomeInfo.label})`,
        type: 'cold_call',
        priority: 'medium',
        due: new Date().toISOString(),
        status: 'completed',
        company: callForm.company || null,
        notes: JSON.stringify(callData),
      });

      if (callForm.linkedLeadId) {
        const noteText = `${outcomeInfo.emoji} ${outcomeInfo.label} — ${callForm.duration ? callForm.duration + ' min' : 'N/A'} — ${callForm.notes || 'No notes'}`;
        await appendLeadNotes(callForm.linkedLeadId, noteText, callForm.updateLeadStage || null);
      }

      if (callForm.createFollowUp && callForm.followUpDue) {
        await createTask({
          title: `Follow-up: ${callForm.company || callForm.contactName || 'Cold Call'}`,
          type: 'follow-up',
          priority: 'medium',
          due: callForm.followUpDue,
          status: 'pending',
          company: callForm.company || null,
        });
      }

      setShowCallLogger(false);
      setCallForm({
        contactName: '', company: '', phone: '', outcome: 'connected',
        duration: '', notes: '', createFollowUp: false, followUpDue: '',
        linkedLeadId: '', updateLeadStage: '',
      });
      setActiveTab('history');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to log cold call');
    } finally {
      setCallSaving(false);
    }
  };

  // UI Renderers
  const renderHistory = () => (
    <div className="logs-content-inner">
      <div className="logs-toolbar">
        <div className="search-bar">
          <Search size={16} />
          <input 
            type="text" 
            placeholder="Search contact, company, or phone..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="filter-dropdown">
          <Filter size={16} />
          <select 
            value={filterOutcome} 
            onChange={(e) => setFilterOutcome(e.target.value)}
          >
            <option value="all">All Outcomes</option>
            {CALL_OUTCOMES.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <ChevronDown size={14} className="dropdown-icon" />
        </div>
      </div>

      <div className="logs-content-layout">
        <div className="logs-table-wrapper">
          <table className="logs-table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Contact</th>
                <th>Company</th>
                <th>Outcome</th>
                <th>Duration</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="empty-state-cell">
                    <div className="empty-state">
                      <Phone size={48} className="empty-icon" />
                      <h3>No calls found</h3>
                      <p>Start making calls from the Power Dialer.</p>
                      <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setActiveTab('dialer')}>
                        Go to Power Dialer
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLogs.map(call => {
                  const style = CALL_OUTCOMES.find(o => o.value === call.outcome) || CALL_OUTCOMES[2];
                  const Icon = style.icon;
                  
                  return (
                    <tr 
                      key={call.id} 
                      onClick={() => setSelectedCall(call)}
                      className={selectedCall?.id === call.id ? 'selected-row' : ''}
                    >
                      <td>
                        <div className="cell-content">
                          <Calendar size={14} className="cell-icon" />
                          <span className="date-text">{safeFormatDate(call.createdAt)}</span>
                        </div>
                      </td>
                      <td>
                        <div className="contact-info">
                          <span className="contact-name">{call.contactName || '—'}</span>
                          {call.phone && <span className="contact-phone">{call.phone}</span>}
                        </div>
                      </td>
                      <td>
                        <div className="cell-content">
                          {call.company ? (
                            <>
                              <Building2 size={14} className="cell-icon" />
                              <span className="company-text">{call.company}</span>
                            </>
                          ) : '—'}
                        </div>
                      </td>
                      <td>
                        <div 
                          className="outcome-badge"
                          style={{ backgroundColor: style.color + '18', color: style.color, border: `1px solid ${style.color}30` }}
                        >
                          {style.emoji} {style.label}
                        </div>
                      </td>
                      <td>
                        <div className="cell-content">
                          <Clock size={14} className="cell-icon" />
                          <span>{call.duration ? `${call.duration}m` : '—'}</span>
                        </div>
                      </td>
                      <td>
                        <div className="notes-preview">
                          {call.notes ? (
                            <>
                              <FileText size={14} className="cell-icon" />
                              <span className="truncate">{call.notes}</span>
                            </>
                          ) : '—'}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <AnimatePresence>
          {selectedCall && (
            <motion.div 
              className="call-details-panel"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="panel-header">
                <h3>Call Details</h3>
                <button 
                  className="close-panel-btn" 
                  onClick={() => setSelectedCall(null)}
                >
                  &times;
                </button>
              </div>
              
              <div className="panel-body">
                {(() => {
                  const style = CALL_OUTCOMES.find(o => o.value === selectedCall.outcome) || CALL_OUTCOMES[2];
                  return (
                    <div className="detail-hero">
                      <div className="detail-avatar" style={{ backgroundColor: style.color + '18', color: style.color }}>
                        <span style={{ fontSize: 24 }}>{style.emoji}</span>
                      </div>
                      <div className="detail-hero-info">
                        <h4>{selectedCall.contactName || 'Unknown Contact'}</h4>
                        <p>{selectedCall.company || 'Unknown Company'}</p>
                      </div>
                    </div>
                  );
                })()}

                <div className="detail-section">
                  <h5>Overview</h5>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="label">Date</span>
                      <span className="value">{safeFormatDate(selectedCall.createdAt)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Phone</span>
                      <span className="value">{selectedCall.phone || '—'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Outcome</span>
                      <span className="value">
                        {CALL_OUTCOMES.find(o => o.value === selectedCall.outcome)?.label || selectedCall.outcome}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Duration</span>
                      <span className="value">{selectedCall.duration ? `${selectedCall.duration} minutes` : '—'}</span>
                    </div>
                  </div>
                </div>

                <div className="detail-section">
                  <h5>Notes</h5>
                  <div className="notes-box">
                    {selectedCall.notes || 'No notes provided for this call.'}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );

  const renderDialer = () => (
    <div className="dialer-content-inner">
      {callingList.length === 0 ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="empty-state">
          <Play size={48} className="empty-icon" style={{ color: 'var(--accent-blue)', opacity: 0.8 }} />
          <h3 style={{ fontSize: 20 }}>Ready to start a calling campaign?</h3>
          <p style={{ maxWidth: 400, margin: '0 auto 24px', lineHeight: 1.5 }}>
            Upload a CSV with names and phone numbers, dial through them rapidly, and push results to the CRM when finished.
          </p>
          <button className="btn btn-primary" onClick={() => setShowImporter(true)}>
            <UploadCloud size={16} /> Import Calling List CSV
          </button>
        </motion.div>
      ) : (
        <div className="dialer-layout">
          <div className="dialer-sidebar">
            <div className="dialer-sidebar-header">
              <span style={{ fontSize: 13, fontWeight: 600 }}>Up Next</span>
              <span className="badge" style={{ background: 'var(--accent-blue)', color: '#fff' }}>{callingList.length}</span>
            </div>
            <div className="dialer-list">
              {callingList.map((c, idx) => (
                <div 
                  key={c.id} 
                  onClick={() => setActiveCallIdx(idx)}
                  className={`dialer-list-item ${activeCallIdx === idx ? 'active' : ''}`}
                >
                  <div className="status-dot" style={{ background: c.status === 'completed' ? '#16a34a' : c.status === 'skipped' ? '#94a3b8' : '#3b82f6' }} />
                  <div className="item-details">
                    <div className="item-name">{c.contact_name || c.company_name || 'Unknown'}</div>
                    <div className="item-phone">{c.phone}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="dialer-main">
            {dialerDone ? (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="dialer-done-state">
                <div className="done-icon">🎉</div>
                <h2>Campaign Complete!</h2>
                <p>You've worked through all {callingList.length} contacts.</p>
                <div className="done-stats">
                  <div className="done-stat-card">
                    <div className="val" style={{ color: '#3b82f6' }}>{callingList.length}</div>
                    <div className="label">Total</div>
                  </div>
                  <div className="done-stat-card">
                    <div className="val" style={{ color: '#16a34a' }}>{callingList.filter(c => c.status === 'completed').length}</div>
                    <div className="label">Logged</div>
                  </div>
                  <div className="done-stat-card">
                    <div className="val" style={{ color: '#94a3b8' }}>{callingList.filter(c => c.status === 'skipped').length}</div>
                    <div className="label">Skipped</div>
                  </div>
                </div>
                <div className="done-actions">
                  <button className="btn btn-ghost" onClick={() => { setDialerDone(false); setActiveCallIdx(0); }}>Review List</button>
                  <button className="btn btn-primary" style={{ background: '#16a34a', borderColor: '#16a34a' }}
                    disabled={saving || callingList.filter(c => c.status === 'completed').length === 0}
                    onClick={handlePushToCRM}>
                    <Save size={16} /> Push {callingList.filter(c => c.status === 'completed').length} Calls to CRM
                  </button>
                </div>
                <button className="btn btn-ghost" style={{ marginTop: 12, color: 'var(--text-tertiary)' }} onClick={() => setShowImporter(true)}>
                  <UploadCloud size={14} /> Import New Calling List
                </button>
              </motion.div>
            ) : callingList[activeCallIdx] ? (
              <div className="active-call-container">
                <div className="active-call-header">
                  <div>
                    <h2>{callingList[activeCallIdx].contact_name || 'Unknown Contact'}</h2>
                    <div className="active-company">{callingList[activeCallIdx].company_name}</div>
                  </div>
                  <div className="active-phone">{callingList[activeCallIdx].phone}</div>
                </div>
                
                <div className="progress-bar-container">
                  <div className="progress-text">
                    <span>Contact {activeCallIdx + 1} of {callingList.length}</span>
                    <span>{callingList.filter(c => c.status === 'completed').length} logged</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${(callingList.filter(c=>c.status==='completed').length / callingList.length)*100}%` }} />
                  </div>
                </div>

                <div className="call-form-card">
                  <div className="form-group">
                    <label className="label">Call Outcome</label>
                    <div className="outcome-buttons">
                      {CALL_OUTCOMES.map(o => (
                        <button 
                          key={o.value} 
                          type="button"
                          onClick={() => setActiveCallForm({...activeCallForm, outcome: o.value})}
                          className={`outcome-btn ${activeCallForm.outcome === o.value ? 'selected' : ''}`}
                          style={activeCallForm.outcome === o.value ? {
                            borderColor: o.color,
                            backgroundColor: o.color + '18',
                            color: o.color
                          } : {}}
                        >
                          {o.emoji} {o.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="label">Duration (min)</label>
                    <input className="input-base" type="number" min="0" value={activeCallForm.duration} onChange={e => setActiveCallForm({...activeCallForm, duration: e.target.value})} placeholder="e.g. 5" />
                  </div>
                  <div className="form-group">
                    <label className="label">Notes</label>
                    <textarea className="input-base" rows={4} value={activeCallForm.notes} onChange={e => setActiveCallForm({...activeCallForm, notes: e.target.value})} placeholder="Discussed next steps..." />
                  </div>
                </div>

                <div className="call-actions">
                  <button className="btn btn-ghost" onClick={handleSkip}>Skip</button>
                  <button className="btn btn-primary" style={{ background: '#16a34a', borderColor: '#16a34a' }} onClick={handleLogAndNext}>✓ Log & Next</button>
                </div>

                <div className="push-actions">
                  <button className="btn btn-primary btn-sm push-btn" disabled={saving || callingList.filter(c => c.status === 'completed').length === 0} onClick={handlePushToCRM}>
                    <Save size={14} /> Push {callingList.filter(c => c.status === 'completed').length} completed calls to CRM
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="call-logs-container page-enter">
      <header className="page-header">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <h1 className="page-title">
              <Phone className="title-icon" /> Call Center
            </h1>
            <p className="page-subtitle">Track, analyze, and execute your cold calling campaigns</p>
          </div>
          
          <div className="crm-tabs">
            <button className={`crm-tab ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
              Call History
            </button>
            <button className={`crm-tab ${activeTab === 'dialer' ? 'active' : ''}`} onClick={() => setActiveTab('dialer')}>
              <Play size={14} /> Power Dialer
              {callingList.filter(c => c.status === 'pending').length > 0 && (
                <span className="tab-badge">{callingList.filter(c => c.status === 'pending').length}</span>
              )}
            </button>
          </div>
        </div>
        
        <div className="header-right-actions">
          <button className="btn btn-ghost" onClick={() => setShowImporter(true)}>
            <UploadCloud size={16} /> Import List
          </button>
          <button className="btn btn-primary log-btn" onClick={() => setShowCallLogger(true)}>
            <Phone size={14} /> Log Cold Call
          </button>
          <div className="call-stats-mini">
            <div className="stat-card">
              <span className="stat-value success">{connectedCalls}</span>
              <span className="stat-label">Connected</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{totalDuration}<small>m</small></span>
              <span className="stat-label">Talk Time</span>
            </div>
          </div>
        </div>
      </header>

      {activeTab === 'history' ? renderHistory() : renderDialer()}

      {showImporter && (
        <CsvImporterModal
          onClose={() => setShowImporter(false)}
          onImport={handleImportCallingList}
          type="calling_list"
        />
      )}

      {/* Manual Call Logger Modal */}
      <AnimatePresence>
        {showCallLogger && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="drawer-overlay" onClick={() => setShowCallLogger(false)} />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="contact-detail log-call-modal">
              <div className="panel-header">
                <h2>Log a Call</h2>
                <button className="btn btn-ghost btn-sm" style={{ padding: 4 }} onClick={() => setShowCallLogger(false)}><X size={18} /></button>
              </div>
              <div className="panel-content">
                {error && <div className="alert-error" style={{ marginBottom: 16 }}>{error}</div>}
                <form onSubmit={handleLogColdCall} className="form-layout">
                  <div className="form-group">
                    <label className="label">Contact Name *</label>
                    <input required className="input-base" value={callForm.contactName} onChange={e => setCallForm({ ...callForm, contactName: e.target.value })} placeholder="John Doe" />
                  </div>
                  <div className="form-group">
                    <label className="label">Company</label>
                    <input className="input-base" value={callForm.company} onChange={e => setCallForm({ ...callForm, company: e.target.value })} placeholder="Acme Corp" />
                  </div>
                  
                  {matchedLead && (
                    <div style={{ padding: '8px 12px', background: 'rgba(59,130,246,0.1)', borderRadius: 8, fontSize: 13, color: '#3b82f6', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 16 }}>🔗</span> Link to CRM Lead: <strong>{matchedLead.company_name || matchedLead.contact_name}</strong>
                    </div>
                  )}

                  <div className="form-group">
                    <label className="label">Phone</label>
                    <input className="input-base" value={callForm.phone} onChange={e => setCallForm({ ...callForm, phone: e.target.value })} placeholder="+1 (555) 000-0000" />
                  </div>
                  <div className="form-group">
                    <label className="label">Outcome</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {CALL_OUTCOMES.map(o => (
                        <button key={o.value} type="button" onClick={() => setCallForm({ ...callForm, outcome: o.value })}
                          style={{
                            padding: '8px 12px', borderRadius: 8, textAlign: 'left',
                            border: `1px solid ${callForm.outcome === o.value ? o.color : 'var(--bg-border)'}`,
                            background: callForm.outcome === o.value ? o.color + '18' : 'transparent',
                            color: callForm.outcome === o.value ? o.color : 'var(--text-secondary)',
                            fontSize: 13, fontWeight: 500
                          }}>
                          {o.emoji} {o.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="label">Duration (min)</label>
                    <input className="input-base" type="number" min="0" value={callForm.duration} onChange={e => setCallForm({ ...callForm, duration: e.target.value })} placeholder="5" />
                  </div>
                  <div className="form-group">
                    <label className="label">Notes</label>
                    <textarea className="input-base" rows={4} value={callForm.notes} onChange={e => setCallForm({ ...callForm, notes: e.target.value })} placeholder="Call details..." />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8, padding: 16, background: 'var(--bg-elevated)', borderRadius: 8, border: '1px solid var(--border-light)' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                      <input type="checkbox" checked={callForm.createFollowUp} onChange={e => setCallForm({ ...callForm, createFollowUp: e.target.checked })} style={{ width: 16, height: 16 }} />
                      Create a follow-up task
                    </label>
                    {callForm.createFollowUp && (
                      <input type="datetime-local" className="input-base" style={{ fontSize: 13 }} value={callForm.followUpDue} onChange={e => setCallForm({ ...callForm, followUpDue: e.target.value })} />
                    )}
                  </div>
                </form>
              </div>
              <div className="panel-footer">
                <button className="btn btn-ghost" onClick={() => setShowCallLogger(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleLogColdCall} disabled={callSaving}>
                  {callSaving ? 'Saving...' : 'Save Call Log'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
