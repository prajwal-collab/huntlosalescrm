import React, { useState, useMemo, useRef } from 'react';
import { MapPin, Camera, CheckCircle, Navigation, Clock, LogOut, Search, User, Building2, UploadCloud, Map } from 'lucide-react';
import useDataStore from '../store/useDataStore';
import useAuthStore from '../store/useAuthStore';
import './FieldOps.css';

export default function FieldOps() {
  const { tasks, leads, logFieldCheckIn, logFieldCheckOut, createLead } = useDataStore();
  const { user, team } = useAuthStore();
  
  // Role checks
  const userProfile = team?.find(m => m.id === user?.id);
  const isAdmin = user?.email === 'prajwal@earlyjobs.in' || userProfile?.role === 'Admin';
  
  const [activeTab, setActiveTab] = useState('my_visits'); // my_visits, scanner, admin_tracker
  
  // State for My Visits
  const [selectedLeadId, setSelectedLeadId] = useState('');
  const [photoBase64, setPhotoBase64] = useState('');
  const [location, setLocation] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [checkOutNotes, setCheckOutNotes] = useState('');
  
  const fileInputRef = useRef(null);

  // Active check-in for the current user
  const activeVisit = useMemo(() => {
    return tasks.find(t => t.type === 'field_visit' && t.status === 'in_progress' && t.owner_id === user?.id);
  }, [tasks, user?.id]);

  // Handle Geolocation
  const handleGetLocation = () => {
    setIsLocating(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setIsLocating(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Failed to get location. Please ensure location permissions are granted.');
          setIsLocating(false);
        },
        { enableHighAccuracy: true }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
      setIsLocating(false);
    }
  };

  // Handle Photo Capture
  const handlePhotoCapture = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoBase64(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Check In Submit
  const handleCheckIn = async () => {
    if (!selectedLeadId) {
      alert('Please select a Lead/Company to visit.');
      return;
    }
    if (!location) {
      alert('Please fetch your GPS location first.');
      return;
    }
    if (!photoBase64) {
      alert('Please take a photo for verification.');
      return;
    }

    setIsSubmitting(true);
    try {
      await logFieldCheckIn(selectedLeadId, location, photoBase64);
      // Reset form
      setSelectedLeadId('');
      setPhotoBase64('');
      setLocation(null);
    } catch (err) {
      alert('Failed to check in: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check Out Submit
  const handleCheckOut = async () => {
    if (!activeVisit) return;
    setIsSubmitting(true);
    try {
      await logFieldCheckOut(activeVisit.id, checkOutNotes);
      setCheckOutNotes('');
    } catch (err) {
      alert('Failed to check out: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Card Scanner State ---
  const [cardPhoto, setCardPhoto] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardCompany, setCardCompany] = useState('');
  const [cardPhone, setCardPhone] = useState('');
  const [cardEmail, setCardEmail] = useState('');
  
  const handleCardCapture = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCardPhoto(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveCardLead = async () => {
    if (!cardName && !cardCompany) {
      alert('Please enter at least a name or company.');
      return;
    }
    setIsSubmitting(true);
    try {
      await createLead({
        contact_name: cardName,
        company_name: cardCompany || 'Unknown Company',
        phone: cardPhone,
        email: cardEmail,
        source: 'Field Card Scanner',
        stage: 'New Lead',
        notes: `Card Photo Attached.\n\n${cardPhoto ? 'Photo Data Saved in Store.' : ''}`
      });
      // Clear form
      setCardPhoto('');
      setCardName('');
      setCardCompany('');
      setCardPhone('');
      setCardEmail('');
      alert('Lead successfully saved from card scanner!');
    } catch (err) {
      alert('Failed to save lead: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Admin Tracker ---
  const fieldVisits = useMemo(() => {
    return tasks
      .filter(t => t.type === 'field_visit')
      .map(t => {
        let parsed = {};
        try { parsed = JSON.parse(t.notes || '{}'); } catch(e) {}
        const lead = leads.find(l => l.id === parsed.lead_id);
        const owner = team?.find(m => m.id === t.owner_id);
        return {
          id: t.id,
          status: t.status,
          ownerName: owner?.name || owner?.email || 'Unknown Rep',
          leadName: lead?.contact_name || lead?.company_name || 'Unknown Lead',
          lat: parsed.check_in_lat,
          lng: parsed.check_in_lng,
          checkInTime: parsed.check_in_time,
          checkOutTime: parsed.check_out_time,
          photo: parsed.photo_url,
          notes: parsed.meeting_notes,
          timestamp: new Date(t.created_at).getTime()
        };
      })
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [tasks, leads, team]);

  return (
    <div className="fieldops-container">
      <header className="fieldops-header">
        <div className="fieldops-title-section">
          <div className="fieldops-title-icon"><MapPin size={22} /></div>
          <div>
            <h1 className="fieldops-title">Field Operations</h1>
            <p className="fieldops-subtitle">Check-in, capture evidence, and track field visits.</p>
          </div>
        </div>
        <div className="fieldops-tabs">
          <button 
            className={`fieldops-tab ${activeTab === 'my_visits' ? 'active' : ''}`}
            onClick={() => setActiveTab('my_visits')}
          >
            📍 My Visits
          </button>
          <button 
            className={`fieldops-tab ${activeTab === 'scanner' ? 'active' : ''}`}
            onClick={() => setActiveTab('scanner')}
          >
            📸 Card Scanner
          </button>
          {isAdmin && (
            <button 
              className={`fieldops-tab ${activeTab === 'admin_tracker' ? 'active' : ''}`}
              onClick={() => setActiveTab('admin_tracker')}
            >
              🗺️ Admin Tracker
            </button>
          )}
        </div>
      </header>

      <main className="fieldops-main">
        {activeTab === 'my_visits' && (
          <div className="checkin-card">
            {activeVisit ? (
              // CHECK-OUT FLOW
              <div>
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, borderRadius: '50%', background: 'rgba(22, 163, 74, 0.1)', color: '#16a34a', marginBottom: 12 }}>
                    <MapPin size={32} />
                  </div>
                  <h2 style={{ fontSize: 20, margin: '0 0 8px 0' }}>You are checked in!</h2>
                  {(() => {
                    let parsed = {};
                    try { parsed = JSON.parse(activeVisit.notes || '{}'); } catch(e) {}
                    const visitLead = leads.find(l => l.id === parsed.lead_id);
                    return (
                      <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                        Meeting with <strong>{visitLead?.contact_name || visitLead?.company_name || 'Client'}</strong>
                      </p>
                    );
                  })()}
                </div>

                <div className="form-group">
                  <label>Meeting Notes / Outcome</label>
                  <textarea 
                    rows="4" 
                    placeholder="Discussed requirements, next steps..."
                    value={checkOutNotes}
                    onChange={(e) => setCheckOutNotes(e.target.value)}
                  />
                </div>

                <button 
                  className="btn-danger" 
                  onClick={handleCheckOut}
                  disabled={isSubmitting}
                >
                  <LogOut size={18} /> {isSubmitting ? 'Processing...' : 'Check Out & Complete'}
                </button>
              </div>
            ) : (
              // CHECK-IN FLOW
              <div>
                <h2 style={{ fontSize: 18, marginBottom: 20 }}>Log a New Visit</h2>
                
                <div className="form-group">
                  <label>Client / Lead</label>
                  <select 
                    value={selectedLeadId} 
                    onChange={(e) => setSelectedLeadId(e.target.value)}
                  >
                    <option value="">Select a lead...</option>
                    {leads.map(l => (
                      <option key={l.id} value={l.id}>
                        {l.company_name || l.contact_name} {l.contact_name ? `(${l.contact_name})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>GPS Location Verification</label>
                  {location ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px', background: 'rgba(22, 163, 74, 0.1)', color: '#16a34a', borderRadius: 8, fontSize: 14, fontWeight: 600 }}>
                      <CheckCircle size={18} /> Location Captured ({location.lat.toFixed(4)}, {location.lng.toFixed(4)})
                    </div>
                  ) : (
                    <button type="button" className="btn-primary" style={{ background: 'var(--bg-base)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)' }} onClick={handleGetLocation} disabled={isLocating}>
                      <Navigation size={18} /> {isLocating ? 'Locating...' : 'Get Current Location'}
                    </button>
                  )}
                </div>

                <div className="form-group">
                  <label>Photo Evidence (Storefront / Meeting Room)</label>
                  <input 
                    type="file" 
                    accept="image/*" 
                    capture="environment" 
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={handlePhotoCapture}
                  />
                  
                  {photoBase64 ? (
                    <div>
                      <img src={photoBase64} alt="Check-in evidence" className="photo-preview" />
                      <button type="button" className="btn-primary" style={{ background: 'var(--bg-base)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)' }} onClick={() => fileInputRef.current?.click()}>
                        Retake Photo
                      </button>
                    </div>
                  ) : (
                    <div className="photo-upload-zone" onClick={() => fileInputRef.current?.click()}>
                      <Camera size={32} style={{ color: 'var(--text-tertiary)', marginBottom: 12 }} />
                      <div style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Tap to open camera</div>
                    </div>
                  )}
                </div>

                <button 
                  className="btn-primary" 
                  onClick={handleCheckIn}
                  disabled={isSubmitting || !location || !photoBase64 || !selectedLeadId}
                  style={{ marginTop: 24 }}
                >
                  <MapPin size={18} /> {isSubmitting ? 'Checking In...' : 'Verify & Check In'}
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'scanner' && (
          <div className="scanner-card">
            <h2 style={{ fontSize: 18, marginBottom: 8 }}>Card Scanner</h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>Snap a photo of a visiting card to add a lead. (OCR coming soon!)</p>
            
            <input 
              type="file" 
              accept="image/*" 
              capture="environment" 
              id="card-upload"
              style={{ display: 'none' }}
              onChange={handleCardCapture}
            />
            
            {cardPhoto ? (
              <img src={cardPhoto} alt="Card" className="photo-preview" />
            ) : (
              <div className="photo-upload-zone" onClick={() => document.getElementById('card-upload').click()}>
                <Camera size={32} style={{ color: 'var(--text-tertiary)', marginBottom: 12 }} />
                <div style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Snap Visiting Card</div>
              </div>
            )}

            <div className="form-group">
              <label>Contact Name</label>
              <input type="text" placeholder="John Doe" value={cardName} onChange={(e) => setCardName(e.target.value)} />
            </div>
            
            <div className="form-group">
              <label>Company Name</label>
              <input type="text" placeholder="Acme Corp" value={cardCompany} onChange={(e) => setCardCompany(e.target.value)} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label>Phone</label>
                <input type="text" placeholder="+1..." value={cardPhone} onChange={(e) => setCardPhone(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" placeholder="john@acme.com" value={cardEmail} onChange={(e) => setCardEmail(e.target.value)} />
              </div>
            </div>

            <button 
              className="btn-primary" 
              onClick={handleSaveCardLead}
              disabled={isSubmitting || (!cardName && !cardCompany)}
              style={{ marginTop: 12 }}
            >
              <UploadCloud size={18} /> Save Lead to CRM
            </button>
          </div>
        )}

        {activeTab === 'admin_tracker' && isAdmin && (
          <div className="tracker-feed">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, margin: 0 }}>Team Field Activity</h2>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{fieldVisits.length} visits logged</span>
            </div>

            {fieldVisits.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-tertiary)', background: 'var(--bg-elevated)', borderRadius: 12, border: '1px solid var(--border-subtle)' }}>
                No field visits logged yet.
              </div>
            ) : (
              fieldVisits.map(visit => (
                <div key={visit.id} className="tracker-item">
                  <div className="tracker-avatar">
                    {visit.ownerName.charAt(0).toUpperCase()}
                  </div>
                  <div className="tracker-content">
                    <div className="tracker-header">
                      <span className="tracker-name">{visit.ownerName}</span>
                      <span className="tracker-time">
                        {visit.checkInTime ? new Date(visit.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Unknown time'}
                      </span>
                    </div>
                    
                    <div className="tracker-details">
                      Visited <strong>{visit.leadName}</strong>
                    </div>
                    
                    {visit.lat && visit.lng && (
                      <a href={`https://maps.google.com/?q=${visit.lat},${visit.lng}`} target="_blank" rel="noreferrer" className="tracker-location">
                        <Map size={14} /> View Location on Map
                      </a>
                    )}
                    
                    {visit.photo && (
                      <img src={visit.photo} alt="Visit Evidence" className="tracker-photo" />
                    )}
                    
                    <div>
                      <span className={`status-badge ${visit.status}`}>
                        {visit.status === 'in_progress' ? 'Checked In' : 'Completed'}
                      </span>
                    </div>

                    {visit.status === 'completed' && (
                      <div style={{ marginTop: 12, fontSize: 13, background: 'var(--bg-base)', padding: 12, borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                        <strong>Check-out Time:</strong> {new Date(visit.checkOutTime).toLocaleTimeString()} <br/>
                        {visit.notes && <><strong style={{ marginTop: 6, display: 'inline-block' }}>Notes:</strong> {visit.notes}</>}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}
