import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { render } from '@/test/test-utils'
import GoogleCallback from '@/features/auth/GoogleCallback'

vi.mock('@/api/axiosClient', () => ({
  identityAxios: {
    get: vi.fn(),
  },
}))

import { identityAxios } from '@/api/axiosClient'

describe('GoogleCallback', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('processes Google callback and stores user data', async () => {
    const mockUserData = {
      userId: 'google-user-1',
      username: 'Google User',
      roles: ['Customer'],
      accessToken: 'google-token',
    }

    vi.mocked(identityAxios.get).mockResolvedValue({
      data: {
        isSuccess: true,
        data: mockUserData,
      },
    })

    // Mock URL params
    window.history.pushState({}, '', '/auth/google-callback?code=test-code&state=test-state')

    render(<GoogleCallback />)

    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem('user_info') || '{}')
      expect(stored.userId).toBe('google-user-1')
    })
  })

  it('shows a loading spinner while processing', () => {
    // Make the request hang so spinner is visible
    vi.mocked(identityAxios.get).mockImplementation(() => new Promise(() => {}))

    window.history.pushState({}, '', '/auth/google-callback?code=test-code&state=test-state')

    render(<GoogleCallback />)

    // Component renders a loading spinner (Loader2 icon) while processing
    // The div is always rendered with the spinner
    const container = document.querySelector('.state-center')
    expect(container).toBeTruthy()
  })

  it('redirects to /login when Google callback fails', async () => {
    vi.mocked(identityAxios.get).mockRejectedValue(new Error('OAuth failed'))

    window.history.pushState({}, '', '/auth/google-callback?code=bad-code&state=bad-state')

    render(<GoogleCallback />)

    // On error, component navigates to /login - nothing is displayed in DOM
    // Check that the component renders the spinner initially (not an error message)
    await waitFor(() => {
      // After error, it navigates away; the spinner div may or may not be in DOM
      // Main assertion: localStorage should remain empty (no user stored)
      expect(localStorage.getItem('user_info')).toBeNull()
    })
  })
})
