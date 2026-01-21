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
 */

import React, { useState, useEffect } from 'react';
import { applicationsAPI } from '../../services/api';
import './ApplicationList.css';

const ApplicationList = ({ onEdit, refreshTrigger }) => {
  // State management
  const [applications, setApplications] = useState([]); // Array of application objects
  const [loading, setLoading] = useState(true); // Loading state for API calls
  const [error, setError] = useState(''); // Error message display
  const [filters, setFilters] = useState({
    status: '', // Current status filter
    search: '', // Search term for company name
  });

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
   * Fetch applications when component mounts or filters/refresh trigger changes
   * Dependencies: filters, refreshTrigger
   */
  useEffect(() => {
    fetchApplications();
  }, [filters, refreshTrigger]);

  /**
   * Fetches applications from API with current filters
   * Sets loading/error states appropriately
   */
  const fetchApplications = async () => {
    setLoading(true);
    setError('');
    try {
      // Build query parameters from active filters
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.search) params.search = filters.search;

      const response = await applicationsAPI.getAll(params);
      setApplications(response.data);
    } catch (err) {
      setError('Failed to load applications');
      console.error('Error fetching applications:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles application deletion
   * Shows confirmation dialog before deleting
   * Refreshes list after successful deletion
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
      fetchApplications(); // Refresh the list
    } catch (err) {
      alert('Failed to delete application');
      console.error('Error deleting application:', err);
    }
  };

  /**
   * Updates application status without opening edit form
   * Provides quick status transitions
   * 
   * @param {String} id - UUID of application to update
   * @param {String} newStatus - New status value
   */
  const handleStatusChange = async (id, newStatus) => {
    try {
      await applicationsAPI.update(id, { status: newStatus });
      fetchApplications(); // Refresh to show updated status
    } catch (err) {
      alert('Failed to update status');
      console.error('Error updating status:', err);
    }
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
        <input
          type="text"
          placeholder="Search by company..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          className="search-input"
        />
        
        {/* Status filter dropdown */}
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
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