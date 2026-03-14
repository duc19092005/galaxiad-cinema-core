// src/types/admin.types.ts
export interface AdminUserDto {
    userId: string;
    userEmail: string;
    userName: string;
    fullName?: string; // Kept for backward compatibility if needed
    userRoles: string; // e.g., "Admin,TheaterManager"
    accountStatus: number; // 1: Active, 2: Locked, 3: Banned...
    registerMethod: number;
}

export interface ScheduleJobDto {
    jobId: string;
    targetId: string;
    jobStartedAt: string;
    jobEndedAt: string;
    scheduleJobCategory: string;
    scheduleJobStatus: string;
    scheduleJobStatusType: string;
    failedReason: string;
}

export interface RoleDto {
    roleId: string;
    roleName: string;
}
