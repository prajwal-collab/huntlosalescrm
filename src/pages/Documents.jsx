import { useState } from 'react';
import { FileText, Plus, Search, Eye, Download, MoreVertical, Sparkles, X, Link as LinkIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import useDataStore from '../store/useDataStore';
import { useDialog } from '../context/DialogContext';
import './Documents.css';

export default function Documents() {
  const { documents, companies, createDocument, teamMembers } = useDataStore();
  const { showAlert } = useDialog();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({ name: '', company_id: '', url: '', type: 'PDF' });

  const filtered = documents.filter(d => {
    const company = companies.find(c => c.id === d.company_id);
    return d.name.toLowerCase().includes(search.toLowerCase()) || 
           (company?.name || '').toLowerCase().includes(search.toLowerCase());
  });

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.url) return;
    setSaving(true);
    setError(null);
    try {
      await createDocument({
        name: formData.name,
        company_id: formData.company_id || null,
        url: formData.url,
        type: formData.type,
        size: '0.1 MB', // Placeholder
        views: 0
      });
      setIsAdding(false);
      setFormData({ name: '', company_id: '', url: '', type: 'PDF' });
    } catch (err) {
      setError(err.message || 'Failed to add document.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="documents-page">
      <div className="page-header-row">
        <div>
          <h1 className="page-big-title">Documents</h1>
          <p className="page-big-sub">{documents.length} files tracked</p>
        </div>
        <div className="page-header-actions">
          <div className="search-box" style={{ width: 260 }}>
            <Search size={14} />
            <input placeholder="Search documents..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => setIsAdding(true)}><Plus size={13} /> Add Document</button>
        </div>
      </div>

      <div className="documents-layout">
        <div className="doc-list-wrap">
          <div className="doc-table-head">
            <span className="th-cell" style={{ flex: 2 }}>Name</span>
            <span className="th-cell" style={{ flex: 1 }}>Company</span>
            <span className="th-cell" style={{ flex: 1 }}>Owner</span>
            <span className="th-cell" style={{ width: 80 }}>Views</span>
            <span className="th-cell" style={{ width: 120 }}>Modified</span>
            <span style={{ width: 40 }}></span>
          </div>
          <div className="doc-list">
            {filtered.map(doc => {
              const company = companies.find(c => c.id === doc.company_id);
              return (
                <div key={doc.id} className={`doc-row ${selected?.id === doc.id ? 'selected' : ''}`} onClick={() => setSelected(doc)}>
                  <div className="doc-main" style={{ flex: 2 }}>
                    <div className="doc-icon"><FileText size={16} /></div>
                    <div className="doc-info">
                      <span className="doc-name">{doc.name}</span>
                      <span className="doc-meta">{doc.type} • {doc.size}</span>
                    </div>
                  </div>
                  <div className="doc-company" style={{ flex: 1 }}>{company?.name || 'All'}</div>
                  <div className="doc-owner" style={{ flex: 1, fontSize: '13px', color: 'var(--text-secondary)' }}>
                    {teamMembers?.find(tm => tm.id === doc.owner_id)?.name || 'ME'}
                  </div>
                  <div className="doc-views" style={{ width: 80 }}>{doc.views}</div>
                  <div className="doc-date" style={{ width: 120 }}>{formatDistanceToNow(new Date(doc.created_at), { addSuffix: true })}</div>
                  <div className="doc-actions" style={{ width: 40 }}>
                    <button className="icon-btn" onClick={e => e.stopPropagation()}><MoreVertical size={14} /></button>
                  </div>
                </div>
              );
            })}
            {documents.length === 0 && (
              <div className="empty-state" style={{ marginTop: 40 }}>
                <FileText size={32} />
                <h3>No documents yet</h3>
                <p>Add your first proposal or contract.</p>
              </div>
            )}
          </div>
        </div>

        {selected && !isAdding && (
          <div className="doc-preview animate-slide-right">
            <div className="doc-preview-header">
              <div className="doc-icon lg"><FileText size={24} /></div>
              <h3 className="doc-preview-title">{selected.name}</h3>
              <p className="doc-preview-sub">Added {formatDistanceToNow(new Date(selected.created_at))} ago</p>
            </div>
            
            <div className="doc-preview-actions">
              <button className="btn btn-primary btn-sm flex-1" onClick={() => window.open(selected.url, '_blank')}><LinkIcon size={13} /> Open Link</button>
            </div>

            <div className="doc-ai-summary">
              <div className="ai-generated-label"><Sparkles size={11} /> AI Summary</div>
              <p className="text-sm text-secondary mt-2">
                This is a linked document for {(companies.find(c => c.id === selected.company_id))?.name || 'general reference'}. 
              </p>
              <button className="btn btn-ghost btn-sm mt-3 w-full" onClick={() => showAlert('AI Re-analysis', 'AI re-analysis triggered...')}>Regenerate Summary</button>
            </div>
          </div>
        )}

        {isAdding && (
          <div className="doc-preview animate-slide-right">
            <div className="doc-preview-header" style={{ marginBottom: 24 }}>
              <h2 className="panel-title">Add Document</h2>
              <button className="drawer-close" style={{ position: 'absolute', top: 24, right: 24 }} onClick={() => setIsAdding(false)}><X size={16}/></button>
            </div>
            <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {error && (
                <div style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontSize: '13px' }}>
                  {error}
                </div>
              )}
              <div className="form-group">
                <label className="label">Document Name</label>
                <input className="input-base" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Acme Corp Proposal" />
              </div>
              <div className="form-group">
                <label className="label">Related Company</label>
                <select className="input-base" value={formData.company_id} onChange={e => setFormData({...formData, company_id: e.target.value})}>
                  <option value="">General / Internal</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="label">Document Link (URL)</label>
                <input className="input-base" type="url" required value={formData.url} onChange={e => setFormData({...formData, url: e.target.value})} placeholder="https://docs.google.com/..." />
              </div>
              <div className="form-group">
                <label className="label">Type</label>
                <select className="input-base" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                  <option value="PDF">PDF</option>
                  <option value="DOCX">DOCX</option>
                  <option value="Link">Link</option>
                  <option value="Spreadsheet">Spreadsheet</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary btn-md w-full" style={{ marginTop: 8 }} disabled={saving}>
                {saving ? 'Saving...' : 'Save Document'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
