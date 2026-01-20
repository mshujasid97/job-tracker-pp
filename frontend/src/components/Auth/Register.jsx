/**
 * Registration page component for creating new user accounts.
 * 
 * Displays form for new user signup with:
 * - Full name, email, password fields
 * - Form validation
 * - Auto-login after successful registration (auto sign in the new user)
 * - Redirect to dashboard after registration
 * - Error message display
 * - Link to login page for existing users
 * 
 * After successful registration, the component automatically logs in the new user
 * and redirects to the dashboard for immediate access.
 */

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import './Auth.css';

/**
 * Register component: New user account creation form.
 * 
 * @returns {JSX.Element} Registration page
 */
const Register = () => {
  // Form state: Collected into object for easier management
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
  });
  
  // UI state
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Auth and routing
  const { register, login } = useAuth();
  const navigate = useNavigate();

  /**
   * Handle form input changes.
   * 
   * Updates formData object with the changed field value.
   * Uses dynamic key from input name attribute.
   * 
   * @param {React.ChangeEvent} e - Input change event
   */
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  /**
   * Handle form submission for registration.
   * 
   * 1. Call register() to create new account
   * 2. Auto-login with the same credentials
   * 3. Redirect to dashboard
   * 
   * Benefits of auto-login: Better UX - users don't need to login after registering
   * 
   * @param {React.FormEvent} e - Form submit event
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');  // Clear previous errors
    setLoading(true);

    try {
      // Step 1: Create new user account
      await register(formData);
      
      // Step 2: Automatically login the new user
      // This saves the token to localStorage and updates AuthContext
      await login(formData.email, formData.password);
      
      // Step 3: Navigate to dashboard
      navigate('/dashboard');
    } catch (err) {
      // Display error message from backend or generic message
      // Common errors: "Email already registered", "Password too weak", etc.
      setError(err.response?.data?.detail || 'Failed to register');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Job Tracker by Shuja</h1>
        <h2>Create Account</h2>
        
        {/* Error message display */}
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          {/* Full name input */}
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              placeholder="John Doe"
              required
              autoFocus
            />
          </div>
          
          {/* Email input */}
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="your@email.com"
              required
            />
          </div>
          
          {/* Password input */}
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
              minLength="6"
            />
          </div>
          
          {/* Submit button */}
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>
        
        {/* Link to login page */}
        <p className="auth-link">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;