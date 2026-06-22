// ============================================
// HUNTLO — LEADS PAGE
// AI-Native Signal-Driven Lead System
// ============================================
import { useState, useMemo } from 'react';
import {
  Search, Plus, X, Zap, TrendingUp, Building2,
  Mail, Link2, Phone, Globe, ChevronDown, ChevronLeft, ChevronRight,
  AlertCircle, Calendar, Target, DollarSign,
  Users, SlidersHorizontal, CheckCircle2, Download
} from 'lucide-react';
import useDataStore from '../store/useDataStore';
import useAuthStore from '../store/useAuthStore';
import useUIStore from '../store/useUIStore';
import { exportToCsv } from '../utils/exportCsv';
import LeadDrawer from '../components/leads/LeadDrawer';
import NewLeadForm from '../components/leads/NewLeadForm';
import EnrollSequenceModal from '../components/sequences/EnrollSequenceModal';
import CsvImporterModal from '../components/CsvImporterModal';
import BulkEditModal from '../components/BulkEditModal';
import { useDialog } from '../context/DialogContext';
import { computeSignalScore, getPriority } from '../utils/leadScoring';
import './Leads.css';

// ── Stage colours ───────────────────────────────────────────
const STAGE_COLORS = {
  'New Lead':          { bg: 'rgba(100,116,139,0.1)', color: '#64748b' },
  'Researching':       { bg: 'rgba(99,102,241,0.1)',  color: '#6366f1' },
  'Ready for Outreach':{ bg: 'rgba(6,182,212,0.1)',   color: '#0891b2' },
  'Outreach Started':  { bg: 'rgba(245,158,11,0.1)',  color: '#d97706' },
  'Engaged':           { bg: 'rgba(249,115,22,0.1)',  color: '#ea580c' },
  'Qualified':         { bg: 'rgba(59,130,246,0.1)',  color: '#2563eb' },
  'Demo Scheduled':    { bg: 'rgba(139,92,246,0.1)',  color: '#7c3aed' },
  'Demo Complete':     { bg: 'rgba(34,197,94,0.1)',   color: '#16a34a' },
  'Trial Started':     { bg: 'rgba(34,197,94,0.15)',  color: '#15803d' },
  'Customer':          { bg: 'rgba(34,197,94,0.2)',   color: '#166534' },
  'Lost':              { bg: 'rgba(239,68,68,0.1)',   color: '#dc2626' },
};

// Logo colour palette
const LOGO_COLORS = ['#3b82f6','#8b5cf6','#06b6d4','#f97316','#22c55e','#ec4899','#6366f1','#14b8a6'];

// ── Smart View definitions ──────────────────────────────────
const VIEWS = [
  { id: 'all',         label: 'All Leads',          dot: '#64748b',  filter: () => true },
  { id: 'hot',         label: '🔥 Hot Leads',        dot: '#dc2626',  filter: l => computeSignalScore(l) >= 70 },
  { id: 'signals',     label: '📈 Buying Signals',   dot: '#16a34a',  filter: l => {
    const s = l.signals || {};
    return s.hiring_activity || s.recruiter_hiring || s.funding_activity || l.demo_requested || l.positive_interest;
  }},
  { id: 'followup',    label: '⏰ Needs Follow-up',  dot: '#d97706',  filter: l => {
    if (!l.next_action_due) return false;
    return new Date(l.next_action_due) < new Date();
  }},
  { id: 'demo',        label: '📅 Demo Scheduled',   dot: '#7c3aed',  filter: l => l.stage === 'Demo Scheduled' },
  { id: 'trial',       label: '🧪 Trial Users',       dot: '#0891b2',  filter: l => l.stage === 'Trial Started' },
  { id: 'lost',        label: '❌ Lost',              dot: '#dc2626',  filter: l => l.stage === 'Lost' },
  { id: 'highMRR',     label: '💰 High MRR Potential',dot: '#16a34a', filter: l => (l.estimated_mrr || 0) >= 500 },
];

