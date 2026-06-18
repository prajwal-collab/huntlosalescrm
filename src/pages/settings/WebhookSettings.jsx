import React, { useState, useEffect } from 'react';
import { Copy, RefreshCw, CheckCircle2, AlertCircle, Link, Server, Activity, ArrowRight } from 'lucide-react';
import useDataStore from '../../store/useDataStore';
import { useDialog } from '../../context/DialogContext';

export default function WebhookSettings() {
  const { fetchWebhookConfig, saveWebhookConfig, regenerateWebhookToken, fetchWebhookEvents } = useDataStore();
  const { showSuccess, showError, showConfirm } = useDialog();
  
  const [config, setConfig] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedEvent, setExpandedEvent] = useState(null);

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

  if (loading) {
    return <div style={{ padding: 24, color: 'var(--text-tertiary)' }}>Loading Webhook configuration...</div>;
  }

  if (!config) {
    return <div style={{ padding: 24, color: 'var(--danger)' }}>Failed to initialize Webhook config.</div>;
  }

  return (
    <div className="settings-panel animate-fade-in" style={{ maxWidth: 800 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <div style={{ background: 'var(--accent-blue)', color: '#fff', padding: 8, borderRadius: 8 }}>
          <Server size={20} />
        </div>
        <h2 className="panel-title" style={{ margin: 0 }}>Webhook Integration (e.g. RB2B)</h2>
      </div>
      <p className="panel-sub mb-6">Receive real-time lead and visitor data automatically from third-party services.</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        
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

        {/* Event Log */}
        <div style={{ marginTop: 24 }}>
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
              <div style={{ maxHeight: 300, overflowY: 'auto' }}>
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

      </div>
    </div>
  );
}
