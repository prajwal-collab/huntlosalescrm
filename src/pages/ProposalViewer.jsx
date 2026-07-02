import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, Download } from 'lucide-react';
import logoImg from '../assets/huntlo-logo-full.png';
import './ProposalViewer.css';

export default function ProposalViewer() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Extract quote details from state passed by Calculator
  const state = location.state || {};
  const {
    companyName = 'Client Company',
    region = 'India',
    industry = 'Technology',
    proposalName = 'Enterprise Proposal',
    salesOwner = 'Sales Team',
    searches = 0,
    unlocks = 0,
    emailReveals = 0,
    mobileReveals = 0,
    emailOutreach = 0,
    whatsappOutreach = 0,
    aiCallsMins = 0,
    roundedMonthlyPrice = 0,
    quarterlyPrice = 0,
    annualPrice = 0,
    regionalConfig = {}
  } = state;

  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  return (
    <div className="proposal-wrapper">
      <div className="proposal-toolbar">
        <button className="btn btn-outline" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> Back to Calculator
        </button>
        <button className="btn btn-primary" onClick={handlePrint}>
          <Printer size={16} /> Print / Save as PDF
        </button>
      </div>

      <div className="proposal-document">
        
        {/* PAGE 1: Cover & Summary */}
        <div className="proposal-page">
          <div className="prop-header">
            <div className="prop-logo-wrapper">
              <img src={logoImg} alt="Huntlo" />
            </div>
            <div className="prop-title">{proposalName}</div>
          </div>

          <h1 className="prop-h1">HUNTLO ENTERPRISE<br/>COMMERCIAL PROPOSAL</h1>
          
          <div className="prop-meta-grid">
            <div className="prop-meta-col">
              <h4>Prepared For</h4>
              <p>{companyName}</p>
              <span>{industry} • {region}</span>
            </div>
            <div className="prop-meta-col">
              <h4>Prepared By</h4>
              <p>{salesOwner}</p>
              <span>Founder's Office – Growth</span>
            </div>
          </div>

          <h2 className="prop-h2">Executive Summary</h2>
          <p className="prop-p">Thank you for considering Huntlo.</p>
          <p className="prop-p">
            Based on your hiring requirements, we recommend our Enterprise Talent Intelligence Suite, designed to streamline candidate sourcing, AI-powered screening, workflow automation, and ATS/CRM integration while improving recruiter productivity and reducing manual effort.
          </p>
          
          <div className="prop-footer" style={{ marginTop: 'auto' }}>
            <div className="prop-footer-right" style={{ width: '100%' }}>
              <p>Huntlo.ai • Enterprise Proposal • Page 1</p>
            </div>
          </div>
        </div>

        {/* PAGE 2: The Plan & Commercials */}
        <div className="proposal-page">
          <h2 className="prop-h2" style={{ marginTop: 0 }}>Recommended Enterprise Plan</h2>
          
          <table className="prop-table">
            <thead>
              <tr>
                <th>Included Services</th>
                <th className="align-right">Monthly Allocation</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>Candidate Searches</td><td className="align-right">{searches.toLocaleString()}</td></tr>
              <tr><td>Candidate Unlocks</td><td className="align-right">{unlocks.toLocaleString()}</td></tr>
              <tr><td>Verified Email Reveals</td><td className="align-right">{emailReveals.toLocaleString()}</td></tr>
              <tr><td>Verified Mobile Reveals</td><td className="align-right">{mobileReveals.toLocaleString()}</td></tr>
              <tr><td>Email Outreach Credits</td><td className="align-right">{emailOutreach.toLocaleString()}</td></tr>
              <tr><td>WhatsApp Outreach Credits</td><td className="align-right">{whatsappOutreach.toLocaleString()}</td></tr>
              <tr><td>AI Automation Suite</td><td className="align-right highlight">Included</td></tr>
              <tr><td>AI Ranking & Scoring</td><td className="align-right highlight">Included</td></tr>
              <tr><td>Workflow Automation</td><td className="align-right highlight">Included</td></tr>
              <tr><td>Native ATS / CRM Integration</td><td className="align-right highlight">Included</td></tr>
              <tr><td>Recruiter Analytics</td><td className="align-right highlight">Included</td></tr>
              <tr><td>Priority Enterprise Support</td><td className="align-right highlight">Included</td></tr>
            </tbody>
          </table>

          <h2 className="prop-h2">Commercials</h2>
          <table className="prop-table">
            <thead>
              <tr>
                <th>Description</th>
                <th className="align-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Monthly Subscription</strong></td>
                <td className="align-right highlight" style={{ fontSize: 18 }}>{formatCurrency(roundedMonthlyPrice)}</td>
              </tr>
              {region === 'India' && (
                <tr>
                  <td>GST</td>
                  <td className="align-right">18% Extra</td>
                </tr>
              )}
              <tr>
                <td>Billing</td>
                <td className="align-right">Monthly</td>
              </tr>
              <tr>
                <td>Validity</td>
                <td className="align-right">30 Days</td>
              </tr>
            </tbody>
          </table>

          <h2 className="prop-h2">Additional Usage Pricing</h2>
          <table className="prop-table">
            <thead>
              <tr>
                <th>Service</th>
                <th className="align-right">Unit Price</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>Candidate Search</td><td className="align-right">{formatCurrency(regionalConfig.searchCost || 2)} / Search</td></tr>
              <tr><td>Email Reveal</td><td className="align-right">{formatCurrency(regionalConfig.emailRevealCost || 1)} / Contact</td></tr>
              <tr><td>Mobile Reveal</td><td className="align-right">{formatCurrency(regionalConfig.mobileRevealCost || 2)} / Contact</td></tr>
              <tr><td>Email Outreach</td><td className="align-right">{formatCurrency(regionalConfig.emailOutreachCost || 1)} / Email</td></tr>
              <tr><td>WhatsApp Outreach</td><td className="align-right">{formatCurrency(regionalConfig.whatsappCost || 5)} / Message</td></tr>
              <tr><td>AI Voice Calling</td><td className="align-right">{formatCurrency(regionalConfig.aiVoiceCost || 5)} / Minute*</td></tr>
            </tbody>
          </table>
          <p className="prop-p" style={{ fontSize: 12, marginTop: -16 }}>* AI Voice Calling is billed on a 30-second pulse basis.</p>
          
          <div className="prop-footer" style={{ marginTop: 'auto' }}>
            <div className="prop-footer-right" style={{ width: '100%' }}>
              <p>Huntlo.ai • Enterprise Proposal • Page 2</p>
            </div>
          </div>
        </div>

        {/* PAGE 3: Features & Notes */}
        <div className="proposal-page">
          <h2 className="prop-h2" style={{ marginTop: 0 }}>Enterprise Features</h2>
          
          <table className="prop-table">
            <thead>
              <tr>
                <th>Feature</th>
                <th className="align-right">Included</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>AI Candidate Search</td><td className="align-right highlight">✓</td></tr>
              <tr><td>Contact Discovery</td><td className="align-right highlight">✓</td></tr>
              <tr><td>AI Communication Templates</td><td className="align-right highlight">✓</td></tr>
              <tr><td>AI Ranking & Scoring</td><td className="align-right highlight">✓</td></tr>
              <tr><td>Workflow Automation</td><td className="align-right highlight">✓</td></tr>
              <tr><td>Smart Candidate Assignment</td><td className="align-right highlight">✓</td></tr>
              <tr><td>ATS / CRM Integration</td><td className="align-right highlight">✓</td></tr>
              <tr><td>Recruiter Analytics</td><td className="align-right highlight">✓</td></tr>
              <tr><td>Team Collaboration</td><td className="align-right highlight">✓</td></tr>
              <tr><td>Priority Support</td><td className="align-right highlight">✓</td></tr>
            </tbody>
          </table>

          <div className="prop-notes">
            <h4>Commercial Notes</h4>
            <ul>
              {region === 'India' && <li>Pricing is exclusive of 18% GST.</li>}
              <li>Usage beyond the included allocation will be billed as per the unit pricing.</li>
              <li>Quarterly commercial plans will be finalized based on agreed monthly consumption.</li>
              <li>Strategic discounts are available for quarterly and annual commitments.</li>
              <li>Platform configuration and integrations can be customized based on business requirements.</li>
            </ul>
          </div>

          <div className="prop-footer">
            <div className="prop-footer-left">
              <h4>{salesOwner}</h4>
              <p>Founder's Office – Growth</p>
              <p>Huntlo.ai | AI-Powered Talent Intelligence</p>
              <p>prajwal@huntlo.ai</p>
            </div>
            <div className="prop-footer-right" style={{ alignSelf: 'flex-end' }}>
              <strong>www.huntlo.ai</strong>
              <p style={{ marginTop: 8 }}>Huntlo.ai • Enterprise Proposal • Page 3</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