// ── Lead Row ────────────────────────────────────────────────
function LeadRow({ lead, isSelected, onSelect, onClick, updateLead, team, user }) {
  const score = useMemo(() => computeSignalScore(lead), [lead]);
  const priority = getPriority(score);
  const signals = lead.signals || {};
  const stageStyle = STAGE_COLORS[lead.stage] || STAGE_COLORS['New Lead'];
  const logoColor = LOGO_COLORS[(lead.company_name?.charCodeAt(0) || 0) % LOGO_COLORS.length];
  const initial = (lead.company_name || '?').charAt(0).toUpperCase();
  const isOverdue = lead.next_action_due && new Date(lead.next_action_due) < new Date();
  const scoreColor = score >= 70 ? '#dc2626' : score >= 35 ? '#d97706' : '#94a3b8';
  const isOwner = user?.id === lead.owner_id;

  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteValue, setNoteValue] = useState(lead.notes || '');

  const handleNoteSave = () => {
    setIsEditingNote(false);
    if (noteValue !== (lead.notes || '')) {
      updateLead(lead.id, { notes: noteValue });
    }
  };

  const activeSignals = [
    { key: 'hiring_activity',      emoji: '💼', tip: 'Hiring Activity' },
    { key: 'recruiter_hiring',     emoji: '🎯', tip: 'Recruiter Hiring' },
    { key: 'funding_activity',     emoji: '💰', tip: 'Funding Activity' },
    { key: 'linkedin_activity',    emoji: '🔗', tip: 'LinkedIn Activity' },
    { key: 'job_posting_activity', emoji: '📋', tip: 'Job Postings' },
    { key: 'company_growth',       emoji: '📈', tip: 'Company Growth' },
  ];

  return (
    <div
      className={`lead-row${isSelected ? ' selected' : ''}${!lead.next_action ? ' no-action' : ''}`}
      onClick={() => onClick(lead)}
    >
      {/* Checkbox */}
      <div className="lc" onClick={e => { e.stopPropagation(); onSelect(lead.id); }}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => {}}
          style={{ width: 15, height: 15, cursor: 'pointer', accentColor: 'var(--accent-blue)' }}
        />
      </div>

      {/* Company + Contact */}
      <div className="lead-company-cell">
        <div className="lead-logo" style={{ background: logoColor }}>{initial}</div>
        <div className="lead-company-info">
          <span className="lead-company-name">{lead.company_name || '—'}</span>
          <span className="lead-contact-name">{lead.contact_name || lead.designation || 'No contact'}</span>
        </div>
      </div>

      {/* Owner */}
      <div className="lc">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {(() => {
            const owner = team?.find(t => t.id === lead.owner_id);
            if (!owner) return <span style={{ color: 'var(--text-tertiary)' }}>Unassigned</span>;
            return (
              <>
                <div className="avatar" style={{ width: 18, height: 18, fontSize: 9, background: owner.color || '#3b82f6', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {owner.initials}
                </div>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{owner.name}</span>
              </>
            );
          })()}
        </div>
      </div>

      {/* Stage */}
      <div className="lc" onClick={(e) => e.stopPropagation()}>
        <select 
          className="stage-badge"
          style={{ 
            background: stageStyle.bg, 
            color: stageStyle.color, 
            border: 'none', 
            cursor: 'pointer',
            appearance: 'none',
            outline: 'none'
          }}
          value={lead.stage || 'New Lead'}
          onChange={(e) => updateLead(lead.id, { stage: e.target.value })}
        >
          {Object.keys(STAGE_COLORS).map(st => (
            <option key={st} value={st} style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}>{st}</option>
          ))}
        </select>
      </div>

      {/* Signal Score */}
      <div className="lc">
        <div className="signal-score-wrap">
          <div className="signal-score-bar">
            <div className="signal-score-fill" style={{ width: `${score}%`, background: scoreColor }} />
          </div>
          <span className="signal-score-text" style={{ color: scoreColor }}>{score}</span>
        </div>
      </div>

      {/* Priority */}
      <div className="lc">
        <span className={`badge priority-${priority.toLowerCase()}`}>{priority}</span>
      </div>

      {/* Signals */}
      <div className="lc">
        <div className="signals-cell">
          {activeSignals.map(({ key, emoji, tip }) => (
            <span
              key={key}
              className={`signal-icon ${signals[key] ? 'active-signal' : 'inactive'}`}
              title={signals[key] ? tip : `No ${tip}`}
              style={{ fontSize: 13 }}
            >
              {emoji}
            </span>
          ))}
        </div>
      </div>

      {/* Next Action */}
      <div className="lc">
        {lead.next_action ? (
          <div className="next-action-cell">
            <span className="next-action-text">{lead.next_action}</span>
            {lead.next_action_due && (
              <span className={`next-action-due${isOverdue ? ' overdue' : ''}`}>
                {isOverdue ? '⚠ Overdue · ' : ''}
                {new Date(lead.next_action_due).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            )}
          </div>
        ) : (
          <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>No action set</span>
        )}
      </div>

      {/* Est. MRR */}
      <div className="lc">
        {lead.estimated_mrr ? (
          <span style={{ fontSize: 13, fontWeight: 600, color: '#16a34a' }}>
            ${lead.estimated_mrr.toLocaleString()}/mo
          </span>
        ) : (
          <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>—</span>
        )}
      </div>

      {/* Notes / Remarks */}
      <div className="lc" style={{ paddingRight: 16 }} onClick={(e) => e.stopPropagation()} onDoubleClick={() => setIsEditingNote(true)}>
        {isEditingNote ? (
          <input
            autoFocus
            type="text"
            style={{ width: '100%', padding: '4px 8px', borderRadius: 4, border: '1px solid var(--accent-blue)', outline: 'none', fontSize: 12, background: 'var(--bg-base)', color: 'var(--text-primary)' }}
            value={noteValue}
            onChange={(e) => setNoteValue(e.target.value)}
            onBlur={handleNoteSave}
            onKeyDown={(e) => { if (e.key === 'Enter') handleNoteSave(); }}
          />
        ) : (
          <span style={{ fontSize: 12, color: noteValue ? 'var(--text-secondary)' : 'var(--text-tertiary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', cursor: 'pointer' }}>
            {noteValue || 'Double-click to add note...'}
          </span>
        )}
      </div>
    </div>
  );
}

