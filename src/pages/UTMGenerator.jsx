import { useState, useEffect, useMemo } from 'react';
import { Copy, Plus, ExternalLink, Download } from 'lucide-react';
import { supabase } from '../lib/supabase';
import useAuthStore from '../store/useAuthStore';
import './UTMGenerator.css';

const SOURCES = ['linkedin', 'twitter', 'facebook', 'google', 'email', 'newsletter', 'partner', 'direct'];
const MEDIUMS = ['social', 'cpc', 'email', 'organic', 'display', 'referral', 'affiliate'];

export default function UTMGenerator() {
  const { user } = useAuthStore();
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    assetName: '',
    purpose: '',
    baseUrl: '',
    source: 'linkedin',
    medium: 'social',
    campaign: '',
    content: ''
  });

  // Fetch initial data
  useEffect(() => {
    if (!user) return;

    const fetchLinks = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('utm_links')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        setLinks(data);
      }
      setLoading(false);
    };

    fetchLinks();

    // Subscribe to realtime updates
    const channel = supabase.channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'utm_links',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setLinks(prev => [payload.new, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setLinks(prev => prev.map(l => l.id === payload.new.id ? payload.new : l));
          } else if (payload.eventType === 'DELETE') {
            setLinks(prev => prev.filter(l => l.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Calculate Dashboard Metrics
  const metrics = useMemo(() => {
    let totalClicks = 0;
    let totalConversions = 0;
    const sourceMap = {};

    links.forEach(l => {
      totalClicks += l.clicks || 0;
      totalConversions += l.conversions || 0;
      sourceMap[l.utm_source] = (sourceMap[l.utm_source] || 0) + (l.conversions || 0);
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

  const generateShortCode = () => {
    return Math.random().toString(36).substring(2, 8);
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!formData.baseUrl || !user) return alert('Base URL is required.');

    const fullUrl = generateFullUrl(formData);
    const shortCode = generateShortCode();

    const newLinkData = {
      user_id: user.id,
      asset_name: formData.assetName,
      purpose: formData.purpose,
      base_url: formData.baseUrl,
      utm_source: formData.source,
      utm_medium: formData.medium,
      utm_campaign: formData.campaign,
      utm_content: formData.content,
      full_utm_url: fullUrl,
      short_code: shortCode,
      clicks: 0,
      conversions: 0
    };

    const { error } = await supabase.from('utm_links').insert(newLinkData);

    if (error) {
      console.error('Failed to create link:', error);
      alert('Failed to generate link. Check console for details.');
    } else {
      setFormData({
        assetName: '',
        purpose: '',
        baseUrl: '',
        source: 'linkedin',
        medium: 'social',
        campaign: '',
        content: ''
      });
    }
  };

  const getSourceBadgeClass = (source) => {
    if (!source) return 'bg-default';
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
          <span className="utm-metric-sub metric-positive">Real-time data</span>
        </div>
        <div className="utm-metric-card">
          <span className="utm-metric-title">Total Conversions</span>
          <span className="utm-metric-value">{metrics.totalConversions.toLocaleString()}</span>
          <span className="utm-metric-sub metric-positive">Real-time data</span>
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
            <button type="submit" className="utm-btn-primary">Generate & Save Link</button>
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
                <th>Full UTM Link</th>
                <th>Short Tracking Link</th>
                <th>Clicks</th>
                <th>Conversions</th>
                <th>Conv. Rate</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="8" style={{textAlign: 'center', padding: '20px'}}>Loading...</td></tr>
              ) : links.length === 0 ? (
                <tr><td colSpan="8" style={{textAlign: 'center', padding: '20px', color: 'var(--text-secondary)'}}>No links generated yet.</td></tr>
              ) : links.map(link => {
                const convRate = link.clicks > 0 ? ((link.conversions / link.clicks) * 100).toFixed(1) : 0;
                const shortUrl = `${window.location.origin}/l/${link.short_code}`;
                
                return (
                  <tr key={link.id}>
                    <td>{new Date(link.created_at).toISOString().split('T')[0]}</td>
                    <td>
                      <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{link.asset_name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{link.purpose}</div>
                    </td>
                    <td>
                      <span className={`badge-source ${getSourceBadgeClass(link.utm_source)}`}>{link.utm_source}</span>
                      <div style={{ fontSize: 11, marginTop: 4, color: 'var(--text-secondary)' }}>{link.utm_medium}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="utm-cell-url" title={link.full_utm_url}>{link.full_utm_url}</div>
                        <button className="utm-copy-btn" onClick={() => handleCopy(link.full_utm_url)} title="Copy Long Link">
                          <Copy size={14} />
                        </button>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="utm-cell-url" style={{ color: '#10b981', fontWeight: 600 }}>{shortUrl}</div>
                        <button className="utm-copy-btn" onClick={() => handleCopy(shortUrl)} title="Copy Tracking Link">
                          <Copy size={14} />
                        </button>
                        <a href={shortUrl} target="_blank" rel="noopener noreferrer" className="utm-copy-btn" style={{ color: 'var(--text-secondary)' }} title="Test Redirect">
                          <ExternalLink size={14} />
                        </a>
                      </div>
                    </td>
                    <td style={{ fontWeight: 600 }}>{link.clicks.toLocaleString()}</td>
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
