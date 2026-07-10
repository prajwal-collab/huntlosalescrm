import { useState, useMemo } from 'react';
import { Copy, Plus, ExternalLink, Download } from 'lucide-react';
import './UTMGenerator.css';

// Initial Mock Data
const INITIAL_LINKS = [
  {
    id: '1',
    assetName: 'Q3 Product Webinar',
    purpose: 'Registration Drive',
    baseUrl: 'https://huntlo.com/webinars/q3-product',
    source: 'linkedin',
    medium: 'social',
    campaign: 'q3_launch',
    content: 'video_ad_1',
    dateCreated: '2026-07-01',
    clicks: 1450,
    conversions: 112,
  },
  {
    id: '2',
    assetName: 'Cold Email Playbook',
    purpose: 'Lead Gen Ebook',
    baseUrl: 'https://huntlo.com/resources/cold-email-playbook',
    source: 'google',
    medium: 'cpc',
    campaign: 'ebook_search',
    content: 'ad_copy_a',
    dateCreated: '2026-07-02',
    clicks: 3200,
    conversions: 450,
  },
  {
    id: '3',
    assetName: 'Summer Promo',
    purpose: 'Sales Discount',
    baseUrl: 'https://huntlo.com/pricing',
    source: 'email',
    medium: 'newsletter',
    campaign: 'summer_promo_26',
    content: 'hero_button',
    dateCreated: '2026-07-03',
    clicks: 890,
    conversions: 24,
  },
  {
    id: '4',
    assetName: 'Feature Announcement',
    purpose: 'Blog Traffic',
    baseUrl: 'https://huntlo.com/blog/new-pipeline-view',
    source: 'twitter',
    medium: 'social',
    campaign: 'product_updates',
    content: 'image_post',
    dateCreated: '2026-07-04',
    clicks: 650,
    conversions: 15,
  },
  {
    id: '5',
    assetName: 'Partner Webinar',
    purpose: 'Co-marketing',
    baseUrl: 'https://huntlo.com/webinars/partner-sales',
    source: 'partner_newsletter',
    medium: 'email',
    campaign: 'partner_q3',
    content: 'text_link',
    dateCreated: '2026-07-05',
    clicks: 420,
    conversions: 85,
  },
  {
    id: '6',
    assetName: 'SEO Landing Page',
    purpose: 'Organic Leads',
    baseUrl: 'https://huntlo.com/crm-for-startups',
    source: 'google',
    medium: 'organic',
    campaign: 'seo_startups',
    content: '',
    dateCreated: '2026-07-06',
    clicks: 2100,
    conversions: 120,
  },
  {
    id: '7',
    assetName: 'Retargeting Display',
    purpose: 'Bring Back Dropoffs',
    baseUrl: 'https://huntlo.com/',
    source: 'google',
    medium: 'display',
    campaign: 'retargeting_30d',
    content: 'banner_300x250',
    dateCreated: '2026-07-07',
    clicks: 1100,
    conversions: 8,
  },
  {
    id: '8',
    assetName: 'Founder Story Post',
    purpose: 'Brand Awareness',
    baseUrl: 'https://huntlo.com/about',
    source: 'linkedin',
    medium: 'social',
    campaign: 'founder_brand',
    content: 'text_story',
    dateCreated: '2026-07-08',
    clicks: 5300,
    conversions: 45,
  }
];

const SOURCES = ['linkedin', 'twitter', 'facebook', 'google', 'email', 'newsletter', 'partner', 'direct'];
const MEDIUMS = ['social', 'cpc', 'email', 'organic', 'display', 'referral', 'affiliate'];

