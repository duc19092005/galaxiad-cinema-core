import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSeatWs } from '@/hooks/useSeatWs'

// Mock SignalR
const handlers: Record<string, (payload: any) => void> = {}
const mockConnection = {
  state: 'Connected',
  start: vi.fn().mockResolvedValue(undefined),
  stop: vi.fn().mockResolvedValue(undefined),
  on: vi.fn((event: string, cb: (payload: any) => void) => {
    handlers[event] = cb
  }),
  off: vi.fn((event: string) => {
    delete handlers[event]
  }),
  invoke: vi.fn().mockResolvedValue({ success: true, lockedSeats: {} }),
  onreconnecting: vi.fn(),
  onreconnected: vi.fn(),
  onclose: vi.fn(),
}

vi.mock('@/api/signalrClient', () => ({
  signalrClient: {
    createSeatConnection: vi.fn(() => mockConnection),
  },
  stopConnection: vi.fn().mockResolvedValue(undefined),
}))

describe('useSeatWs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    for (const key of Object.keys(handlers)) {
      delete handlers[key]
    }
  })

  it('does not create connection when scheduleId is null', () => {
    const { result } = renderHook(() => useSeatWs(null))
    expect(result.current.isConnected).toBe(false)
    expect(result.current.lockedSeats).toEqual({})
    expect(result.current.unavailableSeats).toEqual({})
  })

  it('creates SignalR connection on mount with valid scheduleId', async () => {
    let hookResult: any
    await act(async () => {
      hookResult = renderHook(() => useSeatWs('schedule-123'))
    })

    expect(hookResult.result.current.clientId).toBeDefined()
    expect(mockConnection.start).toHaveBeenCalled()
    expect(mockConnection.on).toHaveBeenCalledWith('initial-state', expect.any(Function))
    expect(mockConnection.on).toHaveBeenCalledWith('seat-locked', expect.any(Function))
    expect(mockConnection.on).toHaveBeenCalledWith('seat-unlocked', expect.any(Function))
    expect(mockConnection.on).toHaveBeenCalledWith('seat-unavailable', expect.any(Function))
  })


  it('handles initial-state event', async () => {
    const { result } = renderHook(() => useSeatWs('schedule-123'))

    await act(async () => {
      handlers['initial-state']?.({ lockedSeats: { A1: 'Alice' } })
    })

    expect(result.current.lockedSeats).toEqual({ a1: 'Alice' })
  })

  it('handles seat-locked and seat-unlocked events', async () => {
    const { result } = renderHook(() => useSeatWs('schedule-123'))

    await act(async () => {
      handlers['seat-locked']?.({ seatId: 'B2', userName: 'Bob' })
    })
    expect(result.current.lockedSeats['b2']).toBe('Bob')

    await act(async () => {
      handlers['seat-unlocked']?.({ seatId: 'B2' })
    })
    expect(result.current.lockedSeats['b2']).toBeUndefined()
  })

  it('handles seat-unavailable event', async () => {
    const { result } = renderHook(() => useSeatWs('schedule-123'))

    await act(async () => {
      handlers['seat-unavailable']?.({ seatId: 'C3' })
    })

    expect(result.current.unavailableSeats['c3']).toBe(true)
    expect(result.current.lockedSeats['c3']).toBeUndefined()
  })

  it('invokes lockSeat successfully', async () => {
    const { result } = renderHook(() => useSeatWs('schedule-123'))

    let success = false
    await act(async () => {
      success = await result.current.lockSeat('D4', 'John')
    })

    expect(success).toBe(true)
    expect(mockConnection.invoke).toHaveBeenCalledWith(
      'lockSeat',
      'schedule-123',
      'D4',
      'John',
      result.current.clientId
    )
  })

  it('invokes unlockSeat successfully', async () => {
    const { result } = renderHook(() => useSeatWs('schedule-123'))

    let success = false
    await act(async () => {
      success = await result.current.unlockSeat('D4')
    })

    expect(success).toBe(true)
    expect(mockConnection.invoke).toHaveBeenCalledWith(
      'unlockSeat',
      'schedule-123',
      'D4',
      result.current.clientId
    )
  })

  it('cleans up connection and handlers on unmount', () => {
    const { unmount } = renderHook(() => useSeatWs('schedule-123'))
    unmount()

    expect(mockConnection.off).toHaveBeenCalledWith('initial-state')
    expect(mockConnection.off).toHaveBeenCalledWith('seat-locked', expect.any(Function))
    expect(mockConnection.off).toHaveBeenCalledWith('seat-unlocked', expect.any(Function))
  })
})

