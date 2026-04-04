// src/api/publicApi.ts
import { publicAxios } from './axiosClient';
import type { ApiSuccessResponse } from '../types/auth.types';
import type {
    PublicMovieListItem,
    PublicMovieDetail,
    PublicCinemaShowtimes,
    PublicSeatMap,
    PublicPricing,
    PublicGenre,
    ActiveCinema,
    ActiveMovie,
    SearchScheduleResult
} from '../types/public.types';

export const publicApi = {
    /** 1. Get Now Showing Movies */
    getNowShowing: async (params: { keyword?: string; city?: string; pageIndex?: number; pageSize?: number }): Promise<ApiSuccessResponse<PublicMovieListItem[]>> => {
        const response = await publicAxios.get<ApiSuccessResponse<PublicMovieListItem[]>>('/Movies', {
            params: { ...params, status: 'now-showing' }
        });
        return response.data;
    },

    /** 2. Get Coming Soon Movies */
    getComingSoon: async (params: { keyword?: string; city?: string; pageIndex?: number; pageSize?: number }): Promise<ApiSuccessResponse<PublicMovieListItem[]>> => {
        const response = await publicAxios.get<ApiSuccessResponse<PublicMovieListItem[]>>('/Movies', {
            params: { ...params, status: 'coming-soon' }
        });
        return response.data;
    },

    /** 2.1 Get All Movies */
    getAllMovies: async (params: { keyword?: string; city?: string; pageIndex?: number; pageSize?: number }): Promise<ApiSuccessResponse<PublicMovieListItem[]>> => {
        const response = await publicAxios.get<ApiSuccessResponse<PublicMovieListItem[]>>('/Movies', {
            params
        });
        return response.data;
    },

    /** 3. Get Movie Detail */
    getMovieDetail: async (movieId: string): Promise<ApiSuccessResponse<PublicMovieDetail>> => {
        const response = await publicAxios.get<ApiSuccessResponse<PublicMovieDetail>>(`/MovieDetail/${movieId}`);
        return response.data;
    },

    /** 3.1 Get Schedule Dates */
    getScheduleDates: async (movieId: string, city?: string): Promise<ApiSuccessResponse<string[]>> => {
        const response = await publicAxios.get<ApiSuccessResponse<string[]>>(`/ScheduleDates/${movieId}`, {
            params: { city }
        });
        return response.data;
    },

    /** 4. Get Showtimes by Movie and City (and optionally Date) */
    getShowtimes: async (movieId: string, city: string, date?: string): Promise<ApiSuccessResponse<PublicCinemaShowtimes[]>> => {
        const response = await publicAxios.get<ApiSuccessResponse<PublicCinemaShowtimes[]>>(`/ScheduleDetails/${movieId}/${date}`, {
            params: { city }
        });
        return response.data;
    },

    /** 5. Get Active Cinemas */
    getActiveCinemas: async (): Promise<ApiSuccessResponse<ActiveCinema[]>> => {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://localhost:5032' : '');
        const response = await publicAxios.get<ApiSuccessResponse<ActiveCinema[]>>('/movies/active-cinemas', {
            baseURL: `${API_BASE_URL}/api/v1/public`
        });
        return response.data;
    },

    /** 6. Get Active Movies */
    getActiveMovies: async (): Promise<ApiSuccessResponse<ActiveMovie[]>> => {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://localhost:5032' : '');
        const response = await publicAxios.get<ApiSuccessResponse<ActiveMovie[]>>('/movies/active-movies', {
            baseURL: `${API_BASE_URL}/api/v1/public`
        });
        return response.data;
    },

    /** 7. Search Schedules (Advanced Search) */
    searchSchedules: async (date?: string, movieId?: string, cinemaId?: string): Promise<ApiSuccessResponse<SearchScheduleResult[]>> => {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://localhost:5032' : '');
        const response = await publicAxios.get<ApiSuccessResponse<SearchScheduleResult[]>>('/movies/search-schedules', {
            baseURL: `${API_BASE_URL}/api/v1/public`,
            params: { date, movieId, cinemaId }
        });
        return response.data;
    },

    /** 8. Get Seat Map for Schedule */
    getSeatMap: async (scheduleId: string): Promise<ApiSuccessResponse<PublicSeatMap>> => {
        const response = await publicAxios.get<ApiSuccessResponse<PublicSeatMap>>(`/AuditoriumDetails/${scheduleId}`);
        return response.data;
    },

    /** 9. Get Pricing Info */
    getPricing: async (scheduleId: string): Promise<ApiSuccessResponse<PublicPricing>> => {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://localhost:5032' : '');
        const response = await publicAxios.get<ApiSuccessResponse<PublicPricing>>(`/movies/schedules/${scheduleId}/prices`, {
            baseURL: `${API_BASE_URL}/api/v1/public`
        });
        return response.data;
    },

    /** 10. Get Movie Genres */
    getMovieGenres: async (): Promise<ApiSuccessResponse<PublicGenre[]>> => {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://localhost:5032' : '');
        const response = await publicAxios.get<ApiSuccessResponse<PublicGenre[]>>('/movies/genres', { 
            baseURL: `${API_BASE_URL}/api/v1/public` 
        });
        return response.data;
    }
};
