// src/api/publicApi.ts
import { publicAxios, shiftAxios } from './axiosClient';
import type { ApiSuccessResponse } from '../types/auth.types';
import type {
    PublicMovieListItem,
    PublicMovieDetail,
    PublicCinemaShowtimes,
    PublicSeatMap,
    PublicPricing,
    PublicPromotion,
    PublicGenre,
    ActiveCinema,
    ActiveMovie,
    SearchScheduleResult,
    NearestCinema,
    PublicPersonDetail,
    PaginatedResponse,
} from '../types/public.types';

/** Movie row from /api/v1/public/movies/now-showing|coming-soon */
export interface PublicMovieSearchItem {
    movieId: string;
    movieName: string;
    movieImageUrl: string;
    movieDescription: string;
    movieDuration: number;
    startedDate?: string;
    endedDate?: string;
    movieRequiredAgeSymbol?: string;
    movieGenres?: string[];
    movieFormats?: string[];
}

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

    /**
     * Paged movie search (rate-limited PublicReadPolicy on backend).
     * GET /api/v1/public/movies/now-showing|coming-soon
     */
    searchMoviesPaged: async (params: {
        keyword?: string;
        status?: 'now-showing' | 'coming-soon';
        pageIndex?: number;
        pageSize?: number;
    }): Promise<ApiSuccessResponse<PaginatedResponse<PublicMovieSearchItem>>> => {
        const status = params.status || 'now-showing';
        const path = status === 'coming-soon'
            ? '/public/movies/coming-soon'
            : '/public/movies/now-showing';
        const response = await shiftAxios.get<ApiSuccessResponse<{
            items: PublicMovieSearchItem[];
            totalCount: number;
            pageIndex: number;
            pageSize: number;
            totalPages: number;
            hasPreviousPage: boolean;
            hasNextPage: boolean;
        }>>(path, {
            params: {
                keyword: params.keyword || undefined,
                pageIndex: params.pageIndex ?? 1,
                pageSize: params.pageSize ?? 5,
            },
        });
        const body: any = response.data;
        const data = body?.data ?? body?.Data;
        const raw: any = data || {};
        const rawItems: any[] = raw.items ?? raw.Items ?? [];
        const items: PublicMovieSearchItem[] = rawItems.map((m) => ({
            movieId: String(m.movieId ?? m.MovieId ?? ''),
            movieName: m.movieName ?? m.MovieName ?? '',
            movieImageUrl: m.movieImageUrl ?? m.MovieImageUrl ?? '',
            movieDescription: m.movieDescription ?? m.MovieDescription ?? '',
            movieDuration: m.movieDuration ?? m.MovieDuration ?? 0,
            startedDate: m.startedDate ?? m.StartedDate,
            endedDate: m.endedDate ?? m.EndedDate,
            movieRequiredAgeSymbol: m.movieRequiredAgeSymbol ?? m.MovieRequiredAgeSymbol ?? '',
            movieGenres: m.movieGenres ?? m.MovieGenres ?? [],
            movieFormats: m.movieFormats ?? m.MovieFormats ?? [],
        }));
        return {
            isSuccess: body?.isSuccess ?? body?.IsSuccess ?? true,
            message: body?.message ?? body?.Message ?? '',
            data: {
                items,
                totalCount: raw.totalCount ?? raw.TotalCount ?? items.length,
                pageIndex: raw.pageIndex ?? raw.PageIndex ?? params.pageIndex ?? 1,
                pageSize: raw.pageSize ?? raw.PageSize ?? params.pageSize ?? 5,
                totalPages: raw.totalPages ?? raw.TotalPages ?? 1,
                hasPreviousPage: raw.hasPreviousPage ?? raw.HasPreviousPage ?? false,
                hasNextPage: raw.hasNextPage ?? raw.HasNextPage ?? false,
            },
        };
    },

    /** 2.1 Get All Movies */
    getAllMovies: async (params: { keyword?: string; city?: string; cinemaId?: string; pageIndex?: number; pageSize?: number }): Promise<ApiSuccessResponse<PublicMovieListItem[]>> => {
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

    /**
     * Actor/director detail. Movies come from internal catalog only (paginated).
     * role: actor | director
     */
    getPersonDetail: async (params: {
        name: string;
        role: 'actor' | 'director';
        pageIndex?: number;
        pageSize?: number;
    }): Promise<ApiSuccessResponse<PublicPersonDetail>> => {
        const response = await publicAxios.get<ApiSuccessResponse<PublicPersonDetail>>('/People/Detail', {
            params: {
                name: params.name,
                role: params.role,
                pageIndex: params.pageIndex ?? 1,
                pageSize: params.pageSize ?? 12,
            },
        });
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
        const response = await publicAxios.get<ApiSuccessResponse<PublicSeatMap>>(`/AuditoriumDetails/${scheduleId}`);
        return response.data;
    },

    /** 9. Get Pricing Info */
    getPricing: async (scheduleId: string): Promise<ApiSuccessResponse<PublicPricing>> => {
        const response = await publicAxios.get<ApiSuccessResponse<PublicPricing>>(`/movies/schedules/${scheduleId}/prices`);
        return response.data;
    },

    /** 9.1 Get public automatic pricing promotions */
    getPromotions: async (): Promise<ApiSuccessResponse<PublicPromotion[]>> => {
        const response = await publicAxios.get<ApiSuccessResponse<PublicPromotion[]>>('/promotions');
        return response.data;
    },

    /** 9.2 Get public automatic pricing promotion detail */
    getPromotionBySlug: async (slug: string): Promise<ApiSuccessResponse<PublicPromotion>> => {
        const response = await publicAxios.get<ApiSuccessResponse<PublicPromotion>>(`/promotions/${slug}`);
        return response.data;
    },

    /** 10. Get Movie Genres */
    getMovieGenres: async (): Promise<ApiSuccessResponse<PublicGenre[]>> => {
        const response = await publicAxios.get<ApiSuccessResponse<PublicGenre[]>>('/movies/genres');
        return response.data;
    },

    /** 11. Get Upcoming Dates (all movies/cinemas) */
    getUpcomingDates: async (params?: { city?: string; cinemaId?: string }): Promise<ApiSuccessResponse<string[]>> => {
        const response = await publicAxios.get<ApiSuccessResponse<string[]>>('/UpcomingDates', {
            params
        });
        return response.data;
    },

    /** 12. Get Nearest Cinemas based on location */
    getNearestCinemas: async (latitude: number, longitude: number): Promise<ApiSuccessResponse<NearestCinema[]>> => {
        const response = await publicAxios.get<ApiSuccessResponse<NearestCinema[]>>('/movies/nearest-cinemas', {
            params: { latitude, longitude }
        });
        return response.data;
    },

    /** 13. Get Similar Movies (More Like This) */
    getSimilarMovies: async (movieId: string, limit?: number): Promise<ApiSuccessResponse<PublicMovieListItem[]>> => {
        const response = await publicAxios.get<ApiSuccessResponse<PublicMovieListItem[]>>(`/movies/${movieId}/similar`, {
            params: limit ? { limit } : undefined
        });
        return response.data;
    },

    /** Get active banners for home page */
    getBanners: async (cinemaId?: string): Promise<ApiSuccessResponse<any[]>> => {
        const params: Record<string, string> = {};
        if (cinemaId) params.cinemaId = cinemaId;
        const response = await publicAxios.get<any>('/banners', { params });
        // Backend returns array directly (not wrapped in isSuccess/data)
        // Normalize to ApiSuccessResponse format
        if (Array.isArray(response.data)) {
            return { isSuccess: true, message: 'Success', data: response.data };
        }
        return response.data;
    },
};
