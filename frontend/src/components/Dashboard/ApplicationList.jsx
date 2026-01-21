/**
 * ApplicationList Component
 *
 * Displays a grid of job application cards with filtering and search capabilities.
 * Features:
 * - Search applications by company name
 * - Filter by application status
 * - Quick status updates via dropdown
 * - Edit and delete actions
 * - Responsive grid layout
 *
 * @param {Function} onEdit - Callback when user clicks edit button
 * @param {Number} refreshTrigger - Counter to trigger data refresh
 * @param {Function} onApplicationChange - Callback when application is updated/deleted
 */

import { useState, useEffect } from 'react';
import { applicationsAPI } from '../../services/api';
import './ApplicationList.css';

const ApplicationList = ({ onEdit, refreshTrigger, onApplicationChange }) => {
  // State management
  const [applications, setApplications] = useState([]); // Array of application objects
  const [loading, setLoading] = useState(true); // Loading state for API calls
  const [error, setError] = useState(''); // Error message display
  const [searchTerm, setSearchTerm] = useState(''); // Local search input value
  const [activeSearch, setActiveSearch] = useState(''); // Active search term sent to API
  const [filters, setFilters] = useState({
    status: '', // Current status filter
  });
  const [localRefresh, setLocalRefresh] = useState(0); // Local refresh trigger for delete/status changes

  // Color mapping for different application statuses
  const statusColors = {
    applied: '#3498db',    // Blue - Initial application
    screening: '#f39c12',  // Orange - Under review
    interview: '#9b59b6',  // Purple - Interview stage
    offer: '#2ecc71',      // Green - Offer received
    accepted: '#27ae60',   // Dark Green - Offer accepted
    rejected: '#e74c3c',   // Red - Application rejected
  };

  // Human-readable labels for status values
  const statusLabels = {
    applied: 'Applied',
    screening: 'Screening',
    interview: 'Interview',
    offer: 'Offer',
    accepted: 'Accepted',
    rejected: 'Rejected',
  };

  /**
   * Fetch applications when component mounts or filters/refresh triggers change
   */
  useEffect(() => {
    const fetchApplications = async () => {
      setLoading(true);
      setError('');
      try {
        // Build query parameters from active filters
        const params = {};
        if (filters.status) params.status = filters.status;
        if (activeSearch) params.search = activeSearch;

        const response = await applicationsAPI.getAll(params);
        setApplications(response.data);
      } catch (err) {
        setError('Failed to load applications');
        console.error('Error fetching applications:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, [filters.status, activeSearch, refreshTrigger, localRefresh]);

  /**
   * Handles application deletion
   * Shows confirmation dialog before deleting
   * Refreshes list after successful deletion
   * Notifies parent component to refresh analytics
   *
   * @param {String} id - UUID of application to delete
   */
  const handleDelete = async (id) => {
    // Confirm deletion with user
    if (!window.confirm('Are you sure you want to delete this application?')) {
      return;
    }

    try {
      await applicationsAPI.delete(id);
      setLocalRefresh((prev) => prev + 1); // Trigger local refresh
      if (onApplicationChange) {
        onApplicationChange(); // Notify Dashboard to refresh analytics
      }
    } catch (err) {
      alert('Failed to delete application');
      console.error('Error deleting application:', err);
    }
  };

  /**
   * Updates application status without opening edit form
   * Provides quick status transitions
   * Notifies parent component to refresh analytics
   *
   * @param {String} id - UUID of application to update
   * @param {String} newStatus - New status value
   */
  const handleStatusChange = async (id, newStatus) => {
    try {
      await applicationsAPI.update(id, { status: newStatus });
      setLocalRefresh((prev) => prev + 1); // Trigger local refresh
      if (onApplicationChange) {
        onApplicationChange(); // Notify Dashboard to refresh analytics
      }
    } catch (err) {
      alert('Failed to update status');
      console.error('Error updating status:', err);
    }
  };

  /**
   * Handle search button click or Enter key press
   * Triggers search by updating activeSearch state
   */
  const handleSearch = () => {
    setActiveSearch(searchTerm);
  };

  /**
   * Handle Enter key press in search input
   */
  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  /**
   * Clear search
   */
  const handleClearSearch = () => {
    setSearchTerm('');
    setActiveSearch('');
  };

  /**
   * Formats ISO date string to readable format
   * Example: "2025-01-20" → "Jan 20, 2025"
   *
   * @param {String} dateString - ISO date string
   * @returns {String} Formatted date
   */
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Show loading state while fetching data
  if (loading) {
    return <div className="loading">Loading applications...</div>;
  }

  return (
    <div className="application-list">
      {/* Search and Filter Controls */}
      <div className="filters">
        {/* Company name search input */}
        <div className="search-container">
          <input
            type="text"
            placeholder="Search by company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleSearchKeyPress}
            className="search-input"
          />
          <button onClick={handleSearch} className="btn-search">
            Search
          </button>
          {activeSearch && (
            <button onClick={handleClearSearch} className="btn-clear-search">
              Clear
            </button>
          )}
        </div>

        {/* Status filter dropdown */}
        <select
          value={filters.status}
          onChange={(e) => {
            setFilters({ ...filters, status: e.target.value });
            setLocalRefresh((prev) => prev + 1); // Trigger refresh when status changes
          }}
          className="status-filter"
        >
          <option value="">All Statuses</option>
          {Object.entries(statusLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Error message display */}
      {error && <div className="error-message">{error}</div>}

      {/* Empty state when no applications found */}
      {applications.length === 0 ? (
        <div className="no-applications">
          <p>No applications found. Add your first one!</p>
        </div>
      ) : (
        /* Applications grid - responsive layout */
        <div className="applications-grid">
          {applications.map((app) => (
            <div key={app.id} className="application-card">
              {/* Card Header: Company name and status selector */}
              <div className="card-header">
                <h3>{app.company_name}</h3>
                {/* Status dropdown with color coding */}
                <select
                  value={app.status}
                  onChange={(e) => handleStatusChange(app.id, e.target.value)}
                  className="status-select"
                  style={{ backgroundColor: statusColors[app.status] }}
                >
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Card Body: Job details */}
              <div className="card-body">
                <p className="job-title">{app.job_title}</p>
                <p className="date-applied">Applied: {formatDate(app.date_applied)}</p>
                
                {/* Job posting link (if provided) */}
                {app.job_url && (
                  <a
                    href={app.job_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="job-link"
                  >
                    View Job Posting →
                  </a>
                )}

                {/* Notes section (if provided) */}
                {app.notes && (
                  <p className="notes">
                    <strong>Notes:</strong> {app.notes}
                  </p>
                )}
              </div>

              {/* Card Actions: Edit and Delete buttons */}
              <div className="card-actions">
                <button onClick={() => onEdit(app)} className="btn-edit">
                  Edit
                </button>
                <button onClick={() => handleDelete(app.id)} className="btn-delete">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ApplicationList;