// ============================================
// HUNTLO ΓÇö LEADS PAGE
// AI-Native Signal-Driven Lead System
// ============================================
import { useState, useMemo } from 'react';
import {
  Search, Plus, X, Zap, TrendingUp, Building2,
  Mail, Link2, Phone, Globe, ChevronDown,
  AlertCircle, Calendar, Target, DollarSign,
  Users, SlidersHorizontal, CheckCircle2
// ============================================
// HUNTLO ΓÇö LEADS PAGE
// AI-Native Signal-Driven Lead System
// ============================================
import { useState, useMemo } from 'react';
import {
  Search, Plus, X, Zap, TrendingUp, Building2,
  Mail, Link2, Phone, Globe, ChevronDown,
  AlertCircle, Calendar, Target, DollarSign,
  Users, SlidersHorizontal, CheckCircle2
} from 'lucide-react';
import useDataStore from '../store/useDataStore';
import useAuthStore from '../store/useAuthStore';
import LeadDrawer from '../components/leads/LeadDrawer';
import NewLeadForm from '../components/leads/NewLeadForm';
import EnrollSequenceModal from '../components/sequences/EnrollSequenceModal';
import CsvImporterModal from '../components/CsvImporterModal';
import { useDialog } from '../context/DialogContext';
import { computeSignalScore, getPriority } from '../utils/leadScoring';
import './Leads.css';

// ΓöÇΓöÇ Signal score computation ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
// Extracted to src/utils/leadScoring.js

// ΓöÇΓöÇ Stage colours ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
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

// ΓöÇΓöÇ Smart View definitions ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
const VIEWS = [
  { id: 'all',         label: 'All Leads',          dot: '#64748b',  filter: () => true },
  { id: 'hot',         label: '≡ƒöÑ Hot Leads',        dot: '#dc2626',  filter: l => computeSignalScore(l) >= 70 },
  { id: 'signals',     label: '≡ƒôê Buying Signals',   dot: '#16a34a',  filter: l => {
    const s = l.signals || {};
    return s.hiring_activity || s.recruiter_hiring || s.funding_activity || l.demo_requested || l.positive_interest;
  }},
  { id: 'followup',    label: 'ΓÅ░ Needs Follow-up',  dot: '#d97706',  filter: l => {
    if (!l.next_action_due) return false;
    return new Date(l.next_action_due) < new Date();
  }},
  { id: 'demo',        label: '≡ƒôà Demo Scheduled',   dot: '#7c3aed',  filter: l => l.stage === 'Demo Scheduled' },
  { id: 'trial',       label: '≡ƒº¬ Trial Users',       dot: '#0891b2',  filter: l => l.stage === 'Trial Started' },
  { id: 'lost',        label: 'Γ¥î Lost',              dot: '#dc2626',  filter: l => l.stage === 'Lost' },
  { id: 'highMRR',     label: '≡ƒÆ░ High MRR Potential',dot: '#16a34a', filter: l => (l.estimated_mrr || 0) >= 500 },
];

// ΓöÇΓöÇ Lead Row ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
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
    { key: 'hiring_activity',      emoji: '≡ƒÆ╝', tip: 'Hiring Activity' },
    { key: 'recruiter_hiring',     emoji: '≡ƒÄ»', tip: 'Recruiter Hiring' },
    { key: 'funding_activity',     emoji: '≡ƒÆ░', tip: 'Funding Activity' },
    { key: 'linkedin_activity',    emoji: '≡ƒöù', tip: 'LinkedIn Activity' },
    { key: 'job_posting_activity', emoji: '≡ƒôï', tip: 'Job Postings' },
    { key: 'company_growth',       emoji: '≡ƒôê', tip: 'Company Growth' },
  ];

  return (
    <div
      className={`lead-row${isSelected ? ' selected' : ''}${!lead.next_action ? ' no-action' : ''}`}
      onClick={() => onClick(lead)}
    >
      {/* Checkbox */}
      <div className="lc" onClick={e => { if (isOwner) { e.stopPropagation(); onSelect(lead.id); } }}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => {}}
          disabled={!isOwner}
          title={!isOwner ? 'Only owner can select this lead' : ''}
          style={{ width: 15, height: 15, cursor: isOwner ? 'pointer' : 'not-allowed', accentColor: 'var(--accent-blue)', opacity: isOwner ? 1 : 0.5 }}
        />
      </div>

      {/* Company + Contact */}
      <div className="lead-company-cell">
        <div className="lead-logo" style={{ background: logoColor }}>{initial}</div>
        <div className="lead-company-info">
          <span className="lead-company-name">{lead.company_name || 'ΓÇö'}</span>
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
      <div className="lc">
        <span className="stage-badge" style={{ background: stageStyle.bg, color: stageStyle.color }}>
          {lead.stage || 'New Lead'}
        </span>
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
                {isOverdue ? 'ΓÜá Overdue ┬╖ ' : ''}
                {new Date(lead.next_action_due).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            )}
          </div>
        ) : (
          <span style={{ fontSize: 12, color: 'var(--danger)', fontWeight: 600 }}>ΓÜá No action set</span>
        )}
      </div>

      {/* Est. MRR */}
      <div className="lc">
        {lead.estimated_mrr ? (
          <span style={{ fontSize: 13, fontWeight: 600, color: '#16a34a' }}>
            ${lead.estimated_mrr.toLocaleString()}/mo
          </span>
        ) : (
          <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>ΓÇö</span>
        )}
      </div>

      {/* Notes / Remarks */}
      <div className="lc" style={{ paddingRight: 16 }} onClick={(e) => e.stopPropagation()} onDoubleClick={() => { if (isOwner) setIsEditingNote(true); }}>
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
          <span style={{ fontSize: 12, color: noteValue ? 'var(--text-secondary)' : 'var(--text-tertiary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', cursor: isOwner ? 'pointer' : 'default' }}>
            {noteValue || 'Double-click to add note...'}
          </span>
        )}
      </div>
    </div>
  );
}

// ΓöÇΓöÇ Main Page ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
export default function Leads() {
  const { leads, deleteLead, bulkDeleteLeads, updateLead } = useDataStore();
  const { team, user } = useAuthStore();
  const { showConfirm } = useDialog();
  const [activeView, setActiveView] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [showImporter, setShowImporter] = useState(false);

  // Enrich each lead with computed score
  const enriched = useMemo(() =>
    leads.map(l => ({ ...l, _score: computeSignalScore(l) })),
    [leads]
  );

  // Apply view filter
  const viewDef = VIEWS.find(v => v.id === activeView) || VIEWS[0];
  const viewFiltered = useMemo(() => enriched.filter(viewDef.filter), [enriched, viewDef]);

  // Apply search
  const filtered = useMemo(() => {
    const q = (search || '').toLowerCase();
    if (!q) return viewFiltered;
    return viewFiltered.filter(l =>
      (l.company_name || '').toLowerCase().includes(q) ||
      (l.contact_name || '').toLowerCase().includes(q) ||
      (l.email || '').toLowerCase().includes(q) ||
      (l.stage || '').toLowerCase().includes(q)
    );
  }, [viewFiltered, search]);

  const toggleSelect = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    // Only select leads the user owns
    const selectable = filtered.filter(l => l.owner_id === user?.id);
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
      {showNewForm && (
        <NewLeadForm onClose={() => setShowNewForm(false)} />
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
    </div>
  );
}
