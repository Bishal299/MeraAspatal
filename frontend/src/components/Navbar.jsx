import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Activity } from 'lucide-react';

const Navbar = () => {
  const location = useLocation();
  const { t, i18n } = useTranslation();

  const changeLanguage = (e) => {
    i18n.changeLanguage(e.target.value);
  };

  return (
    <nav className="navbar" style={{ height: '5rem' }}>
      <div className="container navbar-container" style={{ height: '100%' }}>
        <Link to="/" className="nav-brand" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <img src="/logo.png" alt="MeraAsptal Logo" style={{ height: '3.5rem', borderRadius: '50%' }} onError={(e) => { e.target.src = 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/A_health_worker_administering_Polio_drops_to_a_child.jpg/1280px-A_health_worker_administering_Polio_drops_to_a_child.jpg'; e.target.style.display = 'none'; }} />
          <img src="https://upload.wikimedia.org/wikipedia/en/thumb/0/07/National_Health_Mission_Logo.svg/1200px-National_Health_Mission_Logo.svg.png" alt="NHM Logo" style={{ height: '3.5rem' }} />
          <span style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent)', lineHeight: 1.2 }}>MeraAsptal</span>
            <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)' }}>{t('National Health Mission')}</span>
          </span>
        </Link>
        <div className="nav-links">
          <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>{t('Home')}</Link>
          <Link to="/facilities" className={`nav-link ${location.pathname === '/facilities' ? 'active' : ''}`}>{t('Facilities')}</Link>
          <Link to="/about" className={`nav-link ${location.pathname === '/about' ? 'active' : ''}`}>{t('About')}</Link>
          
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

          <Link to="/login" className="btn btn-primary">{t('Login')}</Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
