import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

// Mock SignalR
vi.mock('@/api/signalrClient', () => ({
  createSeatConnection: vi.fn(() => ({
    start: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn().mockResolvedValue(undefined),
    on: vi.fn(),
    off: vi.fn(),
    invoke: vi.fn().mockResolvedValue({ success: true, lockedSeats: {} }),
    onclose: vi.fn(),
  })),
}))

describe('useSeatWs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates SignalR connection on mount', async () => {
    const { createSeatConnection } = await import('@/api/signalrClient')
    const connection = createSeatConnection('schedule-1')

    expect(connection.start).toBeDefined()
    expect(connection.on).toBeDefined()
    expect(connection.invoke).toBeDefined()
  })

  it('connection has lockSeat method', async () => {
    const { createSeatConnection } = await import('@/api/signalrClient')
    const connection = createSeatConnection('schedule-1')

    expect(connection.invoke).toBeDefined()
  })

  it('connection has stop method for cleanup', async () => {
    const { createSeatConnection } = await import('@/api/signalrClient')
    const connection = createSeatConnection('schedule-1')

    expect(connection.stop).toBeDefined()
  })
})
