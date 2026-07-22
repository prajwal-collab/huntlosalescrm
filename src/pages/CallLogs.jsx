// ============================================
// HUNTLO SALES OS — CALL LOGS PAGE
// ============================================
import React, { useState, useMemo } from 'react';
import { 
  Search, PhoneCall, PhoneOff, PhoneForwarded, 
  Clock, Calendar, User, Building2, FileText, 
  Filter, ChevronDown, Phone 
} from 'lucide-react';
import { format, isValid } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import useDataStore from '../store/useDataStore';
import './CallLogs.css';

const OUTCOME_STYLES = {
  connected: { label: 'Connected', color: 'var(--success)', bg: 'rgba(22, 163, 74, 0.1)', icon: PhoneCall },
  voicemail: { label: 'Voicemail', color: 'var(--warning)', bg: 'rgba(245, 158, 11, 0.1)', icon: PhoneForwarded },
  no_answer: { label: 'No Answer', color: 'var(--text-tertiary)', bg: 'rgba(100, 116, 139, 0.1)', icon: PhoneOff },
  busy: { label: 'Busy', color: 'var(--danger)', bg: 'rgba(239, 68, 68, 0.1)', icon: PhoneOff },
  wrong_number: { label: 'Wrong Number', color: 'var(--text-tertiary)', bg: 'rgba(148, 163, 184, 0.1)', icon: PhoneOff },
  callback: { label: 'Callback Requested', color: 'var(--accent-blue)', bg: 'rgba(59, 130, 246, 0.1)', icon: PhoneCall },
};

function safeFormatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (!isValid(d)) return '—';
  return format(d, 'MMM d, yyyy h:mm a');
}

export default function CallLogs() {
  const { tasks } = useDataStore();
  const [search, setSearch] = useState('');
  const [filterOutcome, setFilterOutcome] = useState('all');
  const [selectedCall, setSelectedCall] = useState(null);

  // Extract and parse call logs from tasks
  const callLogs = useMemo(() => {
    return tasks
      .filter(t => t.type === 'cold_call')
      .map(t => {
        let callData = {};
        try {
          callData = JSON.parse(t.notes);
        } catch (e) {
          // Fallback if not valid JSON
        }
        
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

  return (
    <div className="call-logs-container page-enter">
      <header className="page-header">
        <div>
          <h1 className="page-title">
            <Phone className="title-icon" /> Call Logs
          </h1>
          <p className="page-subtitle">Track and analyze your cold calling history</p>
        </div>
        
        <div className="call-stats">
          <div className="stat-card">
            <span className="stat-value">{totalCalls}</span>
            <span className="stat-label">Total Calls</span>
          </div>
          <div className="stat-card">
            <span className="stat-value success">{connectedCalls}</span>
            <span className="stat-label">Connected</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{totalDuration} <small>min</small></span>
            <span className="stat-label">Talk Time</span>
          </div>
        </div>
      </header>

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
            <option value="connected">Connected</option>
            <option value="voicemail">Voicemail</option>
            <option value="no_answer">No Answer</option>
            <option value="busy">Busy</option>
            <option value="callback">Callback</option>
          </select>
          <ChevronDown size={14} className="dropdown-icon" />
        </div>
      </div>

      <div className="logs-content">
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
                      <p>Start making calls from the Tasks power dialer.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLogs.map(call => {
                  const style = OUTCOME_STYLES[call.outcome] || OUTCOME_STYLES.no_answer;
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
                          style={{ backgroundColor: style.bg, color: style.color }}
                        >
                          <Icon size={12} />
                          {style.label}
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

        {/* Side Panel for Details */}
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
                  const style = OUTCOME_STYLES[selectedCall.outcome] || OUTCOME_STYLES.no_answer;
                  const Icon = style.icon;
                  return (
                    <div className="detail-hero">
                      <div className="detail-avatar" style={{ backgroundColor: style.bg, color: style.color }}>
                        <Icon size={24} />
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
                        {OUTCOME_STYLES[selectedCall.outcome]?.label || selectedCall.outcome}
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
}
