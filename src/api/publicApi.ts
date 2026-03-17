// src/api/publicApi.ts
import { publicAxios } from './axiosClient';
import type { ApiSuccessResponse } from '../types/auth.types';
import type {
    PublicMovieListItem,
    PublicMovieDetail,
    PublicCity,
    PublicCinemaShowtimes,
    PublicSeatMap,
    PublicPricing,
    PublicGenre
} from '../types/public.types';

export const publicApi = {
    /** 1. Get Now Showing Movies */
    getNowShowing: async (): Promise<ApiSuccessResponse<PublicMovieListItem[]>> => {
        const response = await publicAxios.get<ApiSuccessResponse<PublicMovieListItem[]>>('/movies/now-showing');
        return response.data;
    },

    /** 2. Get Coming Soon Movies */
    getComingSoon: async (): Promise<ApiSuccessResponse<PublicMovieListItem[]>> => {
        const response = await publicAxios.get<ApiSuccessResponse<PublicMovieListItem[]>>('/movies/coming-soon');
        return response.data;
    },

    /** 3. Get Movie Detail */
    getMovieDetail: async (movieId: string): Promise<ApiSuccessResponse<PublicMovieDetail>> => {
        const response = await publicAxios.get<ApiSuccessResponse<PublicMovieDetail>>(`/movies/${movieId}`);
        return response.data;
    },

    /** 4. Get Cities */
    getCities: async (): Promise<ApiSuccessResponse<PublicCity[]>> => {
        const response = await publicAxios.get<ApiSuccessResponse<PublicCity[]>>('/movies/cities');
        return response.data;
    },

    /** 5. Get Showtimes by Movie and City (and optionally Date) */
    getShowtimes: async (movieId: string, city: string, date?: string): Promise<ApiSuccessResponse<PublicCinemaShowtimes[]>> => {
        const response = await publicAxios.get<ApiSuccessResponse<PublicCinemaShowtimes[]>>(`/movies/${movieId}/showtimes`, {
            params: { city, date }
        });
        return response.data;
    },

    /** 6. Get Seat Map for Schedule */
    getSeatMap: async (scheduleId: string): Promise<ApiSuccessResponse<PublicSeatMap>> => {
        const response = await publicAxios.get<ApiSuccessResponse<PublicSeatMap>>(`/movies/schedules/${scheduleId}/seats`);
        return response.data;
    },

    /** 7. Get Pricing Info */
    getPricing: async (scheduleId: string): Promise<ApiSuccessResponse<PublicPricing>> => {
        const response = await publicAxios.get<ApiSuccessResponse<PublicPricing>>(`/movies/schedules/${scheduleId}/prices`);
        return response.data;
    },

    /** 8. Get Movie Genres */
    getMovieGenres: async (): Promise<ApiSuccessResponse<PublicGenre[]>> => {
        const response = await publicAxios.get<ApiSuccessResponse<PublicGenre[]>>('/movies/genres');
        return response.data;
    }
};
