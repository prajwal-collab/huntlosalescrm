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
  const { tasks, leads, contacts, createTask, appendLeadNotes } = useDataStore();
  const [activeTab, setActiveTab] = useState('history'); // 'history', 'dialer', 'bulk'
  
  // Bulk Tab State
  const [bulkSelected, setBulkSelected] = useState([]);
  const [bulkOutcome, setBulkOutcome] = useState('');
  
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
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  const [showImporter, setShowImporter] = useState(false);
  const [activeCallIdx, setActiveCallIdx] = useState(0);
  const [activeCallForm, setActiveCallForm] = useState({ outcome: '', duration: '', notes: '' });
  const [dialerDone, setDialerDone] = useState(false);
  const [saving, setSaving] = useState(false);

  // Extract and parse cold call logs from tasks (for History view)
  const callLogs = useMemo(() => {
    return tasks
      .filter(t => t.type === 'cold_call' || (t.type === 'call' && t.notes && t.notes.includes('_type":"cold_call_log"')) || (t.type === 'calling_list_item' && t.status === 'completed'))
      .map(t => {
        let callData = {};
        try { callData = JSON.parse(t.notes); } catch (e) {}
        return {
          id: t.id,
          title: t.title,
          createdAt: t.created_at || callData.timestamp,
          contactName: callData.contactName || t.title || '',
          company: callData.company || callData.company_name || '',
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
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .map(t => {
        let data = {};
        try { data = JSON.parse(t.notes); } catch(e) {}
        
        const cleanStr = (str) => {
          if (!str || typeof str !== 'string') return str || '';
          if (str.includes('#ERROR') || str.includes('#REF!') || str.includes('#VALUE!')) return '';
          return str;
        };

        return {
          id: t.id,
          status: t.status,
          contact_name: cleanStr(t.title),
          company_name: cleanStr(data.company_name),
          phone: cleanStr(data.phone),
          email: cleanStr(data.email),
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

  const searchResults = useMemo(() => {
    if (!callForm.contactName || callForm.contactName.length < 2) return [];
    const q = callForm.contactName.toLowerCase();
    const results = [];
    
    // Search calling list
    callingList.forEach(c => {
      if ((c.contact_name && c.contact_name.toLowerCase().includes(q)) || 
          (c.company_name && c.company_name.toLowerCase().includes(q))) {
        results.push({
          type: 'calling_list',
          id: c.id,
          name: c.contact_name || c.company_name,
          company: c.company_name || 'Calling List Contact',
          phone: c.phone || '',
        });
      }
    });

    // Search contacts
    if (contacts) {
      contacts.forEach(c => {
        if ((c.name && c.name.toLowerCase().includes(q)) || 
            (c.email && c.email.toLowerCase().includes(q))) {
          results.push({
            type: 'contact',
            id: c.id,
            name: c.name,
            company: c.designation || 'CRM Contact',
            phone: c.whatsapp || '',
          });
        }
      });
    }

    // Search leads
    if (leads) {
      leads.forEach(l => {
        if ((l.contact_name && l.contact_name.toLowerCase().includes(q)) || 
            (l.company_name && l.company_name.toLowerCase().includes(q))) {
          results.push({
            type: 'lead',
            id: l.id,
            name: l.contact_name || l.company_name,
            company: l.company_name || 'CRM Lead',
            phone: l.phone || '',
          });
        }
      });
    }

    // Deduplicate by name/company and limit to 5
    const unique = [];
    const seen = new Set();
    for (let r of results) {
      const key = `${r.name}-${r.company}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(r);
        if (unique.length >= 6) break;
      }
    }
    return unique;
  }, [callForm.contactName, callingList, contacts, leads]);

  // --- Handlers ---
  const handleImportCallingList = async (mappedData) => {
    if (!mappedData || mappedData.length === 0) {
      alert('No valid rows found. Please check your CSV and column mapping.');
      return;
    }

    const cleanStr = (str) => {
      if (!str || typeof str !== 'string') return str || '';
      if (str.includes('#ERROR') || str.includes('#REF!') || str.includes('#VALUE!')) return '';
      return str;
    };

    const newTasks = mappedData.map(d => ({
      title: cleanStr(d.contact_name) || cleanStr(d.company_name) || 'Unknown',
      type: 'calling_list_item',
      status: 'pending',
      priority: 'medium',
      due: new Date().toISOString(),
      notes: JSON.stringify({
        _type: 'calling_list_data',
        company_name: cleanStr(d.company_name),
        phone: cleanStr(d.phone),
        email: cleanStr(d.email),
        outcome: cleanStr(d.outcome) || '',
        duration: cleanStr(d.duration) || '',
        notes: cleanStr(d.notes) || ''
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
    
    setSaving(true);
    try {
      const curr = callingList[activeCallIdx];
      const savedForm = { ...activeCallForm };
      
      // 1. Save locally to tasks
      await saveActiveCallWithForm('completed', savedForm);

      // 2. Immediately push to CRM
      const outcomeObj = CALL_OUTCOMES.find(o => o.value === savedForm.outcome);
      const leadData = {
        company_name: curr.company_name || curr.contact_name || 'Unknown Company',
        contact_name: curr.contact_name || '',
        phone: curr.phone || '',
        ...(curr.email ? { email: curr.email } : {}),
        stage: savedForm.outcome === 'connected' ? 'Engaged' : 'New Lead',
        source: 'Power Dialer',
        notes: `📞 [${new Date().toLocaleDateString()}] ${outcomeObj?.label || savedForm.outcome} — ${savedForm.duration ? savedForm.duration + ' min' : 'N/A'} — ${savedForm.notes || 'No notes'}`
      };
      
      await useDataStore.getState().bulkCreateLeadsFromDialer([leadData]);
      
      // Cleanup and move to next
      setActiveCallForm({ outcome: '', duration: '', notes: '' });
      const nextIdx = activeCallIdx + 1;
      if (nextIdx >= callingList.length) {
        setDialerDone(true);
      } else {
        setActiveCallIdx(nextIdx);
      }
    } catch(e) {
      alert("Error logging call: " + e.message);
    } finally {
      setSaving(false);
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

  const toggleBulkSelect = (id) => {
    setBulkSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };
  
  const selectAllBulk = () => {
    if (bulkSelected.length === callingList.length) setBulkSelected([]);
    else setBulkSelected(callingList.map(c => c.id));
  };

  const handleBulkUpdateOutcome = async () => {
    if (!bulkOutcome || bulkSelected.length === 0) return;
    setSaving(true);
    try {
      const outcomeObj = CALL_OUTCOMES.find(o => o.value === bulkOutcome);
      const updates = [];
      for (const id of bulkSelected) {
        const task = tasks.find(t => t.id === id);
        if (!task) continue;
        let data = {};
        try { data = JSON.parse(task.notes || '{}'); } catch(e) {}
        const newNotes = JSON.stringify({
          ...data,
          outcome: bulkOutcome,
          outcomeLabel: outcomeObj?.label || ''
        });
        updates.push(useDataStore.getState().updateTask(id, { notes: newNotes }));
      }
      await Promise.all(updates);
      setBulkSelected([]);
      setBulkOutcome('');
    } catch(e) {
      alert("Error updating outcomes: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleBulkLog = async () => {
    if (bulkSelected.length === 0) return;
    setSaving(true);
    try {
      const leadsToCreate = [];
      const updates = [];
      for (const id of bulkSelected) {
        const curr = callingList.find(c => c.id === id);
        if (!curr || !curr.outcome) continue; // Only log if outcome is set
        const task = tasks.find(t => t.id === id);
        const outcomeObj = CALL_OUTCOMES.find(o => o.value === curr.outcome);
        
        updates.push(useDataStore.getState().updateTask(id, { status: 'completed' }));
        
        leadsToCreate.push({
          company_name: curr.company_name || curr.contact_name || 'Unknown Company',
          contact_name: curr.contact_name || '',
          phone: curr.phone || '',
          ...(curr.email ? { email: curr.email } : {}),
          stage: curr.outcome === 'connected' ? 'Engaged' : 'New Lead',
          source: 'Bulk Import',
          notes: `📞 [${new Date().toLocaleDateString()}] ${outcomeObj?.label || curr.outcome} — ${curr.duration ? curr.duration + ' min' : 'N/A'} — ${curr.notes || 'No notes'}`
        });
      }
      
      await Promise.all(updates);
      if (leadsToCreate.length > 0) {
        await useDataStore.getState().bulkCreateLeadsFromDialer(leadsToCreate);
      }
      setBulkSelected([]);
      setActiveTab('history');
    } catch(e) {
      alert("Error bulk logging calls: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  // UI Renderers
  const renderHistory = () => (
    <motion.div 
      className="cl-history-view"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="cl-toolbar">
        <div className="cl-search-wrapper">
          <Search size={16} className="cl-search-icon" />
          <input 
            type="text" 
            placeholder="Search contact, company, or phone..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="cl-search-input"
          />
        </div>
        
        <div className="cl-filter-wrapper">
          <Filter size={14} className="cl-filter-icon" />
          <select 
            value={filterOutcome} 
            onChange={(e) => setFilterOutcome(e.target.value)}
            className="cl-filter-select"
          >
            <option value="all">All Outcomes</option>
            {CALL_OUTCOMES.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <ChevronDown size={14} className="cl-dropdown-icon" />
        </div>
      </div>

      <div className="cl-table-container">
        <div className="cl-table-scroll">
          <table className="cl-table">
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
                  <td colSpan="6" className="cl-empty-cell">
                    <div className="cl-empty-state">
                      <div className="cl-empty-icon-wrap">
                        <Phone size={32} />
                      </div>
                      <h3>No calls found</h3>
                      <p>Get started by launching a Power Dialer campaign or logging a cold call manually.</p>
                      <button className="btn btn-primary" onClick={() => setActiveTab('dialer')}>
                        Launch Power Dialer
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLogs.map(call => {
                  const style = CALL_OUTCOMES.find(o => o.value === call.outcome) || CALL_OUTCOMES[2];
                  
                  return (
                    <tr 
                      key={call.id} 
                      onClick={() => setSelectedCall(call)}
                      className={selectedCall?.id === call.id ? 'active-row' : ''}
                    >
                      <td>
                        <div className="cl-cell-date">
                          <span className="cl-date">{safeFormatDate(call.createdAt)}</span>
                        </div>
                      </td>
                      <td>
                        <div className="cl-cell-contact">
                          <span className="cl-name">{call.contactName || '—'}</span>
                          {call.phone && <span className="cl-phone">{call.phone}</span>}
                        </div>
                      </td>
                      <td>
                        <div className="cl-cell-company">
                          {call.company || '—'}
                        </div>
                      </td>
                      <td>
                        <div className="cl-outcome-pill" style={{ '--pill-color': style.color }}>
                          {style.emoji} {style.label}
                        </div>
                      </td>
                      <td>
                        <div className="cl-cell-duration">
                          {call.duration ? `${call.duration}m` : '—'}
                        </div>
                      </td>
                      <td>
                        <div className="cl-cell-notes">
                          <span className="cl-truncate">{call.notes || '—'}</span>
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
              className="cl-details-sidebar"
              initial={{ opacity: 0, x: '100%' }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            >
              <div className="cl-details-header">
                <h3>Call Details</h3>
                <button className="btn-icon" onClick={() => setSelectedCall(null)}>
                  <X size={18} />
                </button>
              </div>
              
              <div className="cl-details-body">
                {(() => {
                  const style = CALL_OUTCOMES.find(o => o.value === selectedCall.outcome) || CALL_OUTCOMES[2];
                  return (
                    <div className="cl-details-hero">
                      <div className="cl-hero-avatar" style={{ '--avatar-color': style.color }}>
                        {style.emoji}
                      </div>
                      <div className="cl-hero-text">
                        <h4>{selectedCall.contactName || 'Unknown Contact'}</h4>
                        <p>{selectedCall.company || 'Unknown Company'}</p>
                      </div>
                    </div>
                  );
                })()}

                <div className="cl-details-section">
                  <h5>Overview</h5>
                  <div className="cl-details-grid">
                    <div className="cl-detail-item">
                      <span className="cl-label">Date</span>
                      <span className="cl-value">{safeFormatDate(selectedCall.createdAt)}</span>
                    </div>
                    <div className="cl-detail-item">
                      <span className="cl-label">Phone</span>
                      <span className="cl-value">{selectedCall.phone || '—'}</span>
                    </div>
                    <div className="cl-detail-item">
                      <span className="cl-label">Outcome</span>
                      <span className="cl-value">
                        {CALL_OUTCOMES.find(o => o.value === selectedCall.outcome)?.label || selectedCall.outcome}
                      </span>
                    </div>
                    <div className="cl-detail-item">
                      <span className="cl-label">Duration</span>
                      <span className="cl-value">{selectedCall.duration ? `${selectedCall.duration} min` : '—'}</span>
                    </div>
                  </div>
                </div>

                <div className="cl-details-section">
                  <h5>Notes</h5>
                  <div className="cl-notes-box">
                    {selectedCall.notes || 'No notes provided for this call.'}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );

  const renderDialer = () => (
    <motion.div 
      className="cl-dialer-view"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {callingList.length === 0 ? (
        <div className="cl-empty-state dialer-empty">
          <div className="cl-empty-icon-wrap primary">
            <Play size={40} />
          </div>
          <h2>Ready to start a calling campaign?</h2>
          <p>Upload a CSV with names and phone numbers, dial through them rapidly, and push results to the CRM when finished.</p>
          <button className="btn btn-primary" onClick={() => setShowImporter(true)}>
            <UploadCloud size={16} /> Import Calling List CSV
          </button>
        </div>
      ) : (
        <div className="cl-dialer-layout">
          <div className="cl-dialer-sidebar">
            <div className="cl-sidebar-header">
              <span>Up Next</span>
              <span className="cl-badge">{callingList.length}</span>
            </div>
            <div className="cl-sidebar-list">
              {callingList.map((c, idx) => (
                <div 
                  key={c.id} 
                  onClick={() => setActiveCallIdx(idx)}
                  className={`cl-list-item ${activeCallIdx === idx ? 'active' : ''}`}
                >
                  <div className={`cl-status-dot ${c.status}`} />
                  <div className="cl-item-text">
                    <div className="cl-item-title">{c.contact_name || c.company_name || 'Unknown'}</div>
                    <div className="cl-item-sub">{c.phone}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="cl-dialer-main">
            {dialerDone ? (
              <div className="cl-done-state">
                <div className="cl-done-icon">🎉</div>
                <h2>Campaign Complete!</h2>
                <p>You've worked through all {callingList.length} contacts.</p>
                <div className="cl-done-stats">
                  <div className="cl-done-card">
                    <div className="cl-val blue">{callingList.length}</div>
                    <div className="cl-label">Total</div>
                  </div>
                  <div className="cl-done-card">
                    <div className="cl-val green">{callingList.filter(c => c.status === 'completed').length}</div>
                    <div className="cl-label">Logged</div>
                  </div>
                  <div className="cl-done-card">
                    <div className="cl-val gray">{callingList.filter(c => c.status === 'skipped').length}</div>
                    <div className="cl-label">Skipped</div>
                  </div>
                </div>
                <div className="cl-done-actions">
                  <button className="btn btn-ghost" onClick={() => { setDialerDone(false); setActiveCallIdx(0); }}>Review List</button>
                  <button className="btn btn-success" onClick={() => setActiveTab('history')}>
                    View Call History
                  </button>
                </div>
              </div>
            ) : callingList[activeCallIdx] ? (
              <div className="cl-active-call">
                <div className="cl-active-header">
                  <div>
                    <h2 className="cl-active-name">{callingList[activeCallIdx].contact_name || 'Unknown Contact'}</h2>
                    <div className="cl-active-company">{callingList[activeCallIdx].company_name}</div>
                  </div>
                  <div className="cl-active-phone">{callingList[activeCallIdx].phone}</div>
                </div>
                
                <div className="cl-progress">
                  <div className="cl-progress-text">
                    <span>Contact {activeCallIdx + 1} of {callingList.length}</span>
                    <span>{callingList.filter(c => c.status === 'completed').length} logged</span>
                  </div>
                  <div className="cl-progress-track">
                    <div className="cl-progress-fill" style={{ width: `${(callingList.filter(c=>c.status==='completed').length / callingList.length)*100}%` }} />
                  </div>
                </div>

                <div className="cl-form-card">
                  <div className="cl-form-group">
                    <label>Call Outcome</label>
                    <div className="cl-outcome-grid">
                      {CALL_OUTCOMES.map(o => (
                        <button 
                          key={o.value} 
                          type="button"
                          onClick={() => setActiveCallForm({...activeCallForm, outcome: o.value})}
                          className={`cl-outcome-btn ${activeCallForm.outcome === o.value ? 'selected' : ''}`}
                          style={{ '--btn-color': o.color }}
                        >
                          {o.emoji} {o.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="cl-form-group">
                    <label>Duration (min)</label>
                    <input className="input-base" type="number" min="0" value={activeCallForm.duration} onChange={e => setActiveCallForm({...activeCallForm, duration: e.target.value})} placeholder="e.g. 5" />
                  </div>
                  <div className="cl-form-group">
                    <label>Notes</label>
                    <textarea className="input-base" rows={4} value={activeCallForm.notes} onChange={e => setActiveCallForm({...activeCallForm, notes: e.target.value})} placeholder="Discussed next steps..." />
                  </div>
                </div>

                <div className="cl-active-actions">
                  <button className="btn btn-ghost" onClick={handleSkip}>Skip Contact</button>
                  <button className="btn btn-success" onClick={handleLogAndNext}>✓ Log & Next</button>
                </div>


              </div>
            ) : null}
          </div>
        </div>
      )}
    </motion.div>
  );

  const renderBulk = () => (
    <motion.div 
      className="cl-history-view"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="cl-toolbar">
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select 
            className="input-base" 
            style={{ width: '200px' }}
            value={bulkOutcome}
            onChange={(e) => setBulkOutcome(e.target.value)}
          >
            <option value="">-- Update Outcome --</option>
            {CALL_OUTCOMES.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <button className="btn btn-ghost" onClick={handleBulkUpdateOutcome} disabled={saving || !bulkOutcome || bulkSelected.length === 0}>
            Apply to {bulkSelected.length}
          </button>
        </div>
        <div>
          <button className="btn btn-primary" onClick={handleBulkLog} disabled={saving || bulkSelected.length === 0}>
            <Save size={14} style={{ marginRight: 6 }} /> Log Selected to History
          </button>
        </div>
      </div>
      <div className="cl-table-container">
        <div className="cl-table-scroll">
          <table className="cl-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>
                  <input 
                    type="checkbox" 
                    checked={callingList.length > 0 && bulkSelected.length === callingList.length}
                    onChange={selectAllBulk}
                  />
                </th>
                <th>Contact / Company</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Outcome</th>
              </tr>
            </thead>
            <tbody>
              {callingList.length === 0 ? (
                <tr>
                  <td colSpan="5" className="cl-empty-cell">
                    <div className="cl-empty-state">
                      <p>No contacts in the calling list. Import a CSV to get started.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                callingList.map(c => {
                  const style = CALL_OUTCOMES.find(o => o.value === c.outcome);
                  return (
                    <tr key={c.id}>
                      <td>
                        <input 
                          type="checkbox" 
                          checked={bulkSelected.includes(c.id)}
                          onChange={() => toggleBulkSelect(c.id)}
                        />
                      </td>
                      <td>
                        <div className="cl-cell-contact">
                          <span className="cl-name">{c.contact_name || '—'}</span>
                          <span className="cl-company">{c.company_name}</span>
                        </div>
                      </td>
                      <td>{c.phone || '—'}</td>
                      <td>
                        <span className={`cl-status-dot ${c.status}`} style={{ display: 'inline-block', marginRight: '6px', width: '8px', height: '8px', borderRadius: '50%', background: c.status === 'completed' ? 'var(--success)' : c.status === 'skipped' ? 'var(--text-tertiary)' : 'var(--primary)' }} />
                        <span style={{ textTransform: 'capitalize' }}>{c.status}</span>
                      </td>
                      <td>
                        {style ? (
                          <div className="cl-outcome-pill" style={{ '--pill-color': style.color, display: 'inline-block' }}>
                            {style.emoji} {style.label}
                          </div>
                        ) : '—'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="cl-container page-enter">
      <header className="cl-header">
        <div className="cl-header-top">
          <div className="cl-title-section">
            <div className="cl-title-icon"><Phone size={24} /></div>
            <div>
              <h1 className="cl-title">Call Center</h1>
              <p className="cl-subtitle">Track, analyze, and execute your cold calling campaigns</p>
            </div>
          </div>
          
          <div className="cl-header-actions">
            <div className="cl-stats">
              <div className="cl-stat-box success">
                <div className="cl-stat-val">{connectedCalls}</div>
                <div className="cl-stat-label">Connected</div>
              </div>
              <div className="cl-stat-box">
                <div className="cl-stat-val">{totalDuration}<small>m</small></div>
                <div className="cl-stat-label">Talk Time</div>
              </div>
            </div>
            <div className="cl-actions-group">
              <button className="btn btn-ghost" onClick={() => setShowImporter(true)}>
                <UploadCloud size={16} /> Import List
              </button>
              <button className="btn btn-primary" onClick={() => setShowCallLogger(true)}>
                <Phone size={14} /> Log Cold Call
              </button>
            </div>
          </div>
        </div>

        <div className="cl-header-bottom">
          <div className="cl-segmented-tabs">
            <button className={`cl-seg-tab ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
              Call History
            </button>
            <button className={`cl-seg-tab ${activeTab === 'dialer' ? 'active' : ''}`} onClick={() => setActiveTab('dialer')}>
              Power Dialer
              {callingList.filter(c => c.status === 'pending').length > 0 && (
                <span className="cl-tab-badge">{callingList.filter(c => c.status === 'pending').length}</span>
              )}
            </button>
            <button className={`cl-seg-tab ${activeTab === 'bulk' ? 'active' : ''}`} onClick={() => setActiveTab('bulk')}>
              Bulk Process
            </button>
          </div>
        </div>
      </header>

      <main className="cl-main-content">
        {activeTab === 'history' ? renderHistory() : activeTab === 'bulk' ? renderBulk() : renderDialer()}
      </main>

      {showImporter && (
        <CsvImporterModal
          isOpen={true}
          onClose={() => setShowImporter(false)}
          onImportSuccess={handleImportCallingList}
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
                <button className="btn-icon" onClick={() => setShowCallLogger(false)}><X size={18} /></button>
              </div>
              <div className="panel-content">
                {error && <div className="alert-error" style={{ marginBottom: 16 }}>{error}</div>}
                <form onSubmit={handleLogColdCall} className="form-layout">
                  <div className="cl-form-group" style={{ position: 'relative' }}>
                    <label>Contact Name *</label>
                    <input 
                      required 
                      className="input-base" 
                      value={callForm.contactName} 
                      onChange={e => {
                        setCallForm({ ...callForm, contactName: e.target.value });
                        setDropdownOpen(true);
                      }} 
                      onFocus={() => setDropdownOpen(true)}
                      onBlur={() => setTimeout(() => setDropdownOpen(false), 200)}
                      placeholder="John Doe" 
                    />
                    <AnimatePresence>
                      {dropdownOpen && searchResults.length > 0 && (
                        <motion.div 
                          className="cl-autocomplete-dropdown"
                          initial={{ opacity: 0, y: -4, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -4, scale: 0.98 }}
                          transition={{ duration: 0.15 }}
                        >
                          {searchResults.map((r, i) => (
                            <div 
                              key={i} 
                              className="cl-autocomplete-item"
                              onClick={() => {
                                setCallForm({
                                  ...callForm,
                                  contactName: r.name,
                                  company: r.company && r.company !== 'CRM Contact' && r.company !== 'Calling List Contact' && r.company !== 'CRM Lead' ? r.company : callForm.company,
                                  phone: r.phone || callForm.phone
                                });
                                setDropdownOpen(false);
                              }}
                            >
                              <div className="cl-autocomplete-icon">
                                <User size={14} />
                              </div>
                              <div className="cl-autocomplete-text">
                                <div className="cl-autocomplete-name">{r.name}</div>
                                <div className="cl-autocomplete-company">{r.company}</div>
                              </div>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <div className="cl-form-group">
                    <label>Company</label>
                    <input className="input-base" value={callForm.company} onChange={e => setCallForm({ ...callForm, company: e.target.value })} placeholder="Acme Corp" />
                  </div>
                  
                  {matchedLead && (
                    <div className="cl-matched-lead">
                      <span className="emoji">🔗</span> Link to CRM Lead: <strong>{matchedLead.company_name || matchedLead.contact_name}</strong>
                    </div>
                  )}

                  <div className="cl-form-group">
                    <label>Phone</label>
                    <input className="input-base" value={callForm.phone} onChange={e => setCallForm({ ...callForm, phone: e.target.value })} placeholder="+1 (555) 000-0000" />
                  </div>
                  <div className="cl-form-group">
                    <label>Outcome</label>
                    <div className="cl-outcome-grid small">
                      {CALL_OUTCOMES.map(o => (
                        <button key={o.value} type="button" onClick={() => setCallForm({ ...callForm, outcome: o.value })}
                          className={`cl-outcome-btn ${callForm.outcome === o.value ? 'selected' : ''}`}
                          style={{ '--btn-color': o.color }}>
                          {o.emoji} {o.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="cl-form-group">
                    <label>Duration (min)</label>
                    <input className="input-base" type="number" min="0" value={callForm.duration} onChange={e => setCallForm({ ...callForm, duration: e.target.value })} placeholder="5" />
                  </div>
                  <div className="cl-form-group">
                    <label>Notes</label>
                    <textarea className="input-base" rows={4} value={callForm.notes} onChange={e => setCallForm({ ...callForm, notes: e.target.value })} placeholder="Call details..." />
                  </div>

                  <div className="cl-followup-box">
                    <label className="cl-checkbox-label">
                      <input type="checkbox" checked={callForm.createFollowUp} onChange={e => setCallForm({ ...callForm, createFollowUp: e.target.checked })} />
                      Create a follow-up task
                    </label>
                    {callForm.createFollowUp && (
                      <input type="datetime-local" className="input-base" style={{ marginTop: 12 }} value={callForm.followUpDue} onChange={e => setCallForm({ ...callForm, followUpDue: e.target.value })} />
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
