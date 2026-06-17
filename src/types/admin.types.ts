// src/types/admin.types.ts
export interface AdminUserDto {
    userId: string;
    userEmail: string;
    userName: string;
    fullName?: string; // Kept for backward compatibility if needed
    portraitImageUrl?: string | null;
    userRoles: string; // e.g., "Admin,TheaterManager"
    accountStatus: number | string; // 1/"Active": Active, 2/"Banned": blocked
    registerMethod: number | string;
    cinemaName?: string | null;
}

export interface AdminCreateUserRequest {
    userEmail: string;
    userPassword: string;
    userRepassword: string;
    userName: string;
    identityCode: string;
    phoneNumber: string;
    dateOfBirth: string;
    roleIds: string[];
    cinemaId?: string;
    departmentId?: string;
    faceVector?: number[];
}

export interface AdminCreateUserResponse {
    userId: string;
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

export type UserRoleDto = RoleDto | string;

export interface PermissionDto {
    permissionId: string;
    permissionInfo: string;
}

export interface RolePermissionsDto extends RoleDto {
    permissions: PermissionDto[];
}

export interface AuditLogDto {
    auditLogId: string;
    action: string;
    entityType: string;
    entityId?: string | null;
    entityName: string;
    description: string;
    actorUserId: string;
    actorName: string;
    actorPrimaryRole: string;
    isAdminAction: boolean;
    cinemaId?: string | null;
    createdAt: string;
}

export interface RecentTransactionDto {
    orderId: string;
    orderDate: string;
    movieName: string;
    cinemaName: string;
    ticketCount: number;
    totalPrice: number;
    customerName: string;
}

export interface MovieTicketStatDto {
    movieId: string;
    movieName: string;
    ticketsSold: number;
    revenue: number;
}

export interface HourlyTicketStatDto {
    hour: number;
    hourLabel: string;
    ticketsSold: number;
}

export interface HotMovieDto {
    movieId: string;
    movieName: string;
    movieImageUrl: string;
    ticketsSold: number;
    revenue: number;
}

export interface RecentMovieDto {
    movieId: string;
    movieName: string;
    movieImageUrl: string;
    createdAt: string;
    createdBy: string;
}

export interface RecentCinemaDto {
    cinemaId: string;
    cinemaName: string;
    cinemaLocation: string;
    createdAt: string;
    createdBy: string;
}

export interface RecentAuditoriumDto {
    auditoriumId: string;
    auditoriumNumber: string;
    cinemaName: string;
    createdAt: string;
    createdBy: string;
}

export interface ManagementDashboardDto {
    activeUsers: number;
    totalCinemas: number;
    activeMovies: number;
    activeSchedules: number;
    totalBookings: number;
    monthRevenue: number;
    ticketsSoldToday: number;
    revenueToday: number;
    totalTicketsSold: number;
    busiestHourLabel: string;
    revenueByDay: DailyRevenueStatDto[];
    recentTransactions: RecentTransactionDto[];
    ticketsByMovie: MovieTicketStatDto[];
    ticketsByHour: HourlyTicketStatDto[];
    hotMovies: HotMovieDto[];
    recentMovies: RecentMovieDto[];
    recentCinemas: RecentCinemaDto[];
    recentAuditoriums: RecentAuditoriumDto[];
    recentActivities: AuditLogDto[];
}

export interface DailyRevenueStatDto {
    date: string;
    dateLabel: string;
    revenue: number;
    ticketCount: number;
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