function DraggableLeadCard({ lead, onClick, team }) {
  const [isDragging, setIsDragging] = useState(false);
  const score = computeSignalScore(lead);
  const scoreColor = score >= 70 ? '#dc2626' : score >= 35 ? '#d97706' : '#94a3b8';

  return (
    <div
      draggable
      onDragStart={e => {
        setIsDragging(true);
        e.dataTransfer.setData('leadId', lead.id);
        e.dataTransfer.effectAllowed = 'move';
      }}
      onDragEnd={() => setIsDragging(false)}
      className={`lead-board-card ${isDragging ? 'dragging-card' : ''}`}
      onClick={() => onClick(lead)}
    >
      <div className="lbc-top">
        <div className="lbc-company">{lead.company_name || 'Unknown'}</div>
        <div className="lbc-score" style={{ color: scoreColor }}>{score}</div>
      </div>
      <div className="lbc-contact">{lead.contact_name || lead.designation || 'No contact'}</div>
      {lead.next_action && (
        <div className="lbc-action">→ {lead.next_action}</div>
      )}
      <div className="lbc-footer">
        {lead.estimated_mrr > 0 ? (
          <span className="lbc-mrr">${(lead.estimated_mrr / 1000).toFixed(0)}k</span>
        ) : <span />}
        <span className="lbc-time">{new Date(lead.created_at).toLocaleDateString()}</span>
      </div>
    </div>
  );
}

