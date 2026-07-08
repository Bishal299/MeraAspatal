const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
import React, { useState, useEffect } from 'react';
import { Search, MapPin, PhoneCall, BedDouble, Stethoscope, Clock, Plus, UserCheck } from 'lucide-react';
import api from '../utils/api';
import { toast } from 'react-hot-toast';

const PatientDashboard = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [facilities, setFacilities] = useState([]);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [showBookModal, setShowBookModal] = useState(false);

  // Patient Intake Form
  const [bookingForm, setBookingForm] = useState({
    name: '',
    age: '',
    gender: 'Male',
    reason: '',
    type: 'OPD'
  });

  const loadData = async () => {
    try {
      const list = await api.getFacilities();
      setFacilities(list);
    } catch (error) {
      console.error("Failed to load facilities:", error);
    }
  };

  // Real-time synchronization
  useEffect(() => {
    loadData();

    const wsUrl = API_URL.replace('http', 'ws');
    const ws = new WebSocket(`${wsUrl}/ws`);

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'BEDS_UPDATE' || message.type === 'DOCTORS_UPDATE' || message.type === 'QUEUE_UPDATE') {
          loadData();
        }
      } catch (err) {
        console.error("WS error", err);
      }
    };

    return () => {
      ws.close();
    };
  }, []);

  const handleOpenBookModal = (facility) => {
    setSelectedFacility(facility);
    setBookingForm({
      name: '',
      age: '',
      gender: 'Male',
      reason: '',
      type: 'OPD'
    });
    setShowBookModal(true);
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!bookingForm.name.trim()) {
      toast.error("Patient name is required.");
      return;
    }

    try {
      await api.registerPatient({
        name: bookingForm.name,
        age: parseInt(bookingForm.age) || null,
        gender: bookingForm.gender,
        reason: bookingForm.reason || 'General Health Consultation',
        type: bookingForm.type,
        facilityId: selectedFacility.id
      });

      toast.success(`Registered successfully! Please report to ${selectedFacility.name}.`);
      setShowBookModal(false);
    } catch (err) {
      toast.error("Failed to book slot.");
    }
  };

  const filteredFacilities = facilities.filter(fac => 
    fac.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '3rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ color: 'var(--accent)', marginBottom: '0.5rem' }}>Find Healthcare Facilities</h1>
        <p style={{ color: 'var(--text-muted)' }}>Real-time availability of beds and doctors in Khordha district.</p>
      </div>

      {/* Search Bar */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '2.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={20} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            className="form-input" 
            placeholder="Search for primary health centres, community clinics..." 
            style={{ paddingLeft: '3rem' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <h3 style={{ marginBottom: '1.5rem' }}>Nearby Health Centres (Khordha District)</h3>

      {/* Facility Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {filteredFacilities.map(facility => {
          const statusColor = facility.available_beds > 5 ? 'var(--success)' : facility.available_beds > 0 ? 'var(--warning)' : 'var(--error)';
          const statusBg = facility.available_beds > 5 ? 'rgba(16, 185, 129, 0.1)' : facility.available_beds > 0 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)';
          const statusLabel = facility.available_beds > 5 ? 'AVAILABLE' : facility.available_beds > 0 ? 'CROWDED' : 'FULL';

          return (
            <div key={facility.id} className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <h4 style={{ fontSize: '1.25rem', marginBottom: '0.25rem', color: 'var(--text-main)' }}>{facility.name}</h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    <MapPin size={14} /> Khordha, Odisha
                  </div>
                </div>
                <span style={{ 
                  padding: '0.25rem 0.75rem', 
                  borderRadius: '1rem', 
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  backgroundColor: statusBg,
                  color: statusColor
                }}>
                  {statusLabel}
                </span>
              </div>

              {/* Stats */}
              <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem', flex: 1, padding: '0.5rem 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <BedDouble size={20} color={facility.available_beds > 0 ? "var(--primary)" : "var(--error)"} />
                  <div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{facility.available_beds} / {facility.total_beds}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Beds Free</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Stethoscope size={20} color="var(--accent)" />
                  <div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{facility.doctors}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Doctors On Duty</div>
                  </div>
                </div>
              </div>

              {/* Action row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: 'auto' }}>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                  Est. Wait: <strong>{facility.wait_time}</strong>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <a href={`tel:${facility.contact}`} className="btn btn-outline" style={{ padding: '0.5rem', borderRadius: '50%' }} title="Call Center">
                    <PhoneCall size={16} />
                  </a>
                  <button 
                    onClick={() => handleOpenBookModal(facility)} 
                    className="btn btn-secondary" 
                    style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                  >
                    Queue Intake
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Booking Form Modal */}
      {showBookModal && selectedFacility && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="card animate-fade-in" style={{ width: '450px', padding: '2rem' }}>
            <h3 style={{ marginBottom: '0.5rem' }}>Book OPD / Emergency Entry</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Facility: <strong>{selectedFacility.name}</strong></p>
            
            <form onSubmit={handleBookingSubmit}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Enter full name"
                  value={bookingForm.name}
                  onChange={(e) => setBookingForm({ ...bookingForm, name: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Age</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    placeholder="Age"
                    value={bookingForm.age}
                    onChange={(e) => setBookingForm({ ...bookingForm, age: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Gender</label>
                  <select 
                    className="form-input"
                    value={bookingForm.gender}
                    onChange={(e) => setBookingForm({ ...bookingForm, gender: e.target.value })}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Queue Category</label>
                <select 
                  className="form-input"
                  value={bookingForm.type}
                  onChange={(e) => setBookingForm({ ...bookingForm, type: e.target.value })}
                >
                  <option value="OPD">General OPD Consultation</option>
                  <option value="Emergency">Urgent Emergency Room</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Chief Medical Complaint</label>
                <textarea 
                  className="form-input" 
                  placeholder="Briefly state symptoms (e.g. Cough and High Fever)"
                  style={{ height: '80px', resize: 'none', fontFamily: 'inherit' }}
                  value={bookingForm.reason}
                  onChange={(e) => setBookingForm({ ...bookingForm, reason: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowBookModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                  <UserCheck size={16} /> Confirm Queue Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientDashboard;
