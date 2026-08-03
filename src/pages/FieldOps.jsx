import React, { useState, useMemo, useRef, useEffect } from 'react';
import { MapPin, Camera, CheckCircle, Navigation, Clock, LogOut, Search, User, Building2, UploadCloud, Map, Briefcase, AlertTriangle, Star } from 'lucide-react';
import useDataStore from '../store/useDataStore';
import useAuthStore from '../store/useAuthStore';
import './FieldOps.css';

export default function FieldOps() {
  const { tasks, leads, logFieldCheckIn, logFieldCheckOut, createLead } = useDataStore();
  const { user, team } = useAuthStore();
  
  // Role checks & Profile
  const userProfile = team?.find(m => m.id === user?.id);
  const isAdmin = user?.email === 'prajwal@earlyjobs.in' || userProfile?.role === 'Admin';
  
  const name = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const avatarColor = user?.user_metadata?.avatar_color || '#1b66f2';

  const [activeTab, setActiveTab] = useState('my_visits'); 
  
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

  // Derived Stats
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  
  const visitsToday = useMemo(() => {
    return tasks.filter(t => t.type === 'field_visit' && t.owner_id === user?.id && new Date(t.created_at) >= todayStart);
  }, [tasks, user?.id, todayStart]);

  const completedVisits = visitsToday.filter(v => v.status === 'completed').length;

  // Timer Logic for Active Visit
  const [elapsedTime, setElapsedTime] = useState('00:00:00');
  useEffect(() => {
    let interval;
    if (activeVisit) {
      let parsed = {};
      try { parsed = JSON.parse(activeVisit.notes || '{}'); } catch(e) {}
      const checkInTime = new Date(parsed.check_in_time || activeVisit.created_at).getTime();
      
      interval = setInterval(() => {
        const now = new Date().getTime();
        const diff = now - checkInTime;
        if (diff < 0) return;
        
        const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);
        
        setElapsedTime(
          `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
        );
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeVisit]);


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

  const handleCheckIn = async () => {
    if (!selectedLeadId) { alert('Please select a Lead/Company.'); return; }
    if (!location) { alert('Please fetch your location.'); return; }
    if (!photoBase64) { alert('Please take a photo.'); return; }

    setIsSubmitting(true);
    try {
      await logFieldCheckIn(selectedLeadId, location, photoBase64);
      setSelectedLeadId('');
      setPhotoBase64('');
      setLocation(null);
    } catch (err) {
      alert('Failed to check in: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

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
      reader.onloadend = () => setCardPhoto(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSaveCardLead = async () => {
    if (!cardName && !cardCompany) { alert('Enter name or company.'); return; }
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
      setCardPhoto(''); setCardName(''); setCardCompany(''); setCardPhone(''); setCardEmail('');
      alert('Lead successfully saved!');
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
      {/* Curved Hero Header */}
      <header className="fieldops-hero">
        <div className="fieldops-hero-top">
          <div className="fieldops-logo-wrap">
            <div className="fieldops-logo-icon">
              <MapPin size={20} color="white" />
            </div>
            <div>
              <h1 className="fieldops-title">FieldZen</h1>
              <p className="fieldops-subtitle">Enterprise Field Operations</p>
            </div>
          </div>
          <div className="fieldops-status-badge">
            <div className="status-dot"></div>
            {activeVisit ? 'On Duty' : 'Online'}
          </div>
        </div>

        {/* Floating Tab Bar */}
        <div className="fieldops-tabs-wrapper">
          <div className="fieldops-tabs">
            <button 
              className={`fieldops-tab ${activeTab === 'my_visits' ? 'active' : ''}`}
              onClick={() => setActiveTab('my_visits')}
            >
              <MapPin size={16} /> My Visits
            </button>
            <button 
              className={`fieldops-tab ${activeTab === 'scanner' ? 'active' : ''}`}
              onClick={() => setActiveTab('scanner')}
            >
              <Camera size={16} /> Scanner
            </button>
            {isAdmin && (
              <button 
                className={`fieldops-tab ${activeTab === 'admin_tracker' ? 'active' : ''}`}
                onClick={() => setActiveTab('admin_tracker')}
              >
                <Map size={16} /> Tracker
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="fieldops-main">
        
        {/* ==================================
            MY VISITS TAB (SDR MOBILE VIEW)
        ================================== */}
        {activeTab === 'my_visits' && (
          <div className="premium-card">
            
            {/* Profile & Stats Header */}
            <div className="profile-row">
              <div className="profile-info">
                <div className="profile-avatar" style={{ color: avatarColor }}>{initials}</div>
                <div>
                  <h2 className="profile-name">{name}</h2>
                  <p className="profile-role">{userProfile?.role || 'Field Executive'} • ID: FT-{user?.id?.substring(0,6).toUpperCase()}</p>
                </div>
              </div>
            </div>

            <div className="stat-grid" style={{ marginBottom: 24 }}>
              <div className="stat-box">
                <div className="stat-value" style={{ color: '#1b66f2' }}>{visitsToday.length}</div>
                <div className="stat-label">Jobs Today</div>
              </div>
              <div className="stat-box">
                <div className="stat-value" style={{ color: '#10b981' }}>{completedVisits}</div>
                <div className="stat-label">Completed</div>
              </div>
              <div className="stat-box">
                <div className="stat-value" style={{ color: '#f59e0b' }}>94%</div>
                <div className="stat-label">Rating</div>
              </div>
            </div>

            {/* Shift/Check-in Flow */}
            {activeVisit ? (
              // CHECKED IN STATE
              <div>
                <div className="timer-widget">
                  <div>
                    <div className="timer-label">Visit Active</div>
                    <div className="timer-value">{elapsedTime}</div>
                  </div>
                  <div className="pulse-indicator">
                    <div className="status-dot"></div> Tracking
                  </div>
                </div>

                {(() => {
                  let parsed = {};
                  try { parsed = JSON.parse(activeVisit.notes || '{}'); } catch(e) {}
                  const visitLead = leads.find(l => l.id === parsed.lead_id);
                  return (
                    <div className="location-widget">
                      <div className="location-map-bg">
                        <MapPin size={24} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 15, color: '#111827' }}>{visitLead?.company_name || 'Client Location'}</div>
                        <div style={{ fontSize: 13, color: '#6b7280' }}>{visitLead?.contact_name}</div>
                      </div>
                    </div>
                  );
                })()}

                <div className="form-group">
                  <label>Meeting Notes</label>
                  <textarea 
                    className="premium-input"
                    rows="3" 
                    placeholder="Enter outcomes and next steps..."
                    value={checkOutNotes}
                    onChange={(e) => setCheckOutNotes(e.target.value)}
                  />
                </div>

                <button 
                  className="btn-mega btn-danger" 
                  onClick={handleCheckOut}
                  disabled={isSubmitting}
                >
                  <LogOut size={20} /> {isSubmitting ? 'Ending...' : 'Check Out & Complete'}
                </button>
              </div>
            ) : (
              // READY TO CHECK IN STATE
              <div>
                <div className="form-group">
                  <select 
                    className="premium-input"
                    value={selectedLeadId} 
                    onChange={(e) => setSelectedLeadId(e.target.value)}
                  >
                    <option value="">Select a Destination (Lead/Account)</option>
                    {leads.map(l => (
                      <option key={l.id} value={l.id}>
                        {l.company_name || l.contact_name} {l.contact_name ? `(${l.contact_name})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  {location ? (
                    <div className="location-widget" style={{ background: '#ecfdf5', color: '#059669', marginBottom: 0 }}>
                      <CheckCircle size={20} />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>Location Verified</div>
                        <div style={{ fontSize: 12 }}>GPS: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}</div>
                      </div>
                    </div>
                  ) : (
                    <button type="button" className="btn-outline" onClick={handleGetLocation} disabled={isLocating}>
                      <Navigation size={18} /> {isLocating ? 'Acquiring GPS...' : 'Verify Location'}
                    </button>
                  )}
                </div>

                <div className="form-group" style={{ marginBottom: 24 }}>
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
                      <button type="button" className="btn-outline" style={{ marginBottom: 0 }} onClick={() => fileInputRef.current?.click()}>
                        Retake Photo
                      </button>
                    </div>
                  ) : (
                    <div className="photo-upload-zone" onClick={() => fileInputRef.current?.click()}>
                      <Camera size={32} style={{ color: '#9ca3af', margin: '0 auto 12px auto' }} />
                      <div style={{ fontWeight: 700, color: '#4b5563' }}>Take Verification Photo</div>
                      <div style={{ fontSize: 12, color: '#9ca3af' }}>Storefront or Meeting Room</div>
                    </div>
                  )}
                </div>

                <button 
                  className="btn-mega btn-success" 
                  onClick={handleCheckIn}
                  disabled={isSubmitting || !location || !photoBase64 || !selectedLeadId}
                >
                  <CheckCircle size={20} /> {isSubmitting ? 'Starting...' : 'Check In & Start Shift'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ==================================
            CARD SCANNER TAB
        ================================== */}
        {activeTab === 'scanner' && (
          <div className="premium-card">
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Card Scanner</h2>
            <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 24 }}>Capture a business card to quickly add a lead. Automated OCR parsing is coming soon.</p>
            
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
              <div className="photo-upload-zone" onClick={() => document.getElementById('card-upload').click()} style={{ marginBottom: 24 }}>
                <Camera size={40} style={{ color: '#9ca3af', margin: '0 auto 16px auto' }} />
                <div style={{ fontWeight: 700, color: '#4b5563' }}>Snap Visiting Card</div>
              </div>
            )}

            <div className="form-group">
              <label>Contact Name</label>
              <input type="text" className="premium-input" placeholder="e.g. John Doe" value={cardName} onChange={(e) => setCardName(e.target.value)} />
            </div>
            
            <div className="form-group">
              <label>Company Name</label>
              <input type="text" className="premium-input" placeholder="e.g. Acme Corp" value={cardCompany} onChange={(e) => setCardCompany(e.target.value)} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label>Phone</label>
                <input type="text" className="premium-input" placeholder="+1..." value={cardPhone} onChange={(e) => setCardPhone(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" className="premium-input" placeholder="name@company.com" value={cardEmail} onChange={(e) => setCardEmail(e.target.value)} />
              </div>
            </div>

            <button 
              className="btn-mega btn-primary" 
              onClick={handleSaveCardLead}
              disabled={isSubmitting || (!cardName && !cardCompany)}
              style={{ marginTop: 24 }}
            >
              <UploadCloud size={20} /> Save Lead
            </button>
          </div>
        )}

        {/* ==================================
            ADMIN TRACKER TAB
        ================================== */}
        {activeTab === 'admin_tracker' && isAdmin && (
          <div className="premium-card admin-card">
            <div className="dashboard-header">
              <h2 className="dashboard-title">Field Activity Dashboard</h2>
              <div className="fieldops-status-badge" style={{ background: '#eff6ff', color: '#1b66f2' }}>
                Total Visits: {fieldVisits.length}
              </div>
            </div>

            {fieldVisits.length === 0 ? (
              <div style={{ padding: 60, textAlign: 'center', color: '#9ca3af', background: '#f9fafb', borderRadius: 20, border: '1px dashed #d1d5db' }}>
                <Map size={48} style={{ opacity: 0.5, margin: '0 auto 16px auto' }} />
                No field visits logged today.
              </div>
            ) : (
              <div className="tracker-grid">
                {fieldVisits.map(visit => (
                  <div key={visit.id} className="tracker-card">
                    <div className="tracker-card-header">
                      <div className="tracker-rep">
                        <div className="tracker-rep-avatar">
                          {visit.ownerName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="tracker-rep-name">{visit.ownerName}</div>
                          <div className="tracker-time">
                            {visit.checkInTime ? new Date(visit.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Unknown time'}
                          </div>
                        </div>
                      </div>
                      <span className={`tracker-status ${visit.status}`}>
                        {visit.status === 'in_progress' ? 'Active' : 'Completed'}
                      </span>
                    </div>
                    
                    <div className="tracker-lead-badge">
                      <Building2 size={14} color="#6b7280" /> 
                      {visit.leadName}
                    </div>
                    
                    {visit.photo && (
                      <img src={visit.photo} alt="Verification" className="tracker-photo" />
                    )}
                    
                    <div className="tracker-footer">
                      {visit.lat && visit.lng ? (
                        <a href={`https://maps.google.com/?q=${visit.lat},${visit.lng}`} target="_blank" rel="noreferrer" className="tracker-location-link">
                          <MapPin size={16} /> View on Map
                        </a>
                      ) : (
                        <span style={{ fontSize: 13, color: '#9ca3af' }}>No GPS</span>
                      )}
                      
                      {visit.status === 'completed' && visit.checkOutTime && (
                        <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 600 }}>
                          Out: {new Date(visit.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )}
                    </div>

                    {visit.notes && (
                      <div style={{ marginTop: 12, padding: 12, background: '#f9fafb', borderRadius: 12, fontSize: 13, color: '#4b5563', border: '1px solid #e5e7eb' }}>
                        {visit.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