function LeadKanbanColumn({ stage, leads, onLeadClick, onDrop, team }) {
  const [dragOver, setDragOver] = useState(false);
  
  return (
    <div
      className={`lead-kanban-col ${dragOver ? 'drag-over' : ''}`}
      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={e => { e.preventDefault(); setDragOver(false); onDrop(e, stage); }}
    >
      <div className="lkc-header">
        <div className="lkc-stage" style={{ color: STAGE_COLORS[stage]?.color || '#64748b' }}>{stage}</div>
        <div className="lkc-count">{leads.length}</div>
      </div>
      <div className="lkc-cards">
        {leads.map(lead => (
          <DraggableLeadCard key={lead.id} lead={lead} onClick={onLeadClick} team={team} />
        ))}
      </div>
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────
export default function Leads() {
  const { leads, deleteLead, bulkDeleteLeads, updateLead } = useDataStore();
  const { team, user } = useAuthStore();
  const { showConfirm } = useDialog();
  const [activeView, setActiveView] = useState('all');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'board'
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const { newLeadOpen, openNewLead, closeNewLead } = useUIStore();
  const [selectedLead, setSelectedLead] = useState(null);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [showBulkEdit, setShowBulkEdit] = useState(false);
  const [showImporter, setShowImporter] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Filter State
  const [filterStage, setFilterStage] = useState('');
  const [filterSource, setFilterSource] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  // Enrich each lead with computed score
  const enriched = useMemo(() =>
    leads.map(l => ({ ...l, _score: computeSignalScore(l) })),
    [leads]
  );

  // Apply view filter
  const viewDef = VIEWS.find(v => v.id === activeView) || VIEWS[0];
  const viewFiltered = useMemo(() => enriched.filter(viewDef.filter), [enriched, viewDef]);

  // Apply search and filters
  const filtered = useMemo(() => {
    let result = viewFiltered;
    
    // Apply Stage Filter
    if (filterStage) {
      result = result.filter(l => l.stage === filterStage);
    }
    
    // Apply Source Filter
    if (filterSource) {
      result = result.filter(l => (l.source || '').toLowerCase() === filterSource.toLowerCase());
    }
    
    // Apply Date Range Filter
    if (filterDateFrom) {
      result = result.filter(l => new Date(l.created_at) >= new Date(filterDateFrom));
    }
    if (filterDateTo) {
      // Add 1 day to include the end date fully
      const toDate = new Date(filterDateTo);
      toDate.setDate(toDate.getDate() + 1);
      result = result.filter(l => new Date(l.created_at) < toDate);
    }

    // Apply Search
    const q = (search || '').toLowerCase();
    if (q) {
      result = result.filter(l =>
        (l.company_name || '').toLowerCase().includes(q) ||
        (l.contact_name || '').toLowerCase().includes(q) ||
        (l.email || '').toLowerCase().includes(q) ||
        (l.stage || '').toLowerCase().includes(q)
      );
    }
    
    return result;
  }, [viewFiltered, search, filterStage, filterSource, filterDateFrom, filterDateTo]);

  // Reset pagination when search or view changes
  useMemo(() => setCurrentPage(1), [filtered.length, itemsPerPage]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginatedLeads = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const toggleSelect = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    // Select all visible leads (transparent team access)
    const selectable = filtered;
    if (selectedIds.length === selectable.length && selectable.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(selectable.map(l => l.id));
    }
  };

  const handleBulkDelete = async () => {
    const confirmed = await showConfirm(
      'Delete Selected Leads',
      `Are you sure you want to permanently delete these ${selectedIds.length} leads? This action cannot be undone.`
    );
    if (!confirmed) return;
    await bulkDeleteLeads(selectedIds);
    setSelectedIds([]);
    if (selectedLead && selectedIds.includes(selectedLead.id)) setSelectedLead(null);
  };

  const handleLeadClick = (lead) => {
    setSelectedLead(prev => prev?.id === lead.id ? null : lead);
  };

  const handleLeadUpdate = async (id, updates) => {
    try {
      const updated = await updateLead(id, updates);
      if (updated) setSelectedLead(updated);
    } catch (err) {
      console.error('Lead update failed:', err);
    }
  };

  const viewCounts = useMemo(() =>
    Object.fromEntries(VIEWS.map(v => [v.id, enriched.filter(v.filter).length])),
    [enriched]
  );

  return (
    <div className="leads-page">
      {/* Header */}
      <div className="leads-header">
        <div className="leads-header-left">
          <span className="leads-title">Leads</span>
          <span className="leads-count">{filtered.length}</span>
        </div>
        <div className="leads-header-right">
          <div style={{ display: 'flex', background: 'var(--bg-hover)', borderRadius: '6px', padding: '2px' }}>
            <button
              className="btn btn-ghost btn-sm"
              style={{ background: viewMode === 'list' ? 'var(--bg-surface)' : 'transparent', boxShadow: viewMode === 'list' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none' }}
              onClick={() => setViewMode('list')}
            >
              List
            </button>
            <button
              className="btn btn-ghost btn-sm"
              style={{ background: viewMode === 'board' ? 'var(--bg-surface)' : 'transparent', boxShadow: viewMode === 'board' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none' }}
              onClick={() => setViewMode('board')}
            >
              Board
            </button>
          </div>
          <button className="btn btn-ghost btn-sm" style={{ gap: 6, fontSize: 12 }}>
            <SlidersHorizontal size={14} /> Filter
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => exportToCsv('leads.csv', filtered)}
            style={{ gap: 6, fontSize: 13 }}
          >
            <Download size={14} /> Export
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setShowImporter(true)}
            style={{ fontSize: 13 }}
          >
            Import
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => openNewLead()}
            style={{ gap: 6, fontSize: 13 }}
          >
            <Plus size={15} /> New Lead
          </button>
        </div>
      </div>

      {/* Smart View Tabs */}
      <div className="leads-view-bar">
        {VIEWS.map(view => (
          <button
            key={view.id}
            className={`view-tab${activeView === view.id ? ' active' : ''}`}
            onClick={() => { setActiveView(view.id); setSelectedIds([]); setCurrentPage(1); }}
          >
            {view.label}
            {viewCounts[view.id] > 0 && (
              <span style={{
                fontSize: 10, fontWeight: 700,
                background: activeView === view.id ? 'var(--accent-blue-dim)' : 'var(--bg-border)',
                color: activeView === view.id ? '#fff' : 'var(--text-tertiary)',
                padding: '1px 6px', borderRadius: 10
              }}>
                {viewCounts[view.id]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="leads-toolbar" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="leads-search-wrap" style={{ minWidth: '200px' }}>
          <Search size={14} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
          <input
            placeholder="Search companies, contacts…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <X size={14} style={{ color: 'var(--text-tertiary)', cursor: 'pointer', flexShrink: 0 }}
              onClick={() => setSearch('')} />
          )}
        </div>

        {/* Filters */}
        <select 
          className="input-base" 
          style={{ width: 'auto', fontSize: 12, padding: '6px 12px', height: '32px' }}
          value={filterStage}
          onChange={e => setFilterStage(e.target.value)}
        >
          <option value="">All Stages</option>
          <option value="New Lead">New Lead</option>
          <option value="Researching">Researching</option>
          <option value="Ready for Outreach">Ready for Outreach</option>
          <option value="Outreach Started">Outreach Started</option>
          <option value="Engaged">Engaged</option>
          <option value="Qualified">Qualified</option>
          <option value="Demo Scheduled">Demo Scheduled</option>
          <option value="Demo Complete">Demo Complete</option>
          <option value="Customer">Customer</option>
          <option value="Lost">Lost</option>
        </select>
        
        <select 
          className="input-base" 
          style={{ width: 'auto', fontSize: 12, padding: '6px 12px', height: '32px' }}
          value={filterSource}
          onChange={e => setFilterSource(e.target.value)}
        >
          <option value="">All Sources</option>
          <option value="Manual">Manual</option>
          <option value="Import">Import</option>
          <option value="Webhook">Webhook</option>
          <option value="LinkedIn">LinkedIn</option>
          <option value="Referral">Referral</option>
        </select>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>From:</span>
          <input 
            type="date" 
            className="input-base" 
            style={{ width: 'auto', fontSize: 12, padding: '6px 12px', height: '32px' }}
            value={filterDateFrom}
            onChange={e => setFilterDateFrom(e.target.value)}
          />
          <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>To:</span>
          <input 
            type="date" 
            className="input-base" 
            style={{ width: 'auto', fontSize: 12, padding: '6px 12px', height: '32px' }}
            value={filterDateTo}
            onChange={e => setFilterDateTo(e.target.value)}
          />
        </div>
        
        {(filterStage || filterSource || filterDateFrom || filterDateTo) && (
          <button 
            className="btn btn-ghost btn-sm" 
            onClick={() => { setFilterStage(''); setFilterSource(''); setFilterDateFrom(''); setFilterDateTo(''); }}
            style={{ color: 'var(--danger)', fontSize: 12 }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Bulk action bar */}
      {selectedIds.length > 0 && (
        <div className="bulk-bar">
          <span>{selectedIds.length} selected</span>
          <button
            onClick={() => setShowBulkEdit(true)}
            className="btn btn-sm"
            style={{ background: 'var(--accent-blue)', color: '#fff', fontSize: 12, border: 'none', marginLeft: 8 }}
          >
            Bulk Edit
          </button>
          <button
            onClick={() => setShowEnrollModal(true)}
            className="btn btn-sm"
            style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: 12, border: 'none', marginLeft: 8 }}
          >
            Enroll in Sequence
          </button>
          <button
            onClick={handleBulkDelete}
            className="btn btn-sm"
            style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: 12 }}
          >
            Delete
          </button>
          <button
            onClick={() => setSelectedIds([])}
            className="btn btn-sm"
            style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: 12 }}
          >
            Clear
          </button>
        </div>
      )}

      {/* Body */}
      <div className="leads-body">
        {viewMode === 'list' ? (
          <div className="leads-table-wrap">
            {/* Head */}
            <div className="leads-table-head">
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <input
                  type="checkbox"
                  checked={
                    selectedIds.length > 0 &&
                    selectedIds.length === filtered.length
                  }
                  onChange={toggleAll}
                  style={{ width: 15, height: 15, accentColor: 'var(--accent-blue)' }}
                />
              </div>
              <span>Company / Contact</span>
              <span>Owner</span>
              <span>Stage</span>
              <span>Signal Score</span>
              <span>Priority</span>
              <span>Active Signals</span>
              <span>Next Action</span>
              <span>Est. MRR</span>
              <span>Notes / Remarks</span>
            </div>

            {/* Rows */}
            <div className="leads-list">
              {filtered.length === 0 ? (
                <div className="leads-empty">
                  <Target size={36} style={{ opacity: 0.3 }} />
                  <h3>{search ? 'No leads match your search' : 'No leads in this view'}</h3>
                  <p>
                    {search
                      ? 'Try adjusting your search terms.'
                      : activeView === 'all'
                        ? 'Add your first lead to get started.'
                        : `No leads match the "${viewDef.label}" filter yet.`
                    }
                  </p>
                  {activeView === 'all' && !search && (
                    <button className="btn btn-primary btn-sm" onClick={() => openNewLead()}>
                      <Plus size={14} /> Add First Lead
                    </button>
                  )}
                </div>
              ) : (
                paginatedLeads.map(lead => (
                  <LeadRow
                    key={lead.id}
                    lead={lead}
                    isSelected={selectedIds.includes(lead.id)}
                    onSelect={toggleSelect}
                    onClick={handleLeadClick}
                    updateLead={updateLead}
                    team={team}
                    user={user}
                  />
                ))
              )}
            </div>
            
            {/* Pagination Bar */}
            {filtered.length > 0 && (
              <div className="pagination-bar">
                <div className="pagination-left">
                  Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filtered.length)} to {Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length} leads
                </div>
                <div className="pagination-right">
                  <select 
                    value={itemsPerPage} 
                    onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                    className="items-per-page-select"
                  >
                    <option value={10}>10 per page</option>
                    <option value={25}>25 per page</option>
                    <option value={50}>50 per page</option>
                    <option value={100}>100 per page</option>
                  </select>
                  <div className="pagination-controls">
                    <button 
                      className="pagination-btn" 
                      disabled={currentPage === 1} 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="pagination-info">Page {currentPage} of {totalPages}</span>
                    <button 
                      className="pagination-btn" 
                      disabled={currentPage === totalPages} 
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="lead-board-wrap">
            {Object.keys(STAGE_COLORS).map(stage => (
              <LeadKanbanColumn
                key={stage}
                stage={stage}
                leads={filtered.filter(l => l.stage === stage)}
                team={team}
                onLeadClick={handleLeadClick}
                onDrop={(e, newStage) => {
                  const leadId = e.dataTransfer.getData('leadId');
                  if (leadId) updateLead(leadId, { stage: newStage });
                }}
              />
            ))}
          </div>
        )}

        {/* Right Drawer */}
        {selectedLead && (
          <LeadDrawer
            lead={selectedLead}
            onClose={() => setSelectedLead(null)}
            onUpdate={handleLeadUpdate}
            onDelete={async (id) => {
              await deleteLead(id);
              setSelectedLead(null);
            }}
          />
        )}
      </div>

      {/* New Lead Modal */}
      {newLeadOpen && (
        <NewLeadForm onClose={() => closeNewLead()} />
      )}

      {/* Enroll Sequence Modal */}
      {showEnrollModal && (
        <EnrollSequenceModal
          leads={filtered.filter(l => selectedIds.includes(l.id))}
          onClose={() => {
            setShowEnrollModal(false);
            setSelectedIds([]);
          }}
        />
      )}

      {/* CSV Importer Modal */}
      <CsvImporterModal
        isOpen={showImporter}
        onClose={() => setShowImporter(false)}
        type="leads"
      />

      <BulkEditModal
        isOpen={showBulkEdit}
        onClose={() => setShowBulkEdit(false)}
        entityType="leads"
        selectedIds={selectedIds}
        onClearSelection={() => setSelectedIds([])}
      />
    </div>
  );
}
