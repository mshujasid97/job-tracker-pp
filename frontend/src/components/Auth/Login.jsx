/**
 * Login page component for user authentication.
 * 
 * Displays email/password login form. On successful login:
 * - Updates AuthContext with user info
 * - Saves JWT token to localStorage
 * - Redirects to /dashboard
 * 
 * Features:
 * - Form validation (required fields)
 * - Error message display for failed login attempts
 * - Loading state during authentication
 * - Link to register page for new users
 * - Auto-focus on first input (email)
 */

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import './Auth.css';

/**
 * Login component: Email/password authentication form.
 * 
 * @returns {JSX.Element} Login page
 */
const Login = () => {
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // UI state
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Auth and routing
  const { login } = useAuth();
  const navigate = useNavigate();

  /**
   * Handle form submission for login.
   * 
   * - Calls login() from AuthContext with email/password
   * - On success: Redirects to /dashboard
   * - On error: Displays error message to user
   * 
   * @param {React.FormEvent} e - Form submit event
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');  // Clear previous errors
    setLoading(true);

    try {
      // Call login function from AuthContext
      // This calls backend /api/auth/login and updates auth state
      await login(email, password);
      
      // Navigate to dashboard on successful login
      navigate('/dashboard');
    } catch (err) {
      // Display error message from backend or generic message
      setError(err.response?.data?.detail || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Job Tracker by Shuja</h1>
        <h2>Login</h2>
        
        {/* Error message display */}
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          {/* Email input */}
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              autoFocus
            />
          </div>
          
          {/* Password input */}
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          
          {/* Submit button */}
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        {/* Link to register page */}
        <p className="auth-link">
          Don't have an account? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;