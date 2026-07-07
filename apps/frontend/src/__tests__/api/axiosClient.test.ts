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
})
