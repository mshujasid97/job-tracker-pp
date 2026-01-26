/**
 * Tests for Login component.
 *
 * Tests cover:
 * - Component rendering
 * - Form input handling
 * - Form submission
 * - Error display
 * - Navigation after successful login
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import Login from './Login'

// Mock the API module
vi.mock('../../services/api', () => ({
  authAPI: {
    login: vi.fn(),
    getCurrentUser: vi.fn(),
    register: vi.fn(),
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
const mockLogin = vi.fn()
const mockLogout = vi.fn()
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    loading: false,
    login: mockLogin,
    register: vi.fn(),
    logout: mockLogout,
    isAuthenticated: false,
  }),
}))

// Helper to render Login with router
const renderLogin = () => {
  return render(
    <BrowserRouter>
      <Login />
    </BrowserRouter>
  )
}

describe('Login Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  describe('Rendering', () => {
    it('renders login form with all elements', () => {
      renderLogin()

      expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument()
      expect(screen.getByPlaceholderText(/your@email.com/i)).toBeInTheDocument()
      expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument()
      expect(screen.getByText(/don't have an account/i)).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /register/i })).toBeInTheDocument()
    })

    it('renders app title', () => {
      renderLogin()

      expect(screen.getByText(/job tracker by shuja/i)).toBeInTheDocument()
    })

    it('has link to register page', () => {
      renderLogin()

      const registerLink = screen.getByRole('link', { name: /register/i })
      expect(registerLink).toHaveAttribute('href', '/register')
    })
  })

  describe('Form Input', () => {
    it('updates email field on input', async () => {
      const user = userEvent.setup()
      renderLogin()

      const emailInput = screen.getByPlaceholderText(/your@email.com/i)
      await user.type(emailInput, 'test@example.com')

      expect(emailInput).toHaveValue('test@example.com')
    })

    it('updates password field on input', async () => {
      const user = userEvent.setup()
      renderLogin()

      const passwordInput = screen.getByPlaceholderText('••••••••')
      await user.type(passwordInput, 'password123')

      expect(passwordInput).toHaveValue('password123')
    })
  })

  describe('Form Submission', () => {
    it('calls login on form submit', async () => {
      const user = userEvent.setup()
      mockLogin.mockResolvedValueOnce({ access_token: 'test-token' })

      renderLogin()

      await user.type(screen.getByPlaceholderText(/your@email.com/i), 'test@example.com')
      await user.type(screen.getByPlaceholderText('••••••••'), 'password123')
      await user.click(screen.getByRole('button', { name: /login/i }))

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123')
      })
    })

    it('navigates to dashboard on successful login', async () => {
      const user = userEvent.setup()
      mockLogin.mockResolvedValueOnce({ access_token: 'test-token' })

      renderLogin()

      await user.type(screen.getByPlaceholderText(/your@email.com/i), 'test@example.com')
      await user.type(screen.getByPlaceholderText('••••••••'), 'password123')
      await user.click(screen.getByRole('button', { name: /login/i }))

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
      })
    })

    it('shows loading state during login', async () => {
      const user = userEvent.setup()
      let resolveLogin
      mockLogin.mockReturnValueOnce(
        new Promise((resolve) => {
          resolveLogin = resolve
        })
      )

      renderLogin()

      await user.type(screen.getByPlaceholderText(/your@email.com/i), 'test@example.com')
      await user.type(screen.getByPlaceholderText('••••••••'), 'password123')
      await user.click(screen.getByRole('button', { name: /login/i }))

      expect(screen.getByRole('button', { name: /logging in/i })).toBeInTheDocument()
      expect(screen.getByRole('button')).toBeDisabled()

      // Clean up
      resolveLogin({ access_token: 'test-token' })
    })
  })

  describe('Error Handling', () => {
    it('displays error message on login failure', async () => {
      const user = userEvent.setup()
      mockLogin.mockRejectedValueOnce({
        response: { data: { detail: 'Incorrect email or password' } },
      })

      renderLogin()

      await user.type(screen.getByPlaceholderText(/your@email.com/i), 'test@example.com')
      await user.type(screen.getByPlaceholderText('••••••••'), 'wrongpassword')
      await user.click(screen.getByRole('button', { name: /login/i }))

      await waitFor(() => {
        expect(screen.getByText(/incorrect email or password/i)).toBeInTheDocument()
      })
    })

    it('displays generic error when no detail provided', async () => {
      const user = userEvent.setup()
      mockLogin.mockRejectedValueOnce(new Error('Network error'))

      renderLogin()

      await user.type(screen.getByPlaceholderText(/your@email.com/i), 'test@example.com')
      await user.type(screen.getByPlaceholderText('••••••••'), 'password123')
      await user.click(screen.getByRole('button', { name: /login/i }))

      await waitFor(() => {
        expect(screen.getByText(/failed to login/i)).toBeInTheDocument()
      })
    })

    it('clears error when submitting again', async () => {
      const user = userEvent.setup()
      mockLogin
        .mockRejectedValueOnce({
          response: { data: { detail: 'Incorrect email or password' } },
        })
        .mockResolvedValueOnce({ access_token: 'test-token' })

      renderLogin()

      // First attempt - should fail
      await user.type(screen.getByPlaceholderText(/your@email.com/i), 'test@example.com')
      await user.type(screen.getByPlaceholderText('••••••••'), 'wrongpassword')
      await user.click(screen.getByRole('button', { name: /login/i }))

      await waitFor(() => {
        expect(screen.getByText(/incorrect email or password/i)).toBeInTheDocument()
      })

      // Second attempt - should clear error
      await user.clear(screen.getByPlaceholderText('••••••••'))
      await user.type(screen.getByPlaceholderText('••••••••'), 'correctpassword')
      await user.click(screen.getByRole('button', { name: /login/i }))

      await waitFor(() => {
        expect(screen.queryByText(/incorrect email or password/i)).not.toBeInTheDocument()
      })
    })
  })
})