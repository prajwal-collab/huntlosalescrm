// ============================================
// HUNTLO SALES OS — CONTACTS PAGE (Rich Grid)
// ============================================
import { useState, useMemo } from 'react';
import {
  Search, Mail, Plus, ExternalLink, MessageSquare, X,
  SlidersHorizontal, Building2, Copy, Check, ChevronLeft, ChevronRight, Download,
  Phone, Users, ChevronDown, AlertCircle, Loader
} from 'lucide-react';
import useDataStore from '../store/useDataStore';
import { exportToCsv } from '../utils/exportCsv';
import CsvImporterModal from '../components/CsvImporterModal';
import EnrollSequenceModal from '../components/sequences/EnrollSequenceModal';
import BulkEditModal from '../components/BulkEditModal';
import { useDialog } from '../context/DialogContext';
import './Contacts.css';

// Reusable one-click copy button
function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  if (!text) return null;
  return (
    <button
      onClick={e => { e.stopPropagation(); navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); }); }}
      className="copy-btn" title={`Copy ${text}`}
    >
      {copied ? <Check size={11} style={{ color: '#16a34a' }} /> : <Copy size={11} />}
    </button>
  );
}

const TAG_COLORS = {
  'Decision Maker': 'badge-purple', 'Champion': 'badge-cyan',
  'Enterprise': 'badge-blue',      'High Intent': 'badge-green',
  'Warm Lead': 'badge-yellow',     'Ghosted': 'badge-red',
  'Strategic': 'badge-blue',       'Trial Active': 'badge-green',
  'Onboarding': 'badge-cyan',
};

const AVATAR_COLORS = [
  '#3b82f6','#8b5cf6','#06b6d4','#f97316',
  '#22c55e','#ec4899','#6366f1','#14b8a6','#f59e0b','#ef4444',
];

