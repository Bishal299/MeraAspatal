import React, { useState, useEffect } from 'react';
import { Search, MapPin, PhoneCall, BedDouble, Stethoscope } from 'lucide-react';
import { db } from '../firebase';
import { collection, onSnapshot } from 'firebase/firestore';

const PatientDashboard = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const [facilities, setFacilities] = useState([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'facilities'), (snapshot) => {
      const facData = [];
      snapshot.forEach(doc => {
        facData.push({ id: doc.id, ...doc.data() });
      });
      setFacilities(facData);
    }, (error) => {
      console.error("Error fetching facilities: ", error);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ color: 'var(--accent)', marginBottom: '0.5rem' }}>Find Healthcare Facilities</h1>
        <p style={{ color: 'var(--text-muted)' }}>Real-time availability of beds and doctors in your district.</p>
      </div>

      <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={20} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            className="form-input" 
            placeholder="Search for hospitals, clinics, or specific treatments..." 
            style={{ paddingLeft: '3rem' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="btn btn-primary" style={{ padding: '0.625rem 2rem' }}>Search</button>
      </div>

      <h3 style={{ marginBottom: '1.5rem' }}>Nearby Health Centres (Khordha)</h3>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {facilities.map(facility => (
          <div key={facility.id} className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <h4 style={{ fontSize: '1.25rem', marginBottom: '0.25rem', color: 'var(--text-main)' }}>{facility.name}</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  <MapPin size={14} /> {facility.distance} away
                </div>
              </div>
              <span style={{ 
                padding: '0.25rem 0.75rem', 
                borderRadius: '1rem', 
                fontSize: '0.75rem',
                fontWeight: 600,
                backgroundColor: facility.status === 'available' ? 'rgba(16, 185, 129, 0.1)' : facility.status === 'crowded' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                color: facility.status === 'available' ? 'var(--success)' : facility.status === 'crowded' ? 'var(--warning)' : 'var(--error)'
              }}>
                {facility.status.toUpperCase()}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem', flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BedDouble size={20} color={facility.beds > 0 ? "var(--primary)" : "var(--error)"} />
                <div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{facility.beds}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Beds Free</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Stethoscope size={20} color="var(--accent)" />
                <div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{facility.doctors}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Doctors</div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: 'auto' }}>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                Est. Wait: <strong>{facility.waitTime}</strong>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-outline" style={{ padding: '0.5rem', borderRadius: '50%' }} title="Call Facility">
                  <PhoneCall size={16} />
                </button>
                <button className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                  Book Slot
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PatientDashboard;
