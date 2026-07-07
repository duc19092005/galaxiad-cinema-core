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

  it('shows error when Google callback fails', async () => {
    vi.mocked(identityAxios.get).mockRejectedValue(new Error('OAuth failed'))

    window.history.pushState({}, '', '/auth/google-callback?code=bad-code&state=bad-state')

    render(<GoogleCallback />)

    await waitFor(() => {
      expect(screen.getByText(/error|failed|loi/i)).toBeInTheDocument()
    })
  })
})
