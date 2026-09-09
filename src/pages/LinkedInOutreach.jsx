// ============================================
// HUNTLO — LINKEDIN OUTREACH HUB
// SDR-focused LinkedIn activity tracker
// ============================================
import { useState, useMemo, useRef, useCallback } from 'react';
import {
  Link2, Plus, ChevronDown, ChevronUp, ExternalLink,
  Upload, X, Search, Users, Filter
} from 'lucide-react';
import useDataStore from '../store/useDataStore';
import useAuthStore from '../store/useAuthStore';
import './LinkedInOutreach.css';

const ACTION_TYPES = [
  { id: 'connection_request', label: '🤝 Connection Request', short: 'Connect' },
  { id: 'message',            label: '💬 Message',            short: 'Message' },
  { id: 'inmail',             label: '✉️ InMail',             short: 'InMail' },
  { id: 'accepted',           label: '✅ Accepted',            short: 'Accepted' },
  { id: 'replied',            label: '🎯 Replied',             short: 'Replied' },
];

const SENTIMENTS = [
  { id: 'interested',      label: '🟢 Interested',     color: 'interested' },
  { id: 'demo_booked',     label: '🟣 Demo Booked',    color: 'demo_booked' },
  { id: 'neutral',         label: '🟡 Neutral',        color: 'neutral' },
  { id: 'not_interested',  label: '🔴 Not Interested', color: 'not_interested' },
];

const ACTION_BADGE_LABELS = {
  connection_request: '🤝 Request',
  message: '💬 Message',
  inmail: '✉️ InMail',
  accepted: '✅ Accepted',
  replied: '🎯 Replied',
};

