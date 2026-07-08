import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import StaffDashboard from './StaffDashboard';
import DoctorDashboard from './DoctorDashboard';
import PatientDashboard from './PatientDashboard';
import DistrictDashboard from './DistrictDashboard';

const Dashboard = () => {
  const [role, setRole] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const savedRole = localStorage.getItem('userRole');
    if (!savedRole) {
      navigate('/login');
    } else {
      setRole(savedRole);
    }
  }, [navigate]);

  if (!role) return <div>Loading...</div>;

  return (
    <div style={{ backgroundColor: 'var(--background)', minHeight: '100vh', position: 'relative' }}>
      <Navbar />
      <div className="container" style={{ padding: '2rem 0' }}>
        {role === 'staff' && <StaffDashboard />}
        {role === 'doctor' && <DoctorDashboard />}
        {role === 'patient' && <PatientDashboard />}
        {role === 'district' && <DistrictDashboard />}
      </div>
    </div>
  );
};

export default Dashboard;
