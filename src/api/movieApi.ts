// src/api/movieApi.ts
import { movieAxios } from './axiosClient';
import type { ApiSuccessResponse } from '../types/auth.types';
import type { Movie, MovieRequiredAge, MovieGenre, CreateMovieFormData, UpdateMovieFormData } from '../types/movie.types';
import type { MovieFormat } from '../types/facilities.types';

export const movieApi = {
    /** GET /api/movieManager/movies */
    getMovieList: async (): Promise<ApiSuccessResponse<Movie[]>> => {
        const response = await movieAxios.get<ApiSuccessResponse<Movie[]>>(
            '/movieManager/movies'
        );
        return response.data;
    },

    /** GET http://localhost:5032/MovieFormats */
    getMovieFormats: async (): Promise<ApiSuccessResponse<MovieFormat[]>> => {
        // Fetch using absolute URL
        const response = await movieAxios.get<ApiSuccessResponse<MovieFormat[]>>(
            'http://localhost:5032/MovieFormats'
        );
        return response.data;
    },

    /** GET http://localhost:5032/MovieRequiredAge */
    getMovieRequiredAges: async (): Promise<ApiSuccessResponse<MovieRequiredAge[]>> => {
        const response = await movieAxios.get<ApiSuccessResponse<MovieRequiredAge[]>>(
            'http://localhost:5032/MovieRequiredAge'
        );
        return response.data;
    },

    /** GET http://localhost:5032/MovieGenres */
    getMovieGenres: async (): Promise<ApiSuccessResponse<MovieGenre[]>> => {
        const response = await movieAxios.get<ApiSuccessResponse<MovieGenre[]>>(
            'http://localhost:5032/MovieGenres'
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

    /** POST /api/movieManager/movies (multipart/form-data) */
    createMovie: async (data: CreateMovieFormData): Promise<ApiSuccessResponse> => {
        const formData = new FormData();
        formData.append('movieRequiredAgeId', data.movieRequiredAgeId);
        formData.append('movieName', data.movieName);
        formData.append('movieDescription', data.movieDescription);
        formData.append('movieImage', data.movieImage);
        formData.append('EndedDate', data.endedDate);
        formData.append('StartedDate', data.startedDate);
        formData.append('duration', data.duration.toString());
        if (data.trailerUrl) formData.append('TrailerUrl', data.trailerUrl);
        if (data.director) formData.append('Director', data.director);
        if (data.actors) formData.append('Actors', data.actors);

        // Append arrays
        data.movieFormatIds.forEach((id) => {
            formData.append('movieFormatIds', id);
        });
        data.movieGenreIds.forEach((id) => {
            formData.append('movieGenreIds', id);
        });

        const response = await movieAxios.post<ApiSuccessResponse>(
            '/movieManager/movies',
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        );
        return response.data;
    },

    /** PUT /api/movieManager/movies/{movieId} (multipart/form-data) */
    updateMovie: async (movieId: string, data: UpdateMovieFormData): Promise<ApiSuccessResponse> => {
        const formData = new FormData();

        if (data.movieRequiredAgeId) formData.append('MovieRequiredAgeId', data.movieRequiredAgeId);
        if (data.movieName) formData.append('movieName', data.movieName);
        if (data.movieDescription) formData.append('movieDescription', data.movieDescription);
        if (data.movieImage) formData.append('movieImage', data.movieImage);
        if (data.endedDate) formData.append('EndedDate', data.endedDate);
        if (data.startedDate) formData.append('StartedDate', data.startedDate);
        if (data.duration !== undefined) formData.append('duration', data.duration.toString());
        if (data.trailerUrl) formData.append('TrailerUrl', data.trailerUrl);
        if (data.director) formData.append('Director', data.director);
        if (data.actors) formData.append('Actors', data.actors);

        if (data.movieFormatIds) {
            data.movieFormatIds.forEach((id) => {
                formData.append('movieFormatIds', id);
            });
        }
        if (data.movieGenreIds) {
            data.movieGenreIds.forEach((id) => {
                formData.append('movieGenreIds', id);
            });
        }

        const response = await movieAxios.put<ApiSuccessResponse>(
            `/movieManager/movies/${movieId}`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        );
        return response.data;
    },

    /** DELETE /api/movieManager/movies/{movieId} */
    deleteMovie: async (movieId: string): Promise<ApiSuccessResponse> => {
        const response = await movieAxios.delete<ApiSuccessResponse>(
            `/movieManager/movies/${movieId}`
        );
        return response.data;
    },
};
