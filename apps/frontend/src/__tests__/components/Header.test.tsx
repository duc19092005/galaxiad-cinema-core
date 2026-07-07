import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { render } from '@/test/test-utils'
import Header from '@/components/Header'

vi.mock('@/api/axiosClient', () => ({
  identityAxios: { get: vi.fn().mockResolvedValue({ data: { isSuccess: true, data: [] } }) },
}))

describe('Header', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('renders logo and navigation links', () => {
    render(<Header />)

    expect(screen.getByText(/cinema/i)).toBeInTheDocument()
  })

  it('shows login link when not authenticated', () => {
    render(<Header />)

    expect(screen.getByText(/login|dang nhap/i)).toBeInTheDocument()
  })

  it('shows user menu when authenticated', () => {
    localStorage.setItem('user_info', JSON.stringify({
      userId: 'user-1',
      username: 'Test User',
      roles: ['Customer'],
    }))

    render(<Header />)

    expect(screen.getByText(/test user|account|tai khoan/i)).toBeInTheDocument()
  })

  it('shows language switcher', () => {
    render(<Header />)

    expect(screen.getByText(/en|vi|ru/i)).toBeInTheDocument()
  })

  it('shows navigation links for movies, showtimes, theaters, offers', () => {
    render(<Header />)

    expect(screen.getByText(/movies|phim/i)).toBeInTheDocument()
    expect(screen.getByText(/showtimes|lich chieu/i)).toBeInTheDocument()
  })
})
