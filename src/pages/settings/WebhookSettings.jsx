import React, { useState, useEffect } from 'react';
import { Copy, RefreshCw, CheckCircle2, AlertCircle, Link, Server, Activity, ArrowRight, UserPlus, Mail, Globe, MapPin } from 'lucide-react';
import useDataStore from '../../store/useDataStore';
import useUIStore from '../../store/useUIStore';
import { useDialog } from '../../context/DialogContext';
import { supabase } from '../../lib/supabase';

export default function WebhookSettings() {
  const { fetchWebhookConfig, saveWebhookConfig, regenerateWebhookToken, fetchWebhookEvents, createLead } = useDataStore();
  const { showSuccess, showError, showConfirm } = useDialog();
  const addNotification = useUIStore(state => state.addNotification);
  
  const [config, setConfig] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedEvent, setExpandedEvent] = useState(null);
  const [activeTab, setActiveTab] = useState('settings'); // 'settings', 'events', 'inbox'

  const webhookUrl = config?.secret_token 
    ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/receive-webhook?token=${config.secret_token}`
    : '';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [confData, eventsData] = await Promise.all([
        fetchWebhookConfig(),
        fetchWebhookEvents()
      ]);
      setConfig(confData);
      setEvents(eventsData);
    } catch (err) {
      console.error(err);
      showError('Error', 'Failed to load webhook configuration.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async () => {
    if (!config) return;
    setSaving(true);
    try {
      const updated = await saveWebhookConfig(config.id, { is_enabled: !config.is_enabled });
      setConfig(updated);
      showSuccess('Updated', `Webhook integration has been ${updated.is_enabled ? 'enabled' : 'disabled'}.`);
    } catch (err) {
      showError('Update Failed', err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerate = async () => {
    if (!config) return;
    const confirmed = await showConfirm(
      'Regenerate Token',
      'Are you sure? Any services currently sending webhooks to the old URL will stop working immediately.'
    );
    if (!confirmed) return;
    
    setSaving(true);
    try {
      const updated = await regenerateWebhookToken(config.id);
      setConfig(updated);
      showSuccess('Token Regenerated', 'Your webhook URL has been updated.');
    } catch (err) {
      showError('Regeneration Failed', err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(webhookUrl);
    showSuccess('Copied', 'Webhook URL copied to clipboard!');
  };

  const handleCreateLead = async (ev) => {
    try {
      setSaving(true);
      const p = ev.payload || {};
      
      const company_name = p.Company || p.company_name || p.domain || 'Unknown Company';
      const email = p.Email || p.email || p.contact_email || '';
      const contact_name = p.Name || p.Title || p.contact_name || '';
      const industry = p.Industry || p.industry || '';
      const website = p.Website || p.website || p.url || '';
      const city = p.City || p.city || '';
      const state = p.State || p.state || '';
      const zipcode = p.Zipcode || p.zipcode || '';
      const location = [city, state, zipcode].filter(Boolean).join(', ');

      const newLead = await createLead({
        company_name,
        email,
        contact_name,
        source: 'Webhook',
        stage: 'New Lead',
        industry,
        website,
        notes: `Location: ${location}\nRaw Payload Data: ${JSON.stringify(p)}`
      });

      // Update event status so it doesn't show in inbox again
      await supabase
        .from('webhook_events')
        .update({ status: 'processed', lead_id: newLead.id })
        .eq('id', ev.id);

      addNotification({
        id: `webhook-lead-${Date.now()}`,
        title: 'Admin Alert: Webhook Lead Created',
        message: `Lead ${company_name} was manually created from webhook inbox.`,
        type: 'success',
        unread: true,
        time: new Date().toISOString()
      });

      showSuccess('Lead Created', `Successfully created lead for ${company_name}`);
      await loadData();
    } catch (err) {
      showError('Error', err.message || 'Failed to create lead.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ padding: 24, color: 'var(--text-tertiary)' }}>Loading Webhook configuration...</div>;
  }

  if (!config) {
    return <div style={{ padding: 24, color: 'var(--danger)' }}>Failed to initialize Webhook config.</div>;
  }

  const inboxEvents = events.filter(ev => ev.status !== 'processed' && ev.payload && Object.keys(ev.payload).length > 0);

  return (
    <div className="settings-panel animate-fade-in" style={{ maxWidth: 800 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <div style={{ background: 'var(--accent-blue)', color: '#fff', padding: 8, borderRadius: 8 }}>
          <Server size={20} />
        </div>
        <h2 className="panel-title" style={{ margin: 0 }}>Webhook Integration (e.g. RB2B)</h2>
      </div>
      <p className="panel-sub mb-6">Receive real-time lead and visitor data automatically from third-party services.</p>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 16, borderBottom: '1px solid var(--border-light)', marginBottom: 24 }}>
        <button 
          className="btn btn-ghost"
          style={{ 
            borderBottom: activeTab === 'settings' ? '2px solid var(--accent-blue)' : '2px solid transparent', 
            borderRadius: 0, paddingBottom: 12, color: activeTab === 'settings' ? 'var(--text-primary)' : 'var(--text-secondary)'
          }}
          onClick={() => setActiveTab('settings')}
        >
          Configuration
        </button>
        <button 
          className="btn btn-ghost"
          style={{ 
            borderBottom: activeTab === 'events' ? '2px solid var(--accent-blue)' : '2px solid transparent', 
            borderRadius: 0, paddingBottom: 12, color: activeTab === 'events' ? 'var(--text-primary)' : 'var(--text-secondary)'
          }}
          onClick={() => setActiveTab('events')}
        >
          Event Log
        </button>
        <button 
          className="btn btn-ghost"
          style={{ 
            borderBottom: activeTab === 'inbox' ? '2px solid var(--accent-blue)' : '2px solid transparent', 
            borderRadius: 0, paddingBottom: 12, color: activeTab === 'inbox' ? 'var(--text-primary)' : 'var(--text-secondary)',
            display: 'flex', alignItems: 'center', gap: 8
          }}
          onClick={() => setActiveTab('inbox')}
        >
          Webhook Leads
          {inboxEvents.length > 0 && (
            <span style={{ background: 'var(--accent-blue)', color: '#fff', fontSize: 10, padding: '2px 6px', borderRadius: 10 }}>
              {inboxEvents.length}
            </span>
          )}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        
        {activeTab === 'settings' && (
          <React.Fragment>
            {/* Status Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'var(--bg-elevated)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>Webhook Status</h4>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>
                  {config.is_enabled ? 'Active and listening for payloads.' : 'Disabled. Incoming payloads will be rejected.'}
                </p>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={config.is_enabled} 
                  onChange={handleToggle}
                  disabled={saving}
                  style={{ display: 'none' }} 
                />
                <div style={{ 
                  width: 36, height: 20, 
                  background: config.is_enabled ? 'var(--success)' : 'var(--bg-border)', 
                  borderRadius: 20, 
                  position: 'relative',
                  transition: 'all 0.2s'
                }}>
                  <div style={{
                    position: 'absolute', top: 2, left: config.is_enabled ? 18 : 2,
                    width: 16, height: 16, background: '#fff', borderRadius: '50%',
                    transition: 'all 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                  }} />
                </div>
              </label>
            </div>

            {/* URL Section */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label className="label">Webhook URL</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input 
                  type="text" 
                  readOnly 
                  className="input-base" 
                  style={{ flex: 1, fontFamily: 'monospace', fontSize: 12 }}
                  value={webhookUrl}
                />
                <button className="btn btn-primary btn-sm" onClick={handleCopy}>
                  <Copy size={14} /> Copy
                </button>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Paste this URL into RB2B or other services.</span>
                <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={handleRegenerate} disabled={saving}>
                  <RefreshCw size={12} /> Regenerate Token
                </button>
              </div>
            </div>

            {/* Options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
              <h4 style={{ margin: 0, fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>Preferences</h4>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={config.auto_create_leads} 
                  onChange={async () => {
                    const updated = await saveWebhookConfig(config.id, { auto_create_leads: !config.auto_create_leads });
                    setConfig(updated);
                  }}
                  style={{ width: 14, height: 14, accentColor: 'var(--accent-blue)' }} 
                />
                Automatically create/update Companies and Leads from valid payloads
              </label>
            </div>
          </React.Fragment>
        )}

        {activeTab === 'events' && (
          <div style={{ marginTop: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Activity size={16} /> Recent Events
              </h3>
              <button className="btn btn-ghost btn-sm" onClick={loadData}>Refresh</button>
            </div>

            <div style={{ background: 'var(--bg-elevated)', borderRadius: 8, border: '1px solid var(--bg-border)', overflow: 'hidden' }}>
              {events.length === 0 ? (
                <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-tertiary)' }}>
                  <Activity size={24} style={{ opacity: 0.2, margin: '0 auto 8px' }} />
                  <div style={{ fontSize: 13 }}>No events received yet.</div>
                </div>
              ) : (
                <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                  <table className="huntlo-table">
                    <thead>
                      <tr>
                        <th>Status</th>
                        <th>Time</th>
                        <th>Source</th>
                        <th>Detail</th>
                        <th>Insights</th>
                      </tr>
                    </thead>
                    <tbody>
                      {events.map(ev => (
                        <React.Fragment key={ev.id}>
                          <tr>
                            <td>
                              {ev.status === 'processed' && <span style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}><CheckCircle2 size={12}/> Processed</span>}
                              {ev.status === 'failed' && <span style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}><AlertCircle size={12}/> Failed</span>}
                              {ev.status === 'skipped' && <span style={{ color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}><ArrowRight size={12}/> Skipped</span>}
                              {ev.status === 'received' && <span style={{ color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}><Activity size={12}/> Received</span>}
                            </td>
                            <td style={{ fontSize: 12 }}>{new Date(ev.created_at).toLocaleString()}</td>
                            <td style={{ fontSize: 12, textTransform: 'capitalize' }}>{ev.source}</td>
                            <td style={{ fontSize: 12 }}>
                              {ev.error_message ? (
                                <span style={{ color: 'var(--danger)' }}>{ev.error_message}</span>
                              ) : ev.lead_id ? (
                                <span style={{ color: 'var(--text-secondary)' }}>Lead connected</span>
                              ) : (
                                <span style={{ color: 'var(--text-tertiary)' }}>—</span>
                              )}
                            </td>
                            <td>
                              <button 
                                className="btn btn-ghost btn-sm" 
                                onClick={() => setExpandedEvent(expandedEvent === ev.id ? null : ev.id)}
                                style={{ fontSize: 11, padding: '4px 8px' }}
                              >
                                {expandedEvent === ev.id ? 'Hide Insights' : 'View Insights'}
                              </button>
                            </td>
                          </tr>
                          {expandedEvent === ev.id && ev.payload && (
                            <tr>
                              <td colSpan="5" style={{ padding: 0 }}>
                                <div style={{ padding: '16px', background: 'var(--bg-base)', borderBottom: '1px solid var(--bg-border)', borderTop: '1px solid var(--bg-border-soft)' }}>
                                  <h5 style={{ margin: '0 0 8px 0', fontSize: 13, color: 'var(--text-primary)' }}>Raw Payload Insights</h5>
                                  <pre style={{ 
                                    margin: 0, padding: '12px', background: 'var(--bg-surface)', 
                                    border: '1px solid var(--bg-border)', borderRadius: '6px', 
                                    fontSize: 11, overflowX: 'auto', color: 'var(--text-secondary)' 
                                  }}>
                                    {JSON.stringify(ev.payload, null, 2)}
                                  </pre>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'inbox' && (
          <div style={{ marginTop: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <UserPlus size={16} /> Lead Inbox
              </h3>
              <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
                {inboxEvents.length} unprocessed {inboxEvents.length === 1 ? 'event' : 'events'} with data
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {inboxEvents.length === 0 ? (
                <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-tertiary)', background: 'var(--bg-elevated)', borderRadius: 8, border: '1px solid var(--border-light)' }}>
                  <CheckCircle2 size={32} style={{ opacity: 0.3, margin: '0 auto 12px' }} />
                  <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-secondary)' }}>Inbox Zero!</div>
                  <div style={{ fontSize: 13, marginTop: 4 }}>No new webhook leads waiting for review.</div>
                </div>
              ) : (
                inboxEvents.map(ev => {
                  const p = ev.payload;
                  const company = p.Company || p.company_name || p.domain || 'Unknown';
                  const name = p.Name || p.Title || p.contact_name || '';
                  const location = [p.City, p.State].filter(Boolean).join(', ');
                  const industry = p.Industry || p.industry;
                  const website = p.Website || p.website || p.url;
                  
                  return (
                    <div key={ev.id} style={{ 
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                      background: 'var(--bg-elevated)', padding: '16px 20px', 
                      borderRadius: 8, border: '1px solid var(--border-light)',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{company}</span>
                          <span style={{ fontSize: 12, color: 'var(--text-tertiary)', background: 'var(--bg-base)', padding: '2px 8px', borderRadius: 12 }}>
                            {new Date(ev.created_at).toLocaleString()}
                          </span>
                        </div>
                        
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 13, color: 'var(--text-secondary)' }}>
                          {name && <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><UserPlus size={14} /> {name}</div>}
                          {industry && <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Activity size={14} /> {industry}</div>}
                          {website && <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Globe size={14} /> {website}</div>}
                          {location && <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={14} /> {location}</div>}
                        </div>
                      </div>
                      
                      <button 
                        className="btn btn-primary btn-sm" 
                        disabled={saving}
                        onClick={() => handleCreateLead(ev)}
                        style={{ whiteSpace: 'nowrap' }}
                      >
                        <UserPlus size={14} /> Create Lead
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
