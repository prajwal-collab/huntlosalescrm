import { useState, useRef, useEffect } from 'react';
import Papa from 'papaparse';
import { X, Upload, CheckCircle, AlertCircle, ArrowRight, Download } from 'lucide-react';
import useDataStore from '../store/useDataStore';
import './CsvImporterModal.css'; // We'll create this next

const CONTACT_FIELDS = [
  { key: 'name', label: 'Full Name', required: true },
  { key: 'email', label: 'Email Address' },
  { key: 'company', label: 'Company Name' },
  { key: 'title', label: 'Job Title' },
  { key: 'phone', label: 'Phone Number' },
  { key: 'linkedin', label: 'LinkedIn URL' }
];

const COMPANY_FIELDS = [
  { key: 'name', label: 'Company Name', required: true },
  { key: 'domain', label: 'Website Domain' },
  { key: 'industry', label: 'Industry' },
  { key: 'employees', label: 'Employee Count' },
  { key: 'revenue', label: 'Annual Revenue' }
];

const LEAD_FIELDS = [
  { key: 'company_name', label: 'Company Name', required: true },
  { key: 'contact_name', label: 'Contact Name' },
  { key: 'email', label: 'Email Address' },
  { key: 'designation', label: 'Job Title' },
  { key: 'contact_linkedin', label: 'LinkedIn URL' },
  { key: 'industry', label: 'Industry' },
];

