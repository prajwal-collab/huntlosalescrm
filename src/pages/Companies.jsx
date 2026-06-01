// ============================================
// HUNTLO SALES OS — COMPANIES PAGE
// ============================================
import { useState, useRef } from 'react';
import { Search, ExternalLink, Building2, Users, TrendingUp, Sparkles, ChevronRight, Plus, X, Upload, Download, AlertCircle, Loader } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { generateCompanyInsight } from '../lib/gemini';
import useDataStore from '../store/useDataStore';
import './Companies.css';

const TAG_COLORS = {
  'Enterprise': 'badge-blue', 'High Intent': 'badge-green', 'Decision Maker': 'badge-purple',
  'Champion': 'badge-cyan', 'Warm Lead': 'badge-yellow', 'Strategic': 'badge-blue',
  'Trial Active': 'badge-green', 'Onboarding': 'badge-cyan',
};

function CompanyRow({ company, onSelect, selected }) {
  return (
    <div className={`company-row ${selected ? 'selected' : ''}`} onClick={() => onSelect(company)}>
      <div className="co-logo" style={{ background: company.logoColor + '22', color: company.logoColor }}>
        {company.logo}
      </div>
      <div className="co-main">
        <span className="co-name">{company.name}</span>
        <span className="co-industry">{company.industry}</span>
      </div>
      <div className="co-meta">
        <span className="co-size"><Users size={11} /> {company.size}</span>
      </div>
      <div className="co-arr">${(company.arrEstimate / 1000).toFixed(0)}k</div>
      <div className="co-score">
        <div className="score-pill" style={{ '--s': (company.engagement_score || 0) + '%', color: (company.engagement_score || 0) >= 75 ? 'var(--success)' : 'var(--warning)' }}>
          {company.engagement_score || 0}
        </div>
      </div>
      <div className="co-tags">
        {(company.tags || []).slice(0, 2).map(tag => (
          <span key={tag} className={`badge ${TAG_COLORS[tag] || 'badge-gray'}`}>{tag}</span>
        ))}
      </div>
      <div className="co-activity">
        {company.last_activity || company.created_at ? formatDistanceToNow(new Date(company.last_activity || company.created_at), { addSuffix: true }) : 'Just now'}
      </div>
      <ChevronRight size={14} className="co-chevron" />
    </div>
  );
}

function CompanyPanel({ company, onClose }) {
  const [insight, setInsight] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInsight = async () => {
    setLoading(true);
    try {
      const res = await generateCompanyInsight(company.name, company.industry, company.engagementScore, company.activeDeals > 0 ? 'Active Deal' : 'No Deal');
      setInsight(res);
    } finally { setLoading(false); }
  };

  return (
    <div className="company-panel animate-slide-right">
      <div className="panel-header">
        <div className="co-logo lg" style={{ background: company.logoColor + '22', color: company.logoColor }}>
          {company.logo}
        </div>
        <div>
          <h2 className="panel-title">{company.name}</h2>
          <p className="panel-sub">{company.industry} · {company.size}</p>
        </div>
        <button className="drawer-close" onClick={onClose}>✕</button>
      </div>

      <div className="panel-tags">
        {(company.tags || []).map(tag => (
          <span key={tag} className={`badge ${TAG_COLORS[tag] || 'badge-gray'}`}>{tag}</span>
        ))}
      </div>

      <div className="panel-stats">
        <div className="ov-stat"><span className="ov-stat-label">ARR Estimate</span><span className="ov-stat-val">${((company.arr_estimate || 0) / 1000).toFixed(0)}k</span></div>
        <div className="ov-stat"><span className="ov-stat-label">Engagement</span><span className="ov-stat-val" style={{ color: 'var(--success)' }}>{company.engagement_score || 0}</span></div>
        <div className="ov-stat"><span className="ov-stat-label">Active Deals</span><span className="ov-stat-val">{company.activeDeals || 0}</span></div>
        <div className="ov-stat"><span className="ov-stat-label">Contacts</span><span className="ov-stat-val">{company.contacts || 0}</span></div>
      </div>

      <div className="panel-links">
        <a href={`https://${company.website}`} target="_blank" rel="noopener noreferrer" className="panel-link">
          <ExternalLink size={13} /> {company.website}
        </a>
        <a href={`https://${company.linkedin}`} target="_blank" rel="noopener noreferrer" className="panel-link">
          <ExternalLink size={13} /> LinkedIn
        </a>
      </div>

      {company.notes && (
        <div className="ov-notes">
          <p className="ov-notes-label">Notes</p>
          <p className="ov-notes-text">{company.notes}</p>
        </div>
      )}

      <div className="panel-section-label">Hiring Activity</div>
      <div className="panel-hiring">{company.hiringActivity}</div>

      <button className="btn btn-primary btn-md w-full" onClick={handleInsight} disabled={loading}>
        <Sparkles size={13} /> {loading ? 'Analyzing...' : 'Generate AI Insight'}
      </button>

      {insight && (
        <div className="ai-generated-box">
          <div className="ai-generated-label"><Sparkles size={11} /> AI Insight</div>
          <pre className="ai-generated-text">{insight}</pre>
        </div>
      )}
    </div>
  );
}

