import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { render } from '@/test/test-utils';
import CashierSalesPage from '@/features/cashier/CashierSalesPage';

vi.mock('@/api/publicApi', () => ({
  publicApi: {
    searchSchedules: vi.fn().mockResolvedValue({
      isSuccess: true,
      data: [
        {
          movieId: 'mov-1',
          movieName: 'Cashier Test Movie',
          movieImageUrl: 'https://example.com/poster.jpg',
          movieGenres: ['Action'],
          movieRequiredAgeSymbol: 'P',
          movieDuration: 120,
          cinemas: [
            {
              formatShowtimes: [
                {
                  showtimes: [
                    {
                      scheduleId: 'sched-1',
                      startTime: '2026-07-08T19:00:00',
                      auditoriumNumber: 'Room 1',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    }),
    getSeatMap: vi.fn().mockResolvedValue({
      isSuccess: true,
      data: {
        scheduleId: 'sched-1',
        movieName: 'Cashier Test Movie',
        auditoriumName: 'Room 1',
        movieVisualFormatName: '2D',
        startTime: '2026-07-08T19:00:00',
        seatMap: [
          { seatId: 's1', seatName: 'A1', rowIndex: 0, colIndex: 0, isBooked: false },
        ],
      },
    }),
    getPricing: vi.fn().mockResolvedValue({
      isSuccess: true,
      data: {
        segmentPrices: [
          { userSegmentId: 'seg-1', segmentName: 'Adult', finalPrice: 85000 },
        ],
      },
    }),
  },
}));

vi.mock('@/api/bookingApi', () => ({
  bookingApi: {
    lookupCustomerByEmail: vi.fn().mockResolvedValue({ data: null }),
    createBooking: vi.fn().mockResolvedValue({
      data: {
        bookingCode: 'GXD-12345',
        orderId: 'order-1',
        totalPrice: 85000,
        orderDate: '2026-07-08T19:00:00',
      },
    }),
  },
}));

vi.mock('@/api/staffShiftApi', () => ({
  CASHIER_SHIFT_SESSION_KEY: 'cashier_shift_session',
  readCashierShiftSession: vi.fn(() => ({
    staffId: 'staff-1',
    staffName: 'Alice Cashier',
    shiftId: 'shift-1',
    accessToken: 'staff-token',
  })),
  staffShiftApi: {
    clockOut: vi.fn().mockResolvedValue({ isSuccess: true }),
  },
}));

vi.mock('@/hooks/useSeatWs', () => ({
  useSeatWs: vi.fn(() => ({
    lockedSeats: {},
    unavailableSeats: {},
    lockSeat: vi.fn().mockResolvedValue(true),
    unlockSeat: vi.fn().mockResolvedValue(true),
    clientId: 'cashier-client-id',
  })),
}));

describe('CashierSalesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem(
      'user_info',
      JSON.stringify({
        userId: 'cashier-user',
        username: 'Cashier Alice',
        cinemaName: 'Galaxiad Central',
        cinemaId: 'cin-1',
        roles: ['Cashier'],
      })
    );
  });

  it('renders POS terminal header with cashier and cinema info', async () => {
    render(<CashierSalesPage />);

    expect(screen.getByText(/CINEMA POS/i)).toBeInTheDocument();
    expect(screen.getByText(/Alice Cashier/i)).toBeInTheDocument();
    expect(screen.getByText(/Galaxiad Central/i)).toBeInTheDocument();
  });

  it('renders movie schedules list from search query', async () => {
    render(<CashierSalesPage />);

    await waitFor(() => {
      expect(screen.getByText('Cashier Test Movie')).toBeInTheDocument();
    });
  });
});
