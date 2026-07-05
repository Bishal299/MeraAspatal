import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { Stethoscope, User, ShieldCheck, Database } from 'lucide-react';
import { seedDatabase } from '../seed';

const Login = () => {
  const [role, setRole] = useState('patient');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    // In a real app, integrate Firebase Auth here
    localStorage.setItem('userRole', role);
    navigate('/dashboard');
  };

  return (
    <div className="login-page" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--background)' }}>
      <Navbar />
      
      <div className="container" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 0' }}>
        <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '450px', padding: '2.5rem' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '0.5rem', color: 'var(--accent)' }}>Welcome Back</h2>
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '2rem' }}>Sign in to MeraAsptal Portal</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '2rem' }}>
            <button 
              type="button"
              onClick={() => setRole('patient')}
              className={`btn ${role === 'patient' ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding: '0.5rem', fontSize: '0.75rem' }}
            >
              <User size={14} /> Patient
            </button>
            <button 
              type="button"
              onClick={() => setRole('doctor')}
              className={`btn ${role === 'doctor' ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding: '0.5rem', fontSize: '0.75rem' }}
            >
              <Stethoscope size={14} /> Doctor
            </button>
            <button 
              type="button"
              onClick={() => setRole('staff')}
              className={`btn ${role === 'staff' ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding: '0.5rem', fontSize: '0.75rem' }}
            >
              <ShieldCheck size={14} /> Staff
            </button>
            <button 
              type="button"
              onClick={() => setRole('district')}
              className={`btn ${role === 'district' ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding: '0.5rem', fontSize: '0.75rem' }}
            >
              <Database size={14} /> District
            </button>
          </div>

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Email or Phone Number</label>
              <input type="text" className="form-input" placeholder="Enter your email or phone" required />
            </div>
            
            <div className="form-group">
              <label className="form-label">Password</label>
              <input type="password" className="form-input" placeholder="Enter your password" required />
            </div>

            <button type="submit" className="btn btn-secondary" style={{ width: '100%', marginTop: '1rem', padding: '0.75rem' }}>
              Sign In as {role.charAt(0).toUpperCase() + role.slice(1)}
            </button>
          </form>

          <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem' }}>
            <a href="#" style={{ color: 'var(--text-muted)' }}>Forgot your password?</a>
          </div>

          {/* Development Utility */}
          <div style={{ marginTop: '2rem', textAlign: 'center', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
            <button 
              type="button" 
              onClick={seedDatabase} 
              className="btn btn-outline" 
              style={{ fontSize: '0.75rem', padding: '0.5rem', opacity: 0.7 }}
            >
              <Database size={14} /> Initialize Demo Database
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
