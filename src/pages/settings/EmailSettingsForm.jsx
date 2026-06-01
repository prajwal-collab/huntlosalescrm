import { useState, useEffect } from 'react';
import useDataStore from '../../store/useDataStore';

export default function EmailSettingsForm() {
  const { fetchEmailSettings, saveEmailSettings } = useDataStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    smtp_host: '',
    smtp_port: 587,
    smtp_user: '',
    smtp_pass: '',
    sender_name: ''
  });

  const loadSettings = async () => {
    try {
      const data = await fetchEmailSettings();
      if (data) {
        setFormData({
          smtp_host: data.smtp_host || '',
          smtp_port: data.smtp_port || 587,
          smtp_user: data.smtp_user || '',
          smtp_pass: data.smtp_pass || '',
          sender_name: data.sender_name || ''
        });
      }
    } catch (err) {
      console.error('Failed to load email settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'smtp_port' ? parseInt(value) || '' : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await saveEmailSettings(formData);
      alert('Email settings saved securely!');
    } catch (err) {
      alert('Error saving settings: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: '24px', fontSize: '13px' }}>Loading...</div>;

  return (
    <div style={{ 
      background: 'var(--bg-surface)', 
      border: '1px solid var(--bg-border)', 
      borderRadius: 'var(--radius-lg)', 
      padding: 'var(--space-6)', 
      maxWidth: 600,
      marginBottom: 24
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <span style={{ fontSize: 32 }}>📧</span>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>Personal SMTP Settings</h3>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Send sequences directly from your own email address (e.g. Outlook, SendGrid).</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="form-group">
            <label className="label">Sender Name</label>
            <input 
              required
              name="sender_name"
              type="text" 
              className="input-base" 
              placeholder="e.g. John Doe"
              value={formData.sender_name}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label className="label">SMTP Email (User)</label>
            <input 
              required
              name="smtp_user"
              type="email" 
              className="input-base" 
              placeholder="e.g. john@yourcompany.com"
              value={formData.smtp_user}
              onChange={handleChange}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
          <div className="form-group">
            <label className="label">SMTP Host</label>
            <input 
              required
              name="smtp_host"
              type="text" 
              className="input-base" 
              placeholder="e.g. smtp.gmail.com"
              value={formData.smtp_host}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label className="label">Port</label>
            <input 
              required
              name="smtp_port"
              type="number" 
              className="input-base" 
              placeholder="587"
              value={formData.smtp_port}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="label">App Password</label>
          <input 
            required
            name="smtp_pass"
            type="password" 
            className="input-base" 
            placeholder="••••••••••••••••"
            value={formData.smtp_pass}
            onChange={handleChange}
          />
          <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 8 }}>
            For Gmail/Workspace, generate an App Password. Do not use your regular password.
          </p>
        </div>

        <div style={{ marginTop: 8 }}>
          <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </form>
    </div>
  );
}
