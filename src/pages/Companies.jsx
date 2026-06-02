// ============================================
// HUNTLO SALES OS — COMPANIES PAGE (Rich Grid)
// ============================================
import { useState } from 'react';
import {
  Search, ExternalLink, Building2, Users,
  Plus, X, AlertCircle, Loader, Globe,
  SlidersHorizontal, ChevronDown, BarChart2, Copy, Check
} from 'lucide-react';
import useDataStore from '../store/useDataStore';
import CsvImporterModal from '../components/CsvImporterModal';
import './Companies.css';

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  if (!text) return null;
  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };
  return (
    <button onClick={handleCopy} className="copy-btn" title={`Copy ${text}`}>
      {copied ? <Check size={11} style={{ color: '#16a34a' }} /> : <Copy size={11} />}
    </button>
  );
}

const TAG_COLORS = {
  'Enterprise': 'badge-blue', 'High Intent': 'badge-green',
  'Decision Maker': 'badge-purple', 'Champion': 'badge-cyan',
  'Warm Lead': 'badge-yellow', 'Strategic': 'badge-blue',
  'Trial Active': 'badge-green', 'Onboarding': 'badge-cyan',
};

const LOGO_COLORS = [
  '#3b82f6','#8b5cf6','#06b6d4','#f97316',
  '#22c55e','#ec4899','#6366f1','#14b8a6','#f59e0b',
];

function getLogoColor(name) {
  return LOGO_COLORS[(name?.charCodeAt(0) || 0) % LOGO_COLORS.length];
}

