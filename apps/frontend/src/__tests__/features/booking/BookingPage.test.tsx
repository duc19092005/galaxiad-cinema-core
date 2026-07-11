import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { render } from '@/test/test-utils'
import BookingPage from '@/features/booking/BookingPage'

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom') as any
  return {
    ...actual,
    useParams: () => ({ scheduleId: 'schedule-1' }),
  }
})

vi.mock('@/api/bookingApi', () => ({
  bookingApi: {
    lockSeat: vi.fn(),
    unlockSeat: vi.fn(),
    createBooking: vi.fn(),
    lookupCustomerByEmail: vi.fn().mockResolvedValue({ data: null }),
  },
}))

vi.mock('@/api/publicApi', () => ({
  publicApi: {
    getSeatMap: vi.fn(),
    getPricing: vi.fn(),
  },
}))

vi.mock('@/hooks/useSeatWs', () => ({
  useSeatWs: vi.fn(() => ({
    lockSeat: vi.fn().mockResolvedValue(true),
    unlockSeat: vi.fn(),
    lockedSeats: {},
    unavailableSeats: {},
    clientId: 'test-client-id',
  })),
}))

vi.mock('@/api/voucherApi', () => ({
  voucherApi: {
    getMyVouchers: vi.fn().mockResolvedValue({ isSuccess: true, data: [] }),
  },
}))

// Mock Header component to avoid heavy dependencies
vi.mock('@/components/Header', () => ({
  default: () => null,
}))

vi.mock('@/features/socialBooking/CreateGroupBookingModal', () => ({
  default: () => null,
}))

import { publicApi } from '@/api/publicApi'
import { bookingApi } from '@/api/bookingApi'

// Minimal PublicSeatMap data matching the real type
const mockSeatMap = {
  scheduleId: 'schedule-1',
  auditoriumName: 'Hall 1',
  movieName: 'Test Movie',
  movieVisualFormatName: '2D',
  startTime: '2026-07-08T19:00:00',
  seatMap: [
    { seatId: 'a1', seatName: 'A1', coordX: 0, coordY: 0, colIndex: 0, rowIndex: 0, isBooked: false },
    { seatId: 'a2', seatName: 'A2', coordX: 1, coordY: 0, colIndex: 1, rowIndex: 0, isBooked: false },
    { seatId: 'b1', seatName: 'B1', coordX: 0, coordY: 1, colIndex: 0, rowIndex: 1, isBooked: true },
  ],
}

const mockPricing = {
  scheduleId: 'schedule-1',
  basePrice: 90000,
  segmentPrices: [
    {
      userSegmentId: 'seg-adult',
      segmentName: 'Adult',
      description: 'Standard adult pricing',
      basePrice: 90000,
      priceBeforePromotion: 90000,
      promotionAdjustmentAmount: 0,
      finalPrice: 90000,
      appliedPromotions: [],
    },
  ],
  appliedPromotions: [],
}

describe('BookingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.setItem('user_info', JSON.stringify({
      userId: 'user-1',
      username: 'Test User',
      roles: ['Customer'],
    }))
  })

  it('renders seat grid with available and booked seats', async () => {
    vi.mocked(publicApi.getSeatMap).mockResolvedValue({
      isSuccess: true,
      data: mockSeatMap,
    })

    vi.mocked(publicApi.getPricing).mockResolvedValue({
      isSuccess: true,
      data: mockPricing,
    })

    render(<BookingPage />)

    await waitFor(() => {
      // Seats are rendered with their seatName (A1, A2, B1)
      expect(screen.getByText('A1')).toBeInTheDocument()
      expect(screen.getByText('A2')).toBeInTheDocument()
    })
  })

  it('shows ticket type picker and segment pricing from the start', async () => {
    vi.mocked(publicApi.getSeatMap).mockResolvedValue({
      isSuccess: true,
      data: mockSeatMap,
    })

    vi.mocked(publicApi.getPricing).mockResolvedValue({
      isSuccess: true,
      data: mockPricing,
    })

    render(<BookingPage />)

    await waitFor(() => {
      expect(screen.getByText('A1')).toBeInTheDocument()
      // Segment picker shows all ticket types (Adult) with unit price before seat selection
      expect(screen.getByText(/adult/i)).toBeInTheDocument()
      expect(screen.getByText(/select ticket types|chọn loại vé/i)).toBeInTheDocument()
    })
  })

  it('renders proceed to payment button', async () => {
    vi.mocked(publicApi.getSeatMap).mockResolvedValue({
      isSuccess: true,
      data: mockSeatMap,
    })

    vi.mocked(publicApi.getPricing).mockResolvedValue({
      isSuccess: true,
      data: mockPricing,
    })

    render(<BookingPage />)

    await waitFor(() => {
      // "Proceed to Pay" comes from t('booking.proceedToPay')
      expect(screen.getByText(/proceed to pay|thanh toan/i)).toBeInTheDocument()
    })
  })
})
