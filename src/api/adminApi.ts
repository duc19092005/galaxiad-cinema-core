// src/api/adminApi.ts
import { identityAxios } from './axiosClient';
import type { ApiSuccessResponse } from '../types/auth.types';
import type { AdminUserDto, GroupedScheduleJobDto, RoleDto } from '../types/admin.types';

export const adminApi = {
    /** GET /api/v1/AdminManageUsers */
    getUsers: async (): Promise<ApiSuccessResponse<AdminUserDto[]>> => {
        const response = await identityAxios.get<ApiSuccessResponse<AdminUserDto[]>>(
            '/AdminManageUsers'
        );
        return response.data;
    },

    /** PUT /api/v1/AdminManageUsers/{userId}/status?status={STATUS_INT} */
    updateUserStatus: async (userId: string, status: number): Promise<ApiSuccessResponse> => {
        const response = await identityAxios.put<ApiSuccessResponse>(
            `/AdminManageUsers/${userId}/status?status=${status}`
        );
        return response.data;
    },

    /** PUT /api/v1/AdminManageUsers/{userId}/role */
    updateUserRole: async (userId: string, roleIds: string[]): Promise<ApiSuccessResponse> => {
        const response = await identityAxios.put<ApiSuccessResponse>(
            `/AdminManageUsers/${userId}/role`,
            roleIds
        );
        return response.data;
    },

    /** GET /api/v1/AdminManageUsers/{userId}/role */
    getUserRoles: async (userId: string): Promise<ApiSuccessResponse<RoleDto[]>> => {
        const response = await identityAxios.get<ApiSuccessResponse<RoleDto[]>>(
            `/AdminManageUsers/${userId}/role`
        );
        return response.data;
    },

    /** PUT /api/v1/AdminManageUsers/cinemas/{cinemaId}/manager?managerId={USER_ID} */
    assignTheaterManager: async (cinemaId: string, managerId: string): Promise<ApiSuccessResponse> => {
        const response = await identityAxios.put<ApiSuccessResponse>(
            `/AdminManageUsers/cinemas/${cinemaId}/manager?managerId=${managerId}`
        );
        return response.data;
    },

    /** GET /api/v1/ScheduleJobs */
    getScheduleJobs: async (): Promise<ApiSuccessResponse<GroupedScheduleJobDto[]>> => {
        const response = await identityAxios.get<ApiSuccessResponse<GroupedScheduleJobDto[]>>(
            '/ScheduleJobs'
        );
        return response.data;
    },

    /** GET /api/v1/AdminManageUsers/roles */
    getRoles: async (): Promise<ApiSuccessResponse<RoleDto[]>> => {
        const response = await identityAxios.get<any>(
            '/AdminManageUsers/roles'
        );
        // Handle case where API returns a direct array instead of ApiSuccessResponse
        if (Array.isArray(response.data)) {
            return {
                isSuccess: true,
                message: 'Success',
                data: response.data
            };
        }
        return response.data;
    },
};
