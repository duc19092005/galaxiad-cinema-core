// src/types/public.types.ts

export interface PublicMovieListItem {
    movieId: string;
    movieName: string;
    movieImageUrl: string;
    movieDescription: string;
    movieDuration: number;
    startedDate: string;
    endedDate: string;
    movieRequiredAgeSymbol: string;
    movieGenres: string[];
    movieFormats: string[];
}

export interface PublicMovieDetail extends PublicMovieListItem {
    trailerUrl: string;
    director: string;
    actors: string;
}

export interface PublicCity {
    cityName: string;
    cinemaCount: number;
}

export interface PublicShowtime {
    scheduleId: string;
    startTime: string;
    endedTime: string;
    auditoriumId: string;
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
