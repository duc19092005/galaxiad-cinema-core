// src/types/public.types.ts

export interface PublicMovieListItem {
    movieId: string;
    movieName: string;
    movieImageUrl: string;
    movieDuration: number;
    startedDate: string;
    movieRequiredAgeSymbol: string;
    movieGenres: string[];
}

export interface PaginatedResponse<T> {
    items: T[];
    totalCount: number;
    pageIndex: number;
    pageSize: number;
    totalPages: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
}

export interface PublicMovieDetail extends PublicMovieListItem {
    trailerUrl: string;
    director: string;
    actors: string;
    movieDescription: string;
}

export interface PublicCity {
    cityName: string;
    cinemaCount: number;
}

export interface PublicShowtime {
    scheduleId: string;
    startTime: string;
    auditoriumNumber: string;
}

export interface PublicFormatShowtimes {
    formatId: string;
    formatName: string;
    showtimes: PublicShowtime[];
}

export interface PublicCinemaShowtimes {
    cinemaId: string;
    cinemaName: string;
    cinemaLocation: string;
    cinemaCity: string;
    formatShowtimes: PublicFormatShowtimes[];
}

export interface PublicSeat {
    seatId: string;
    seatNumber: string;
    colIndex: number;
    rowIndex: number;
    isOccupied: boolean;
}

export interface PublicSeatMap {
    scheduleId: string;
    auditoriumNumber: string;
    movieName: string;
    formatName: string;
    startTime: string;
    seats: PublicSeat[];
}

export interface PublicSegmentPrice {
    userSegmentId: string;
    segmentName: string;
    description: string;
    finalPrice: number;
}

export interface PublicPricing {
    scheduleId: string;
    basePrice: number;
    segmentPrices: PublicSegmentPrice[];
}

export interface PublicGenre {
    genreId: string;
    genreName: string;
    description: string;
}

export interface ActiveCinema {
    cinemaId: string;
    cinemaName: string;
}

export interface ActiveMovie {
    movieId: string;
    movieName: string;
}

export interface SearchScheduleResult {
    movieId: string;
    movieName: string;
    movieImageUrl: string;
    movieRequiredAgeSymbol: string;
    movieGenres: string[];
    cinemas: PublicCinemaShowtimes[];
}
