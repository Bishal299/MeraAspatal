const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
import React, { useState, useEffect } from 'react';
import { Package, Bed, AlertCircle, Bot, TrendingDown, Users, Loader, TestTube, RefreshCw, Plus, CheckCircle, Clock, Thermometer } from 'lucide-react';
import api from '../utils/api';
import { toast } from 'react-hot-toast';

const StaffDashboard = () => {
  const [activeTab, setActiveTab] = useState('inventory');
  
  // Telemetry Lists
  const [inventory, setInventory] = useState([]);
  const [labTests, setLabTests] = useState([]);
  const [aiForecasts, setAiForecasts] = useState([]);
  const [coldChainLogs, setColdChainLogs] = useState([]);
  const [facility, setFacility] = useState(null);
  const [loadingAi, setLoadingAi] = useState(false);

  // Forms & Modals
  const [showStockModal, setShowStockModal] = useState(false);
  const [showTestResultModal, setShowTestResultModal] = useState(false);
  const [showColdChainModal, setShowColdChainModal] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);
  const [testResultInput, setTestResultInput] = useState('Non-Reactive');

  // Cold Chain log input form
  const [coldChainForm, setColdChainForm] = useState({
    equipmentName: 'Main Vaccine Freezer A',
    temperature: 4.2,
    humidity: 55
  });

  // New stock form
  const [stockForm, setStockForm] = useState({
    id: '',
    itemName: '',
    stock: 0,
    threshold: 100,
    category: 'medicine',
    expiryDate: ''
  });

  // Read authenticated user
  const userStr = localStorage.getItem('user');
  const staffUser = userStr ? JSON.parse(userStr) : { id: 'USR_3', name: 'Staff Prasad', facilityId: 'FAC_1' };
  const facilityId = staffUser.facilityId || 'FAC_1';

  const loadData = async () => {
    try {
      const [invList, testsList, facDetails] = await Promise.all([
        api.getInventory(facilityId),
        api.getLabTests(facilityId),
        api.getFacilities().then(list => list.find(f => f.id === facilityId))
      ]);
      setInventory(invList);
      setLabTests(testsList);
      setFacility(facDetails);

      // Fetch cold chain logs
      const ccResponse = await fetch(`${API_URL}/api/cold-chain?facilityId=${facilityId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
      });
      if (ccResponse.ok) {
        const ccData = await ccResponse.json();
        setColdChainLogs(ccData);
      }
    } catch (error) {
      console.error("Failed to load staff telemetry:", error);
    }
  };

  const loadForecasts = async () => {
    setLoadingAi(true);
    try {
      const forecasts = await api.getForecasts(facilityId);
      setAiForecasts(forecasts);
    } catch (error) {
      toast.error("Failed to calculate AI supply projections.");
    } finally {
      setLoadingAi(false);
    }
  };

  // Real-time synchronization
  useEffect(() => {
    loadData();

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

  useEffect(() => {
    if (activeTab === 'ai') {
      loadForecasts();
    }
  }, [activeTab]);

  const handleOpenStockModal = (item = null) => {
    if (item) {
      setStockForm({
        id: item.id,
        itemName: item.name || item.item_name,
        stock: item.stock,
        threshold: item.threshold,
        category: item.category,
        expiryDate: item.expiry_date || ''
      });
    } else {
      setStockForm({
        id: '',
        itemName: '',
        stock: 0,
        threshold: 100,
        category: 'medicine',
        expiryDate: ''
      });
    }
    setShowStockModal(true);
  };

  const handleStockSubmit = async (e) => {
    e.preventDefault();
    if (!stockForm.itemName.trim()) {
      toast.error("Supply item name is required.");
      return;
    }

    try {
      await api.updateInventory({
        id: stockForm.id || undefined,
        facilityId,
        itemName: stockForm.itemName,
        stock: stockForm.stock,
        threshold: stockForm.threshold,
        category: stockForm.category,
        expiryDate: stockForm.expiryDate || null
      });

      toast.success(stockForm.id ? "Stock level adjusted." : "New supply registered.");
      setShowStockModal(false);
      loadData();
    } catch (err) {
      toast.error("Failed to update inventory.");
    }
  };

  const handleOpenResultModal = (test) => {
    setSelectedTest(test);
    setTestResultInput('Non-Reactive');
    setShowTestResultModal(true);
  };

  const handleResultSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.completeLabTest(selectedTest.id, testResultInput);
      toast.success("Diagnostic results registered and kits inventory decremented.");
      setShowTestResultModal(false);
      loadData();
    } catch (err) {
      toast.error("Failed to submit lab results.");
    }
  };

  const handleColdChainSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/cold-chain/telemetry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          facilityId,
          equipmentName: coldChainForm.equipmentName,
          temperature: parseFloat(coldChainForm.temperature),
          humidity: parseInt(coldChainForm.humidity)
        })
      });

      if (res.ok) {
        toast.success("Temperature reading logged successfully.");
        setShowColdChainModal(false);
        loadData();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to log telemetry.");
      }
    } catch (err) {
      toast.error("Failed to record cold chain logs.");
    }
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '3rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ color: 'var(--accent)', marginBottom: '0.5rem' }}>Staff & Admin Console</h1>
          <p style={{ color: 'var(--text-muted)' }}>{facility ? `${facility.name} - ${facility.type}` : 'Loading PHC...'}</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div className="card" style={{ padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', backgroundColor: 'var(--primary)', color: 'white' }}>
            <Bed size={24} />
            <div>
              <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Beds Available</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                {facility ? `${facility.available_beds} / ${facility.total_beds}` : '-- / --'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
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
          <Bot size={18} /> Gemini AI Supply Forecasts
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
          <TestTube size={18} /> Diagnostic Lab Orders
        </button>
        <button 
          className={`btn ${activeTab === 'coldChain' ? '' : 'btn-outline'}`}
          style={{ 
            borderBottomLeftRadius: 0, 
            borderBottomRightRadius: 0,
            borderBottom: activeTab === 'coldChain' ? '2px solid var(--accent)' : 'none',
            color: activeTab === 'coldChain' ? 'var(--accent)' : 'var(--text-muted)',
            backgroundColor: 'transparent'
          }}
          onClick={() => setActiveTab('coldChain')}
        >
          <Thermometer size={18} /> Cold Chain Monitoring
        </button>
      </div>

      {/* TAB CONTENT: INVENTORY */}
      {activeTab === 'inventory' && (
        <div className="card animate-fade-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center' }}>
            <h3 style={{ color: 'var(--text-main)' }}>Facility Medicine & Supply Stock</h3>
            <button className="btn btn-secondary" onClick={() => handleOpenStockModal()}>
              <Plus size={16} /> Register New Supply
            </button>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '1rem' }}>Supply Item Name</th>
                <th style={{ padding: '1rem' }}>Category</th>
                <th style={{ padding: '1rem' }}>Current Stock</th>
                <th style={{ padding: '1rem' }}>Safety Threshold</th>
                <th style={{ padding: '1rem' }}>Expiry Date</th>
                <th style={{ padding: '1rem' }}>Status</th>
                <th style={{ padding: '1rem' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map(item => (
                <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '1rem', fontWeight: 500 }}>{item.item_name}</td>
                  <td style={{ padding: '1rem', textTransform: 'capitalize', color: 'var(--text-muted)' }}>{item.category.replace('_', ' ')}</td>
                  <td style={{ padding: '1rem' }}>{item.stock} {item.unit}</td>
                  <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{item.threshold}</td>
                  <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{item.expiry_date || 'N/A'}</td>
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
                  <td style={{ padding: '1rem' }}>
                    <button className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => handleOpenStockModal(item)}>Adjust</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB CONTENT: AI DEMAND FORECASTING */}
      {activeTab === 'ai' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {loadingAi ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              <Loader className="animate-spin" size={32} style={{ margin: '0 auto 1rem' }} />
              <p>Gemini is calculating supply run rates and predicting stock-out dates...</p>
            </div>
          ) : (
            <>
              {/* Early Warnings Header */}
              <div className="card" style={{ borderLeft: '4px solid var(--secondary)', display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                <Bot size={40} color="var(--secondary)" />
                <div>
                  <h3 style={{ color: 'var(--secondary)', marginBottom: '0.25rem' }}>AI supply chain forecasting & early warnings</h3>
                  <p style={{ color: 'var(--text-muted)', margin: 0 }}>Projections based on daily patient intake, active diagnostic kit requests, and stock thresholds.</p>
                </div>
              </div>

              {/* Projections Table */}
              <div className="card">
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '1rem' }}>Item Name</th>
                      <th style={{ padding: '1rem' }}>Current Stock</th>
                      <th style={{ padding: '1rem' }}>Est. Daily Run Rate</th>
                      <th style={{ padding: '1rem' }}>Stock Out Timeline</th>
                      <th style={{ padding: '1rem' }}>AI Shortage Risk</th>
                      <th style={{ padding: '1rem' }}>Projected Demand (30 Days)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {aiForecasts.map(fc => (
                      <tr key={fc.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '1rem', fontWeight: 500 }}>{fc.itemName}</td>
                        <td style={{ padding: '1rem' }}>{fc.currentStock}</td>
                        <td style={{ padding: '1rem' }}>~{fc.dailyUsage} / day</td>
                        <td style={{ padding: '1rem', color: fc.shortageRisk === 'High' ? 'var(--error)' : 'var(--text-main)', fontWeight: fc.shortageRisk === 'High' ? 600 : 400 }}>
                          {fc.shortageRisk === 'High' ? `Stock-out by ${fc.predictedStockOutDate}` : `${fc.daysRemaining} days left`}
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <span style={{ 
                            padding: '0.25rem 0.75rem', 
                            borderRadius: '1.5rem', 
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            backgroundColor: fc.shortageRisk === 'High' ? 'rgba(239,68,68,0.1)' : fc.shortageRisk === 'Medium' ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)',
                            color: fc.shortageRisk === 'High' ? 'var(--error)' : fc.shortageRisk === 'Medium' ? 'var(--warning)' : 'var(--success)'
                          }}>
                            {fc.shortageRisk.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{fc.projectedNextMonthDemand} units</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB CONTENT: DIAGNOSTIC LAB TESTS */}
      {activeTab === 'lab' && (
        <div className="card animate-fade-in">
          <h3 style={{ color: 'var(--text-main)', marginBottom: '1.5rem' }}>Active Lab Diagnostic Requests</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '1rem' }}>Patient Name</th>
                <th style={{ padding: '1rem' }}>Diagnostic Kit Ordered</th>
                <th style={{ padding: '1rem' }}>Status</th>
                <th style={{ padding: '1rem' }}>Findings Result</th>
                <th style={{ padding: '1rem' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {labTests.map(test => (
                <tr key={test.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '1rem', fontWeight: 500 }}>{test.patient_name}</td>
                  <td style={{ padding: '1rem' }}>{test.test_name}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ 
                      padding: '0.25rem 0.75rem', 
                      borderRadius: '1.5rem', 
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      backgroundColor: test.status === 'completed' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245,158,11,0.1)',
                      color: test.status === 'completed' ? 'var(--success)' : 'var(--warning)'
                    }}>
                      {test.status.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', fontStyle: 'italic', color: 'var(--text-muted)' }}>
                    {test.result || 'Awaiting lab findings...'}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    {test.status === 'pending' ? (
                      <button className="btn btn-primary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }} onClick={() => handleOpenResultModal(test)}>Complete Test</button>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem', display: 'flex', gap: '0.25rem', alignItems: 'center' }}><CheckCircle size={14} color="var(--success)" /> Verified</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB CONTENT: COLD CHAIN COLD STORAGE MONITORING */}
      {activeTab === 'coldChain' && (
        <div className="card animate-fade-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center' }}>
            <h3 style={{ color: 'var(--text-main)' }}>Vaccine & Storage Freezer Dials</h3>
            <button className="btn btn-secondary" onClick={() => setShowColdChainModal(true)}>
              Log Refrigerator Temperature
            </button>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '1rem' }}>Logged Time</th>
                <th style={{ padding: '1rem' }}>Freezer Unit Name</th>
                <th style={{ padding: '1rem' }}>Temperature (°C)</th>
                <th style={{ padding: '1rem' }}>Humidity (%)</th>
                <th style={{ padding: '1rem' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {coldChainLogs.map(log => (
                <tr key={log.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{new Date(log.logged_at).toLocaleString()}</td>
                  <td style={{ padding: '1rem', fontWeight: 500 }}>{log.equipment_name}</td>
                  <td style={{ padding: '1rem', color: log.status === 'alert' ? 'var(--error)' : 'var(--text-main)', fontWeight: log.status === 'alert' ? 'bold' : 'normal' }}>
                    {log.temperature} °C
                  </td>
                  <td style={{ padding: '1rem' }}>{log.humidity} %</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ 
                      padding: '0.25rem 0.75rem', 
                      borderRadius: '1rem', 
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      backgroundColor: log.status === 'normal' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      color: log.status === 'normal' ? 'var(--success)' : 'var(--error)'
                    }}>
                      {log.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Adjust Inventory Stock Modal */}
      {showStockModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowStockModal(false); }} style={{ zIndex: 99999 }}>
          <div className="modal-content" style={{ maxWidth: '450px' }}>
            <h3 style={{ marginBottom: '1.5rem' }}>{stockForm.id ? 'Adjust Supply Stock Level' : 'Register New Supply Item'}</h3>
            <form onSubmit={handleStockSubmit}>
              <div className="form-group">
                <label className="form-label">Item Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={stockForm.itemName} 
                  onChange={(e) => setStockForm({ ...stockForm, itemName: e.target.value })}
                  disabled={!!stockForm.id}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Current Stock</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={stockForm.stock} 
                    onChange={(e) => setStockForm({ ...stockForm, stock: parseInt(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Min Threshold</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={stockForm.threshold} 
                    onChange={(e) => setStockForm({ ...stockForm, threshold: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Supply Category</label>
                <select 
                  className="form-input" 
                  value={stockForm.category}
                  onChange={(e) => setStockForm({ ...stockForm, category: e.target.value })}
                >
                  <option value="medicine">Medicine Supply</option>
                  <option value="diagnostic_kit">Diagnostic Test Kit</option>
                  <option value="iv_fluid">IV Fluid</option>
                  <option value="ppe">Personal Protective (PPE)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Expiry Date</label>
                <input 
                  type="date" 
                  className="form-input" 
                  value={stockForm.expiryDate} 
                  onChange={(e) => setStockForm({ ...stockForm, expiryDate: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowStockModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete Lab Test findings Result Modal */}
      {showTestResultModal && selectedTest && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowTestResultModal(false); }} style={{ zIndex: 99999 }}>
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <h3 style={{ marginBottom: '1rem' }}>Enter Diagnostic Findings</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Patient: <strong>{selectedTest.patient_name}</strong> - Test: {selectedTest.test_name}</p>
            <form onSubmit={handleResultSubmit}>
              <div className="form-group">
                <label className="form-label">Findings Result</label>
                <select 
                  className="form-input" 
                  value={testResultInput} 
                  onChange={(e) => setTestResultInput(e.target.value)}
                >
                  <option value="Non-Reactive">Non-Reactive (Negative)</option>
                  <option value="Reactive (Trace)">Reactive (Trace)</option>
                  <option value="Reactive (Highly Positive)">Reactive (Highly Positive)</option>
                  <option value="Normal Sugar (98 mg/dL)">Normal Sugar (98 mg/dL)</option>
                  <option value="Elevated Sugar (210 mg/dL)">Elevated Sugar (210 mg/dL)</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowTestResultModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Submit Test Result</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Cold Chain Temperature Modal */}
      {showColdChainModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowColdChainModal(false); }} style={{ zIndex: 99999 }}>
          <div className="modal-content" style={{ maxWidth: '450px' }}>
            <h3 style={{ marginBottom: '1.5rem' }}>Log Refrigerator Telemetry</h3>
            <form onSubmit={handleColdChainSubmit}>
              <div className="form-group">
                <label className="form-label">Equipment Freezer Unit Name</label>
                <select 
                  className="form-input" 
                  value={coldChainForm.equipmentName} 
                  onChange={(e) => setColdChainForm({ ...coldChainForm, equipmentName: e.target.value })}
                >
                  <option value="Main Vaccine Freezer A">Main Vaccine Freezer A</option>
                  <option value="Insulin Refrigerator B">Insulin Refrigerator B</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Temperature (°C)</label>
                  <input 
                    type="number" 
                    step="0.1" 
                    className="form-input" 
                    value={coldChainForm.temperature} 
                    onChange={(e) => setColdChainForm({ ...coldChainForm, temperature: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Humidity (%)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={coldChainForm.humidity} 
                    onChange={(e) => setColdChainForm({ ...coldChainForm, humidity: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowColdChainModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Submit Telemetry</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default StaffDashboard;