export default function CsvImporterModal({ isOpen, onClose, type = 'contacts' }) {
  const [step, setStep] = useState('upload'); // 'upload' | 'map' | 'importing' | 'done'
  const [file, setFile] = useState(null);
  const [headers, setHeaders] = useState([]);
  const [rows, setRows] = useState([]);
  const [mapping, setMapping] = useState({});
  const [error, setError] = useState(null);
  const [results, setResults] = useState({ success: 0, failed: 0 });
  const fileInputRef = useRef(null);

  const { bulkCreateContacts, bulkCreateCompanies, bulkCreateLeads } = useDataStore();
  const crmFields = type === 'contacts' ? CONTACT_FIELDS : type === 'leads' ? LEAD_FIELDS : COMPANY_FIELDS;

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('upload');
      setFile(null);
      setHeaders([]);
      setRows([]);
      setMapping({});
      setError(null);
      setResults({ success: 0, failed: 0 });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;
    
    if (uploadedFile.type !== 'text/csv' && !uploadedFile.name.endsWith('.csv')) {
      setError('Please upload a valid CSV file.');
      return;
    }

    setFile(uploadedFile);
    setError(null);

    Papa.parse(uploadedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (!results.meta.fields || results.meta.fields.length === 0) {
          setError('Could not detect any columns in the CSV.');
          return;
        }
        setHeaders(results.meta.fields);
        setRows(results.data);
        
        // Auto-map logic based on simple string matching
        const initialMapping = {};
        crmFields.forEach(field => {
          const match = results.meta.fields.find(h => 
            h.toLowerCase().includes(field.key.toLowerCase()) || 
            field.label.toLowerCase().includes(h.toLowerCase())
          );
          if (match) initialMapping[field.key] = match;
        });
        setMapping(initialMapping);
        setStep('map');
      },
      error: (err) => {
        setError(`Failed to parse CSV: ${err.message}`);
      }
    });
  };

  const executeImport = async () => {
    // Validate required fields
    const missingReq = crmFields.filter(f => f.required && !mapping[f.key]);
    if (missingReq.length > 0) {
      setError(`Please map all required fields: ${missingReq.map(f => f.label).join(', ')}`);
      return;
    }

    if (type === 'contacts') {
      if (!mapping['email'] && !mapping['phone']) {
        setError('Please map either Email Address OR Phone Number. At least one is required.');
        return;
      }
    }
    if (type === 'leads') {
      if (!mapping['company_name']) {
        setError('Company Name is required for Leads.');
        return;
      }
    }

    setStep('importing');
    setError(null);

    // Transform CSV rows to CRM objects
    const mappedData = rows.map(row => {
      const obj = {};
      crmFields.forEach(field => {
        const csvHeader = mapping[field.key];
        if (csvHeader && row[csvHeader]) {
          obj[field.key] = row[csvHeader];
        } else {
          obj[field.key] = null; // or default
        }
      });
      // Add status/stages defaults
      if (type === 'contacts') obj.status = 'New';
      if (type === 'companies') obj.status = 'Target';
      if (type === 'leads') obj.stage = 'New Lead';
      return obj;
    }).filter(obj => {
      if (type === 'leads') {
        return obj.company_name && obj.company_name.trim() !== '';
      }
      if (!obj.name || obj.name.trim() === '') return false;
      if (type === 'contacts') {
        return (obj.email && obj.email.trim() !== '') || (obj.phone && obj.phone.trim() !== '');
      }
      return true;
    });

    if (mappedData.length === 0) {
      setError('No valid data found to import.');
      setStep('map');
      return;
    }

    try {
      // Chunking if massive, but let's assume < 1000 for standard UI
      if (type === 'contacts') {
        await bulkCreateContacts(mappedData);
      } else if (type === 'leads') {
        await bulkCreateLeads(mappedData);
      } else {
        await bulkCreateCompanies(mappedData);
      }
      setResults({ success: mappedData.length, failed: 0 });
      setStep('done');
    } catch (err) {
      console.error(err);
      setError(`Import failed: ${err.message}`);
      setStep('map');
    }
  };

  const downloadTemplate = () => {
    const headers = crmFields.map(f => f.label).join(',');
    const blob = new Blob([headers], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `huntlo_${type}_template.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="csv-modal-overlay">
      <div className="csv-modal-content">
        <div className="csv-modal-header">
          <h2>Import {type === 'contacts' ? 'Contacts' : type === 'leads' ? 'Leads' : 'Accounts'}</h2>
          <button className="btn-close" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="csv-modal-body">
          {error && (
            <div className="csv-alert error">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {step === 'upload' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="csv-upload-zone" onClick={() => fileInputRef.current?.click()}>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  accept=".csv" 
                  style={{ display: 'none' }} 
                  onChange={handleFileUpload}
                />
                <Upload size={48} color="var(--text-tertiary)" />
                <h3>Select a CSV file to import</h3>
                <p>Drag and drop or click to browse</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <button className="btn btn-ghost btn-sm" onClick={downloadTemplate} style={{ gap: 6 }}>
                  <Download size={14} /> Download CSV Template
                </button>
              </div>
            </div>
          )}

          {step === 'map' && (
            <div className="csv-mapping-area">
              <p className="csv-instruction">Map your CSV columns to Huntlo CRM fields. We found {rows.length} rows.</p>
              
              <div className="csv-mapping-grid">
                <div className="mapping-header">Huntlo Field</div>
                <div className="mapping-header">Your CSV Column</div>
                
                {crmFields.map(field => (
                  <div key={field.key} className="mapping-row">
                    <div className="mapping-target">
                      {field.label} {field.required && <span className="req">*</span>}
                    </div>
                    <div className="mapping-source">
                      <select 
                        className="input-base"
                        value={mapping[field.key] || ''}
                        onChange={(e) => setMapping({ ...mapping, [field.key]: e.target.value })}
                      >
                        <option value="">-- Ignore this field --</option>
                        {headers.map(h => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>

              <div className="csv-actions">
                <button className="btn btn-ghost" onClick={() => setStep('upload')}>Back</button>
                <button className="btn btn-primary" onClick={executeImport}>
                  Import {rows.length} Records <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {step === 'importing' && (
            <div className="csv-loading-zone">
              <div className="spinner"></div>
              <h3>Importing Records...</h3>
              <p>Please wait while we process your data securely.</p>
            </div>
          )}

          {step === 'done' && (
            <div className="csv-success-zone">
              <CheckCircle size={48} color="var(--success)" />
              <h3>Import Complete!</h3>
              <p>Successfully imported {results.success} {type}.</p>
              <button className="btn btn-primary mt-4" onClick={onClose}>
                View My {type === 'contacts' ? 'Contacts' : 'Accounts'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
