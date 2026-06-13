// src/api/adminApi.ts
import { identityAxios } from './axiosClient';
import type { ApiSuccessResponse } from '../types/auth.types';
import type { AdminUserDto, AuditLogDto, GroupedScheduleJobDto, ManagementDashboardDto, PermissionDto, RoleDto, RolePermissionsDto, UserRoleDto } from '../types/admin.types';

const isRecord = (value: unknown): value is Record<string, unknown> => (
    typeof value === 'object' && value !== null
);

const readString = (record: Record<string, unknown>, ...keys: string[]) => {
    for (const key of keys) {
        const value = record[key];
        if (typeof value === 'string') return value;
    }
    return '';
};

const unwrapArrayResponse = <T>(payload: unknown, mapper: (item: unknown) => T): ApiSuccessResponse<T[]> => {
    if (Array.isArray(payload)) {
        return { isSuccess: true, message: 'Success', data: payload.map(mapper) };
    }

    if (!isRecord(payload)) {
        return { isSuccess: false, message: 'Invalid response', data: [] };
    }

    const rawData = payload.data ?? payload.Data;
    return {
        isSuccess: Boolean(payload.isSuccess ?? payload.IsSuccess ?? true),
        message: String(payload.message ?? payload.Message ?? 'Success'),
        data: Array.isArray(rawData) ? rawData.map(mapper) : [],
    };
};

const unwrapObjectResponse = <T>(payload: unknown): ApiSuccessResponse<T> => {
    if (!isRecord(payload)) {
        return { isSuccess: true, message: 'Success', data: payload as T };
    }

    return {
        isSuccess: Boolean(payload.isSuccess ?? payload.IsSuccess ?? true),
        message: String(payload.message ?? payload.Message ?? 'Success'),
        data: (payload.data ?? payload.Data ?? payload) as T,
    };
};

const readBoolean = (record: Record<string, unknown>, fallback: boolean, ...keys: string[]) => {
    for (const key of keys) {
        const value = record[key];
        if (typeof value === 'boolean') return value;
    }
    return fallback;
};

const normalizeAuditLog = (log: unknown): AuditLogDto => {
    if (!isRecord(log)) {
        return {
            auditLogId: '',
            action: '',
            entityType: '',
            entityId: null,
            entityName: '',
            description: '',
            actorUserId: '',
            actorName: '',
            actorPrimaryRole: '',
            isAdminAction: false,
            cinemaId: null,
            createdAt: '',
        };
    }

    return {
        auditLogId: readString(log, 'auditLogId', 'AuditLogId'),
        action: readString(log, 'action', 'Action'),
        entityType: readString(log, 'entityType', 'EntityType'),
        entityId: readString(log, 'entityId', 'EntityId') || null,
        entityName: readString(log, 'entityName', 'EntityName'),
        description: readString(log, 'description', 'Description'),
        actorUserId: readString(log, 'actorUserId', 'ActorUserId'),
        actorName: readString(log, 'actorName', 'ActorName'),
        actorPrimaryRole: readString(log, 'actorPrimaryRole', 'ActorPrimaryRole'),
        isAdminAction: readBoolean(log, false, 'isAdminAction', 'IsAdminAction'),
        cinemaId: readString(log, 'cinemaId', 'CinemaId') || null,
        createdAt: readString(log, 'createdAt', 'CreatedAt'),
    };
};

const normalizeRole = (role: unknown): RoleDto => {
    if (!isRecord(role)) return { roleId: '', roleName: '' };
    return {
        roleId: readString(role, 'roleId', 'RoleId', 'id', 'Id'),
        roleName: readString(role, 'roleName', 'RoleName', 'name', 'Name'),
    };
};

const normalizePermission = (permission: unknown): PermissionDto => {
    if (!isRecord(permission)) return { permissionId: '', permissionInfo: '' };
    return {
        permissionId: readString(permission, 'permissionId', 'PermissionId', 'id', 'Id'),
        permissionInfo: readString(permission, 'permissionInfo', 'PermissionInfo', 'name', 'Name'),
    };
};

