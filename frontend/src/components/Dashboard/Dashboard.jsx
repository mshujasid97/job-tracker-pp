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
import { useTheme } from '../../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { analyticsAPI } from '../../services/api';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import ApplicationList from './ApplicationList';
import ApplicationForm from './ApplicationForm';
import './Dashboard.css';

// Status colors for the donut chart
const STATUS_COLORS = {
  applied: '#3498db',
  screening: '#f39c12',
  interview: '#9b59b6',
  offer: '#27ae60',
  accepted: '#1e8449',
  rejected: '#e74c3c',
};

const Dashboard = () => {
  // Auth context
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // Analytics state
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState('');

  // Reminders state
  const [reminders, setReminders] = useState({ upcoming: [], overdue: [] });
  const [loadingReminders, setLoadingReminders] = useState(true);

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
   * Fetch reminders data from backend
   * Called on mount and when refreshTrigger changes
   */
  useEffect(() => {
    const fetchReminders = async () => {
      setLoadingReminders(true);
      try {
        const response = await analyticsAPI.getReminders();
        setReminders(response.data);
      } catch (err) {
        console.error('Error fetching reminders:', err);
        setReminders({ upcoming: [], overdue: [] });
      } finally {
        setLoadingReminders(false);
      }
    };

    fetchReminders();
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
   * Handle application changes (status updates, deletions)
   * Triggers refresh of analytics when ApplicationList makes changes
   */
  const handleRefreshAnalytics = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  // Notification dropdown state
  const [showNotifications, setShowNotifications] = useState(false);

  /**
   * Format success rate for display
   * @param {Number} rate - Success rate from 0-100
   * @returns {String} Formatted percentage
   */
  const formatSuccessRate = (rate) => {
    if (rate === null || rate === undefined) return '0%';
    return `${Math.round(rate)}%`;
  };

  /**
   * Get success rate color class based on percentage
   * @param {Number} rate - Success rate from 0-100
   * @returns {String} CSS class name for color
   */
  const getSuccessRateColor = (rate) => {
    if (rate === null || rate === undefined || rate <= 33) return 'rate-red';
    if (rate <= 66) return 'rate-yellow';
    return 'rate-green';
  };

  // Calculate total notifications count
  const notificationCount = reminders.overdue.length + reminders.upcoming.length;

  return (
    <div className="dashboard">
      {/* Header with title, user info, and action buttons */}
      <header className="dashboard-header">
        <div className="header-left">
          <h1>Job Tracker</h1>
        </div>
        <div className="header-right">
          <span className="user-greeting">Welcome, {user?.full_name}!</span>
          <button
            onClick={toggleTheme}
            className="btn-theme-toggle"
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? '☀️' : '🌙'}
          </button>
          {/* Notification Bell */}
          <div className="notification-wrapper">
            <button
              className="btn-notification"
              onClick={() => setShowNotifications(!showNotifications)}
              title="Notifications"
              aria-label="Notifications"
            >
              🔔
              {notificationCount > 0 && (
                <span className="notification-badge">{notificationCount}</span>
              )}
            </button>
            {showNotifications && (
              <div className="notification-dropdown">
                <div className="notification-header">
                  <h4>Follow-up Reminders</h4>
                  <button
                    className="notification-close"
                    onClick={() => setShowNotifications(false)}
                  >
                    &times;
                  </button>
                </div>
                <div className="notification-content">
                  {notificationCount === 0 ? (
                    <p className="no-notifications">No pending follow-ups</p>
                  ) : (
                    <>
                      {reminders.overdue.length > 0 && (
                        <div className="notification-group">
                          <h5 className="notification-group-title overdue">
                            Overdue ({reminders.overdue.length})
                          </h5>
                          {reminders.overdue.map((reminder) => (
                            <div key={reminder.id} className="notification-item overdue">
                              <div className="notification-item-info">
                                <span className="notification-company">{reminder.company_name}</span>
                                <span className="notification-job">{reminder.job_title}</span>
                              </div>
                              <span className="notification-date">{reminder.follow_up_date}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {reminders.upcoming.length > 0 && (
                        <div className="notification-group">
                          <h5 className="notification-group-title upcoming">
                            Upcoming ({reminders.upcoming.length})
                          </h5>
                          {reminders.upcoming.map((reminder) => (
                            <div key={reminder.id} className="notification-item">
                              <div className="notification-item-info">
                                <span className="notification-company">{reminder.company_name}</span>
                                <span className="notification-job">{reminder.job_title}</span>
                              </div>
                              <span className="notification-date">{reminder.follow_up_date}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
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
        {/* Analytics Section - Two Column Layout */}
        <section className="analytics-section">
          {loadingStats ? (
            <div className="stats-loading">Loading analytics...</div>
          ) : statsError ? (
            <div className="stats-error">{statsError}</div>
          ) : stats ? (
            <div className="analytics-grid">
              {/* Left Column - Donut Chart */}
              <div className="analytics-column chart-column">
                <div className="chart-card">
                  <h3>Status Breakdown</h3>
                  {Object.values(stats.status_breakdown || {}).some(count => count > 0) ? (
                    <div className="chart-container">
                      <ResponsiveContainer width="100%" height={280}>
                        <PieChart>
                          <Pie
                            data={Object.entries(stats.status_breakdown)
                              .filter(([_, count]) => count > 0)
                              .map(([status, count]) => ({
                                name: status.charAt(0).toUpperCase() + status.slice(1),
                                value: count,
                                status: status,
                              }))}
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={100}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            {Object.entries(stats.status_breakdown)
                              .filter(([_, count]) => count > 0)
                              .map(([status]) => (
                                <Cell
                                  key={status}
                                  fill={STATUS_COLORS[status] || '#888'}
                                />
                              ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: isDark ? '#1f2937' : '#ffffff',
                              border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                              borderRadius: '8px',
                              color: isDark ? '#f3f4f6' : '#333333',
                            }}
                            itemStyle={{
                              color: isDark ? '#f3f4f6' : '#333333',
                            }}
                            formatter={(value, name) => [value, name]}
                          />
                          <Legend
                            verticalAlign="bottom"
                            height={36}
                            formatter={(value) => (
                              <span style={{ color: isDark ? '#f3f4f6' : '#333333' }}>{value}</span>
                            )}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="no-chart-data">No applications yet</div>
                  )}
                </div>
              </div>

              {/* Right Column - 2x2 Stats Grid */}
              <div className="analytics-column stats-column">
                <div className="stats-grid-2x2">
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
                    <div className={`stat-value ${getSuccessRateColor(stats.success_rate)}`}>
                      {formatSuccessRate(stats.success_rate)}
                    </div>
                    <div className="stat-label">Success Rate</div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </section>

        {/* Applications List Section */}
        <section className="applications-section">
          <ApplicationList
            onEdit={handleEdit}
            refreshTrigger={refreshTrigger}
            onApplicationChange={handleRefreshAnalytics}
          />
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
