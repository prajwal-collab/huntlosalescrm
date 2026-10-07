// ============================================
// HUNTLO — SMART LISTS  (World-Class Redesign)
// ============================================
import { useState, useMemo, useEffect, useRef } from 'react';
import {
  Database, Plus, Sparkles, Filter, Download, Upload,
  Search, Users, Target, FolderPlus, LayoutGrid, List,
  Activity, Mail, Phone, TrendingUp, Layers, Star,
  Clock, Edit2, X, Trash2, Pencil, Zap,
  ChevronDown, ChevronLeft, ChevronRight, Eye,
  FolderOpen, ArrowUpRight, CheckCircle, RefreshCw,
  MoreHorizontal, SlidersHorizontal, Flame
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

// ── Stage colours ───────────────────────────────────────────
const STAGE_COLORS = {
  'New Lead':           { bg: 'rgba(100,116,139,0.12)', color: '#64748b', dot: '#94a3b8' },
  'Researching':        { bg: 'rgba(99,102,241,0.12)',  color: '#6366f1', dot: '#818cf8' },
  'Ready for Outreach': { bg: 'rgba(6,182,212,0.12)',   color: '#0891b2', dot: '#22d3ee' },
  'Outreach Started':   { bg: 'rgba(245,158,11,0.12)',  color: '#d97706', dot: '#fbbf24' },
  'Engaged':            { bg: 'rgba(249,115,22,0.12)',  color: '#ea580c', dot: '#fb923c' },
  'Qualified':          { bg: 'rgba(59,130,246,0.12)',  color: '#2563eb', dot: '#60a5fa' },
  'Demo Scheduled':     { bg: 'rgba(139,92,246,0.12)',  color: '#7c3aed', dot: '#a78bfa' },
  'Demo Complete':      { bg: 'rgba(34,197,94,0.12)',   color: '#16a34a', dot: '#4ade80' },
  'Trial Started':      { bg: 'rgba(34,197,94,0.18)',   color: '#15803d', dot: '#22c55e' },
  'Customer':           { bg: 'rgba(34,197,94,0.22)',   color: '#166534', dot: '#16a34a' },
  'Lost':               { bg: 'rgba(239,68,68,0.12)',   color: '#dc2626', dot: '#f87171' },
};

const LOGO_COLORS = [
  '#3b82f6','#8b5cf6','#06b6d4','#f97316',
  '#22c55e','#ec4899','#6366f1','#14b8a6',
  '#f59e0b','#ef4444',
];

// ── Smart segment definitions ───────────────────────────────
const SEGMENT_DEFS = [
  {
    id: 'all', label: 'All Leads', emoji: '📋', color: '#64748b',
    gradient: 'linear-gradient(135deg,#475569,#334155)',
    filter: () => true
  },
  {
    id: 'hot', label: 'Hot Leads', emoji: '🔥', color: '#ef4444',
    gradient: 'linear-gradient(135deg,#ef4444,#dc2626)',
    filter: l => computeSignalScore(l) >= 70
  },
  {
    id: 'new', label: 'New', emoji: '🆕', color: '#3b82f6',
    gradient: 'linear-gradient(135deg,#3b82f6,#2563eb)',
    filter: l => l.stage === 'New Lead'
  },
  {
    id: 'engaged', label: 'Engaged', emoji: '💬', color: '#f97316',
    gradient: 'linear-gradient(135deg,#f97316,#ea580c)',
    filter: l => l.stage === 'Engaged' || l.stage === 'Qualified'
  },
  {
    id: 'enriched', label: 'Enriched', emoji: '✨', color: '#8b5cf6',
    gradient: 'linear-gradient(135deg,#8b5cf6,#7c3aed)',
    filter: l => l.enrichment_done
  },
  {
    id: 'no_contact', label: 'No Contact', emoji: '📵', color: '#f97316',
    gradient: 'linear-gradient(135deg,#f97316,#d97706)',
    filter: l => !l.phone && !l.email
  },
  {
    id: 'high_mrr', label: 'High MRR', emoji: '💰', color: '#22c55e',
    gradient: 'linear-gradient(135deg,#22c55e,#16a34a)',
    filter: l => (l.estimated_mrr || 0) >= 500
  },
  {
    id: 'stale', label: 'Stale', emoji: '🕸️', color: '#94a3b8',
    gradient: 'linear-gradient(135deg,#94a3b8,#64748b)',
    filter: l => {
      if (!l.updated_at || l.stage === 'Customer' || l.stage === 'Lost') return false;
      return (Date.now() - new Date(l.updated_at).getTime()) > 14 * 86400000;
    }
  },
];

// ── Lead Row ────────────────────────────────────────────────
function ListLeadRow({ lead, isSelected, onSelect, onClick, team, onCall, onStageChange, onOwnerChange }) {
  const score = useMemo(() => computeSignalScore(lead), [lead]);
  const completeness = useMemo(() => computeCompleteness(lead), [lead]);
  const completenessColor = getCompletenessColor(completeness);
  const stageStyle = STAGE_COLORS[lead.stage] || STAGE_COLORS['New Lead'];
  const logoColor = LOGO_COLORS[(lead.company_name?.charCodeAt(0) || 0) % LOGO_COLORS.length];
  const initial = (lead.company_name || '?').charAt(0).toUpperCase();
  const ownerMember = team?.find(t => t.id === lead.owner_id);
  const ownerName = ownerMember?.name || ownerMember?.full_name || 'Unassigned';

  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteValue, setNoteValue] = useState(lead.notes || '');

  const handleNoteSave = () => {
    setIsEditingNote(false);
    if (noteValue !== (lead.notes || '')) {
      onNoteChange(lead, noteValue);
    }
  };

  return (
    <div className={`llr${isSelected ? ' llr--selected' : ''}`} onClick={() => onClick(lead)}>
      {/* Check */}
      <div className="llr-check" onClick={e => { e.stopPropagation(); onSelect(lead.id); }}>
        <div className={`llr-checkbox ${isSelected ? 'checked' : ''}`}>
          {isSelected && <CheckCircle size={12} />}
        </div>
      </div>

      {/* Company */}
      <div className="llr-company">
        <div className="llr-avatar" style={{ background: logoColor }}>{initial}</div>
        <div className="llr-company-info">
          <span className="llr-company-name">{lead.company_name || '—'}</span>
          <span className="llr-sub">{lead.contact_name || lead.designation || 'No contact'}</span>
        </div>
      </div>

      {/* Contact */}
      <div className="llr-contact">
        {lead.email
          ? <div className="llr-contact-line"><Mail size={11} /><span>{lead.email}</span></div>
          : <div className="llr-contact-line missing"><span>No email</span></div>
        }
        {lead.phone && <div className="llr-contact-line"><Phone size={11} /><span>{lead.phone}</span></div>}
      </div>

      {/* Owner */}
      <div className="llr-owner" onClick={e => e.stopPropagation()}>
        <div className={`llr-owner-pill ${!lead.owner_id ? 'empty' : ''}`}>
          {lead.owner_id && <div className="llr-owner-dot">{ownerName.charAt(0)}</div>}
          <select
            className="llr-owner-select"
            value={lead.owner_id || ''}
            onChange={e => onOwnerChange(lead, e.target.value)}
          >
            <option value="">Unassigned</option>
            {team?.map(m => <option key={m.id} value={m.id}>{m.name || m.full_name}</option>)}
          </select>
        </div>
      </div>

      {/* Stage */}
      <div className="llr-stage" onClick={e => e.stopPropagation()}>
        <div className="llr-stage-pill" style={{ background: stageStyle.bg }}>
          <div className="llr-stage-dot" style={{ background: stageStyle.dot }} />
          <select
            className="llr-stage-select"
            style={{ color: stageStyle.color }}
            value={lead.stage || 'New Lead'}
            onChange={e => onStageChange(lead, e.target.value)}
          >
            {Object.keys(STAGE_COLORS).map(st => (
              <option key={st} value={st} style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}>{st}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Score */}
      <div className="llr-score">
        <div className={`llr-score-ring ${score >= 70 ? 'hot' : score >= 35 ? 'warm' : 'cold'}`}>
          <span>{score}</span>
        </div>
      </div>

      {/* Complete */}
      <div className="llr-complete">
        <div className="llr-complete-track">
          <div className="llr-complete-fill" style={{ width: `${completeness}%`, background: completenessColor }} />
        </div>
        <span className="llr-complete-pct">{completeness}%</span>
      </div>

      {/* Notes */}
      <div className="llr-notes" style={{ paddingRight: 16 }} onClick={(e) => e.stopPropagation()} onDoubleClick={() => setIsEditingNote(true)}>
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
          <span style={{ fontSize: 12, color: noteValue ? 'var(--text-secondary)' : 'var(--text-tertiary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', cursor: 'pointer' }} title={noteValue || 'No notes'}>
            {noteValue || 'Double-click to add note...'}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="llr-actions" onClick={e => e.stopPropagation()}>
        <button className="llr-btn" title="Call" onClick={() => onCall(lead)} disabled={!lead.phone}>
          <Phone size={13} />
        </button>
        <button className="llr-btn" title="View" onClick={() => onClick(lead)}>
          <Eye size={13} />
        </button>
      </div>
    </div>
  );
}


// ── Main Component ──────────────────────────────────────────
export default function Lists() {
  const { list_leads, updateListLead, bulkUpdateListLeads, bulkDeleteListLeads, appendListLeadNotes, pushListLeadsToLeads } = useDataStore();
  const { team } = useAuthStore();
  const { showConfirm, showPrompt } = useDialog();

  // core state
  const [activeSegment, setActiveSegment] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [viewMode, setViewMode] = useState('table'); // table | card

  // modals
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false);
  const [callingLead, setCallingLead] = useState(null);
  const [callNotes, setCallNotes] = useState('');
  const [callOutcome, setCallOutcome] = useState('connected');
  const [callSaving, setCallSaving] = useState(false);

  // filters
  const [filterStage, setFilterStage] = useState('');
  const [filterSource, setFilterSource] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // push
  const [pushingIds, setPushingIds] = useState([]);

  // list management
  const [showManageLists, setShowManageLists] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [editingListName, setEditingListName] = useState(null);
  const [editingListValue, setEditingListValue] = useState('');
  const [addToListOpen, setAddToListOpen] = useState(false);
  const addToListRef = useRef(null);
  const searchRef = useRef(null);

  // close add-to-list on outside click
  useEffect(() => {
    const handler = e => {
      if (addToListRef.current && !addToListRef.current.contains(e.target)) {
        setAddToListOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Derived data ──
  const uniqueLists = useMemo(() => {
    const s = new Set();
    list_leads.forEach(l => {
      if (Array.isArray(l.tags)) l.tags.forEach(t => { if (t.startsWith('list:')) s.add(t.slice(5)); });
    });
    return Array.from(s).sort();
  }, [list_leads]);

  const customSegments = useMemo(() => uniqueLists.map(n => ({
    id: `list_${n}`,
    label: n,
    emoji: '📁',
    color: '#8b5cf6',
    gradient: 'linear-gradient(135deg,#8b5cf6,#6d28d9)',
    filter: l => Array.isArray(l.tags) && l.tags.includes(`list:${n}`)
  })), [uniqueLists]);

  const allSegments = useMemo(() => [...SEGMENT_DEFS, ...customSegments], [customSegments]);
  const segDef = allSegments.find(s => s.id === activeSegment) || allSegments[0];

  const filtered = useMemo(() => {
    let r = list_leads.filter(segDef.filter);
    if (filterStage) r = r.filter(l => l.stage === filterStage);
    if (filterSource) r = r.filter(l => (l.source || '').toLowerCase().includes(filterSource.toLowerCase()));
    const q = searchQuery.toLowerCase().trim();
    if (q) r = r.filter(l =>
      (l.company_name || '').toLowerCase().includes(q) ||
      (l.contact_name || '').toLowerCase().includes(q) ||
      (l.email || '').toLowerCase().includes(q) ||
      (l.phone || '').toLowerCase().includes(q) ||
      (l.industry || '').toLowerCase().includes(q)
    );
    return r;
  }, [list_leads, segDef, searchQuery, filterStage, filterSource]);

  const segmentCounts = useMemo(() =>
    Object.fromEntries(allSegments.map(s => [s.id, list_leads.filter(s.filter).length])),
    [list_leads, allSegments]
  );

  useEffect(() => { setCurrentPage(1); }, [filtered.length, activeSegment]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const pageLeads = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const stats = useMemo(() => {
    const total = filtered.length;
    const withEmail = filtered.filter(l => l.email).length;
    const withPhone = filtered.filter(l => l.phone).length;
    const avgScore = total > 0 ? Math.round(filtered.reduce((s, l) => s + computeSignalScore(l), 0) / total) : 0;
    const totalMRR = filtered.reduce((s, l) => s + (l.estimated_mrr || 0), 0);
    return { total, withEmail, withPhone, avgScore, totalMRR };
  }, [filtered]);

  const uniqueSources = useMemo(() =>
    [...new Set(list_leads.map(l => l.source).filter(Boolean))].sort(),
    [list_leads]
  );

  // ── Handlers ──
  const toggleSelect = id => setSelectedIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const toggleAll = () => {
    if (selectedIds.length === pageLeads.length && pageLeads.length > 0) setSelectedIds([]);
    else setSelectedIds(pageLeads.map(l => l.id));
  };

  const handleLeadClick = lead => setSelectedLead(p => p?.id === lead.id ? null : lead);

  const handleLeadUpdate = async (id, updates) => {
    try {
      const updated = await updateListLead(id, updates);
      if (updated) setSelectedLead(updated);
    } catch (e) { console.error(e); }
  };

  const handleStageChange = async (lead, newStage) => {
    let obj = { stage: newStage };
    if (newStage === 'Lost') {
      const reason = await showPrompt('Mark as Lost', `Reason for ${lead.company_name}?`, 'e.g. Pricing, No Budget...', 'Mark Lost', 'Cancel');
      if (!reason) return;
      obj.lost_reason = reason;
      obj.notes = lead.notes ? `${lead.notes}\n[Lost Reason]: ${reason}` : `[Lost Reason]: ${reason}`;
    }
    try {
      await updateListLead(lead.id, obj);
    } catch (e) {
      // Fallback in case lost_reason column doesn't exist on list_leads
      if (newStage === 'Lost') {
        try {
          delete obj.lost_reason;
          await updateListLead(lead.id, obj);
        } catch (e2) {
          console.error('Failed to update stage:', e2);
        }
      } else {
        console.error('Failed to update stage:', e);
      }
    }
  };

  const handleNoteChange = async (lead, noteValue) => {
    try {
      await updateListLead(lead.id, { notes: noteValue });
    } catch (e) { console.error('Failed to update notes:', e); }
  };

  const handleOwnerChange = async (lead, oid) => {
    try { await updateListLead(lead.id, { owner_id: oid }); } catch (e) { console.error(e); }
  };

  const handleBulkDelete = async () => {
    const ok = await showConfirm('Delete Selected', `Permanently delete ${selectedIds.length} leads?`);
    if (!ok) return;
    await bulkDeleteListLeads(selectedIds);
    setSelectedIds([]);
    if (selectedLead && selectedIds.includes(selectedLead.id)) setSelectedLead(null);
  };

  const handleBulkStage = async val => {
    try { await bulkUpdateListLeads(selectedIds, { stage: val }); setSelectedIds([]); } catch (e) { console.error(e); }
  };

  const handleBulkOwner = async val => {
    try { await bulkUpdateListLeads(selectedIds, { owner_id: val }); setSelectedIds([]); } catch (e) { console.error(e); }
  };

  const handleExport = () => exportToCsv('smart-list-export.csv', filtered);

  // ── Call ──
  const handleStartCall = lead => {
    if (!lead.phone) return;
    setCallingLead(lead); setCallNotes(''); setCallOutcome('connected');
  };

  const handleEndCall = async () => {
    if (!callingLead) return;
    setCallSaving(true);
    try {
      const labels = { connected: 'Connected', voicemail: 'Left voicemail', no_answer: 'No answer', callback: 'Callback', not_interested: 'Not interested' };
      const note = `Call: ${labels[callOutcome]}${callNotes ? ` — ${callNotes}` : ''}`;
      const stage = callOutcome === 'connected' ? 'Engaged' : callOutcome === 'not_interested' ? 'Lost' : undefined;
      await appendListLeadNotes(callingLead.id, note, stage);
      setCallingLead(null); setCallNotes('');
    } catch (e) { console.error(e); } finally { setCallSaving(false); }
  };

  const handlePushToLeads = async () => {
    setPushingIds(selectedIds);
    try {
      await pushListLeadsToLeads(selectedIds);
      setSelectedIds([]);
    } catch (e) { alert('Failed to push to Leads CRM'); } finally { setPushingIds([]); }
  };

  // ── List Management ──
  const handleCreateList = async () => {
    const t = newListName.trim();
    if (!t) return;
    if (uniqueLists.includes(t)) { alert(`List "${t}" already exists.`); return; }
    setNewListName('');
    alert(`List "${t}" created! Select leads and use "Add to List" to populate it.`);
  };

  const handleRenameList = async oldName => {
    const t = editingListValue.trim();
    if (!t || t === oldName) { setEditingListName(null); return; }
    if (uniqueLists.includes(t)) { alert(`List "${t}" already exists.`); return; }
    const affected = list_leads.filter(l => Array.isArray(l.tags) && l.tags.includes(`list:${oldName}`));
    for (const lead of affected) {
      await updateListLead(lead.id, { tags: lead.tags.map(g => g === `list:${oldName}` ? `list:${t}` : g) });
    }
    setEditingListName(null);
    if (activeSegment === `list_${oldName}`) setActiveSegment(`list_${t}`);
  };

  const handleDeleteList = async name => {
    const ok = await showConfirm(`Delete "${name}"`, `Remove this list tag from all leads? Leads won't be deleted.`);
    if (!ok) return;
    for (const lead of list_leads.filter(l => Array.isArray(l.tags) && l.tags.includes(`list:${name}`))) {
      await updateListLead(lead.id, { tags: lead.tags.filter(g => g !== `list:${name}`) });
    }
    if (activeSegment === `list_${name}`) setActiveSegment('all');
  };

  const handleAddToList = async name => {
    setAddToListOpen(false);
    try {
      for (const lead of list_leads.filter(l => selectedIds.includes(l.id))) {
        const tags = Array.isArray(lead.tags) ? lead.tags : [];
        if (!tags.includes(`list:${name}`)) await updateListLead(lead.id, { tags: [...tags, `list:${name}`] });
      }
    } catch (e) { console.error(e); }
  };

  const handleCreateAndAdd = async () => {
    const name = await showPrompt('Create New List', 'List name:', 'e.g. Q4 Outreach...', 'Create & Add', 'Cancel');
    if (!name?.trim()) return;
    await handleAddToList(name.trim());
  };

  // ── All Segments split for tabs ──
  const systemSegs = SEGMENT_DEFS;
  const customSegs = customSegments;

  return (
    <div className="lp">

      {/* ═══ HEADER ══════════════════════════════════════════ */}
      <div className="lp-header">
        <div className="lp-header-left">
          <div className="lp-title-row">
            <div className="lp-title-icon">
              <Database size={18} />
            </div>
            <h1 className="lp-title">Smart Lists</h1>
            <span className="lp-lead-badge">{list_leads.length}</span>
          </div>
          <p className="lp-subtitle">Segment, enrich and manage your pipeline in one place</p>
        </div>
        <div className="lp-header-right">
          <button className={`lp-btn lp-btn--ghost ${showManageLists ? 'active' : ''}`} onClick={() => setShowManageLists(v => !v)}>
            <Layers size={15} />
            <span>Manage Lists</span>
          </button>
          <button className="lp-btn lp-btn--ghost" onClick={handleExport}>
            <Download size={15} />
            <span>Export</span>
          </button>
          <button className="lp-btn lp-btn--primary" onClick={() => setIsImportOpen(true)}>
            <Upload size={15} />
            <span>Import</span>
          </button>
        </div>
      </div>

      {/* ═══ STATS BAR ═══════════════════════════════════════ */}
      <div className="lp-stats">
        <div className="lp-stat">
          <div className="lp-stat-icon" style={{ background: 'rgba(59,130,246,0.12)', color: '#3b82f6' }}><Users size={16} /></div>
          <div>
            <div className="lp-stat-val">{stats.total.toLocaleString()}</div>
            <div className="lp-stat-lbl">In Segment</div>
          </div>
        </div>
        <div className="lp-stat-div" />
        <div className="lp-stat">
          <div className="lp-stat-icon" style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981' }}><Mail size={16} /></div>
          <div>
            <div className="lp-stat-val">{stats.withEmail}
              <span className="lp-stat-sub"> ({stats.total > 0 ? Math.round(stats.withEmail / stats.total * 100) : 0}%)</span>
            </div>
            <div className="lp-stat-lbl">With Email</div>
          </div>
        </div>
        <div className="lp-stat-div" />
        <div className="lp-stat">
          <div className="lp-stat-icon" style={{ background: 'rgba(139,92,246,0.12)', color: '#8b5cf6' }}><Phone size={16} /></div>
          <div>
            <div className="lp-stat-val">{stats.withPhone}
              <span className="lp-stat-sub"> ({stats.total > 0 ? Math.round(stats.withPhone / stats.total * 100) : 0}%)</span>
            </div>
            <div className="lp-stat-lbl">With Phone</div>
          </div>
        </div>
        <div className="lp-stat-div" />
        <div className="lp-stat">
          <div className="lp-stat-icon" style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}><Zap size={16} /></div>
          <div>
            <div className="lp-stat-val">{stats.avgScore}</div>
            <div className="lp-stat-lbl">Avg Score</div>
          </div>
        </div>
        <div className="lp-stat-div" />
        <div className="lp-stat">
          <div className="lp-stat-icon" style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e' }}><TrendingUp size={16} /></div>
          <div>
            <div className="lp-stat-val">₹{stats.totalMRR > 1000 ? `${(stats.totalMRR / 1000).toFixed(0)}k` : stats.totalMRR}</div>
            <div className="lp-stat-lbl">Est. MRR</div>
          </div>
        </div>
      </div>

      {/* ═══ MANAGE LISTS PANEL ══════════════════════════════ */}
      {showManageLists && (
        <div className="lp-manage-panel">
          <div className="lp-manage-panel-header">
            <div className="lp-manage-panel-title">
              <FolderOpen size={15} />
              My Lists
              <span className="lp-manage-badge">{uniqueLists.length}</span>
            </div>
            <button className="lp-icon-btn" onClick={() => setShowManageLists(false)}><X size={14} /></button>
          </div>
          <div className="lp-manage-panel-body">
            {uniqueLists.length === 0 ? (
              <div className="lp-manage-empty">
                <FolderOpen size={28} />
                <p>No custom lists yet. Import leads and tag them, or create one below.</p>
              </div>
            ) : (
              <div className="lp-manage-list-grid">
                {uniqueLists.map(name => {
                  const cnt = list_leads.filter(l => Array.isArray(l.tags) && l.tags.includes(`list:${name}`)).length;
                  return (
                    <div key={name} className={`lp-manage-item ${activeSegment === `list_${name}` ? 'active' : ''}`}>
                      {editingListName === name ? (
                        <div className="lp-manage-rename">
                          <input
                            className="lp-manage-rename-input"
                            value={editingListValue}
                            onChange={e => setEditingListValue(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleRenameList(name);
                              if (e.key === 'Escape') setEditingListName(null);
                            }}
                            autoFocus
                          />
                          <button className="lp-btn lp-btn--primary lp-btn--xs" onClick={() => handleRenameList(name)}>Save</button>
                          <button className="lp-btn lp-btn--ghost lp-btn--xs" onClick={() => setEditingListName(null)}>Cancel</button>
                        </div>
                      ) : (
                        <>
                          <button
                            className="lp-manage-name"
                            onClick={() => { setActiveSegment(`list_${name}`); setSelectedIds([]); setShowManageLists(false); }}
                          >
                            <span className="lp-manage-emoji">📁</span>
                            <span className="lp-manage-label">{name}</span>
                            <span className="lp-manage-count">{cnt}</span>
                          </button>
                          <div className="lp-manage-item-actions">
                            <button className="lp-icon-btn" onClick={() => { setEditingListName(name); setEditingListValue(name); }} title="Rename">
                              <Pencil size={12} />
                            </button>
                            <button className="lp-icon-btn lp-icon-btn--danger" onClick={() => handleDeleteList(name)} title="Delete">
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            <div className="lp-manage-create">
              <input
                className="lp-manage-input"
                placeholder="New list name…"
                value={newListName}
                onChange={e => setNewListName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleCreateList(); }}
              />
              <button className="lp-btn lp-btn--primary lp-btn--sm" onClick={handleCreateList} disabled={!newListName.trim()}>
                <Plus size={14} /> Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ SEGMENT TABS ════════════════════════════════════ */}
      <div className="lp-tabs-container">
        {/* Smart Segments */}
        <div className="lp-tabs-group">
          <span className="lp-tabs-group-label">Smart Segments</span>
          <div className="lp-tabs-row">
            {systemSegs.map(seg => {
              const cnt = segmentCounts[seg.id] || 0;
              const isActive = activeSegment === seg.id;
              return (
                <button
                  key={seg.id}
                  className={`lp-tab ${isActive ? 'lp-tab--active' : ''}`}
                  style={isActive ? { '--tab-color': seg.color } : {}}
                  onClick={() => { setActiveSegment(seg.id); setSelectedIds([]); }}
                >
                  <span className="lp-tab-emoji">{seg.emoji}</span>
                  <span className="lp-tab-label">{seg.label}</span>
                  <span className="lp-tab-count" style={isActive ? { background: seg.color + '22', color: seg.color } : {}}>{cnt}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Lists */}
        {customSegs.length > 0 && (
          <div className="lp-tabs-group">
            <span className="lp-tabs-group-label">My Lists</span>
            <div className="lp-tabs-row">
              {customSegs.map(seg => {
                const cnt = segmentCounts[seg.id] || 0;
                const isActive = activeSegment === seg.id;
                return (
                  <button
                    key={seg.id}
                    className={`lp-tab lp-tab--list ${isActive ? 'lp-tab--active' : ''}`}
                    style={isActive ? { '--tab-color': seg.color } : {}}
                    onClick={() => { setActiveSegment(seg.id); setSelectedIds([]); }}
                  >
                    <span className="lp-tab-emoji">{seg.emoji}</span>
                    <span className="lp-tab-label">{seg.label}</span>
                    <span className="lp-tab-count" style={isActive ? { background: '#8b5cf622', color: '#8b5cf6' } : {}}>{cnt}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ═══ TOOLBAR ═════════════════════════════════════════ */}
      <div className="lp-toolbar">
        <div className="lp-toolbar-left">
          <div className="lp-search" ref={searchRef}>
            <Search size={15} />
            <input
              type="text"
              placeholder="Search leads…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {searchQuery && <button className="lp-search-clear" onClick={() => setSearchQuery('')}><X size={13} /></button>}
          </div>
          <button
            className={`lp-btn lp-btn--ghost lp-btn--sm ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(v => !v)}
          >
            <SlidersHorizontal size={14} />
            Filters
            {(filterStage || filterSource) && <span className="lp-filter-dot" />}
          </button>
        </div>
        <div className="lp-toolbar-right">
          <span className="lp-result-count">{filtered.length.toLocaleString()} leads</span>
          <div className="lp-view-toggle">
            <button className={`lp-view-btn ${viewMode === 'table' ? 'active' : ''}`} onClick={() => setViewMode('table')} title="Table view">
              <List size={14} />
            </button>
            <button className={`lp-view-btn ${viewMode === 'card' ? 'active' : ''}`} onClick={() => setViewMode('card')} title="Card view">
              <LayoutGrid size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      {showFilters && (
        <div className="lp-filter-bar">
          <div className="lp-filter-group">
            <label>Stage</label>
            <select className="lp-filter-select" value={filterStage} onChange={e => setFilterStage(e.target.value)}>
              <option value="">All Stages</option>
              {Object.keys(STAGE_COLORS).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="lp-filter-group">
            <label>Source</label>
            <select className="lp-filter-select" value={filterSource} onChange={e => setFilterSource(e.target.value)}>
              <option value="">All Sources</option>
              {uniqueSources.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <button className="lp-btn lp-btn--ghost lp-btn--sm" onClick={() => { setFilterStage(''); setFilterSource(''); }}>
            <X size={13} /> Clear filters
          </button>
        </div>
      )}

      {/* ═══ BULK ACTION BAR ═════════════════════════════════ */}
      {selectedIds.length > 0 && (
        <div className="lp-bulk-bar">
          <div className="lp-bulk-info">
            <div className="lp-bulk-badge">{selectedIds.length}</div>
            <span>leads selected</span>
          </div>
          <div className="lp-bulk-actions">
            <button className="lp-btn lp-btn--primary lp-btn--sm" onClick={handlePushToLeads} disabled={pushingIds.length > 0}>
              {pushingIds.length > 0 ? <RefreshCw size={13} className="lp-spin" /> : <ArrowUpRight size={13} />}
              Push to CRM
            </button>
            <button className="lp-btn lp-btn--ghost lp-btn--sm" onClick={() => setIsBulkEditOpen(true)}>
              <Edit2 size={13} /> Bulk Edit
            </button>

            {/* Add to List */}
            <div className="lp-add-list-wrap" ref={addToListRef}>
              <button className="lp-btn lp-btn--ghost lp-btn--sm" onClick={() => setAddToListOpen(v => !v)}>
                <FolderPlus size={13} /> Add to List <ChevronDown size={11} />
              </button>
              {addToListOpen && (
                <div className="lp-list-dropdown">
                  <div className="lp-list-dropdown-title">Add to list</div>
                  {uniqueLists.length > 0
                    ? uniqueLists.map(n => (
                      <button key={n} className="lp-list-opt" onClick={() => handleAddToList(n)}>
                        <span>📁</span> {n}
                      </button>
                    ))
                    : <div className="lp-list-empty">No lists yet</div>
                  }
                  <div className="lp-list-sep" />
                  <button className="lp-list-opt lp-list-opt--create" onClick={handleCreateAndAdd}>
                    <Plus size={12} /> Create new list…
                  </button>
                </div>
              )}
            </div>

            <select className="lp-bulk-select" value="" onChange={e => { if (e.target.value) handleBulkStage(e.target.value); }}>
              <option value="">Change Stage…</option>
              {Object.keys(STAGE_COLORS).map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            <select className="lp-bulk-select" value="" onChange={e => { if (e.target.value) handleBulkOwner(e.target.value); }}>
              <option value="">Assign Owner…</option>
              {team?.map(m => <option key={m.id} value={m.id}>{m.name || m.full_name}</option>)}
            </select>

            <button className="lp-btn lp-btn--danger lp-btn--sm" onClick={handleBulkDelete}>
              <Trash2 size={13} /> Delete
            </button>
            <button className="lp-icon-btn" onClick={() => setSelectedIds([])} title="Clear selection"><X size={14} /></button>
          </div>
        </div>
      )}

      {/* ═══ TABLE VIEW ══════════════════════════════════════ */}
      {viewMode === 'table' && (
        <div className="lp-table-wrap">
          {/* Header */}
          <div className="lp-table-head">
            <div className="lp-th lp-th--check" onClick={toggleAll}>
              <div className={`llr-checkbox ${selectedIds.length === pageLeads.length && pageLeads.length > 0 ? 'checked' : ''}`}>
                {selectedIds.length === pageLeads.length && pageLeads.length > 0 && <CheckCircle size={12} />}
              </div>
            </div>
            <div className="lp-th lp-th--company">Company / Contact</div>
            <div className="lp-th lp-th--contact">Contact Info</div>
            <div className="lp-th lp-th--owner">Owner</div>
            <div className="lp-th lp-th--stage">Stage</div>
            <div className="lp-th lp-th--score">Score</div>
            <div className="lp-th lp-th--complete">Complete</div>
            <div className="lp-th lp-th--notes">Notes</div>
            <div className="lp-th lp-th--actions"></div>
          </div>

          {/* Body */}
          <div className="lp-table-body">
            {pageLeads.length > 0 ? pageLeads.map(lead => (
              <ListLeadRow
                key={lead.id}
                lead={lead}
                isSelected={selectedIds.includes(lead.id)}
                onSelect={toggleSelect}
                onClick={handleLeadClick}
                team={team}
                onCall={handleStartCall}
                onStageChange={handleStageChange}
                onOwnerChange={handleOwnerChange}
                onNoteChange={handleNoteChange}
              />
            )) : (
              <div className="lp-empty">
                <div className="lp-empty-icon"><Database size={32} /></div>
                <h3>No leads in this segment</h3>
                <p>Try adjusting your filters or import new leads.</p>
                <button className="lp-btn lp-btn--primary" onClick={() => setIsImportOpen(true)}>
                  <Upload size={15} /> Import Leads
                </button>
              </div>
            )}
          </div>

          {/* Pagination */}
          {filtered.length > 0 && (
            <div className="lp-pagination">
              <span className="lp-pag-info">
                Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filtered.length)}–{Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length}
              </span>
              <div className="lp-pag-right">
                <select className="lp-pag-size" value={itemsPerPage} onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}>
                  <option value={10}>10 / page</option>
                  <option value={25}>25 / page</option>
                  <option value={50}>50 / page</option>
                  <option value={100}>100 / page</option>
                </select>
                <div className="lp-pag-nav">
                  <button className="lp-pag-btn" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
                    <ChevronLeft size={15} />
                  </button>
                  <span className="lp-pag-page">Page {currentPage} of {totalPages}</span>
                  <button className="lp-pag-btn" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>
                    <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ CARD VIEW ═══════════════════════════════════════ */}
      {viewMode === 'card' && (
        <div className="lp-card-grid">
          {pageLeads.length > 0 ? pageLeads.map(lead => {
            const score = computeSignalScore(lead);
            const stageStyle = STAGE_COLORS[lead.stage] || STAGE_COLORS['New Lead'];
            const logoColor = LOGO_COLORS[(lead.company_name?.charCodeAt(0) || 0) % LOGO_COLORS.length];
            const initial = (lead.company_name || '?').charAt(0).toUpperCase();
            const isSelected = selectedIds.includes(lead.id);
            return (
              <div
                key={lead.id}
                className={`lp-card ${isSelected ? 'lp-card--selected' : ''}`}
                onClick={() => handleLeadClick(lead)}
              >
                <div className="lp-card-top">
                  <div
                    className="lp-card-check"
                    onClick={e => { e.stopPropagation(); toggleSelect(lead.id); }}
                  >
                    <div className={`llr-checkbox ${isSelected ? 'checked' : ''}`}>
                      {isSelected && <CheckCircle size={11} />}
                    </div>
                  </div>
                  <div className="lp-card-avatar" style={{ background: logoColor }}>{initial}</div>
                  <div className={`lp-card-score-badge ${score >= 70 ? 'hot' : score >= 35 ? 'warm' : 'cold'}`}>{score}</div>
                </div>
                <div className="lp-card-name">{lead.company_name || '—'}</div>
                <div className="lp-card-contact">{lead.contact_name || lead.designation || 'No contact'}</div>
                <div className="lp-card-meta">
                  {lead.email && <div className="lp-card-meta-row"><Mail size={11}/><span>{lead.email}</span></div>}
                  {lead.phone && <div className="lp-card-meta-row"><Phone size={11}/><span>{lead.phone}</span></div>}
                </div>
                
                <div className="lp-card-notes" title={lead.notes || 'No notes'}>
                  {lead.notes || <span style={{ fontStyle: 'italic', opacity: 0.5 }}>No notes yet...</span>}
                </div>

                <div className="lp-card-stage" style={{ background: stageStyle.bg, color: stageStyle.color }}>
                  <div className="lp-stage-dot" style={{ background: stageStyle.dot }} />
                  {lead.stage || 'New Lead'}
                </div>
                <div className="lp-card-actions" onClick={e => e.stopPropagation()}>
                  <button className="lp-card-btn" onClick={() => handleStartCall(lead)} disabled={!lead.phone}><Phone size={13}/></button>
                  <button className="lp-card-btn" onClick={() => handleLeadClick(lead)}><Eye size={13}/></button>
                </div>
              </div>
            );
          }) : (
            <div className="lp-empty" style={{ gridColumn: '1/-1' }}>
              <div className="lp-empty-icon"><Database size={32} /></div>
              <h3>No leads in this segment</h3>
              <p>Try adjusting your filters or import new leads.</p>
              <button className="lp-btn lp-btn--primary" onClick={() => setIsImportOpen(true)}>
                <Upload size={15} /> Import Leads
              </button>
            </div>
          )}
        </div>
      )}
      {viewMode === 'card' && filtered.length > itemsPerPage && (
        <div className="lp-pagination" style={{ background: 'transparent', border: 'none', marginTop: 8 }}>
          <span className="lp-pag-info">
            Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filtered.length)}–{Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length}
          </span>
          <div className="lp-pag-right">
            <div className="lp-pag-nav">
              <button className="lp-pag-btn" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}><ChevronLeft size={15} /></button>
              <span className="lp-pag-page">Page {currentPage} of {totalPages}</span>
              <button className="lp-pag-btn" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}><ChevronRight size={15} /></button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ LEAD DRAWER ═════════════════════════════════════ */}
      {selectedLead && (
        <LeadDrawer
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onUpdate={handleLeadUpdate}
          onDelete={async id => {
            await useDataStore.getState().deleteListLead(id);
            setSelectedLead(null);
          }}
        />
      )}

      {/* ═══ CALL MODAL ══════════════════════════════════════ */}
      {callingLead && (
        <div className="lp-modal-backdrop">
          <div className="lp-modal lp-call-modal">
            <div className="lp-modal-header">
              <div className="lp-call-pulse"><Phone size={16} /></div>
              <h3>Calling {callingLead.contact_name || callingLead.company_name}</h3>
              <button className="lp-icon-btn" onClick={() => setCallingLead(null)}><X size={16} /></button>
            </div>
            <div className="lp-modal-body">
              <div className="lp-call-grid">
                <div className="lp-call-item"><span>Company</span><strong>{callingLead.company_name || '—'}</strong></div>
                <div className="lp-call-item"><span>Phone</span><strong className="lp-call-phone">{callingLead.phone}</strong></div>
                {callingLead.email && <div className="lp-call-item"><span>Email</span><strong>{callingLead.email}</strong></div>}
                {callingLead.designation && <div className="lp-call-item"><span>Role</span><strong>{callingLead.designation}</strong></div>}
              </div>
              <div className="lp-call-field">
                <label>Outcome</label>
                <select className="lp-call-select" value={callOutcome} onChange={e => setCallOutcome(e.target.value)}>
                  <option value="connected">✅ Connected</option>
                  <option value="voicemail">📩 Left Voicemail</option>
                  <option value="no_answer">📵 No Answer</option>
                  <option value="callback">🔄 Callback</option>
                  <option value="not_interested">❌ Not Interested</option>
                </select>
              </div>
              <div className="lp-call-field">
                <label>Notes</label>
                <textarea
                  className="lp-call-notes"
                  placeholder="Key takeaways…"
                  value={callNotes}
                  onChange={e => setCallNotes(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="lp-call-footer">
                <button className="lp-btn lp-btn--ghost" onClick={() => setCallingLead(null)} disabled={callSaving}>Cancel</button>
                <button className="lp-btn lp-btn--primary" onClick={handleEndCall} disabled={callSaving}>
                  {callSaving ? <><RefreshCw size={14} className="lp-spin" /> Saving…</> : <><CheckCircle size={14} /> End & Save</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ MODALS ══════════════════════════════════════════ */}
      <CsvImporterModal isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} type="list_leads" />
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
