// src/api/movieApi.ts
import { movieAxios } from './axiosClient';
import type { ApiSuccessResponse } from '../types/auth.types';
import type {
    Movie,
    MovieRequiredAge,
    MovieGenre,
    MoviePeople,
    ExternalMovieSearchItem,
    ExternalMovieCredits,
    ExternalPersonSearchItem,
} from '../types/movie.types';
import type { MovieFormat } from '../types/facilities.types';

export const movieApi = {
    /** GET /api/movieManager/movies */
    getMovieList: async (cinemaId?: string): Promise<ApiSuccessResponse<Movie[]>> => {
        const response = await movieAxios.get<ApiSuccessResponse<Movie[]>>(
            cinemaId ? `/movieManager/movies?cinemaId=${cinemaId}` : '/movieManager/movies'
        );
        return response.data;
    },

    /** GET {API_BASE_URL}/api/v1/Public/MovieFormats */
    getMovieFormats: async (): Promise<ApiSuccessResponse<MovieFormat[]>> => {
        const response = await movieAxios.get<ApiSuccessResponse<MovieFormat[]>>(
            `/v1/Public/MovieFormats`
        );
        return response.data;
    },

    /** GET {API_BASE_URL}/api/v1/Public/MovieRequiredAge */
    getMovieRequiredAges: async (): Promise<ApiSuccessResponse<MovieRequiredAge[]>> => {
        const response = await movieAxios.get<ApiSuccessResponse<MovieRequiredAge[]>>(
            `/v1/Public/MovieRequiredAge`
        );
        return response.data;
    },

    /** GET {API_BASE_URL}/api/v1/public/movies/genres */
    getMovieGenres: async (): Promise<ApiSuccessResponse<MovieGenre[]>> => {
        const response = await movieAxios.get<ApiSuccessResponse<MovieGenre[]>>(
            `/v1/public/movies/genres`
        );
        return response.data;
    },

    /** GET /api/v1/Public/MoviePeople — distinct directors & actors from local catalog (legacy) */
    getMoviePeople: async (): Promise<ApiSuccessResponse<MoviePeople>> => {
        const response = await movieAxios.get<ApiSuccessResponse<MoviePeople>>(
            `/v1/Public/MoviePeople`
        );
        return response.data;
    },

    /** TMDB: search movies by title (external public API via backend proxy) */
    searchExternalMovies: async (q: string): Promise<ApiSuccessResponse<ExternalMovieSearchItem[]>> => {
        const response = await movieAxios.get<ApiSuccessResponse<ExternalMovieSearchItem[]>>(
            `/movieManager/external/movies/search`,
            { params: { q } }
        );
        return response.data;
    },

    /** TMDB: get directors + cast for a movie */
    getExternalMovieCredits: async (tmdbId: number): Promise<ApiSuccessResponse<ExternalMovieCredits>> => {
        const response = await movieAxios.get<ApiSuccessResponse<ExternalMovieCredits>>(
            `/movieManager/external/movies/${tmdbId}/credits`
        );
        return response.data;
    },

    /** TMDB: search people by name (empty q = popular). role: director | actor */
    searchExternalPeople: async (
        q: string,
        role?: 'director' | 'actor'
    ): Promise<ApiSuccessResponse<ExternalPersonSearchItem[]>> => {
        const response = await movieAxios.get<ApiSuccessResponse<ExternalPersonSearchItem[]>>(
            `/movieManager/external/people/search`,
            { params: { q, role } }
        );
        return response.data;
    },

    /** GET /api/movieManager/movies/{id} */
    getMovieDetail: async (movieId: string): Promise<ApiSuccessResponse<Movie>> => {
        const response = await movieAxios.get<ApiSuccessResponse<Movie>>(
            `/movieManager/movies/${movieId}`
        );
        return response.data;
    },

};
