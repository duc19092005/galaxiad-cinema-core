export const testMovie = {
  movieId: 'test-movie-1',
  title: 'E2E Test Movie',
  description: 'A movie used for E2E testing',
  duration: 120,
  genres: ['Action', 'Sci-Fi'],
  posterUrl: 'https://example.com/test-poster.jpg',
  releaseDate: '2026-07-01',
}

export const testCinema = {
  cinemaId: 'test-cinema-1',
  cinemaName: 'E2E Test Cinema',
  city: 'Ho Chi Minh',
  address: '123 Test Street',
}

export const testSchedule = {
  scheduleId: 'test-schedule-1',
  movieId: testMovie.movieId,
  cinemaId: testCinema.cinemaId,
  auditoriumName: 'Hall 1',
  startTime: '2026-07-10T19:00:00',
  movieFormat: '2D',
}
