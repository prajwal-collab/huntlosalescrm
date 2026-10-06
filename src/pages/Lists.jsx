// ============================================
// HUNTLO — SMART LISTS & SEGMENTS
// Fully functional CRM list management
// ============================================
import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Database, Plus, Sparkles, Filter, Download, Upload,
  Search, ArrowLeft, Users, Calendar, Target,
  Activity, Mail, Phone, Zap, UserPlus, TrendingUp,
  Clock, CheckSquare, Edit2, X, Trash2, MoreVertical,
  ChevronDown, ChevronLeft, ChevronRight, Eye, Copy,
  ArrowUpRight, CheckCircle, AlertCircle, RefreshCw
} from 'lucide-react';
import useDataStore from '../store/useDataStore';
import useAuthStore from '../store/useAuthStore';
import CsvImporterModal from '../components/CsvImporterModal';
import BulkEditModal from '../components/BulkEditModal';
import LeadDrawer from '../components/leads/LeadDrawer';
import { exportToCsv } from '../utils/exportCsv';
import { useDialog } from '../context/DialogContext';
import { computeSignalScore, computeCompleteness, getCompletenessColor } from '../utils/leadScoring';
import './Lists.css';

// ── Stage colours (reuse from Leads) ───────────────────────
const STAGE_COLORS = {
  'New Lead':           { bg: 'rgba(100,116,139,0.1)', color: '#64748b' },
  'Researching':        { bg: 'rgba(99,102,241,0.1)',  color: '#6366f1' },
  'Ready for Outreach': { bg: 'rgba(6,182,212,0.1)',   color: '#0891b2' },
  'Outreach Started':   { bg: 'rgba(245,158,11,0.1)',  color: '#d97706' },
  'Engaged':            { bg: 'rgba(249,115,22,0.1)',  color: '#ea580c' },
  'Qualified':          { bg: 'rgba(59,130,246,0.1)',   color: '#2563eb' },
  'Demo Scheduled':     { bg: 'rgba(139,92,246,0.1)',   color: '#7c3aed' },
  'Demo Complete':      { bg: 'rgba(34,197,94,0.1)',    color: '#16a34a' },
  'Trial Started':      { bg: 'rgba(34,197,94,0.15)',   color: '#15803d' },
  'Customer':           { bg: 'rgba(34,197,94,0.2)',    color: '#166534' },
  'Lost':               { bg: 'rgba(239,68,68,0.1)',    color: '#dc2626' },
};

const LOGO_COLORS = ['#3b82f6','#8b5cf6','#06b6d4','#f97316','#22c55e','#ec4899','#6366f1','#14b8a6'];

// ── Segment filter definitions ─────────────────────────────
const SEGMENT_DEFS = [
  { id: 'all',      label: 'All Leads',         icon: Database, color: '#64748b', filter: () => true },
  { id: 'hot',      label: '🔥 Hot Leads',      icon: Target,   color: '#dc2626', filter: l => computeSignalScore(l) >= 70 },
  { id: 'new',      label: '🆕 New Leads',      icon: Plus,     color: '#3b82f6', filter: l => l.stage === 'New Lead' },
  { id: 'engaged',  label: '💬 Engaged',        icon: Activity, color: '#ea580c', filter: l => l.stage === 'Engaged' || l.stage === 'Qualified' },
  { id: 'enriched', label: '✨ Enriched',       icon: Sparkles, color: '#8b5cf6', filter: l => l.enrichment_done },
  { id: 'no_contact', label: '📵 No Contact',   icon: Phone,    color: '#f97316', filter: l => !l.phone && !l.email },
  { id: 'high_mrr', label: '💰 High MRR',       icon: TrendingUp, color: '#16a34a', filter: l => (l.estimated_mrr || 0) >= 500 },
  { id: 'stale',    label: '🕸️ Stale (>14d)',    icon: Clock,    color: '#94a3b8', filter: l => {
    if (!l.updated_at || l.stage === 'Customer' || l.stage === 'Lost') return false;
    return (Date.now() - new Date(l.updated_at).getTime()) > 14 * 86400000;
  }},
];


