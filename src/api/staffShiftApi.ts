import { API_BASE_URL, shiftAxios } from './axiosClient';
import type { ApiSuccessResponse } from '../types/auth.types';
import type { AxiosResponse } from 'axios';
import type {
  CashierShiftSession,
  ClockInRequest,
  ClockInResponse,
  ClockOutRequest,
  PayrollDto,
  RegisterFaceRequest,
  RegisterShiftRequest,
  ShiftRegistrationDto,
  ShiftTemplateDto,
  StaffWorkingLogDto,
} from '../types/shift.types';

type ServerResponse<T> = {
  isSuccess?: boolean;
  IsSuccess?: boolean;
  message?: string;
  Message?: string;
  data?: T;
  Data?: T;
};

const normalizeSuccessResponse = <T>(response: AxiosResponse<ServerResponse<T>>): ApiSuccessResponse<T> => ({
  isSuccess: response.data.isSuccess ?? response.data.IsSuccess ?? (response.status >= 200 && response.status < 300),
  message: response.data.message ?? response.data.Message ?? 'Success',
  data: (response.data.data ?? response.data.Data) as T,
});

export const CASHIER_SHIFT_SESSION_KEY = 'cashier_shift_session';
export const POS_TERMINAL_TOKEN_KEY = 'pos_terminal_token';

export const staffShiftApi = {
  /** GET /api/v1/Staff/Shifts/available?date=yyyy-MM-dd */
  getAvailableShifts: async (date: string, token?: string): Promise<ApiSuccessResponse<ShiftTemplateDto[]>> => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await shiftAxios.get<ServerResponse<ShiftTemplateDto[]>>('/Staff/Shifts/available', { params: { date }, headers });
    return normalizeSuccessResponse<ShiftTemplateDto[]>(response);
  },

  /** POST /api/v1/Staff/Shifts/register */
  registerShift: async (data: RegisterShiftRequest, token?: string): Promise<ApiSuccessResponse<boolean>> => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await shiftAxios.post<ServerResponse<boolean>>('/Staff/Shifts/register', data, { headers });
    return normalizeSuccessResponse<boolean>(response);
  },

  /** GET /api/v1/Staff/Shifts/my-registrations */
  getMyRegistrations: async (token?: string): Promise<ApiSuccessResponse<ShiftRegistrationDto[]>> => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await shiftAxios.get<ServerResponse<ShiftRegistrationDto[]>>('/Staff/Shifts/my-registrations', { headers });
    return normalizeSuccessResponse<ShiftRegistrationDto[]>(response);
  },

  /** POST /api/v1/Staff/Shifts/{staffId}/register-face */
  registerFace: async (staffId: string, data: RegisterFaceRequest, token?: string): Promise<ApiSuccessResponse<boolean>> => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await shiftAxios.post<ServerResponse<boolean>>(`/Staff/Shifts/${staffId}/register-face`, data, { headers });
    return normalizeSuccessResponse<boolean>(response);
  },

  /** POST /api/v1/Staff/Shifts/clock-in */
  clockIn: async (data: ClockInRequest): Promise<ApiSuccessResponse<ClockInResponse>> => {
    const response = await shiftAxios.post<ServerResponse<ClockInResponse>>('/Staff/Shifts/clock-in', data);
    return normalizeSuccessResponse<ClockInResponse>(response);
  },

  /** POST /api/v1/Staff/Shifts/clock-out */
  clockOut: async (data: ClockOutRequest, token?: string): Promise<ApiSuccessResponse<boolean>> => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await shiftAxios.post<ServerResponse<boolean>>('/Staff/Shifts/clock-out', data, { headers });
    return normalizeSuccessResponse<boolean>(response);
  },

  /** GET /api/v1/Staff/Shifts/my-history */
  getMyHistory: async (token?: string): Promise<ApiSuccessResponse<StaffWorkingLogDto[]>> => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await shiftAxios.get<ServerResponse<StaffWorkingLogDto[]>>('/Staff/Shifts/my-history', { headers });
    return normalizeSuccessResponse<StaffWorkingLogDto[]>(response);
  },

  /** GET /api/v1/Staff/Shifts/my-payroll */
  getMyPayroll: async (token?: string): Promise<ApiSuccessResponse<PayrollDto[]>> => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await shiftAxios.get<ServerResponse<PayrollDto[]>>('/Staff/Shifts/my-payroll', { headers });
    return normalizeSuccessResponse<PayrollDto[]>(response);
  },

  getNotificationsSseUrl: (): string => `${API_BASE_URL}/api/v1/Staff/Shifts/notifications/sse`,
};

export const readCashierShiftSession = (): CashierShiftSession | null => {
  try {
    const raw = localStorage.getItem(CASHIER_SHIFT_SESSION_KEY);
    return raw ? JSON.parse(raw) as CashierShiftSession : null;
  } catch {
    return null;
  }
};
