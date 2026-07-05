import React, { useState, useEffect } from 'react';
import { Package, Bed, AlertCircle, Bot, TrendingDown, Users, Loader, TestTube } from 'lucide-react';
import { db } from '../firebase';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';

const StaffDashboard = () => {
  const [activeTab, setActiveTab] = useState('inventory');

  const [inventory, setInventory] = useState([]);
  
  useEffect(() => {
    // Listen to real-time inventory updates from Firestore
    const unsubscribe = onSnapshot(collection(db, 'inventory'), (snapshot) => {
      const invData = [];
      snapshot.forEach(doc => {
        invData.push({ id: doc.id, ...doc.data() });
      });
      setInventory(invData);
    }, (error) => {
      console.error("Error fetching inventory: ", error);
    });

    return () => unsubscribe();
  }, []);

  const [aiInsights, setAiInsights] = useState([]);
  const [loadingAi, setLoadingAi] = useState(false);

  const fetchAiInsights = async () => {
    setLoadingAi(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/insights`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inventory })
      });
      
      const data = await response.json();
      setAiInsights(data);
    } catch (error) {
      console.error("Failed to fetch AI insights from backend", error);
      setAiInsights([{ type: 'warning', message: 'Backend service unavailable. Please check if the Node.js server is running.' }]);
    }
    setLoadingAi(false);
  };

  useEffect(() => {
    if (activeTab === 'ai') {
      fetchAiInsights();
    }
  }, [activeTab]);

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ color: 'var(--accent)', marginBottom: '0.5rem' }}>Staff & Admin Console</h1>
          <p style={{ color: 'var(--text-muted)' }}>PHC Kantabada - District Khordha</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div className="card" style={{ padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', backgroundColor: 'var(--primary)', color: 'white' }}>
            <Bed size={24} />
            <div>
              <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Beds Available</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>12 / 20</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--border)' }}>
        <button 
          className={`btn ${activeTab === 'inventory' ? '' : 'btn-outline'}`}
          style={{ 
            borderBottomLeftRadius: 0, 
            borderBottomRightRadius: 0,
            borderBottom: activeTab === 'inventory' ? '2px solid var(--accent)' : 'none',
            color: activeTab === 'inventory' ? 'var(--accent)' : 'var(--text-muted)',
            backgroundColor: 'transparent'
          }}
          onClick={() => setActiveTab('inventory')}
        >
          <Package size={18} /> Inventory & Stocks
        </button>
        <button 
          className={`btn ${activeTab === 'ai' ? '' : 'btn-outline'}`}
          style={{ 
            borderBottomLeftRadius: 0, 
            borderBottomRightRadius: 0,
            borderBottom: activeTab === 'ai' ? '2px solid var(--accent)' : 'none',
            color: activeTab === 'ai' ? 'var(--accent)' : 'var(--text-muted)',
            backgroundColor: 'transparent'
          }}
          onClick={() => setActiveTab('ai')}
        >
          <Bot size={18} /> Gemini AI Insights
        </button>
        <button 
          className={`btn ${activeTab === 'lab' ? '' : 'btn-outline'}`}
          style={{ 
            borderBottomLeftRadius: 0, 
            borderBottomRightRadius: 0,
            borderBottom: activeTab === 'lab' ? '2px solid var(--accent)' : 'none',
            color: activeTab === 'lab' ? 'var(--accent)' : 'var(--text-muted)',
            backgroundColor: 'transparent'
          }}
          onClick={() => setActiveTab('lab')}
        >
          <TestTube size={18} /> Lab & Diagnostics
        </button>
      </div>

      {activeTab === 'inventory' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <h3 style={{ color: 'var(--text-main)' }}>Medicine Inventory</h3>
            <button className="btn btn-secondary">Update Stock</button>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '1rem' }}>Item Name</th>
                <th style={{ padding: '1rem' }}>Current Stock</th>
                <th style={{ padding: '1rem' }}>Min Threshold</th>
                <th style={{ padding: '1rem' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map(item => (
                <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '1rem', fontWeight: 500 }}>{item.name}</td>
                  <td style={{ padding: '1rem' }}>{item.stock}</td>
                  <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{item.threshold}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ 
                      padding: '0.25rem 0.75rem', 
                      borderRadius: '1rem', 
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      backgroundColor: item.status === 'ok' ? 'rgba(16, 185, 129, 0.1)' : item.status === 'low' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      color: item.status === 'ok' ? 'var(--success)' : item.status === 'low' ? 'var(--warning)' : 'var(--error)'
                    }}>
                      {item.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'ai' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
          {loadingAi ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              <Loader className="animate-spin" size={32} style={{ margin: '0 auto 1rem' }} />
              <p>Gemini is analyzing inventory and local health data...</p>
            </div>
          ) : (
            aiInsights.map((insight, idx) => (
              <div key={idx} className="card" style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', borderLeft: `4px solid ${insight.type === 'warning' ? 'var(--error)' : 'var(--primary)'}` }}>
                <div style={{ padding: '1rem', backgroundColor: insight.type === 'warning' ? 'rgba(239,68,68,0.1)' : 'rgba(19,136,8,0.1)', borderRadius: '50%' }}>
                  {insight.type === 'warning' ? <TrendingDown color="var(--error)" size={32} /> : <Users color="var(--primary)" size={32} />}
                </div>
                <div>
                  <h3 style={{ marginBottom: '0.5rem', color: insight.type === 'warning' ? 'var(--error)' : 'var(--primary)' }}>
                    {insight.type === 'warning' ? 'Predictive Stock-Out Warning' : 'Smart Redistribution Advice'}
                  </h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', lineHeight: 1.5 }}>
                    {insight.message}
                  </p>
                  <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                    <button className="btn btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>View Details</button>
                    {insight.type === 'redistribution' && (
                      <button className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>Approve Transfer</button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'lab' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <h3 style={{ color: 'var(--text-main)' }}>Diagnostic Test Availability Audit</h3>
            <button className="btn btn-secondary">Request Kits</button>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '1rem' }}>Test Name</th>
                <th style={{ padding: '1rem' }}>Kits Available</th>
                <th style={{ padding: '1rem' }}>Daily Usage (Avg)</th>
                <th style={{ padding: '1rem' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '1rem', fontWeight: 500 }}>Malaria Antigen (RDT)</td>
                <td style={{ padding: '1rem' }}>45</td>
                <td style={{ padding: '1rem' }}>12</td>
                <td style={{ padding: '1rem' }}><span style={{ color: 'var(--success)' }}>Available</span></td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '1rem', fontWeight: 500 }}>Dengue NS1 Ag</td>
                <td style={{ padding: '1rem' }}>5</td>
                <td style={{ padding: '1rem' }}>8</td>
                <td style={{ padding: '1rem' }}><span style={{ color: 'var(--error)' }}>Critical Shortage</span></td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '1rem', fontWeight: 500 }}>Blood Sugar (Glucometer Strips)</td>
                <td style={{ padding: '1rem' }}>210</td>
                <td style={{ padding: '1rem' }}>30</td>
                <td style={{ padding: '1rem' }}><span style={{ color: 'var(--success)' }}>Available</span></td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '1rem', fontWeight: 500 }}>Typhoid (Widal)</td>
                <td style={{ padding: '1rem' }}>18</td>
                <td style={{ padding: '1rem' }}>5</td>
                <td style={{ padding: '1rem' }}><span style={{ color: 'var(--warning)' }}>Running Low</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default StaffDashboard;
