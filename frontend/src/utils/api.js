const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const getAccessToken = () => localStorage.getItem('accessToken');
const getRefreshToken = () => localStorage.getItem('refreshToken');

const saveTokens = (accessToken, refreshToken) => {
  localStorage.setItem('accessToken', accessToken);
  if (refreshToken) {
    localStorage.setItem('refreshToken', refreshToken);
  }
};

const clearSession = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  localStorage.removeItem('userRole');
};

const fetchAPI = async (endpoint, options = {}) => {
  const url = `${API_URL}${endpoint}`;
  const token = getAccessToken();

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401 || response.status === 403) {
    // Try to refresh token
    const rt = getRefreshToken();
    if (rt) {
      try {
        const refreshResponse = await fetch(`${API_URL}/api/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: rt }),
        });
        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          saveTokens(data.accessToken);
          // Retry the original request
          headers['Authorization'] = `Bearer ${data.accessToken}`;
          const retryResponse = await fetch(url, { ...options, headers });
          return retryResponse;
        }
      } catch (err) {
        console.error("Token refresh failed:", err);
      }
    }
    clearSession();
    window.location.href = '/login';
    throw new Error('Authentication expired.');
  }

  return response;
};

export const api = {
  // Auth API
  login: async (email, password, role) => {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Login failed.');
    }
    const data = await res.json();
    saveTokens(data.accessToken, data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    localStorage.setItem('userRole', data.user.role);
    return data.user;
  },

  register: async (payload) => {
    const res = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Registration failed.');
    }
    return res.json();
  },

  logout: async () => {
    const rt = getRefreshToken();
    if (rt) {
      try {
        await fetch(`${API_URL}/api/auth/logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: rt }),
        });
      } catch (err) {
        console.error("Logout request failure:", err);
      }
    }
    clearSession();
    window.location.href = '/login';
  },

  getCurrentUser: async () => {
    const res = await fetchAPI('/api/auth/me');
    return res.json();
  },

  getProfile: async () => {
    const res = await fetchAPI('/api/auth/profile');
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to fetch user profile.');
    }
    return res.json();
  },

  updatePassword: async (oldPassword, newPassword) => {
    const res = await fetchAPI('/api/auth/update-password', {
      method: 'PUT',
      body: JSON.stringify({ oldPassword, newPassword }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update password.');
    }
    return res.json();
  },

  // Facilities API
  getFacilities: async () => {
    const res = await fetchAPI('/api/facilities');
    return res.json();
  },

  updateBeds: async (facilityId, availableBeds) => {
    const res = await fetchAPI(`/api/facilities/${facilityId}/beds`, {
      method: 'PUT',
      body: JSON.stringify({ availableBeds }),
    });
    return res.json();
  },

  // Inventory API
  getInventory: async (facilityId = null) => {
    const endpoint = facilityId ? `/api/inventory?facilityId=${facilityId}` : '/api/inventory';
    const res = await fetchAPI(endpoint);
    return res.json();
  },

  updateInventory: async (data) => {
    const res = await fetchAPI('/api/inventory/update', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.json();
  },

  // Transfers API
  getTransfers: async () => {
    const res = await fetchAPI('/api/transfers');
    return res.json();
  },

  requestTransfer: async (data) => {
    const res = await fetchAPI('/api/transfers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.json();
  },

  approveTransfer: async (transferId) => {
    const res = await fetchAPI(`/api/transfers/${transferId}/approve`, {
      method: 'POST',
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Approval failed.');
    }
    return res.json();
  },

  rejectTransfer: async (transferId) => {
    const res = await fetchAPI(`/api/transfers/${transferId}/reject`, {
      method: 'POST',
    });
    return res.json();
  },

  // Patients & Queue API
  getPatients: async (facilityId = null, status = null) => {
    let endpoint = '/api/patients';
    const params = [];
    if (facilityId) params.push(`facilityId=${facilityId}`);
    if (status) params.push(`status=${status}`);
    if (params.length > 0) endpoint += `?${params.join('&')}`;

    const res = await fetchAPI(endpoint);
    return res.json();
  },

  registerPatient: async (data) => {
    const res = await fetchAPI('/api/patients', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.json();
  },

  updatePatientStatus: async (patientId, status) => {
    const res = await fetchAPI(`/api/patients/${patientId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
    return res.json();
  },

  toggleIPDBed: async (patientId, allocate) => {
    const res = await fetchAPI(`/api/patients/${patientId}/ipd-bed`, {
      method: 'POST',
      body: JSON.stringify({ allocate }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to toggle bed allocation.');
    }
    return res.json();
  },

  // Attendance API
  punchAttendance: async (userId, facilityId) => {
    const res = await fetchAPI('/api/doctors/attendance/punch', {
      method: 'POST',
      body: JSON.stringify({ userId, facilityId }),
    });
    return res.json();
  },

  getAttendanceList: async () => {
    const res = await fetchAPI('/api/doctors/attendance');
    return res.json();
  },

  // Labs API
  getLabTests: async (facilityId = null) => {
    const endpoint = facilityId ? `/api/labs/tests?facilityId=${facilityId}` : '/api/labs/tests';
    const res = await fetchAPI(endpoint);
    return res.json();
  },

  requestLabTest: async (data) => {
    const res = await fetchAPI('/api/labs/tests', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.json();
  },

  completeLabTest: async (testId, result) => {
    const res = await fetchAPI(`/api/labs/tests/${testId}/complete`, {
      method: 'PUT',
      body: JSON.stringify({ result }),
    });
    return res.json();
  },

  // AI API
  sendChatMessage: async (message, language = 'en') => {
    const res = await fetch(`${API_URL}/api/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, language }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to send chat message.');
    }
    return res.json();
  },

  getForecasts: async (facilityId = null) => {
    const endpoint = facilityId ? `/api/ai/forecast?facilityId=${facilityId}` : '/api/ai/forecast';
    const res = await fetchAPI(endpoint);
    return res.json();
  },

  getRedistributions: async () => {
    const res = await fetchAPI('/api/ai/redistribute');
    return res.json();
  },

  getCenterScores: async () => {
    const res = await fetchAPI('/api/ai/scores');
    return res.json();
  }
};
export default api;
