import { useState, useRef, useEffect } from 'react';
import { X, AlertCircle, Loader, Search, ChevronDown } from 'lucide-react';
import useDataStore from '../../store/useDataStore';
import './DealDrawer.css';

export default function NewDealDrawer({ onClose }) {
  const { companies, createDeal } = useDataStore();
  const [formData, setFormData] = useState({ title: '', company_id: '', plan: '', arr: '', urgency: 'medium' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [companySearch, setCompanySearch] = useState('');
  const [companyDropdownOpen, setCompanyDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setCompanyDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredCompanies = companies.filter(c => c.name.toLowerCase().includes(companySearch.toLowerCase()));
  const selectedCompany = companies.find(c => c.id === formData.company_id);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.company_id) return;
    setSaving(true);
    setError(null);
    try {
      await createDeal({
        title: formData.title,
        company_id: formData.company_id,
        arr: Number(formData.arr),
        stage: 'Discovery',
        urgency: formData.urgency,
        engagement_score: 0
      });
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to add deal');
    } finally {
      setSaving(false);
    }
  };

  const handlePlanChange = (e) => {
    const plan = e.target.value;
    let arr = formData.arr;
    if (plan === 'trial') arr = 0;
    else if (plan === 'starter') arr = 99;
    else if (plan === 'enterprise') arr = '';
    
    setFormData({ ...formData, plan, arr });
  };

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="deal-drawer animate-slide-right" onClick={e => e.stopPropagation()}>
        <div className="drawer-header" style={{ padding: 24 }}>
          <h2 className="panel-title">Add Deal</h2>
          <button type="button" className="drawer-close" onClick={onClose} style={{ marginLeft: 'auto' }}>
            <X size={16}/>
          </button>
        </div>
        <form onSubmit={handleAdd} className="drawer-body" style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '24px' }}>
          {error && (
            <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={14} /> {error}
            </div>
          )}
          <div className="form-group">
            <label className="label">Deal Title</label>
            <input className="input-base" autoFocus required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. Enterprise Q3 Expansion" />
          </div>
          <div className="form-group" ref={dropdownRef}>
            <label className="label">Company</label>
            <div className="relative">
              <div 
                className="input-base" 
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', minHeight: 38 }}
                onClick={() => setCompanyDropdownOpen(!companyDropdownOpen)}
              >
                <span style={{ color: selectedCompany ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
                  {selectedCompany ? selectedCompany.name : 'Select Company'}
                </span>
                <ChevronDown size={14} style={{ color: 'var(--text-tertiary)' }} />
              </div>
              
              {companyDropdownOpen && (
                <div 
                  className="dropdown-menu animate-slide-down" 
                  style={{ 
                    position: 'absolute', top: '100%', left: 0, right: 0, 
                    marginTop: 4, maxHeight: 240, overflowY: 'auto', zIndex: 100,
                    padding: 8, display: 'flex', flexDirection: 'column', gap: 4
                  }}
                >
                  <div className="search-box" style={{ marginBottom: 4, padding: '6px 10px' }}>
                    <Search size={14} style={{ color: 'var(--text-tertiary)' }} />
                    <input 
                      autoFocus
                      placeholder="Search companies..." 
                      value={companySearch} 
                      onChange={e => setCompanySearch(e.target.value)} 
                      style={{ fontSize: 13 }}
                    />
                  </div>
                  {filteredCompanies.length > 0 ? filteredCompanies.map(c => (
                    <div 
                      key={c.id} 
                      className="dropdown-item" 
                      onClick={() => {
                        setFormData({ ...formData, company_id: c.id });
                        setCompanyDropdownOpen(false);
                        setCompanySearch('');
                      }}
                    >
                      {c.name}
                    </div>
                  )) : (
                    <div style={{ padding: '8px 12px', fontSize: 13, color: 'var(--text-tertiary)', textAlign: 'center' }}>
                      No companies found
                    </div>
                  )}
                </div>
              )}
            </div>
            {/* Hidden input for native form validation */}
            <input type="text" required value={formData.company_id} style={{ position: 'absolute', opacity: 0, height: 0, width: 0, pointerEvents: 'none' }} onChange={() => {}} tabIndex={-1} />
          </div>
          <div className="form-group">
            <label className="label">Pricing Plan</label>
            <select className="input-base" required value={formData.plan} onChange={handlePlanChange}>
              <option value="">Select a Plan</option>
              <option value="trial">7-Day Free Trial ($0/mo)</option>
              <option value="starter">Starter ($99/mo)</option>
              <option value="enterprise">Enterprise (Custom Pricing)</option>
            </select>
          </div>
          {formData.plan === 'enterprise' && (
            <div className="form-group animate-fade-in">
              <label className="label">Custom MRR ($)</label>
              <input className="input-base" type="number" required value={formData.arr} onChange={e => setFormData({...formData, arr: e.target.value})} />
            </div>
          )}
          <div className="form-group">
            <label className="label">Urgency</label>
            <select className="input-base" value={formData.urgency} onChange={e => setFormData({...formData, urgency: e.target.value})}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary btn-md w-full" style={{ marginTop: 8 }} disabled={saving}>
            {saving ? <Loader size={14} className="cc-spinner" /> : 'Save Deal'}
          </button>
        </form>
      </div>
    </div>
  );
}
