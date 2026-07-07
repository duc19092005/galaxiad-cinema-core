import { http, HttpResponse } from 'msw'

const API_BASE = '/api'

export const handlers = [
  // Identity Access
  http.post(`${API_BASE}/v1/IdentityAccess/regular-register`, () => {
    return HttpResponse.json({
      isSuccess: true,
      message: 'Registration successful',
      data: null,
    })
  }),

  http.post(`${API_BASE}/v1/IdentityAccess/regular-login`, async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string }
    if (body.email === 'test@example.com' && body.password === 'password123') {
      return HttpResponse.json({
        isSuccess: true,
        data: {
          userId: 'user-1',
          username: 'Test User',
          roles: ['Customer'],
          accessToken: 'mock-token',
          managedCinemas: [],
        },
      })
    }
    return HttpResponse.json(
      { isSuccess: false, message: 'Invalid credentials' },
      { status: 401 }
    )
  }),

  http.get(`${API_BASE}/v1/IdentityAccess/get-profile`, () => {
    return HttpResponse.json({
      isSuccess: true,
      data: {
        userId: 'user-1',
        username: 'Test User',
        email: 'test@example.com',
        roles: ['Customer'],
      },
    })
  }),

  http.post(`${API_BASE}/v1/IdentityAccess/Logout`, () => {
    return HttpResponse.json({ message: 'Logged out successfully' })
  }),

  http.get(`${API_BASE}/v1/IdentityAccess/google-login`, () => {
    return HttpResponse.json({
      isSuccess: true,
      data: { redirectUrl: 'https://accounts.google.com/o/oauth2/auth?...' },
    })
  }),

  // Public Movies
  http.get(`${API_BASE}/v1/public/movies/now-showing`, () => {
    return HttpResponse.json({
      isSuccess: true,
      data: {
        items: [
          { movieId: 'movie-1', title: 'Test Movie', posterUrl: 'poster.jpg', duration: 120 },
          { movieId: 'movie-2', title: 'Another Movie', posterUrl: 'poster2.jpg', duration: 95 },
        ],
        totalPages: 1,
        pageIndex: 0,
        pageSize: 10,
        totalItems: 2,
      },
    })
  }),

  http.get(`${API_BASE}/v1/public/movies/coming-soon`, () => {
    return HttpResponse.json({
      isSuccess: true,
      data: {
        items: [{ movieId: 'movie-3', title: 'Upcoming Movie', posterUrl: 'poster3.jpg' }],
        totalPages: 1,
      },
    })
  }),

  http.get(`${API_BASE}/v1/public/movies/cities`, () => {
    return HttpResponse.json({
      isSuccess: true,
      data: ['Ho Chi Minh', 'Ha Noi', 'Da Nang'],
    })
  }),

  http.get(`${API_BASE}/v1/public/movies/genres`, () => {
    return HttpResponse.json({
      isSuccess: true,
      data: [
        { genreId: '1', genreName: 'Action' },
        { genreId: '2', genreName: 'Comedy' },
      ],
    })
  }),

  http.get(`${API_BASE}/v1/public/movies/:movieId`, ({ params }) => {
    return HttpResponse.json({
      isSuccess: true,
      data: {
        movieId: params.movieId,
        title: 'Test Movie',
        description: 'A test movie description',
        duration: 120,
        posterUrl: 'poster.jpg',
        genres: ['Action'],
      },
    })
  }),

  http.get(`${API_BASE}/v1/public/movies/schedules/:scheduleId/seats`, () => {
    return HttpResponse.json({
      isSuccess: true,
      data: {
        rows: [
          { rowLabel: 'A', seats: [{ seatId: 'a1', status: 'available' }, { seatId: 'a2', status: 'available' }] },
          { rowLabel: 'B', seats: [{ seatId: 'b1', status: 'locked' }, { seatId: 'b2', status: 'available' }] },
        ],
      },
    })
  }),

  http.get(`${API_BASE}/v1/public/movies/schedules/:scheduleId/prices`, () => {
    return HttpResponse.json({
      isSuccess: true,
      data: [
        { segmentName: 'Adult', price: 90000 },
        { segmentName: 'Student', price: 70000 },
      ],
    })
  }),

  // Booking
  http.post(`${API_BASE}/v1/booking/create`, () => {
    return HttpResponse.json({
      isSuccess: true,
      data: {
        orderId: 'order-123',
        paymentUrl: 'https://sandbox.vnpayment.vn/...?orderId=order-123',
      },
    })
  }),

  http.get(`${API_BASE}/v1/booking/ticket/:orderId`, ({ params }) => {
    return HttpResponse.json({
      isSuccess: true,
      data: {
        orderId: params.orderId,
        movieTitle: 'Test Movie',
        cinemaName: 'Test Cinema',
        auditoriumName: 'Hall 1',
        showtime: '2026-07-08T19:00:00',
        seats: ['A1', 'A2'],
        totalPrice: 180000,
      },
    })
  }),

  // Admin
  http.get(`${API_BASE}/v1/IdentityAccess/admin/users`, () => {
    return HttpResponse.json({
      isSuccess: true,
      data: {
        items: [
          { userId: 'user-1', username: 'Test User', email: 'test@example.com', roles: ['Customer'] },
        ],
        totalPages: 1,
      },
    })
  }),

  // Vouchers
  http.get(`${API_BASE}/v1/public/vouchers/available-for-user`, () => {
    return HttpResponse.json({
      isSuccess: true,
      data: [
        { voucherId: 'v-1', discountPercent: 10, expiryDate: '2026-12-31' },
      ],
    })
  }),
]
