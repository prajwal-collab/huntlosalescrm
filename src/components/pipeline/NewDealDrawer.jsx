import { useState } from 'react';
import { X, AlertCircle, Loader } from 'lucide-react';
import useDataStore from '../../store/useDataStore';
import './DealDrawer.css';

export default function NewDealDrawer({ onClose }) {
  const { companies, createDeal } = useDataStore();
  const [formData, setFormData] = useState({ title: '', company_id: '', arr: '', urgency: 'medium' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.company_id) return;
    setSaving(true);
    setError(null);
    try {
      await createDeal({
        title: formData.title,
        company_id: formData.company_id,
        arr: Number(formData.arr),
        stage: 'Discovery',
        urgency: formData.urgency,
        engagement_score: 0
      });
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to add deal');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="deal-drawer animate-slide-right" onClick={e => e.stopPropagation()}>
        <div className="drawer-header" style={{ padding: 24 }}>
          <h2 className="panel-title">Add Deal</h2>
          <button type="button" className="drawer-close" onClick={onClose} style={{ marginLeft: 'auto' }}>
            <X size={16}/>
          </button>
        </div>
        <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '24px' }}>
          {error && (
            <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={14} /> {error}
            </div>
          )}
          <div className="form-group">
            <label className="label">Deal Title</label>
            <input className="input-base" autoFocus required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. Enterprise Q3 Expansion" />
          </div>
          <div className="form-group">
            <label className="label">Company</label>
            <select className="input-base" required value={formData.company_id} onChange={e => setFormData({...formData, company_id: e.target.value})}>
              <option value="">Select Company</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="label">ARR Estimate ($)</label>
            <input className="input-base" type="number" required value={formData.arr} onChange={e => setFormData({...formData, arr: e.target.value})} />
          </div>
          <div className="form-group">
            <label className="label">Urgency</label>
            <select className="input-base" value={formData.urgency} onChange={e => setFormData({...formData, urgency: e.target.value})}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary btn-md w-full" style={{ marginTop: 8 }} disabled={saving}>
            {saving ? <Loader size={14} className="cc-spinner" /> : 'Save Deal'}
          </button>
        </form>
      </div>
    </div>
  );
}
