import { useState } from 'react';
import { Printer, Download, Plus, Trash2, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import './InvoiceGenerator.css';

// Logo from Sidebar.jsx
const logoImg = "https://res.cloudinary.com/dxlsyh1qj/image/upload/v1783768087/Group_39_olh8ld.png";

export default function InvoiceGenerator() {
  const [documentType, setDocumentType] = useState('TAX INVOICE');
  const [sidebarTab, setSidebarTab] = useState('meta'); // meta, proposal
  
  const [invoiceData, setInvoiceData] = useState({
    invoiceNo: 'HT-2026-AUG-001',
    invoiceDate: '04 August 2026',
    dueDate: '04 August 2026',
    billingPeriod: '01 Aug 2026 - 30 Sep 2026',
    invoiceType: 'Enterprise Pilot Retainer',
    paymentTerms: 'Due on Receipt',
    currency: 'INR',
    status: 'DUE',
    
    billToName: 'IFIN Global Group',
    billToContact: 'Manjula',
    billToDesignation: 'Director of HR',
    billToAddress: '123 Business Park, Mumbai, MH - 400001',
    billToGst: '27AADCB2230M1Z2',
    billToEmail: 'finance@ifinglobal.com',
    billToPhone: '+91 98765 43210',

    planName: 'Enterprise Pilot Program',
    planDuration: '2 Months',
    planCycle: 'Monthly',
    planCurrentBilling: 'Month 1 of 2',
    planPilotPeriod: '01 Aug 2026 - 30 Sep 2026',
    planUsers: '5 Recruiters',
    planStatus: 'Active',
    
    items: [
      { id: 1, desc: 'Enterprise Pilot Program Retainer\n(Month 1 of 2)', qty: 1, price: 15000, amount: 15000 }
    ],
    
    discount: 0,
    cgstPct: 9,
    sgstPct: 9,
    
    // Page 2 Data
    page2Title: 'ENTERPRISE PILOT PROGRAM',
    page2Desc: 'Your organization has been onboarded to the Huntlo AI-Native Hiring Platform to evaluate and experience the power of AI across your recruitment workflows.',
    page2IncludedTitle: 'MONTHLY CREDITS INCLUDED (ENTERPRISE PILOT BUFFER)',
    page2IncludedDesc: 'These credits are available during the pilot period to support evaluation under live hiring requirements.',
    includedCredits: [
      { id: 1, service: 'AI Candidate Searches', allocation: '3,000' },
      { id: 2, service: 'Candidate Profile Unlocks', allocation: '3,000' },
      { id: 3, service: 'Verified Email Contacts', allocation: '3,000' },
      { id: 4, service: 'Verified Mobile Contacts', allocation: '3,000' },
      { id: 5, service: 'Email Outreach Credits', allocation: '3,000' },
      { id: 6, service: 'WhatsApp Outreach Credits', allocation: '3,000' },
      { id: 7, service: 'AI Voice Calling', allocation: '2,000 Minutes' },
    ],
    page2PricingTitle: 'ADDITIONAL USAGE PRICING (APPLICABLE AFTER EXCEEDING INCLUDED CREDITS)',
    page2PricingDesc: 'Additional usage will be billed based on actual consumption after prior approval.',
    additionalPricing: [
      { id: 1, service: 'Candidate Search', price: '₹2 / Search' },
      { id: 2, service: 'Candidate Profile Unlock', price: '₹2 / Unlock' },
      { id: 3, service: 'Verified Email Contact', price: '₹1 / Contact' },
      { id: 4, service: 'Verified Mobile Contact', price: '₹2 / Contact' },
      { id: 5, service: 'Email Outreach', price: '₹1 / Email' },
      { id: 6, service: 'WhatsApp Outreach', price: '₹5 / Message' },
      { id: 7, service: 'AI Voice Calling', price: '₹5 / Minute' },
    ],
    page2InclusionsTitle: 'PILOT INCLUSIONS',
    page2InclusionsDesc: 'The Enterprise Pilot Program includes the following deliverables and support:',
    inclusions: [
      { id: 1, text: '5 User Licenses (1 Admin + 4 Recruiters)' },
      { id: 2, text: 'Unlimited Active Hiring Roles' },
      { id: 3, text: 'Platform Onboarding & Configuration' },
      { id: 4, text: 'Product Training & Enablement' },
      { id: 5, text: 'AI-Powered Sourcing & Outreach' },
      { id: 6, text: 'Workflow Automation & Collaboration' },
      { id: 7, text: 'Recruiter Dashboard & Analytics' },
      { id: 8, text: 'Enterprise Integrations' },
      { id: 9, text: 'Priority Support' },
      { id: 10, text: 'Dedicated Customer Success Assistance' },
    ]
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInvoiceData(prev => ({ ...prev, [name]: value }));
  };

  const handleDocumentTypeChange = (e) => {
    setDocumentType(e.target.value);
  };

  const handlePrint = () => {
    window.print();
  };
  
  const loadTemplate = (type) => {
    if (type === 'Enterprise Pilot') {
      setInvoiceData(prev => ({
        ...prev,
        page2Title: 'ENTERPRISE PILOT PROGRAM',
        page2Desc: 'Your organization has been onboarded to the Huntlo AI-Native Hiring Platform to evaluate and experience the power of AI across your recruitment workflows.',
        includedCredits: [
          { id: 1, service: 'AI Candidate Searches', allocation: '3,000' },
          { id: 2, service: 'Candidate Profile Unlocks', allocation: '3,000' },
          { id: 3, service: 'Verified Email Contacts', allocation: '3,000' },
          { id: 4, service: 'Verified Mobile Contacts', allocation: '3,000' },
          { id: 5, service: 'Email Outreach Credits', allocation: '3,000' },
          { id: 6, service: 'WhatsApp Outreach Credits', allocation: '3,000' },
          { id: 7, service: 'AI Voice Calling', allocation: '2,000 Minutes' },
        ],
        additionalPricing: [
          { id: 1, service: 'Candidate Search', price: '₹2 / Search' },
          { id: 2, service: 'Candidate Profile Unlock', price: '₹2 / Unlock' },
          { id: 3, service: 'Verified Email Contact', price: '₹1 / Contact' },
          { id: 4, service: 'Verified Mobile Contact', price: '₹2 / Contact' },
          { id: 5, service: 'Email Outreach', price: '₹1 / Email' },
          { id: 6, service: 'WhatsApp Outreach', price: '₹5 / Message' },
          { id: 7, service: 'AI Voice Calling', price: '₹5 / Minute' },
        ],
        inclusions: [
          { id: 1, text: '5 User Licenses (1 Admin + 4 Recruiters)' },
          { id: 2, text: 'Unlimited Active Hiring Roles' },
          { id: 3, text: 'Platform Onboarding & Configuration' },
          { id: 4, text: 'Product Training & Enablement' },
          { id: 5, text: 'AI-Powered Sourcing & Outreach' },
          { id: 6, text: 'Workflow Automation & Collaboration' },
          { id: 7, text: 'Recruiter Dashboard & Analytics' },
          { id: 8, text: 'Enterprise Integrations' },
          { id: 9, text: 'Priority Support' },
          { id: 10, text: 'Dedicated Customer Success Assistance' },
        ]
      }));
    } else if (type === 'Standard SaaS') {
      setInvoiceData(prev => ({
        ...prev,
        page2Title: 'STANDARD SAAS SUBSCRIPTION',
        page2Desc: 'Annual subscription to Huntlo AI platform for end-to-end recruitment.',
        includedCredits: [
          { id: 1, service: 'Platform Access', allocation: 'Unlimited' },
          { id: 2, service: 'Active Jobs', allocation: '50' },
          { id: 3, service: 'User Licenses', allocation: '10' },
        ],
        additionalPricing: [
           { id: 1, service: 'Additional License', price: '₹1000 / Month' },
           { id: 2, service: 'Additional Jobs', price: '₹500 / Month' },
        ],
        inclusions: [
          { id: 1, text: '24/7 Support' },
          { id: 2, text: 'Dedicated Account Manager' },
          { id: 3, text: 'Custom Branding' },
        ]
      }));
    }
  };

  const handleIncludedCreditsChange = (id, field, value) => {
    setInvoiceData(prev => ({
      ...prev,
      includedCredits: prev.includedCredits.map(item => item.id === id ? { ...item, [field]: value } : item)
    }));
  };
  const addIncludedCredit = () => setInvoiceData(prev => ({ ...prev, includedCredits: [...prev.includedCredits, { id: Date.now(), service: '', allocation: '' }] }));
  const removeIncludedCredit = (id) => setInvoiceData(prev => ({ ...prev, includedCredits: prev.includedCredits.filter(i => i.id !== id) }));

  const handleAdditionalPricingChange = (id, field, value) => {
    setInvoiceData(prev => ({
      ...prev,
      additionalPricing: prev.additionalPricing.map(item => item.id === id ? { ...item, [field]: value } : item)
    }));
  };
  const addAdditionalPricing = () => setInvoiceData(prev => ({ ...prev, additionalPricing: [...prev.additionalPricing, { id: Date.now(), service: '', price: '' }] }));
  const removeAdditionalPricing = (id) => setInvoiceData(prev => ({ ...prev, additionalPricing: prev.additionalPricing.filter(i => i.id !== id) }));

  const handleInclusionChange = (id, value) => {
    setInvoiceData(prev => ({
      ...prev,
      inclusions: prev.inclusions.map(item => item.id === id ? { ...item, text: value } : item)
    }));
  };
  const addInclusion = () => setInvoiceData(prev => ({ ...prev, inclusions: [...prev.inclusions, { id: Date.now(), text: '' }] }));
  const removeInclusion = (id) => setInvoiceData(prev => ({ ...prev, inclusions: prev.inclusions.filter(i => i.id !== id) }));


  const subtotal = invoiceData.items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const taxable = subtotal - (Number(invoiceData.discount) || 0);
  const cgst = taxable * (Number(invoiceData.cgstPct) / 100);
  const sgst = taxable * (Number(invoiceData.sgstPct) / 100);
  const total = taxable + cgst + sgst;

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 2 }).format(val);
  };
  
  // Quick Download Standard Proposals
  const downloadStandardProposal = (type) => {
    loadTemplate(type);
    setTimeout(() => {
      window.print();
    }, 500);
  };

  const renderArrayInTwoColumns = (array) => {
    const half = Math.ceil(array.length / 2);
    const col1 = array.slice(0, half);
    const col2 = array.slice(half);
    return { col1, col2 };
  };

  const inclusionsCols = renderArrayInTwoColumns(invoiceData.inclusions);
  const includedCreditsCols = renderArrayInTwoColumns(invoiceData.includedCredits);
  const additionalPricingCols = renderArrayInTwoColumns(invoiceData.additionalPricing);

  return (
    <div className="invoice-gen-container">
      {/* LEFT SIDEBAR FORM */}
      <div className="invoice-gen-sidebar" style={{ width: '450px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Generator</h2>
          <button className="btn btn-primary btn-sm" onClick={handlePrint}>
            <Printer size={14} /> Print / PDF
          </button>
        </div>
        
        {/* Quick Actions */}
        <div className="invoice-section">
          <div className="inv-section-title">Quick Actions</div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
             <button className="btn btn-outline btn-sm" onClick={() => downloadStandardProposal('Enterprise Pilot')}>
               <Download size={14} /> Standard Proposal 1
             </button>
             <button className="btn btn-outline btn-sm" onClick={() => downloadStandardProposal('Standard SaaS')}>
               <Download size={14} /> Standard Proposal 2
             </button>
          </div>
        </div>

        <div style={{ display: 'flex', borderBottom: '1px solid var(--bg-border)', marginBottom: '12px' }}>
          <button 
            className={`btn btn-ghost ${sidebarTab === 'meta' ? 'active' : ''}`} 
            onClick={() => setSidebarTab('meta')}
            style={{ borderRadius: 0, borderBottom: sidebarTab === 'meta' ? '2px solid var(--primary)' : 'none', flex: 1 }}
          >
            Doc Info
          </button>
          <button 
            className={`btn btn-ghost ${sidebarTab === 'proposal' ? 'active' : ''}`} 
            onClick={() => setSidebarTab('proposal')}
            style={{ borderRadius: 0, borderBottom: sidebarTab === 'proposal' ? '2px solid var(--primary)' : 'none', flex: 1 }}
          >
            Proposal Config
          </button>
        </div>

        {sidebarTab === 'meta' && (
          <>
            <div className="invoice-section">
              <div className="inv-section-title">Document Type</div>
              <div className="form-group">
                <select className="input-base" value={documentType} onChange={handleDocumentTypeChange}>
                  <option value="TAX INVOICE">Tax Invoice</option>
                  <option value="PURCHASE ORDER">Purchase Order</option>
                  <option value="PROFORMA INVOICE">Proforma Invoice</option>
                  <option value="PROPOSAL">Proposal</option>
                </select>
              </div>
            </div>

            <div className="invoice-section">
              <div className="inv-section-title">Meta</div>
              <div className="form-group">
                <label className="label">{documentType === 'PURCHASE ORDER' ? 'PO No.' : 'Doc No.'}</label>
                <input className="input-base" name="invoiceNo" value={invoiceData.invoiceNo} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="label">{documentType === 'PURCHASE ORDER' ? 'PO Date' : 'Date'}</label>
                <input className="input-base" name="invoiceDate" value={invoiceData.invoiceDate} onChange={handleChange} />
              </div>
            </div>

            <div className="invoice-section">
              <div className="inv-section-title">Bill To</div>
              <div className="form-group">
                <label className="label">Company Name</label>
                <input className="input-base" name="billToName" value={invoiceData.billToName} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="label">Contact Person</label>
                <input className="input-base" name="billToContact" value={invoiceData.billToContact} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="label">Address</label>
                <textarea className="input-base" name="billToAddress" value={invoiceData.billToAddress} onChange={handleChange} rows="2" />
              </div>
            </div>

            <div className="invoice-section">
              <div className="inv-section-title">Financials</div>
              <div className="form-group">
                <label className="label">Base Price</label>
                <input className="input-base" type="number" value={invoiceData.items[0].price} onChange={(e) => {
                  const val = Number(e.target.value);
                  setInvoiceData(prev => ({
                    ...prev,
                    items: [{ ...prev.items[0], price: val, amount: val }]
                  }));
                }} />
              </div>
            </div>
          </>
        )}

        {sidebarTab === 'proposal' && (
          <>
             <div className="invoice-section">
              <div className="inv-section-title">Load Pre-filled Template</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-outline btn-sm" onClick={() => loadTemplate('Enterprise Pilot')}>Enterprise Pilot</button>
                <button className="btn btn-outline btn-sm" onClick={() => loadTemplate('Standard SaaS')}>Standard SaaS</button>
              </div>
            </div>

            <div className="invoice-section">
              <div className="inv-section-title">Page 2 Main Title</div>
              <div className="form-group">
                <input className="input-base" name="page2Title" value={invoiceData.page2Title} onChange={handleChange} />
                <textarea className="input-base" name="page2Desc" value={invoiceData.page2Desc} onChange={handleChange} rows="2" style={{ marginTop: '8px' }}/>
              </div>
            </div>

            <div className="invoice-section">
              <div className="inv-section-title">Included Credits Table</div>
              <input className="input-base" name="page2IncludedTitle" value={invoiceData.page2IncludedTitle} onChange={handleChange} style={{ marginBottom: '4px' }} />
              <input className="input-base" name="page2IncludedDesc" value={invoiceData.page2IncludedDesc} onChange={handleChange} style={{ marginBottom: '8px' }} />
              
              {invoiceData.includedCredits.map(item => (
                <div key={item.id} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <input className="input-base" style={{ flex: 1 }} value={item.service} onChange={(e) => handleIncludedCreditsChange(item.id, 'service', e.target.value)} placeholder="Service" />
                  <input className="input-base" style={{ width: '80px' }} value={item.allocation} onChange={(e) => handleIncludedCreditsChange(item.id, 'allocation', e.target.value)} placeholder="Qty" />
                  <button className="btn btn-ghost btn-sm" onClick={() => removeIncludedCredit(item.id)}><Trash2 size={14} color="var(--danger)" /></button>
                </div>
              ))}
              <button className="btn btn-ghost btn-sm" onClick={addIncludedCredit}><Plus size={14} /> Add Item</button>
            </div>

            <div className="invoice-section">
              <div className="inv-section-title">Additional Pricing Table</div>
              <input className="input-base" name="page2PricingTitle" value={invoiceData.page2PricingTitle} onChange={handleChange} style={{ marginBottom: '4px' }} />
              <input className="input-base" name="page2PricingDesc" value={invoiceData.page2PricingDesc} onChange={handleChange} style={{ marginBottom: '8px' }} />
              
              {invoiceData.additionalPricing.map(item => (
                <div key={item.id} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <input className="input-base" style={{ flex: 1 }} value={item.service} onChange={(e) => handleAdditionalPricingChange(item.id, 'service', e.target.value)} placeholder="Service" />
                  <input className="input-base" style={{ width: '100px' }} value={item.price} onChange={(e) => handleAdditionalPricingChange(item.id, 'price', e.target.value)} placeholder="Price" />
                  <button className="btn btn-ghost btn-sm" onClick={() => removeAdditionalPricing(item.id)}><Trash2 size={14} color="var(--danger)" /></button>
                </div>
              ))}
              <button className="btn btn-ghost btn-sm" onClick={addAdditionalPricing}><Plus size={14} /> Add Item</button>
            </div>

            <div className="invoice-section">
              <div className="inv-section-title">Inclusions (Bullet Points)</div>
              <input className="input-base" name="page2InclusionsTitle" value={invoiceData.page2InclusionsTitle} onChange={handleChange} style={{ marginBottom: '4px' }} />
              <input className="input-base" name="page2InclusionsDesc" value={invoiceData.page2InclusionsDesc} onChange={handleChange} style={{ marginBottom: '8px' }} />
              
              {invoiceData.inclusions.map(item => (
                <div key={item.id} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <input className="input-base" style={{ flex: 1 }} value={item.text} onChange={(e) => handleInclusionChange(item.id, e.target.value)} placeholder="Inclusion text" />
                  <button className="btn btn-ghost btn-sm" onClick={() => removeInclusion(item.id)}><Trash2 size={14} color="var(--danger)" /></button>
                </div>
              ))}
              <button className="btn btn-ghost btn-sm" onClick={addInclusion}><Plus size={14} /> Add Inclusion</button>
            </div>
          </>
        )}
      </div>

      {/* RIGHT SIDE PREVIEW */}
      <div className="invoice-gen-preview">
        <div>
          {/* PAGE 1 */}
          <div className="invoice-page">
            <div className="inv-header">
              <div className="inv-logo-area">
                <h1><img src={logoImg} alt="Logo" className="inv-logo-img" /> Huntlo</h1>
                <div className="inv-subtitle">AI-NATIVE HIRING INFRASTRUCTURE</div>
              </div>
              <div className="inv-header-right">
                <h2>{documentType}</h2>
              </div>
            </div>

            <div className="inv-divider"></div>

            <div className="inv-top-details">
              <div>
                <div className="inv-section-title">ISSUED BY</div>
                <div className="inv-company-name">VICTA EARLYJOBS TECHNOLOGIES PRIVATE LIMITED</div>
                <p style={{ fontWeight: 600, marginBottom: 8, fontSize: 10 }}>(Operating as Huntlo.ai)</p>
                <p>No. 53, HustleHub, 5th Cross, 4th Block</p>
                <p>Koramangala, Bengaluru, Karnataka - 560034</p>
                <p style={{ marginBottom: 16 }}>India</p>

                <div className="inv-grid-2col tight">
                  <div className="inv-label">GSTIN</div><div className="inv-value">29AAKCV8017B1Z8</div>
                  <div className="inv-label">Email</div><div className="inv-value">accounts@earlyjobs.in</div>
                  <div className="inv-label">Phone</div><div className="inv-value">+91 91485 43274</div>
                </div>
              </div>

              <div>
                <div className="inv-box" style={{ height: '100%' }}>
                  <div className="inv-grid-2col">
                    <div className="inv-label">{documentType === 'PURCHASE ORDER' ? 'PO No.' : 'Doc No.'}</div><div className="inv-value">{invoiceData.invoiceNo}</div>
                    <div className="inv-label">{documentType === 'PURCHASE ORDER' ? 'PO Date' : 'Date'}</div><div className="inv-value">{invoiceData.invoiceDate}</div>
                    <div className="inv-label">Due Date</div><div className="inv-value">{invoiceData.dueDate}</div>
                    <div className="inv-label">Billing Period</div><div className="inv-value">{invoiceData.billingPeriod}</div>
                    <div className="inv-label">Type</div><div className="inv-value">{invoiceData.invoiceType}</div>
                    <div className="inv-label">Payment Terms</div><div className="inv-value">{invoiceData.paymentTerms}</div>
                    <div className="inv-label">Currency</div><div className="inv-value">{invoiceData.currency}</div>
                    <div className="inv-label">Status</div><div><span className="inv-status-badge">{invoiceData.status}</span></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="inv-divider-thin"></div>

            <div className="inv-top-details">
              <div>
                <div className="inv-section-title">BILL TO</div>
                <div className="inv-company-name">{invoiceData.billToName}</div>
                <div className="inv-grid-2col tight" style={{ marginTop: 8, marginBottom: 16 }}>
                  <div className="inv-label">Contact Person</div><div className="inv-value">: {invoiceData.billToContact}</div>
                  <div className="inv-label">Designation</div><div className="inv-value">: {invoiceData.billToDesignation}</div>
                  <div className="inv-label">Billing Address</div><div className="inv-value">: {invoiceData.billToAddress}</div>
                </div>
                <div className="inv-grid-2col tight">
                  <div className="inv-label">GSTIN</div><div className="inv-value">: {invoiceData.billToGst}</div>
                  <div className="inv-label">Email</div><div className="inv-value">: {invoiceData.billToEmail}</div>
                  <div className="inv-label">Phone</div><div className="inv-value">: {invoiceData.billToPhone}</div>
                </div>
              </div>
              
              <div>
                <div className="inv-section-title">SUMMARY</div>
                <div className="inv-grid-2col">
                  <div className="inv-label">Plan</div><div className="inv-value">: {invoiceData.planName}</div>
                  <div className="inv-label">Duration</div><div className="inv-value">: {invoiceData.planDuration}</div>
                  <div className="inv-label">Billing Cycle</div><div className="inv-value">: {invoiceData.planCycle}</div>
                  <div className="inv-label">Current Billing</div><div className="inv-value">: {invoiceData.planCurrentBilling}</div>
                  <div className="inv-label">Service Period</div><div className="inv-value">: {invoiceData.planPilotPeriod}</div>
                  <div className="inv-label">Users Included</div><div className="inv-value">: {invoiceData.planUsers}</div>
                  <div className="inv-label">Status</div><div className="inv-value" style={{ color: '#2563eb', fontWeight: 800 }}>: {invoiceData.planStatus}</div>
                </div>
              </div>
            </div>

            <div className="inv-section-title" style={{ marginTop: 30 }}>ITEMS</div>
            <table className="inv-table">
              <thead>
                <tr>
                  <th style={{ width: 40 }}>#</th>
                  <th>Description</th>
                  <th style={{ width: 80, textAlign: 'center' }}>Qty</th>
                  <th className="right" style={{ width: 140 }}>Unit Price ({invoiceData.currency})</th>
                  <th className="right" style={{ width: 140 }}>Amount ({invoiceData.currency})</th>
                </tr>
              </thead>
              <tbody>
                {invoiceData.items.map((item, i) => (
                  <tr key={item.id}>
                    <td>{i + 1}</td>
                    <td style={{ whiteSpace: 'pre-line' }}>{item.desc}</td>
                    <td style={{ textAlign: 'center' }}>{item.qty}</td>
                    <td className="right">{formatCurrency(item.price)}</td>
                    <td className="right" style={{ fontWeight: 700 }}>{formatCurrency(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="inv-payment-tax">
              <div>
                <div className="inv-section-title">PAYMENT INFORMATION</div>
                <div className="inv-box">
                  <div className="inv-grid-2col tight" style={{ gridTemplateColumns: '110px 1fr' }}>
                    <div className="inv-label">Beneficiary</div><div className="inv-value">: VICTA EARLYJOBS TECHNOLOGIES PVT LTD</div>
                    <div className="inv-label">Bank</div><div className="inv-value">: ICICI Bank</div>
                    <div className="inv-label">Account Number</div><div className="inv-value">: 123456789012</div>
                    <div className="inv-label">IFSC</div><div className="inv-value">: ICIC0001234</div>
                    <div className="inv-label">UPI ID</div><div className="inv-value">: payments@huntlo</div>
                  </div>
                </div>
              </div>

              <div>
                <div className="inv-section-title">TAX SUMMARY</div>
                <div className="inv-box">
                  <div className="inv-summary-row">
                    <span className="inv-label">Subtotal</span><span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="inv-summary-row">
                    <span className="inv-label">Discount</span><span>{formatCurrency(invoiceData.discount)}</span>
                  </div>
                  <div className="inv-summary-row bold">
                    <span>Taxable Value</span><span>{formatCurrency(taxable)}</span>
                  </div>
                  <div className="inv-summary-row">
                    <span className="inv-label">CGST ({invoiceData.cgstPct}%)</span><span>{formatCurrency(cgst)}</span>
                  </div>
                  <div className="inv-summary-row">
                    <span className="inv-label">SGST ({invoiceData.sgstPct}%)</span><span>{formatCurrency(sgst)}</span>
                  </div>
                  <div className="inv-divider-thin" style={{ margin: '8px 0' }}></div>
                  <div className="inv-summary-row bold" style={{ color: '#2563eb' }}>
                    <span>TOTAL AMOUNT DUE</span><span>{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="inv-total-banner">
              <h3>TOTAL AMOUNT DUE</h3>
              <div className="amount">₹{formatCurrency(total)}</div>
            </div>

            <div className="inv-section-title">NOTES</div>
            <div className="inv-notes">
              <ul>
                <li>This document is raised towards the Enterprise Pilot Program Retainer for the first month of the agreed 2-month pilot engagement.</li>
                <li>The pilot includes platform access, onboarding, training, AI-powered sourcing, outreach, automation and priority support as per the agreed scope.</li>
                <li>Any usage exceeding the included monthly allocation will be billed separately based on actual consumption and prior approval.</li>
                <li>Payment is due on receipt of this document.</li>
              </ul>
            </div>

            <div className="inv-footer">
              <p>This is a computer generated document and does not require any signature.</p>
              <p>Page 1 of 2</p>
            </div>
          </div>

          {/* PAGE 2 */}
          <div className="invoice-page">
            <div className="inv-page-2-header">
              <h2>HUNTLO.AI</h2>
              <span>{documentType === 'PURCHASE ORDER' ? 'PO NO.' : 'DOC NO.'} {invoiceData.invoiceNo}</span>
            </div>

            <div className="inv-p2-title">{invoiceData.page2Title}</div>
            <div className="inv-p2-text">{invoiceData.page2Desc}</div>

            {invoiceData.includedCredits.length > 0 && (
              <>
                <div className="inv-p2-title">{invoiceData.page2IncludedTitle}</div>
                <div className="inv-p2-text">{invoiceData.page2IncludedDesc}</div>
                
                <div className="inv-p2-grid">
                  <table className="inv-p2-table">
                    <thead><tr><th>Service</th><th className="right">Allocation</th></tr></thead>
                    <tbody>
                      {includedCreditsCols.col1.map(item => (
                        <tr key={item.id}><td>{item.service}</td><td className="right">{item.allocation}</td></tr>
                      ))}
                    </tbody>
                  </table>
                  <table className="inv-p2-table">
                    <thead><tr><th>Service</th><th className="right">Allocation</th></tr></thead>
                    <tbody>
                      {includedCreditsCols.col2.map(item => (
                        <tr key={item.id}><td>{item.service}</td><td className="right">{item.allocation}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {invoiceData.additionalPricing.length > 0 && (
              <>
                <div className="inv-p2-title" style={{ marginTop: invoiceData.includedCredits.length > 0 ? 0 : 24 }}>{invoiceData.page2PricingTitle}</div>
                <div className="inv-p2-text">{invoiceData.page2PricingDesc}</div>
                
                <div className="inv-p2-grid">
                  <table className="inv-p2-table">
                    <thead><tr><th>Service</th><th className="right">Unit Price</th></tr></thead>
                    <tbody>
                      {additionalPricingCols.col1.map(item => (
                         <tr key={item.id}><td>{item.service}</td><td className="right">{item.price}</td></tr>
                      ))}
                    </tbody>
                  </table>
                  <table className="inv-p2-table">
                    <thead><tr><th>Service</th><th className="right">Unit Price</th></tr></thead>
                    <tbody>
                      {additionalPricingCols.col2.map(item => (
                         <tr key={item.id}><td>{item.service}</td><td className="right">{item.price}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {invoiceData.inclusions.length > 0 && (
              <>
                <div className="inv-p2-title" style={{ marginTop: 32 }}>{invoiceData.page2InclusionsTitle}</div>
                <div className="inv-p2-text" style={{ marginBottom: 8 }}>{invoiceData.page2InclusionsDesc}</div>
                
                <div className="inv-p2-grid" style={{ marginBottom: 12 }}>
                  <div className="inv-notes">
                    <ul>
                      {inclusionsCols.col1.map(item => <li key={item.id}>{item.text}</li>)}
                    </ul>
                  </div>
                  <div className="inv-notes">
                    <ul>
                       {inclusionsCols.col2.map(item => <li key={item.id}>{item.text}</li>)}
                    </ul>
                  </div>
                </div>
              </>
            )}

            <div className="inv-p2-grid" style={{ marginTop: 32 }}>
              <div>
                <div className="inv-p2-title">IMPORTANT NOTES</div>
                <div className="inv-notes">
                  <ul>
                    <li>Credits are refreshed monthly and valid only during the active pilot period.</li>
                    <li>Unused credits are non-transferable and expire at the end of each monthly billing cycle.</li>
                    <li>All prices are exclusive of applicable GST.</li>
                  </ul>
                </div>
              </div>
              <div className="inv-thank-you">
                <h4>THANK YOU!</h4>
                <p>Thank you for choosing Huntlo. We look forward to partnering with {invoiceData.billToName} to build a faster, smarter and AI-native hiring process.</p>
              </div>
            </div>

            <div className="inv-signature">
              <div>
                <p style={{ fontSize: 9, color: '#6b7280', marginBottom: 4 }}>Authorized By</p>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>Vakode Prajwal</p>
                <p style={{ fontSize: 10, color: '#4b5563' }}>Enterprise Sales Lead | Huntlo.ai</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 11, color: '#4b5563' }}>+91 96113 29404</p>
                <p style={{ fontSize: 11, color: '#4b5563' }}>prajwal@huntlo.ai</p>
                <p style={{ fontSize: 11, color: '#4b5563' }}>www.huntlo.ai</p>
              </div>
            </div>

            <div className="inv-footer">
              <p>This is a computer generated document and does not require any signature.</p>
              <p>Page 2 of 2</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
