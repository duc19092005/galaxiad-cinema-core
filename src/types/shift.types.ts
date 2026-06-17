export type ShiftRegistrationStatus = 'Pending' | 'Approved' | 'Rejected' | 'Cancelled' | string;
export type PayrollStatus = 'Pending' | 'Paid' | string;

export interface ShiftTemplateDto {
  shiftTemplateId: string;
  cinemaId: string;
  cinemaName: string;
  shiftName: string;
  startTime: string;
  endTime: string;
  maxStaff: number;
  registeredCount?: number;
  roleId: string;
  roleName: string;
}

export interface RegisterShiftRequest {
  shiftTemplateId: string;
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
}

export interface CreateShiftTemplateRequest {
  cinemaId: string;
  shiftName: string;
  startTime: string;
  endTime: string;
  maxStaff: number;
  roleId: string;
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
