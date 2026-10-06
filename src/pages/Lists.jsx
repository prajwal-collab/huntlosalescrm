import { useState, useMemo } from 'react';
import { 
  Database, Plus, Sparkles, Filter, Download, MoreVertical, 
  Search, CheckCircle, ArrowLeft, Users, Calendar, 
  Activity, Mail, Phone, Zap, UserPlus, TrendingUp, BarChart2,
  Clock, CheckSquare, Target, Upload, X, Edit2
} from 'lucide-react';
import CsvImporterModal from '../components/CsvImporterModal';
import BulkEditModal from '../components/BulkEditModal';
import './Lists.css';

const INITIAL_LISTS = [
  { 
    id: 1, 
    name: 'Q4 Enterprise Prospects', 
    count: 245, 
    createdAt: '2026-09-15', 
    status: 'Enriched',
    icon: Database,
    metrics: { pipelineValue: '$1.2M', engagement: '68%', readyForOutreach: 180 },
    records: [
      { id: 101, company: 'Acme Corp', contact: 'John Doe', title: 'VP Sales', email: 'john@acme.com', phone: '+1 234 567 8900', score: 85, owner: 'Sarah J.', lastActivity: '2h ago', status: 'Hot' },
      { id: 102, company: 'Globex', contact: 'Jane Smith', title: 'CMO', email: 'jane@globex.com', phone: '+1 987 654 3210', score: 92, owner: 'Mike T.', lastActivity: '1d ago', status: 'Engaged' },
      { id: 103, company: 'Soylent', contact: 'Bob Vance', title: 'Director', email: 'bob@soylent.com', phone: '+1 555 456 7890', score: 78, owner: 'Sarah J.', lastActivity: '3d ago', status: 'Cold' },
      { id: 104, company: 'Initech', contact: 'Bill Lumbergh', title: 'VP Engineering', email: 'bill@initech.com', phone: '+1 444 333 2222', score: 95, owner: 'Unassigned', lastActivity: '10m ago', status: 'Hot' },
    ]
  },
  { 
    id: 2, 
    name: 'Tech Conference Attendees', 
    count: 1089, 
    createdAt: '2026-10-02', 
    status: 'Raw',
    icon: Users,
    metrics: { pipelineValue: '$0', engagement: '0%', readyForOutreach: 0 },
    records: [
      { id: 201, company: 'Hooli', contact: 'Gavin Belson', title: 'CEO', email: '-', phone: '-', score: 40, owner: 'Unassigned', lastActivity: '-', status: 'New' },
      { id: 202, company: 'Umbrella Corp', contact: 'Alice', title: 'Security', email: '-', phone: '-', score: 35, owner: 'Unassigned', lastActivity: '-', status: 'New' },
    ]
  },
  { 
    id: 3, 
    name: 'Churned Customers 2025', 
    count: 87, 
    createdAt: '2026-10-05', 
    status: 'Enriched',
    icon: Activity,
    metrics: { pipelineValue: '$400k', engagement: '12%', readyForOutreach: 45 },
    records: [
      { id: 301, company: 'Stark Ind.', contact: 'Tony Stark', title: 'CEO', email: 'tony@stark.com', phone: '+1 555 0199', score: 99, owner: 'Pepper P.', lastActivity: '5h ago', status: 'Hot' }
    ]
  }
];

