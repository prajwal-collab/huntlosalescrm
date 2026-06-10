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
  { key: 'company_type', label: 'Company Type' },
  { key: 'website', label: 'Website' },
  { key: 'linkedin_url', label: 'Company LinkedIn' },
  { key: 'industry', label: 'Industry' },
  { key: 'location', label: 'Location' },
  { key: 'employee_size', label: 'Employee Size' },
  { key: 'recruiter_team_size', label: 'Recruiter Team Size' },
  { key: 'contact_name', label: 'Contact Name' },
  { key: 'designation', label: 'Designation' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone / WhatsApp' },
  { key: 'contact_linkedin', label: 'Contact LinkedIn' },
  { key: 'hiring_activity', label: 'Hiring Activity' },
  { key: 'recruiter_hiring', label: 'Recruiter Hiring' },
  { key: 'funding_activity', label: 'Funding Activity' },
  { key: 'linkedin_activity', label: 'LinkedIn Activity' },
  { key: 'job_posting_activity', label: 'Job Postings Active' },
  { key: 'company_growth', label: 'Company Growth' },
  { key: 'next_action', label: 'Next Action' },
  { key: 'next_action_due', label: 'Due Date' },
  { key: 'next_action_priority', label: 'Priority' },
  { key: 'estimated_mrr', label: 'Est. MRR' },
  { key: 'stage', label: 'Stage' }
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

  const { bulkCreateContacts, bulkCreateCompanies, bulkCreateLeads, contacts, companies, leads } = useDataStore();
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
      
      // Basic flat fields
      crmFields.forEach(field => {
        const csvHeader = mapping[field.key];
        if (csvHeader && row[csvHeader] && row[csvHeader].trim() !== '') {
          obj[field.key] = row[csvHeader];
        }
      });
      
      if (type === 'leads') {
        // Group signals into JSONB
        obj.signals = {
          hiring_activity: obj.hiring_activity === 'true' || obj.hiring_activity === 'yes',
          recruiter_hiring: obj.recruiter_hiring === 'true' || obj.recruiter_hiring === 'yes',
          funding_activity: obj.funding_activity === 'true' || obj.funding_activity === 'yes',
          linkedin_activity: obj.linkedin_activity === 'true' || obj.linkedin_activity === 'yes',
          job_posting_activity: obj.job_posting_activity === 'true' || obj.job_posting_activity === 'yes',
          company_growth: obj.company_growth === 'true' || obj.company_growth === 'yes'
        };
        // Clean up raw flat signal keys so Supabase doesn't error on insert
        delete obj.hiring_activity;
        delete obj.recruiter_hiring;
        delete obj.funding_activity;
        delete obj.linkedin_activity;
        delete obj.job_posting_activity;
        delete obj.company_growth;
        
        // Ensure defaults for stage/MRR
        if (!obj.stage) obj.stage = 'New Lead';
        if (obj.estimated_mrr) obj.estimated_mrr = parseInt(obj.estimated_mrr) || 0;
        if (obj.recruiter_team_size) obj.recruiter_team_size = parseInt(obj.recruiter_team_size) || 0;
      }

      // Add status/stages defaults for other types
      if (type === 'contacts') obj.status = 'New';
      if (type === 'companies') obj.status = 'Target';
      
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

    // Duplicate detection
    let dedupedData = mappedData;
    let skippedCount = 0;
    if (type === 'contacts') {
      const existingEmails = new Set(contacts.map(c => (c.email || '').toLowerCase()));
      dedupedData = mappedData.filter(row => {
        if (row.email && existingEmails.has(row.email.toLowerCase())) {
          skippedCount++;
          return false;
        }
        return true;
      });
    } else if (type === 'companies') {
      const existingNames = new Set(companies.map(c => (c.name || '').toLowerCase()));
      const existingDomains = new Set(companies.map(c => (c.website || '').toLowerCase()).filter(Boolean));
      dedupedData = mappedData.filter(row => {
        const nameDupe = row.name && existingNames.has(row.name.toLowerCase());
        const domainDupe = row.domain && existingDomains.has(row.domain.toLowerCase());
        if (nameDupe || domainDupe) {
          skippedCount++;
          return false;
        }
        return true;
      });
    } else if (type === 'leads') {
      const existingLeadNames = new Set(leads.map(l => (l.company_name || '').toLowerCase()));
      dedupedData = mappedData.filter(row => {
        if (row.company_name && existingLeadNames.has(row.company_name.toLowerCase())) {
          skippedCount++;
          return false;
        }
        return true;
      });
    }

    if (dedupedData.length === 0) {
      setError(`All ${mappedData.length} row(s) are duplicates already in your CRM. Nothing was imported.`);
      setStep('map');
      return;
    }

    try {
      // Chunking if massive, but let's assume < 1000 for standard UI
      if (type === 'contacts') {
        await bulkCreateContacts(dedupedData);
      } else if (type === 'leads') {
        await bulkCreateLeads(dedupedData);
      } else {
        await bulkCreateCompanies(dedupedData);
      }
      setResults({ success: dedupedData.length, failed: 0, skipped: skippedCount });
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
              <p>
                <strong style={{ color: 'var(--success)' }}>{results.success}</strong> record{results.success !== 1 ? 's' : ''} imported successfully.
              </p>
              {results.skipped > 0 && (
                <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginTop: 6 }}>
                  <strong>{results.skipped}</strong> duplicate{results.skipped !== 1 ? 's' : ''} skipped (already exist in your CRM).
                </p>
              )}
              <button className="btn btn-primary mt-4" onClick={onClose}>
                View My {type === 'contacts' ? 'Contacts' : type === 'leads' ? 'Leads' : 'Accounts'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
