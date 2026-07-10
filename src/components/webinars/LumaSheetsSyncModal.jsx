import { useState } from 'react';
import Papa from 'papaparse';
import { X, Link as LinkIcon, Download, CheckCircle, AlertCircle, ArrowRight, Video } from 'lucide-react';
import useDataStore from '../../store/useDataStore';
import '../CsvImporterModal.css';

export default function LumaSheetsSyncModal({ isOpen, onClose, webinarId }) {
  const [sheetUrl, setSheetUrl] = useState('');
  const [step, setStep] = useState('input'); // 'input' | 'preview' | 'syncing' | 'done'
  const [error, setError] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [results, setResults] = useState(null);

  const { syncWebinarRegistrants } = useDataStore();

  if (!isOpen) return null;

  const handleFetch = async () => {
    if (!sheetUrl) {
      setError('Please enter a Google Sheets URL');
      return;
    }

    try {
      setError(null);
      // Transform standard URL to CSV export URL
      let exportUrl = sheetUrl;
      const sheetIdMatch = sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
      
      if (sheetIdMatch && sheetIdMatch[1]) {
        const sheetId = sheetIdMatch[1];
        exportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
      }

      const response = await fetch(exportUrl);
      
      if (!response.ok) {
        throw new Error('Failed to fetch from Google Sheets. Ensure the sheet is set to "Anyone with the link can view".');
      }

      const csvText = await response.text();

      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (!results.data || results.data.length === 0) {
            setError('The sheet appears to be empty or invalid.');
            return;
          }
          setParsedData(results.data);
          setStep('preview');
        },
        error: (err) => {
          throw new Error(`Failed to parse CSV: ${err.message}`);
        }
      });
    } catch (err) {
      setError(err.message || 'An unexpected error occurred.');
    }
  };

  const handleSync = async () => {
    try {
      setStep('syncing');
      setError(null);
      
      const syncResults = await syncWebinarRegistrants(webinarId, parsedData);
      setResults(syncResults);
      setStep('done');
    } catch (err) {
      setError(`Sync failed: ${err.message}`);
      setStep('preview');
    }
  };

  const reset = () => {
    setStep('input');
    setSheetUrl('');
    setParsedData([]);
    setError(null);
  };

  return (
    <div className="global-slider-overlay" onClick={onClose}>
      <div className="global-slider-content" onClick={e => e.stopPropagation()}>
        <div className="global-slider-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Video size={18} color="var(--accent-blue)" />
            <h2>Luma / Google Sheets Sync</h2>
          </div>
          <button className="btn-close" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="global-slider-body">
          {error && (
            <div className="csv-alert error" style={{ alignItems: 'flex-start' }}>
              <AlertCircle size={18} style={{ marginTop: '2px', flexShrink: 0 }} />
              <div style={{ flex: 1, lineHeight: '1.4' }}>{error}</div>
            </div>
          )}

          {step === 'input' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Connect your Luma registrations automatically. Paste the view-only link to your Google Sheet export. Huntlo will automatically create contacts, score leads, and generate deals for VIPs.
              </div>
              <div className="form-group">
                <label className="label">Google Sheets URL</label>
                <div style={{ position: 'relative' }}>
                  <LinkIcon size={16} color="var(--text-tertiary)" style={{ position: 'absolute', left: 12, top: 10 }} />
                  <input 
                    className="input-base" 
                    style={{ paddingLeft: 36 }}
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                    value={sheetUrl}
                    onChange={(e) => setSheetUrl(e.target.value)}
                  />
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>
                  Ensure sharing is set to "Anyone with the link can view".
                </div>
              </div>
              <div className="csv-actions" style={{ borderTop: 'none', paddingTop: 0, marginTop: 8 }}>
                <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
                <button className="btn btn-primary" onClick={handleFetch}>
                  Fetch Registrants <Download size={14} style={{ marginLeft: 4 }} />
                </button>
              </div>
            </div>
          )}

          {step === 'preview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <div style={{ fontSize: 48, fontWeight: 700, color: 'var(--accent-blue)', lineHeight: 1 }}>
                  {parsedData.length}
                </div>
                <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 8, fontWeight: 500 }}>
                  Registrants Found
                </div>
              </div>
              
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', background: 'var(--bg-hover)', padding: 12, borderRadius: 8, border: '1px solid var(--bg-border)' }}>
                <strong>What happens next:</strong>
                <ul style={{ margin: '8px 0 0', paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <li>New Contacts & Companies will be auto-created</li>
                  <li>Lead scores will be calculated based on Job Titles</li>
                  <li>High-intent leads will instantly generate Deals</li>
                  <li>SDR tasks will be created for follow-up</li>
                </ul>
              </div>

              <div className="csv-actions">
                <button className="btn btn-ghost" onClick={() => setStep('input')}>Back</button>
                <button className="btn btn-primary" onClick={handleSync}>
                  Sync to Huntlo CRM <ArrowRight size={16} style={{ marginLeft: 4 }} />
                </button>
              </div>
            </div>
          )}

          {step === 'syncing' && (
            <div className="csv-loading-zone">
              <div className="spinner"></div>
              <h3>Syncing with Huntlo CRM...</h3>
              <p>Applying intelligence and generating deals.</p>
            </div>
          )}

          {step === 'done' && (
            <div className="csv-success-zone">
              <CheckCircle size={48} color="var(--success)" />
              <h3>Sync Complete!</h3>
              <p>
                <strong style={{ color: 'var(--success)' }}>{results?.synced || 0}</strong> registrants synced.
              </p>
              <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 12, color: 'var(--text-secondary)' }}>
                <div><strong>{results?.newContacts || 0}</strong> New Contacts</div>
                <div><strong>{results?.newDeals || 0}</strong> Deals Created</div>
                <div><strong>{results?.newTasks || 0}</strong> Tasks Created</div>
              </div>
              <button className="btn btn-primary mt-4" onClick={() => { onClose(); reset(); }}>
                View Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
