import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, User, Shield, Key, Mail, Phone, Calendar, Heart, MapPin, Building } from 'lucide-react';
import api from '../utils/api';
import { toast } from 'react-hot-toast';

const ProfileModal = ({ isOpen, onClose }) => {
  const [activeSubTab, setActiveSubTab] = useState('details'); // 'details' | 'password'
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Password state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      api.getProfile().then(data => {
        setProfileData(data);
      }).catch(err => {
        console.error("Failed to load user profile:", err);
        toast.error("Failed to retrieve profile data.");
      }).finally(() => {
        setLoading(false);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (!oldPassword || !newPassword) {
      toast.error("All fields are required.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }

    setUpdating(true);
    try {
      await api.updatePassword(oldPassword, newPassword);
      toast.success("Password updated successfully!");
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setActiveSubTab('details');
    } catch (error) {
      toast.error(error.message || "Failed to update password.");
    } finally {
      setUpdating(false);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return createPortal(
    <div className="modal-overlay" onClick={handleBackdropClick} style={{ zIndex: 99999 }}>
      <div className="modal-content" style={{ maxWidth: '500px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent)', margin: 0 }}>
            <User size={22} /> Account & Profile Settings
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}>
            <X size={20} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '1.5rem' }}>
          <button
            onClick={() => setActiveSubTab('details')}
            style={{
              flex: 1, padding: '0.5rem', background: 'none', border: 'none', cursor: 'pointer',
              borderBottom: activeSubTab === 'details' ? '2px solid var(--accent)' : 'none',
              color: activeSubTab === 'details' ? 'var(--accent)' : 'var(--text-muted)',
              fontWeight: 'bold'
            }}
          >
            Profile Info
          </button>
          <button
            onClick={() => setActiveSubTab('password')}
            style={{
              flex: 1, padding: '0.5rem', background: 'none', border: 'none', cursor: 'pointer',
              borderBottom: activeSubTab === 'password' ? '2px solid var(--accent)' : 'none',
              color: activeSubTab === 'password' ? 'var(--accent)' : 'var(--text-muted)',
              fontWeight: 'bold'
            }}
          >
            Change Password
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Retrieving secure account records...</div>
        ) : (
          <>
            {activeSubTab === 'details' && profileData && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                
                {/* Core Account Details */}
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', backgroundColor: '#fafafa', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <div style={{ padding: '0.75rem', backgroundColor: 'var(--primary)', color: 'white', borderRadius: '50%' }}>
                    <Shield size={24} />
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 0.25rem 0', textTransform: 'capitalize' }}>{profileData.user.role} Account</h4>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ID: {profileData.user.id}</span>
                  </div>
                </div>

                {/* Email and Phone */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem' }}>
                    <Mail size={16} color="var(--text-muted)" />
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Registered Email</div>
                      <strong>{profileData.user.email}</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem' }}>
                    <Phone size={16} color="var(--text-muted)" />
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Contact Number</div>
                      <strong>{profileData.user.phone || 'Not provided'}</strong>
                    </div>
                  </div>
                </div>

                {/* Role Specific details */}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
                  <h4 style={{ fontSize: '0.95rem', color: 'var(--accent)', marginBottom: '0.75rem' }}>Profile Specifications</h4>
                  
                  {profileData.user.role === 'patient' && profileData.profile && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                        <User size={15} color="var(--text-muted)" />
                        <div>Name: <strong>{profileData.profile.name}</strong></div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                        <Calendar size={15} color="var(--text-muted)" />
                        <div>Age: <strong>{profileData.profile.age} Yrs</strong></div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                        <Heart size={15} color="var(--text-muted)" />
                        <div>Blood: <strong>{profileData.profile.blood_group || 'O+'}</strong></div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', gridColumn: 'span 2' }}>
                        <MapPin size={15} color="var(--text-muted)" />
                        <div>Address: <strong>{profileData.profile.address || 'N/A'}</strong></div>
                      </div>
                    </div>
                  )}

                  {profileData.user.role === 'doctor' && profileData.profile && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                        <User size={15} color="var(--text-muted)" />
                        <div>Doctor: <strong>{profileData.profile.name}</strong></div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                        <Building size={15} color="var(--text-muted)" />
                        <div>Specialty: <strong>{profileData.profile.specialization}</strong></div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', gridColumn: 'span 2' }}>
                        <Building size={15} color="var(--text-muted)" />
                        <div>Facility: <strong>{profileData.profile.facility_name || 'PHC Kantabada'}</strong></div>
                      </div>
                    </div>
                  )}

                  {profileData.user.role === 'staff' && profileData.profile && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                        <User size={15} color="var(--text-muted)" />
                        <div>Staff Name: <strong>{profileData.profile.name}</strong></div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                        <Shield size={15} color="var(--text-muted)" />
                        <div>Designation: <strong>{profileData.profile.designation}</strong></div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', gridColumn: 'span 2' }}>
                        <Building size={15} color="var(--text-muted)" />
                        <div>Facility: <strong>{profileData.profile.facility_name || 'PHC Kantabada'}</strong></div>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            )}

            {activeSubTab === 'password' && (
              <form onSubmit={handlePasswordUpdate}>
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label">Current Password</label>
                  <input
                    type="password"
                    className="form-input"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    required
                  />
                </div>
                
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label">New Password</label>
                  <input
                    type="password"
                    className="form-input"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label className="form-label">Confirm New Password</label>
                  <input
                    type="password"
                    className="form-input"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>

                <button type="submit" className="btn btn-primary login-btn" disabled={updating}>
                  {updating ? 'Updating Password...' : 'Save New Password'}
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>,
    document.body
  );
};

export default ProfileModal;
