import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { render } from '@/test/test-utils'
import BookingSuccessPage from '@/features/booking/BookingSuccessPage'

vi.mock('@/api/bookingApi', () => ({
  bookingApi: {
    getTicketData: vi.fn(),
  },
}))

import { bookingApi } from '@/api/bookingApi'

describe('BookingSuccessPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('displays ticket details on successful booking', async () => {
    vi.mocked(bookingApi.getTicketData).mockResolvedValue({
      isSuccess: true,
      data: {
        orderId: 'order-123',
        movieTitle: 'Test Movie',
        cinemaName: 'Test Cinema',
        auditoriumName: 'Hall 1',
        showtime: '2026-07-08T19:00:00',
        seats: ['A1', 'A2'],
        totalPrice: 180000,
        transactionId: 'vnpay-txn-123',
      },
    })

    window.history.pushState({}, '', '/booking/success?orderId=order-123')

    render(<BookingSuccessPage />)

    await waitFor(() => {
      expect(screen.getByText(/order-123|order id/i)).toBeInTheDocument()
      expect(screen.getByText(/test movie/i)).toBeInTheDocument()
      expect(screen.getByText(/180.*000|180,000/i)).toBeInTheDocument()
    })
  })

  it('shows error when ticket fetch fails', async () => {
    vi.mocked(bookingApi.getTicketData).mockRejectedValue(new Error('Not found'))

    window.history.pushState({}, '', '/booking/success?orderId=invalid')

    render(<BookingSuccessPage />)

    await waitFor(() => {
      expect(screen.getByText(/error|not found|failed/i)).toBeInTheDocument()
    })
  })

  it('renders download PDF button', async () => {
    vi.mocked(bookingApi.getTicketData).mockResolvedValue({
      isSuccess: true,
      data: {
        orderId: 'order-123',
        movieTitle: 'Test Movie',
        cinemaName: 'Test Cinema',
        auditoriumName: 'Hall 1',
        seats: ['A1'],
        totalPrice: 90000,
      },
    })

    window.history.pushState({}, '', '/booking/success?orderId=order-123')

    render(<BookingSuccessPage />)

    await waitFor(() => {
      expect(screen.getByText(/download|pdf|tai ve/i)).toBeInTheDocument()
    })
  })
})
