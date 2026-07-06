import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { AlertTriangle, TrendingUp, Building2, Activity, Map } from 'lucide-react';
import { getDemoFacilities } from '../demoData';

const DistrictDashboard = () => {
  const [facilities, setFacilities] = useState([]);

  useEffect(() => {
    if (!db) {
      setFacilities(getDemoFacilities());
      return undefined;
    }

    const unsubscribe = onSnapshot(collection(db, 'facilities'), (snapshot) => {
      const facData = [];
      snapshot.forEach(doc => {
        facData.push({ id: doc.id, ...doc.data() });
      });
      setFacilities(facData);
    });

    return () => unsubscribe();
  }, []);

  const totalBeds = facilities.reduce((sum, fac) => sum + fac.totalBeds, 0);
  const availableBeds = facilities.reduce((sum, fac) => sum + fac.beds, 0);
  const totalDoctors = facilities.reduce((sum, fac) => sum + fac.doctors, 0);

  const criticalFacilities = facilities.filter(fac => fac.status === 'full' || fac.beds === 0);

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ color: 'var(--accent)', marginBottom: '0.5rem' }}>District Control Room</h1>
          <p style={{ color: 'var(--text-muted)' }}>Khordha District Overview - Live Telemetry</p>
        </div>
        <button className="btn btn-outline" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <Map size={18} /> View Map
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '1rem', backgroundColor: 'rgba(19, 136, 8, 0.1)', borderRadius: '50%' }}>
            <Building2 color="var(--primary)" size={24} />
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{facilities.length}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Active Centres</div>
          </div>
        </div>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '1rem', backgroundColor: 'rgba(0, 0, 128, 0.1)', borderRadius: '50%' }}>
            <Activity color="var(--accent)" size={24} />
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{availableBeds} / {totalBeds}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>District Beds Free</div>
          </div>
        </div>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '1rem', backgroundColor: 'rgba(255, 153, 51, 0.1)', borderRadius: '50%' }}>
            <TrendingUp color="var(--secondary)" size={24} />
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{totalDoctors}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Doctors on Duty</div>
          </div>
        </div>
      </div>

      {criticalFacilities.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem', color: 'var(--error)' }}>Critical Alerts</h3>
          {criticalFacilities.map(fac => (
            <div key={fac.id} className="card" style={{ borderLeft: '4px solid var(--error)', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ padding: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '50%' }}>
                  <AlertTriangle color="var(--error)" size={20} />
                </div>
                <div>
                  <h4 style={{ margin: 0 }}>{fac.name} is severely under-resourced</h4>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>0 beds available. Wait time exceeds {fac.waitTime}.</p>
                </div>
              </div>
              <button className="btn btn-outline">Dispatch Relief</button>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <h3 style={{ marginBottom: '1.5rem' }}>All Centres (Khordha)</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--text-muted)' }}>
              <th style={{ padding: '1rem' }}>Facility Name</th>
              <th style={{ padding: '1rem' }}>Beds Free</th>
              <th style={{ padding: '1rem' }}>Doctors Active</th>
              <th style={{ padding: '1rem' }}>Avg Wait Time</th>
              <th style={{ padding: '1rem' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {facilities.map(fac => (
              <tr key={fac.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '1rem', fontWeight: 500 }}>{fac.name}</td>
                <td style={{ padding: '1rem' }}>{fac.beds} / {fac.totalBeds}</td>
                <td style={{ padding: '1rem' }}>{fac.doctors}</td>
                <td style={{ padding: '1rem' }}>{fac.waitTime}</td>
                <td style={{ padding: '1rem' }}>
                  <span style={{ 
                    padding: '0.25rem 0.75rem', 
                    borderRadius: '1rem', 
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    backgroundColor: fac.status === 'available' ? 'rgba(16, 185, 129, 0.1)' : fac.status === 'crowded' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    color: fac.status === 'available' ? 'var(--success)' : fac.status === 'crowded' ? 'var(--warning)' : 'var(--error)'
                  }}>
                    {fac.status.toUpperCase()}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DistrictDashboard;
