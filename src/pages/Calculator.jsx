import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Calculator as CalcIcon, Plus, Info, Check, Copy, Download, Share2, AlertTriangle, FileText, ChevronRight, CheckCircle2, ShieldAlert, AlertCircle } from 'lucide-react';
import useCalculatorStore from '../store/useCalculatorStore';
import './Calculator.css';

export default function Calculator() {
  const { config, saveQuote, updateControls, updateCogs } = useCalculatorStore();
  const navigate = useNavigate();

  const [showSettings, setShowSettings] = useState(false);
  
  const [customer, setCustomer] = useState({
    companyName: '',
    contactPerson: '',
    designation: '',
    industry: '',
    location: '',
    salesOwner: '',
    dealType: 'New Business',
    expectedStartDate: '',
    contractDuration: 1,
  });

  const [commercialModel, setCommercialModel] = useState('STANDARD'); // STANDARD, CUSTOM, ENTERPRISE
  const [pricingProfileId, setPricingProfileId] = useState('standard');

  const [usage, setUsage] = useState({
    searches: 0,
    mobile: 0,
    whatsapp: 0,
    voiceMins: 0,
    seats: 2
  });

  const [customFees, setCustomFees] = useState({
    setup: 0,
    integration: 0
  });

  const [discount, setDiscount] = useState({
    type: 'absolute',
    value: 0
  });

  const [selectedPlanId, setSelectedPlanId] = useState('monthly');
  
  // Custom Override for Voice
  const [customVoiceRate, setCustomVoiceRate] = useState(0);

  const activeProfile = config.pricingProfiles.find(p => p.id === pricingProfileId) || config.pricingProfiles[0];

  const recommendedPlan = useMemo(() => {
    if (commercialModel !== 'STANDARD') return null;
    const suitablePlans = config.standardPlans.filter(p => 
      p.capacity.search >= usage.searches &&
      p.capacity.mobile >= usage.mobile &&
      p.capacity.whatsapp >= usage.whatsapp &&
      p.capacity.voice >= usage.voiceMins &&
      p.capacity.seats >= usage.seats
    );
    if (suitablePlans.length === 0) return null;
    return suitablePlans.sort((a, b) => a.price - b.price)[0];
  }, [commercialModel, usage, config.standardPlans]);

  useEffect(() => {
    if (recommendedPlan && commercialModel === 'STANDARD') {
      setSelectedPlanId(recommendedPlan.id);
    }
  }, [recommendedPlan, commercialModel]);

  const calculatePlanPrice = (plan) => {
    let voiceRate = activeProfile.voice.tier1Price;
    if (usage.voiceMins > activeProfile.voice.tier2Max) {
      voiceRate = customVoiceRate;
    } else if (usage.voiceMins > activeProfile.voice.tier1Max) {
      voiceRate = activeProfile.voice.tier2Price;
    }

    const overageSearches = Math.max(0, usage.searches - plan.capacity.search);
    const overageMobile = Math.max(0, usage.mobile - plan.capacity.mobile);
    const overageWhatsapp = Math.max(0, usage.whatsapp - plan.capacity.whatsapp);
    const overageVoice = Math.max(0, usage.voiceMins - plan.capacity.voice);

    const monthlyOverageCost = 
      (overageSearches * activeProfile.search) + 
      (overageMobile * activeProfile.mobile) + 
      (overageWhatsapp * activeProfile.whatsapp) + 
      (overageVoice * voiceRate);
    
    return plan.price + (monthlyOverageCost * plan.duration);
  };

  const pricing = useMemo(() => {
    let basePrice = 0;
    let includedUsage = { searches: 0, mobile: 0, whatsapp: 0, voice: 0, seats: 0 };
    
    let isVoiceCustom = false;
    let voiceRate = activeProfile.voice.tier1Price;
    
    if (usage.voiceMins > activeProfile.voice.tier2Max) {
      isVoiceCustom = true;
      voiceRate = customVoiceRate;
    } else if (usage.voiceMins > activeProfile.voice.tier1Max) {
      voiceRate = activeProfile.voice.tier2Price;
    }

    let contractDuration = commercialModel === 'STANDARD' ? 1 : customer.contractDuration;

    if (commercialModel === 'STANDARD') {
      const plan = config.standardPlans.find(p => p.id === selectedPlanId);
      if (plan) {
        basePrice = plan.price;
        includedUsage = plan.capacity;
        contractDuration = plan.duration;
      }
    } else {
      basePrice = customFees.setup + customFees.integration; 
    }

    const overageSearches = Math.max(0, usage.searches - includedUsage.searches);
    const overageMobile = Math.max(0, usage.mobile - includedUsage.mobile);
    const overageWhatsapp = Math.max(0, usage.whatsapp - includedUsage.whatsapp);
    const overageVoice = Math.max(0, usage.voiceMins - includedUsage.voice);
    
    let grossValue = 0;
    let additionalUsageCost = 0;

    if (commercialModel === 'STANDARD') {
      const monthlyOverageCost = 
        (overageSearches * activeProfile.search) + 
        (overageMobile * activeProfile.mobile) + 
        (overageWhatsapp * activeProfile.whatsapp) + 
        (overageVoice * voiceRate);
      additionalUsageCost = monthlyOverageCost * contractDuration;
      grossValue = basePrice + additionalUsageCost;
    } else {
      const monthlyUsageCost = 
        (usage.searches * activeProfile.search) + 
        (usage.mobile * activeProfile.mobile) + 
        (usage.whatsapp * activeProfile.whatsapp) + 
        (usage.voiceMins * voiceRate);
      grossValue = basePrice + (monthlyUsageCost * contractDuration);
    }
    
    let discountAmount = 0;
    if (discount.type === 'percentage') {
      discountAmount = grossValue * (discount.value / 100);
    } else {
      discountAmount = discount.value;
    }

    const netPrice = grossValue - discountAmount;
    const gst = netPrice * (config.controls.gstRate / 100);
    const totalPayable = netPrice + gst;
    const effectiveMonthly = contractDuration > 0 ? netPrice / contractDuration : netPrice;

    // COGS
    const monthlyCogs = 
      (usage.searches * config.cogs.search) + 
      (usage.mobile * config.cogs.mobile) + 
      (usage.whatsapp * config.cogs.whatsapp) + 
      (usage.voiceMins * config.cogs.voice);
    
    const totalCogs = (monthlyCogs * contractDuration) + config.cogs.setup + config.cogs.integration + config.cogs.support;
    
    const grossProfit = netPrice - totalCogs;
    const grossMarginPercent = netPrice > 0 ? (grossProfit / netPrice) * 100 : 0;
    const discountPercent = grossValue > 0 ? (discountAmount / grossValue) * 100 : 0;

    let approvalRequired = false;
    let approvalReasons = [];
    
    if (grossMarginPercent < config.controls.minimumMargin) {
      approvalRequired = true;
      approvalReasons.push(`Gross margin (${grossMarginPercent.toFixed(1)}%) is below minimum threshold (${config.controls.minimumMargin}%).`);
    }
    if (discountPercent > config.controls.maxSalesDiscount) {
      approvalRequired = true;
      approvalReasons.push(`Discount (${discountPercent.toFixed(1)}%) exceeds sales authority (${config.controls.maxSalesDiscount}%).`);
    }
    if (netPrice < config.controls.minimumSellingPrice) {
      approvalRequired = true;
      approvalReasons.push(`Net price (₹${netPrice.toLocaleString()}) is below minimum selling price (₹${config.controls.minimumSellingPrice.toLocaleString()}).`);
    }
    if (isVoiceCustom && customVoiceRate === 0) {
      approvalRequired = true;
      approvalReasons.push(`Voice usage exceeds standard tiers. Custom voice pricing required.`);
    }
    if (commercialModel === 'ENTERPRISE') {
      approvalRequired = true;
      approvalReasons.push(`Enterprise commercial model selected.`);
    }

    return {
      basePrice,
      grossValue,
      discountAmount,
      netPrice,
      gst,
      totalPayable,
      effectiveMonthly,
      totalCogs,
      grossProfit,
      grossMarginPercent,
      discountPercent,
      approvalRequired,
      approvalReasons,
      isVoiceCustom,
      contractDuration,
      includedUsage,
      additionalUsageCost
    };
  }, [customer, commercialModel, pricingProfileId, usage, customFees, discount, selectedPlanId, config, customVoiceRate, activeProfile]);

  const handleGenerateQuote = () => {
    const quote = {
      customer,
      commercialModel,
      usage,
      pricing,
      status: pricing.approvalRequired ? 'Pending Approval' : 'Draft',
    };
    saveQuote(quote);
    alert('Quote Generated Successfully!');
  };

  const formatCur = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);

  return (
    <div className="calc-page">
      <div className="page-header-row">
        <div>
          <h1 className="page-big-title">Internal Commercial Engine</h1>
          <p className="page-big-sub">Pricing, margin control, and quote generator.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-ghost" onClick={() => setShowSettings(!showSettings)}>
            <Settings size={14} /> Admin Controls
          </button>
        </div>
      </div>

      {showSettings && (
        <div className="calc-settings-panel">
          <div className="calc-settings-header">
            <h3>Admin Configuration</h3>
          </div>
          <div className="calc-settings-grid">
            <div className="calc-setting-group">
              <h4>Margin Controls</h4>
              <label>Target Margin (%)</label>
              <input type="number" value={config.controls.targetMargin} onChange={e => updateControls({targetMargin: Number(e.target.value)})} />
              <label>Minimum Margin (%)</label>
              <input type="number" value={config.controls.minimumMargin} onChange={e => updateControls({minimumMargin: Number(e.target.value)})} />
              <label>Max Sales Discount (%)</label>
              <input type="number" value={config.controls.maxSalesDiscount} onChange={e => updateControls({maxSalesDiscount: Number(e.target.value)})} />
            </div>
            <div className="calc-setting-group">
              <h4>Internal COGS (₹)</h4>
              <label>Search COGS</label>
              <input type="number" step="0.1" value={config.cogs.search} onChange={e => updateCogs({search: Number(e.target.value)})} />
              <label>Mobile COGS</label>
              <input type="number" step="0.1" value={config.cogs.mobile} onChange={e => updateCogs({mobile: Number(e.target.value)})} />
              <label>WhatsApp COGS</label>
              <input type="number" step="0.1" value={config.cogs.whatsapp} onChange={e => updateCogs({whatsapp: Number(e.target.value)})} />
              <label>Voice COGS / min</label>
              <input type="number" step="0.1" value={config.cogs.voice} onChange={e => updateCogs({voice: Number(e.target.value)})} />
            </div>
          </div>
        </div>
      )}

      <div className="calc-main-grid">
        <div className="calc-left-column">
          
          <div className="calc-panel">
            <div className="calc-panel-header">1. Customer Details</div>
            <div className="calc-form-grid">
              <div className="calc-form-group">
                <label>Company Name</label>
                <input type="text" value={customer.companyName} onChange={e => setCustomer({...customer, companyName: e.target.value})} />
              </div>
              <div className="calc-form-group">
                <label>Industry</label>
                <input type="text" value={customer.industry} onChange={e => setCustomer({...customer, industry: e.target.value})} />
              </div>
              <div className="calc-form-group">
                <label>Sales Owner</label>
                <input type="text" value={customer.salesOwner} onChange={e => setCustomer({...customer, salesOwner: e.target.value})} />
              </div>
              {commercialModel !== 'STANDARD' && (
                <div className="calc-form-group">
                  <label>Contract Duration</label>
                  <select 
                    value={customer.contractDuration} 
                    onChange={e => setCustomer({...customer, contractDuration: Number(e.target.value)})}
                  >
                    <option value={1}>1 Month</option>
                    <option value={3}>3 Months</option>
                    <option value={6}>6 Months</option>
                    <option value={12}>12 Months</option>
                    <option value={24}>24 Months</option>
                    <option value={36}>36 Months</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          <div className="calc-panel">
            <div className="calc-panel-header">2. Commercial Model</div>
            <div className="calc-model-selector">
              <button className={`model-btn ${commercialModel === 'STANDARD' ? 'active' : ''}`} onClick={() => setCommercialModel('STANDARD')}>
                Standard Plan
              </button>
              <button className={`model-btn ${commercialModel === 'CUSTOM' ? 'active' : ''}`} onClick={() => setCommercialModel('CUSTOM')}>
                Custom / High-Volume
              </button>
              <button className={`model-btn ${commercialModel === 'ENTERPRISE' ? 'active' : ''}`} onClick={() => setCommercialModel('ENTERPRISE')}>
                Enterprise
              </button>
            </div>
            {(commercialModel === 'CUSTOM' || commercialModel === 'ENTERPRISE') && (
              <div className="calc-form-group" style={{marginTop: 16}}>
                <label>Pricing Profile</label>
                <select value={pricingProfileId} onChange={e => setPricingProfileId(e.target.value)}>
                  {config.pricingProfiles.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="calc-panel">
            <div className="calc-panel-header">3. Customer Usage Requirement (Monthly)</div>
            <div className="calc-req-row">
              <label>AI Candidate Searches</label>
              <input type="number" value={usage.searches} onChange={e => setUsage({...usage, searches: Number(e.target.value)})} />
            </div>
            <div className="calc-req-row">
              <label>Verified Mobile Contacts</label>
              <input type="number" value={usage.mobile} onChange={e => setUsage({...usage, mobile: Number(e.target.value)})} />
            </div>
            <div className="calc-req-row">
              <label>WhatsApp Conversations</label>
              <input type="number" value={usage.whatsapp} onChange={e => setUsage({...usage, whatsapp: Number(e.target.value)})} />
            </div>
            <div className="calc-req-row">
              <label>AI Voice Minutes</label>
              <input type="number" value={usage.voiceMins} onChange={e => setUsage({...usage, voiceMins: Number(e.target.value)})} />
            </div>
            <div className="calc-req-row">
              <label>Team Seats</label>
              <input type="number" value={usage.seats} onChange={e => setUsage({...usage, seats: Number(e.target.value)})} />
            </div>
            {pricing.isVoiceCustom && (
              <div className="calc-alert warning">
                <AlertTriangle size={16} /> Custom Voice Pricing Required. Enter approved rate:
                <input type="number" step="0.1" value={customVoiceRate} onChange={e => setCustomVoiceRate(Number(e.target.value))} style={{width: 80, marginLeft: 12}} />
              </div>
            )}
          </div>

          {commercialModel === 'STANDARD' && (
            <div className="calc-panel">
              <div className="calc-panel-header">4. Select Standard Plan</div>
              <div className="calc-plans-grid">
                {config.standardPlans.map(plan => {
                  const isRecommended = recommendedPlan && recommendedPlan.id === plan.id;
                  return (
                    <div 
                      key={plan.id} 
                      className={`calc-plan-card ${selectedPlanId === plan.id ? 'selected' : ''} ${isRecommended ? 'recommended' : ''}`}
                      onClick={() => setSelectedPlanId(plan.id)}
                    >
                      {isRecommended && <div className="plan-badge">RECOMMENDED</div>}
                      <div className="plan-name">{plan.name}</div>
                      <div className="plan-price">{formatCur(calculatePlanPrice(plan))}</div>
                      <div className="plan-dur">{plan.duration} Month{plan.duration > 1 ? 's' : ''}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="calc-panel">
            <div className="calc-panel-header">5. Discount</div>
            <div className="calc-discount-controls">
              <select value={discount.type} onChange={e => setDiscount({...discount, type: e.target.value})}>
                <option value="absolute">Absolute Discount (₹)</option>
                <option value="percentage">Percentage Discount (%)</option>
              </select>
              <input type="number" value={discount.value} onChange={e => setDiscount({...discount, value: Number(e.target.value)})} />
            </div>
          </div>

        </div>

        <div className="calc-right-column">
          <div className="calc-summary-panel">
            <div className="calc-panel-header" style={{marginBottom: 16}}>Commercial Summary</div>
            
            <div className="summary-list">
              <div className="summary-item">
                <span>Contract Duration</span>
                <strong>{pricing.contractDuration} Month{pricing.contractDuration > 1 ? 's' : ''}</strong>
              </div>
              <div className="summary-item">
                <span>Gross Value</span>
                <strong>{formatCur(pricing.grossValue)}</strong>
              </div>
              <div className="summary-item text-success">
                <span>Discount</span>
                <strong>- {formatCur(pricing.discountAmount)}</strong>
              </div>
              <div className="summary-item text-primary" style={{fontSize: 16, fontWeight: 700, borderTop: '1px solid var(--bg-border)', paddingTop: 12}}>
                <span>Net Price (excl. GST)</span>
                <strong>{formatCur(pricing.netPrice)}</strong>
              </div>
              <div className="summary-item text-muted">
                <span>GST ({config.controls.gstRate}%)</span>
                <strong>{formatCur(pricing.gst)}</strong>
              </div>
              <div className="summary-item highlight">
                <span>Final Customer Payable</span>
                <strong>{formatCur(pricing.totalPayable)}</strong>
              </div>
            </div>

            <div className="internal-margin-box">
              <div className="internal-title"><ShieldAlert size={14}/> INTERNAL COMMERCIALS (HIDDEN)</div>
              <div className="summary-item">
                <span>Estimated COGS</span>
                <strong>{formatCur(pricing.totalCogs)}</strong>
              </div>
              <div className="summary-item">
                <span>Gross Margin</span>
                <strong className={pricing.grossMarginPercent >= config.controls.targetMargin ? 'text-success' : pricing.grossMarginPercent >= config.controls.minimumMargin ? 'text-warning' : 'text-danger'}>
                  {pricing.grossMarginPercent.toFixed(1)}%
                </strong>
              </div>
            </div>

            {pricing.approvalRequired ? (
              <div className="approval-box required">
                <div className="appr-title"><AlertCircle size={16}/> APPROVAL REQUIRED</div>
                <ul>
                  {pricing.approvalReasons.map((reason, i) => (
                    <li key={i}>{reason}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="approval-box approved">
                <div className="appr-title"><CheckCircle2 size={16}/> APPROVED TO QUOTE</div>
                <p>Margin and discount within authority.</p>
              </div>
            )}

            <button 
              className="btn btn-primary" 
              style={{width: '100%', marginTop: 24, padding: '16px', fontSize: 16, fontWeight: 700}}
              onClick={handleGenerateQuote}
            >
              GENERATE QUOTE
            </button>
            
            <div className="calc-actions-secondary">
              <button className="btn btn-ghost"><FileText size={14} /> Save Draft</button>
              <button className="btn btn-ghost"><Copy size={14} /> Duplicate</button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
