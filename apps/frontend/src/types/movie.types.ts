// src/types/movie.types.ts
export interface MovieCinema {
    cinemaId: string;
    cinemaName: string;
}

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

export interface MovieCoverImage {
    movieCoverImageId: string;
    imageUrl: string;
    sortOrder: number;
    isPrimary: boolean;
    caption?: string | null;
}

export interface MoviePeople {
    directors: string[];
    actors: string[];
}

/** TMDB external movie search hit */
export interface ExternalMovieSearchItem {
    tmdbId: number;
    title: string;
    originalTitle?: string | null;
    releaseDate?: string | null;
    overview?: string | null;
    posterUrl?: string | null;
}

export interface ExternalCastMember {
    tmdbId: number;
    name: string;
    character?: string | null;
    profileUrl?: string | null;
    order: number;
}

export interface ExternalMovieCredits {
    tmdbId: number;
    title: string;
    directors: string[];
    cast: ExternalCastMember[];
}

export interface ExternalPersonSearchItem {
    tmdbId: number;
    name: string;
    knownForDepartment?: string | null;
    profileUrl?: string | null;
    popularity: number;
}

export interface Movie {
    movieId: string;
    movieName: string;
    movieDescriptions: string;
    movieImageUrl: string;
    movieBannerUrl?: string;
    coverImages?: MovieCoverImage[];
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
    movieCinemas: MovieCinema[];
}

/** POST /api/movieManager/movies — multipart/form-data */
export interface CreateMovieFormData {
    movieRequiredAgeId: string;
    movieName: string;
    movieDescription: string;
    movieImage: File;
    movieBanner?: File;
    /** Multiple hero/cover banners */
    movieBanners?: File[];
    endedDate: string; // ISO datetime
    startedDate: string; // ISO datetime
    movieFormatIds: string[];
    movieGenreIds: string[];
    duration: number;
    trailerUrl?: string;
    director?: string;
    actors?: string;
    cinemaIds: string[];
}

/** PUT /api/movieManager/movies/{movieId} — multipart/form-data */
export interface UpdateMovieFormData {
    movieRequiredAgeId?: string;
    movieName?: string;
    movieDescription?: string;
    movieImage?: File;
    movieBanner?: File;
    movieBanners?: File[];
    removeCoverImageIds?: string[];
    endedDate?: string | null;
    startedDate?: string | null;
    movieFormatIds?: string[];
    movieGenreIds?: string[];
    duration?: number;
    trailerUrl?: string;
    director?: string;
    actors?: string;
    cinemaIds?: string[];
}
