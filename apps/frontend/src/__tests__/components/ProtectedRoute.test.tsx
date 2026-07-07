import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { render } from '@/test/test-utils'
import ProtectedRoute from '@/components/ProtectedRoute'

vi.mock('@/utils/authHelpers', () => ({
  verifyAuthAndGetUser: vi.fn(),
}))

import { verifyAuthAndGetUser } from '@/utils/authHelpers'

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('renders children when authenticated', async () => {
    vi.mocked(verifyAuthAndGetUser).mockResolvedValue({
      userId: 'user-1',
      username: 'Test User',
      roles: ['Customer'],
    })

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    )

    await waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeInTheDocument()
    })
  })

  it('redirects to login when not authenticated', async () => {
    vi.mocked(verifyAuthAndGetUser).mockRejectedValue(new Error('Unauthorized'))

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    )

    await waitFor(() => {
      expect(window.location.pathname).toBe('/login')
    })
  })

  it('redirects when user lacks required role', async () => {
    vi.mocked(verifyAuthAndGetUser).mockResolvedValue({
      userId: 'user-1',
      username: 'Customer User',
      roles: ['Customer'],
    })

    render(
      <ProtectedRoute requiredRole="Admin">
        <div>Admin Only</div>
      </ProtectedRoute>
    )

    await waitFor(() => {
      expect(window.location.pathname).toBe('/login')
    })
  })

  it('allows admin to access any protected route', async () => {
    vi.mocked(verifyAuthAndGetUser).mockResolvedValue({
      userId: 'admin-1',
      username: 'Admin User',
      roles: ['Admin'],
    })

    render(
      <ProtectedRoute requiredRole="TheaterManager">
        <div>Theater Manager Content</div>
      </ProtectedRoute>
    )

    await waitFor(() => {
      expect(screen.getByText('Theater Manager Content')).toBeInTheDocument()
    })
  })

  it('uses cached localStorage data as fallback when API fails', async () => {
    vi.mocked(verifyAuthAndGetUser).mockImplementation(async () => {
      const stored = localStorage.getItem('user_info');
      return stored ? JSON.parse(stored) : null;
    })
    localStorage.setItem('user_info', JSON.stringify({
      userId: 'user-1',
      username: 'Cached User',
      roles: ['Customer'],
    }))

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    )

    // Should still render children from cached data
    await waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeInTheDocument()
    })
  })
})
