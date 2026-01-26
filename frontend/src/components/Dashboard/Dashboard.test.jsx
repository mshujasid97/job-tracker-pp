/**
 * Tests for Dashboard component.
 *
 * Tests cover:
 * - Component rendering
 * - Analytics display
 * - User greeting
 * - Logout functionality
 * - Add application button
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import Dashboard from './Dashboard'

// Mock the API module
vi.mock('../../services/api', () => ({
  authAPI: {
    login: vi.fn(),
    getCurrentUser: vi.fn(),
    register: vi.fn(),
  },
  analyticsAPI: {
    getSummary: vi.fn(),
    getTimeline: vi.fn(),
  },
  applicationsAPI: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    toggleArchive: vi.fn(),
  },
}))

// Mock react-router-dom navigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

// Mock useAuth hook
const mockLogout = vi.fn()
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: '1',
      email: 'test@example.com',
      full_name: 'Test User',
      role: 'user',
    },
    loading: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: mockLogout,
    isAuthenticated: true,
  }),
}))

import { analyticsAPI, applicationsAPI } from '../../services/api'

// Mock analytics data
const mockStats = {
  total_applications: 10,
  applications_this_week: 3,
  applications_this_month: 7,
  success_rate: 20,
  status_breakdown: {
    applied: 5,
    screening: 2,
    interview: 2,
    offer: 1,
    rejected: 0,
  },
}

// Helper to render Dashboard
const renderDashboard = () => {
  return render(
    <BrowserRouter>
      <Dashboard />
    </BrowserRouter>
  )
}

describe('Dashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()

    // Default mock implementations
    analyticsAPI.getSummary.mockResolvedValue({ data: mockStats })
    applicationsAPI.getAll.mockResolvedValue({ data: [] })
  })

  describe('Rendering', () => {
    it('renders dashboard header with title', async () => {
      renderDashboard()

      await waitFor(() => {
        expect(screen.getByText(/job tracker/i)).toBeInTheDocument()
      })
    })

    it('displays user greeting with name', async () => {
      renderDashboard()

      await waitFor(() => {
        expect(screen.getByText(/welcome, test user/i)).toBeInTheDocument()
      })
    })

    it('renders logout button', async () => {
      renderDashboard()

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument()
      })
    })

    it('renders add application button', async () => {
      renderDashboard()

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add application/i })).toBeInTheDocument()
      })
    })
  })

  describe('Analytics Display', () => {
    it('shows loading state while fetching analytics', async () => {
      let resolveAnalytics
      analyticsAPI.getSummary.mockReturnValueOnce(
        new Promise((resolve) => {
          resolveAnalytics = resolve
        })
      )

      renderDashboard()

      expect(screen.getByText(/loading analytics/i)).toBeInTheDocument()

      // Clean up
      resolveAnalytics({ data: mockStats })
    })

    it('displays analytics stats when loaded', async () => {
      renderDashboard()

      await waitFor(() => {
        expect(screen.getByText('10')).toBeInTheDocument()
      })

      expect(screen.getByText('3')).toBeInTheDocument()
      expect(screen.getByText('7')).toBeInTheDocument()
      expect(screen.getByText('20%')).toBeInTheDocument()
    })

    it('displays stat labels', async () => {
      renderDashboard()

      await waitFor(() => {
        expect(screen.getByText(/total applications/i)).toBeInTheDocument()
      })

      expect(screen.getByText(/this week/i)).toBeInTheDocument()
      expect(screen.getByText(/this month/i)).toBeInTheDocument()
      expect(screen.getByText(/success rate/i)).toBeInTheDocument()
    })

    it('displays status breakdown', async () => {
      renderDashboard()

      await waitFor(() => {
        expect(screen.getByText(/status breakdown/i)).toBeInTheDocument()
      })

      expect(screen.getByText('applied')).toBeInTheDocument()
    })

    it('displays error when analytics fetch fails', async () => {
      analyticsAPI.getSummary.mockRejectedValueOnce(new Error('API Error'))

      renderDashboard()

      await waitFor(() => {
        expect(screen.getByText(/failed to load analytics/i)).toBeInTheDocument()
      })
    })
  })

  describe('User Interactions', () => {
    it('navigates to login on logout', async () => {
      const user = userEvent.setup()
      renderDashboard()

      await waitFor(() => {
        expect(screen.getByText(/welcome/i)).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /logout/i }))

      expect(mockNavigate).toHaveBeenCalledWith('/login')
    })

    it('opens form modal when clicking add application', async () => {
      const user = userEvent.setup()
      renderDashboard()

      await waitFor(() => {
        expect(screen.getByText(/welcome/i)).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /add application/i }))

      await waitFor(() => {
        expect(screen.getByText(/add new application/i)).toBeInTheDocument()
      })
    })
  })

  describe('Analytics Edge Cases', () => {
    it('handles zero success rate', async () => {
      analyticsAPI.getSummary.mockResolvedValueOnce({
        data: { ...mockStats, success_rate: 0 },
      })

      renderDashboard()

      await waitFor(() => {
        expect(screen.getByText('0%')).toBeInTheDocument()
      })
    })

    it('handles null success rate', async () => {
      analyticsAPI.getSummary.mockResolvedValueOnce({
        data: { ...mockStats, success_rate: null },
      })

      renderDashboard()

      await waitFor(() => {
        expect(screen.getByText('0%')).toBeInTheDocument()
      })
    })

    it('handles empty status breakdown', async () => {
      analyticsAPI.getSummary.mockResolvedValueOnce({
        data: { ...mockStats, status_breakdown: {} },
      })

      renderDashboard()

      await waitFor(() => {
        expect(screen.getByText(/total applications/i)).toBeInTheDocument()
      })
    })
  })
})