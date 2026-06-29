import type { StaffSaleHistoryItem } from './booking.types';

export type ShiftRegistrationStatus = 'Pending' | 'Approved' | 'Rejected' | 'Cancelled' | string;
export type PayrollStatus = 'Pending' | 'Paid' | string;

export interface ShiftTemplateDto {
  shiftTemplateId: string;
  shiftScheduleId?: string;
  cinemaId: string;
  cinemaName: string;
  shiftName: string;
  startTime: string;
  endTime: string;
  maxStaff: number;
  registeredCount?: number;
  roleId: string;
  roleName: string;
  shiftType?: number;
}

export interface RegisterShiftRequest {
  shiftTemplateId?: string;
  shiftScheduleId?: string;
  startDate: string;
  endDate: string;
  notes?: string;
}

export interface ShiftRegistrationDto {
  shiftRegistrationId: string;
  staffId: string;
  staffName: string;
  shiftTemplateId: string;
  shiftName: string;
  startTime: string;
  endTime: string;
  registrationDate: string;
  status: ShiftRegistrationStatus;
  approvedByName?: string | null;
  approvedAt?: string | null;
  notes?: string | null;
}

export interface RegisterFaceRequest {
  faceVector: number[];
}

export interface ClockInRequest {
  staffId: string;
  faceVector: number[];
  simulatedDateTime?: string | null;
}

export interface ClockInResponse {
  accessToken: string;
  staffName: string;
}

export interface ClockOutRequest {
  simulatedDateTime?: string | null;
}

export interface StaffWorkingLogDto {
  staffWorkingLoggerId: string;
  salaryPerHour: number;
  workingHour: number;
  startedShiftTime: string;
  endedShiftTime?: string | null;
  workingDate: string;
  totalReceived: number;
  sales?: StaffSaleHistoryItem[];
}

export interface PayrollDto {
  salaryTotalLoggerId: string;
  totalReceived: number;
  receivedDay: string;
  staffId: string;
  staffName: string;
  paidByUserId?: string | null;
  paidByName?: string | null;
  paymentStatus: PayrollStatus;
  workingLogs: StaffWorkingLogDto[];
}

export interface StaffProfileDto {
  userId: string;
  userName: string;
  email: string;
  portraitImageUrl?: string | null;
  workingStatus: boolean;
  cinemaId: string;
  cinemaName: string;
  departmentId?: string | null;
  departmentName?: string | null;
  isCinemaManager: boolean;
  hasFaceRegistered: boolean;
  employeeType?: number;
}

export interface CreateShiftTemplateRequest {
  cinemaId: string;
  shiftName: string;
  startTime: string;
  endTime: string;
  maxStaff: number;
  roleId: string;
  shiftType: number;
}

export interface AssignShiftRequest {
  staffId: string;
  shiftTemplateId: string;
  registrationDate: string;
}

export interface ApproveShiftRequest {
  notes?: string;
}

export interface UpdateStaffProfileRequest {
  workingStatus: boolean;
  cinemaId: string;
  isCinemaManager: boolean;
  employeeType?: number;
}

export interface CalculatePayrollRequest {
  staffId: string;
  upToDate: string;
}

export interface ShiftNotification {
  type?: string;
  title?: string;
  message?: string;
  status?: string;
  timestamp?: string;
}

export interface CashierShiftSession {
  staffId: string;
  staffName: string;
  accessToken: string;
  clockedInAt: string;
}

export interface CreateShiftScheduleRequest {
  cinemaId: string;
  departmentId: string;
  date: string;
  shifts: ShiftScheduleItemRequest[];
  repeatWeekly: boolean;
  repeatWeeksCount?: number;
}

export interface ShiftScheduleItemRequest {
  shiftName: string;
  startTime: string;
  endTime: string;
  maxStaff: number;
  roleId: string;
  shiftType: number;
}

export interface ShiftScheduleDto {
  shiftScheduleId: string;
  cinemaId: string;
  departmentId: string;
  departmentName: string;
  date: string;
  shiftName: string;
  startTime: string;
  endTime: string;
  maxStaff: number;
  registeredCount: number;
  roleId: string;
  roleName: string;
  deletionStatus: string;
  deletionReason?: string | null;
  registeredStaff: ScheduleStaffRegistrationDto[];
  shiftType: number;
}

export interface ScheduleStaffRegistrationDto {
  shiftRegistrationId: string;
  staffId: string;
  staffName: string;
  status: string;
}

export interface DeleteShiftScheduleRequest {
  reason: string;
}

export interface PendingDeletionRequestDto {
  shiftScheduleId: string;
  cinemaId: string;
  cinemaName: string;
  departmentId: string;
  departmentName: string;
  date: string;
  shiftName: string;
  startTime: string;
  endTime: string;
  deletionReason: string;
  deletionRequestedByUserId: string;
  deletionRequestedByUserName: string;
  deletionRequestedAt: string;
  registeredStaffCount: number;
}
