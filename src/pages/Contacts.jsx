// ============================================
// HUNTLO SALES OS — CONTACTS PAGE
// ============================================
import { useState, useRef } from 'react';
import { Search, Mail, Plus, ExternalLink, MessageSquare, X, Users, Upload, Download, AlertCircle, Loader } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import useDataStore from '../store/useDataStore';
import './Contacts.css';

const SENTIMENT_COLOR = {
  'very positive': 'var(--success)', 'positive': '#86efac',
  'neutral': 'var(--warning)', 'negative': 'var(--danger)',
};

const TAG_COLORS = {
  'Decision Maker': 'badge-purple', 'Champion': 'badge-cyan',
  'Enterprise': 'badge-blue', 'High Intent': 'badge-green',
  'Warm Lead': 'badge-yellow', 'Ghosted': 'badge-red',
  'Strategic': 'badge-blue', 'Trial Active': 'badge-green',
  'Onboarding': 'badge-cyan',
};

function ContactRow({ contact, onSelect, selected }) {
  return (
    <div className={`contact-row ${selected ? 'selected' : ''}`} onClick={(e) => { e.stopPropagation(); onSelect(contact); }}>
      <div className="cr-cell" style={{ width: 280, paddingRight: 16 }}>
        <div className="cr-name-wrap">
          <div className="avatar avatar-md" style={{ background: 'transparent', border: '1px solid var(--border-light)', borderRadius: 4, color: 'var(--text-secondary)', flexShrink: 0, width: 24, height: 24, fontSize: 11 }}>
            {contact.name ? contact.name.charAt(0).toUpperCase() : 'C'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <span className="cr-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13, fontWeight: 400 }}>{contact.name}</span>
          </div>
        </div>
      </div>
      
      <div className="cr-cell cr-company" style={{ width: 180, paddingRight: 16 }}>
        <span className="badge badge-gray" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-light)', color: 'var(--text-secondary)' }}>Cold</span>
      </div>
      
      <div className="cr-cell" style={{ width: 140, paddingRight: 16 }}>
        <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>-</span>
      </div>
      
      <div className="cr-cell" style={{ width: 160, paddingRight: 16 }}>
        <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>-</span>
      </div>
      
      <div className="cr-cell cr-actions" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12, opacity: 1, transform: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--text-secondary)' }}>
          <Mail size={14} style={{ cursor: 'pointer' }} />
          <MessageSquare size={14} style={{ cursor: 'pointer' }} />
          <Plus size={14} style={{ cursor: 'pointer' }} />
          <span style={{ cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>...</span>
        </div>
        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--text-tertiary)', padding: '2px 8px' }} onClick={e => { e.stopPropagation(); onSelect(contact); }}>
          ▷ Click to view
        </button>
      </div>
    </div>
  );
}

