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
    SearchScheduleResult,
    PaginatedResponse
} from '../types/public.types';

export const publicApi = {
    /** 1. Get Now Showing Movies (Paginated) */
    getNowShowing: async (params: { keyword?: string; cinemaId?: string; pageIndex?: number; pageSize?: number }): Promise<ApiSuccessResponse<PaginatedResponse<PublicMovieListItem>>> => {
        const response = await publicAxios.get<ApiSuccessResponse<PaginatedResponse<PublicMovieListItem>>>('/movies/now-showing', {
            params
        });
        return response.data;
    },

    /** 2. Get Coming Soon Movies (Paginated) */
    getComingSoon: async (params: { keyword?: string; cinemaId?: string; pageIndex?: number; pageSize?: number }): Promise<ApiSuccessResponse<PaginatedResponse<PublicMovieListItem>>> => {
        const response = await publicAxios.get<ApiSuccessResponse<PaginatedResponse<PublicMovieListItem>>>('/movies/coming-soon', {
            params
        });
        return response.data;
    },

    /** 3. Get Movie Detail */
    getMovieDetail: async (movieId: string): Promise<ApiSuccessResponse<PublicMovieDetail>> => {
        const response = await publicAxios.get<ApiSuccessResponse<PublicMovieDetail>>(`/movies/${movieId}`);
        return response.data;
    },

    /** 4. Get Showtimes by Movie and City (and optionally Date) */
    getShowtimes: async (movieId: string, city: string, date?: string): Promise<ApiSuccessResponse<PublicCinemaShowtimes[]>> => {
        const response = await publicAxios.get<ApiSuccessResponse<PublicCinemaShowtimes[]>>(`/movies/${movieId}/showtimes`, {
            params: { city, date }
        });
        return response.data;
    },

    /** 5. Get Active Cinemas */
    getActiveCinemas: async (): Promise<ApiSuccessResponse<ActiveCinema[]>> => {
        const response = await publicAxios.get<ApiSuccessResponse<ActiveCinema[]>>('/movies/active-cinemas');
        return response.data;
    },

    /** 6. Get Active Movies */
    getActiveMovies: async (): Promise<ApiSuccessResponse<ActiveMovie[]>> => {
        const response = await publicAxios.get<ApiSuccessResponse<ActiveMovie[]>>('/movies/active-movies');
        return response.data;
    },

    /** 7. Search Schedules (Advanced Search) */
    searchSchedules: async (date?: string, movieId?: string, cinemaId?: string): Promise<ApiSuccessResponse<SearchScheduleResult[]>> => {
        const response = await publicAxios.get<ApiSuccessResponse<SearchScheduleResult[]>>('/movies/search-schedules', {
            params: { date, movieId, cinemaId }
        });
        return response.data;
    },

    /** 8. Get Seat Map for Schedule */
    getSeatMap: async (scheduleId: string): Promise<ApiSuccessResponse<PublicSeatMap>> => {
        const response = await publicAxios.get<ApiSuccessResponse<PublicSeatMap>>(`/movies/schedules/${scheduleId}/seats`);
        return response.data;
    },

    /** 9. Get Pricing Info */
    getPricing: async (scheduleId: string): Promise<ApiSuccessResponse<PublicPricing>> => {
        const response = await publicAxios.get<ApiSuccessResponse<PublicPricing>>(`/movies/schedules/${scheduleId}/prices`);
        return response.data;
    },

    /** 10. Get Movie Genres */
    getMovieGenres: async (): Promise<ApiSuccessResponse<PublicGenre[]>> => {
        const response = await publicAxios.get<ApiSuccessResponse<PublicGenre[]>>('/movies/genres');
        return response.data;
    }
};
