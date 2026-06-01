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
          <div className="avatar avatar-md" style={{ background: contact.color || '#3b82f6', color: '#fff', flexShrink: 0 }}>
            {contact.name ? contact.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : 'CO'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <span className="cr-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{contact.name}</span>
            <span className="cr-title" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{contact.designation || 'No title'}</span>
          </div>
        </div>
      </div>
      
      <div className="cr-cell cr-company" style={{ width: 180, paddingRight: 16 }}>
        {contact.company || '--'}
      </div>
      
      <div className="cr-cell" style={{ width: 140, paddingRight: 16 }}>
        <div className="cr-contact-info">
          <a href={`mailto:${contact.email}`} className="cr-contact-icon" title={contact.email} onClick={e => e.stopPropagation()}>
            <Mail size={13} />
          </a>
          {contact.linkedin && (
            <a href={`https://${contact.linkedin}`} target="_blank" rel="noopener noreferrer" className="cr-contact-icon" title="LinkedIn" onClick={e => e.stopPropagation()}>
              <ExternalLink size={13} />
            </a>
          )}
        </div>
      </div>
      
      <div className="cr-cell" style={{ width: 160, paddingRight: 16 }}>
        <div className="cr-tags">
          {(contact.tags || []).slice(0, 2).map(t => (
            <span key={t} className={`badge ${TAG_COLORS[t] || 'badge-gray'}`}>{t}</span>
          ))}
          {(!contact.tags || contact.tags.length === 0) && <span style={{ color: 'var(--text-tertiary)' }}>--</span>}
        </div>
      </div>
      
      <div className="cr-cell" style={{ width: 120 }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span className="cr-score" style={{ color: (contact.engagement_score || 0) >= 75 ? 'var(--success)' : 'var(--warning)' }}>
            {contact.engagement_score || 0} Score
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
            {contact.last_activity || contact.created_at ? formatDistanceToNow(new Date(contact.last_activity || contact.created_at), { addSuffix: true }) : 'Just now'}
          </span>
        </div>
      </div>

      <div className="cr-actions" style={{ marginLeft: 'auto' }}>
        <button className="btn btn-ghost btn-sm" onClick={e => { e.stopPropagation(); alert('Action triggered'); }}>Action</button>
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
      <div className="page-header-row">
        <div>
          <h1 className="page-big-title">Contacts</h1>
          <p className="page-big-sub">{contacts.length} relationships tracked</p>
        </div>
        <div className="page-header-actions">
          {selectedIds.length > 0 ? (
            <button className="btn btn-primary btn-sm" style={{ backgroundColor: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={handleBulkDelete} disabled={deleting}>
              {deleting ? 'Deleting...' : `Delete ${selectedIds.length} Selected`}
            </button>
          ) : (
            <>
              <div className="search-box" style={{ width: 240 }}>
                <Search size={14} />
                <input placeholder="Search contacts..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <select className="input-base" style={{ width: 180 }} value={filterRole} onChange={e => setFilterRole(e.target.value)}>
                <option value="all">All Roles</option>
                <option value="Decision Maker">Decision Maker</option>
                <option value="Champion">Champion</option>
                <option value="Technical Evaluator">Technical Evaluator</option>
                <option value="Influencer">Influencer</option>
              </select>
              <button className="btn btn-ghost btn-sm" onClick={() => {
                const csvContent = "Name,Email,Company,Designation,Phone,LinkedIn\nJohn Doe,john.doe@example.com,Acme Corp,CEO,555-0100,linkedin.com/in/johndoe";
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', 'contacts_template.csv');
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}>
                <Download size={13} /> Template
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => setIsImporterOpen(true)}>
                <Upload size={13} /> Import CSV
              </button>
              <button className="btn btn-primary btn-sm" onClick={() => setIsAdding(true)}>
                <Plus size={13} /> Add Contact
              </button>
            </>
          )}
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
            <span style={{ width: 280 }}>Name & Title</span>
            <span style={{ width: 180 }}>Company</span>
            <span style={{ width: 140 }}>Contact</span>
            <span style={{ width: 160 }}>Tags</span>
            <span style={{ width: 120 }}>Activity</span>
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
