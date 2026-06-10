// ============================================
// HUNTLO SALES OS — SETTINGS PAGE
// ============================================
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { User, Key, Bell, Shield, Mail, Calendar, RefreshCw, Trash2, Eye, EyeOff, Lock } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import TeamManagement from './settings/TeamManagement';
import EmailSettingsForm from './settings/EmailSettingsForm';
import { isGeminiConfigured } from '../lib/gemini';
import { supabase } from '../lib/supabase';
import { useDialog } from '../context/DialogContext';
import './Settings.css';

const TABS = [
  { id: 'profile', icon: User, label: 'Profile' },
  { id: 'team', icon: Shield, label: 'Team & Workspace' },
  { id: 'integrations', icon: Key, label: 'Integrations' },
  { id: 'notifications', icon: Bell, label: 'Notifications' },
];

export default function Settings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'profile';
  const { user, linkGoogle, updateProfile } = useAuthStore();
  const [keyInput, setKeyInput] = useState(localStorage.getItem('huntlo_gemini_api_key') || '');
  const [googleConnected, setGoogleConnected] = useState(false);
  const [checkingGoogle, setCheckingGoogle] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user?.user_metadata?.full_name) {
      setFullName(user.user_metadata.full_name);
    } else if (user?.email) {
      setFullName(user.email.split('@')[0]);
    }
  }, [user]);

  useEffect(() => {
    async function checkGoogleConnection() {
      if (!user) {
        setCheckingGoogle(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from('user_google_credentials')
          .select('user_id')
          .eq('user_id', user.id)
          .maybeSingle();
        if (data) {
          setGoogleConnected(true);
        } else {
          setGoogleConnected(false);
        }
      } catch (err) {
        console.error('Error checking Google credentials:', err);
      } finally {
        setCheckingGoogle(false);
      }
    }
    checkGoogleConnection();
  }, [user]);

  const { showSuccess, showError, showConfirm } = useDialog();

  const handleSyncGoogle = async () => {
    setSyncing(true);
    const token = useAuthStore.getState().session?.provider_token;
    try {
      const { data, error } = await supabase.functions.invoke('sync-google-workspace', {
        body: { providerToken: token || null }
      });
      if (error) throw error;
      showSuccess('Sync Successful', data.message || 'Meetings synced from Google Calendar.');
    } catch (err) {
      showError('Sync Failed', err.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnectGoogle = async () => {
    const confirmed = await showConfirm(
      'Disconnect Google Workspace',
      'Are you sure you want to disconnect Google Workspace? This will stop calendar sync and Gmail sequence execution.'
    );
    if (confirmed) {
      try {
        const { error } = await supabase
          .from('user_google_credentials')
          .delete()
          .eq('user_id', user.id);
        if (error) throw error;
        setGoogleConnected(false);
        showSuccess('Disconnected', 'Google Workspace disconnected successfully.');
      } catch (err) {
        showError('Disconnect Failed', err.message);
      }
    }
  };

  const handleTabChange = (tabId) => {
    setSearchParams({ tab: tabId });
  };

  const handleSaveKey = (e) => {
    e.preventDefault();
    localStorage.setItem('huntlo_gemini_api_key', keyInput);
    showSuccess('Key Saved', 'Gemini API key saved successfully!');
    setSearchParams({ tab: 'integrations' });
  };

  const handleDisconnectKey = () => {
    localStorage.removeItem('huntlo_gemini_api_key');
    setKeyInput('');
    showSuccess('Key Disconnected', 'API key removed.');
    setSearchParams({ tab: 'integrations' });
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) {
      showError('Validation Error', 'Full Name cannot be empty.');
      return;
    }
    if (password && password.length < 6) {
      showError('Validation Error', 'Password must be at least 6 characters.');
      return;
    }

    setSaving(true);
    const result = await updateProfile({ fullName, password });
    setSaving(false);

    if (result.success) {
      showSuccess('Profile Updated', 'Your profile details have been saved successfully.');
      setPassword('');
    } else {
      showError('Update Failed', result.error || 'Failed to update profile.');
    }
  };

  return (
    <div className="settings-page">
      <div className="page-header-row">
        <div>
          <h1 className="page-big-title">Settings</h1>
          <p className="page-big-sub">Manage your workspace, team, and integrations</p>
        </div>
      </div>

      <div className="settings-layout">
        <div className="settings-sidebar">
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={`settings-nav-item ${currentTab === tab.id ? 'active' : ''}`}
              onClick={() => handleTabChange(tab.id)}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="settings-content">
          {currentTab === 'profile' && (
            <div className="settings-panel animate-fade-in">
              <h2 className="panel-title">Your Profile</h2>
              <p className="panel-sub mb-6">Manage your personal information and preferences.</p>
              
              <form onSubmit={handleSaveProfile}>
                <div className="form-group" style={{ maxWidth: 400, marginBottom: 20 }}>
                  <label className="label" htmlFor="profile-full-name">Full Name</label>
                  <input 
                    id="profile-full-name"
                    className="input-base" 
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                  />
                </div>
                
                <div className="form-group" style={{ maxWidth: 400, marginBottom: 20 }}>
                  <label className="label">Email Address</label>
                  <input className="input-base" defaultValue={user?.email} disabled />
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)', marginTop: '4px' }}>Email cannot be changed here. Contact your workspace admin.</p>
                </div>

                <div className="form-group" style={{ maxWidth: 400, marginBottom: 24 }}>
                  <label className="label" htmlFor="profile-new-password">New Password</label>
                  <div className="password-wrapper" style={{ position: 'relative' }}>
                    <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', zIndex: 1 }} />
                    <input
                      id="profile-new-password"
                      name="new-password"
                      autoComplete="new-password"
                      className="input-base"
                      type={showPw ? 'text' : 'password'}
                      placeholder="Enter new password to change"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      style={{ paddingLeft: '36px', paddingRight: '38px', width: '100%' }}
                    />
                    <button 
                      type="button" 
                      className="password-toggle" 
                      onClick={() => setShowPw(p => !p)}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-tertiary)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        padding: '4px'
                      }}
                    >
                      {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)', marginTop: '4px' }}>Leave blank to keep your current password. Password must be at least 6 characters.</p>
                </div>

                <button type="submit" className="btn btn-primary btn-md" disabled={saving}>
                  {saving ? 'Saving Changes...' : 'Save Changes'}
                </button>
              </form>
            </div>
          )}

          {currentTab === 'team' && (
            <TeamManagement />
          )}

          {currentTab === 'integrations' && (
            <div className="settings-panel animate-fade-in">
              <h2 className="panel-title">Integrations</h2>
              <p className="panel-sub mb-6">Manage external APIs, channels, and AI configuration keys.</p>
              
              <EmailSettingsForm />

              {/* Google Workspace Connection Card */}
              <div style={{ 
                background: 'var(--bg-surface)', 
                border: '1px solid var(--bg-border)', 
                borderRadius: 'var(--radius-lg)', 
                padding: 'var(--space-6)', 
                maxWidth: 600,
                marginBottom: 24
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 32 }}>📧</span>
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>Google Workspace</h3>
                      <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                        Connect Gmail and Google Calendar to sync meetings and send sales sequences.
                      </p>
                    </div>
                  </div>
                  {checkingGoogle ? (
                    <span className="badge badge-gray" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <RefreshCw size={10} className="cc-spinner" /> Checking...
                    </span>
                  ) : googleConnected ? (
                    <span className="badge badge-green">Connected</span>
                  ) : (
                    <span className="badge badge-yellow">Disconnected</span>
                  )}
                </div>

                {!checkingGoogle && (
                  <div style={{ display: 'flex', gap: 12 }}>
                    {googleConnected ? (
                      <>
                        <button 
                          onClick={handleSyncGoogle} 
                          className="btn btn-primary btn-sm" 
                          disabled={syncing}
                          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                        >
                          {syncing ? <RefreshCw size={13} className="cc-spinner" /> : <Calendar size={13} />}
                          {syncing ? 'Syncing...' : 'Sync Calendar'}
                        </button>
                        <button 
                          onClick={handleDisconnectGoogle} 
                          className="btn btn-ghost btn-sm text-danger"
                          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                        >
                          <Trash2 size={13} />
                          Disconnect
                        </button>
                      </>
                    ) : (
                      <button 
                        onClick={linkGoogle} 
                        className="btn btn-primary btn-sm"
                        style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                      >
                        <Mail size={13} />
                        Connect Google Workspace
                      </button>
                    )}
                  </div>
                )}
                
                <div style={{ 
                  marginTop: 20, 
                  padding: '12px 16px', 
                  background: 'var(--bg-elevated)', 
                  borderLeft: '3px solid var(--accent-blue)', 
                  borderRadius: '4px',
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                  lineHeight: '1.6'
                }}>
                  <h4 style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8, fontSize: '13px' }}>💡 How to Connect (For SDRs):</h4>
                  <ol style={{ margin: 0, paddingLeft: 16 }}>
                    <li style={{ marginBottom: 4 }}>Click the <strong>Connect Google Workspace</strong> button above and sign in with your corporate Google Account.</li>
                    <li style={{ marginBottom: 4 }}>Ensure you grant permissions for both <strong>Calendar</strong> (to sync meetings) and <strong>Gmail</strong> (to send automation sequences).</li>
                    <li><em>Note:</em> SMTP settings are already configured globally by your administrator. No further action is required on SMTP.</li>
                  </ol>
                </div>
              </div>



              <div style={{ 
                background: 'var(--bg-surface)', 
                border: '1px solid var(--bg-border)', 
                borderRadius: 'var(--radius-lg)', 
                padding: 'var(--space-6)', 
                maxWidth: 600 
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 32 }}>🤖</span>
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>Google Gemini AI</h3>
                      <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Power AI insights, email drafting, and sales summary forecasting.</p>
                    </div>
                  </div>
                  {isGeminiConfigured() ? (
                    <span className="badge badge-green">Connected</span>
                  ) : (
                    <span className="badge badge-yellow">Demo Mode</span>
                  )}
                </div>

                <form onSubmit={handleSaveKey}>
                  <div className="form-group" style={{ marginBottom: 20 }}>
                    <label className="label">Gemini API Key</label>
                    <input 
                      type="password"
                      className="input-base" 
                      placeholder={isGeminiConfigured() ? '••••••••••••••••••••••••••••••••' : 'Enter your Gemini API key'}
                      value={keyInput}
                      onChange={(e) => setKeyInput(e.target.value)}
                    />
                    <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 8 }}>
                      Get your API key from the <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-blue)', textDecoration: 'underline' }}>Google AI Studio Console</a>.
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <button type="submit" className="btn btn-primary btn-sm">Save Key</button>
                    {localStorage.getItem('huntlo_gemini_api_key') && (
                      <button 
                        type="button" 
                        className="btn btn-ghost btn-sm text-danger"
                        onClick={handleDisconnectKey}
                      >
                        Disconnect
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>
          )}
          
          {currentTab === 'notifications' && (
             <div className="settings-panel animate-fade-in">
               <h2 className="panel-title">Notifications</h2>
               <p className="panel-sub mb-6">You have 0 unread notifications.</p>
               <div className="empty-state">
                 <Bell size={32} />
                 <h3>All caught up</h3>
               </div>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
