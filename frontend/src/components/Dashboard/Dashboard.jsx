/**
 * Dashboard component: Main authenticated user interface.
 * 
 * Currently a placeholder showing welcome message and mock statistics.
 * 
 * Planned features (to implement next):
 * - Display list of user's job applications
 * - Create/Edit/Delete application forms
 * - Search and filter applications by status
 * - Archive management UI
 * - Real analytics dashboard with charts
 * - Timeline visualization of applications over time
 * - Status tracking and updates
 * 
 * The component demonstrates proper authentication check and logout functionality.
 */

import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

/**
 * Dashboard component: Authenticated user's main page.
 * 
 * Features:
 * - Displays current user greeting
 * - Logout button
 * - Placeholder for future features
 * 
 * @returns {JSX.Element} Dashboard page
 */
const Dashboard = () => {
  // Get authenticated user and logout function
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  /**
   * Handle logout action.
   * 
   * - Clears auth state (user and token)
   * - Redirects to login page
   */
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="dashboard">
      {/* Header with user greeting and logout button */}
      <header className="dashboard-header">
        <h1>Job Tracker</h1>
        <div className="user-info">
          {/* Display authenticated user's name */}
          <span>Welcome, {user?.full_name}!</span>
          
          {/* Logout button */}
          <button onClick={handleLogout} className="btn-logout">
            Logout
          </button>
        </div>
      </header>

      {/* Main content area */}
      <main className="dashboard-main">
        <div className="welcome-card">
          <h2>🎉 Welcome to Your Job Tracker!</h2>
          <p>Your dashboard is ready. We'll add applications and analytics next!</p>
          
          {/* Mock statistics cards (placeholder)
              TODO: Replace with real data from analytics API */}
          <div className="stats-preview">
            <div className="stat-card">
              <h3>0</h3>
              <p>Total Applications</p>
            </div>
            <div className="stat-card">
              <h3>0</h3>
              <p>This Week</p>
            </div>
            <div className="stat-card">
              <h3>0%</h3>
              <p>Success Rate</p>
            </div>
          </div>
          
          {/* TODO: Future content
              - Application list table
              - Create application form
              - Filter/search UI
              - Status breakdown chart
              - Timeline chart showing applications over time
              - Archive management
          */}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;