const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, TrendingUp, Building2, Activity, Map, ArrowRight, ShieldCheck, Check, X, RefreshCw } from 'lucide-react';
import api from '../utils/api';
import { toast } from 'react-hot-toast';

const DistrictDashboard = () => {
  const [facilities, setFacilities] = useState([]);
  const [centerScores, setCenterScores] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [aiRedistributions, setAiRedistributions] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [showMap, setShowMap] = useState(true);
  const [loading, setLoading] = useState(true);

  const mapInstanceRef = useRef(null);

  const loadData = async () => {
    try {
      const [facData, scoreData, transferData, redistData, logData] = await Promise.all([
        api.getFacilities(),
        api.getCenterScores(),
        api.getTransfers(),
        api.getRedistributions(),
        api.getLabTests() // fetch audit or lab logs
      ]);
      setFacilities(facData);
      setCenterScores(scoreData);
      setTransfers(transferData);
      setAiRedistributions(redistData);
      
      // Fetch system audit logs
      const rawLogs = await fetch(`${API_URL}/api/audit-logs`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
      });
      if (rawLogs.ok) {
        const logs = await rawLogs.json();
        setAuditLogs(logs);
      }
    } catch (error) {
      console.error("Failed to fetch district telemetry:", error);
      toast.error("Error loading live telemetry data.");
    } finally {
      setLoading(false);
    }
  };

  // Real-time synchronization via WebSockets
  useEffect(() => {
    loadData();

    const wsUrl = API_URL.replace('http', 'ws');
    const ws = new WebSocket(`${wsUrl}/ws`);

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log("WebSocket telemetry update received:", message);
        loadData();
      } catch (err) {
        console.error("WS parse error", err);
      }
    };

    ws.onerror = (err) => console.error("WS error:", err);

    return () => {
      ws.close();
    };
  }, []);

  // Leaflet Map Initialization
  useEffect(() => {
    if (!showMap || facilities.length === 0 || !window.L) return;

    // Wait for the container to render in DOM
    const timer = setTimeout(() => {
      const mapContainer = document.getElementById('district-map');
      if (!mapContainer) return;

      // Clean up previous map if it exists
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      // Khordha, Odisha center coordinate: [20.24, 85.75]
      const map = window.L.map('district-map').setView([20.22, 85.78], 11);
      mapInstanceRef.current = map;

      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);

      facilities.forEach(fac => {
        const scoreInfo = centerScores.find(s => s.facilityId === fac.id) || { riskColor: 'green', totalScore: 80 };
        const color = scoreInfo.riskColor === 'red' ? '#ef4444' : scoreInfo.riskColor === 'yellow' ? '#f59e0b' : '#10b981';

        // Draw Custom circular marker
        const customMarkerIcon = window.L.divIcon({
          className: 'custom-div-icon',
          html: `<div style="background-color: ${color}; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 6px rgba(0,0,0,0.4);"></div>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8]
        });

        const popupContent = `
          <div style="font-family: 'Inter', sans-serif; padding: 5px; min-width: 160px;">
            <h4 style="margin: 0 0 8px; color: var(--accent); font-size: 14px; font-weight: 700;">${fac.name} (${fac.type})</h4>
            <div style="margin: 0 0 5px; font-size: 11px;">Beds Available: <strong>${fac.available_beds} / ${fac.total_beds}</strong></div>
            <div style="margin: 0 0 5px; font-size: 11px;">Doctors On Duty: <strong>${fac.doctors}</strong></div>
            <div style="margin: 0 0 5px; font-size: 11px;">Avg Wait Time: <strong>${fac.wait_time}</strong></div>
            <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid var(--border); font-size: 11px; font-weight: bold; color: ${color};">
              AI Score: ${scoreInfo.totalScore} / 100 (${scoreInfo.riskColor.toUpperCase()})
            </div>
          </div>
        `;

        window.L.marker([fac.latitude, fac.longitude], { icon: customMarkerIcon })
          .addTo(map)
          .bindPopup(popupContent);
      });
    }, 100);

    return () => clearTimeout(timer);
  }, [showMap, facilities, centerScores]);

  const handleApproveTransfer = async (rec) => {
    try {
      // 1. Create a transfer request
      await api.requestTransfer({
        sourceFacilityId: rec.sourceFacilityId,
        destFacilityId: rec.destFacilityId,
        itemName: rec.itemName,
        quantity: rec.transferQuantity
      });
      
      // 2. Fetch pending transfer to approve it (immediate automation)
      const freshTransfers = await api.getTransfers();
      const pending = freshTransfers.find(t => t.item_name === rec.itemName && t.quantity === rec.transferQuantity && t.status === 'pending');
      
      if (pending) {
        await api.approveTransfer(pending.id);
        toast.success(`AI Stock redistribution approved: ${rec.transferQuantity} units of ${rec.itemName} transferred!`);
        loadData();
      }
    } catch (error) {
      toast.error(error.message || "Failed to approve redistribution transfer.");
    }
  };

  const handleManualAction = async (action, id) => {
    try {
      if (action === 'approve') {
        await api.approveTransfer(id);
        toast.success("Transfer approved successfully.");
      } else {
        await api.rejectTransfer(id);
        toast.success("Transfer rejected.");
      }
      loadData();
    } catch (error) {
      toast.error(error.message || "Action failed.");
    }
  };

  const totalBeds = facilities.reduce((sum, fac) => sum + fac.total_beds, 0);
  const availableBeds = facilities.reduce((sum, fac) => sum + fac.available_beds, 0);
  const totalDoctors = facilities.reduce((sum, fac) => sum + fac.doctors, 0);

  const criticalFacilities = centerScores.filter(s => s.riskColor === 'red');

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading district control room telemetry...</div>;

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '3rem' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ color: 'var(--accent)', marginBottom: '0.5rem' }}>District Control Room</h1>
          <p style={{ color: 'var(--text-muted)' }}>Khordha District Overview - Real-Time AI Telemetry</p>
        </div>
        <button 
          onClick={() => setShowMap(!showMap)} 
          className="btn btn-outline" 
          style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}
        >
          <Map size={18} /> {showMap ? 'Hide Map' : 'View GIS Map'}
        </button>
      </div>

      {/* KPI Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '1rem', backgroundColor: 'rgba(19, 136, 8, 0.1)', borderRadius: '50%' }}>
            <Building2 color="var(--primary)" size={24} />
          </div>
          <div>
            <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{facilities.length}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Connected PHCs/CHCs</div>
          </div>
        </div>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '1rem', backgroundColor: 'rgba(0, 0, 128, 0.1)', borderRadius: '50%' }}>
            <Activity color="var(--accent)" size={24} />
          </div>
          <div>
            <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{availableBeds} / {totalBeds}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>District Beds Free</div>
          </div>
        </div>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '1rem', backgroundColor: 'rgba(255, 153, 51, 0.1)', borderRadius: '50%' }}>
            <TrendingUp color="var(--secondary)" size={24} />
          </div>
          <div>
            <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{totalDoctors}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Active Medical Staff</div>
          </div>
        </div>
      </div>

      {/* Map Section */}
      {showMap && (
        <div className="card" style={{ padding: '1rem', marginBottom: '2.5rem' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Live Geographic Health Center Status Map (Khordha)</h3>
          <div id="district-map" style={{ height: '400px', width: '100%', borderRadius: 'var(--radius-md)', zIndex: 10 }}></div>
        </div>
      )}

      {/* Critical Alerts and Recommendations */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem', marginBottom: '2.5rem' }}>
        {/* Critical Centres Alerts */}
        {criticalFacilities.length > 0 && (
          <div>
            <h3 style={{ marginBottom: '1rem', color: 'var(--error)' }}>Critical Underperforming Centres Alerts</h3>
            {criticalFacilities.map(score => {
              const fac = facilities.find(f => f.id === score.facilityId) || {};
              return (
                <div key={score.facilityId} className="card" style={{ borderLeft: '4px solid var(--error)', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ padding: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '50%' }}>
                      <AlertTriangle color="var(--error)" size={20} />
                    </div>
                    <div>
                      <h4 style={{ margin: 0 }}>{fac.name} has critical status (AI Score: {score.totalScore})</h4>
                      <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                        Beds: {fac.available_beds}/{fac.total_beds} free. Doctors: {fac.doctors}. Wait Time: {fac.wait_time}.
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* AI-Driven Supply Redistribution Recommendations */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ color: 'var(--accent)' }}>AI supply chain optimization & redistribution recommendations</h3>
            <button className="btn btn-outline" style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }} onClick={loadData}>
              <RefreshCw size={14} /> Calculate
            </button>
          </div>
          {aiRedistributions.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>Supply levels balanced. No urgent redistributions needed.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {aiRedistributions.map((rec, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', backgroundColor: '#fafafa' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                      Transfer {rec.transferQuantity} units of <span style={{ color: 'var(--secondary)' }}>{rec.itemName}</span>
                    </div>
                    <div style={{ fontSize: '0.875rem', display: 'flex', gap: '0.5rem', alignItems: 'center', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                      <span>{rec.sourceFacilityName} (Surplus)</span>
                      <ArrowRight size={14} />
                      <span>{rec.destFacilityName} (Shortage)</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.825rem', fontStyle: 'italic', color: 'var(--text-muted)' }}>{rec.reason}</p>
                  </div>
                  <button 
                    onClick={() => handleApproveTransfer(rec)} 
                    className="btn btn-primary"
                    style={{ padding: '0.5rem 1rem', fontSize: '0.825rem' }}
                  >
                    Approve Transfer
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Facilities Performance List */}
      <div className="card" style={{ marginBottom: '2.5rem' }}>
        <h3 style={{ marginBottom: '1.5rem' }}>All Centres Telemetry & Scoring Ranks</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--text-muted)' }}>
              <th style={{ padding: '1rem' }}>Facility Name</th>
              <th style={{ padding: '1rem' }}>Beds Free</th>
              <th style={{ padding: '1rem' }}>Doctors Active</th>
              <th style={{ padding: '1rem' }}>Avg Wait Time</th>
              <th style={{ padding: '1rem' }}>AI Health Score</th>
              <th style={{ padding: '1rem' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {facilities.map(fac => {
              const scoreInfo = centerScores.find(s => s.facilityId === fac.id) || { riskColor: 'green', totalScore: 80 };
              const color = scoreInfo.riskColor === 'red' ? 'var(--error)' : scoreInfo.riskColor === 'yellow' ? 'var(--warning)' : 'var(--success)';
              const bg = scoreInfo.riskColor === 'red' ? 'rgba(239, 68, 68, 0.1)' : scoreInfo.riskColor === 'yellow' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)';
              
              return (
                <tr key={fac.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '1rem', fontWeight: 500 }}>{fac.name} ({fac.type})</td>
                  <td style={{ padding: '1rem' }}>{fac.available_beds} / {fac.total_beds}</td>
                  <td style={{ padding: '1rem' }}>{fac.doctors}</td>
                  <td style={{ padding: '1rem' }}>{fac.wait_time}</td>
                  <td style={{ padding: '1rem', fontWeight: 'bold', color }}>{scoreInfo.totalScore} / 100</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ 
                      padding: '0.25rem 0.75rem', 
                      borderRadius: '1rem', 
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      backgroundColor: bg,
                      color
                    }}>
                      {scoreInfo.riskColor.toUpperCase()}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Manual Transfer Requests & Logs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
        <div className="card">
          <h3 style={{ marginBottom: '1.5rem' }}>Active Medicine Transfer Logs</h3>
          {transfers.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1.5rem 0' }}>No medicine transfers recorded.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '350px', overflowY: 'auto' }}>
              {transfers.map(tr => (
                <div key={tr.id} style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{tr.quantity} x {tr.item_name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {tr.source_facility_name} &rarr; {tr.dest_facility_name}
                    </div>
                    <div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                      Status: <strong style={{ color: tr.status === 'approved' ? 'var(--success)' : tr.status === 'rejected' ? 'var(--error)' : 'var(--warning)' }}>{tr.status.toUpperCase()}</strong>
                    </div>
                  </div>
                  {tr.status === 'pending' && (
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <button onClick={() => handleManualAction('approve', tr.id)} className="btn btn-outline" style={{ padding: '0.25rem', borderRadius: '50%', color: 'var(--success)' }} title="Approve">
                        <Check size={16} />
                      </button>
                      <button onClick={() => handleManualAction('reject', tr.id)} className="btn btn-outline" style={{ padding: '0.25rem', borderRadius: '50%', color: 'var(--error)' }} title="Reject">
                        <X size={16} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Real-time System Audit logs */}
        <div className="card">
          <h3 style={{ marginBottom: '1.5rem' }}>District System Audit Trails</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '350px', overflowY: 'auto' }}>
            {auditLogs.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1.5rem 0' }}>No recent audit trail entries.</p>
            ) : (
              auditLogs.map(log => (
                <div key={log.id} style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', fontSize: '0.825rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                    <span>{log.action}</span>
                    <span>{new Date(log.created_at).toLocaleTimeString()}</span>
                  </div>
                  <p style={{ margin: '0.25rem 0 0', color: 'var(--text-main)', fontWeight: 500 }}>{log.details}</p>
                  <span style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>Authorized: {log.user_name || 'System Agent'}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DistrictDashboard;
