import { useState, useRef, useEffect, useMemo } from 'react';
import { X, AlertCircle, Loader, Search, ChevronDown, Link2, User } from 'lucide-react';
import useDataStore from '../../store/useDataStore';
import './DealDrawer.css';

export default function NewDealDrawer({ onClose, prefilledLead = null }) {
  const { companies, contacts, leads, createDeal } = useDataStore();

  // Pre-fill from a lead if passed in (Convert Lead → Deal flow)
  const initFromLead = prefilledLead ? {
    title: `${prefilledLead.company_name} — Deal`,
    company_id: companies.find(c => c.name?.toLowerCase() === prefilledLead.company_name?.toLowerCase())?.id || '',
    contact_id: contacts.find(c => c.email === prefilledLead.email || (c.name === prefilledLead.contact_name))?.id || '',
    plan: '',
    arr: prefilledLead.estimated_mrr ? String(prefilledLead.estimated_mrr) : '',
    urgency: 'medium',
    lead_id: prefilledLead.id,
  } : { title: '', company_id: '', contact_id: '', plan: '', arr: '', urgency: 'medium', lead_id: '' };

  const [formData, setFormData] = useState(initFromLead);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [companySearch, setCompanySearch] = useState(
    prefilledLead ? prefilledLead.company_name : ''
  );
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

  // Unified company + lead search
  const filteredCompanies = useMemo(() => {
    const q = companySearch.toLowerCase();
    return companies.filter(c => c.name?.toLowerCase().includes(q));
  }, [companies, companySearch]);

  const selectedCompany = companies.find(c => c.id === formData.company_id);

  // Contacts for selected company — from contacts table + from leads
  const availableContacts = useMemo(() => {
    if (!formData.company_id) return [];
    const fromContacts = contacts.filter(c => c.company_id === formData.company_id);
    // Also check leads whose company name matches
    const companyName = selectedCompany?.name?.toLowerCase();
    const fromLeads = leads
      .filter(l => l.company_name?.toLowerCase() === companyName && (l.contact_name || l.email))
      .map(l => ({
        id: `lead-${l.id}`,
        name: l.contact_name || l.email,
        designation: l.designation || '',
        email: l.email || '',
        _fromLead: true,
      }));
    // Deduplicate by email
    const seen = new Set(fromContacts.map(c => c.email));
    const uniqueFromLeads = fromLeads.filter(l => l.email && !seen.has(l.email));
    return [...fromContacts, ...uniqueFromLeads];
  }, [formData.company_id, contacts, leads, selectedCompany]);

  // Auto-fill MRR from lead data when a company is selected
  const handleCompanySelect = (company) => {
    const linkedLead = leads.find(l => l.company_name?.toLowerCase() === company.name?.toLowerCase());
    setFormData(prev => ({
      ...prev,
      company_id: company.id,
      contact_id: '',
      arr: linkedLead?.estimated_mrr ? String(linkedLead.estimated_mrr) : prev.arr,
      lead_id: linkedLead?.id || prev.lead_id,
      title: prev.title || `${company.name} — Deal`,
    }));
    setCompanyDropdownOpen(false);
    setCompanySearch('');
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.company_id) return;
    setSaving(true);
    setError(null);
    try {
      const realContactId = formData.contact_id?.startsWith('lead-')
        ? null
        : formData.contact_id || null;

      await createDeal({
        title: formData.title,
        company_id: formData.company_id,
        arr: Number(formData.arr) || 0,
        stage: 'Discovery',
        urgency: formData.urgency,
        engagement_score: 0,
        lead_id: formData.lead_id || null,
        notes: formData.lead_id ? `Converted from Lead #${formData.lead_id}` : '',
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
    if (plan === 'trial')      arr = 0;
    else if (plan === 'starter')    arr = 8299;
    else if (plan === 'growth')     arr = 24999;
    else if (plan === 'enterprise') arr = '';
    setFormData({ ...formData, plan, arr });
  };

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="deal-drawer animate-slide-right" onClick={e => e.stopPropagation()}>
        <div className="drawer-header" style={{ padding: 24 }}>
          <div>
            <h2 className="panel-title">{prefilledLead ? '⚡ Convert Lead to Deal' : 'Add Deal'}</h2>
            {prefilledLead && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, fontSize: 12, color: 'var(--accent-blue)' }}>
                <Link2 size={12} />
                <span>Pre-filled from: <strong>{prefilledLead.company_name}</strong></span>
              </div>
            )}
          </div>
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
            <input
              className="input-base"
              autoFocus={!prefilledLead}
              required
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
              placeholder="e.g. Enterprise Q3 Expansion"
            />
          </div>

          {/* Company Picker */}
          <div className="form-group" ref={dropdownRef}>
            <label className="label">Company / Account</label>
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
                  {filteredCompanies.length > 0 ? filteredCompanies.map(c => {
                    const linkedLead = leads.find(l => l.company_name?.toLowerCase() === c.name?.toLowerCase());
                    return (
                      <div
                        key={c.id}
                        className="dropdown-item"
                        onClick={() => handleCompanySelect(c)}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <span style={{ fontWeight: 600, fontSize: 13 }}>{c.name}</span>
                          {linkedLead && (
                            <span style={{ fontSize: 11, color: 'var(--accent-blue)' }}>
                              Lead: {linkedLead.stage} · {linkedLead.contact_name || ''}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  }) : (
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

          {/* Contact picker — shows after company selected */}
          {formData.company_id && (
            <div className="form-group">
              <label className="label">Primary Contact</label>
              {availableContacts.length > 0 ? (
                <select
                  className="input-base"
                  value={formData.contact_id}
                  onChange={e => setFormData({ ...formData, contact_id: e.target.value })}
                >
                  <option value="">Select a contact...</option>
                  {availableContacts.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name || c.email} {c.designation ? `(${c.designation})` : ''}{c._fromLead ? ' · from Lead' : ''}
                    </option>
                  ))}
                </select>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 8, background: 'rgba(100,116,139,0.06)', fontSize: 12, color: 'var(--text-secondary)' }}>
                  <User size={13} />
                  <span>No contacts found for this company — add a Lead first to auto-create one</span>
                </div>
              )}
            </div>
          )}

          <div className="form-group">
            <label className="label">Pricing Plan</label>
            <select className="input-base" required value={formData.plan} onChange={handlePlanChange}>
              <option value="">Select a Plan</option>
              <option value="trial">7-Day Free Trial (₹0/mo)</option>
              <option value="starter">Starter (₹8,299/mo)</option>
              <option value="growth">Growth (₹24,999/mo)</option>
              <option value="enterprise">Enterprise (Custom Pricing)</option>
            </select>
          </div>

          {(formData.plan === 'enterprise' || (formData.arr && formData.plan === '')) && (
            <div className="form-group animate-fade-in">
              <label className="label">
                {formData.plan === 'enterprise' ? 'Custom MRR (₹)' : 'MRR / Deal Value (₹)'}
              </label>
              <input
                className="input-base"
                type="number"
                required={formData.plan === 'enterprise'}
                value={formData.arr}
                onChange={e => setFormData({...formData, arr: e.target.value})}
                placeholder="e.g. 50000"
              />
            </div>
          )}

          {/* Show pre-filled MRR hint */}
          {formData.arr && formData.plan !== 'enterprise' && formData.plan !== '' && (
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: -8, paddingLeft: 2 }}>
              MRR: ₹{Number(formData.arr).toLocaleString('en-IN')}/mo
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
            {saving ? <Loader size={14} className="cc-spinner" /> : (prefilledLead ? '⚡ Convert & Save Deal' : 'Save Deal')}
          </button>
        </form>
      </div>
    </div>
  );
}
