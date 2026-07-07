import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '@/test/test-utils'
import RoleSelectionPage from '@/features/auth/RoleSelectionPage'

vi.mock('@/api/authApi', () => ({
  authApi: {
    getProfile: vi.fn().mockResolvedValue({
      isSuccess: true,
      data: { username: 'Multi Role User', roles: ['Customer', 'Cashier', 'Admin'] },
    }),
    logout: vi.fn().mockResolvedValue({}),
  },
}))

describe('RoleSelectionPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('renders role cards for multi-role user', async () => {
    localStorage.setItem('user_info', JSON.stringify({
      userId: 'user-1',
      username: 'Multi Role User',
      roles: ['Customer', 'Cashier', 'Admin'],
    }))

    render(<RoleSelectionPage />)

    // Wait for loading to finish (authApi.getProfile resolves)
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /customer/i })).toBeInTheDocument()
    })
    expect(screen.getByRole('heading', { name: /cashier/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /admin/i })).toBeInTheDocument()
  })

  it('navigates to correct route when role is selected', async () => {
    const user = userEvent.setup()
    localStorage.setItem('user_info', JSON.stringify({
      userId: 'user-1',
      username: 'Multi Role User',
      roles: ['Customer', 'Admin'],
    }))

    render(<RoleSelectionPage />)

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /admin/i })).toBeInTheDocument()
    })

    const adminCard = screen.getByRole('heading', { name: /admin/i })
    await user.click(adminCard)

    await waitFor(() => {
      expect(window.location.pathname).toBe('/admin')
    })
  })

  it('redirects to login if no user info', async () => {
    render(<RoleSelectionPage />)

    await waitFor(() => {
      expect(window.location.pathname).toBe('/login')
    })
  })
})