function getAvatarColor(name) {
  if (!name) return AVATAR_COLORS[0];
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

// ── Row ─────────────────────────────────────────────────────
function ContactRow({ contact, company, onSelect, selected, isSelected, toggleSelect, updateContact }) {
  const [hovered, setHovered] = useState(false);
  const avatarColor = getAvatarColor(contact.name);
  const initials = contact.name
    ? contact.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  return (
    <div
      className={`cr-row${selected ? ' selected' : ''}${hovered ? ' hovered' : ''}`}
      onClick={() => onSelect(contact)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Checkbox */}
      <div className="cr-col cr-col-check" onClick={e => { e.stopPropagation(); toggleSelect(contact.id, e); }}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => {}}
          style={{ width: 15, height: 15, cursor: 'pointer', accentColor: 'var(--accent-blue)' }}
        />
      </div>

      {/* Name + Avatar */}
      <div className="cr-col cr-col-name">
        <div className="cr-avatar" style={{ background: avatarColor }}>{initials}</div>
        <div className="cr-name-stack">
          <span className="cr-name-text">{contact.name || '—'}</span>
          <span className="cr-desig-text">{contact.designation || 'No title'}</span>
        </div>
      </div>

      {/* Company */}
      <div className="cr-col">
        <div className="cr-inline">
          <Building2 size={12} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
          <span className="cr-val">{company || '—'}</span>
        </div>
      </div>

      {/* Email */}
      <div className="cr-col">
        {contact.email ? (
          <a href={`mailto:${contact.email}`} className="cr-link" onClick={e => e.stopPropagation()}>
            <Mail size={12} />
            <span className="cr-val">{contact.email}</span>
          </a>
        ) : <span className="cr-empty">No email</span>}
      </div>

      {/* Phone */}
      <div className="cr-col">
        {contact.whatsapp || contact.phone ? (
          <div className="cr-inline">
            <Phone size={12} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
            <span className="cr-val">{contact.whatsapp || contact.phone}</span>
          </div>
        ) : <span className="cr-empty">—</span>}
      </div>

      {/* Status */}
      <div className="cr-col" onClick={e => e.stopPropagation()}>
        <select
          style={{ padding: '2px 6px', fontSize: 11, cursor: 'pointer', background: 'var(--bg-base)', border: '1px solid var(--bg-border)', borderRadius: 4, color: 'var(--text-primary)', outline: 'none' }}
          value={contact.status || 'New'}
          onChange={(e) => updateContact(contact.id, { status: e.target.value })}
        >
          <option value="New">New</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
          <option value="DNC">Do Not Contact</option>
        </select>
      </div>

      {/* Tags */}
      <div className="cr-col cr-col-tags">
        {(contact.tags || []).length > 0
          ? contact.tags.slice(0, 2).map(t => (
              <span key={t} className={`badge ${TAG_COLORS[t] || 'badge-gray'}`} style={{ fontSize: 10 }}>{t}</span>
            ))
          : <span className="cr-empty">No tags</span>
        }
      </div>

      {/* Engagement */}
      <div className="cr-col">
        <div className="cr-engagement">
          <div
            className="cr-eng-bar"
            style={{
              width: `${Math.min(contact.engagement_score || 0, 100)}%`,
              background: (contact.engagement_score || 0) >= 70 ? '#22c55e' :
                          (contact.engagement_score || 0) >= 40 ? '#f59e0b' : '#94a3b8'
            }}
          />
          <span className="cr-eng-val">{contact.engagement_score || 0}</span>
        </div>
      </div>

      {/* Actions (hover) */}
      <div className="cr-col cr-col-actions">
        <div className={`cr-actions-wrap${hovered ? ' visible' : ''}`}>
          {contact.email && (
            <a href={`mailto:${contact.email}`} className="cr-action-btn" title="Send Email" onClick={e => e.stopPropagation()}>
              <Mail size={13} />
            </a>
          )}
          {(contact.whatsapp || contact.phone) && (
            <a href={`tel:${contact.whatsapp || contact.phone}`} className="cr-action-btn" title="Call" onClick={e => e.stopPropagation()}>
              <Phone size={13} />
            </a>
          )}
          {contact.linkedin && (
            <a href={contact.linkedin.startsWith('http') ? contact.linkedin : `https://${contact.linkedin}`}
              target="_blank" rel="noopener noreferrer" className="cr-action-btn" title="LinkedIn" onClick={e => e.stopPropagation()}>
              <ExternalLink size={13} />
            </a>
          )}
          <button className="cr-action-btn" title="View Details" onClick={e => { e.stopPropagation(); onSelect(contact); }}>
            <MessageSquare size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Detail Panel ──────────────────────────────────────────────
function ContactDetail({ contact, onClose }) {
  const avatarColor = getAvatarColor(contact.name);
  const initials = contact.name
    ? contact.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  return (
    <div className="contact-detail animate-slide-right">
      <div className="cd-header">
        <div className="cd-avatar" style={{ background: avatarColor }}>{initials}</div>
        <div className="cd-header-info">
          <h2 className="cd-name">{contact.name}</h2>
          <p className="cd-title">{contact.designation || 'No title'}</p>
          {contact.company && contact.company !== 'Unknown' && (
            <p className="cd-company"><Building2 size={11} /> {contact.company}</p>
          )}
        </div>
        <button className="drawer-close" onClick={onClose}><X size={16} /></button>
      </div>

      <div className="cd-tags">
        {(contact.tags || []).map(t => (
          <span key={t} className={`badge ${TAG_COLORS[t] || 'badge-gray'}`}>{t}</span>
        ))}
      </div>

      <div className="cd-quick-actions">
        {contact.email && (
          <a href={`mailto:${contact.email}`} className="cd-quick-btn">
            <Mail size={14} /> Email
          </a>
        )}
        {(contact.whatsapp || contact.phone) && (
          <a href={`tel:${contact.whatsapp || contact.phone}`} className="cd-quick-btn">
            <Phone size={14} /> Call
          </a>
        )}
        {contact.linkedin && (
          <a href={contact.linkedin.startsWith('http') ? contact.linkedin : `https://${contact.linkedin}`}
            target="_blank" rel="noopener noreferrer" className="cd-quick-btn">
            <ExternalLink size={14} /> LinkedIn
          </a>
        )}
      </div>

      <div className="cd-section">
        <div className="cd-section-label">Contact Info</div>
        <div className="cd-field">
          <span className="cd-fl">Email</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
            <a href={`mailto:${contact.email}`} className="cd-fv link">{contact.email || '—'}</a>
            <CopyBtn text={contact.email} />
          </div>
        </div>
        <div className="cd-field">
          <span className="cd-fl">Phone</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
            <span className="cd-fv">{contact.whatsapp || contact.phone || '—'}</span>
            <CopyBtn text={contact.whatsapp || contact.phone} />
          </div>
        </div>
        <div className="cd-field">
          <span className="cd-fl">LinkedIn</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
            {contact.linkedin
              ? <a href={contact.linkedin.startsWith('http') ? contact.linkedin : `https://${contact.linkedin}`} target="_blank" rel="noopener noreferrer" className="cd-fv link">View profile</a>
              : <span className="cd-fv empty">—</span>
            }
            <CopyBtn text={contact.linkedin} />
          </div>
        </div>
      </div>

      <div className="cd-section">
        <div className="cd-section-label">Role & Engagement</div>
        <div className="cd-field"><span className="cd-fl">Role</span><span className="cd-fv">{contact.role || '—'}</span></div>
        <div className="cd-field"><span className="cd-fl">Timezone</span><span className="cd-fv">{contact.timezone || '—'}</span></div>
        <div className="cd-field">
          <span className="cd-fl">Engagement</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 60, height: 5, background: 'var(--bg-border)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.min(contact.engagement_score || 0, 100)}%`, background: 'var(--accent-blue)', borderRadius: 3 }} />
            </div>
            <span className="cd-fv">{contact.engagement_score || 0}/100</span>
          </div>
        </div>
        <div className="cd-field">
          <span className="cd-fl">Sentiment</span>
          <span className="cd-fv" style={{ textTransform: 'capitalize', color: contact.sentiment === 'positive' || contact.sentiment === 'very positive' ? 'var(--success)' : contact.sentiment === 'negative' ? 'var(--danger)' : 'var(--text-primary)' }}>
            {contact.sentiment || 'Neutral'}
          </span>
        </div>
      </div>

      {contact.notes && (
        <div className="cd-section">
          <div className="cd-section-label">Notes</div>
          <p className="cd-notes">{contact.notes}</p>
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export default function Contacts() {
  const { contacts, companies, createContact, updateContact } = useDataStore();
  const { showConfirm, showError } = useDialog();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isImporterOpen, setIsImporterOpen] = useState(false);
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', designation: '', company_id: '', linkedin: '', whatsapp: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [deleting, setDeleting] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  const handleBulkDelete = async () => {
    const confirmed = await showConfirm(
      'Delete Selected Contacts',
      `Are you sure you want to permanently delete these ${selectedIds.length} contacts? This action cannot be undone.`
    );
    if (!confirmed) return;
    setDeleting(true);
    try {
      await useDataStore.getState().bulkDeleteContacts(selectedIds);
      setSelectedIds([]);
      setSelected(null);
    } catch (err) { 
      await showError('Deletion Failed', err.message); 
    }
    finally { setDeleting(false); }
  };

  const toggleSelect = (id, e) => {
    e.stopPropagation();
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const filtered = contacts.filter(c => {
    const q = (search || '').toLowerCase();
    const comp = companies.find(co => co.id === c.company_id);
    return (
      (c.name || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.designation || '').toLowerCase().includes(q) ||
      (comp?.name || '').toLowerCase().includes(q)
    );
  });

  // Reset pagination when search changes
  useMemo(() => setCurrentPage(1), [filtered.length, itemsPerPage]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginatedContacts = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!formData.name) return;
    if (!formData.email.trim() && !formData.whatsapp.trim()) {
      setError('Please provide at least an Email or a Phone number.');
      return;
    }
    setSaving(true); setError(null);
    try {
      await createContact({ ...formData, company_id: formData.company_id || null, tags: [], engagement_score: 0, sentiment: 'neutral' });
      setIsAdding(false);
      setFormData({ name: '', email: '', designation: '', company_id: '', linkedin: '', whatsapp: '' });
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="contacts-page">
      {/* Header */}
      <div className="cg-header">
        <div className="cg-header-left">
          <h1 className="cg-title">People</h1>
          <span className="cg-count">{contacts.length} records</span>
        </div>
        <div className="cg-header-right">
          {selectedIds.length > 0 ? (
            <>
              <button className="btn btn-sm" style={{ background: 'var(--accent-blue)', color: '#fff', border: 'none' }}
                onClick={() => setIsBulkEditOpen(true)}>
                Bulk Edit
              </button>
              <button className="btn btn-sm" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)' }}
                onClick={() => setIsEnrollModalOpen(true)}>
                Enroll {selectedIds.length} in Sequence
              </button>
              <button className="btn btn-sm" style={{ background: 'var(--danger)', color: '#fff', border: 'none' }}
                onClick={handleBulkDelete} disabled={deleting}>
                {deleting ? 'Deleting…' : `Delete ${selectedIds.length}`}
              </button>
            </>
          ) : (
            <>
              <button className="btn btn-ghost btn-sm" onClick={() => exportToCsv('contacts.csv', filtered)} style={{ gap: 6, fontSize: 13 }}>
                <Download size={14} /> Export
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => setIsImporterOpen(true)}>Import</button>
              <button className="btn btn-primary btn-sm" onClick={() => setIsAdding(true)}>
                <Plus size={14} /> Add Person
              </button>
            </>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div className="cg-toolbar">
        <div className="cg-search">
          <Search size={14} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
          <input
            placeholder="Search by name, email, company…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && <X size={14} style={{ cursor: 'pointer', color: 'var(--text-tertiary)', flexShrink: 0 }} onClick={() => setSearch('')} />}
        </div>
        <button className="btn btn-ghost btn-sm" style={{ gap: 5, fontSize: 12 }}>
          <SlidersHorizontal size={13} /> Filter
        </button>
        <button className="btn btn-ghost btn-sm" style={{ gap: 5, fontSize: 12 }}>
          <ChevronDown size={13} /> Sort
        </button>
      </div>

      {/* Layout */}
      <div className="contacts-layout">
        <div className="contacts-table-wrap">
          {/* Table Head */}
          <div className="cg-table-head">
            <div className="cr-col cr-col-check">
              <input type="checkbox"
                checked={selectedIds.length === filtered.length && filtered.length > 0}
                onChange={() => selectedIds.length === filtered.length ? setSelectedIds([]) : setSelectedIds(filtered.map(c => c.id))}
                style={{ width: 15, height: 15, accentColor: 'var(--accent-blue)' }}
              />
            </div>
            <div className="cr-col cr-col-name">Name</div>
            <div className="cr-col">Company</div>
            <div className="cr-col">Email</div>
            <div className="cr-col">Phone</div>
            <div className="cr-col">Status</div>
            <div className="cr-col cr-col-tags">Tags</div>
            <div className="cr-col">Engagement</div>
            <div className="cr-col cr-col-actions">Actions</div>
          </div>

          <div className="contacts-list">
            {paginatedContacts.map(c => {
              const comp = companies.find(co => co.id === c.company_id);
              return (
                <ContactRow
                  key={c.id}
                  contact={c}
                  company={comp?.name}
                  selected={selected?.id === c.id}
                  isSelected={selectedIds.includes(c.id)}
                  toggleSelect={toggleSelect}
                  onSelect={co => setSelected(co.id === selected?.id ? null : co)}
                  updateContact={updateContact}
                />
              );
            })}
            {contacts.length === 0 && (
              <div className="empty-state" style={{ marginTop: 60 }}>
                <Users size={32} />
                <h3>No contacts yet</h3>
                <p>Import a CSV or add your first contact.</p>
                <button className="btn btn-primary btn-sm" onClick={() => setIsAdding(true)}><Plus size={13} /> Add Person</button>
              </div>
            )}
            {contacts.length > 0 && filtered.length === 0 && (
              <div className="empty-state" style={{ marginTop: 60 }}>
                <Search size={28} />
                <h3>No results for "{search}"</h3>
              </div>
            )}
          </div>
          
          {/* Pagination Bar */}
          {filtered.length > 0 && (
            <div className="pagination-bar">
              <div className="pagination-left">
                Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filtered.length)} to {Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length} contacts
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

        {/* Right Panel */}
        {selected && !isAdding && (
          <ContactDetail
            contact={{ ...selected, company: companies.find(c => c.id === selected.company_id)?.name }}
            onClose={() => setSelected(null)}
          />
        )}

        {isAdding && (
          <div className="contact-detail animate-slide-right">
            <div className="cd-header" style={{ marginBottom: 12 }}>
              <div>
                <h2 className="cd-name">Add Contact</h2>
                <p className="cd-title" style={{ marginTop: 4 }}>Create a new person record.</p>
              </div>
              <button className="drawer-close" onClick={() => { setIsAdding(false); setFormData({ name: '', email: '', designation: '', whatsapp: '', linkedin: '', company_id: '' }); }}><X size={16} /></button>
            </div>
            <form onSubmit={handleAdd} className="cd-form">
              {error && (
                <div className="cd-form-error">
                  <AlertCircle size={14} /> {error}
                </div>
              )}
              <div className="cd-form-body">
                {[
                  { label: 'Full Name *', key: 'name', type: 'text', required: true, placeholder: 'e.g. Jane Doe' },
                  { label: 'Email (Required if no phone)', key: 'email', type: 'email', placeholder: 'jane@example.com' },
                  { label: 'Job Title', key: 'designation', type: 'text', placeholder: 'e.g. VP of Sales' },
                  { label: 'Phone / WhatsApp (Required if no email)', key: 'whatsapp', type: 'text', placeholder: '+1 (555) 000-0000' },
                  { label: 'LinkedIn URL', key: 'linkedin', type: 'text', placeholder: 'https://linkedin.com/in/...' },
                ].map(({ label, key, type, required, placeholder }) => (
                  <div key={key} className="cd-form-group">
                    <label className="cd-form-label">{label}</label>
                    <input
                      className="cd-form-input"
                      type={type}
                      required={required}
                      placeholder={placeholder}
                      value={formData[key]}
                      onChange={e => setFormData({ ...formData, [key]: e.target.value })}
                      autoFocus={key === 'name'}
                    />
                  </div>
                ))}
                <div className="cd-form-group">
                  <label className="cd-form-label">Company</label>
                  <select className="cd-form-input" value={formData.company_id} onChange={e => setFormData({ ...formData, company_id: e.target.value })}>
                    <option value="">Select Company…</option>
                    {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="cd-form-footer">
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setIsAdding(false); setFormData({ name: '', email: '', designation: '', whatsapp: '', linkedin: '', company_id: '' }); }}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                  {saving ? <Loader size={14} className="cc-spinner" /> : 'Save Contact'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      <CsvImporterModal isOpen={isImporterOpen} onClose={() => setIsImporterOpen(false)} type="contacts" />
      
      {isEnrollModalOpen && (
        <EnrollSequenceModal
          leads={filtered.filter(c => selectedIds.includes(c.id))}
          onClose={() => {
            setIsEnrollModalOpen(false);
            setSelectedIds([]);
          }}
        />
      )}

      <BulkEditModal
        isOpen={isBulkEditOpen}
        onClose={() => setIsBulkEditOpen(false)}
        entityType="contacts"
        selectedIds={selectedIds}
        onClearSelection={() => setSelectedIds([])}
      />
    </div>
  );
}
