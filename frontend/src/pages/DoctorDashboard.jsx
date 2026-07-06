import React, { useState, useEffect } from 'react';
import { UserPlus, Clock, CheckCircle, FileText, Fingerprint } from 'lucide-react';
import { db } from '../firebase';
import { collection, onSnapshot, doc, updateDoc, increment } from 'firebase/firestore';
import { getDemoPatients, saveDemoData, getDemoFacilities } from '../demoData';

const DoctorDashboard = () => {
  const [patients, setPatients] = useState([]);

  useEffect(() => {
    if (!db) {
      const demoPatients = getDemoPatients();
      demoPatients.sort((a, b) => {
        const order = { 'in-progress': 0, 'waiting': 1, 'completed': 2 };
        return order[a.status] - order[b.status];
      });
      setPatients(demoPatients);
      return undefined;
    }

    const unsubscribe = onSnapshot(collection(db, 'patients'), (snapshot) => {
      const patData = [];
      snapshot.forEach(d => {
        patData.push({ id: d.id, ...d.data() });
      });
      patData.sort((a, b) => {
        const order = { 'in-progress': 0, 'waiting': 1, 'completed': 2 };
        return order[a.status] - order[b.status];
      });
      setPatients(patData);
    }, (error) => {
      console.error("Error fetching patients: ", error);
    });

    return () => unsubscribe();
  }, []);

  const updateStatus = async (id, newStatus) => {
    if (!db) {
      const updatedPatients = patients.map((patient) =>
        patient.id === id ? { ...patient, status: newStatus } : patient
      );
      setPatients(updatedPatients);
      saveDemoData({ patients: updatedPatients });
      return;
    }

    try {
      const patientRef = doc(db, 'patients', id);
      await updateDoc(patientRef, { status: newStatus });
    } catch (error) {
      console.error("Error updating patient status: ", error);
    }
  };

  const [onDuty, setOnDuty] = useState(false);

  const toggleDuty = async () => {
    if (!db) {
      const updatedFacilities = getDemoFacilities().map((facility) =>
        facility.id === 'FAC_1'
          ? { ...facility, doctors: Math.max(0, facility.doctors + (onDuty ? -1 : 1)) }
          : facility
      );
      saveDemoData({ facilities: updatedFacilities });
      setOnDuty(!onDuty);
      return;
    }

    try {
      const facRef = doc(db, 'facilities', 'FAC_1');
      await updateDoc(facRef, {
        doctors: increment(onDuty ? -1 : 1)
      });
      setOnDuty(!onDuty);
    } catch (error) {
      console.error("Error toggling duty:", error);
    }
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ color: 'var(--accent)', marginBottom: '0.5rem' }}>Doctor's Console</h1>
          <p style={{ color: 'var(--text-muted)' }}>Dr. A. Nayak - General Medicine, PHC Kantabada</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            className={`btn ${onDuty ? 'btn-outline' : 'btn-primary'}`} 
            onClick={toggleDuty}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Fingerprint size={18} /> {onDuty ? 'Punch Out' : 'Punch In (Duty)'}
          </button>
          <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><UserPlus size={18} /> Walk-in Intake</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '1rem', backgroundColor: 'rgba(245, 158, 11, 0.1)', borderRadius: '50%' }}>
            <Clock color="var(--warning)" size={24} />
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{patients.filter(p => p.status === 'waiting').length}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Patients Waiting</div>
          </div>
        </div>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '1rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: '50%' }}>
            <CheckCircle color="var(--success)" size={24} />
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{patients.filter(p => p.status === 'completed').length}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Patients Seen Today</div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '1.5rem' }}>Current Queue</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--text-muted)' }}>
              <th style={{ padding: '1rem' }}>Time</th>
              <th style={{ padding: '1rem' }}>Patient Name</th>
              <th style={{ padding: '1rem' }}>Age</th>
              <th style={{ padding: '1rem' }}>Reason</th>
              <th style={{ padding: '1rem' }}>Status</th>
              <th style={{ padding: '1rem' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {patients.map(patient => (
              <tr key={patient.id} style={{ borderBottom: '1px solid var(--border)', backgroundColor: patient.status === 'in-progress' ? 'rgba(0,0,128,0.03)' : 'transparent' }}>
                <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{patient.time}</td>
                <td style={{ padding: '1rem', fontWeight: 500 }}>{patient.name}</td>
                <td style={{ padding: '1rem' }}>{patient.age}</td>
                <td style={{ padding: '1rem' }}>{patient.reason}</td>
                <td style={{ padding: '1rem' }}>
                  <span style={{ 
                    padding: '0.25rem 0.75rem', 
                    borderRadius: '1rem', 
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    backgroundColor: patient.status === 'completed' ? 'rgba(16, 185, 129, 0.1)' : patient.status === 'in-progress' ? 'rgba(0, 0, 128, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                    color: patient.status === 'completed' ? 'var(--success)' : patient.status === 'in-progress' ? 'var(--accent)' : 'var(--warning)'
                  }}>
                    {patient.status.toUpperCase()}
                  </span>
                </td>
                <td style={{ padding: '1rem' }}>
                  {patient.status === 'waiting' && (
                    <button className="btn btn-outline" style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }} onClick={() => updateStatus(patient.id, 'in-progress')}>
                      Call Next
                    </button>
                  )}
                  {patient.status === 'in-progress' && (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-primary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }} onClick={() => updateStatus(patient.id, 'completed')}>
                        Finish
                      </button>
                      <button className="btn btn-outline" style={{ padding: '0.25rem', borderRadius: '50%' }} title="Write Prescription">
                        <FileText size={16} />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DoctorDashboard;
