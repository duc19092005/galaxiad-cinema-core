import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { render } from '@/test/test-utils'
import BookingSuccessPage from '@/features/booking/BookingSuccessPage'

vi.mock('@/api/bookingApi', () => ({
  bookingApi: {
    getTicketInfo: vi.fn(),
  },
}))

import { bookingApi } from '@/api/bookingApi'

describe('BookingSuccessPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('displays ticket details on successful booking', async () => {
    vi.mocked(bookingApi.getTicketInfo).mockResolvedValue({
      isSuccess: true,
      data: {
        orderId: 'order-123',
        customerName: 'Test Customer',
        customerEmail: 'customer@test.com',
        customerPhone: '0912345678',
        customerAddress: '123 Test St',
        movieName: 'Test Movie',
        movieImageUrl: 'https://example.com/movie.jpg',
        cinemaName: 'Test Cinema',
        cinemaAddress: '456 Cinema Rd',
        auditoriumNumber: '1',
        formatName: '2D',
        showTime: '2026-07-08T19:00:00',
        endedTime: '2026-07-08T21:00:00',
        orderDate: '2026-07-07T12:00:00',
        totalPrice: 180000,
        vnPayTransactionId: 'vnpay-txn-123',
        seats: [
          { seatNumber: 'A1', segmentName: 'Adult', priceEach: 90000 },
          { seatNumber: 'A2', segmentName: 'Adult', priceEach: 90000 },
        ],
      },
    })

    window.history.pushState({}, '', '/booking/success?orderId=order-123')

    render(<BookingSuccessPage />)

    await waitFor(() => {
      expect(screen.getByText(/test movie/i)).toBeInTheDocument()
      expect(screen.getByText(/test cinema/i)).toBeInTheDocument()
      // Use getAllByText for A1 or make it specific
      expect(screen.getByText('A1')).toBeInTheDocument()
    })
  })

  it('shows error when ticket fetch fails', async () => {
    vi.mocked(bookingApi.getTicketInfo).mockRejectedValue(new Error('Not found'))

    window.history.pushState({}, '', '/booking/success?orderId=invalid')

    render(<BookingSuccessPage />)

    await waitFor(() => {
      expect(screen.getByText(/unable to load ticket/i)).toBeInTheDocument()
    })
  })

  it('renders download PDF button', async () => {
    vi.mocked(bookingApi.getTicketInfo).mockResolvedValue({
      isSuccess: true,
      data: {
        orderId: 'order-123',
        customerName: 'Test Customer',
        customerEmail: 'customer@test.com',
        customerPhone: '0912345678',
        customerAddress: '123 Test St',
        movieName: 'Test Movie',
        movieImageUrl: 'https://example.com/movie.jpg',
        cinemaName: 'Test Cinema',
        cinemaAddress: '456 Cinema Rd',
        auditoriumNumber: '1',
        formatName: '2D',
        showTime: '2026-07-08T19:00:00',
        endedTime: '2026-07-08T21:00:00',
        orderDate: '2026-07-07T12:00:00',
        totalPrice: 90000,
        vnPayTransactionId: 'vnpay-txn-123',
        seats: [
          { seatNumber: 'A1', segmentName: 'Adult', priceEach: 90000 },
        ],
      },
    })

    window.history.pushState({}, '', '/booking/success?orderId=order-123')

    render(<BookingSuccessPage />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /tải vé pdf|download|pdf/i })).toBeInTheDocument()
    })
  })
})