// ── Company Row ──────────────────────────────────────────────
function CompanyRow({ company, contacts, onSelect, selected, isSelected, toggleSelect }) {
  const [hovered, setHovered] = useState(false);
  const logoColor = company.logoColor || getLogoColor(company.name);
  const initial = (company.name || '?').charAt(0).toUpperCase();
  const contactCount = contacts.filter(c => c.company_id === company.id).length;
  const engScore = company.engagement_score || 0;
  const arr = company.arr_estimate || 0;

  return (
    <div
      className={`co-row${selected ? ' selected' : ''}${hovered ? ' hovered' : ''}`}
      onClick={() => onSelect(company)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Checkbox */}
      <div className="co-col co-col-check" onClick={e => { e.stopPropagation(); toggleSelect(company.id, e); }}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => {}}
          style={{ width: 15, height: 15, cursor: 'pointer', accentColor: 'var(--accent-blue)' }}
        />
      </div>

      {/* Logo + Name + Website */}
      <div className="co-col co-col-name">
        <div className="co-logo" style={{ background: logoColor + '20', color: logoColor }}>
          {company.logo || initial}
        </div>
        <div className="co-name-stack">
          <span className="co-name-text">{company.name}</span>
          {company.website && (
            <a
              href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
              target="_blank" rel="noopener noreferrer"
              className="co-website"
              onClick={e => e.stopPropagation()}
            >
              <Globe size={10} /> {company.website.replace(/^https?:\/\//, '').split('/')[0]}
            </a>
          )}
        </div>
      </div>

      {/* Industry */}
      <div className="co-col">
        <span className="co-val">{company.industry || <span className="co-empty">—</span>}</span>
      </div>

      {/* Size */}
      <div className="co-col">
        {company.size ? (
          <span className="badge badge-gray">{company.size}</span>
        ) : <span className="co-empty">—</span>}
      </div>

      {/* Contacts */}
      <div className="co-col">
        <div className="co-inline">
          <Users size={12} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
          <span className="co-val">{contactCount} {contactCount === 1 ? 'contact' : 'contacts'}</span>
        </div>
      </div>

      {/* ARR */}
      <div className="co-col">
        {arr > 0 ? (
          <span style={{ fontSize: 13, fontWeight: 700, color: '#16a34a' }}>
            ${(arr / 1000).toFixed(0)}k
          </span>
        ) : <span className="co-empty">—</span>}
      </div>

      {/* Engagement */}
      <div className="co-col">
        <div className="co-engagement">
          <div className="co-eng-bar">
            <div
              className="co-eng-fill"
              style={{
                width: `${Math.min(engScore, 100)}%`,
                background: engScore >= 70 ? '#22c55e' : engScore >= 40 ? '#f59e0b' : '#94a3b8'
              }}
            />
          </div>
          <span className="co-eng-val">{engScore}</span>
        </div>
      </div>

      {/* Tags */}
      <div className="co-col co-col-tags">
        {(company.tags || []).length > 0
          ? company.tags.slice(0, 2).map(t => (
              <span key={t} className={`badge ${TAG_COLORS[t] || 'badge-gray'}`} style={{ fontSize: 10 }}>{t}</span>
            ))
          : <span className="co-empty">No tags</span>
        }
      </div>

      {/* Hover Actions */}
      <div className="co-col co-col-actions">
        <div className={`co-actions-wrap${hovered ? ' visible' : ''}`}>
          {company.website && (
            <a
              href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
              target="_blank" rel="noopener noreferrer"
              className="co-action-btn" title="Visit Website"
              onClick={e => e.stopPropagation()}
            >
              <Globe size={13} />
            </a>
          )}
          {company.linkedin && (
            <a
              href={company.linkedin.startsWith('http') ? company.linkedin : `https://${company.linkedin}`}
              target="_blank" rel="noopener noreferrer"
              className="co-action-btn" title="LinkedIn"
              onClick={e => e.stopPropagation()}
            >
              <ExternalLink size={13} />
            </a>
          )}
          <button className="co-action-btn" title="View Details" onClick={e => { e.stopPropagation(); onSelect(company); }}>
            <BarChart2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Company Panel ──────────────────────────────────────────────
function CompanyPanel({ company, contacts, onClose }) {
  const logoColor = company.logoColor || getLogoColor(company.name);
  const initial = (company.name || '?').charAt(0).toUpperCase();
  const contactsForCompany = contacts.filter(c => c.company_id === company.id);

  return (
    <div className="company-panel animate-slide-right">
      {/* Header */}
      <div className="cp-header">
        <div className="co-logo lg" style={{ background: logoColor + '20', color: logoColor, width: 44, height: 44, borderRadius: 10, fontSize: 18 }}>
          {company.logo || initial}
        </div>
        <div className="cp-header-info">
          <h2 className="cp-name">{company.name}</h2>
          <p className="cp-sub">
            {[company.industry, company.size].filter(Boolean).join(' · ')}
          </p>
          {company.website && (
            <a
              href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
              target="_blank" rel="noopener noreferrer"
              className="cp-website"
            >
              <Globe size={11} /> {company.website.replace(/^https?:\/\//, '').split('/')[0]}
            </a>
          )}
        </div>
        <button className="drawer-close" onClick={onClose}><X size={16} /></button>
      </div>

      {/* Tags */}
      {(company.tags || []).length > 0 && (
        <div className="cp-tags">
          {company.tags.map(t => <span key={t} className={`badge ${TAG_COLORS[t] || 'badge-gray'}`}>{t}</span>)}
        </div>
      )}

      {/* Stats */}
      <div className="cp-stats">
        <div className="cp-stat">
          <span className="cp-stat-label">ARR Estimate</span>
          <span className="cp-stat-val" style={{ color: '#16a34a' }}>
            ${((company.arr_estimate || 0) / 1000).toFixed(0)}k
          </span>
        </div>
        <div className="cp-stat">
          <span className="cp-stat-label">Engagement</span>
          <span className="cp-stat-val">{company.engagement_score || 0}</span>
        </div>
        <div className="cp-stat">
          <span className="cp-stat-label">Contacts</span>
          <span className="cp-stat-val">{contactsForCompany.length}</span>
        </div>
        <div className="cp-stat">
          <span className="cp-stat-label">Size</span>
          <span className="cp-stat-val">{company.size || '—'}</span>
        </div>
      </div>

      {/* Contacts list */}
      {contactsForCompany.length > 0 && (
        <div className="cp-section">
          <div className="cp-section-label">People ({contactsForCompany.length})</div>
          {contactsForCompany.map(c => (
            <div key={c.id} className="cp-contact-row">
              <div className="cp-contact-avatar" style={{ background: getLogoColor(c.name) }}>
                {(c.name || '?').charAt(0).toUpperCase()}
              </div>
              <div className="cp-contact-info">
                <span className="cp-contact-name">{c.name}</span>
                <span className="cp-contact-title">{c.designation || 'No title'}</span>
                {c.email && (
                  <span className="cp-contact-email">
                    {c.email} <CopyBtn text={c.email} />
                  </span>
                )}
              </div>
              {c.email && <a href={`mailto:${c.email}`} className="co-action-btn" onClick={e => e.stopPropagation()}><ExternalLink size={12} /></a>}
            </div>
          ))}
        </div>
      )}

      {/* Links */}
      <div className="cp-section">
        <div className="cp-section-label">Links</div>
        {company.website && (
          <a href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
            target="_blank" rel="noopener noreferrer" className="cp-link">
            <Globe size={13} /> {company.website}
          </a>
        )}
        {company.linkedin && (
          <a href={company.linkedin.startsWith('http') ? company.linkedin : `https://${company.linkedin}`}
            target="_blank" rel="noopener noreferrer" className="cp-link">
            <ExternalLink size={13} /> LinkedIn Page
          </a>
        )}
        {!company.website && !company.linkedin && <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>No links added</span>}
      </div>

      {/* Notes */}
      {company.notes && (
        <div className="cp-section">
          <div className="cp-section-label">Notes</div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{company.notes}</p>
        </div>
      )}

    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────
export default function Companies() {
  const { companies, contacts, createCompany } = useDataStore();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isImporterOpen, setIsImporterOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', industry: '', size: '', website: '', linkedin: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [deleting, setDeleting] = useState(false);

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedIds.length} companies?`)) return;
    setDeleting(true);
    try {
      await useDataStore.getState().bulkDeleteCompanies(selectedIds);
      setSelectedIds([]);
      setSelected(null);
    } catch (err) { alert('Failed: ' + err.message); }
    finally { setDeleting(false); }
  };

  const toggleSelect = (id, e) => {
    e.stopPropagation();
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const filtered = companies.filter(c => {
    const q = (search || '').toLowerCase();
    return (c.name || '').toLowerCase().includes(q) || (c.industry || '').toLowerCase().includes(q);
  });

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!formData.name) return;
    setSaving(true); setError(null);
    try {
      await createCompany({ ...formData, tags: [], arr_estimate: 0, engagement_score: 0 });
      setIsAdding(false);
      setFormData({ name: '', industry: '', size: '', website: '', linkedin: '' });
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="companies-page">
      {/* Header */}
      <div className="cg-header">
        <div className="cg-header-left">
          <h1 className="cg-title">Companies</h1>
          <span className="cg-count">{companies.length} records</span>
        </div>
        <div className="cg-header-right">
          {selectedIds.length > 0 ? (
            <button className="btn btn-sm" style={{ background: 'var(--danger)', color: '#fff', border: 'none' }}
              onClick={handleBulkDelete} disabled={deleting}>
              {deleting ? 'Deleting…' : `Delete ${selectedIds.length}`}
            </button>
          ) : (
            <>
              <button className="btn btn-ghost btn-sm" onClick={() => setIsImporterOpen(true)}>Import</button>
              <button className="btn btn-primary btn-sm" onClick={() => setIsAdding(true)}>
                <Plus size={14} /> Add Company
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
            placeholder="Search companies by name, industry…"
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
      <div className="companies-layout">
        <div className="companies-table-wrap">
          {/* Table Head */}
          <div className="co-table-head">
            <div className="co-col co-col-check">
              <input type="checkbox"
                checked={selectedIds.length === filtered.length && filtered.length > 0}
                onChange={() => selectedIds.length === filtered.length ? setSelectedIds([]) : setSelectedIds(filtered.map(c => c.id))}
                style={{ width: 15, height: 15, accentColor: 'var(--accent-blue)' }}
              />
            </div>
            <div className="co-col co-col-name">Company</div>
            <div className="co-col">Industry</div>
            <div className="co-col">Size</div>
            <div className="co-col">Contacts</div>
            <div className="co-col">ARR</div>
            <div className="co-col">Engagement</div>
            <div className="co-col co-col-tags">Tags</div>
            <div className="co-col co-col-actions">Actions</div>
          </div>

          {/* Rows */}
          <div className="companies-list">
            {filtered.map(c => (
              <CompanyRow
                key={c.id}
                company={c}
                contacts={contacts}
                selected={selected?.id === c.id}
                isSelected={selectedIds.includes(c.id)}
                toggleSelect={toggleSelect}
                onSelect={co => setSelected(co.id === selected?.id ? null : co)}
              />
            ))}
            {companies.length === 0 && (
              <div className="empty-state" style={{ marginTop: 60 }}>
                <Building2 size={32} />
                <h3>No companies yet</h3>
                <p>Import a CSV or add your first account.</p>
                <button className="btn btn-primary btn-sm" onClick={() => setIsAdding(true)}><Plus size={13} /> Add Company</button>
              </div>
            )}
            {companies.length > 0 && filtered.length === 0 && (
              <div className="empty-state" style={{ marginTop: 60 }}>
                <Search size={28} />
                <h3>No results for "{search}"</h3>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel */}
        {selected && !isAdding && (
          <CompanyPanel company={selected} contacts={contacts} onClose={() => setSelected(null)} />
        )}

        {isAdding && (
          <div className="company-panel animate-slide-right">
            <div className="cp-header" style={{ marginBottom: 20 }}>
              <h2 className="cp-name">Add Company</h2>
              <button className="drawer-close" onClick={() => setIsAdding(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {error && (
                <div style={{ padding: 12, borderRadius: 8, background: 'rgba(239,68,68,0.08)', color: 'var(--danger)', fontSize: 13, display: 'flex', gap: 8 }}>
                  <AlertCircle size={14} /> {error}
                </div>
              )}
              {[
                { label: 'Company Name *', key: 'name', type: 'text', required: true },
                { label: 'Industry', key: 'industry', type: 'text' },
                { label: 'Website', key: 'website', type: 'text', placeholder: 'https://...' },
                { label: 'LinkedIn URL', key: 'linkedin', type: 'text' },
              ].map(({ label, key, type, required, placeholder }) => (
                <div key={key} className="form-group">
                  <label className="form-label">{label}</label>
                  <input className="form-input" type={type} required={required} placeholder={placeholder}
                    value={formData[key]} onChange={e => setFormData({ ...formData, [key]: e.target.value })}
                    autoFocus={key === 'name'} />
                </div>
              ))}
              <div className="form-group">
                <label className="form-label">Company Size</label>
                <select className="form-input" value={formData.size} onChange={e => setFormData({ ...formData, size: e.target.value })}>
                  <option value="">Select size…</option>
                  {['1-10','11-50','51-200','201-1000','1000+'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <button type="submit" className="btn btn-primary btn-md w-full" style={{ marginTop: 4 }} disabled={saving}>
                {saving ? <Loader size={14} className="cc-spinner" /> : 'Save Company'}
              </button>
            </form>
          </div>
        )}
      </div>

      <CsvImporterModal isOpen={isImporterOpen} onClose={() => setIsImporterOpen(false)} type="companies" />
    </div>
  );
}