const normalizeRolePermissions = (role: unknown): RolePermissionsDto => {
    if (!isRecord(role)) return { roleId: '', roleName: '', permissions: [] };
    const rawPermissions = role.permissions ?? role.Permissions;
    return {
        roleId: readString(role, 'roleId', 'RoleId', 'id', 'Id'),
        roleName: readString(role, 'roleName', 'RoleName', 'name', 'Name'),
        permissions: Array.isArray(rawPermissions) ? rawPermissions.map(normalizePermission) : [],
    };
};

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

    /** PUT /api/v1/AdminManageUsers/{userId}/portrait */
    updateUserPortrait: async (userId: string, portrait: File): Promise<ApiSuccessResponse<string | null>> => {
        const formData = new FormData();
        formData.append('portrait', portrait);
        const response = await identityAxios.put<unknown>(
            `/AdminManageUsers/${userId}/portrait`,
            formData,
            { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        const payload = response.data;
        if (!isRecord(payload)) {
            return {
                isSuccess: response.status >= 200 && response.status < 300,
                message: 'Success',
                data: null,
            };
        }
        return {
            isSuccess: Boolean(payload.isSuccess ?? payload.IsSuccess ?? (response.status >= 200 && response.status < 300)),
            message: String(payload.message ?? payload.Message ?? 'Success'),
            data: typeof payload.data === 'string' ? payload.data : typeof payload.Data === 'string' ? payload.Data : null,
        };
    },

    /** PUT /api/v1/AdminManageUsers/{userId}/role */
    updateUserRole: async (userId: string, roleIds: string[]): Promise<ApiSuccessResponse<unknown>> => {
        const response = await identityAxios.put<unknown>(
            `/AdminManageUsers/${userId}/role`,
            roleIds
        );
        const payload = response.data;
        if (!isRecord(payload)) {
            return {
                isSuccess: response.status >= 200 && response.status < 300,
                message: 'Success',
                data: null,
            };
        }
        return {
            isSuccess: Boolean(payload.isSuccess ?? payload.IsSuccess ?? (response.status >= 200 && response.status < 300)),
            message: String(payload.message ?? payload.Message ?? 'Success'),
            data: payload.data ?? payload.Data ?? null,
        };
    },

    /** GET /api/v1/AdminManageUsers/{userId}/role */
    getUserRoles: async (userId: string): Promise<ApiSuccessResponse<UserRoleDto[]>> => {
        const response = await identityAxios.get<unknown>(
            `/AdminManageUsers/${userId}/role`
        );
        const payload = response.data;
        const rawRoles = isRecord(payload) ? (payload.data ?? payload.Data) : payload;
        return {
            isSuccess: isRecord(payload) ? Boolean(payload.isSuccess ?? payload.IsSuccess ?? true) : true,
            message: isRecord(payload) ? String(payload.message ?? payload.Message ?? 'Success') : 'Success',
            data: Array.isArray(rawRoles)
                ? rawRoles.map((role) => typeof role === 'string' ? role : normalizeRole(role))
                : [],
        };
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
        const response = await identityAxios.get<unknown>(
            `/admin/audit-logs/recent?take=${take}`
        );
        return unwrapArrayResponse(response.data, normalizeAuditLog);
    },

    /** GET /api/v1/admin/dashboard/management */
    getManagementDashboard: async (): Promise<ApiSuccessResponse<ManagementDashboardDto>> => {
        const response = await identityAxios.get<unknown>(
            '/admin/dashboard/management'
        );
        return unwrapObjectResponse<ManagementDashboardDto>(response.data);
    },

    /** GET /api/v1/AdminManageUsers/roles */
    getRoles: async (): Promise<ApiSuccessResponse<RoleDto[]>> => {
        const response = await identityAxios.get<unknown>(
            '/AdminManageUsers/roles'
        );
        return unwrapArrayResponse(response.data, normalizeRole);
    },

    /** GET /api/v1/AdminManageUsers/permissions */
    getPermissions: async (): Promise<ApiSuccessResponse<PermissionDto[]>> => {
        const response = await identityAxios.get<unknown>(
            '/AdminManageUsers/permissions'
        );
        return unwrapArrayResponse(response.data, normalizePermission);
    },

    /** GET /api/v1/AdminManageUsers/roles-permissions */
    getRolesPermissions: async (): Promise<ApiSuccessResponse<RolePermissionsDto[]>> => {
        const response = await identityAxios.get<unknown>(
            '/AdminManageUsers/roles-permissions'
        );
        return unwrapArrayResponse(response.data, normalizeRolePermissions);
    },

    /** PUT /api/v1/AdminManageUsers/roles/{roleId}/permissions */
    updateRolePermissions: async (roleId: string, permissionIds: string[]): Promise<ApiSuccessResponse<string | null>> => {
        const response = await identityAxios.put<unknown>(
            `/AdminManageUsers/roles/${roleId}/permissions`,
            permissionIds
        );
        const payload = response.data;
        if (!isRecord(payload)) {
            return {
                isSuccess: response.status >= 200 && response.status < 300,
                message: 'Success',
                data: null,
            };
        }
        return {
            isSuccess: Boolean(payload.isSuccess ?? payload.IsSuccess ?? (response.status >= 200 && response.status < 300)),
            message: String(payload.message ?? payload.Message ?? 'Success'),
            data: typeof payload.data === 'string' ? payload.data : typeof payload.Data === 'string' ? payload.Data : null,
        };
    },
};