// ── Lead Row Component ─────────────────────────────────────
function ListLeadRow({ lead, isSelected, onSelect, onClick, team, user, onCall, onStageChange, onOwnerChange }) {
  const score = useMemo(() => computeSignalScore(lead), [lead]);
  const completeness = useMemo(() => computeCompleteness(lead), [lead]);
  const completenessColor = getCompletenessColor(completeness);
  const stageStyle = STAGE_COLORS[lead.stage] || STAGE_COLORS['New Lead'];
  const logoColor = LOGO_COLORS[(lead.company_name?.charCodeAt(0) || 0) % LOGO_COLORS.length];
  const initial = (lead.company_name || '?').charAt(0).toUpperCase();
  const ownerName = team?.find(t => t.id === lead.owner_id)?.name || 'Unassigned';

  return (
    <div className={`list-lead-row${isSelected ? ' selected' : ''}`} onClick={() => onClick(lead)}>
      {/* Checkbox */}
      <div className="llr-cell llr-check" onClick={e => { e.stopPropagation(); onSelect(lead.id); }}>
        <input type="checkbox" checked={isSelected} onChange={() => {}} className="custom-checkbox" />
      </div>

      {/* Company + Contact */}
      <div className="llr-cell llr-company">
        <div className="llr-logo" style={{ background: logoColor }}>{initial}</div>
        <div className="llr-company-info">
          <span className="llr-company-name">{lead.company_name || '—'}</span>
          <span className="llr-contact-name">{lead.contact_name || lead.designation || 'No contact'}</span>
        </div>
      </div>

      {/* Contact Details */}
      <div className="llr-cell llr-contact-details">
        {lead.email ? (
          <div className="llr-contact-item"><Mail size={12} /> <span>{lead.email}</span></div>
        ) : (
          <div className="llr-contact-item missing">No email</div>
        )}
        {lead.phone ? (
          <div className="llr-contact-item"><Phone size={12} /> <span>{lead.phone}</span></div>
        ) : null}
      </div>

      {/* Owner */}
      <div className="llr-cell llr-owner" onClick={e => e.stopPropagation()}>
        <div className={`llr-owner-badge ${!lead.owner_id ? 'unassigned' : ''}`}>
          {lead.owner_id && <div className="llr-owner-avatar">{ownerName.charAt(0)}</div>}
          <select
            className="llr-owner-select"
            value={lead.owner_id || ''}
            onChange={(e) => onOwnerChange(lead, e.target.value)}
          >
            <option value="">Unassigned</option>
            {team?.map(member => (
              <option key={member.id} value={member.id}>{member.name || member.full_name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stage */}
      <div className="llr-cell llr-stage" onClick={e => e.stopPropagation()}>
        <select
          className="llr-stage-select"
          style={{ background: stageStyle.bg, color: stageStyle.color, border: `1px solid ${stageStyle.bg}` }}
          value={lead.stage || 'New Lead'}
          onChange={(e) => onStageChange(lead, e.target.value)}
        >
          {Object.keys(STAGE_COLORS).map(st => (
            <option key={st} value={st} style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}>{st}</option>
          ))}
        </select>
      </div>

      {/* Score */}
      <div className="llr-cell llr-score">
        <div className={`llr-score-badge ${score >= 70 ? 'high' : score >= 35 ? 'medium' : 'low'}`}>
          {score}
        </div>
      </div>

      {/* Completeness */}
      <div className="llr-cell llr-completeness">
        <div className="llr-completeness-bar" title={`${completeness}% complete`}>
          <div className="llr-completeness-fill" style={{ width: `${completeness}%`, background: completenessColor }} />
        </div>
        <span className="llr-completeness-text">{completeness}%</span>
      </div>

      {/* Actions */}
      <div className="llr-cell llr-actions" onClick={e => e.stopPropagation()}>
        <button className="llr-action-btn" title="Call" onClick={() => onCall(lead)} disabled={!lead.phone}>
          <Phone size={14} />
        </button>
        <button className="llr-action-btn" title="View Details" onClick={() => onClick(lead)}>
          <Eye size={14} />
        </button>
      </div>
    </div>
  );
}


// ── Main Lists Component ───────────────────────────────────
export default function Lists() {
  const { list_leads, updateListLead, bulkCreateListLeads, bulkUpdateListLeads, bulkDeleteListLeads, appendListLeadNotes, pushListLeadsToLeads } = useDataStore();
  const { team, user } = useAuthStore();
  const { showConfirm, showPrompt } = useDialog();

  // View state
  const [activeSegment, setActiveSegment] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);

  // Modal state
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false);
  const [callingLead, setCallingLead] = useState(null);
  const [callNotes, setCallNotes] = useState('');
  const [callOutcome, setCallOutcome] = useState('connected');
  const [callSaving, setCallSaving] = useState(false);

  // Filter state
  const [filterStage, setFilterStage] = useState('');
  const [filterSource, setFilterSource] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Push to leads state
  const [pushingIds, setPushingIds] = useState([]);
  const [pushSuccess, setPushSuccess] = useState(false);

  // ── Computed data ──
  const segmentDef = SEGMENT_DEFS.find(s => s.id === activeSegment) || SEGMENT_DEFS[0];

  const filtered = useMemo(() => {
    let result = list_leads.filter(segmentDef.filter);

    if (filterStage) result = result.filter(l => l.stage === filterStage);
    if (filterSource) result = result.filter(l => (l.source || '').toLowerCase().includes(filterSource.toLowerCase()));

    const q = (searchQuery || '').toLowerCase();
    if (q) {
      result = result.filter(l =>
        (l.company_name || '').toLowerCase().includes(q) ||
        (l.contact_name || '').toLowerCase().includes(q) ||
        (l.email || '').toLowerCase().includes(q) ||
        (l.phone || '').toLowerCase().includes(q) ||
        (l.industry || '').toLowerCase().includes(q)
      );
    }

    return result;
  }, [list_leads, segmentDef, searchQuery, filterStage, filterSource]);

  const segmentCounts = useMemo(() =>
    Object.fromEntries(SEGMENT_DEFS.map(s => [s.id, list_leads.filter(s.filter).length])),
    [list_leads]
  );

  // Reset page when filters change
  useEffect(() => { setCurrentPage(1); }, [filtered.length, itemsPerPage, activeSegment]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginatedLeads = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // ── Stats ──
  const stats = useMemo(() => {
    const total = filtered.length;
    const withEmail = filtered.filter(l => l.email).length;
    const withPhone = filtered.filter(l => l.phone).length;
    const avgScore = total > 0 ? Math.round(filtered.reduce((sum, l) => sum + computeSignalScore(l), 0) / total) : 0;
    const totalMRR = filtered.reduce((sum, l) => sum + (l.estimated_mrr || 0), 0);
    return { total, withEmail, withPhone, avgScore, totalMRR };
  }, [filtered]);

  // ── Handlers ──
  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleAll = () => {
    if (selectedIds.length === paginatedLeads.length && paginatedLeads.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedLeads.map(l => l.id));
    }
  };

  const handleLeadClick = (lead) => {
    setSelectedLead(prev => prev?.id === lead.id ? null : lead);
  };

  const handleLeadUpdate = async (id, updates) => {
    try {
      const updated = await updateListLead(id, updates);
      if (updated) setSelectedLead(updated);
    } catch (err) {
      console.error('Lead update failed:', err);
    }
  };

  const handleStageChange = async (lead, newStage) => {
    let updateObj = { stage: newStage };
    if (newStage === 'Lost') {
      const reason = await showPrompt(
        'Mark Lead as Lost',
        `Why is ${lead.company_name || 'this lead'} being marked as lost?`,
        'e.g. Pricing, Competitor, No Need…',
        'Mark as Lost',
        'Cancel'
      );
      if (reason) {
        updateObj.lost_reason = reason;
        updateObj.notes = lead.notes ? `${lead.notes}\n[Lost Reason]: ${reason}` : `[Lost Reason]: ${reason}`;
      } else return;
    }
    await updateListLead(lead.id, updateObj);
  };

  const handleBulkDelete = async () => {
    const confirmed = await showConfirm(
      'Delete Selected Leads',
      `Are you sure you want to permanently delete ${selectedIds.length} leads? This cannot be undone.`
    );
    if (!confirmed) return;
    await bulkDeleteListLeads(selectedIds);
    setSelectedIds([]);
    if (selectedLead && selectedIds.includes(selectedLead.id)) setSelectedLead(null);
  };

  const handleBulkStageChange = async (newStage) => {
    try {
      await bulkUpdateListLeads(selectedIds, { stage: newStage });
      setSelectedIds([]);
    } catch (err) {
      console.error('Bulk stage update failed:', err);
    }
  };

  const handleBulkOwnerChange = async (newOwnerId) => {
    try {
      await bulkUpdateListLeads(selectedIds, { owner_id: newOwnerId });
      setSelectedIds([]);
    } catch (err) {
      console.error('Bulk owner update failed:', err);
    }
  };

  const handleOwnerChange = async (lead, newOwnerId) => {
    try {
      await updateListLead(lead.id, { owner_id: newOwnerId });
    } catch (err) {
      console.error('Owner update failed:', err);
    }
  };

  const handleExport = () => {
    exportToCsv('smart-list-export.csv', filtered);
  };

  // ── Call Logging ──
  const handleStartCall = (lead) => {
    if (!lead.phone) return;
    setCallingLead(lead);
    setCallNotes('');
    setCallOutcome('connected');
  };

  const handleEndCall = async () => {
    if (!callingLead) return;
    setCallSaving(true);
    try {
      const outcomeLabels = {
        connected: 'Connected — Had conversation',
        voicemail: 'Left voicemail',
        no_answer: 'No answer',
        callback: 'Requested callback',
        not_interested: 'Not interested',
      };
      const noteText = `Call: ${outcomeLabels[callOutcome] || callOutcome}${callNotes ? ` — ${callNotes}` : ''}`;
      const stageUpdate = callOutcome === 'connected' ? 'Engaged' : callOutcome === 'not_interested' ? 'Lost' : undefined;
      await appendListLeadNotes(callingLead.id, noteText, stageUpdate);
      setCallingLead(null);
      setCallNotes('');
    } catch (err) {
      console.error('Call log failed:', err);
    } finally {
      setCallSaving(false);
    }
  };

  // ── Unique sources for filter dropdown ──
  const uniqueSources = useMemo(() => {
    const sources = [...new Set(list_leads.map(l => l.source).filter(Boolean))];
    return sources.sort();
  }, [list_leads]);

  const handlePushToLeads = async () => {
    setPushingIds(selectedIds);
    try {
      await pushListLeadsToLeads(selectedIds);
      setPushSuccess(true);
      setTimeout(() => setPushSuccess(false), 3000);
      setSelectedIds([]);
    } catch (e) {
      console.error('Failed to push leads', e);
      alert('Failed to push to Leads CRM');
    } finally {
      setPushingIds([]);
    }
  };

  return (
    <div className="lists-page-container">

      {/* ── Header ────────────────────────────────────────── */}
      <div className="lists-header">
        <div>
          <h1 className="lists-title">
            <Database size={24} style={{ color: 'var(--accent-blue)' }} />
            Smart Lists
          </h1>
          <p className="lists-subtitle">
            Segment, enrich, call and manage your leads pipeline — all in one place.
          </p>
        </div>
        <div className="lists-actions">
          <button className="btn btn-ghost" onClick={handleExport}>
            <Download size={16} /> Export
          </button>
          <button className="btn btn-ghost" onClick={() => setIsImportOpen(true)}>
            <Upload size={16} /> Import
          </button>
        </div>
      </div>

      {/* ── Stats Bar ─────────────────────────────────────── */}
      <div className="global-stats-row">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}><Users size={18} /></div>
          <div className="stat-content">
            <div className="stat-label">Total in Segment</div>
            <div className="stat-value">{stats.total.toLocaleString()}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}><Mail size={18} /></div>
          <div className="stat-content">
            <div className="stat-label">With Email</div>
            <div className="stat-value">{stats.withEmail} <span className="stat-pct">({stats.total > 0 ? Math.round(stats.withEmail / stats.total * 100) : 0}%)</span></div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}><Phone size={18} /></div>
          <div className="stat-content">
            <div className="stat-label">With Phone</div>
            <div className="stat-value">{stats.withPhone} <span className="stat-pct">({stats.total > 0 ? Math.round(stats.withPhone / stats.total * 100) : 0}%)</span></div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}><TrendingUp size={18} /></div>
          <div className="stat-content">
            <div className="stat-label">Avg. Score</div>
            <div className="stat-value">{stats.avgScore}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}><Target size={18} /></div>
          <div className="stat-content">
            <div className="stat-label">Est. MRR</div>
            <div className="stat-value">₹{stats.totalMRR > 1000 ? `${(stats.totalMRR / 1000).toFixed(0)}k` : stats.totalMRR.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* ── Segment Tabs ──────────────────────────────────── */}
      <div className="segment-tabs-bar">
        <div className="segment-tabs-scroll">
          {SEGMENT_DEFS.map(seg => (
            <button
              key={seg.id}
              className={`segment-tab ${activeSegment === seg.id ? 'active' : ''}`}
              onClick={() => { setActiveSegment(seg.id); setSelectedIds([]); }}
              style={activeSegment === seg.id ? { borderColor: seg.color } : {}}
            >
              <span className="segment-tab-label">{seg.label}</span>
              <span className="segment-tab-count">{segmentCounts[seg.id] || 0}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Toolbar (Search + Filters) ────────────────────── */}
      <div className="list-toolbar">
        <div className="toolbar-left">
          <div className="search-bar">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search by name, company, email, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="search-clear" onClick={() => setSearchQuery('')}><X size={14} /></button>
            )}
          </div>
          <button className={`btn btn-ghost btn-sm ${showFilters ? 'active' : ''}`} onClick={() => setShowFilters(!showFilters)}>
            <Filter size={14} /> Filters {(filterStage || filterSource) && <span className="filter-active-dot" />}
          </button>
        </div>
        <div className="toolbar-right">
          <span className="toolbar-count">{filtered.length} leads</span>
        </div>
      </div>

      {/* ── Filter Bar (Collapsible) ──────────────────────── */}
      {showFilters && (
        <div className="filter-bar">
          <div className="filter-group">
            <label>Stage</label>
            <select className="filter-select" value={filterStage} onChange={e => setFilterStage(e.target.value)}>
              <option value="">All Stages</option>
              {Object.keys(STAGE_COLORS).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="filter-group">
            <label>Source</label>
            <select className="filter-select" value={filterSource} onChange={e => setFilterSource(e.target.value)}>
              <option value="">All Sources</option>
              {uniqueSources.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => { setFilterStage(''); setFilterSource(''); }}>
            <X size={14} /> Clear
          </button>
        </div>
      )}

      {/* ── Bulk Action Bar ───────────────────────────────── */}
      {selectedIds.length > 0 && (
        <div className="bulk-action-bar">
          <div className="bulk-count">
            <span className="count-badge">{selectedIds.length}</span> leads selected
          </div>
          <div className="bulk-actions">
            <button className="btn btn-primary btn-sm" onClick={handlePushToLeads} disabled={pushingIds.length > 0}>
              {pushingIds.length > 0 ? <RefreshCw size={14} className="spinning" /> : <ArrowUpRight size={14} />}
              Push to CRM
            </button>
            <button className="btn btn-outline btn-sm" onClick={() => setIsBulkEditOpen(true)}>
              <Edit2 size={14} /> Bulk Edit
            </button>
            <div className="bulk-stage-dropdown" style={{ position: 'relative' }}>
              <select
                className="btn btn-outline btn-sm bulk-stage-select"
                value=""
                onChange={(e) => { if (e.target.value) handleBulkStageChange(e.target.value); }}
              >
                <option value="">Change Stage...</option>
                {Object.keys(STAGE_COLORS).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="bulk-stage-dropdown" style={{ position: 'relative' }}>
              <select
                className="btn btn-outline btn-sm bulk-stage-select"
                value=""
                onChange={(e) => { if (e.target.value) handleBulkOwnerChange(e.target.value); }}
              >
                <option value="">Assign Owner...</option>
                {team?.map(member => <option key={member.id} value={member.id}>{member.name || member.full_name}</option>)}
              </select>
            </div>
            <button className="btn btn-outline btn-sm btn-danger" onClick={handleBulkDelete}>
              <Trash2 size={14} /> Delete
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => setSelectedIds([])}>
              <X size={14} /> Clear
            </button>
          </div>
        </div>
      )}

      {/* ── Data Table ────────────────────────────────────── */}
      <div className="list-data-wrapper">
        {/* Table Header */}
        <div className="list-lead-row list-header-row">
          <div className="llr-cell llr-check" onClick={e => { e.stopPropagation(); toggleAll(); }}>
            <input
              type="checkbox"
              checked={selectedIds.length === paginatedLeads.length && paginatedLeads.length > 0}
              onChange={() => {}}
              className="custom-checkbox"
            />
          </div>
          <div className="llr-cell llr-company">Company / Contact</div>
          <div className="llr-cell llr-contact-details">Contact Info</div>
          <div className="llr-cell llr-owner">Owner</div>
          <div className="llr-cell llr-stage">Stage</div>
          <div className="llr-cell llr-score">Score</div>
          <div className="llr-cell llr-completeness">Complete</div>
          <div className="llr-cell llr-actions">Actions</div>
        </div>

        {/* Table Body */}
        <div className="list-data-body">
          {paginatedLeads.length > 0 ? (
            paginatedLeads.map(lead => (
              <ListLeadRow
                key={lead.id}
                lead={lead}
                isSelected={selectedIds.includes(lead.id)}
                onSelect={toggleSelect}
                onClick={handleLeadClick}
                team={team}
                user={user}
                onCall={handleStartCall}
                onStageChange={handleStageChange}
                onOwnerChange={handleOwnerChange}
              />
            ))
          ) : (
            <div className="list-empty-state">
              <Database size={48} />
              <h3>No leads in this segment</h3>
              <p>Try adjusting your filters or import new leads to get started.</p>
              <button className="btn btn-primary" onClick={() => setIsImportOpen(true)}>
                <Upload size={16} /> Import Leads
              </button>
            </div>
          )}
        </div>

        {/* ── Pagination ──────────────────────────────────── */}
        {filtered.length > 0 && (
          <div className="list-pagination-bar">
            <div className="pagination-left">
              Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filtered.length)}–{Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length}
            </div>
            <div className="pagination-right">
              <select
                value={itemsPerPage}
                onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                className="pagination-per-page"
              >
                <option value={10}>10 / page</option>
                <option value={25}>25 / page</option>
                <option value={50}>50 / page</option>
                <option value={100}>100 / page</option>
              </select>
              <div className="pagination-controls">
                <button className="pagination-btn" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
                  <ChevronLeft size={16} />
                </button>
                <span className="pagination-info">Page {currentPage} of {totalPages}</span>
                <button className="pagination-btn" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Lead Detail Drawer ────────────────────────────── */}
      {selectedLead && (
        <LeadDrawer
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onUpdate={handleLeadUpdate}
          onDelete={async (id) => {
            await useDataStore.getState().deleteListLead(id);
            setSelectedLead(null);
          }}
        />
      )}

      {/* ── Call Modal ────────────────────────────────────── */}
      {callingLead && (
        <div className="modal-backdrop">
          <div className="modal-content call-modal">
            <div className="modal-header">
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="call-pulse-icon"><Phone size={18} /></div>
                Calling {callingLead.contact_name || callingLead.company_name}
              </h3>
              <button className="btn-close-modal" onClick={() => setCallingLead(null)}><X size={18} /></button>
            </div>
            <div className="call-modal-body">
              <div className="call-info-grid">
                <div className="call-info-item">
                  <span className="call-info-label">Company</span>
                  <span className="call-info-value">{callingLead.company_name || '—'}</span>
                </div>
                <div className="call-info-item">
                  <span className="call-info-label">Phone</span>
                  <span className="call-info-value call-phone">{callingLead.phone}</span>
                </div>
                {callingLead.email && (
                  <div className="call-info-item">
                    <span className="call-info-label">Email</span>
                    <span className="call-info-value">{callingLead.email}</span>
                  </div>
                )}
                {callingLead.designation && (
                  <div className="call-info-item">
                    <span className="call-info-label">Designation</span>
                    <span className="call-info-value">{callingLead.designation}</span>
                  </div>
                )}
              </div>

              <div className="call-field">
                <label>Call Outcome</label>
                <select className="call-outcome-select" value={callOutcome} onChange={e => setCallOutcome(e.target.value)}>
                  <option value="connected">✅ Connected</option>
                  <option value="voicemail">📩 Left Voicemail</option>
                  <option value="no_answer">📵 No Answer</option>
                  <option value="callback">🔄 Requested Callback</option>
                  <option value="not_interested">❌ Not Interested</option>
                </select>
              </div>

              <div className="call-field">
                <label>Call Notes</label>
                <textarea
                  className="call-notes-input"
                  placeholder="What was discussed? Key takeaways..."
                  value={callNotes}
                  onChange={(e) => setCallNotes(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="call-modal-actions">
                <button className="btn btn-ghost" onClick={() => setCallingLead(null)} disabled={callSaving}>Cancel</button>
                <button className="btn btn-primary" onClick={handleEndCall} disabled={callSaving}>
                  {callSaving ? <><RefreshCw size={16} className="spinning" /> Saving...</> : <><CheckCircle size={16} /> End Call & Save</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── CSV Import Modal ──────────────────────────────── */}
      <CsvImporterModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        type="list_leads"
      />

      {/* ── Bulk Edit Modal ───────────────────────────────── */}
      <BulkEditModal
        isOpen={isBulkEditOpen}
        onClose={() => setIsBulkEditOpen(false)}
        entityType="leads"
        selectedIds={selectedIds}
        onClearSelection={() => setSelectedIds([])}
      />
    </div>
  );
}
