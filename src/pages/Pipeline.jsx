// ============================================
// HUNTLO SALES OS — PIPELINE PAGE (INR)
// ============================================
import { useState } from 'react';
import { Search, Filter, Plus, GripVertical, X, IndianRupee } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import usePipelineStore from '../store/usePipelineStore';
import useDataStore from '../store/useDataStore';
import useAuthStore from '../store/useAuthStore';
import DealDrawer from '../components/pipeline/DealDrawer';
import NewDealDrawer from '../components/pipeline/NewDealDrawer';
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

function DealCard({ deal, onClick }) {
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
                <div className="avatar" title={`Owner: ${owner.name}`} style={{ background: owner.color || '#3b82f6' }}>
                  {owner.initials || getInitials(owner.name)}
                </div>
              );
            })()}
          </div>
        </div>
        <div className="deal-urgency-dot" style={{ background: URGENCY_COLOR[deal.urgency] }} title={`Urgency: ${deal.urgency}`} />
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

      <div className="deal-card-footer">
        <span className="deal-time">{deal.lastActivity ? formatDistanceToNow(new Date(deal.lastActivity), { addSuffix: true }) : 'New'}</span>
      </div>
    </div>
  );
}

function DraggableDealCard({ deal, onClick, user, team }) {
  const [isDragging, setIsDragging] = useState(false);

  // Use owner from deal (populated by store) or fallback to team search
  let ownerObj = deal.owner;
  if (!ownerObj || typeof ownerObj !== 'object') {
    ownerObj = team?.find(t => t.id === deal.owner_id) || { name: 'Unknown', color: '#3b82f6', initials: 'UN' };
  }
  const dealWithOwner = { ...deal, owner: ownerObj };

  const isOwner = user?.id === deal.owner_id;
  const isAdmin = user?.email === 'prajwal@earlyjobs.in';
  const canEdit = isOwner || isAdmin || !deal.owner_id;

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
      <DealCard deal={dealWithOwner} onClick={onClick} />
    </div>
  );
}

const PIPELINE_STAGES = ['Discovery', 'Qualification', 'Trial', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'];

function KanbanColumn({ stage, deals, onDealClick, onDrop, user, team }) {
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
        <span className="kanban-stage">{stage}</span>
        <div className="kanban-meta">
          <span className="kanban-count">{deals.length}</span>
          {total > 0 && <span className="kanban-arr">{fmtINR(total)}</span>}
        </div>
      </div>
      <div className="kanban-cards">
        {deals.map(deal => (
          <DraggableDealCard key={deal.id} deal={deal} onClick={onDealClick} user={user} team={team} />
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
  const { companies, createDeal } = useDataStore();
  const { user, team } = useAuthStore();
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({ title: '', company_id: '', arr: '', urgency: 'medium' });

  const filtered = getFilteredDeals();

  const handleDrop = (e, stage) => {
    const dealId = e.dataTransfer.getData('dealId');
    if (dealId) moveDeal(dealId, stage);
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
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm"><Filter size={13} /> Filter</button>
          <button className="btn btn-primary btn-sm" onClick={() => setIsAdding(true)}><Plus size={13} /> Add Deal</button>
        </div>
      </div>

      <div className="kanban-board">
        {PIPELINE_STAGES.map(stage => (
          <KanbanColumn
            key={stage}
            stage={stage}
            deals={filtered.filter(d => d.stage === stage)}
            onDealClick={selectDeal}
            onDrop={handleDrop}
            user={user}
            team={team}
          />
        ))}
      </div>

      {isAdding && (
        <NewDealDrawer onClose={() => setIsAdding(false)} />
      )}

      {drawerOpen && selectedDealId && !isAdding && (
        <DealDrawer dealId={selectedDealId} onClose={closeDrawer} />
      )}
    </div>
  );
}
