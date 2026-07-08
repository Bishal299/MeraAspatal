const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
import React, { useState, useEffect } from 'react';
import { UserPlus, Clock, CheckCircle, FileText, Fingerprint, Activity, TestTube, AlertCircle } from 'lucide-react';
import api from '../utils/api';
import { toast } from 'react-hot-toast';

const DoctorDashboard = () => {
  const [patients, setPatients] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [onDuty, setOnDuty] = useState(false);
  const [lastPunchTime, setLastPunchTime] = useState('');
  
  // Modals / Input Forms
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showPrescribeModal, setShowPrescribeModal] = useState(false);
  const [prescribeMedId, setPrescribeMedId] = useState('');
  const [prescribeQty, setPrescribeQty] = useState(10);
  const [prescribeDosage, setPrescribeDosage] = useState('1-0-1');
  const [prescribeDuration, setPrescribeDuration] = useState(5);
  const [vitalsBp, setVitalsBp] = useState('120/80');
  const [vitalsTemp, setVitalsTemp] = useState('98.6 F');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [prescriptionsCart, setPrescriptionsCart] = useState([]);
  const [testRequestName, setTestRequestName] = useState('');

  // Read authenticated doctor user
  const userStr = localStorage.getItem('user');
  const doctorUser = userStr ? JSON.parse(userStr) : { id: 'USR_2', name: 'Dr. A. Nayak', facilityId: 'FAC_1' };
  const facilityId = doctorUser.facilityId || 'FAC_1';

  const loadData = async () => {
    try {
      const [patList, invList] = await Promise.all([
        api.getPatients(facilityId),
        api.getInventory(facilityId)
      ]);
      
      // Sort patients: in-progress, waiting, completed
      const order = { 'in-progress': 0, 'waiting': 1, 'completed': 2 };
      patList.sort((a, b) => order[a.status] - order[b.status]);
      
      setPatients(patList);
      setInventory(invList.filter(i => i.category === 'medicine'));
    } catch (error) {
      console.error("Failed to load doctor dashboard data:", error);
    }
  };

  // Real-time synchronization
  useEffect(() => {
    loadData();

    // Check attendance log to verify if punch is currently active
    const checkPunchStatus = async () => {
      try {
        const attendanceList = await api.getAttendanceList();
        const activePunch = attendanceList.find(a => a.user_id === doctorUser.id && a.punch_out === null);
        if (activePunch) {
          setOnDuty(true);
          setLastPunchTime(activePunch.punch_in);
        }
      } catch (err) {
        console.error("Failed to fetch punch status:", err);
      }
    };
    checkPunchStatus();

    const wsUrl = API_URL.replace('http', 'ws');
    const ws = new WebSocket(`${wsUrl}/ws`);

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.facilityId === facilityId || !message.facilityId) {
          loadData();
        }
      } catch (err) {
        console.error("WS error", err);
      }
    };

    return () => {
      ws.close();
    };
  }, [facilityId]);

  const toggleDuty = async () => {
    try {
      const punch = await api.punchAttendance(doctorUser.id, facilityId);
      if (punch.status === 'punched-in') {
        setOnDuty(true);
        setLastPunchTime(punch.time);
        toast.success(`Punched in duty at ${punch.time}. Facility active medical staff incremented.`);
      } else {
        setOnDuty(false);
        setLastPunchTime('');
        toast.success(`Punched out duty at ${punch.time}. Facility active medical staff decremented.`);
      }
      loadData();
    } catch (error) {
      toast.error("Biometric attendance terminal offline.");
    }
  };

  const handleCallNext = async (patientId) => {
    try {
      await api.updatePatientStatus(patientId, 'in-progress');
      toast.success("Called next patient to OPD console.");
      loadData();
    } catch (error) {
      toast.error("Failed to call patient.");
    }
  };

  const handleFinishAppointment = async (patientId) => {
    try {
      await api.updatePatientStatus(patientId, 'completed');
      toast.success("Patient checkup completed.");
      loadData();
    } catch (error) {
      toast.error("Failed to update status.");
    }
  };

  const handleOpenPrescribe = (patient) => {
    setSelectedPatient(patient);
    setPrescriptionsCart([]);
    setVitalsBp(patient.vitals_bp || '120/80');
    setVitalsTemp(patient.vitals_temp || '98.6 F');
    setClinicalNotes('');
    setDiagnosis('');
    setShowPrescribeModal(true);
    if (inventory.length > 0) {
      setPrescribeMedId(inventory[0].id);
    }
  };

  const handleAddItemToCart = () => {
    if (!prescribeMedId) return;
    const selectedItem = inventory.find(i => i.id === prescribeMedId);
    if (!selectedItem) return;

    if (selectedItem.stock < prescribeQty) {
      toast.error(`Insufficient stock! ${selectedItem.item_name} only has ${selectedItem.stock} left.`);
      return;
    }

    // Check if already in cart
    if (prescriptionsCart.some(item => item.medicineName === selectedItem.item_name)) {
      toast.error("Item already added to prescription.");
      return;
    }

    setPrescriptionsCart(prev => [...prev, {
      medicineName: selectedItem.item_name,
      dosage: prescribeDosage,
      duration: prescribeDuration,
      quantity: prescribeQty,
      id: selectedItem.id
    }]);
    toast.success(`${selectedItem.item_name} added to consultation sheet.`);
  };

  const handleRemoveItemFromCart = (medName) => {
    setPrescriptionsCart(prev => prev.filter(item => item.medicineName !== medName));
  };

  const handlePrescribeSubmit = async (e) => {
    e.preventDefault();

    if (prescriptionsCart.length === 0 && !testRequestName) {
      toast.error("Please add at least one prescription or request a diagnostic test.");
      return;
    }

    try {
      // 1. Save vitals and notes in appointment
      const apiUrl = `${API_URL}/api/patients/${selectedPatient.id}/status`;
      await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          status: 'completed',
          clinicalNotes,
          diagnosis
        })
      });

      // 2. Submit multiple prescriptions
      if (prescriptionsCart.length > 0) {
        const presApiUrl = `${API_URL}/api/appointments/${selectedPatient.id}/prescribe`;
        await fetch(presApiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          },
          body: JSON.stringify({ prescriptions: prescriptionsCart })
        });
      }

      // 3. Submit diagnostic test request if selected
      if (testRequestName) {
        await api.requestLabTest({
          patientId: selectedPatient.patient_id || selectedPatient.id,
          appointmentId: selectedPatient.id,
          testName: testRequestName,
          facilityId
        });
      }

      toast.success("Clinical checkup completed and supply inventory logs decremented.");
      setShowPrescribeModal(false);
      setTestRequestName('');
      loadData();
    } catch (error) {
      console.error(error);
      toast.error("Failed to complete clinical consultation.");
    }
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '3rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ color: 'var(--accent)', marginBottom: '0.5rem' }}>Doctor's Console</h1>
          <p style={{ color: 'var(--text-muted)' }}>{doctorUser.name} - General OPD, PHC Kantabada</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            className={`btn ${onDuty ? 'btn-outline' : 'btn-primary'}`} 
            onClick={toggleDuty}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderColor: onDuty ? 'var(--success)' : 'var(--primary)' }}
          >
            <Fingerprint size={18} color={onDuty ? 'var(--success)' : 'white'} /> 
            {onDuty ? `Duty Active (In: ${lastPunchTime})` : 'Punch In (Duty)'}
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '1rem', backgroundColor: 'rgba(245, 158, 11, 0.1)', borderRadius: '50%' }}>
            <Clock color="var(--warning)" size={24} />
          </div>
          <div>
            <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{patients.filter(p => p.status === 'waiting').length}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Patients Waiting</div>
          </div>
        </div>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '1rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: '50%' }}>
            <CheckCircle color="var(--success)" size={24} />
          </div>
          <div>
            <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{patients.filter(p => p.status === 'completed').length}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Seen Patients Today</div>
          </div>
        </div>
      </div>

      {/* Active OPD Queue Table */}
      <div className="card">
        <h3 style={{ marginBottom: '1.5rem' }}>Today's Consultation Queue</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--text-muted)' }}>
              <th style={{ padding: '1rem' }}>Time</th>
              <th style={{ padding: '1rem' }}>Patient Name</th>
              <th style={{ padding: '1rem' }}>Age</th>
              <th style={{ padding: '1rem' }}>BP / Temp</th>
              <th style={{ padding: '1rem' }}>Consultation Reason</th>
              <th style={{ padding: '1rem' }}>Status</th>
              <th style={{ padding: '1rem' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {patients.map(patient => (
              <tr key={patient.id} style={{ borderBottom: '1px solid var(--border)', backgroundColor: patient.status === 'in-progress' ? 'rgba(0,0,128,0.03)' : 'transparent' }}>
                <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{patient.time}</td>
                <td style={{ padding: '1rem', fontWeight: 500 }}>{patient.name}</td>
                <td style={{ padding: '1rem' }}>{patient.age} Yrs</td>
                <td style={{ padding: '1rem', fontSize: '0.9rem' }}>{patient.vitals_bp || '120/80'} | {patient.vitals_temp || '98.6 F'}</td>
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
                    <button 
                      className="btn btn-outline" 
                      style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }} 
                      onClick={() => handleCallNext(patient.id)}
                      disabled={!onDuty}
                    >
                      Call Next
                    </button>
                  )}
                  {patient.status === 'in-progress' && (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        className="btn btn-primary" 
                        style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }} 
                        onClick={() => handleOpenPrescribe(patient)}
                      >
                        Clinical Checkup
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Prescription & Diagnostics Modal */}
      {showPrescribeModal && selectedPatient && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowPrescribeModal(false); }} style={{ zIndex: 99999 }}>
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <h3 style={{ marginBottom: '1rem' }}>Outpatient Consultation Sheet</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Patient: <strong>{selectedPatient.name}</strong> ({selectedPatient.age} Yrs)</p>
            
            <form onSubmit={handlePrescribeSubmit}>
              {/* Vitals */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Blood Pressure</label>
                  <input type="text" className="form-input" value={vitalsBp} onChange={(e) => setVitalsBp(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Temperature</label>
                  <input type="text" className="form-input" value={vitalsTemp} onChange={(e) => setVitalsTemp(e.target.value)} />
                </div>
              </div>

              {/* Diagnosis and Notes */}
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Diagnosis</label>
                <input type="text" className="form-input" placeholder="ICD code / diagnosis description" value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} />
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Clinical Notes</label>
                <textarea className="form-input" style={{ height: '70px', resize: 'none' }} placeholder="Observations and patient complaints..." value={clinicalNotes} onChange={(e) => setClinicalNotes(e.target.value)} />
              </div>

              {/* Prescription Cart Builder */}
              <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '1rem', marginBottom: '1rem', backgroundColor: '#fafafa' }}>
                <h4 style={{ fontSize: '0.95rem', marginBottom: '0.75rem', color: 'var(--accent)' }}>Prescribe Medicine</h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <select className="form-input" value={prescribeMedId} onChange={(e) => setPrescribeMedId(e.target.value)}>
                    {inventory.map(med => (
                      <option key={med.id} value={med.id}>{med.item_name} (Stock: {med.stock})</option>
                    ))}
                  </select>
                  <input type="text" className="form-input" placeholder="Dosage (1-0-1)" value={prescribeDosage} onChange={(e) => setPrescribeDosage(e.target.value)} />
                  <input type="number" className="form-input" placeholder="Qty" value={prescribeQty} onChange={(e) => setPrescribeQty(parseInt(e.target.value))} />
                </div>
                
                <button type="button" className="btn btn-outline" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }} onClick={handleAddItemToCart}>Add Medicine</button>

                {/* Selected Prescriptions Cart list */}
                {prescriptionsCart.length > 0 && (
                  <div style={{ marginTop: '1rem' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Prescribed Items:</div>
                    {prescriptionsCart.map((item, index) => (
                      <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.25rem 0', fontSize: '0.875rem' }}>
                        <span>{item.medicineName} - {item.dosage} ({item.quantity} tabs)</span>
                        <button type="button" onClick={() => handleRemoveItemFromCart(item.medicineName)} style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer' }}>Remove</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Lab Request */}
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Order Lab Diagnostic Test</label>
                <select className="form-input" value={testRequestName} onChange={(e) => setTestRequestName(e.target.value)}>
                  <option value="">No test required</option>
                  <option value="Malaria Antigen (RDT)">Malaria Antigen (RDT)</option>
                  <option value="Dengue NS1 Ag">Dengue NS1 Ag</option>
                  <option value="Blood Sugar (Glucometer Strips)">Blood Sugar (Glucometer Strips)</option>
                  <option value="Typhoid (Widal)">Typhoid (Widal)</option>
                </select>
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowPrescribeModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Complete Consultation</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorDashboard;
