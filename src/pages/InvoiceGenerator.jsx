import { useState } from 'react';
import { Printer, Download, Plus, Trash2 } from 'lucide-react';
import './InvoiceGenerator.css';

// Logo from Sidebar.jsx
const logoImg = "https://res.cloudinary.com/dxlsyh1qj/image/upload/v1783768087/Group_39_olh8ld.png";

export default function InvoiceGenerator() {
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
    sgstPct: 9
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInvoiceData(prev => ({ ...prev, [name]: value }));
  };

  const handlePrint = () => {
    window.print();
  };

  const subtotal = invoiceData.items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const taxable = subtotal - (Number(invoiceData.discount) || 0);
  const cgst = taxable * (Number(invoiceData.cgstPct) / 100);
  const sgst = taxable * (Number(invoiceData.sgstPct) / 100);
  const total = taxable + cgst + sgst;

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 2 }).format(val);
  };

  return (
    <div className="invoice-gen-container">
      {/* LEFT SIDEBAR FORM */}
      <div className="invoice-gen-sidebar">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Invoice Details</h2>
          <button className="btn btn-primary btn-sm" onClick={handlePrint}>
            <Printer size={14} /> Print / PDF
          </button>
        </div>

        <div className="invoice-section">
          <div className="inv-section-title">Invoice Meta</div>
          <div className="form-group">
            <label className="label">Invoice No.</label>
            <input className="input-base" name="invoiceNo" value={invoiceData.invoiceNo} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label className="label">Invoice Date</label>
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
        
        <p style={{ fontSize: 11, color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
          * Edit code directly to change static boilerplate texts like issued by, inclusions, etc.
        </p>
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
                <h2>TAX INVOICE</h2>
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
                    <div className="inv-label">Invoice No.</div><div className="inv-value">{invoiceData.invoiceNo}</div>
                    <div className="inv-label">Invoice Date</div><div className="inv-value">{invoiceData.invoiceDate}</div>
                    <div className="inv-label">Due Date</div><div className="inv-value">{invoiceData.dueDate}</div>
                    <div className="inv-label">Billing Period</div><div className="inv-value">{invoiceData.billingPeriod}</div>
                    <div className="inv-label">Invoice Type</div><div className="inv-value">{invoiceData.invoiceType}</div>
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
                <div className="inv-section-title">SUBSCRIPTION SUMMARY</div>
                <div className="inv-grid-2col">
                  <div className="inv-label">Plan</div><div className="inv-value">: {invoiceData.planName}</div>
                  <div className="inv-label">Duration</div><div className="inv-value">: {invoiceData.planDuration}</div>
                  <div className="inv-label">Billing Cycle</div><div className="inv-value">: {invoiceData.planCycle}</div>
                  <div className="inv-label">Current Billing</div><div className="inv-value">: {invoiceData.planCurrentBilling}</div>
                  <div className="inv-label">Pilot Period</div><div className="inv-value">: {invoiceData.planPilotPeriod}</div>
                  <div className="inv-label">Users Included</div><div className="inv-value">: {invoiceData.planUsers}</div>
                  <div className="inv-label">Status</div><div className="inv-value" style={{ color: '#2563eb', fontWeight: 800 }}>: {invoiceData.planStatus}</div>
                </div>
              </div>
            </div>

            <div className="inv-section-title" style={{ marginTop: 30 }}>INVOICE ITEMS</div>
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
                <li>This invoice is raised towards the Enterprise Pilot Program Retainer for the first month of the agreed 2-month pilot engagement.</li>
                <li>The pilot includes platform access, onboarding, training, AI-powered sourcing, outreach, automation and priority support as per the agreed scope.</li>
                <li>Any usage exceeding the included monthly allocation will be billed separately based on actual consumption and prior approval.</li>
                <li>Payment is due on receipt of this invoice.</li>
              </ul>
            </div>

            <div className="inv-footer">
              <p>This is a computer generated tax invoice and does not require any signature.</p>
              <p>Page 1 of 2</p>
            </div>
          </div>

          {/* PAGE 2 */}
          <div className="invoice-page">
            <div className="inv-page-2-header">
              <h2>HUNTLO.AI</h2>
              <span>INVOICE NO. {invoiceData.invoiceNo}</span>
            </div>

            <div className="inv-p2-title">ENTERPRISE PILOT PROGRAM</div>
            <div className="inv-p2-text">
              Your organization has been onboarded to the Huntlo AI-Native Hiring Platform to evaluate and experience the power of AI across your recruitment workflows.
            </div>

            <div className="inv-p2-title">MONTHLY CREDITS INCLUDED (ENTERPRISE PILOT BUFFER)</div>
            <div className="inv-p2-text">These credits are available during the pilot period to support evaluation under live hiring requirements.</div>
            
            <div className="inv-p2-grid">
              <table className="inv-p2-table">
                <thead><tr><th>Service</th><th className="right">Monthly Allocation</th></tr></thead>
                <tbody>
                  <tr><td>AI Candidate Searches</td><td className="right">3,000</td></tr>
                  <tr><td>Candidate Profile Unlocks</td><td className="right">3,000</td></tr>
                  <tr><td>Verified Email Contacts</td><td className="right">3,000</td></tr>
                  <tr><td>Verified Mobile Contacts</td><td className="right">3,000</td></tr>
                </tbody>
              </table>
              <table className="inv-p2-table">
                <thead><tr><th>Service</th><th className="right">Monthly Allocation</th></tr></thead>
                <tbody>
                  <tr><td>Email Outreach Credits</td><td className="right">3,000</td></tr>
                  <tr><td>WhatsApp Outreach Credits</td><td className="right">3,000</td></tr>
                  <tr><td>AI Voice Calling</td><td className="right">2,000 Minutes</td></tr>
                  <tr><td></td><td></td></tr>
                </tbody>
              </table>
            </div>

            <div className="inv-p2-title">ADDITIONAL USAGE PRICING (APPLICABLE AFTER EXCEEDING INCLUDED CREDITS)</div>
            <div className="inv-p2-text">Additional usage will be billed based on actual consumption after prior approval.</div>
            
            <div className="inv-p2-grid">
              <table className="inv-p2-table">
                <thead><tr><th>Service</th><th className="right">Unit Price (INR)</th></tr></thead>
                <tbody>
                  <tr><td>Candidate Search</td><td className="right">₹2 / Search</td></tr>
                  <tr><td>Candidate Profile Unlock</td><td className="right">₹2 / Unlock</td></tr>
                  <tr><td>Verified Email Contact</td><td className="right">₹1 / Contact</td></tr>
                  <tr><td>Verified Mobile Contact</td><td className="right">₹2 / Contact</td></tr>
                </tbody>
              </table>
              <table className="inv-p2-table">
                <thead><tr><th>Service</th><th className="right">Unit Price (INR)</th></tr></thead>
                <tbody>
                  <tr><td>Email Outreach</td><td className="right">₹1 / Email</td></tr>
                  <tr><td>WhatsApp Outreach</td><td className="right">₹5 / Message</td></tr>
                  <tr><td>AI Voice Calling</td><td className="right">₹5 / Minute</td></tr>
                  <tr><td></td><td></td></tr>
                </tbody>
              </table>
            </div>

            <div className="inv-p2-title" style={{ marginTop: 32 }}>PILOT INCLUSIONS</div>
            <div className="inv-p2-text" style={{ marginBottom: 8 }}>The Enterprise Pilot Program includes the following deliverables and support:</div>
            
            <div className="inv-p2-grid" style={{ marginBottom: 12 }}>
              <div className="inv-notes">
                <ul>
                  <li>5 User Licenses (1 Admin + 4 Recruiters)</li>
                  <li>Unlimited Active Hiring Roles</li>
                  <li>Platform Onboarding & Configuration</li>
                  <li>Product Training & Enablement</li>
                  <li>AI-Powered Sourcing & Outreach</li>
                </ul>
              </div>
              <div className="inv-notes">
                <ul>
                  <li>Workflow Automation & Collaboration</li>
                  <li>Recruiter Dashboard & Analytics</li>
                  <li>Enterprise Integrations</li>
                  <li>Priority Support</li>
                  <li>Dedicated Customer Success Assistance</li>
                </ul>
              </div>
            </div>

            <div className="inv-p2-grid">
              <div>
                <div className="inv-p2-title" style={{ marginTop: 24 }}>IMPORTANT NOTES</div>
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
                <p>Thank you for choosing Huntlo. We look forward to partnering with IFIN Global Group to build a faster, smarter and AI-native hiring process.</p>
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
              <p>This is a computer generated tax invoice and does not require any signature.</p>
              <p>Page 2 of 2</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
