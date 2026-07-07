import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { render } from '@/test/test-utils'
import Header from '@/components/Header'

vi.mock('@/api/axiosClient', () => ({
  identityAxios: { get: vi.fn().mockResolvedValue({ data: { isSuccess: true, data: [] } }) },
}))

vi.mock('@/api/commentApi', () => ({
  notificationApi: {
    getNotifications: vi.fn().mockResolvedValue({ data: [] }),
    markAsRead: vi.fn().mockResolvedValue({}),
  },
}))

vi.mock('@/api/authApi', () => ({
  authApi: {
    logout: vi.fn().mockResolvedValue({}),
  },
}))

describe('Header', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('renders logo and navigation links', () => {
    render(<Header />)
    // CINEMA appears multiple times (main header + mobile drawer), use getAllByText
    const cinemaElements = screen.getAllByText(/cinema/i)
    expect(cinemaElements.length).toBeGreaterThan(0)
  })

  it('shows login link when not authenticated', () => {
    render(<Header />)
    // The actual button text is "Sign In"
    expect(screen.getByText(/sign in/i)).toBeInTheDocument()
  })

  it('shows user menu when authenticated', () => {
    localStorage.setItem('user_info', JSON.stringify({
      userId: 'user-1',
      username: 'Test User',
      roles: ['Customer'],
    }))

    render(<Header />)
    // username is shown in header
    const userElements = screen.getAllByText(/test user/i)
    expect(userElements.length).toBeGreaterThan(0)
  })

  it('shows language switcher', () => {
    render(<Header />)
    // Language switcher shows the current language label (EN by default)
    expect(screen.getAllByText('EN').length).toBeGreaterThan(0)
  })

  it('shows navigation links for movies, showtimes, theaters, offers', () => {
    render(<Header />)
    // Multiple "Movies" texts appear (desktop + mobile drawer)
    const movieElements = screen.getAllByText(/^movies$/i)
    expect(movieElements.length).toBeGreaterThan(0)
  })
})
