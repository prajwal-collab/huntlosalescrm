import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Settings, Calculator as CalcIcon, Plus, Info, Check, Copy, Download, Share2, 
  AlertTriangle, FileText, ChevronRight, CheckCircle2, ShieldAlert, AlertCircle,
  Building, User, Briefcase, Search, Smartphone, MessageSquare, Mic, Users, 
  Calendar, ChevronDown, ChevronUp, Tag
} from 'lucide-react';
import useCalculatorStore from '../store/useCalculatorStore';
import './Calculator.css';

export default function Calculator() {
  const { config, saveQuote, updateControls, updateCogs } = useCalculatorStore();
  const navigate = useNavigate();

  const [showSettings, setShowSettings] = useState(false);
  const [showInternalMargins, setShowInternalMargins] = useState(false);
  
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
    quoteType: 'White Collar',
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
  const [quoteGenerated, setQuoteGenerated] = useState(false);
  
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

  // Reset quote generated state when inputs change
  useEffect(() => {
    setQuoteGenerated(false);
  }, [customer, commercialModel, pricingProfileId, usage, customFees, discount, selectedPlanId, customVoiceRate]);

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

    const overageSearches = Math.max(0, usage.searches - (includedUsage.search || includedUsage.searches || 0));
    const overageMobile = Math.max(0, usage.mobile - (includedUsage.mobile || 0));
    const overageWhatsapp = Math.max(0, usage.whatsapp - (includedUsage.whatsapp || 0));
    const overageVoice = Math.max(0, usage.voiceMins - (includedUsage.voice || 0));
    
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
    setQuoteGenerated(true);
  };

  const handleDownloadQuote = () => {
    window.print(); // Simple fallback for downloading/printing PDF
  };

  const handleCopyWhatsApp = () => {
    const isStandard = commercialModel === 'STANDARD';
    const planName = isStandard ? config.standardPlans.find(p => p.id === selectedPlanId)?.name : 'Custom Package';
    
    const multiplier = isStandard ? pricing.contractDuration : 1;
    
    const includedSearches = isStandard ? (pricing.includedUsage.search || pricing.includedUsage.searches || 0) * multiplier : usage.searches;
    const includedMobile = isStandard ? (pricing.includedUsage.mobile || 0) * multiplier : usage.mobile;
    const includedWhatsapp = isStandard ? (pricing.includedUsage.whatsapp || 0) * multiplier : usage.whatsapp;
    const includedVoice = isStandard ? (pricing.includedUsage.voice || 0) * multiplier : usage.voiceMins;
    const includedSeats = pricing.includedUsage.seats || 0;

    const msg = `*Huntlo Commercial Proposal*\n\nHi ${customer.companyName || 'Team'},\n\nHere is the proposed commercial plan for your requirements:\n\n*Plan:* ${planName}\n*Duration:* ${pricing.contractDuration} Month(s)\n*Total Included Credits:*\n- ${includedSearches} Searches\n- ${includedMobile} Mobile Contacts\n- ${includedWhatsapp} WhatsApp Convos\n- ${includedVoice} Voice Mins\n- ${includedSeats} Seats\n\n*Total Value:* ${formatCur(pricing.grossValue)}\n*Discount:* ${formatCur(pricing.discountAmount)}\n*Net Price (excl. GST):* ${formatCur(pricing.netPrice)}\n\n*Final Payable (incl. 18% GST):* ${formatCur(pricing.totalPayable)}\n\nLet me know if you have any questions!\n\nBest,\n${customer.salesOwner || 'Huntlo Team'}`;
    navigator.clipboard.writeText(msg);
    alert('WhatsApp message copied to clipboard!');
  };

  const formatCur = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);

  return (
    <div className="calc-page">
      <div className="page-header-row">
        <div>
          <h1 className="page-big-title">Commercial Engine</h1>
          <p className="page-big-sub">Quickly price deals, check margins, and generate quotes.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-ghost" onClick={() => setShowSettings(!showSettings)}>
            <Settings size={18} /> {showSettings ? 'Close Admin Controls' : 'Admin Controls'}
          </button>
        </div>
      </div>

      {showSettings && (
        <div className="calc-settings-panel">
          <div className="calc-settings-header" style={{marginBottom: 20}}>
            <h3 style={{margin: 0, display: 'flex', alignItems: 'center', gap: 8, fontSize: 18, color: '#0f172a'}}>
              <Settings size={20} className="text-primary"/> Admin Configuration
            </h3>
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
            <div className="calc-panel-header">
              <div className="panel-icon-wrap"><Building size={18}/></div>
              1. Deal Information
            </div>
            <div className="calc-form-grid">
              <div className="calc-form-group">
                <label>Company Name</label>
                <div className="input-with-icon">
                  <Building size={16} />
                  <input type="text" placeholder="e.g. Acme Corp" value={customer.companyName} onChange={e => setCustomer({...customer, companyName: e.target.value})} />
                </div>
              </div>
              <div className="calc-form-group">
                <label>Industry</label>
                <div className="input-with-icon">
                  <Briefcase size={16} />
                  <input type="text" placeholder="e.g. SaaS" value={customer.industry} onChange={e => setCustomer({...customer, industry: e.target.value})} />
                </div>
              </div>
              <div className="calc-form-group">
                <label>Sales Owner</label>
                <div className="input-with-icon">
                  <User size={16} />
                  <input type="text" placeholder="e.g. John Doe" value={customer.salesOwner} onChange={e => setCustomer({...customer, salesOwner: e.target.value})} />
                </div>
              </div>
              <div className="calc-form-group">
                <label>Quote Type</label>
                <div className="input-with-icon">
                  <Briefcase size={16} />
                  <select 
                    value={customer.quoteType} 
                    onChange={e => {
                      const newType = e.target.value;
                      setCustomer({...customer, quoteType: newType});
                      if (newType === 'Blue Collar') {
                        setUsage(prev => ({...prev, searches: 0, mobile: 0}));
                      }
                    }}
                  >
                    <option value="White Collar">White Collar</option>
                    <option value="Blue Collar">Blue Collar</option>
                  </select>
                </div>
              </div>
              {commercialModel !== 'STANDARD' && (
                <div className="calc-form-group">
                  <label>Contract Duration</label>
                  <div className="input-with-icon">
                    <Calendar size={16} />
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
                </div>
              )}
            </div>
          </div>

          <div className="calc-panel">
            <div className="calc-panel-header">
              <div className="panel-icon-wrap"><CalcIcon size={18}/></div>
              2. Commercial Model
            </div>
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
              <div className="calc-form-group" style={{marginTop: 20}}>
                <label>Pricing Profile</label>
                <div className="input-with-icon">
                  <Tag size={16} />
                  <select value={pricingProfileId} onChange={e => setPricingProfileId(e.target.value)}>
                    {config.pricingProfiles.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          <div className="calc-panel">
            <div className="calc-panel-header">
              <div className="panel-icon-wrap"><Search size={18}/></div>
              3. Usage Requirements (Monthly)
            </div>
            <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
              {customer.quoteType === 'White Collar' && (
                <>
                  <div className="calc-req-row">
                    <div className="calc-req-label"><Search size={16} /> AI Candidate Searches</div>
                    <input type="number" min="0" value={usage.searches} onChange={e => setUsage({...usage, searches: Number(e.target.value)})} />
                  </div>
                  <div className="calc-req-row">
                    <div className="calc-req-label"><Smartphone size={16} /> Verified Mobile Contacts</div>
                    <input type="number" min="0" value={usage.mobile} onChange={e => setUsage({...usage, mobile: Number(e.target.value)})} />
                  </div>
                </>
              )}
              <div className="calc-req-row">
                <div className="calc-req-label"><MessageSquare size={16} /> WhatsApp Conversations</div>
                <input type="number" min="0" value={usage.whatsapp} onChange={e => setUsage({...usage, whatsapp: Number(e.target.value)})} />
              </div>
              <div className="calc-req-row">
                <div className="calc-req-label"><Mic size={16} /> AI Voice Minutes</div>
                <input type="number" min="0" value={usage.voiceMins} onChange={e => setUsage({...usage, voiceMins: Number(e.target.value)})} />
              </div>
              <div className="calc-req-row">
                <div className="calc-req-label"><Users size={16} /> Team Seats</div>
                <input type="number" min="0" value={usage.seats} onChange={e => setUsage({...usage, seats: Number(e.target.value)})} />
              </div>
            </div>

            {pricing.isVoiceCustom && (
              <div className="calc-alert warning">
                <AlertTriangle size={18} />
                <div style={{display: 'flex', alignItems: 'center', width: '100%', gap: 12}}>
                  <span>Custom Voice Pricing Required (Enter rate / min):</span>
                  <input type="number" step="0.1" value={customVoiceRate} onChange={e => setCustomVoiceRate(Number(e.target.value))} style={{width: 80, padding: 8, borderRadius: 6, border: '1px solid #fde68a'}} />
                </div>
              </div>
            )}
          </div>

          {commercialModel === 'STANDARD' && (
            <div className="calc-panel">
              <div className="calc-panel-header">
                <div className="panel-icon-wrap"><CheckCircle2 size={18}/></div>
                4. Select Standard Plan
              </div>
              <div className="calc-plans-grid">
                {config.standardPlans.map(plan => {
                  const isRecommended = recommendedPlan && recommendedPlan.id === plan.id;
                  return (
                    <div 
                      key={plan.id} 
                      className={`calc-plan-card ${selectedPlanId === plan.id ? 'selected' : ''} ${isRecommended ? 'recommended' : ''}`}
                      onClick={() => {
                        setSelectedPlanId(plan.id);
                        setUsage({
                          searches: customer.quoteType === 'White Collar' ? plan.capacity.search : 0,
                          mobile: customer.quoteType === 'White Collar' ? plan.capacity.mobile : 0,
                          whatsapp: plan.capacity.whatsapp,
                          voiceMins: plan.capacity.voice,
                          seats: plan.capacity.seats
                        });
                      }}
                    >
                      {isRecommended && <div className="plan-badge">BEST MATCH</div>}
                      <div className="plan-name">{plan.name}</div>
                      <div className="plan-price">{formatCur(calculatePlanPrice(plan))}</div>
                      <div className="plan-dur">{plan.duration} Month{plan.duration > 1 ? 's' : ''} Commitment</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="calc-panel">
            <div className="calc-panel-header">
              <div className="panel-icon-wrap"><Tag size={18}/></div>
              5. Final Discount
            </div>
            <div className="calc-discount-controls">
              <div className="input-with-icon" style={{ flex: 1.5 }}>
                <Tag size={16} />
                <select value={discount.type} onChange={e => setDiscount({...discount, type: e.target.value})}>
                  <option value="absolute">Absolute Discount (₹)</option>
                  <option value="percentage">Percentage Discount (%)</option>
                </select>
              </div>
              <div className="input-with-icon" style={{ flex: 1 }}>
                {discount.type === 'percentage' ? <Percent size={16} /> : <span style={{position:'absolute', left:14, color:'#94a3b8', fontWeight: 600}}>₹</span>}
                <input type="number" min="0" value={discount.value} onChange={e => setDiscount({...discount, value: Number(e.target.value)})} />
              </div>
            </div>
          </div>

        </div>

        <div className="calc-right-column">
          <div className="calc-summary-panel">
            <h3 style={{margin: '0 0 24px 0', fontSize: 20, fontWeight: 800}}>Invoice Summary</h3>
            
            <div className="summary-list">
              <div className="summary-item">
                <span>Contract Duration</span>
                <strong>{pricing.contractDuration} Month{pricing.contractDuration > 1 ? 's' : ''}</strong>
              </div>
              <div className="summary-divider"></div>
              <div className="summary-item">
                <span>Gross Value</span>
                <strong>{formatCur(pricing.grossValue)}</strong>
              </div>
              <div className="summary-item text-success">
                <span>Total Discount</span>
                <strong>- {formatCur(pricing.discountAmount)}</strong>
              </div>
              <div className="summary-divider"></div>
              <div className="summary-item text-primary" style={{marginTop: 8}}>
                <span>Net Price (excl. GST)</span>
                <strong>{formatCur(pricing.netPrice)}</strong>
              </div>
              <div className="summary-item">
                <span>GST ({config.controls.gstRate}%)</span>
                <strong>{formatCur(pricing.gst)}</strong>
              </div>
              <div className="summary-item highlight">
                <span>Final Payable</span>
                <strong>{formatCur(pricing.totalPayable)}</strong>
              </div>
            </div>

            <div 
              className="internal-margins-toggle"
              onClick={() => setShowInternalMargins(!showInternalMargins)}
            >
              <span style={{display: 'flex', alignItems: 'center', gap: 8}}>
                <ShieldAlert size={16} className="text-warning" />
                Sales Insights & Margins
              </span>
              {showInternalMargins ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>

            {showInternalMargins && (
              <div className="internal-margin-box">
                <div className="internal-title"><ShieldAlert size={14}/> CONFIDENTIAL — DO NOT SHARE</div>
                <div className="summary-list" style={{gap: 12}}>
                  <div className="summary-item" style={{fontSize: 14}}>
                    <span>Estimated COGS</span>
                    <strong>{formatCur(pricing.totalCogs)}</strong>
                  </div>
                  <div className="summary-item" style={{fontSize: 14}}>
                    <span>Gross Profit</span>
                    <strong>{formatCur(pricing.grossProfit)}</strong>
                  </div>
                  <div className="summary-item" style={{fontSize: 14}}>
                    <span>Margin %</span>
                    <strong className={pricing.grossMarginPercent >= config.controls.targetMargin ? 'text-success' : pricing.grossMarginPercent >= config.controls.minimumMargin ? 'text-warning' : 'text-danger'}>
                      {pricing.grossMarginPercent.toFixed(1)}%
                    </strong>
                  </div>
                </div>
              </div>
            )}

            {pricing.approvalRequired ? (
              <div className="approval-box required">
                <div className="appr-title"><AlertCircle size={18}/> Approval Required</div>
                <ul>
                  {pricing.approvalReasons.map((reason, i) => (
                    <li key={i} style={{marginBottom: 4}}>{reason}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="approval-box approved">
                <div className="appr-title"><CheckCircle2 size={18}/> Approved to Quote</div>
                <p>Metrics within authorized sales limits.</p>
              </div>
            )}

            {quoteGenerated ? (
              <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="calc-alert" style={{ background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', marginBottom: 8 }}>
                   <CheckCircle2 size={20} /> Quote Created Successfully!
                </div>
                <button className="btn btn-primary" onClick={handleDownloadQuote}>
                  <Download size={18} /> Download Proposal (PDF)
                </button>
                <button className="btn btn-ghost" style={{border: '1px solid #e2e8f0'}} onClick={handleCopyWhatsApp}>
                  <Share2 size={18} /> Share via WhatsApp
                </button>
                <button className="btn btn-ghost" onClick={() => setQuoteGenerated(false)}>
                  Modify Quote
                </button>
              </div>
            ) : (
              <button 
                className="btn btn-primary" 
                style={{width: '100%', marginTop: 32, padding: '16px', fontSize: 16}}
                onClick={handleGenerateQuote}
              >
                Generate Final Quote
              </button>
            )}
            
            <div className="calc-actions-secondary">
              <button className="btn btn-ghost"><FileText size={16} /> Save as Draft</button>
              <button className="btn btn-ghost"><Copy size={16} /> Duplicate</button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
