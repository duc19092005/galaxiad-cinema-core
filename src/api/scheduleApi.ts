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

const normalizeSuccessResponse = <T = any>(response: any): ApiSuccessResponse<T> => ({
    isSuccess: response.data?.isSuccess ?? response.data?.IsSuccess ?? (response.status >= 200 && response.status < 300),
    message: response.data?.message ?? response.data?.Message ?? 'Success',
    data: response.data?.data ?? response.data?.Data,
});

export const scheduleApi = {
    /** POST /api/TheaterManager/MovieSchedules */
    createSchedule: async (data: CreateScheduleRequest): Promise<ApiSuccessResponse> => {
        const response = await theaterAxios.post<any>(
            '/TheaterManager/MovieSchedules',
            data
        );
        return normalizeSuccessResponse(response);
    },

    /** DELETE /api/TheaterManager/MovieSchedules/{scheduleId} */
    deleteSchedule: async (scheduleId: string): Promise<ApiSuccessResponse> => {
        const response = await theaterAxios.delete<any>(
            `/TheaterManager/MovieSchedules/${scheduleId}`
        );
        return normalizeSuccessResponse(response);
    },

    /** GET /api/TheaterManager/Data/movies-with-formats?cinemaId={id} */
    getMoviesWithFormats: async (cinemaId: string): Promise<ApiSuccessResponse<MovieWithFormat[]>> => {
        const response = await theaterAxios.get<ApiSuccessResponse<MovieWithFormat[]>>(
            `/TheaterManager/Data/movies-with-formats?cinemaId=${cinemaId}`
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
        const response = await theaterAxios.put<any>(
            `/TheaterManager/MovieSchedules/${auditoriumId}`,
            data
        );
        return normalizeSuccessResponse(response);
    },
};
