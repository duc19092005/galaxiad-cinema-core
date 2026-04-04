// src/types/public.types.ts

export interface PublicMovieListItem {
    isCommingSoon: boolean;
    movieId: string;
    movieName: string;
    moviePosterURL: string;
    movieFormatInfos: string;
    movieDuration: number;
    movieRequiredAge: string;
    movieCategoryInfos: string;
    releaseDate?: string;
    expectedReleaseDate?: string;
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
    trailerUrl?: string;
    director: string;
    actor: string;
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
    cinemaName: string;
    cinemaAddress: string;
    movieFormatName: string;
    scheduleTimesInfos: {
        scheduleId: string;
        showTime: string;
    }[];
}

export interface PublicSeat {
    seatId: string;
    seatName: string;
    coordX: number;
    coordY: number;
    colIndex: number;
    rowIndex: number;
    isBooked: boolean;
}

export interface PublicSeatMap {
    scheduleId: string;
    auditoriumName: string;
    movieName: string;
    movieVisualFormatName: string;
    startTime: string;
    seatMap: PublicSeat[];
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

export interface SearchShowtime {
    scheduleId: string;
    startTime: string;
    endedTime: string;
    auditoriumId: string;
    auditoriumNumber: string;
}

export interface SearchFormatShowtimes {
    formatId: string;
    formatName: string;
    showtimes: SearchShowtime[];
}

export interface SearchCinemaShowtimes {
    cinemaId: string;
    cinemaName: string;
    cinemaLocation: string;
    cinemaCity: string;
    formatShowtimes: SearchFormatShowtimes[];
}

export interface SearchScheduleResult {
    movieId: string;
    movieName: string;
    movieImageUrl: string;
    movieDescription: string;
    movieDuration: number;
    movieRequiredAgeSymbol: string;
    movieGenres: string[];
    cinemas: SearchCinemaShowtimes[];
}
