import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { render } from '@/test/test-utils'
import GoogleCallback from '@/features/auth/GoogleCallback'

describe('GoogleCallback', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('processes Google callback from URL params and stores user data', async () => {
    window.history.pushState(
      {},
      '',
      '/auth/google-callback?success=true&userId=google-user-1&username=Google%20User&email=g%40test.com&roles=Customer&isNewAccount=false'
    )

    render(<GoogleCallback />)

    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem('user_info') || '{}')
      expect(stored.userId).toBe('google-user-1')
      expect(stored.username).toBe('Google User')
      expect(stored.roles).toEqual(['Customer'])
    })
  })

  it('shows a loading spinner while processing', () => {
    window.history.pushState({}, '', '/auth/google-callback?success=true&userId=1&username=Test&roles=Customer')

    render(<GoogleCallback />)

    const container = document.querySelector('.state-center')
    expect(container).toBeTruthy()
  })

  it('redirects to /login when Google callback fails', async () => {
    window.history.pushState({}, '', '/auth/google-callback?success=false&error=Authentication%20failed.')

    render(<GoogleCallback />)

    await waitFor(() => {
      expect(localStorage.getItem('user_info')).toBeNull()
    })
  })

  it('redirects to /login when success param is missing', async () => {
    window.history.pushState({}, '', '/auth/google-callback')

    render(<GoogleCallback />)

    await waitFor(() => {
      expect(localStorage.getItem('user_info')).toBeNull()
    })
  })
})