function ContactDetail({ contact, onClose }) {
  return (
    <div className="contact-detail animate-slide-right">
      <div className="panel-header" style={{ marginBottom: 'var(--space-4)' }}>
        <div className="avatar avatar-xl" style={{ background: contact.color || '#3b82f6', color: '#fff' }}>
          {contact.name ? contact.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : 'CO'}
        </div>
        <div>
          <h2 className="panel-title">{contact.name}</h2>
          <p className="panel-sub">{contact.designation}{contact.company && contact.company !== 'Unknown' ? ` · ${contact.company}` : ''}</p>
        </div>
        <button className="drawer-close" onClick={onClose}>✕</button>
      </div>

      <div className="contact-detail-tags">
        {(contact.tags || []).map(t => <span key={t} className={`badge ${TAG_COLORS[t] || 'badge-gray'}`}>{t}</span>)}
      </div>

      <div className="panel-stats">
        <div className="ov-stat"><span className="ov-stat-label">Company</span><span className="ov-stat-val" style={{ fontWeight: 600 }}>{contact.company && contact.company !== 'Unknown' ? contact.company : '--'}</span></div>
        <div className="ov-stat"><span className="ov-stat-label">Engagement</span><span className="ov-stat-val" style={{ color: 'var(--success)' }}>{contact.engagement_score || 0}</span></div>
        <div className="ov-stat"><span className="ov-stat-label">Sentiment</span><span className="ov-stat-val" style={{ textTransform: 'capitalize', color: SENTIMENT_COLOR[contact.sentiment] }}>{contact.sentiment || 'Neutral'}</span></div>
        <div className="ov-stat"><span className="ov-stat-label">Role</span><span className="ov-stat-val">{contact.role || '--'}</span></div>
        <div className="ov-stat"><span className="ov-stat-label">Timezone</span><span className="ov-stat-val">{contact.timezone || '--'}</span></div>
      </div>

      <div className="contact-reach">
        <a href={`mailto:${contact.email}`} className="reach-item">
          <Mail size={14} /> {contact.email}
        </a>
        <a href={`https://${contact.linkedin}`} target="_blank" rel="noopener noreferrer" className="reach-item">
          <ExternalLink size={14} /> LinkedIn Profile
        </a>
        <div className="reach-item">
          <MessageSquare size={14} /> {contact.whatsapp}
        </div>
      </div>

      {contact.notes && (
        <div className="ov-notes">
          <p className="ov-notes-label">Intelligence</p>
          <p className="ov-notes-text">{contact.notes}</p>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button className="btn btn-primary btn-sm" onClick={() => alert(`Emailing ${contact.email}...`)}><Mail size={13} /> Send Email</button>
        <button className="btn btn-ghost btn-sm" onClick={() => alert('WhatsApp integration triggered')}><MessageSquare size={13} /> WhatsApp</button>
        <button className="btn btn-ghost btn-sm" onClick={() => window.open(contact.linkedin ? `https://${contact.linkedin}` : 'https://linkedin.com', '_blank')}><ExternalLink size={13} /> LinkedIn</button>
      </div>
    </div>
  );
}

import CsvImporterModal from '../components/CsvImporterModal';

export default function Contacts() {
  const { contacts, companies, createContact, bulkCreateContacts } = useDataStore();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [filterRole, setFilterRole] = useState('all');
  const [isAdding, setIsAdding] = useState(false);
  const [isImporterOpen, setIsImporterOpen] = useState(false);

  const [formData, setFormData] = useState({ name: '', email: '', designation: '', company_id: '', role: 'Decision Maker', linkedin: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [selectedIds, setSelectedIds] = useState([]);
  const [deleting, setDeleting] = useState(false);

  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} contacts?`)) return;
    setDeleting(true);
    try {
      await useDataStore.getState().bulkDeleteContacts(selectedIds);
      setSelectedIds([]);
      setSelected(null);
    } catch (err) {
      alert('Failed to delete: ' + err.message);
    } finally {
      setDeleting(false);
    }
  };

  const toggleSelect = (id, e) => {
    e.stopPropagation();
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const filtered = contacts.filter(c => {
    const q = search.toLowerCase();
    const companyMatch = companies.find(comp => comp.id === c.company_id);
    const coName = companyMatch ? companyMatch.name : '';
    
    const matchSearch = c.name.toLowerCase().includes(q) || coName.toLowerCase().includes(q) || (c.designation && c.designation.toLowerCase().includes(q));
    const matchRole = filterRole === 'all' || c.role === filterRole;
    return matchSearch && matchRole;
  });

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!formData.name) return;
    setSaving(true);
    setError(null);
    try {
      await createContact({
        name: formData.name,
        email: formData.email,
        designation: formData.designation,
        company_id: formData.company_id || null,
        role: formData.role,
        linkedin: formData.linkedin,
        tags: [],
        engagement_score: 0,
        sentiment: 'neutral'
      });
      setIsAdding(false);
      setFormData({ name: '', email: '', designation: '', company_id: '', role: 'Decision Maker', linkedin: '' });
    } catch (error) {
      console.error(error);
      setError(error.message || 'Failed to create contact');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="contacts-page">
      <div className="page-header-row" style={{ padding: '24px 24px 12px' }}>
        <div>
          <h1 className="page-big-title" style={{ fontSize: 22 }}>People</h1>
          <p className="page-big-sub" style={{ fontSize: 13 }}>{contacts.length} records</p>
        </div>
        <div className="page-header-actions">
          {selectedIds.length > 0 ? (
            <button className="btn btn-primary btn-sm" style={{ backgroundColor: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={handleBulkDelete} disabled={deleting}>
              {deleting ? 'Deleting...' : `Delete ${selectedIds.length} Selected`}
            </button>
          ) : (
            <>
              <button className="btn btn-ghost btn-sm" onClick={() => setIsImporterOpen(true)}>Import</button>
              <button className="btn btn-primary btn-sm" onClick={() => setIsAdding(true)}><Plus size={13} /> Create person</button>
            </>
          )}
        </div>
      </div>

      <div className="apollo-sub-bar" style={{ padding: '0 24px 12px', borderBottom: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button className="btn btn-ghost btn-sm" style={{ color: 'var(--text-secondary)', padding: '4px 8px' }}>
             My saved people v
          </button>
          <button className="btn btn-ghost btn-sm" style={{ color: 'var(--text-secondary)', padding: '4px 8px' }}>
             = Show Filters <span className="apollo-tab-count" style={{ background: 'transparent' }}>1</span>
          </button>
          <div className="search-box" style={{ width: 240, background: 'transparent', border: '1px solid var(--border-light)' }}>
            <Search size={14} color="var(--text-tertiary)" />
            <input placeholder="Search people" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500 }}>
          <button className="btn btn-ghost btn-sm" style={{ color: 'var(--text-secondary)', padding: '4px 8px' }}>
             Create workflow v
          </button>
          <button className="btn btn-ghost btn-sm" style={{ border: '1px solid var(--border-light)', padding: '4px 12px' }}>
             Save as new view
          </button>
          <span style={{ cursor: 'pointer' }}>↑↓ Sort</span>
          <span style={{ cursor: 'pointer' }}>⚙ View options</span>
        </div>
      </div>

      <div className="contacts-layout">
        <div className="contacts-table-wrap">
          <div className="contacts-table-head">
            <div style={{ width: 32, display: 'flex', alignItems: 'center' }}>
              <input 
                type="checkbox" 
                checked={selectedIds.length === filtered.length && filtered.length > 0}
                onChange={() => {
                  if (selectedIds.length === filtered.length) setSelectedIds([]);
                  else setSelectedIds(filtered.map(c => c.id));
                }}
                style={{ width: 16, height: 16, cursor: 'pointer' }}
              />
            </div>
            <span style={{ width: 280 }}>Name</span>
            <span style={{ width: 180 }}>Stage</span>
            <span style={{ width: 140 }}>Last activity date</span>
            <span style={{ width: 160 }}>Recommendations</span>
            <span style={{ marginLeft: 'auto' }}>Actions</span>
          </div>
          
          <div className="contacts-list">
            {filtered.map(c => {
              const comp = companies.find(comp => comp.id === c.company_id);
              const isSelected = selectedIds.includes(c.id);
              return (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                  <div style={{ position: 'absolute', left: 16, zIndex: 10, display: 'flex', alignItems: 'center' }}>
                    <input 
                      type="checkbox" 
                      checked={isSelected}
                      onChange={(e) => toggleSelect(c.id, e)}
                      style={{ width: 16, height: 16, cursor: 'pointer' }}
                    />
                  </div>
                  <div style={{ flex: 1, paddingLeft: 32 }}>
                    <ContactRow contact={{...c, company: comp ? comp.name : 'Unknown'}} selected={selected?.id === c.id} onSelect={co => setSelected(co.id === selected?.id ? null : co)} />
                  </div>
                </div>
              );
            })}
            {contacts.length === 0 && (
             <div className="empty-state" style={{ marginTop: 40 }}>
               <Users size={32} />
               <h3>No contacts yet</h3>
               <p>Add people to start building relationships.</p>
             </div>
            )}
          </div>
        </div>
        
        {selected && !isAdding && <ContactDetail contact={{...selected, company: companies.find(comp => comp.id === selected.company_id)?.name}} onClose={() => setSelected(null)} />}
        
        {isAdding && (
          <div className="contact-detail animate-slide-right">
            <div className="panel-header" style={{ marginBottom: 24 }}>
              <h2 className="panel-title">Add Contact</h2>
              <button className="drawer-close" onClick={() => setIsAdding(false)}><X size={16}/></button>
            </div>
            <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {error && (
                <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertCircle size={14} /> {error}
                </div>
              )}
              <div className="form-group">
                <label className="label">Full Name</label>
                <input className="input-base" autoFocus required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="label">Email Address</label>
                <input className="input-base" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="label">Job Title</label>
                <input className="input-base" value={formData.designation} onChange={e => setFormData({...formData, designation: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="label">Company</label>
                <select className="input-base" value={formData.company_id} onChange={e => setFormData({...formData, company_id: e.target.value})}>
                  <option value="">Select Company</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="label">Persona Role</label>
                <select className="input-base" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                  <option value="Decision Maker">Decision Maker</option>
                  <option value="Champion">Champion</option>
                  <option value="Technical Evaluator">Technical Evaluator</option>
                  <option value="Influencer">Influencer</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary btn-md w-full" style={{ marginTop: 8 }} disabled={saving}>
                {saving ? <Loader size={14} className="cc-spinner" /> : 'Save Contact'}
              </button>
            </form>
          </div>
        )}
      </div>

      <CsvImporterModal 
        isOpen={isImporterOpen} 
        onClose={() => setIsImporterOpen(false)} 
        type="contacts" 
      />
    </div>
  );
}
