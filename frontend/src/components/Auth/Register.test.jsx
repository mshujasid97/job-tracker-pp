/**
 * Tests for Register component.
 *
 * Tests cover:
 * - Component rendering
 * - Form input handling
 * - Password requirements hint
 * - Form submission
 * - Auto-login after registration
 * - Error display
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import Register from './Register'

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
const mockRegister = vi.fn()
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    loading: false,
    login: mockLogin,
    register: mockRegister,
    logout: vi.fn(),
    isAuthenticated: false,
  }),
}))

// Helper to render Register with router
const renderRegister = () => {
  return render(
    <BrowserRouter>
      <Register />
    </BrowserRouter>
  )
}

describe('Register Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  describe('Rendering', () => {
    it('renders registration form with all elements', () => {
      renderRegister()

      expect(screen.getByRole('heading', { name: /create account/i })).toBeInTheDocument()
      expect(screen.getByPlaceholderText(/john doe/i)).toBeInTheDocument()
      expect(screen.getByPlaceholderText(/your@email.com/i)).toBeInTheDocument()
      expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument()
    })

    it('renders app title', () => {
      renderRegister()

      expect(screen.getByText(/job tracker by shuja/i)).toBeInTheDocument()
    })

    it('has link to login page', () => {
      renderRegister()

      const loginLink = screen.getByRole('link', { name: /login/i })
      expect(loginLink).toHaveAttribute('href', '/login')
      expect(screen.getByText(/already have an account/i)).toBeInTheDocument()
    })

    it('shows password requirements hint', () => {
      renderRegister()

      expect(screen.getByText(/min 8 chars/i)).toBeInTheDocument()
    })
  })

  describe('Form Input', () => {
    it('updates full name field on input', async () => {
      const user = userEvent.setup()
      renderRegister()

      const nameInput = screen.getByPlaceholderText(/john doe/i)
      await user.type(nameInput, 'Jane Smith')

      expect(nameInput).toHaveValue('Jane Smith')
    })

    it('updates email field on input', async () => {
      const user = userEvent.setup()
      renderRegister()

      const emailInput = screen.getByPlaceholderText(/your@email.com/i)
      await user.type(emailInput, 'jane@example.com')

      expect(emailInput).toHaveValue('jane@example.com')
    })

    it('updates password field on input', async () => {
      const user = userEvent.setup()
      renderRegister()

      const passwordInput = screen.getByPlaceholderText('••••••••')
      await user.type(passwordInput, 'Password123')

      expect(passwordInput).toHaveValue('Password123')
    })

    it('has password field with minLength of 8', () => {
      renderRegister()

      const passwordInput = screen.getByPlaceholderText('••••••••')
      expect(passwordInput).toHaveAttribute('minLength', '8')
    })
  })

  describe('Form Submission', () => {
    it('calls register and login on form submit', async () => {
      const user = userEvent.setup()
      mockRegister.mockResolvedValueOnce({
        id: '1',
        email: 'john@example.com',
        full_name: 'John Doe',
      })
      mockLogin.mockResolvedValueOnce({ access_token: 'test-token' })

      renderRegister()

      await user.type(screen.getByPlaceholderText(/john doe/i), 'John Doe')
      await user.type(screen.getByPlaceholderText(/your@email.com/i), 'john@example.com')
      await user.type(screen.getByPlaceholderText('••••••••'), 'Password123')
      await user.click(screen.getByRole('button', { name: /register/i }))

      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalledWith({
          email: 'john@example.com',
          password: 'Password123',
          full_name: 'John Doe',
        })
      })

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('john@example.com', 'Password123')
      })
    })

    it('navigates to dashboard on successful registration', async () => {
      const user = userEvent.setup()
      mockRegister.mockResolvedValueOnce({
        id: '1',
        email: 'john@example.com',
        full_name: 'John Doe',
      })
      mockLogin.mockResolvedValueOnce({ access_token: 'test-token' })

      renderRegister()

      await user.type(screen.getByPlaceholderText(/john doe/i), 'John Doe')
      await user.type(screen.getByPlaceholderText(/your@email.com/i), 'john@example.com')
      await user.type(screen.getByPlaceholderText('••••••••'), 'Password123')
      await user.click(screen.getByRole('button', { name: /register/i }))

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
      })
    })

    it('shows loading state during registration', async () => {
      const user = userEvent.setup()
      let resolveRegister
      mockRegister.mockReturnValueOnce(
        new Promise((resolve) => {
          resolveRegister = resolve
        })
      )

      renderRegister()

      await user.type(screen.getByPlaceholderText(/john doe/i), 'John Doe')
      await user.type(screen.getByPlaceholderText(/your@email.com/i), 'john@example.com')
      await user.type(screen.getByPlaceholderText('••••••••'), 'Password123')
      await user.click(screen.getByRole('button', { name: /register/i }))

      expect(screen.getByRole('button', { name: /creating account/i })).toBeInTheDocument()
      expect(screen.getByRole('button')).toBeDisabled()

      // Clean up
      resolveRegister({})
    })
  })

  describe('Error Handling', () => {
    it('displays error message on registration failure', async () => {
      const user = userEvent.setup()
      mockRegister.mockRejectedValueOnce({
        response: { data: { detail: 'Email already registered' } },
      })

      renderRegister()

      await user.type(screen.getByPlaceholderText(/john doe/i), 'John Doe')
      await user.type(screen.getByPlaceholderText(/your@email.com/i), 'existing@example.com')
      await user.type(screen.getByPlaceholderText('••••••••'), 'Password123')
      await user.click(screen.getByRole('button', { name: /register/i }))

      await waitFor(() => {
        expect(screen.getByText(/email already registered/i)).toBeInTheDocument()
      })
    })

    it('displays password validation errors', async () => {
      const user = userEvent.setup()
      mockRegister.mockRejectedValueOnce({
        response: { data: { detail: 'Password must be at least 8 characters long' } },
      })

      renderRegister()

      await user.type(screen.getByPlaceholderText(/john doe/i), 'John Doe')
      await user.type(screen.getByPlaceholderText(/your@email.com/i), 'john@example.com')
      await user.type(screen.getByPlaceholderText('••••••••'), 'weak1234')
      await user.click(screen.getByRole('button', { name: /register/i }))

      await waitFor(() => {
        expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument()
      })
    })

    it('displays generic error when no detail provided', async () => {
      const user = userEvent.setup()
      mockRegister.mockRejectedValueOnce(new Error('Network error'))

      renderRegister()

      await user.type(screen.getByPlaceholderText(/john doe/i), 'John Doe')
      await user.type(screen.getByPlaceholderText(/your@email.com/i), 'john@example.com')
      await user.type(screen.getByPlaceholderText('••••••••'), 'Password123')
      await user.click(screen.getByRole('button', { name: /register/i }))

      await waitFor(() => {
        expect(screen.getByText(/failed to register/i)).toBeInTheDocument()
      })
    })
  })
})