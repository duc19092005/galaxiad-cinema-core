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
    jobEndedAt: string | null;
    scheduleJobCategory: string;
    scheduleJobStatus: string;
    scheduleJobStatusType: string;
    failedReason: string;
}

export interface GroupedScheduleJobDto {
    targetId: string;
    jobCategory: string;
    startScheduleJob?: ScheduleJobDto;
    endScheduleJob?: ScheduleJobDto;
}

export interface RoleDto {
    roleId: string;
    roleName: string;
}

export interface ManagerDto {
    userId: string;
    userEmail: string;
    userName: string;
}

export interface ManagedItemDto {
    itemId: string;
    itemName: string;
    description: string;
    managerName?: string;
}

export interface TransferRightsRequest {
    sourceUserId: string | null;
    targetUserId: string;
    transferType: number; // 1: Facilities (CSVC), 2: Theater (Vận hành), 3: Movie (Phim)
    itemId: string | null;
}
