/**
 * Dashboard Component
 *
 * Main authenticated user interface showing job applications and analytics.
 *
 * Features:
 * - Real-time analytics dashboard with statistics
 * - Application list with search and filter
 * - Create and edit application forms
 * - Delete and status update functionality
 * - Responsive design
 *
 * @returns {JSX.Element} Dashboard page
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { analyticsAPI } from '../../services/api';
import ApplicationList from './ApplicationList';
import ApplicationForm from './ApplicationForm';
import './Dashboard.css';

const Dashboard = () => {
  // Auth context
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Analytics state
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState('');

  // Application form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('create'); // 'create' or 'edit'
  const [editingApplication, setEditingApplication] = useState(null);

  // Refresh trigger - increment this to refresh both analytics and application list
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  /**
   * Fetch analytics data from backend
   * Called on mount and when refreshTrigger changes
   */
  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoadingStats(true);
      setStatsError('');
      try {
        const response = await analyticsAPI.getSummary();
        setStats(response.data);
      } catch (err) {
        setStatsError('Failed to load analytics');
        console.error('Error fetching analytics:', err);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchAnalytics();
  }, [refreshTrigger]);

  /**
   * Handle logout action
   * Clears auth state and redirects to login
   */
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  /**
   * Open form in create mode
   */
  const handleCreateClick = () => {
    setFormMode('create');
    setEditingApplication(null);
    setIsFormOpen(true);
  };

  /**
   * Open form in edit mode with selected application
   * @param {Object} application - Application to edit
   */
  const handleEdit = (application) => {
    setFormMode('edit');
    setEditingApplication(application);
    setIsFormOpen(true);
  };

  /**
   * Close form and reset state
   */
  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingApplication(null);
  };

  /**
   * Handle successful form submission
   * Closes form and triggers refresh of analytics and application list
   */
  const handleFormSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  /**
   * Format success rate for display
   * @param {Number} rate - Success rate from 0-100
   * @returns {String} Formatted percentage
   */
  const formatSuccessRate = (rate) => {
    if (rate === null || rate === undefined) return '0%';
    return `${Math.round(rate)}%`;
  };

  return (
    <div className="dashboard">
      {/* Header with title, user info, and action buttons */}
      <header className="dashboard-header">
        <div className="header-left">
          <h1>Job Tracker</h1>
        </div>
        <div className="header-right">
          <span className="user-greeting">Welcome, {user?.full_name}!</span>
          <button onClick={handleCreateClick} className="btn-add-application">
            + Add Application
          </button>
          <button onClick={handleLogout} className="btn-logout">
            Logout
          </button>
        </div>
      </header>

      {/* Main content area */}
      <main className="dashboard-main">
        {/* Analytics Section */}
        <section className="analytics-section">
          {loadingStats ? (
            <div className="stats-loading">Loading analytics...</div>
          ) : statsError ? (
            <div className="stats-error">{statsError}</div>
          ) : stats ? (
            <div className="stats-grid">
              {/* Total Applications Card */}
              <div className="stat-card">
                <div className="stat-value">{stats.total_applications || 0}</div>
                <div className="stat-label">Total Applications</div>
              </div>

              {/* This Week Card */}
              <div className="stat-card">
                <div className="stat-value">{stats.applications_this_week || 0}</div>
                <div className="stat-label">This Week</div>
              </div>

              {/* This Month Card */}
              <div className="stat-card">
                <div className="stat-value">{stats.applications_this_month || 0}</div>
                <div className="stat-label">This Month</div>
              </div>

              {/* Success Rate Card */}
              <div className="stat-card">
                <div className="stat-value">{formatSuccessRate(stats.success_rate)}</div>
                <div className="stat-label">Success Rate</div>
              </div>
            </div>
          ) : null}

          {/* Status Breakdown (if available) */}
          {stats?.status_breakdown && (
            <div className="status-breakdown">
              <h3>Status Breakdown</h3>
              <div className="status-chips">
                {Object.entries(stats.status_breakdown).map(([status, count]) => (
                  count > 0 && (
                    <div key={status} className={`status-chip status-${status}`}>
                      <span className="status-name">{status}</span>
                      <span className="status-count">{count}</span>
                    </div>
                  )
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Applications List Section */}
        <section className="applications-section">
          <ApplicationList onEdit={handleEdit} refreshTrigger={refreshTrigger} />
        </section>
      </main>

      {/* Application Form Modal */}
      <ApplicationForm
        isOpen={isFormOpen}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
        application={editingApplication}
        mode={formMode}
      />
    </div>
  );
};

export default Dashboard;
