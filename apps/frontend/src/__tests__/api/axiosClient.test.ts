import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('axiosClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('exports multiple axios instances', async () => {
    const axiosClient = await import('@/api/axiosClient')

    expect(axiosClient.identityAxios).toBeDefined()
    expect(axiosClient.bookingAxios).toBeDefined()
    expect(axiosClient.publicAxios).toBeDefined()
    expect(axiosClient.movieAxios).toBeDefined()
    expect(axiosClient.facilitiesAxios).toBeDefined()
    expect(axiosClient.theaterAxios).toBeDefined()
    expect(axiosClient.shiftAxios).toBeDefined()
  })

  it('identityAxios has correct base URL', async () => {
    const { identityAxios } = await import('@/api/axiosClient')
    expect(identityAxios.defaults.baseURL).toContain('/api/v1')
  })

  it('bookingAxios has correct base URL', async () => {
    const { bookingAxios } = await import('@/api/axiosClient')
    expect(bookingAxios.defaults.baseURL).toContain('/api/v1/booking')
  })

  it('publicAxios has correct base URL', async () => {
    const { publicAxios } = await import('@/api/axiosClient')
    expect(publicAxios.defaults.baseURL).toContain('/api/v1/Public')
  })

  it('instances have withCredentials enabled', async () => {
    const { identityAxios, bookingAxios } = await import('@/api/axiosClient')
    expect(identityAxios.defaults.withCredentials).toBe(true)
    expect(bookingAxios.defaults.withCredentials).toBe(true)
  })

  it('injects language and authorization headers in request interceptor', async () => {
    const { createApiClient } = await import('@/api/axiosClient')
    const Cookies = (await import('js-cookie')).default
    Cookies.set('X-Access-Token', 'my-test-jwt-token')
    localStorage.setItem('language', 'vi')

    const client = createApiClient('/test')
    // Simulate request interceptor
    const interceptor = (client.interceptors.request as any).handlers[0].fulfilled
    const config = interceptor({ headers: {} })

    expect(config.headers['Accept-Language']).toBe('vi')
    expect(config.headers['X-Language']).toBe('vi')
    expect(config.headers['Authorization']).toBe('Bearer my-test-jwt-token')
    Cookies.remove('X-Access-Token')
  })

  it('clears auth on 401 response', async () => {
    const { createApiClient } = await import('@/api/axiosClient')
    const Cookies = (await import('js-cookie')).default
    Cookies.set('X-Access-Token', 'token-to-be-cleared')
    localStorage.setItem('user_info', JSON.stringify({ userId: '123' }))

    const client = createApiClient('/test')
    const errorHandler = (client.interceptors.response as any).handlers[0].rejected

    const dummyAxiosError = {
      isAxiosError: true,
      response: { status: 401 },
    }

    await expect(errorHandler(dummyAxiosError)).rejects.toBeDefined()
    expect(localStorage.getItem('user_info')).toBeNull()
    expect(Cookies.get('X-Access-Token')).toBeUndefined()
  })
})