export default function LinkedInOutreach() {
  const {
    linkedinLogs, leads, logLinkedInOutreach, bulkImportLinkedInOutreach
  } = useDataStore();
  const { user, team } = useAuthStore();

  // UI State
  const [loggerOpen, setLoggerOpen] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [sdrFilter, setSdrFilter] = useState('mine');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [csvImporting, setCsvImporting] = useState(false);
  const [csvResult, setCsvResult] = useState(null);

  // Logger form state
  const [form, setForm] = useState({
    linkedin_url: '',
    contact_name: '',
    company_name: '',
    designation: '',
    action_type: '',
    reply_sentiment: '',
    notes: '',
  });

  const urlInputRef = useRef(null);
  const csvInputRef = useRef(null);

  const set = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  // Role detection
  const currentUserProfile = team?.find(t => t.id === user?.id);
  const role = currentUserProfile?.role || 'SDR';
  const isAdmin = role === 'Admin' || role === 'Manager' || user?.email === 'prajwal@earlyjobs.in';

  // ── Filtered Logs ───────────────────────────────────────────
  const filteredLogs = useMemo(() => {
    let logs = [...linkedinLogs];

    // SDR filter
    if (sdrFilter === 'mine') {
      logs = logs.filter(l => l.owner_id === user?.id);
    } else if (sdrFilter !== 'all') {
      logs = logs.filter(l => l.owner_id === sdrFilter);
    }

    // Tab filter
    if (activeTab !== 'all') {
      logs = logs.filter(l => l.action_type === activeTab);
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      logs = logs.filter(l =>
        l.contact_name?.toLowerCase().includes(q) ||
        l.company_name?.toLowerCase().includes(q) ||
        l.linkedin_url?.toLowerCase().includes(q)
      );
    }

    return logs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [linkedinLogs, sdrFilter, activeTab, searchQuery, user?.id]);

  // ── Metrics ───────────────────────────────────────────
  const metrics = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const myLogs = sdrFilter === 'all'
      ? linkedinLogs
      : sdrFilter === 'mine'
        ? linkedinLogs.filter(l => l.owner_id === user?.id)
        : linkedinLogs.filter(l => l.owner_id === sdrFilter);

    const todayLogs = myLogs.filter(l => new Date(l.created_at) >= today);

    return {
      totalToday: todayLogs.length,
      requestsSent: myLogs.filter(l => l.action_type === 'connection_request').length,
      accepted: myLogs.filter(l => l.action_type === 'accepted').length,
      messagesSent: myLogs.filter(l => l.action_type === 'message' || l.action_type === 'inmail').length,
      replies: myLogs.filter(l => l.action_type === 'replied').length,
      demosBooked: myLogs.filter(l => l.reply_sentiment === 'demo_booked').length,
      replyRate: myLogs.filter(l => l.action_type === 'connection_request').length > 0
        ? Math.round((myLogs.filter(l => l.action_type === 'replied').length / myLogs.filter(l => l.action_type === 'connection_request').length) * 100)
        : 0,
    };
  }, [linkedinLogs, sdrFilter, user?.id]);

  // ── Tab counts ───────────────────────────────────────────
  const tabCounts = useMemo(() => {
    const baseLogs = sdrFilter === 'all'
      ? linkedinLogs
      : sdrFilter === 'mine'
        ? linkedinLogs.filter(l => l.owner_id === user?.id)
        : linkedinLogs.filter(l => l.owner_id === sdrFilter);

    return {
      all: baseLogs.length,
      connection_request: baseLogs.filter(l => l.action_type === 'connection_request').length,
      message: baseLogs.filter(l => l.action_type === 'message').length,
      inmail: baseLogs.filter(l => l.action_type === 'inmail').length,
      accepted: baseLogs.filter(l => l.action_type === 'accepted').length,
      replied: baseLogs.filter(l => l.action_type === 'replied').length,
    };
  }, [linkedinLogs, sdrFilter, user?.id]);

  // ── Autocomplete from existing leads ───────────────────────────────────
  const handleUrlPaste = useCallback((url) => {
    set('linkedin_url', url);
    // Try to match an existing lead and auto-fill
    const normalizedUrl = url.trim().toLowerCase().replace(/^https?:\/\/(www\.)?/, '').split('?')[0].replace(/\/+$/, '');
    const match = leads.find(l => {
      const leadUrl = (l.contact_linkedin || l.linkedin_url || '').toLowerCase().replace(/^https?:\/\/(www\.)?/, '').split('?')[0].replace(/\/+$/, '');
      return leadUrl && leadUrl === normalizedUrl;
    });
    if (match) {
      setForm(prev => ({
        ...prev,
        linkedin_url: url,
        contact_name: prev.contact_name || match.contact_name || '',
        company_name: prev.company_name || match.company_name || '',
        designation: prev.designation || match.designation || '',
      }));
    }
  }, [leads]);

  // ── Submit ───────────────────────────────────────────
  const handleSubmit = async () => {
    if (!form.linkedin_url.trim() || !form.action_type) return;
    if (!form.contact_name.trim() || !form.company_name.trim()) return;

    setSaving(true);
    setSuccessMsg('');
    try {
      const result = await logLinkedInOutreach({
        ...form,
        reply_sentiment: form.action_type === 'replied' ? (form.reply_sentiment || 'neutral') : null,
      });

      const wasNew = !leads.find(l => l.id === result?.leadId && l.created_at !== l.updated_at);
      setSuccessMsg(wasNew ? '✅ Logged & new lead created in CRM!' : '✅ Logged & synced to existing lead!');

      // Reset form
      setForm({
        linkedin_url: '',
        contact_name: '',
        company_name: '',
        designation: '',
        action_type: '',
        reply_sentiment: '',
        notes: '',
      });

      // Focus back to URL input
      setTimeout(() => urlInputRef.current?.focus(), 100);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error('LinkedIn log error:', err);
      setSuccessMsg('❌ Error logging outreach');
    } finally {
      setSaving(false);
    }
  };

  // Keyboard shortcut
  const handleKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  // ── CSV Import ───────────────────────────────────────────
  const handleCsvFile = async (file) => {
    if (!file) return;
    setCsvImporting(true);
    setCsvResult(null);
    try {
      const Papa = (await import('papaparse')).default;
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          const rows = results.data;
          if (rows.length === 0) {
            setCsvResult({ error: 'No data rows found in CSV.' });
            setCsvImporting(false);
            return;
          }
          const result = await bulkImportLinkedInOutreach(rows);
          setCsvResult(result);
          setCsvImporting(false);
        },
        error: (err) => {
          setCsvResult({ error: err.message });
          setCsvImporting(false);
        }
      });
    } catch (err) {
      setCsvResult({ error: err.message });
      setCsvImporting(false);
    }
  };

  const canSubmit = form.linkedin_url.trim() && form.action_type && form.contact_name.trim() && form.company_name.trim();

  return (
    <div className="li-page" onKeyDown={handleKeyDown}>
      {/* ── Header ────────── */}
      <div className="li-header">
        <h1><Link2 size={22} color="#0a66c2" /> LinkedIn Outreach</h1>
        <div className="li-header-actions">
          {isAdmin && (
            <select
              className="li-sdr-filter"
              value={sdrFilter}
              onChange={e => setSdrFilter(e.target.value)}
            >
              <option value="mine">My Activity</option>
              <option value="all">All Team</option>
              {team?.map(m => (
                <option key={m.id} value={m.id}>
                  {m.full_name || m.name || m.email}
                </option>
              ))}
            </select>
          )}
          <button className="btn btn-ghost btn-sm" onClick={() => setShowCsvModal(true)}>
            <Upload size={14} /> Import CSV
          </button>
        </div>
      </div>

      {/* ── Metrics Bar ────────── */}
      <div className="li-metrics-bar">
        <div className="li-metric-card">
          <span className="li-metric-icon">⚡</span>
          <span className="li-metric-value" style={{ color: '#0a66c2' }}>{metrics.totalToday}</span>
          <span className="li-metric-label">Touches Today</span>
        </div>
        <div className="li-metric-card">
          <span className="li-metric-icon">🤝</span>
          <span className="li-metric-value" style={{ color: '#3b82f6' }}>{metrics.requestsSent}</span>
          <span className="li-metric-label">Requests Sent</span>
        </div>
        <div className="li-metric-card">
          <span className="li-metric-icon">✅</span>
          <span className="li-metric-value" style={{ color: '#16a34a' }}>{metrics.accepted}</span>
          <span className="li-metric-label">Accepted</span>
        </div>
        <div className="li-metric-card">
          <span className="li-metric-icon">💬</span>
          <span className="li-metric-value" style={{ color: '#d97706' }}>{metrics.messagesSent}</span>
          <span className="li-metric-label">Messages Sent</span>
        </div>
        <div className="li-metric-card">
          <span className="li-metric-icon">🎯</span>
          <span className="li-metric-value" style={{ color: '#dc2626' }}>{metrics.replies}</span>
          <span className="li-metric-label">Replies</span>
        </div>
        <div className="li-metric-card">
          <span className="li-metric-icon">📅</span>
          <span className="li-metric-value" style={{ color: '#7c3aed' }}>{metrics.demosBooked}</span>
          <span className="li-metric-label">Demos Booked</span>
        </div>
        <div className="li-metric-card">
          <span className="li-metric-icon">📊</span>
          <span className="li-metric-value" style={{ color: '#0891b2' }}>{metrics.replyRate}%</span>
          <span className="li-metric-label">Reply Rate</span>
        </div>
      </div>

      {/* ── Rapid Logger ────────── */}
      <div className={`li-logger-section${loggerOpen ? '' : ' collapsed'}`} onClick={!loggerOpen ? () => setLoggerOpen(true) : undefined}>
        <div className="li-logger-header">
          <h3>🚀 Quick Logger {successMsg && <span style={{ fontWeight: 500, fontSize: 12, color: successMsg.startsWith('✅') ? '#16a34a' : '#dc2626' }}>{successMsg}</span>}</h3>
          <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); setLoggerOpen(!loggerOpen); }}>
            {loggerOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

        {loggerOpen && (
          <>
            <div className="li-logger-grid">
              <div className="li-logger-field" style={{ gridColumn: '1 / -1' }}>
                <label>LinkedIn Profile URL *</label>
                <input
                  ref={urlInputRef}
                  placeholder="https://linkedin.com/in/john-doe"
                  value={form.linkedin_url}
                  onChange={e => handleUrlPaste(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="li-logger-field">
                <label>Contact Name *</label>
                <input
                  placeholder="e.g. John Doe"
                  value={form.contact_name}
                  onChange={e => set('contact_name', e.target.value)}
                />
              </div>
              <div className="li-logger-field">
                <label>Company *</label>
                <input
                  placeholder="e.g. Acme Corp"
                  value={form.company_name}
                  onChange={e => set('company_name', e.target.value)}
                />
              </div>
              <div className="li-logger-field">
                <label>Designation</label>
                <input
                  placeholder="e.g. VP of Sales"
                  value={form.designation}
                  onChange={e => set('designation', e.target.value)}
                />
              </div>
              <div className="li-logger-field">
                <label>Notes</label>
                <input
                  placeholder="Quick note (optional)"
                  value={form.notes}
                  onChange={e => set('notes', e.target.value)}
                />
              </div>
            </div>

            {/* Action Type Pills */}
            <div className="li-logger-field" style={{ marginTop: 12 }}>
              <label>Action *</label>
              <div className="li-action-pills">
                {ACTION_TYPES.map(a => (
                  <button
                    key={a.id}
                    className={`li-action-pill${form.action_type === a.id ? ' active' : ''}`}
                    onClick={() => set('action_type', a.id)}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sentiment (only if replied) */}
            {form.action_type === 'replied' && (
              <div className="li-logger-field" style={{ marginTop: 10 }}>
                <label>Reply Sentiment</label>
                <div className="li-action-pills">
                  {SENTIMENTS.map(s => (
                    <button
                      key={s.id}
                      className={`li-action-pill sentiment${form.reply_sentiment === s.id ? ` active ${s.color}` : ''}`}
                      onClick={() => set('reply_sentiment', s.id)}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="li-submit-row">
              <span className="li-submit-hint">⌘+Enter to submit</span>
              <button className="li-submit-btn" onClick={handleSubmit} disabled={!canSubmit || saving}>
                <Link2 size={14} /> {saving ? 'Saving...' : 'Log & Sync to CRM'}
              </button>
            </div>
          </>
        )}
      </div>

      {/* ── Tabs ────────── */}
      <div className="li-tabs">
        {[
          { id: 'all', label: 'All Activity' },
          ...ACTION_TYPES.map(a => ({ id: a.id, label: a.short })),
        ].map(t => (
          <button
            key={t.id}
            className={`li-tab${activeTab === t.id ? ' active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
            <span className="li-tab-count">{tabCounts[t.id] || 0}</span>
          </button>
        ))}
      </div>

      {/* ── Search ────────── */}
      <div style={{ marginBottom: 14, display: 'flex', gap: 8, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 360 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
          <input
            placeholder="Search by name, company, or URL..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              paddingLeft: 32,
              padding: '8px 12px 8px 32px',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--bg-border)',
              borderRadius: 8,
              fontSize: 13,
              color: 'var(--text-primary)',
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* ── Activity Table ────────── */}
      {filteredLogs.length === 0 ? (
        <div className="li-empty">
          <div className="li-empty-icon">🔗</div>
          <h3>No LinkedIn activity yet</h3>
          <p>Use the Quick Logger above to start tracking your LinkedIn outreach.</p>
        </div>
      ) : (
        <div className="li-table-wrap">
          <table className="li-table">
            <thead>
              <tr>
                <th>Contact</th>
                <th>Company</th>
                <th>Action</th>
                <th>Sentiment</th>
                <th>Profile</th>
                <th>Notes</th>
                {isAdmin && <th>SDR</th>}
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map(log => {
                const sdr = team?.find(m => m.id === log.owner_id);
                const sdrName = sdr?.full_name || sdr?.name || sdr?.email?.split('@')[0] || '—';
                return (
                  <tr key={log.id}>
                    <td>
                      <div className="li-contact-cell">
                        <span className="li-contact-name">{log.contact_name || '—'}</span>
                        {log.designation && <span className="li-contact-title">{log.designation}</span>}
                      </div>
                    </td>
                    <td>{log.company_name || '—'}</td>
                    <td>
                      <span className={`li-action-badge ${log.action_type}`}>
                        {ACTION_BADGE_LABELS[log.action_type] || log.action_type}
                      </span>
                    </td>
                    <td>
                      {log.reply_sentiment ? (
                        <span className={`li-sentiment-badge ${log.reply_sentiment}`}>
                          {log.reply_sentiment.replace('_', ' ')}
                        </span>
                      ) : '—'}
                    </td>
                    <td>
                      {log.linkedin_url ? (
                        <a
                          href={log.linkedin_url.startsWith('http') ? log.linkedin_url : `https://${log.linkedin_url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="li-profile-link"
                        >
                          <ExternalLink size={11} /> Open
                        </a>
                      ) : '—'}
                    </td>
                    <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {log.notes || '—'}
                    </td>
                    {isAdmin && <td style={{ fontSize: 12 }}>{sdrName}</td>}
                    <td style={{ fontSize: 12, color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>
                      {log.created_at ? new Date(log.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── CSV Import Modal ────────── */}
      {showCsvModal && (
        <div className="li-csv-overlay" onClick={() => { setShowCsvModal(false); setCsvResult(null); }}>
          <div className="li-csv-modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3>📥 Import LinkedIn Prospects</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => { setShowCsvModal(false); setCsvResult(null); }}><X size={16} /></button>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
              Upload a CSV from <strong>Sales Navigator</strong>, <strong>Apollo</strong>, or any tool with LinkedIn URLs.
              Required columns: <code>LinkedIn URL</code> (or <code>Profile URL</code>), <code>Name</code>, <code>Company</code>.
            </p>
            <div
              className={`li-csv-dropzone${csvImporting ? ' active' : ''}`}
              onClick={() => csvInputRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); handleCsvFile(e.dataTransfer.files[0]); }}
            >
              <input
                ref={csvInputRef}
                type="file"
                accept=".csv"
                style={{ display: 'none' }}
                onChange={e => handleCsvFile(e.target.files[0])}
              />
              {csvImporting ? (
                <p style={{ fontWeight: 600, color: '#0a66c2' }}>⏳ Importing & syncing to CRM...</p>
              ) : (
                <>
                  <Upload size={28} color="var(--text-tertiary)" />
                  <p style={{ marginTop: 8, fontWeight: 600 }}>Click or drag CSV file here</p>
                </>
              )}
            </div>
            {csvResult && (
              <div className="li-csv-result">
                {csvResult.error ? (
                  <p style={{ color: '#dc2626' }}>❌ {csvResult.error}</p>
                ) : (
                  <>
                    <p style={{ fontWeight: 700, marginBottom: 6 }}>✅ Import Complete</p>
                    <p>Total rows: <strong>{csvResult.total}</strong></p>
                    <p>New leads created: <strong style={{ color: '#16a34a' }}>{csvResult.created}</strong></p>
                    <p>Merged with existing: <strong style={{ color: '#0a66c2' }}>{csvResult.merged}</strong></p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
