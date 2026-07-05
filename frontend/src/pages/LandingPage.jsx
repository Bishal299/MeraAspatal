import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Shield, Users, Activity, BarChart3, TrendingUp, AlertTriangle, ArrowRight } from 'lucide-react';
import Navbar from '../components/Navbar';

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
    <div className="landing-page">
      <Navbar />
      
      {/* Hero Section with Carousel */}
      <header className="hero-section" style={{ position: 'relative', height: '80vh', minHeight: '600px', overflow: 'hidden' }}>
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
              backgroundImage: `linear-gradient(rgba(0, 0, 128, 0.7), rgba(19, 136, 8, 0.7)), url(${slide.image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              color: 'white',
              zIndex: currentSlide === index ? 1 : 0
            }}
          >
            <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', maxWidth: '800px', padding: '2rem' }}>

              <h1 className="animate-fade-in" style={{ color: 'white', fontSize: '3.5rem', marginBottom: '1.5rem', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                {slides[currentSlide].title}
              </h1>
              <p className="animate-slide-up" style={{ color: 'rgba(255,255,255,0.9)', fontSize: '1.25rem', marginBottom: '2.5rem', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                {slides[currentSlide].subtitle}
              </p>
              <div className="animate-slide-up" style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <Link to="/login" className="btn btn-secondary" style={{ padding: '1rem 2.5rem', fontSize: '1.1rem' }}>
                  {t('Access Portal')}
                </Link>
                <a href="#features" className="btn btn-outline" style={{ padding: '1rem 2.5rem', fontSize: '1.1rem', color: 'white', borderColor: 'white' }}>
                  {t('Learn More')}
                </a>
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
      <section style={{ padding: '5rem 0', backgroundColor: 'var(--surface)', position: 'relative', marginTop: '-3rem', zIndex: 20 }}>
        <div className="container">
          <div className="card" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem', textAlign: 'center', padding: '3rem 2rem', boxShadow: 'var(--shadow-lg)' }}>
            <div>
              <h2 style={{ color: 'var(--primary)', fontSize: '3rem', marginBottom: '0.5rem' }}>
                <AnimatedCounter end="1.2" duration={2000} suffix="L+" />
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', fontWeight: 500 }}>Connected PHCs/CHCs</p>
            </div>
            <div style={{ borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)' }}>
              <h2 style={{ color: 'var(--secondary)', fontSize: '3rem', marginBottom: '0.5rem' }}>
                <AnimatedCounter end="50" duration={2500} suffix="M+" />
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', fontWeight: 500 }}>Patients Served Annually</p>
            </div>
            <div>
              <h2 style={{ color: 'var(--accent)', fontSize: '3rem', marginBottom: '0.5rem' }}>
                <AnimatedCounter end="100" duration={2000} suffix="%" />
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', fontWeight: 500 }}>Real-Time AI Tracking</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" style={{ padding: '6rem 0', backgroundColor: 'var(--background)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{ fontSize: '2.5rem', color: 'var(--accent)', marginBottom: '1rem' }}>Platform Capabilities</h2>
            <div style={{ width: '80px', height: '4px', backgroundColor: 'var(--secondary)', margin: '0 auto' }}></div>
          </div>
          
          <div className="features-grid">
            
            <div className="card" style={{ padding: '2.5rem', transition: 'all 0.3s ease' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                <AlertTriangle color="var(--warning)" size={32} />
              </div>
              <h3 style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>Predictive Stock Warnings</h3>
              <p style={{ color: 'var(--text-muted)', lineHeight: 1.7 }}>AI models analyze consumption patterns to warn district admins of imminent medicine stock-outs weeks in advance.</p>
            </div>

            <div className="card" style={{ padding: '2.5rem', transition: 'all 0.3s ease' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'rgba(19, 136, 8, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                <TrendingUp color="var(--primary)" size={32} />
              </div>
              <h3 style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>Resource Redistribution</h3>
              <p style={{ color: 'var(--text-muted)', lineHeight: 1.7 }}>Dynamically reallocate surplus medicines or staff from under-utilized centers to hotspots facing high patient footfall.</p>
            </div>

            <div className="card" style={{ padding: '2.5rem', transition: 'all 0.3s ease' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'rgba(0, 0, 128, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                <Users color="var(--accent)" size={32} />
              </div>
              <h3 style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>Patient Footfall & Queue</h3>
              <p style={{ color: 'var(--text-muted)', lineHeight: 1.7 }}>Digitize patient intake and monitor live queues to distribute load effectively across local PHCs.</p>
            </div>

            <div className="card" style={{ padding: '2.5rem', transition: 'all 0.3s ease' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                <Activity color="var(--error)" size={32} />
              </div>
              <h3 style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>Bed & Test Availability</h3>
              <p style={{ color: 'var(--text-muted)', lineHeight: 1.7 }}>Live audits of diagnostic machine status and bed availability accessible to citizens and referring doctors.</p>
            </div>
            
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ backgroundColor: 'var(--accent)', color: 'white', padding: '4rem 0 2rem', textAlign: 'center' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <div style={{ width: '50px', height: '60px', backgroundColor: 'white', borderRadius: '2px', maskImage: 'url(https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg)', maskSize: 'contain', maskRepeat: 'no-repeat', maskPosition: 'center', WebkitMaskImage: 'url(https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg)', WebkitMaskSize: 'contain', WebkitMaskRepeat: 'no-repeat', WebkitMaskPosition: 'center', opacity: 0.8 }}></div>
          </div>
          <h3 style={{ color: 'white', marginBottom: '1rem', fontSize: '1.75rem' }}>MeraAsptal</h3>
          <p style={{ opacity: 0.8, marginBottom: '3rem', maxWidth: '500px', margin: '0 auto 3rem' }}>
            A National Initiative for Smarter Health Infrastructure
          </p>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ opacity: 0.6, fontSize: '0.875rem' }}>
              &copy; 2026 Ministry of Health & Family Welfare. All rights reserved.
            </div>
            <div style={{ display: 'flex', gap: '1.5rem', opacity: 0.8, fontSize: '0.875rem' }}>
              <a href="#" style={{ color: 'white' }}>Privacy Policy</a>
              <a href="#" style={{ color: 'white' }}>Terms of Service</a>
              <a href="#" style={{ color: 'white' }}>Contact Us</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
