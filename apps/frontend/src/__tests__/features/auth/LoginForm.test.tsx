import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '@/test/test-utils'
import LoginForm from '@/features/auth/LoginForm'

// Mock the authApi
vi.mock('@/api/authApi', () => ({
  authApi: {
    regularLogin: vi.fn(),
  },
}))

// Mock the identityAxios
vi.mock('@/api/axiosClient', () => ({
  identityAxios: {
    get: vi.fn(),
  },
}))

import { authApi } from '@/api/authApi'

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('renders login form with email and password fields', () => {
    render(<LoginForm />)

    expect(screen.getByPlaceholderText('name@cinema.com')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /login|sign in/i })).toBeInTheDocument()
  })

  it('renders Google login button', () => {
    render(<LoginForm />)

    expect(screen.getByText(/google/i)).toBeInTheDocument()
  })

  it('renders register link', () => {
    render(<LoginForm />)

    expect(screen.getByText(/register now|dang ky/i)).toBeInTheDocument()
  })

  it('shows error message on invalid credentials', async () => {
    const user = userEvent.setup()
    vi.mocked(authApi.regularLogin).mockResolvedValue({
      isSuccess: false,
      data: null,
      message: 'Invalid credentials',
    })

    render(<LoginForm />)

    await user.type(screen.getByPlaceholderText('name@cinema.com'), 'wrong@test.com')
    await user.type(screen.getByPlaceholderText('••••••••'), 'wrongpassword')
    await user.click(screen.getByRole('button', { name: /login|sign in/i }))

    await waitFor(() => {
      expect(screen.getByText(/invalid|login failed|error/i)).toBeInTheDocument()
    })
  })

  it('shows error on network failure', async () => {
    const user = userEvent.setup()
    vi.mocked(authApi.regularLogin).mockRejectedValue({
      isAxiosError: true,
      request: {},
    })

    render(<LoginForm />)

    await user.type(screen.getByPlaceholderText('name@cinema.com'), 'test@test.com')
    await user.type(screen.getByPlaceholderText('••••••••'), 'password123')
    await user.click(screen.getByRole('button', { name: /login|sign in/i }))

    await waitFor(() => {
      expect(screen.getByText(/cannot connect|unable to connect|error/i)).toBeInTheDocument()
    })
  })

  it('stores user info in localStorage on successful login', async () => {
    const user = userEvent.setup()
    const mockData = {
      userId: 'user-1',
      username: 'Test User',
      roles: ['Customer'],
      accessToken: 'token-123',
    }

    vi.mocked(authApi.regularLogin).mockResolvedValue({
      isSuccess: true,
      data: mockData,
    })

    render(<LoginForm />)

    await user.type(screen.getByPlaceholderText('name@cinema.com'), 'test@test.com')
    await user.type(screen.getByPlaceholderText('••••••••'), 'password123')
    await user.click(screen.getByRole('button', { name: /login|sign in/i }))

    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem('user_info') || '{}')
      expect(stored.userId).toBe('user-1')
      expect(stored.username).toBe('Test User')
    })
  })

  it('redirects single-role user to correct dashboard', async () => {
    const user = userEvent.setup()
    vi.mocked(authApi.regularLogin).mockResolvedValue({
      isSuccess: true,
      data: {
        userId: 'user-1',
        username: 'Admin User',
        roles: ['Admin'],
        accessToken: 'token-123',
      },
    })

    render(<LoginForm />)

    await user.type(screen.getByPlaceholderText('name@cinema.com'), 'admin@test.com')
    await user.type(screen.getByPlaceholderText('••••••••'), 'password123')
    await user.click(screen.getByRole('button', { name: /login|sign in/i }))

    await waitFor(() => {
      expect(window.location.pathname).toBe('/admin')
    })
  })

  it('redirects multi-role user to role selection', async () => {
    const user = userEvent.setup()
    vi.mocked(authApi.regularLogin).mockResolvedValue({
      isSuccess: true,
      data: {
        userId: 'user-1',
        username: 'Multi Role User',
        roles: ['Customer', 'Cashier'],
        accessToken: 'token-123',
      },
    })

    render(<LoginForm />)

    await user.type(screen.getByPlaceholderText('name@cinema.com'), 'multi@test.com')
    await user.type(screen.getByPlaceholderText('••••••••'), 'password123')
    await user.click(screen.getByRole('button', { name: /login|sign in/i }))

    await waitFor(() => {
      expect(window.location.pathname).toBe('/role-selection')
    })
  })

  it('disables submit button while loading', async () => {
    const user = userEvent.setup()
    vi.mocked(authApi.regularLogin).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    )

    render(<LoginForm />)

    await user.type(screen.getByPlaceholderText('name@cinema.com'), 'test@test.com')
    await user.type(screen.getByPlaceholderText('••••••••'), 'password123')
    await user.click(screen.getByRole('button', { name: /login|sign in/i }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /signing in|loading/i })).toBeDisabled()
    })
  })

  it('toggles password visibility', async () => {
    const user = userEvent.setup()
    render(<LoginForm />)

    const passwordInput = screen.getByPlaceholderText('••••••••')
    expect(passwordInput).toHaveAttribute('type', 'password')

    // Click the eye icon button
    const toggleButton = screen.getByRole('button', { name: '' }) // Eye icon button
    await user.click(toggleButton)

    expect(passwordInput).toHaveAttribute('type', 'text')
  })
})
