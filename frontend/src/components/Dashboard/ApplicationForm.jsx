/**
 * ApplicationForm Component
 *
 * Modal form for creating and editing job applications.
 * Features:
 * - Two modes: create (new application) and edit (modify existing)
 * - Form validation with HTML5 and custom validation
 * - Modal overlay with click-outside-to-close
 * - Loading and error states
 * - Responsive design
 *
 * @param {Boolean} isOpen - Controls modal visibility
 * @param {Function} onClose - Callback when closing modal
 * @param {Function} onSuccess - Callback after successful create/edit
 * @param {Object|null} application - Application data for edit mode, null for create
 * @param {String} mode - 'create' or 'edit'
 */

import React, { useState, useEffect } from 'react';
import { applicationsAPI } from '../../services/api';
import './ApplicationForm.css';

const ApplicationForm = ({ isOpen, onClose, onSuccess, application, mode }) => {
  // Form state with initial values
  const [formData, setFormData] = useState({
    company_name: '',
    job_title: '',
    date_applied: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD
    status: 'applied',
    job_url: '',
    notes: '',
  });

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Status options for dropdown
  const statusOptions = [
    { value: 'applied', label: 'Applied' },
    { value: 'screening', label: 'Screening' },
    { value: 'interview', label: 'Interview' },
    { value: 'offer', label: 'Offer' },
    { value: 'accepted', label: 'Accepted' },
    { value: 'rejected', label: 'Rejected' },
  ];

  /**
   * Initialize form data when modal opens or application changes
   * For edit mode: populate form with application data
   * For create mode: reset to default values
   */
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && application) {
        // Populate form with existing application data
        setFormData({
          company_name: application.company_name || '',
          job_title: application.job_title || '',
          date_applied: application.date_applied || new Date().toISOString().split('T')[0],
          status: application.status || 'applied',
          job_url: application.job_url || '',
          notes: application.notes || '',
        });
      } else {
        // Reset form for create mode
        setFormData({
          company_name: '',
          job_title: '',
          date_applied: new Date().toISOString().split('T')[0],
          status: 'applied',
          job_url: '',
          notes: '',
        });
      }
      setError('');
    }
  }, [isOpen, mode, application]);

  /**
   * Handle input changes
   * Updates formData state as user types
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /**
   * Handle form submission
   * Validates data, calls appropriate API endpoint, handles response
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Client-side validation
      if (!formData.company_name.trim()) {
        throw new Error('Company name is required');
      }
      if (!formData.job_title.trim()) {
        throw new Error('Job title is required');
      }
      if (!formData.date_applied) {
        throw new Error('Date applied is required');
      }

      // Prepare data for API (remove empty optional fields)
      const dataToSubmit = {
        company_name: formData.company_name.trim(),
        job_title: formData.job_title.trim(),
        date_applied: formData.date_applied,
        status: formData.status,
      };

      // Add optional fields only if they have values
      if (formData.job_url.trim()) {
        dataToSubmit.job_url = formData.job_url.trim();
      }
      if (formData.notes.trim()) {
        dataToSubmit.notes = formData.notes.trim();
      }

      // Call appropriate API endpoint based on mode
      if (mode === 'edit' && application) {
        await applicationsAPI.update(application.id, dataToSubmit);
      } else {
        await applicationsAPI.create(dataToSubmit);
      }

      // Success: close modal and notify parent
      setLoading(false);
      onSuccess();
      onClose();
    } catch (err) {
      // Error handling
      setLoading(false);
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to save application';
      setError(errorMessage);
      console.error('Error submitting form:', err);
    }
  };

  /**
   * Handle modal close
   * Resets form state and calls parent's onClose callback
   */
  const handleClose = () => {
    if (loading) return; // Prevent closing during submission
    setError('');
    onClose();
  };

  /**
   * Handle click on overlay background
   * Closes modal when clicking outside the form card
   */
  const handleOverlayClick = (e) => {
    if (e.target.className === 'modal-overlay') {
      handleClose();
    }
  };

  /**
   * Handle Escape key press
   * Closes modal when user presses Escape
   */
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, loading]);

  // Don't render if modal is not open
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-card">
        {/* Modal Header */}
        <div className="modal-header">
          <h2>{mode === 'edit' ? 'Edit Application' : 'Add New Application'}</h2>
          <button
            type="button"
            className="close-button"
            onClick={handleClose}
            disabled={loading}
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        {/* Modal Body - Form */}
        <form onSubmit={handleSubmit} className="application-form">
          {/* Error Message Display */}
          {error && (
            <div className="form-error" role="alert">
              {error}
            </div>
          )}

          {/* Company Name Field */}
          <div className="form-group">
            <label htmlFor="company_name">
              Company Name <span className="required">*</span>
            </label>
            <input
              type="text"
              id="company_name"
              name="company_name"
              value={formData.company_name}
              onChange={handleChange}
              placeholder="e.g., Google, Microsoft, Amazon"
              required
              disabled={loading}
              maxLength={100}
            />
          </div>

          {/* Job Title Field */}
          <div className="form-group">
            <label htmlFor="job_title">
              Job Title <span className="required">*</span>
            </label>
            <input
              type="text"
              id="job_title"
              name="job_title"
              value={formData.job_title}
              onChange={handleChange}
              placeholder="e.g., Senior Software Engineer"
              required
              disabled={loading}
              maxLength={100}
            />
          </div>

          {/* Date Applied Field */}
          <div className="form-group">
            <label htmlFor="date_applied">
              Date Applied <span className="required">*</span>
            </label>
            <input
              type="date"
              id="date_applied"
              name="date_applied"
              value={formData.date_applied}
              onChange={handleChange}
              required
              disabled={loading}
              max={new Date().toISOString().split('T')[0]} // Can't apply in future
            />
          </div>

          {/* Status Field */}
          <div className="form-group">
            <label htmlFor="status">
              Status <span className="required">*</span>
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              required
              disabled={loading}
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Job URL Field (Optional) */}
          <div className="form-group">
            <label htmlFor="job_url">Job Posting URL</label>
            <input
              type="url"
              id="job_url"
              name="job_url"
              value={formData.job_url}
              onChange={handleChange}
              placeholder="https://careers.company.com/job-id"
              disabled={loading}
            />
          </div>

          {/* Notes Field (Optional) */}
          <div className="form-group">
            <label htmlFor="notes">Notes</label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Add any additional notes, interview details, or follow-up information..."
              rows="4"
              disabled={loading}
              maxLength={1000}
            />
          </div>

          {/* Form Actions */}
          <div className="form-actions">
            <button
              type="button"
              className="btn-cancel"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Saving...' : mode === 'edit' ? 'Save Changes' : 'Add Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApplicationForm;