import CsvImporterModal from '../components/CsvImporterModal';

export default function Companies() {
  const { companies, createCompany, bulkCreateCompanies } = useDataStore();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isImporterOpen, setIsImporterOpen] = useState(false);
  
  // New company form state
  const [formData, setFormData] = useState({ name: '', industry: '', size: '', website: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const filtered = companies.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.industry && c.industry.toLowerCase().includes(search.toLowerCase()))
  );

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!formData.name) return;
    setSaving(true);
    setError(null);
    try {
      await createCompany({
        name: formData.name,
        industry: formData.industry,
        size: formData.size,
        website: formData.website,
        tags: [],
        arr_estimate: 0,
        engagement_score: 0
      });
      setIsAdding(false);
      setFormData({ name: '', industry: '', size: '', website: '' });
    } catch (error) {
      console.error(error);
      setError(error.message || 'Failed to create company');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="companies-page">
      {/* Header */}
      <div className="page-header-row">
        <div>
          <h1 className="page-big-title">Companies</h1>
          <p className="page-big-sub">{companies.length} accounts tracked</p>
        </div>
        <div className="page-header-actions">
          <div className="search-box" style={{ width: 240 }}>
            <Search size={14} />
            <input placeholder="Search companies..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => {
            const csvContent = "Name,Domain,Industry,Employees,Revenue\nAcme Corp,acme.com,Manufacturing,51-200,5000000";
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'companies_template.csv');
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
            <Plus size={13} /> Add Company
          </button>
        </div>
      </div>

      <div className="companies-layout">
        <div className="companies-table-wrap">
          <div className="companies-table-head">
            <span style={{ width: 32 }} />
            <span className="th-cell" style={{ flex: 1 }}>Company</span>
            <span className="th-cell" style={{ width: 120 }}>Size</span>
            <span className="th-cell" style={{ width: 80 }}>ARR Est.</span>
            <span className="th-cell" style={{ width: 70 }}>Score</span>
            <span className="th-cell" style={{ width: 180 }}>Tags</span>
            <span className="th-cell" style={{ width: 120 }}>Last Activity</span>
            <span style={{ width: 20 }} />
          </div>

          <div className="companies-list">
            {filtered.map(c => (
              <CompanyRow key={c.id} company={c} selected={selected?.id === c.id} onSelect={co => setSelected(co.id === selected?.id ? null : co)} />
            ))}
            {companies.length === 0 && (
               <div className="empty-state" style={{ marginTop: 40 }}>
                 <Building2 size={32} />
                 <h3>No companies yet</h3>
                 <p>Add your first target account to start tracking.</p>
               </div>
            )}
          </div>
        </div>

        {selected && !isAdding && (
          <CompanyPanel company={selected} onClose={() => setSelected(null)} />
        )}

        {isAdding && (
          <div className="company-panel animate-slide-right">
            <div className="panel-header" style={{ marginBottom: 24 }}>
              <h2 className="panel-title">Add Company</h2>
              <button className="drawer-close" onClick={() => setIsAdding(false)}><X size={16}/></button>
            </div>
            <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {error && (
                <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertCircle size={14} /> {error}
                </div>
              )}
              <div className="form-group">
                <label className="label">Company Name</label>
                <input className="input-base" autoFocus required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="label">Industry</label>
                <input className="input-base" value={formData.industry} onChange={e => setFormData({...formData, industry: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="label">Company Size</label>
                <select className="input-base" value={formData.size} onChange={e => setFormData({...formData, size: e.target.value})}>
                  <option value="">Select size</option>
                  <option value="1-10">1-10</option>
                  <option value="11-50">11-50</option>
                  <option value="51-200">51-200</option>
                  <option value="201-1000">201-1000</option>
                  <option value="1000+">1000+</option>
                </select>
              </div>
              <div className="form-group">
                <label className="label">Website</label>
                <input className="input-base" type="url" placeholder="https://" value={formData.website} onChange={e => setFormData({...formData, website: e.target.value})} />
              </div>
              <button type="submit" className="btn btn-primary btn-md w-full" style={{ marginTop: 8 }} disabled={saving}>
                {saving ? <Loader size={14} className="cc-spinner" /> : 'Save Company'}
              </button>
            </form>
          </div>
        )}
      </div>

      <CsvImporterModal 
        isOpen={isImporterOpen} 
        onClose={() => setIsImporterOpen(false)} 
        type="companies" 
      />
    </div>
  );
}
