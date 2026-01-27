/**
 * API service layer for communicating with backend.
 * 
 * This module exports organized API objects for different domains:
 * - authAPI: User registration, login, profile
 * - applicationsAPI: Job application CRUD operations
 * - analyticsAPI: Dashboard statistics
 * 
 * Key features:
 * - Axios instance with automatic JWT token injection
 * - Request interceptor adds Authorization header with JWT token
 * - All requests are authenticated (token automatically included)
 * - Error responses trigger logout if token is invalid
 * 
 * JWT Token Flow:
 * 1. User logs in, receives JWT token from backend
 * 2. Frontend stores token in localStorage
 * 3. Request interceptor reads token from localStorage and adds to Authorization header
 * 4. Backend validates token and processes request
 * 5. Frontend handles 401 responses (token expired/invalid)
 * 
 * Usage examples:
 *   // Get all user's applications
 *   const apps = await applicationsAPI.getAll({status: 'interview'});
 *   
 *   // Create new application
 *   const newApp = await applicationsAPI.create({
 *     company_name: "Google",
 *     job_title: "Senior Engineer",
 *     date_applied: "2024-01-20"
 *   });
 *   
 *   // Get dashboard analytics
 *   const stats = await analyticsAPI.getSummary();
 */

import axios from 'axios';

// Base URL for all API calls (can be overridden with VITE_API_URL env var)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Axios instance: Configured HTTP client for all API communication.
 * 
 * - baseURL: All endpoints prefixed with API_URL (e.g., API_URL + '/api/auth/login')
 * - headers: Default Content-Type for JSON communication
 */
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request interceptor: Automatically adds JWT token to Authorization header.
 * 
 * Before sending each request, this interceptor:
 * 1. Reads JWT token from localStorage
 * 2. If token exists, adds "Authorization: Bearer <token>" header
 * 3. Allows request to proceed
 * 
 * This ensures ALL requests are authenticated without needing to manually
 * add the header in each API call.
 */
api.interceptors.request.use(
  (config) => {
    // Retrieve JWT token saved in localStorage after login
    const token = localStorage.getItem('token');
    if (token) {
      // Add token to Authorization header in format: "Bearer <token>"
      // Backend expects this format (OAuth2 standard)
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    // If request setup fails, reject promise
    return Promise.reject(error);
  }
);

/**
 * Authentication API endpoints.
 * 
 * Handles user registration, login, and profile retrieval.
 */
export const authAPI = {
  /**
   * Register new user account.
   * POST /api/auth/register
   * 
   * @param {Object} data - {email, password, full_name}
   * @returns {Promise} Axios promise with user data
   */
  register: (data) => api.post('/api/auth/register', data),
  
  /**
   * Login with email and password.
   * POST /api/auth/login
   * 
   * Expects OAuth2 form data (Content-Type: application/x-www-form-urlencoded)
   * Returns JWT token that should be stored in localStorage
   * 
   * @param {string} username - User's email (OAuth2 uses "username" field)
   * @param {string} password - User's password
   * @returns {Promise} Axios promise with {access_token, token_type}
   */
  login: (username, password) => {
    const formData = new FormData();
    formData.append('username', username);  // OAuth2 standard uses "username"
    formData.append('password', password);
    return api.post('/api/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
  },
  
  /**
   * Get current authenticated user's profile.
   * GET /api/auth/me
   * 
   * Requires valid JWT token in Authorization header (added by interceptor).
   * Returns user info for the authenticated user.
   * 
   * @returns {Promise} Axios promise with user object
   */
  getCurrentUser: () => api.get('/api/auth/me'),
};

/**
 * Job Applications API endpoints.
 * 
 * CRUD operations for managing job applications.
 * All endpoints require authentication (JWT token automatically included).
 */
export const applicationsAPI = {
  /**
   * Get all user's job applications with optional filtering.
   * GET /api/applications?status=interview&search=google&skip=0&limit=100
   * 
   * @param {Object} params - Query parameters {status, search, is_archived, skip, limit}
   * @returns {Promise} Axios promise with array of applications
   */
  getAll: (params) => api.get('/api/applications', { params }),
  
  /**
   * Get a specific application by ID.
   * GET /api/applications/{id}
   * 
   * @param {string} id - Application UUID
   * @returns {Promise} Axios promise with single application object
   */
  getOne: (id) => api.get(`/api/applications/${id}`),
  
  /**
   * Create new job application.
   * POST /api/applications
   * 
   * @param {Object} data - {company_name, job_title, status, date_applied, job_url, notes}
   * @returns {Promise} Axios promise with created application
   */
  create: (data) => api.post('/api/applications', data),
  
  /**
   * Update existing application.
   * PUT /api/applications/{id}
   * 
   * All fields are optional (partial update).
   * 
   * @param {string} id - Application UUID
   * @param {Object} data - Fields to update {company_name, status, notes, ...}
   * @returns {Promise} Axios promise with updated application
   */
  update: (id, data) => api.put(`/api/applications/${id}`, data),
  
  /**
   * Delete application permanently.
   * DELETE /api/applications/{id}
   * 
   * Removes application from database (hard delete).
   * For soft delete, use toggleArchive() instead.
   * 
   * @param {string} id - Application UUID
   * @returns {Promise} Axios promise
   */
  delete: (id) => api.delete(`/api/applications/${id}`),
  
  /**
   * Toggle archive status of application (soft delete).
   * PATCH /api/applications/{id}/archive
   * 
   * Archived applications are hidden from default views but not permanently deleted.
   * Calling again unarchives the application.
   * 
   * @param {string} id - Application UUID
   * @returns {Promise} Axios promise with updated application
   */
  toggleArchive: (id) => api.patch(`/api/applications/${id}/archive`),
};

/**
 * Analytics/Dashboard API endpoints.
 * 
 * Aggregated statistics about user's job applications.
 */
export const analyticsAPI = {
  /**
   * Get summary statistics for dashboard.
   * GET /api/analytics/summary
   * 
   * Returns:
   * - total_applications: Total active applications
   * - status_breakdown: Count by status (e.g., {applied: 10, interview: 2})
   * - applications_this_week: Recent activity
   * - applications_this_month: Recent activity
   * - success_rate: Percentage of applications resulting in offers
   * 
   * @returns {Promise} Axios promise with AnalyticsSummary object
   */
  getSummary: () => api.get('/api/analytics/summary'),
  
  /**
   * Get daily application submission timeline.
   * GET /api/analytics/timeline?days=30
   *
   * Returns array of {date, count} for each day showing how many
   * applications were submitted. Useful for trend visualization.
   *
   * @param {number} days - Days to look back (default: 30)
   * @returns {Promise} Axios promise with array of timeline data
   */
  getTimeline: (days = 30) => api.get('/api/analytics/timeline', { params: { days } }),

  /**
   * Get upcoming and overdue follow-up reminders.
   * GET /api/analytics/reminders
   *
   * Returns:
   * - upcoming: Follow-ups due in the next 7 days
   * - overdue: Follow-ups that are past due
   *
   * @returns {Promise} Axios promise with RemindersResponse object
   */
  getReminders: () => api.get('/api/analytics/reminders'),
};

/**
 * Default export: The configured axios instance.
 * 
 * Can be used directly for custom requests:
 *   import api from '@/services/api';
 *   api.get('/custom-endpoint');
 */
export default api;