import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Shield, Users, Activity, BarChart3, TrendingUp, AlertTriangle, ArrowRight, HeartHandshake, CheckCircle } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

// Animated Counter Component
const AnimatedCounter = ({ end, duration, suffix = '' }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime = null;
    let animationFrame;
    const endValue = parseFloat(end.replace(/,/g, ''));

    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(progress * endValue);
      if (progress < 1) {
        animationFrame = window.requestAnimationFrame(step);
      }
    };
    animationFrame = window.requestAnimationFrame(step);
    
    return () => window.cancelAnimationFrame(animationFrame);
  }, [end, duration]);

  const formatCount = (val) => {
    if (end.includes('.')) {
      return val.toFixed(1);
    }
    return Math.floor(val).toLocaleString();
  };

  return <span>{formatCount(count)}{suffix}</span>;
};

const LandingPage = () => {
  const { t } = useTranslation();
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const slides = [
    {
      image: "/slide1.jpg",
      title: t('Smart Health Infrastructure'),
      subtitle: t('infra_msg')
    },
    {
      image: "/slide2.jpg",
      title: t('Predictive Analytics'),
      subtitle: t('warning_msg')
    },
    {
      image: "/slide3.jpg",
      title: t('Optimized Patient Flow'),
      subtitle: t('flow_msg')
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000); // Auto-roll every 5 seconds
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <div className="landing-page" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      
      {/* Hero Section with Carousel */}
      <header className="hero-section" style={{ position: 'relative', height: '80vh', minHeight: '550px', overflow: 'hidden' }}>
        {slides.map((slide, index) => (
          <div 
            key={index}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              opacity: currentSlide === index ? 1 : 0,
              transition: 'opacity 1s ease-in-out',
              backgroundImage: `linear-gradient(135deg, rgba(10, 25, 47, 0.85), rgba(16, 185, 129, 0.75)), url(${slide.image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: currentSlide === index ? 1 : 0
            }}
          >
            <div className="container" style={{ position: 'relative', zIndex: 10, textAlign: 'center', maxWidth: '800px', padding: '0 1.5rem' }}>
              <div style={{
                background: 'rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(8px)',
                borderRadius: '16px',
                padding: '2.5rem',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.25)'
              }}>
                <h1 className="animate-fade-in" style={{ color: 'white', fontSize: '3rem', fontWeight: 800, marginBottom: '1.25rem', lineHeight: 1.2 }}>
                  {slide.title}
                </h1>
                <p className="animate-slide-up" style={{ color: 'rgba(255,255,255,0.95)', fontSize: '1.15rem', marginBottom: '2rem', lineHeight: 1.5 }}>
                  {slide.subtitle}
                </p>
                <div className="animate-slide-up" style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Link to="/login" className="btn btn-secondary" style={{ padding: '0.85rem 2rem', fontSize: '1rem', fontWeight: 600 }}>
                    {t('Access Portal')}
                  </Link>
                  <Link to="/facilities" className="btn btn-outline" style={{ padding: '0.85rem 2rem', fontSize: '1rem', fontWeight: 600, color: 'white', borderColor: 'white' }}>
                    View Live Telemetry
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {/* Carousel Indicators */}
        <div style={{ position: 'absolute', bottom: '2rem', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '0.5rem', zIndex: 10 }}>
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              style={{
                width: currentSlide === index ? '2rem' : '0.75rem',
                height: '0.75rem',
                borderRadius: '1rem',
                backgroundColor: currentSlide === index ? 'var(--secondary)' : 'rgba(255,255,255,0.5)',
                border: 'none',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </header>

      {/* Interactive Stats Section */}
      <section style={{ padding: '3.5rem 0', backgroundColor: 'var(--surface)', position: 'relative', marginTop: '-3rem', zIndex: 20 }}>
        <div className="container">
          <div className="card" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem', textAlign: 'center', padding: '2.5rem 2rem', boxShadow: 'var(--shadow-lg)', borderTop: '4px solid var(--accent)' }}>
            <div>
              <h2 style={{ color: 'var(--primary)', fontSize: '2.75rem', marginBottom: '0.25rem', fontWeight: 800 }}>
                <AnimatedCounter end="1.2" duration={1500} suffix="K+" />
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', fontWeight: 600 }}>Active Clinics Monitored</p>
            </div>
            <div style={{ borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)' }}>
              <h2 style={{ color: 'var(--secondary)', fontSize: '2.75rem', marginBottom: '0.25rem', fontWeight: 800 }}>
                <AnimatedCounter end="5.4" duration={1800} suffix="L+" />
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', fontWeight: 600 }}>Weekly Citizen Inquiries</p>
            </div>
            <div>
              <h2 style={{ color: 'var(--accent)', fontSize: '2.75rem', marginBottom: '0.25rem', fontWeight: 800 }}>
                <AnimatedCounter end="100" duration={1500} suffix="%" />
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', fontWeight: 600 }}>Stock Out Warning SLA</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" style={{ padding: '6rem 0', backgroundColor: 'var(--background)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <span style={{ color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '2px' }}>Platform Capabilities</span>
            <h2 style={{ fontSize: '2.25rem', color: 'var(--accent)', marginTop: '0.5rem', marginBottom: '1rem' }}>Smart Infrastructure Modules</h2>
            <div style={{ width: '80px', height: '4px', backgroundColor: 'var(--secondary)', margin: '0 auto' }}></div>
          </div>
          
          <div className="features-grid">
            
            <div className="card" style={{ padding: '2.5rem', transition: 'all 0.3s ease' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                <AlertTriangle color="var(--warning)" size={32} />
              </div>
              <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Predictive Stock Warnings</h3>
              <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, fontSize: '0.925rem' }}>
                Generates instant warning flags if medicine levels fall below critical thresholds. Suggests redistribution actions weeks before actual stock-out.
              </p>
            </div>

            <div className="card" style={{ padding: '2.5rem', transition: 'all 0.3s ease' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'rgba(19, 136, 8, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                <TrendingUp color="var(--primary)" size={32} />
              </div>
              <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Resource Redistribution</h3>
              <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, fontSize: '0.925rem' }}>
                Uses AI to matches surplus pharmacies with deficit centers, calculating geographic proximity for low-cost transfer operations.
              </p>
            </div>

            <div className="card" style={{ padding: '2.5rem', transition: 'all 0.3s ease' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'rgba(0, 0, 128, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                <Users color="var(--accent)" size={32} />
              </div>
              <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Patient Footfall & Wait times</h3>
              <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, fontSize: '0.925rem' }}>
                Enables walk-in patient queue registration, tracking exact consultation times and active medical rostering logs.
              </p>
            </div>

            <div className="card" style={{ padding: '2.5rem', transition: 'all 0.3s ease' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                <Activity color="var(--error)" size={32} />
              </div>
              <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Cold Chain Storage</h3>
              <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, fontSize: '0.925rem' }}>
                Tracks live vaccine storage refrigerator temperatures, triggering instant alarms if temperatures exceed safe ranges (2°C to 8°C).
              </p>
            </div>
            
          </div>
        </div>
      </section>

      {/* Merged About NHM Section */}
      <section id="about" style={{ padding: '6rem 0', backgroundColor: 'var(--surface)', borderTop: '1px solid var(--border)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '4.5rem' }}>
            <span style={{ color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '2px' }}>NHM Vision</span>
            <h2 style={{ fontSize: '2.25rem', color: 'var(--accent)', marginTop: '0.5rem', marginBottom: '1rem' }}>National Health Mission Goals</h2>
            <div style={{ width: '80px', height: '4px', backgroundColor: 'var(--secondary)', margin: '0 auto', marginBottom: '1.5rem' }}></div>
            <p style={{ color: 'var(--text-muted)', maxWidth: '700px', margin: '0 auto', fontSize: '1.05rem', lineHeight: 1.6 }}>
              MeraAsptal bridges operational transparency gaps in Indian Primary (PHC) and Community (CHC) Health Centres. By substituting manual ledgers with live statistics, we eliminate supply run-outs.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2.5rem' }}>
            <div className="card" style={{ padding: '2rem', borderTop: '4px solid var(--primary)', position: 'relative' }}>
              <div style={{ position: 'absolute', right: '1rem', top: '1rem', opacity: 0.1 }}>
                <CheckCircle size={50} color="var(--primary)" />
              </div>
              <h3 style={{ marginBottom: '1rem', color: 'var(--text-main)', fontSize: '1.15rem' }}>Citizen-Centric Telemetry</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
                Anyone can inspect clinic bed counts and on-duty doctors before leaving home, minimizing clinic queues and optimizing public transit resources.
              </p>
            </div>

            <div className="card" style={{ padding: '2rem', borderTop: '4px solid var(--secondary)', position: 'relative' }}>
              <div style={{ position: 'absolute', right: '1rem', top: '1rem', opacity: 0.1 }}>
                <HeartHandshake size={50} color="var(--secondary)" />
              </div>
              <h3 style={{ marginBottom: '1rem', color: 'var(--text-main)', fontSize: '1.15rem' }}>Clinical Efficacy</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
                Provides outpatient vitals logging, multiple-medicine clinical consultation sheets, and automatic diagnostic lab kit deduction tracking.
              </p>
            </div>

            <div className="card" style={{ padding: '2rem', borderTop: '4px solid var(--accent)', position: 'relative' }}>
              <div style={{ position: 'absolute', right: '1rem', top: '1rem', opacity: 0.1 }}>
                <Shield size={50} color="var(--accent)" />
              </div>
              <h3 style={{ marginBottom: '1rem', color: 'var(--text-main)', fontSize: '1.15rem' }}>NDHM Privacy Blueprints</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
                Enforces role-based dashboard clearances, secure cryptographic tokens, and immutable audit logs capturing all supply adjustments.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default LandingPage;
