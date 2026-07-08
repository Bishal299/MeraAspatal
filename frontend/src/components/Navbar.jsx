import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Activity, User } from 'lucide-react';
import logo from '../assets/mera_logo.png';
import api from '../utils/api';
import ProfileModal from './ProfileModal';

const Navbar = () => {
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const [showProfile, setShowProfile] = useState(false);

  const changeLanguage = (e) => {
    i18n.changeLanguage(e.target.value);
  };

  const isLoggedIn = Boolean(localStorage.getItem('accessToken'));

  const handleNavClick = (hashId) => {
    if (location.pathname === '/') {
      const el = document.querySelector(hashId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      window.location.href = `/${hashId}`;
    }
  };

  return (
    <nav className="navbar" style={{ height: '5rem' }}>
      <div className="container navbar-container" style={{ height: '100%' }}>
        <Link to="/" className="nav-brand" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <img src={logo} alt="MeraAsptal Logo" style={{ height: '3.5rem', width: '3.5rem', objectFit: 'contain', borderRadius: '50%', flexShrink: 0 }} />
          <img src="/nhm_logo.png" alt="NHM Logo" style={{ height: '3.5rem', flexShrink: 0 }} />
          <span style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent)', lineHeight: 1.2 }}>MeraAsptal</span>
            <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)' }}>{t('National Health Mission')}</span>
          </span>
        </Link>
        <div className="nav-links">
          <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>{t('Home')}</Link>
          <a href="#features" onClick={(e) => { e.preventDefault(); handleNavClick('#features'); }} className="nav-link">
            {t('Features')}
          </a>
          <a href="#about" onClick={(e) => { e.preventDefault(); handleNavClick('#about'); }} className="nav-link">
            {t('About')}
          </a>
          <Link to="/facilities" className={`nav-link ${location.pathname === '/facilities' ? 'active' : ''}`}>{t('Facilities')}</Link>
          
          {isLoggedIn && (
            <Link to="/dashboard" className={`nav-link ${location.pathname.startsWith('/dashboard') ? 'active' : ''}`}>
              Dashboard
            </Link>
          )}

          <select 
            onChange={changeLanguage} 
            value={i18n.language}
            style={{ 
              padding: '0.5rem', 
              borderRadius: '0.5rem', 
              border: '1px solid var(--border)', 
              backgroundColor: 'var(--background)',
              color: 'var(--text-main)',
              marginLeft: '0.5rem',
              cursor: 'pointer'
            }}
          >
            <option value="en">EN</option>
            <option value="hi">HI</option>
            <option value="or">OR</option>
          </select>

          {isLoggedIn ? (
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginLeft: '0.5rem' }}>
              <button 
                onClick={() => setShowProfile(true)} 
                className="btn btn-outline" 
                style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.5rem 1rem' }}
              >
                <User size={15} /> Settings
              </button>
              <button onClick={() => api.logout()} className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>
                Logout
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn btn-primary" style={{ marginLeft: '0.5rem' }}>{t('Login')}</Link>
          )}
        </div>
      </div>

      <ProfileModal isOpen={showProfile} onClose={() => setShowProfile(false)} />
    </nav>
  );
};

export default Navbar;
