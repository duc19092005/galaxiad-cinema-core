// src/types/movie.types.ts

// =============================================
// MOVIE TYPES
// =============================================

export interface MovieRequiredAge {
    movieRequiredAgeSymbolId: string;
    movieRequiredAgeSymbol: string;
    movieRequiredAgeDescription: string;
}

export interface MovieGenre {
    movieGenreId: string;
    movieGenreName: string;
    movieGenreDescription?: string;
}

/** Movie list item / detail (from GET /api/movieManager/movies) */
export interface Movie {
    movieId: string;
    movieName: string;
    movieDescriptions: string;
    movieImageUrl: string;
    endedDate: string; // ISO datetime
    startedDate: string; // ISO datetime
    movieGenresInfos: string[];
    movieVisualFormatInfos: string[];
    updatedAt: string;
    createdAt: string;
    updatedBy: string;
    createdBy: string;
    duration: number; // minutes
    trailerUrl?: string;
    director?: string;
    actors?: string;
    managerId?: string | null;
    managerName?: string | null;
}

/** POST /api/movieManager/movies — multipart/form-data */
export interface CreateMovieFormData {
    movieRequiredAgeId: string;
    movieName: string;
    movieDescription: string;
    movieImage: File;
    endedDate: string; // ISO datetime
    startedDate: string; // ISO datetime
    movieFormatIds: string[];
    movieGenreIds: string[];
    duration: number;
    trailerUrl?: string;
    director?: string;
    actors?: string;
}

/** PUT /api/movieManager/movies/{movieId} — multipart/form-data */
export interface UpdateMovieFormData {
    movieRequiredAgeId?: string;
    movieName?: string;
    movieDescription?: string;
    movieImage?: File;
    endedDate?: string | null;
    startedDate?: string | null;
    movieFormatIds?: string[];
    movieGenreIds?: string[];
    duration?: number;
    trailerUrl?: string;
    director?: string;
    actors?: string;
}
