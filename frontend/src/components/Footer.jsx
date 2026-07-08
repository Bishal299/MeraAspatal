import React from 'react';
import { Activity, ShieldAlert, HeartHandshake } from 'lucide-react';

const Footer = () => {
  return (
    <footer style={{
      borderTop: '1px solid var(--border)',
      backgroundColor: 'var(--surface)',
      color: 'var(--text-main)',
      padding: '4rem 0 2rem',
      marginTop: 'auto',
      width: '100%'
    }}>
      <div className="container" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '2.5rem',
        marginBottom: '3rem'
      }}>
        
        {/* Left: Branding */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={24} color="var(--primary)" />
            <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--accent)' }}>MeraAsptal</span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.6, margin: 0 }}>
            An intelligent resource management platform bridging stock levels, queue waits, and biometric attendance for PHCs and CHCs in India.
          </p>
        </div>

        {/* Center: National Blueprints */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h4 style={{ fontSize: '1rem', color: 'var(--text-main)', margin: 0 }}>Digital Health Stack</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <HeartHandshake size={15} color="var(--primary)" /> National Health Mission (NHM)
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldAlert size={15} color="var(--accent)" /> NDHM Privacy Framework Compliant
            </li>
          </ul>
        </div>

        {/* Right: Helpline & Support */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h4 style={{ fontSize: '1rem', color: 'var(--text-main)', margin: 0 }}>Citizens Helpline</h4>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div>Toll Free: <strong>104 / 1075</strong></div>
            <div>Support Email: <a href="mailto:support@meraaspatal.gov.in" style={{ color: 'var(--primary)', textDecoration: 'none' }}>support@meraaspatal.gov.in</a></div>
            <div>Khordha District Control Office</div>
          </div>
        </div>

      </div>

      {/* Bottom bar */}
      <div style={{
        borderTop: '1px solid var(--border)',
        paddingTop: '1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        alignItems: 'center',
        fontSize: '0.75rem',
        color: 'var(--text-muted)'
      }} className="container">
        <div>
          &copy; {new Date().getFullYear()} Ministry of Health & Family Welfare. Government of India.
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <a href="#" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Privacy Policy</a>
          <a href="#" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Terms of Service</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