export default function Lists() {
  const [lists, setLists] = useState(INITIAL_LISTS);
  const [selectedList, setSelectedList] = useState(null);
  const [enrichingId, setEnrichingId] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // New States for Import, Call & Push
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [callingRecord, setCallingRecord] = useState(null);
  const [callNotes, setCallNotes] = useState('');
  const [isPushing, setIsPushing] = useState(false);
  const [pushSuccess, setPushSuccess] = useState(false);
  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false);

  const handlePushToLeads = (e) => {
    e?.stopPropagation();
    setIsPushing(true);
    setTimeout(() => {
      setIsPushing(false);
      setPushSuccess(true);
      setTimeout(() => setPushSuccess(false), 3000);
      setSelectedRows([]);
    }, 1500);
  };

  const handleEndCall = () => {
    if (!callingRecord) return;
    setLists(prev => prev.map(list => ({
      ...list,
      records: list.records.map(r => 
        r.id === callingRecord.id ? { ...r, lastActivity: 'Just now', score: Math.min(100, r.score + 5) } : r
      )
    })));
    if (selectedList) {
      setSelectedList(prev => ({
        ...prev,
        records: prev.records.map(r => 
          r.id === callingRecord.id ? { ...r, lastActivity: 'Just now', score: Math.min(100, r.score + 5) } : r
        )
      }));
    }
    setCallingRecord(null);
    setCallNotes('');
  };

  const handleEnrich = (e, listId) => {
    e.stopPropagation();
    setEnrichingId(listId);
    
    // Simulate API call for enrichment
    setTimeout(() => {
      setLists(prev => prev.map(list => {
        if (list.id === listId) {
          const enrichedRecords = list.records.map(r => ({
            ...r,
            email: r.email === '-' ? `${r.contact.toLowerCase().replace(' ', '.')}@${r.company.toLowerCase().replace(/[^a-z0-9]/g, '')}.com` : r.email,
            phone: r.phone === '-' ? `+1 ${Math.floor(Math.random() * 900 + 100)} 555 ${Math.floor(Math.random() * 9000 + 1000)}` : r.phone,
            score: r.score < 50 ? r.score + 45 : r.score,
            status: 'Ready'
          }));
          return { 
            ...list, 
            status: 'Enriched', 
            records: enrichedRecords,
            metrics: { pipelineValue: '$2.4M', engagement: '5%', readyForOutreach: enrichedRecords.length }
          };
        }
        return list;
      }));
      setEnrichingId(null);
      
      // Update selected list in view if it's the one being enriched
      if (selectedList && selectedList.id === listId) {
        setSelectedList(prev => ({
          ...prev,
          status: 'Enriched',
          metrics: { pipelineValue: '$2.4M', engagement: '5%', readyForOutreach: prev.records.length },
          records: prev.records.map(r => ({
            ...r,
            email: r.email === '-' ? `${r.contact.toLowerCase().replace(' ', '.')}@${r.company.toLowerCase().replace(/[^a-z0-9]/g, '')}.com` : r.email,
            phone: r.phone === '-' ? `+1 ${Math.floor(Math.random() * 900 + 100)} 555 ${Math.floor(Math.random() * 9000 + 1000)}` : r.phone,
            score: r.score < 50 ? r.score + 45 : r.score,
            status: 'Ready'
          }))
        }));
      }
    }, 2500);
  };

  const toggleRowSelection = (id) => {
    setSelectedRows(prev => 
      prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
    );
  };

  const selectAllRows = () => {
    if (selectedList) {
      if (selectedRows.length === selectedList.records.length) {
        setSelectedRows([]);
      } else {
        setSelectedRows(selectedList.records.map(r => r.id));
      }
    }
  };

  const filteredRecords = useMemo(() => {
    if (!selectedList) return [];
    if (!searchQuery) return selectedList.records;
    const lowerQ = searchQuery.toLowerCase();
    return selectedList.records.filter(r => 
      r.company.toLowerCase().includes(lowerQ) || 
      r.contact.toLowerCase().includes(lowerQ) ||
      r.owner.toLowerCase().includes(lowerQ)
    );
  }, [selectedList, searchQuery]);

  if (selectedList) {
    return (
      <div className="lists-page-container detail-mode">
        <div className="list-detail-view">
          
          {/* Header Section */}
          <div className="detail-header">
            <div className="detail-title-area">
              <button className="back-btn" onClick={() => { setSelectedList(null); setSelectedRows([]); setSearchQuery(''); }}>
                <ArrowLeft size={20} />
              </button>
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                  {selectedList.name}
                  {selectedList.status === 'Enriched' && (
                    <span className="badge-enriched"><Sparkles size={12}/> Enriched</span>
                  )}
                </h2>
                <div style={{ display: 'flex', gap: 16, color: 'var(--text-tertiary)', fontSize: 13, fontWeight: 500 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Users size={14} /> {selectedList.count} Leads
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Calendar size={14} /> Created {selectedList.createdAt}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="lists-actions">
              <div className="search-bar" style={{ width: 220 }}>
                <Search size={16} />
                <input 
                  type="text" 
                  placeholder="Search in list..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button className="btn btn-ghost"><Filter size={16} /> Filters</button>
              <button className="btn btn-ghost" onClick={() => setIsImportOpen(true)}><Upload size={16} /> Import Leads</button>
              
              {selectedList.status !== 'Enriched' && (
                <button 
                  className={`btn btn-enrich ${enrichingId === selectedList.id ? 'enriching' : ''}`}
                  onClick={(e) => handleEnrich(e, selectedList.id)}
                >
                  {enrichingId === selectedList.id ? (
                    <><Activity size={16} className="enriching-spinner" /> Enriching...</>
                  ) : (
                    <><Sparkles size={16} /> Auto-Enrich Data</>
                  )}
                </button>
              )}
            </div>
          </div>
          
          {/* List Analytics Cards */}
          <div className="list-analytics-bar">
            <div className="analytic-card">
              <div className="analytic-icon pipeline"><TrendingUp size={18}/></div>
              <div className="analytic-info">
                <div className="analytic-label">Est. Pipeline Value</div>
                <div className="analytic-value">{selectedList.metrics.pipelineValue}</div>
              </div>
            </div>
            <div className="analytic-card">
              <div className="analytic-icon engagement"><Activity size={18}/></div>
              <div className="analytic-info">
                <div className="analytic-label">List Engagement</div>
                <div className="analytic-value">{selectedList.metrics.engagement}</div>
              </div>
            </div>
            <div className="analytic-card">
              <div className="analytic-icon outreach"><Zap size={18}/></div>
              <div className="analytic-info">
                <div className="analytic-label">Ready for Outreach</div>
                <div className="analytic-value">{selectedList.metrics.readyForOutreach}</div>
              </div>
            </div>
          </div>

          {/* Bulk Action Bar (Floating) */}
          {selectedRows.length > 0 && (
            <div className="bulk-action-bar">
              <div className="bulk-count">
                <span className="count-badge">{selectedRows.length}</span> leads selected
              </div>
              <div className="bulk-actions">
                <button className="btn btn-outline btn-sm" onClick={handlePushToLeads}>
                  {isPushing ? <Activity size={14} className="enriching-spinner" /> : <Target size={14} />} 
                  {pushSuccess ? 'Pushed!' : 'Push to Leads'}
                </button>
                <button className="btn btn-outline btn-sm" onClick={() => setIsBulkEditOpen(true)}><Edit2 size={14} /> Bulk Edit</button>
                <button className="btn btn-outline btn-sm"><UserPlus size={14} /> Assign Owner</button>
                <button className="btn btn-outline btn-sm"><Mail size={14} /> Bulk Email</button>
              </div>
            </div>
          )}

          {/* Data Table */}
          <div className="detail-content">
            <div className="data-table-container">
              <table className="data-table sales-table">
                <thead>
                  <tr>
                    <th style={{ width: 40 }}>
                      <input 
                        type="checkbox" 
                        checked={selectedRows.length === filteredRecords.length && filteredRecords.length > 0}
                        onChange={selectAllRows}
                        className="custom-checkbox"
                      />
                    </th>
                    <th>Prospect</th>
                    <th>Contact Info</th>
                    <th>Owner</th>
                    <th>Activity</th>
                    <th>Score</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map(record => (
                    <tr key={record.id} className={selectedRows.includes(record.id) ? 'selected-row' : ''}>
                      <td>
                        <input 
                          type="checkbox" 
                          checked={selectedRows.includes(record.id)}
                          onChange={() => toggleRowSelection(record.id)}
                          className="custom-checkbox"
                        />
                      </td>
                      <td>
                        <div className="prospect-info">
                          <div className="prospect-name">{record.contact}</div>
                          <div className="prospect-meta">{record.title} @ <span style={{fontWeight: 600, color: 'var(--text-primary)'}}>{record.company}</span></div>
                        </div>
                      </td>
                      <td>
                        <div className="contact-info">
                          {record.email !== '-' ? (
                            <div className="contact-item">
                              <Mail size={12} /> 
                              {selectedList.status === 'Enriched' && record.id > 200 ? 
                                <span className="enriched-text">{record.email}</span> : record.email}
                            </div>
                          ) : <div className="contact-item missing">No Email</div>}
                          {record.phone !== '-' ? (
                            <div className="contact-item">
                              <Phone size={12} /> 
                              {selectedList.status === 'Enriched' && record.id > 200 ? 
                                <span className="enriched-text">{record.phone}</span> : record.phone}
                            </div>
                          ) : null}
                        </div>
                      </td>
                      <td>
                        <div className={`owner-badge ${record.owner === 'Unassigned' ? 'unassigned' : ''}`}>
                          {record.owner !== 'Unassigned' && <div className="owner-avatar">{record.owner.charAt(0)}</div>}
                          {record.owner}
                        </div>
                      </td>
                      <td>
                        <div className="activity-info">
                          <Clock size={12} /> {record.lastActivity}
                        </div>
                      </td>
                      <td>
                        <div className={`score-badge ${record.score >= 80 ? 'high' : record.score >= 50 ? 'medium' : 'low'}`}>
                          {record.score}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="row-actions">
                          <button className="icon-btn tooltip-trigger" data-tooltip="Call" onClick={() => setCallingRecord(record)}>
                            <Phone size={15} />
                          </button>
                          <button className="icon-btn tooltip-trigger" data-tooltip="Push to Leads" onClick={(e) => handlePushToLeads(e)}>
                            <Target size={15} />
                          </button>
                          <button className="icon-btn tooltip-trigger" data-tooltip="Email">
                            <Mail size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredRecords.length === 0 && (
                    <tr>
                      <td colSpan="7" className="empty-state">
                        No records found matching your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Calling Modal */}
          {callingRecord && (
            <div className="modal-backdrop">
              <div className="modal-content" style={{ width: 400 }}>
                <div className="modal-header">
                  <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Phone size={18} color="var(--accent-blue)" /> Calling {callingRecord.contact}...
                  </h3>
                  <button className="icon-btn" onClick={() => setCallingRecord(null)}><X size={16} /></button>
                </div>
                <div className="modal-body" style={{ padding: 20 }}>
                  <div style={{ marginBottom: 16, fontSize: 14 }}>
                    <strong>Company:</strong> {callingRecord.company}<br/>
                    <strong>Phone:</strong> {callingRecord.phone}
                  </div>
                  <textarea 
                    style={{ width: '100%', height: 100, padding: 12, borderRadius: 8, border: '1px solid var(--bg-border)', background: 'var(--bg-page)', color: 'var(--text-primary)' }}
                    placeholder="Call notes..."
                    value={callNotes}
                    onChange={(e) => setCallNotes(e.target.value)}
                  />
                  <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                    <button className="btn btn-outline" onClick={() => setCallingRecord(null)}>Cancel</button>
                    <button className="btn btn-primary" onClick={handleEndCall}>End Call & Update</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Import Modal */}
          {isImportOpen && (
            <CsvImporterModal 
              onClose={() => setIsImportOpen(false)} 
              onImport={(data) => {
                 console.log("Imported:", data);
                 setIsImportOpen(false);
              }} 
            />
          )}

          {/* Bulk Edit Modal */}
          <BulkEditModal 
            isOpen={isBulkEditOpen}
            onClose={() => setIsBulkEditOpen(false)}
            entityType="leads"
            selectedIds={selectedRows}
            onClearSelection={() => setSelectedRows([])}
          />

        </div>
      </div>
    );
  }

  // --- MAIN LISTS VIEW ---
  return (
    <div className="lists-page-container">
      <div className="lists-header">
        <div>
          <h1 className="lists-title">
            Smart Lists & Segments
          </h1>
          <p className="lists-subtitle">
            World-class dynamic list management. Build hyper-targeted segments, enrich missing data, and deploy to sales plays instantly.
          </p>
        </div>
        <div className="lists-actions">
          <div className="search-bar" style={{ width: 240 }}>
            <Search size={16} />
            <input type="text" placeholder="Search lists..." />
          </div>
          <button className="btn btn-primary">
            <Plus size={18} /> Create Segment
          </button>
        </div>
      </div>

      {/* Global Sales Overview */}
      <div className="global-stats-row">
        <div className="stat-card">
          <div className="stat-icon" style={{background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6'}}><Database size={18}/></div>
          <div className="stat-content">
            <div className="stat-label">Total Lists</div>
            <div className="stat-value">{lists.length}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6'}}><Users size={18}/></div>
          <div className="stat-content">
            <div className="stat-label">Total Prospects</div>
            <div className="stat-value">{lists.reduce((acc, l) => acc + l.records.length, 0)}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{background: 'rgba(16, 185, 129, 0.1)', color: '#10b981'}}><CheckSquare size={18}/></div>
          <div className="stat-content">
            <div className="stat-label">Fully Enriched</div>
            <div className="stat-value">{lists.filter(l => l.status === 'Enriched').length} Lists</div>
          </div>
        </div>
      </div>

      <div className="lists-grid">
        {lists.map((list) => {
          const Icon = list.icon;
          return (
            <div key={list.id} className="list-card" onClick={() => setSelectedList(list)}>
              <div className="list-card-header">
                <div className="list-icon-wrapper">
                  <Icon size={20} />
                </div>
                <div className={`list-status ${list.status === 'Enriched' ? 'status-enriched' : 'status-raw'}`}>
                  {list.status}
                </div>
              </div>
              
              <div className="list-name">{list.name}</div>
              
              <div className="list-meta">
                <div className="meta-item">
                  <Users size={14} /> {list.count} Leads
                </div>
                <div className="meta-item">
                  <Calendar size={14} /> {list.createdAt}
                </div>
              </div>

              {/* Mini Pipeline Indicator */}
              <div className="mini-pipeline-indicator">
                <div className="pipeline-label">Est. Value</div>
                <div className="pipeline-val">{list.metrics.pipelineValue}</div>
              </div>

              <div className="list-card-footer">
                <button className="btn btn-outline" style={{ flex: 1, justifyContent: 'center' }}>
                  Open List
                </button>
                {list.status !== 'Enriched' && (
                  <button 
                    className={`btn btn-enrich ${enrichingId === list.id ? 'enriching' : ''}`}
                    onClick={(e) => handleEnrich(e, list.id)}
                  >
                    {enrichingId === list.id ? (
                      <Activity size={16} className="enriching-spinner" />
                    ) : (
                      <><Sparkles size={16} /> Auto-Enrich</>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
