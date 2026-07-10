import { useState, useEffect, useMemo, useRef } from 'react';
import { Copy, ExternalLink, Search, Plus, Link as LinkIcon, Activity, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import useAuthStore from '../store/useAuthStore';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from 'recharts';
import './UTMGenerator.css';

const CHANNELS = ['LinkedIn', 'Twitter', 'Google', 'Email', 'WhatsApp', 'Organic', 'Paid'];
const PURPOSES = ['Webinar', 'Blog Post', 'Lead Magnet', 'Newsletter', 'Sales Promo'];
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b'];

export default function UTMGenerator() {
  const { user } = useAuthStore();
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Navigation & UI State
  const [activeTab, setActiveTab] = useState('Dashboard');
  const baseUrlInputRef = useRef(null);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeChannelFilter, setActiveChannelFilter] = useState('All');
  const [dateRange, setDateRange] = useState('Last 30 Days');

  // Generator form
  const [formData, setFormData] = useState({
    baseUrl: '',
    assetName: '',
    customShortCode: '',
    purpose: 'Webinar',
    source: 'LinkedIn',
    campaign: ''
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
      
      if (!error && data) setLinks(data);
      setLoading(false);
    };

    fetchLinks();

    const channel = supabase.channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'utm_links', filter: `user_id=eq.${user.id}` },
        (payload) => {
          if (payload.eventType === 'INSERT') setLinks(prev => [payload.new, ...prev]);
          else if (payload.eventType === 'UPDATE') setLinks(prev => prev.map(l => l.id === payload.new.id ? payload.new : l));
          else if (payload.eventType === 'DELETE') setLinks(prev => prev.filter(l => l.id !== payload.old.id));
        }
      ).subscribe();

    return () => supabase.removeChannel(channel);
  }, [user]);

  // Handle Delete Link
  const handleDeleteLink = async (id) => {
    if (!window.confirm("Are you sure you want to delete this link? This will break the tracking URL.")) return;
    
    // Optimistic UI update
    const previousLinks = [...links];
    setLinks(links.filter(l => l.id !== id));
    
    const { error } = await supabase.from('utm_links').delete().eq('id', id);
    if (error) {
      console.error("Error deleting link:", error);
      setLinks(previousLinks); // Revert on error
      alert("Failed to delete the link.");
    }
  };

  // Derived Analytics & Filters
  const filteredLinks = useMemo(() => {
    const now = new Date();
    
    return links.filter(l => {
      // Search
      const matchesSearch = (l.asset_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (l.utm_campaign || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      // Channel
      const matchesChannel = activeChannelFilter === 'All' || (l.utm_source || '').toLowerCase() === activeChannelFilter.toLowerCase();
      
      // Date Range
      let matchesDate = true;
      if (l.created_at) {
        const linkDate = new Date(l.created_at);
        if (dateRange === 'Last 30 Days') {
          const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          matchesDate = linkDate >= thirtyDaysAgo;
        } else if (dateRange === 'This Quarter') {
          const currentQuarter = Math.floor(now.getMonth() / 3);
          const linkQuarter = Math.floor(linkDate.getMonth() / 3);
          matchesDate = (linkDate.getFullYear() === now.getFullYear() && linkQuarter === currentQuarter);
        } else if (dateRange === 'Year to Date') {
          matchesDate = linkDate.getFullYear() === now.getFullYear();
        }
      }

      return matchesSearch && matchesChannel && matchesDate;
    });
  }, [links, searchQuery, activeChannelFilter, dateRange]);

  const metrics = useMemo(() => {
    let totalClicks = 0;
    let totalConversions = 0;
    const sourceMap = {};
    const campaignMap = {};

    filteredLinks.forEach(l => {
      totalClicks += l.clicks || 0;
      totalConversions += l.conversions || 0;
      
      const src = l.utm_source || 'Unknown';
      sourceMap[src] = (sourceMap[src] || 0) + (l.conversions || 0);

      const cmp = l.utm_campaign || 'Default';
      campaignMap[cmp] = (campaignMap[cmp] || 0) + (l.clicks || 0);
    });

    const convRate = totalClicks > 0 ? ((totalConversions / totalClicks) * 100).toFixed(1) : 0;
    
    const donutData = Object.entries(sourceMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    const barData = Object.entries(campaignMap)
      .map(([name, clicks]) => ({ name: name.substring(0, 10), clicks }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 4);

    return { totalClicks, totalConversions, convRate, donutData, barData };
  }, [filteredLinks]);

  const generateFullUrl = (item) => {
    try {
      const url = new URL(item.baseUrl || 'https://example.com');
      if (item.source) url.searchParams.set('utm_source', item.source.toLowerCase());
      if (item.purpose) url.searchParams.set('utm_medium', item.purpose.toLowerCase().replace(/\s+/g, '_'));
      if (item.campaign) url.searchParams.set('utm_campaign', item.campaign.toLowerCase().replace(/\s+/g, '_'));
      return url.toString();
    } catch { return ''; }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!formData.baseUrl || !user) return alert('Base URL is required.');

    const fullUrl = generateFullUrl(formData);
    
    // Use custom short code or generate a random one
    let shortCode = formData.customShortCode.trim();
    if (!shortCode) {
      shortCode = Math.random().toString(36).substring(2, 8);
    } else {
      // sanitize custom short code
      shortCode = shortCode.replace(/[^a-zA-Z0-9-_]/g, '').toLowerCase();
    }

    const { error } = await supabase.from('utm_links').insert({
      user_id: user.id,
      asset_name: formData.assetName,
      purpose: formData.purpose,
      base_url: formData.baseUrl,
      utm_source: formData.source,
      utm_medium: formData.purpose.toLowerCase().replace(/\s+/g, '_'),
      utm_campaign: formData.campaign,
      full_utm_url: fullUrl,
      short_code: shortCode
    });

    if (error) {
      if (error.code === '23505') { // Postgres unique violation code
        alert(`The custom short link "/l/${shortCode}" is already taken. Please try another one.`);
      } else {
        alert('Failed to generate link. Check console for details.');
      }
    } else {
      setFormData(prev => ({ ...prev, baseUrl: '', assetName: '', campaign: '', customShortCode: '' }));
      setActiveChannelFilter('All');
    }
  };

  const getChannelColorClass = (src) => {
    const s = (src || '').toLowerCase();
    if (s.includes('linkedin')) return 'lt-bg-linkedin';
    if (s.includes('email')) return 'lt-bg-email';
    if (s.includes('whatsapp')) return 'lt-bg-whatsapp';
    if (s.includes('organic')) return 'lt-bg-organic';
    if (s.includes('paid') || s.includes('google')) return 'lt-bg-paid';
    return '';
  };

  // Helper for relative time in activity feed
  const getRelativeTime = (dateString) => {
    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
    const daysDifference = Math.round((new Date(dateString).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDifference === 0) return 'Today';
    if (daysDifference === -1) return 'Yesterday';
    return rtf.format(daysDifference, 'day');
  };

  return (
    <div className="linktrack-container">
      {/* HEADER */}
      <header className="linktrack-header">
        <div className="lt-header-left">
          <div className="lt-logo">
            <LinkIcon size={18} color="#3b82f6" />
            LinkTrack
          </div>
          <div className="lt-tabs">
            {['Dashboard', 'Analytics', 'Settings'].map(tab => (
              <div 
                key={tab} 
                className={`lt-tab ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </div>
            ))}
          </div>
        </div>
        <div className="lt-header-right">
          <div className="lt-search">
            <Search size={14} className="lt-search-icon" />
            <input 
              type="text" 
              placeholder="Search links, campaigns..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="lt-btn-new" onClick={() => baseUrlInputRef.current?.focus()}>
            <Plus size={14} /> New Link
          </button>
        </div>
      </header>

      {/* MAIN 3-COL LAYOUT */}
      <main className="linktrack-main">
        {/* LEFT SIDEBAR (20%) */}
        <aside className="lt-sidebar-left">
          <div className="lt-sidebar-section">
            <div className="lt-section-title">Channels</div>
            <div 
              className={`lt-filter-item ${activeChannelFilter === 'All' ? 'active' : ''}`}
              onClick={() => setActiveChannelFilter('All')}
            >
              <span>All Channels</span>
              <span className="lt-filter-badge">{links.length}</span>
            </div>
            {CHANNELS.map(ch => {
              const count = links.filter(l => (l.utm_source || '').toLowerCase() === ch.toLowerCase()).length;
              return (
                <div 
                  key={ch} 
                  className={`lt-filter-item ${activeChannelFilter === ch ? 'active' : ''}`}
                  onClick={() => setActiveChannelFilter(ch)}
                >
                  <span>{ch}</span>
                  <span className="lt-filter-badge">{count}</span>
                </div>
              );
            })}
          </div>

          <div className="lt-sidebar-section" style={{ marginTop: 'auto' }}>
            <div className="lt-section-title">Date Range</div>
            {['Last 30 Days', 'This Quarter', 'Year to Date'].map(range => (
              <div 
                key={range}
                className={`lt-filter-item ${dateRange === range ? 'active' : ''}`}
                onClick={() => setDateRange(range)}
              >
                {range}
              </div>
            ))}
          </div>
        </aside>

        {/* CENTER CONTENT (55%) */}
        <section className="lt-center-content">
          
          {/* Active Tab Logic (Keep simple for now, just show dashboard if Analytics/Settings selected) */}
          {activeTab !== 'Dashboard' && (
            <div style={{padding: 20, textAlign: 'center', color: '#666'}}>
              {activeTab} features coming soon. Showing Dashboard view.
            </div>
          )}

          {/* Quick Generator */}
          <div className="lt-quick-gen">
            <div className="lt-card-header">
              <h2>Quick Link Generator</h2>
            </div>
            <form onSubmit={handleGenerate} className="lt-gen-form-row">
              <div className="lt-input-group">
                <label>Internal Link Title *</label>
                <input 
                  required 
                  placeholder="e.g. Q4 Promo Campaign" 
                  className="lt-input" 
                  value={formData.assetName} 
                  onChange={e => setFormData({...formData, assetName: e.target.value})} 
                  ref={baseUrlInputRef}
                />
              </div>
              <div className="lt-input-group">
                <label>Base URL (Destination) *</label>
                <input 
                  required 
                  type="url" 
                  placeholder="https://..." 
                  className="lt-input" 
                  value={formData.baseUrl} 
                  onChange={e => setFormData({...formData, baseUrl: e.target.value})} 
                />
              </div>
              <div className="lt-input-group">
                <label>Custom Short Link (Optional)</label>
                <div className="lt-input-prefix-wrapper">
                  <span className="lt-input-prefix">/l/</span>
                  <input 
                    placeholder="e.g. q4-promo" 
                    className="lt-input lt-input-with-prefix" 
                    value={formData.customShortCode} 
                    onChange={e => setFormData({...formData, customShortCode: e.target.value})} 
                  />
                </div>
              </div>
              <button type="submit" className="lt-btn-generate">Generate</button>
            </form>
            
            <div className="lt-channels-chips">
              {CHANNELS.map(ch => (
                <div 
                  key={ch} 
                  className={`lt-chip ${formData.source === ch ? 'active' : ''}`}
                  onClick={() => setFormData({...formData, source: ch})}
                >
                  {ch}
                </div>
              ))}
            </div>
          </div>

          {/* Live Links Table */}
          <div className="lt-table-card">
            <div className="lt-table-toolbar">
              <span className="lt-table-title">Live Tracking Links</span>
            </div>
            <div className="lt-table-container">
              <table className="lt-table">
                <thead>
                  <tr>
                    <th>Link Title (Internal)</th>
                    <th>Channel</th>
                    <th>Short Link</th>
                    <th>Clicks</th>
                    <th>Conv. Rate</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="6" style={{textAlign: 'center', padding: '40px'}}>Loading...</td></tr>
                  ) : filteredLinks.length === 0 ? (
                    <tr><td colSpan="6" style={{textAlign: 'center', padding: '40px', color: '#888'}}>No links found.</td></tr>
                  ) : filteredLinks.map(link => {
                    const shortUrl = `${window.location.origin}/l/${link.short_code}`;
                    const rate = link.clicks > 0 ? ((link.conversions / link.clicks) * 100).toFixed(1) : 0;
                    
                    let progClass = 'lt-progress-low';
                    if (rate >= 5) progClass = 'lt-progress-high';
                    else if (rate >= 2) progClass = 'lt-progress-med';

                    return (
                      <tr key={link.id}>
                        <td>
                          <div className="lt-asset-cell">
                            <span className="lt-asset-name">{link.asset_name}</span>
                            <span className="lt-asset-date">{new Date(link.created_at).toLocaleDateString()}</span>
                          </div>
                        </td>
                        <td>
                          <span className={`lt-badge-channel ${getChannelColorClass(link.utm_source)}`}>
                            {link.utm_source}
                          </span>
                        </td>
                        <td>
                          <div className="lt-link-wrapper">
                            <span className="lt-link-text lt-short-link">{shortUrl}</span>
                            <button className="lt-action-btn" onClick={() => handleCopy(shortUrl)} title="Copy Short Link"><Copy size={12}/></button>
                            <a href={shortUrl} target="_blank" rel="noopener noreferrer" className="lt-action-btn" title="Test Open"><ExternalLink size={12}/></a>
                          </div>
                        </td>
                        <td style={{fontWeight: 600}}>{link.clicks.toLocaleString()}</td>
                        <td>
                          <div style={{display: 'flex', flexDirection: 'column', gap: '2px', width: '60px'}}>
                            <span style={{fontSize: '12px', fontWeight: 600}}>{rate}%</span>
                            <div className="lt-progress-bar-bg">
                              <div className={`lt-progress-fill ${progClass}`} style={{ width: `${Math.min(rate, 100)}%` }}></div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <button className="lt-action-btn" style={{color: '#ef4444', opacity: 0.7}} onClick={() => handleDeleteLink(link.id)} title="Delete Link">
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </section>

        {/* RIGHT SIDEBAR (25%) */}
        <aside className="lt-sidebar-right">
          
          <div className="lt-sidebar-section">
            <div className="lt-section-title">Performance Snapshot</div>
            <div className="lt-snapshot-grid">
              <div className="lt-snapshot-card">
                <span className="lt-snap-label">Total Links</span>
                <span className="lt-snap-value">{filteredLinks.length}</span>
              </div>
              <div className="lt-snapshot-card">
                <span className="lt-snap-label">Total Clicks</span>
                <span className="lt-snap-value">{metrics.totalClicks.toLocaleString()}</span>
              </div>
              <div className="lt-snapshot-card full-width">
                <span className="lt-snap-label">Avg Conv. Rate</span>
                <span className="lt-snap-value">
                  {metrics.convRate}%
                  {metrics.convRate > 0 && <span className="lt-snap-trend">↑ Good</span>}
                </span>
              </div>
            </div>
          </div>

          <div className="lt-sidebar-section">
            <div className="lt-section-title">Top Channels (Conversions)</div>
            <div className="lt-chart-container">
              {metrics.donutData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={metrics.donutData} innerRadius={50} outerRadius={70} paddingAngle={2} dataKey="value">
                      {metrics.donutData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div style={{height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: 12}}>No data yet</div>
              )}
            </div>
          </div>

          <div className="lt-sidebar-section">
            <div className="lt-section-title">Top Campaigns (Clicks)</div>
            <div className="lt-chart-container">
              {metrics.barData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metrics.barData} margin={{top: 10, right: 0, left: -20, bottom: 0}}>
                    <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip cursor={{fill: 'rgba(0,0,0,0.02)'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey="clicks" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: 12}}>No data yet</div>
              )}
            </div>
          </div>

          <div className="lt-sidebar-section" style={{ borderTop: '1px solid #eaeaea', paddingTop: '20px' }}>
            <div className="lt-section-title">Recent Activity</div>
            <div className="lt-activity-list">
              {filteredLinks.slice(0, 4).map((l, i) => (
                <div className="lt-activity-item" key={l.id || i}>
                  <div className="lt-act-icon"><Activity size={14}/></div>
                  <div className="lt-act-content">
                    <span className="lt-act-title">Link created: <b>{l.asset_name}</b></span>
                    <span className="lt-act-time">{getRelativeTime(l.created_at)} via {l.utm_source}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </aside>
      </main>
    </div>
  );
}
