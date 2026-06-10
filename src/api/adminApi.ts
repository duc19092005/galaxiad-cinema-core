// src/api/adminApi.ts
import { identityAxios } from './axiosClient';
import type { ApiSuccessResponse } from '../types/auth.types';
import type { AdminUserDto, AuditLogDto, GroupedScheduleJobDto, ManagementDashboardDto, RoleDto } from '../types/admin.types';

const normalizeAuditLog = (log: any): AuditLogDto => ({
    auditLogId: log.auditLogId ?? log.AuditLogId,
    action: log.action ?? log.Action ?? '',
    entityType: log.entityType ?? log.EntityType ?? '',
    entityId: log.entityId ?? log.EntityId ?? null,
    entityName: log.entityName ?? log.EntityName ?? '',
    description: log.description ?? log.Description ?? '',
    actorUserId: log.actorUserId ?? log.ActorUserId ?? '',
    actorName: log.actorName ?? log.ActorName ?? '',
    actorPrimaryRole: log.actorPrimaryRole ?? log.ActorPrimaryRole ?? '',
    isAdminAction: log.isAdminAction ?? log.IsAdminAction ?? false,
    cinemaId: log.cinemaId ?? log.CinemaId ?? null,
    createdAt: log.createdAt ?? log.CreatedAt ?? '',
});

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

    /** GET /api/v1/admin/audit-logs/recent */
    getRecentAuditLogs: async (take = 30): Promise<ApiSuccessResponse<AuditLogDto[]>> => {
        const response = await identityAxios.get<any>(
            `/admin/audit-logs/recent?take=${take}`
        );
        if (Array.isArray(response.data)) {
            return {
                isSuccess: true,
                message: 'Success',
                data: response.data.map(normalizeAuditLog)
            };
        }
        if (Array.isArray(response.data?.Data)) {
            return {
                isSuccess: response.data.IsSuccess ?? true,
                message: response.data.Message ?? 'Success',
                data: response.data.Data.map(normalizeAuditLog)
            };
        }
        if (Array.isArray(response.data?.data)) {
            return {
                ...response.data,
                data: response.data.data.map(normalizeAuditLog)
            };
        }
        return response.data;
    },

    /** GET /api/v1/admin/dashboard/management */
    getManagementDashboard: async (): Promise<ApiSuccessResponse<ManagementDashboardDto>> => {
        const response = await identityAxios.get<any>(
            '/admin/dashboard/management'
        );
        if (response.data?.Data) {
            return {
                isSuccess: response.data.IsSuccess ?? true,
                message: response.data.Message ?? 'Success',
                data: response.data.Data
            };
        }
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
