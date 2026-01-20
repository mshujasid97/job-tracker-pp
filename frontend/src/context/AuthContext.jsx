/**
 * Authentication context and provider for React application.
 * 
 * Manages global authentication state including:
 * - Current user information
 * - Authentication status (loading, authenticated, logout)
 * - Auth functions (login, register, logout)
 * 
 * How it works:
 * 1. On app startup, AuthProvider checks localStorage for JWT token
 * 2. If token exists, loads current user info from backend (/api/auth/me)
 * 3. Provides useAuth hook for any component to access auth state
 * 4. When user logs in, token is saved to localStorage and user info loaded
 * 5. When user logs out, token is cleared and user set to null
 * 
 * Token persistence:
 * - JWT token stored in localStorage (survives page refreshes)
 * - Token automatically included in all API requests via axios interceptor
 * - If token is invalid/expired, backend returns 401, and token is cleared
 * 
 * Security notes:
 * - localStorage is accessible to XSS attacks; in production use httpOnly cookies
 * - Token should have short expiry time (30 minutes default)
 * - Sensitive operations should always verify token with backend
 */

import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../services/api';

// Create context with null as default (context is populated by provider)
const AuthContext = createContext(null);

/**
 * AuthProvider: Wraps entire app to provide auth state and functions.
 * 
 * Should wrap the root of your app:
 *   <AuthProvider>
 *     <App />
 *   </AuthProvider>
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 */
export const AuthProvider = ({ children }) => {
  // Current authenticated user (null if not logged in)
  const [user, setUser] = useState(null);
  
  // Loading state: True while checking if user is already logged in on app startup
  // Prevents rendering authenticated routes before we know auth status
  const [loading, setLoading] = useState(true);

  /**
   * Check authentication status on app startup.
   * 
   * Runs once when component mounts. Checks localStorage for token and loads
   * user info if token exists. This allows users to stay logged in after
   * page refresh.
   */
  useEffect(() => {
    // Try to restore session from localStorage token
    const token = localStorage.getItem('token');
    if (token) {
      // Token exists, load user info from backend
      loadUser();
    } else {
      // No token, user not logged in
      setLoading(false);
    }
  }, []);

  /**
   * Load current user info from backend.
   * 
   * Calls /api/auth/me to get authenticated user details.
   * If call fails, clears the invalid token from localStorage.
   */
  const loadUser = async () => {
    try {
      const response = await authAPI.getCurrentUser();
      setUser(response.data);  // Set user to authenticated state
    } catch (error) {
      // Failed to load user (likely invalid/expired token)
      console.error('Failed to load user:', error);
      localStorage.removeItem('token');  // Clear invalid token
    } finally {
      // Always stop loading after attempting to load user
      setLoading(false);
    }
  };

  /**
   * Authenticate user with email and password.
   * 
   * 1. Call backend /api/auth/login with credentials
   * 2. Save returned JWT token to localStorage
   * 3. Load user info to complete login
   * 
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise} Server response with token
   */
  const login = async (email, password) => {
    const response = await authAPI.login(email, password);
    const { access_token } = response.data;
    
    // Save token for future requests
    localStorage.setItem('token', access_token);
    
    // Load user info (completes login, updates user state)
    await loadUser();
    
    return response.data;
  };

  /**
   * Register new user account.
   * 
   * Creates new user account. Does NOT automatically log in -
   * user must call login() separately after registration.
   * 
   * @param {Object} data - Registration data {email, password, full_name}
   * @returns {Promise} Server response with created user info
   */
  const register = async (data) => {
    const response = await authAPI.register(data);
    return response.data;
  };

  /**
   * Clear authentication and logout user.
   * 
   * - Removes token from localStorage
   * - Sets user to null
   * - Redirecting to login is handled by ProtectedRoute component
   */
  const logout = () => {
    localStorage.removeItem('token');  // Clear token
    setUser(null);  // Clear user state
  };

  // Context value: All auth state and functions provided to consumers
  const value = {
    user,  // Current user object (null if not authenticated)
    loading,  // True while checking initial auth status
    login,  // Function: (email, password) => Promise
    register,  // Function: (data) => Promise
    logout,  // Function: () => void
    isAuthenticated: !!user,  // Convenience boolean flag
  };

  // Provide context to all child components
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * useAuth hook: Access authentication state and functions.
 * 
 * Usage in components:
 *   const { user, login, logout, isAuthenticated } = useAuth();
 *   
 *   if (isAuthenticated) {
 *     return <div>Welcome, {user.full_name}</div>;
 *   }
 * 
 * Must be used inside AuthProvider (in component tree).
 * 
 * @returns {Object} Auth context value {user, loading, login, register, logout, isAuthenticated}
 * @throws Error if used outside AuthProvider
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};