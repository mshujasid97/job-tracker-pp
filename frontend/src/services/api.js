import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth API calls
export const authAPI = {
  register: (data) => api.post('/api/auth/register', data),
  login: (username, password) => {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);
    return api.post('/api/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
  },
  getCurrentUser: () => api.get('/api/auth/me'),
};

// Applications API calls
export const applicationsAPI = {
  getAll: (params) => api.get('/api/applications', { params }),
  getOne: (id) => api.get(`/api/applications/${id}`),
  create: (data) => api.post('/api/applications', data),
  update: (id, data) => api.put(`/api/applications/${id}`, data),
  delete: (id) => api.delete(`/api/applications/${id}`),
  toggleArchive: (id) => api.patch(`/api/applications/${id}/archive`),
};

// Analytics API calls
export const analyticsAPI = {
  getSummary: () => api.get('/api/analytics/summary'),
  getTimeline: (days = 30) => api.get('/api/analytics/timeline', { params: { days } }),
};

export default api;