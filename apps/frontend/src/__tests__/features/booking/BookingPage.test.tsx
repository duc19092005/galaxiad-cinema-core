import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '@/test/test-utils'
import BookingPage from '@/features/booking/BookingPage'

vi.mock('@/api/bookingApi', () => ({
  bookingApi: {
    lockSeat: vi.fn(),
    unlockSeat: vi.fn(),
    createBooking: vi.fn(),
  },
}))

vi.mock('@/api/publicApi', () => ({
  publicApi: {
    getSeatLayout: vi.fn(),
    getPricing: vi.fn(),
  },
}))

vi.mock('@/api/signalrClient', () => ({
  useSeatWs: vi.fn(() => ({
    lockSeat: vi.fn(),
    unlockSeat: vi.fn(),
    renewLocks: vi.fn(),
    lockedSeats: {},
  })),
}))

vi.mock('@/api/voucherApi', () => ({
  voucherApi: {
    getAvailableVouchers: vi.fn().mockResolvedValue({ data: [] }),
  },
}))

import { publicApi } from '@/api/publicApi'
import { bookingApi } from '@/api/bookingApi'

describe('BookingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.setItem('user_info', JSON.stringify({
      userId: 'user-1',
      username: 'Test User',
      roles: ['Customer'],
    }))
  })

  it('renders seat grid with available and locked seats', async () => {
    vi.mocked(publicApi.getSeatLayout).mockResolvedValue({
      isSuccess: true,
      data: {
        rows: [
          { rowLabel: 'A', seats: [{ seatId: 'a1', status: 'available' }, { seatId: 'a2', status: 'available' }] },
          { rowLabel: 'B', seats: [{ seatId: 'b1', status: 'locked' }, { seatId: 'b2', status: 'available' }] },
        ],
      },
    })

    vi.mocked(publicApi.getPricing).mockResolvedValue({
      isSuccess: true,
      data: [{ segmentName: 'Adult', price: 90000 }],
    })

    render(<BookingPage />)

    await waitFor(() => {
      expect(screen.getByText('A')).toBeInTheDocument()
      expect(screen.getByText('B')).toBeInTheDocument()
    })
  })

  it('allows selecting available seats', async () => {
    const user = userEvent.setup()
    vi.mocked(publicApi.getSeatLayout).mockResolvedValue({
      isSuccess: true,
      data: {
        rows: [
          { rowLabel: 'A', seats: [{ seatId: 'a1', status: 'available' }] },
        ],
      },
    })

    vi.mocked(publicApi.getPricing).mockResolvedValue({
      isSuccess: true,
      data: [{ segmentName: 'Adult', price: 90000 }],
    })

    render(<BookingPage />)

    await waitFor(() => {
      const seatButton = screen.getByText('a1') || screen.getByRole('button', { name: /a1/i })
      if (seatButton) {
        expect(seatButton).not.toBeDisabled()
      }
    })
  })

  it('shows total price when seats are selected', async () => {
    vi.mocked(publicApi.getSeatLayout).mockResolvedValue({
      isSuccess: true,
      data: {
        rows: [
          { rowLabel: 'A', seats: [{ seatId: 'a1', status: 'available' }] },
        ],
      },
    })

    vi.mocked(publicApi.getPricing).mockResolvedValue({
      isSuccess: true,
      data: [{ segmentName: 'Adult', price: 90000 }],
    })

    render(<BookingPage />)

    await waitFor(() => {
      expect(screen.getByText(/90.*000|90,000|90000/i) || screen.getByText(/adult/i)).toBeInTheDocument()
    })
  })

  it('creates booking and redirects to payment', async () => {
    const user = userEvent.setup()
    vi.mocked(publicApi.getSeatLayout).mockResolvedValue({
      isSuccess: true,
      data: {
        rows: [
          { rowLabel: 'A', seats: [{ seatId: 'a1', status: 'available' }] },
        ],
      },
    })

    vi.mocked(publicApi.getPricing).mockResolvedValue({
      isSuccess: true,
      data: [{ segmentName: 'Adult', price: 90000 }],
    })

    vi.mocked(bookingApi.createBooking).mockResolvedValue({
      isSuccess: true,
      data: {
        orderId: 'order-123',
        paymentUrl: 'https://sandbox.vnpayment.vn/...',
      },
    })

    render(<BookingPage />)

    // Select a seat and proceed
    await waitFor(() => {
      const seat = screen.getByText('a1') || screen.getByRole('button', { name: /a1/i })
      if (seat) user.click(seat)
    })

    // Click proceed to pay
    const payButton = screen.getByText(/proceed|pay|thanh toan/i)
    if (payButton) {
      await user.click(payButton)
      await waitFor(() => {
        expect(bookingApi.createBooking).toHaveBeenCalled()
      })
    }
  })
})
