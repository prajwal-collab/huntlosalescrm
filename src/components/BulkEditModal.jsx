import { useState } from 'react';
import { X, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import useDataStore from '../store/useDataStore';
import useAuthStore from '../store/useAuthStore';
import './BulkEditModal.css';

const LEADS_STAGES = [
  'New Lead', 'Researching', 'Ready for Outreach', 'Outreach Started',
  'Engaged', 'Qualified', 'Demo Scheduled', 'Demo Complete',
  'Trial Started', 'Customer', 'Lost'
];

export default function BulkEditModal({ isOpen, onClose, entityType, selectedIds, onClearSelection }) {
  const { team } = useAuthStore();
  const { bulkUpdateLeads, bulkUpdateContacts, bulkUpdateCompanies } = useDataStore();
  
  const [field, setField] = useState('');
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const FIELDS = {
    leads: [
      { id: 'stage', label: 'Stage' },
      { id: 'owner_id', label: 'Owner' }
    ],
    contacts: [
      { id: 'status', label: 'Status' },
      { id: 'owner_id', label: 'Owner' }
    ],
    companies: [
      { id: 'status', label: 'Status' },
      { id: 'owner_id', label: 'Owner' }
    ]
  };

  const currentFields = FIELDS[entityType] || [];

  const handleFieldChange = (e) => {
    setField(e.target.value);
    setValue(''); // Reset value when field changes
  };

  const handleSave = async () => {
    if (!field || !value) {
      setError('Please select a field and a value.');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const updates = { [field]: value };
      if (entityType === 'leads') {
        await bulkUpdateLeads(selectedIds, updates);
      } else if (entityType === 'contacts') {
        await bulkUpdateContacts(selectedIds, updates);
      } else if (entityType === 'companies') {
        await bulkUpdateCompanies(selectedIds, updates);
      }
      
      setSuccess(true);
      setTimeout(() => {
        onClearSelection();
        onClose();
        setSuccess(false);
        setField('');
        setValue('');
      }, 1500);
    } catch (err) {
      setError(`Failed to update records: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="csv-modal-overlay">
      <div className="csv-modal-content bulk-edit-modal">
        <div className="csv-modal-header">
          <h2>Bulk Edit {selectedIds.length} {entityType}</h2>
          <button className="btn-close" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="csv-modal-body">
          {success ? (
            <div className="csv-success-zone" style={{ padding: '40px 20px', minHeight: 'auto' }}>
              <CheckCircle size={48} color="var(--success)" />
              <h3 style={{ marginTop: 16 }}>Update Successful!</h3>
              <p>Successfully updated {selectedIds.length} records.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {error && (
                <div className="csv-alert error" style={{ padding: 12, borderRadius: 8 }}>
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              <div className="bulk-edit-form-group">
                <label>Field to update</label>
                <select className="input-base" value={field} onChange={handleFieldChange}>
                  <option value="">-- Select Field --</option>
                  {currentFields.map(f => (
                    <option key={f.id} value={f.id}>{f.label}</option>
                  ))}
                </select>
              </div>

              {field && (
                <div className="bulk-edit-form-group">
                  <label>New Value</label>
                  {field === 'stage' && (
                    <select className="input-base" value={value} onChange={e => setValue(e.target.value)}>
                      <option value="">-- Select Stage --</option>
                      {LEADS_STAGES.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  )}
                  {field === 'status' && (
                    <select className="input-base" value={value} onChange={e => setValue(e.target.value)}>
                      <option value="">-- Select Status --</option>
                      <option value="New">New</option>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="DNC">Do Not Contact</option>
                    </select>
                  )}
                  {field === 'owner_id' && (
                    <select className="input-base" value={value} onChange={e => setValue(e.target.value)}>
                      <option value="">-- Select Owner --</option>
                      {team.map(member => (
                        <option key={member.id} value={member.id}>{member.name}</option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              <div className="csv-actions" style={{ marginTop: 10 }}>
                <button className="btn btn-ghost" onClick={onClose} disabled={loading}>Cancel</button>
                <button className="btn btn-primary" onClick={handleSave} disabled={loading || !field || !value}>
                  {loading ? <Loader size={16} className="spinner-icon" /> : 'Apply to all'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
