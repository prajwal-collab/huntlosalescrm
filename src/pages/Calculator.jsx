import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Calculator as CalcIcon, Plus, Info, Check, Copy, Download, Share2 } from 'lucide-react';
import useCalculatorStore from '../store/useCalculatorStore';
import './Calculator.css';

export default function Calculator() {
  const { config, updateConfig, updateRegionalConfig } = useCalculatorStore();
  const navigate = useNavigate();
  
  // Local state for UI
  const [showSettings, setShowSettings] = useState(false);
  
  // Customer Details State
  const [companyName, setCompanyName] = useState('');
  const [region, setRegion] = useState('India');
  const [industry, setIndustry] = useState('');
  const [proposalName, setProposalName] = useState('');
  const [salesOwner, setSalesOwner] = useState('');

  // Requirements State
  const [searches, setSearches] = useState(0);
  const [unlocks, setUnlocks] = useState(0); // Optional input, doesn't seem to have a base cost in the rules? Wait, unlocks might be same as search cost? I will not add cost for unlock right now unless specified, or maybe unlocks are free / included. The prompt doesn't list unlock cost. Let's keep it as 0 cost for now.
  const [emailReveals, setEmailReveals] = useState(0);
  const [mobileReveals, setMobileReveals] = useState(0);
  const [emailOutreach, setEmailOutreach] = useState(0);
  const [whatsappOutreach, setWhatsappOutreach] = useState(0);
  const [aiCallsMins, setAiCallsMins] = useState(0);
  const [customDiscount, setCustomDiscount] = useState(0);

  // Pricing Logic
  const pricingRegion = region === 'India' ? 'india' : 'international';
  const regionalConfig = config[pricingRegion];

  const internalCost = useMemo(() => {
    return (
      (searches * regionalConfig.searchCost) +
      (emailReveals * regionalConfig.emailRevealCost) +
      (mobileReveals * regionalConfig.mobileRevealCost) +
      (emailOutreach * regionalConfig.emailOutreachCost) +
      (whatsappOutreach * regionalConfig.whatsappCost) +
      (aiCallsMins * regionalConfig.aiVoiceCost)
    );
  }, [searches, emailReveals, mobileReveals, emailOutreach, whatsappOutreach, aiCallsMins, regionalConfig]);

  // Formula: Selling Price = Internal Cost / (1 - Margin)
  const exactMonthlyPrice = useMemo(() => {
    if (config.margin >= 100) return internalCost * 2; // Fallback
    const marginDec = config.margin / 100;
    return internalCost / (1 - marginDec);
  }, [internalCost, config.margin]);

  // Round to nearest 999 after applying custom quote discount
  const roundedMonthlyPrice = useMemo(() => {
    if (exactMonthlyPrice <= 0) return 0;
    let base = exactMonthlyPrice;
    if (customDiscount > 0) {
      base = base * (1 - (customDiscount / 100));
    }
    const roundedThousand = Math.round(base / 1000) * 1000;
    return roundedThousand > 0 ? roundedThousand - 1 : 0;
  }, [exactMonthlyPrice, customDiscount]);

  const quarterlyPrice = useMemo(() => {
    const base = roundedMonthlyPrice * 3;
    const discount = (config.quarterlyDiscount / 100) * base;
    return base - discount;
  }, [roundedMonthlyPrice, config.quarterlyDiscount]);

  const annualPrice = useMemo(() => {
    const base = roundedMonthlyPrice * 12;
    const discount = (config.annualDiscount / 100) * base;
    return base - discount;
  }, [roundedMonthlyPrice, config.annualDiscount]);

  const estimatedArr = roundedMonthlyPrice * 12;

  const handleGenerateProposal = () => {
    navigate('/proposal/preview', {
      state: {
        companyName,
        region,
        industry,
        proposalName,
        salesOwner,
        searches,
        unlocks,
        emailReveals,
        mobileReveals,
        emailOutreach,
        whatsappOutreach,
        aiCallsMins,
        roundedMonthlyPrice,
        quarterlyPrice,
        annualPrice,
        regionalConfig
      }
    });
  };

  // Format currency
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  return (
    <div className="calc-page">
      {/* Header */}
      <div className="page-header-row">
        <div>
          <h1 className="page-big-title">Enterprise Pricing Calculator</h1>
          <p className="page-big-sub">Instantly generate accurate enterprise quotations.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-ghost" onClick={() => setShowSettings(!showSettings)}>
            <Settings size={14} /> {showSettings ? 'Hide Settings' : 'Config Settings'}
          </button>
          <button className="btn btn-primary" onClick={handleGenerateProposal}>
            <Download size={14} /> Generate PDF
          </button>
        </div>
      </div>

      {showSettings && (
        <div className="calc-settings-panel">
          <div className="calc-settings-header">
            <h3>Admin Pricing Configuration</h3>
            <p>Changes apply immediately to all active calculations.</p>
          </div>
          <div className="calc-settings-grid">
            <div className="calc-setting-group">
              <h4>Margin & Discounts</h4>
              <label>Target Gross Margin (%)</label>
              <input type="number" value={config.margin} onChange={e => updateConfig({ margin: Number(e.target.value) })} />
              
              <label>Quarterly Discount (%)</label>
              <input type="number" value={config.quarterlyDiscount} onChange={e => updateConfig({ quarterlyDiscount: Number(e.target.value) })} />
              
              <label>Annual Discount (%)</label>
              <input type="number" value={config.annualDiscount} onChange={e => updateConfig({ annualDiscount: Number(e.target.value) })} />
            </div>

            <div className="calc-setting-group">
              <h4>India Region Costs (₹)</h4>
              <label>Search Cost</label>
              <input type="number" value={config.india.searchCost} onChange={e => updateRegionalConfig('india', { searchCost: Number(e.target.value) })} />
              <label>WhatsApp Cost</label>
              <input type="number" value={config.india.whatsappCost} onChange={e => updateRegionalConfig('india', { whatsappCost: Number(e.target.value) })} />
              <label>AI Voice Cost (/min)</label>
              <input type="number" value={config.india.aiVoiceCost} onChange={e => updateRegionalConfig('india', { aiVoiceCost: Number(e.target.value) })} />
            </div>

            <div className="calc-setting-group">
              <h4>International (USA/UAE) Costs (₹)</h4>
              <label>Search Cost</label>
              <input type="number" value={config.international.searchCost} onChange={e => updateRegionalConfig('international', { searchCost: Number(e.target.value) })} />
              <label>WhatsApp Cost</label>
              <input type="number" value={config.international.whatsappCost} onChange={e => updateRegionalConfig('international', { whatsappCost: Number(e.target.value) })} />
              <label>AI Voice Cost (/min)</label>
              <input type="number" value={config.international.aiVoiceCost} onChange={e => updateRegionalConfig('international', { aiVoiceCost: Number(e.target.value) })} />
            </div>
          </div>
        </div>
      )}

      <div className="calc-main-grid">
        {/* Left Panel: Customer Details */}
        <div className="calc-panel">
          <div className="calc-panel-header">Customer Details</div>
          <div className="calc-form-group">
            <label>Company Name</label>
            <input type="text" placeholder="e.g. Acme Corp" value={companyName} onChange={e => setCompanyName(e.target.value)} />
          </div>
          <div className="calc-form-group">
            <label>Country / Region</label>
            <select value={region} onChange={e => setRegion(e.target.value)}>
              <option value="India">India</option>
              <option value="USA">USA</option>
              <option value="UAE">UAE</option>
            </select>
          </div>
          <div className="calc-form-group">
            <label>Industry</label>
            <input type="text" placeholder="e.g. Technology" value={industry} onChange={e => setIndustry(e.target.value)} />
          </div>
          <div className="calc-form-group">
            <label>Proposal Name</label>
            <input type="text" placeholder="e.g. Enterprise Q3" value={proposalName} onChange={e => setProposalName(e.target.value)} />
          </div>
          <div className="calc-form-group">
            <label>Sales Owner</label>
            <input type="text" placeholder="Owner Name" value={salesOwner} onChange={e => setSalesOwner(e.target.value)} />
          </div>
        </div>

        {/* Center Panel: Requirements */}
        <div className="calc-panel">
          <div className="calc-panel-header">Customer Requirements (Monthly)</div>
          
          <div className="calc-req-row">
            <label>Candidate Searches</label>
            <input type="number" value={searches} onChange={e => setSearches(Number(e.target.value))} />
          </div>
          <div className="calc-req-row">
            <label>Candidate Unlocks</label>
            <input type="number" value={unlocks} onChange={e => setUnlocks(Number(e.target.value))} />
          </div>
          <div className="calc-req-row">
            <label>Verified Email Reveals</label>
            <input type="number" value={emailReveals} onChange={e => setEmailReveals(Number(e.target.value))} />
          </div>
          <div className="calc-req-row">
            <label>Verified Mobile Reveals</label>
            <input type="number" value={mobileReveals} onChange={e => setMobileReveals(Number(e.target.value))} />
          </div>
          <div className="calc-req-row">
            <label>Email Outreach</label>
            <input type="number" value={emailOutreach} onChange={e => setEmailOutreach(Number(e.target.value))} />
          </div>
          <div className="calc-req-row">
            <label>WhatsApp Outreach</label>
            <input type="number" value={whatsappOutreach} onChange={e => setWhatsappOutreach(Number(e.target.value))} />
          </div>
          <div className="calc-req-row">
            <label>AI Voice Calling (Mins)</label>
            <input type="number" value={aiCallsMins} onChange={e => setAiCallsMins(Number(e.target.value))} />
          </div>
        </div>

        {/* Right Panel: Live Summary */}
        <div className="calc-panel calc-summary-panel">
          <div className="calc-panel-header">Live Quote Summary</div>
          
          <div className="calc-summary-metrics">
            <div className="calc-metric">
              <span>Internal Variable Cost</span>
              <strong>{formatCurrency(internalCost)}</strong>
            </div>
            <div className="calc-metric">
              <span>Gross Margin</span>
              <strong>{config.margin}%</strong>
            </div>
            <div className="calc-metric highlight-metric">
              <span>Estimated ARR</span>
              <strong>{formatCurrency(estimatedArr)}</strong>
            </div>
          </div>

          <div className="calc-req-row" style={{ marginTop: -16, marginBottom: 24, padding: '16px', background: 'rgba(59, 130, 246, 0.05)', borderRadius: 10, border: '1px solid rgba(59, 130, 246, 0.1)' }}>
            <label style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>Apply Additional Quote Discount (%)</label>
            <input type="number" value={customDiscount} onChange={e => setCustomDiscount(Number(e.target.value))} style={{ borderColor: 'var(--accent-blue)' }} />
          </div>

          <div className="calc-pricing-cards">
            {/* Monthly */}
            <div className="calc-price-card">
              <div className="cpc-header">Monthly Plan</div>
              <div className="cpc-price">{formatCurrency(roundedMonthlyPrice)}<span>/mo</span></div>
              <div className="cpc-footer">Billed Monthly</div>
            </div>

            {/* Quarterly */}
            <div className="calc-price-card recommended">
              <div className="cpc-badge">Recommended</div>
              <div className="cpc-header">Quarterly Plan</div>
              <div className="cpc-price">{formatCurrency(quarterlyPrice)}<span>/qtr</span></div>
              <div className="cpc-footer">
                <span className="discount-tag">Save {config.quarterlyDiscount}%</span> 
                (Avg {formatCurrency(quarterlyPrice / 3)}/mo)
              </div>
            </div>

            {/* Annual */}
            <div className="calc-price-card">
              <div className="cpc-header">Annual Plan</div>
              <div className="cpc-price">{formatCurrency(annualPrice)}<span>/yr</span></div>
              <div className="cpc-footer">
                <span className="discount-tag">Save {config.annualDiscount}%</span> 
                (Avg {formatCurrency(annualPrice / 12)}/mo)
              </div>
            </div>
          </div>

          <div className="calc-actions">
            <button className="btn btn-outline" style={{ flex: 1 }}><Copy size={14} /> Copy Pricing</button>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleGenerateProposal}><Share2 size={14} /> Send to Proposal</button>
          </div>
        </div>
      </div>
    </div>
  );
}
