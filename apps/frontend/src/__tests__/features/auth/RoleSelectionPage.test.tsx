import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '@/test/test-utils'
import RoleSelectionPage from '@/features/auth/RoleSelectionPage'

describe('RoleSelectionPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('renders role cards for multi-role user', () => {
    localStorage.setItem('user_info', JSON.stringify({
      userId: 'user-1',
      username: 'Multi Role User',
      roles: ['Customer', 'Cashier', 'Admin'],
    }))

    render(<RoleSelectionPage />)

    expect(screen.getByText(/customer/i)).toBeInTheDocument()
    expect(screen.getByText(/cashier/i)).toBeInTheDocument()
    expect(screen.getByText(/admin/i)).toBeInTheDocument()
  })

  it('navigates to correct route when role is selected', async () => {
    const user = userEvent.setup()
    localStorage.setItem('user_info', JSON.stringify({
      userId: 'user-1',
      username: 'Multi Role User',
      roles: ['Customer', 'Admin'],
    }))

    render(<RoleSelectionPage />)

    const adminCard = screen.getByText(/admin/i)
    await user.click(adminCard)

    await waitFor(() => {
      expect(window.location.pathname).toBe('/admin')
    })
  })

  it('redirects to login if no user info', () => {
    render(<RoleSelectionPage />)

    expect(window.location.pathname).toBe('/login')
  })
})
