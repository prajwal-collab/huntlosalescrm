// ============================================
// HUNTLO SALES OS — SETTINGS PAGE
// ============================================
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { User, Key, Bell, Shield } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import TeamManagement from './settings/TeamManagement';
import { isGeminiConfigured } from '../lib/gemini';
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
  const { user } = useAuthStore();
  const [keyInput, setKeyInput] = useState(localStorage.getItem('huntlo_gemini_api_key') || '');

  const handleTabChange = (tabId) => {
    setSearchParams({ tab: tabId });
  };

  const handleSaveKey = (e) => {
    e.preventDefault();
    localStorage.setItem('huntlo_gemini_api_key', keyInput);
    alert('Gemini API key saved successfully!');
    // Reroute to force state refresh
    setSearchParams({ tab: 'integrations' });
  };

  const handleDisconnectKey = () => {
    localStorage.removeItem('huntlo_gemini_api_key');
    setKeyInput('');
    alert('API key removed.');
    setSearchParams({ tab: 'integrations' });
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
              
              <div className="form-group" style={{ maxWidth: 400, marginBottom: 20 }}>
                <label className="label">Full Name</label>
                <input className="input-base" defaultValue={user?.user_metadata?.full_name || 'Alex Reid'} />
              </div>
              <div className="form-group" style={{ maxWidth: 400, marginBottom: 24 }}>
                <label className="label">Email Address</label>
                <input className="input-base" defaultValue={user?.email} disabled />
                <p className="text-xs" style={{ color: 'var(--text-tertiary)', marginTop: '4px' }}>Email cannot be changed here. Contact your workspace admin.</p>
              </div>
              <button className="btn btn-primary btn-md">Save Changes</button>
            </div>
          )}

          {currentTab === 'team' && (
            <TeamManagement />
          )}

          {currentTab === 'integrations' && (
            <div className="settings-panel animate-fade-in">
              <h2 className="panel-title">Integrations</h2>
              <p className="panel-sub mb-6">Manage external APIs, channels, and AI configuration keys.</p>

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
