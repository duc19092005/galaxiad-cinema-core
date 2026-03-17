// src/api/scheduleApi.ts
import { theaterAxios } from './axiosClient';
import type { ApiSuccessResponse } from '../types/auth.types';
import type {
    CreateScheduleRequest,
    MovieWithFormat,
    MyCinemaAuditoriums,
    ScheduleDetail,
    UpdateScheduleRequest
} from '../types/schedule.types';

export const scheduleApi = {
    /** POST /api/TheaterManager/MovieSchedules */
    createSchedule: async (data: CreateScheduleRequest): Promise<ApiSuccessResponse> => {
        const response = await theaterAxios.post<ApiSuccessResponse>(
            '/TheaterManager/MovieSchedules',
            data
        );
        return response.data;
    },

    /** DELETE /api/TheaterManager/MovieSchedules/{scheduleId} */
    deleteSchedule: async (scheduleId: string): Promise<ApiSuccessResponse> => {
        const response = await theaterAxios.delete<ApiSuccessResponse>(
            `/TheaterManager/MovieSchedules/${scheduleId}`
        );
        return response.data;
    },

    /** GET /api/TheaterManager/Data/movies-with-formats */
    getMoviesWithFormats: async (): Promise<ApiSuccessResponse<MovieWithFormat[]>> => {
        const response = await theaterAxios.get<ApiSuccessResponse<MovieWithFormat[]>>(
            '/TheaterManager/Data/movies-with-formats'
        );
        return response.data;
    },

    /** GET /api/TheaterManager/Data/my-auditoriums */
    getMyAuditoriums: async (cinemaId?: string): Promise<ApiSuccessResponse<MyCinemaAuditoriums>> => {
        const url = cinemaId ? `/TheaterManager/Data/my-auditoriums?cinemaId=${cinemaId}` : '/TheaterManager/Data/my-auditoriums';
        const response = await theaterAxios.get<ApiSuccessResponse<MyCinemaAuditoriums>>(url);
        return response.data;
    },

    /** GET /api/TheaterManager/MovieSchedules/{auditoriumId} */
    getSchedulesByAuditorium: async (auditoriumId: string): Promise<ApiSuccessResponse<ScheduleDetail[]>> => {
        const response = await theaterAxios.get<ApiSuccessResponse<ScheduleDetail[]>>(
            `/TheaterManager/MovieSchedules/${auditoriumId}`
        );
        return response.data;
    },

    /** PUT /api/TheaterManager/MovieSchedules/{auditoriumId} */
    updateSchedule: async (auditoriumId: string, data: UpdateScheduleRequest): Promise<ApiSuccessResponse> => {
        const response = await theaterAxios.put<ApiSuccessResponse>(
            `/TheaterManager/MovieSchedules/${auditoriumId}`,
            data
        );
        return response.data;
    },
};
