// ============================================
// HUNTLO SALES OS — PIPELINE PAGE (INR)
// ============================================
import { useState } from 'react';
import { Search, Plus, GripVertical, X, IndianRupee, Trash2, Edit2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import usePipelineStore from '../store/usePipelineStore';
import useDataStore from '../store/useDataStore';
import useAuthStore from '../store/useAuthStore';
import DealDrawer from '../components/pipeline/DealDrawer';
import NewDealDrawer from '../components/pipeline/NewDealDrawer';
import { useDialog } from '../context/DialogContext';
import './Pipeline.css';

// ── INR Formatter ─────────────────────────────────────────────
function fmtINR(amount) {
  const n = Number(amount) || 0;
  if (n >= 10000000) return `₹${(n/10000000).toFixed(2)}Cr`;
  if (n >= 100000)   return `₹${(n/100000).toFixed(1)}L`;
  if (n >= 1000)     return `₹${(n/1000).toFixed(0)}k`;
  return `₹${n}`;
}

const URGENCY_COLOR = { urgent: 'var(--danger)', high: 'var(--warning)', medium: 'var(--accent-blue)', low: 'var(--text-tertiary)' };

function DealCard({ deal, onClick, onDelete }) {
  const getInitials = (name) => name ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?';

  return (
    <div className="deal-card" onClick={() => onClick(deal.id)} id={`deal-${deal.id}`}>
      <div className="deal-card-top">
        <div className="deal-drag-handle" title="Drag to move"><GripVertical size={14} /></div>
        <div className="deal-logo" style={{ background: deal.color + '1A', color: deal.color, border: `1px solid ${deal.color}33` }}>
          {deal.logo}
        </div>
        <div className="deal-info">
          <span className="deal-company">{deal.title || deal.company}</span>
          <div className="deal-lead-row">
            <span className="deal-lead-name">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              {deal.leadName || 'No contact'}
            </span>
          </div>
          <div className="deal-metrics-row">
            <span className="deal-arr">{fmtINR(deal.arr || 0)} MRR</span>
            {(() => {
              const owner = deal.owner;
              if (!owner) return null;
              return (
                <div className="avatar" title={`Added By: ${owner.name}`} style={{ background: owner.color || '#3b82f6' }}>
                  {owner.initials || getInitials(owner.name)}
                </div>
              );
            })()}
          </div>
        </div>
        
        <div className="deal-actions-wrapper">
          <div className="deal-urgency-dot" style={{ background: URGENCY_COLOR[deal.urgency] }} title={`Urgency: ${deal.urgency}`} />
          <div className="deal-actions-hover">
            <button className="deal-action-btn edit" onClick={(e) => { e.stopPropagation(); onClick(deal.id); }} title="Edit Deal">
              <Edit2 size={12} />
            </button>
            <button className="deal-action-btn delete" onClick={(e) => { e.stopPropagation(); onDelete(deal.id); }} title="Delete Deal">
              <Trash2 size={12} />
            </button>
          </div>
        </div>
      </div>

      <div className="deal-card-mid">
        <div className="deal-score-row">
          <span className="deal-score-label">Engagement</span>
          <span className="deal-score-val" style={{ color: deal.engagementScore >= 75 ? 'var(--success)' : deal.engagementScore >= 50 ? 'var(--warning)' : 'var(--danger)' }}>
            {deal.engagementScore}
          </span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${deal.engagementScore}%`, background: deal.engagementScore >= 75 ? 'var(--success)' : deal.engagementScore >= 50 ? 'var(--warning)' : 'var(--danger)' }} />
        </div>
      </div>

      {deal.nextStep && (
        <div className="deal-next-step">
          <span className="step-arrow">→</span> {deal.nextStep}
        </div>
      )}

      <div className="deal-card-footer" style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
        <span className="deal-time">{deal.lastActivity ? formatDistanceToNow(new Date(deal.lastActivity), { addSuffix: true }) : 'New'}</span>
        {deal.lastActivity && (Date.now() - new Date(deal.lastActivity)) > 14 * 86400000 && deal.stage !== 'Closed Won' && deal.stage !== 'Closed Lost' && (
          <span style={{ fontSize: 10, color: 'var(--danger)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 2 }} title="Stale deal (>14 days no activity)">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            Stale
          </span>
        )}
      </div>
    </div>
  );
}

function DraggableDealCard({ deal, onClick, onDelete, user, team }) {
  const [isDragging, setIsDragging] = useState(false);

  // Use owner from deal (populated by store) or fallback to team search
  let ownerObj = deal.owner;
  if (!ownerObj || typeof ownerObj !== 'object') {
    ownerObj = team?.find(t => t.id === deal.owner_id) || { name: 'Unknown', color: '#3b82f6', initials: 'UN' };
  }
  const dealWithOwner = { ...deal, owner: ownerObj };

  const isOwner = user?.id === deal.owner_id;
  const currentUserProfile = team?.find(t => t.id === user?.id);
  const role = currentUserProfile?.role || 'SDR';
  const isAdminOrManager = role === 'Admin' || role === 'Manager' || user?.email === 'prajwal@earlyjobs.in';
  
  // AEs can edit their own deals. Admins/Managers can edit any. SDRs generally don't own deals.
  const canEdit = isOwner || isAdminOrManager || !deal.owner_id;

  return (
    <div
      draggable={canEdit}
      onDragStart={e => {
        if (!canEdit) {
          e.preventDefault();
          return;
        }
        setIsDragging(true);
        e.dataTransfer.setData('dealId', deal.id);
        e.dataTransfer.effectAllowed = 'move';
      }}
      onDragEnd={() => setIsDragging(false)}
      className={isDragging ? 'dragging-card' : ''}
      style={{ cursor: canEdit ? 'grab' : 'pointer' }}
    >
      <DealCard deal={dealWithOwner} onClick={onClick} onDelete={onDelete} />
    </div>
  );
}

const PIPELINE_STAGES = ['Discovery', 'Qualification', 'Trial', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'];

function KanbanColumn({ stage, deals, onDealClick, onDeleteClick, onAddClick, onDrop, user, team }) {
  const [dragOver, setDragOver] = useState(false);
  const total = deals.reduce((s, d) => s + (d.arr || 0), 0);

  return (
    <div
      className={`kanban-col ${dragOver ? 'drag-over' : ''}`}
      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={e => { e.preventDefault(); setDragOver(false); onDrop(e, stage); }}
    >
      <div className="kanban-col-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="kanban-stage">{stage}</span>
          <button className="kanban-add-btn" onClick={() => onAddClick(stage)} title="Add Deal to this stage">
            <Plus size={12} />
          </button>
        </div>
        <div className="kanban-meta">
          <span className="kanban-count">{deals.length}</span>
          {total > 0 && <span className="kanban-arr">{fmtINR(total)}</span>}
        </div>
      </div>
      <div className="kanban-cards">
        {deals.map(deal => (
          <DraggableDealCard key={deal.id} deal={deal} onClick={onDealClick} onDelete={onDeleteClick} user={user} team={team} />
        ))}
        {deals.length === 0 && (
          <div className="kanban-empty">Drop deals here</div>
        )}
      </div>
    </div>
  );
}

export default function Pipeline() {
  const { drawerOpen, selectedDealId, selectDeal, closeDrawer, moveDeal, setSearch, search, filter, setFilter, getFilteredDeals } = usePipelineStore();
  const { companies, deals, createDeal, updateDeal, deleteDeal } = useDataStore();
  const { user, team } = useAuthStore();
  const { showConfirm, showPrompt } = useDialog();
  const [isAdding, setIsAdding] = useState(false);
  const [addingStage, setAddingStage] = useState('Discovery');
  const [formData, setFormData] = useState({ title: '', company_id: '', arr: '', urgency: 'medium' });

  const filtered = getFilteredDeals();

  const handleDeleteDeal = async (dealId) => {
    const confirmed = await showConfirm(
      'Delete Deal',
      'Are you sure you want to delete this deal? This action cannot be undone.',
      'Yes, Delete',
      'Cancel',
      'error'
    );
    if (confirmed) {
      try {
        await deleteDeal(dealId);
      } catch (err) {
        console.error('Failed to delete deal:', err);
      }
    }
  };

  const handleDrop = async (e, stage) => {
    const dealId = e.dataTransfer.getData('dealId');
    if (dealId) {
      if (stage === 'Closed Lost') {
        const reason = await showPrompt(
          'Mark Deal as Lost',
          'Please provide a reason for closing this deal as lost.',
          'e.g. Pricing, Competitor, No Need…',
          'Mark as Lost',
          'Cancel'
        );
        if (reason) {
          await updateDeal(dealId, { 
            stage: 'Closed Lost',
            lost_reason: reason
          });
        }
      } else {
        moveDeal(dealId, stage);
      }
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.company_id) return;
    try {
      await createDeal({
        title: formData.title,
        company_id: formData.company_id,
        arr: Number(formData.arr),
        stage: 'Discovery',
        urgency: formData.urgency,
        engagement_score: 0
      });
      setIsAdding(false);
      setFormData({ title: '', company_id: '', arr: '', urgency: 'medium' });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="pipeline-page">
      <div className="pipeline-toolbar">
        <div className="search-box" style={{ maxWidth: 260 }}>
          <Search size={14} />
          <input placeholder="Search deals..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="filter-chips">
          {['all', 'hot', 'stale', 'urgent'].map(f => (
            <button key={f} className={`filter-chip ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--text-tertiary)', fontWeight: 500 }}>
            {filtered.length} deal{filtered.length !== 1 ? 's' : ''}
          </span>
          <div className="page-header-right">
            <button className="btn btn-primary" onClick={() => { setAddingStage('Discovery'); setIsAdding(true); }}>
              <Plus size={14} /> Add Deal
            </button>
          </div>
        </div>
      </div>

      <div className="kanban-board">
        {PIPELINE_STAGES.map(stage => (
          <KanbanColumn
            key={stage}
            stage={stage}
            deals={filtered.filter(d => d.stage === stage)}
            onDealClick={selectDeal}
            onDeleteClick={handleDeleteDeal}
            onAddClick={(st) => { setAddingStage(st); setIsAdding(true); }}
            onDrop={handleDrop}
            user={user}
            team={team}
          />
        ))}
      </div>

      {isAdding && (
        <NewDealDrawer 
          onClose={() => setIsAdding(false)} 
          prefilledStage={addingStage}
        />
      )}

      {drawerOpen && selectedDealId && !isAdding && (
        <DealDrawer dealId={selectedDealId} onClose={closeDrawer} />
      )}
    </div>
  );
}
