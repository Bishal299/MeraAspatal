import React, { useState, useEffect } from 'react';
import { Search, MapPin, PhoneCall, BedDouble, Stethoscope } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../utils/api';

const FacilitiesPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFacilities = async () => {
      try {
        const list = await api.getFacilities();
        setFacilities(list);
      } catch (error) {
        console.error("Error fetching public facilities list:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchFacilities();
  }, []);

  const filtered = facilities.filter(fac => {
    const matchesSearch = fac.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' ? true : fac.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--background)' }}>
      <Navbar />
      <div className="container" style={{ padding: '3rem 0' }}>
        
        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h1 style={{ color: 'var(--accent)', fontSize: '2.5rem', marginBottom: '0.75rem' }}>Public Health Directory</h1>
          <p style={{ color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto' }}>
            Real-time live telemetry statistics of community and primary health centers across Khordha district.
          </p>
        </div>

        {/* Filters */}
        <div className="card" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', padding: '1.5rem', marginBottom: '2.5rem' }}>
          <div style={{ flex: 1, position: 'relative', minWidth: '250px' }}>
            <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              className="form-input" 
              placeholder="Search by center name (e.g. Kantabada)..." 
              style={{ paddingLeft: '2.75rem' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)}
            className="form-input"
            style={{ width: '180px', cursor: 'pointer' }}
          >
            <option value="all">All Facility Types</option>
            <option value="PHC">Primary Health Centres (PHC)</option>
            <option value="CHC">Community Health Centres (CHC)</option>
          </select>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>Loading facilities database...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {filtered.map(fac => {
              const bedStatus = fac.available_beds > 5 ? 'var(--success)' : fac.available_beds > 0 ? 'var(--warning)' : 'var(--error)';
              const bedBg = fac.available_beds > 5 ? 'rgba(16,185,129,0.1)' : fac.available_beds > 0 ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)';

              return (
                <div key={fac.id} className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                    <div>
                      <h4 style={{ fontSize: '1.25rem', color: 'var(--text-main)', marginBottom: '0.25rem' }}>{fac.name}</h4>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.2rem 0.5rem', backgroundColor: 'var(--background)', border: '1px solid var(--border)', borderRadius: '4px' }}>
                        {fac.type}
                      </span>
                    </div>
                    <span style={{
                      padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 600,
                      backgroundColor: bedBg, color: bedStatus
                    }}>
                      {fac.available_beds > 0 ? 'BEDS FREE' : 'FULL CAPACITY'}
                    </span>
                  </div>

                  {/* Telemetry info */}
                  <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <BedDouble size={20} color="var(--primary)" />
                      <div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{fac.available_beds} / {fac.total_beds}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Beds Available</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Stethoscope size={20} color="var(--accent)" />
                      <div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{fac.doctors}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Active Rosters</div>
                      </div>
                    </div>
                  </div>

                  {/* Actions & Wait times */}
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: 'auto'
                  }}>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                      Est. Queue Wait: <strong>{fac.wait_time}</strong>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <a href={`tel:${fac.contact}`} className="btn btn-outline" style={{ padding: '0.5rem', borderRadius: '50%' }} title="Call Helpline">
                        <PhoneCall size={15} />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
      <Footer />
    </div>
  );
};

export default FacilitiesPage;