export default function UTMGenerator() {
  const [links, setLinks] = useState(INITIAL_LINKS);
  const [formData, setFormData] = useState({
    assetName: '',
    purpose: '',
    baseUrl: '',
    source: 'linkedin',
    medium: 'social',
    campaign: '',
    content: ''
  });

  // Calculate Dashboard Metrics
  const metrics = useMemo(() => {
    let totalClicks = 0;
    let totalConversions = 0;
    const sourceMap = {};

    links.forEach(l => {
      totalClicks += l.clicks || 0;
      totalConversions += l.conversions || 0;
      sourceMap[l.source] = (sourceMap[l.source] || 0) + (l.conversions || 0);
    });

    const convRate = totalClicks > 0 ? ((totalConversions / totalClicks) * 100).toFixed(1) : 0;
    
    // Find top source
    let topSource = 'N/A';
    let maxConv = -1;
    for (const [src, convs] of Object.entries(sourceMap)) {
      if (convs > maxConv) {
        maxConv = convs;
        topSource = src;
      }
    }

    return { totalClicks, totalConversions, convRate, topSource };
  }, [links]);

  const generateFullUrl = (item) => {
    try {
      const url = new URL(item.baseUrl || 'https://example.com');
      if (item.source) url.searchParams.set('utm_source', item.source.toLowerCase());
      if (item.medium) url.searchParams.set('utm_medium', item.medium.toLowerCase());
      if (item.campaign) url.searchParams.set('utm_campaign', item.campaign.toLowerCase().replace(/\s+/g, '_'));
      if (item.content) url.searchParams.set('utm_content', item.content.toLowerCase().replace(/\s+/g, '_'));
      return url.toString();
    } catch {
      return '';
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
  };

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleGenerate = (e) => {
    e.preventDefault();
    if (!formData.baseUrl) return alert('Base URL is required.');

    const newLink = {
      id: Date.now().toString(),
      ...formData,
      dateCreated: new Date().toISOString().split('T')[0],
      clicks: 0,
      conversions: 0
    };

    setLinks([newLink, ...links]);
    setFormData({
      assetName: '',
      purpose: '',
      baseUrl: '',
      source: 'linkedin',
      medium: 'social',
      campaign: '',
      content: ''
    });
  };

  const getSourceBadgeClass = (source) => {
    const s = source.toLowerCase();
    if (s.includes('linkedin')) return 'bg-linkedin';
    if (s.includes('twitter')) return 'bg-twitter';
    if (s.includes('email') || s.includes('newsletter')) return 'bg-email';
    if (s.includes('google')) return 'bg-google';
    if (s.includes('blog') || s.includes('organic')) return 'bg-blog';
    return 'bg-default';
  };

  const getConvRateClass = (rate) => {
    if (rate >= 5) return 'conv-high';
    if (rate >= 2) return 'conv-med';
    return 'conv-low';
  };

  return (
    <div className="utm-generator-page">
      <div className="utm-page-header">
        <div className="utm-page-title">
          <h1>UTM Link Tracker</h1>
          <p>Master sheet for generating and tracking all marketing campaign links</p>
        </div>
        <button className="utm-btn-secondary">
          <Download size={16} /> Export CSV
        </button>
      </div>

      {/* Dashboard Section */}
      <div className="utm-dashboard">
        <div className="utm-metric-card">
          <span className="utm-metric-title">Total Clicks</span>
          <span className="utm-metric-value">{metrics.totalClicks.toLocaleString()}</span>
          <span className="utm-metric-sub metric-positive">↑ 12% vs last month</span>
        </div>
        <div className="utm-metric-card">
          <span className="utm-metric-title">Total Conversions</span>
          <span className="utm-metric-value">{metrics.totalConversions.toLocaleString()}</span>
          <span className="utm-metric-sub metric-positive">↑ 8% vs last month</span>
        </div>
        <div className="utm-metric-card">
          <span className="utm-metric-title">Avg Conv. Rate</span>
          <span className="utm-metric-value">{metrics.convRate}%</span>
          <span className="utm-metric-sub metric-neutral">Across all campaigns</span>
        </div>
        <div className="utm-metric-card">
          <span className="utm-metric-title">Top Source</span>
          <span className="utm-metric-value" style={{ textTransform: 'capitalize' }}>{metrics.topSource}</span>
          <span className="utm-metric-sub metric-neutral">Based on conversions</span>
        </div>
      </div>

      {/* Generator Form */}
      <div className="utm-generator-panel">
        <div className="utm-panel-title">
          <Plus size={18} /> Generate New UTM Link
        </div>
        <form onSubmit={handleGenerate}>
          <div className="utm-form-grid">
            <div className="utm-form-group">
              <label>Asset / Campaign Name</label>
              <input name="assetName" value={formData.assetName} onChange={handleChange} placeholder="e.g. Q4 Launch Webinar" required />
            </div>
            <div className="utm-form-group">
              <label>Link Purpose</label>
              <input name="purpose" value={formData.purpose} onChange={handleChange} placeholder="e.g. Registration Drive" required />
            </div>
            <div className="utm-form-group">
              <label>Base URL *</label>
              <input name="baseUrl" type="url" value={formData.baseUrl} onChange={handleChange} placeholder="https://huntlo.com/..." required />
            </div>
            <div className="utm-form-group">
              <label>UTM Source</label>
              <select name="source" value={formData.source} onChange={handleChange}>
                {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                <option value="other">Other...</option>
              </select>
            </div>
            <div className="utm-form-group">
              <label>UTM Medium</label>
              <select name="medium" value={formData.medium} onChange={handleChange}>
                {MEDIUMS.map(m => <option key={m} value={m}>{m}</option>)}
                <option value="other">Other...</option>
              </select>
            </div>
            <div className="utm-form-group">
              <label>UTM Campaign</label>
              <input name="campaign" value={formData.campaign} onChange={handleChange} placeholder="e.g. q4_launch" />
            </div>
            <div className="utm-form-group">
              <label>UTM Content (Optional)</label>
              <input name="content" value={formData.content} onChange={handleChange} placeholder="e.g. hero_button" />
            </div>
          </div>
          <div className="utm-form-actions">
            <button type="submit" className="utm-btn-primary">Generate Link</button>
          </div>
        </form>
      </div>

      {/* History Grid */}
      <div className="utm-history-panel">
        <div className="utm-history-header">
          <h2>Master Link History</h2>
        </div>
        <div className="utm-table-wrapper">
          <table className="utm-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Asset / Purpose</th>
                <th>Source / Medium</th>
                <th>Campaign</th>
                <th>Full UTM Link</th>
                <th>Clicks</th>
                <th>Conversions</th>
                <th>Conv. Rate</th>
              </tr>
            </thead>
            <tbody>
              {links.map(link => {
                const fullUrl = generateFullUrl(link);
                const convRate = link.clicks > 0 ? ((link.conversions / link.clicks) * 100).toFixed(1) : 0;
                
                return (
                  <tr key={link.id}>
                    <td>{link.dateCreated}</td>
                    <td>
                      <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{link.assetName}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{link.purpose}</div>
                    </td>
                    <td>
                      <span className={`badge-source ${getSourceBadgeClass(link.source)}`}>{link.source}</span>
                      <div style={{ fontSize: 11, marginTop: 4, color: 'var(--text-secondary)' }}>{link.medium}</div>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{link.campaign || '-'}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="utm-cell-url" title={fullUrl}>{fullUrl}</div>
                        <button className="utm-copy-btn" onClick={() => handleCopy(fullUrl)} title="Copy Link">
                          <Copy size={14} />
                        </button>
                        <a href={fullUrl} target="_blank" rel="noopener noreferrer" className="utm-copy-btn" style={{ color: 'var(--text-secondary)' }} title="Open Link">
                          <ExternalLink size={14} />
                        </a>
                      </div>
                    </td>
                    <td>{link.clicks.toLocaleString()}</td>
                    <td>{link.conversions.toLocaleString()}</td>
                    <td className={getConvRateClass(convRate)}>
                      {convRate}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
