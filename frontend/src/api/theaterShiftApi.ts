import { shiftAxios } from './axiosClient';
import type { ApiSuccessResponse } from '../types/auth.types';
import type { AxiosResponse } from 'axios';
import type {
  ApproveShiftRequest,
  AssignShiftRequest,
  CalculatePayrollRequest,
  CreateShiftTemplateRequest,
  PayrollDto,
  ShiftRegistrationDto,
  ShiftTemplateDto,
  StaffProfileDto,
  UpdateStaffProfileRequest,
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

export const theaterShiftApi = {
  /** POST /api/v1/TheaterManager/Shifts/templates */
  createShiftTemplate: async (data: CreateShiftTemplateRequest): Promise<ApiSuccessResponse<ShiftTemplateDto>> => {
    const response = await shiftAxios.post<ServerResponse<ShiftTemplateDto>>('/TheaterManager/Shifts/templates', data);
    return normalizeSuccessResponse<ShiftTemplateDto>(response);
  },

  /** GET /api/v1/TheaterManager/Shifts/templates?cinemaId={id} */
  getShiftTemplates: async (cinemaId: string): Promise<ApiSuccessResponse<ShiftTemplateDto[]>> => {
    const response = await shiftAxios.get<ServerResponse<ShiftTemplateDto[]>>('/TheaterManager/Shifts/templates', { params: { cinemaId } });
    return normalizeSuccessResponse<ShiftTemplateDto[]>(response);
  },

  /** GET /api/v1/TheaterManager/Shifts/registrations?cinemaId={id}&status={status} */
  getShiftRegistrations: async (cinemaId: string, status?: string): Promise<ApiSuccessResponse<ShiftRegistrationDto[]>> => {
    const response = await shiftAxios.get<ServerResponse<ShiftRegistrationDto[]>>('/TheaterManager/Shifts/registrations', {
      params: { cinemaId, ...(status ? { status } : {}) },
    });
    return normalizeSuccessResponse<ShiftRegistrationDto[]>(response);
  },

  /** POST /api/v1/TheaterManager/Shifts/registrations/{id}/approve */
  approveShift: async (id: string, data: ApproveShiftRequest): Promise<ApiSuccessResponse<boolean>> => {
    const response = await shiftAxios.post<ServerResponse<boolean>>(`/TheaterManager/Shifts/registrations/${id}/approve`, data);
    return normalizeSuccessResponse<boolean>(response);
  },

  /** POST /api/v1/TheaterManager/Shifts/registrations/{id}/reject */
  rejectShift: async (id: string, data: ApproveShiftRequest): Promise<ApiSuccessResponse<boolean>> => {
    const response = await shiftAxios.post<ServerResponse<boolean>>(`/TheaterManager/Shifts/registrations/${id}/reject`, data);
    return normalizeSuccessResponse<boolean>(response);
  },

  /** POST /api/v1/TheaterManager/Shifts/registrations/{id}/cancel */
  cancelShift: async (id: string, data: ApproveShiftRequest): Promise<ApiSuccessResponse<boolean>> => {
    const response = await shiftAxios.post<ServerResponse<boolean>>(`/TheaterManager/Shifts/registrations/${id}/cancel`, data);
    return normalizeSuccessResponse<boolean>(response);
  },

  /** POST /api/v1/TheaterManager/Shifts/assign */
  assignShift: async (data: AssignShiftRequest): Promise<ApiSuccessResponse<boolean>> => {
    const response = await shiftAxios.post<ServerResponse<boolean>>('/TheaterManager/Shifts/assign', data);
    return normalizeSuccessResponse<boolean>(response);
  },

  /** GET /api/v1/TheaterManager/Shifts/staff-profiles?cinemaId={id} */
  getStaffProfiles: async (cinemaId: string): Promise<ApiSuccessResponse<StaffProfileDto[]>> => {
    const response = await shiftAxios.get<ServerResponse<StaffProfileDto[]>>('/TheaterManager/Shifts/staff-profiles', { params: { cinemaId } });
    return normalizeSuccessResponse<StaffProfileDto[]>(response);
  },

  /** PUT /api/v1/TheaterManager/Shifts/staff-profiles/{id} */
  updateStaffProfile: async (id: string, data: UpdateStaffProfileRequest): Promise<ApiSuccessResponse<boolean>> => {
    const response = await shiftAxios.put<ServerResponse<boolean>>(`/TheaterManager/Shifts/staff-profiles/${id}`, data);
    return normalizeSuccessResponse<boolean>(response);
  },

  /** POST /api/v1/TheaterManager/Shifts/payroll/calculate */
  calculatePayroll: async (data: CalculatePayrollRequest): Promise<ApiSuccessResponse<PayrollDto>> => {
    const response = await shiftAxios.post<ServerResponse<PayrollDto>>('/TheaterManager/Shifts/payroll/calculate', data);
    return normalizeSuccessResponse<PayrollDto>(response);
  },

  /** POST /api/v1/TheaterManager/Shifts/payroll/{id}/pay */
  payPayroll: async (id: string): Promise<ApiSuccessResponse<boolean>> => {
    const response = await shiftAxios.post<ServerResponse<boolean>>(`/TheaterManager/Shifts/payroll/${id}/pay`);
    return normalizeSuccessResponse<boolean>(response);
  },

  /** GET /api/v1/TheaterManager/Shifts/payroll/staff/{staffId} */
  getStaffPayroll: async (staffId: string): Promise<ApiSuccessResponse<PayrollDto[]>> => {
    const response = await shiftAxios.get<ServerResponse<PayrollDto[]>>(`/TheaterManager/Shifts/payroll/staff/${staffId}`);
    return normalizeSuccessResponse<PayrollDto[]>(response);
  },

  /** GET /api/v1/TheaterManager/Shifts/payroll/cinema/{cinemaId} */
  getCinemaPayroll: async (cinemaId: string): Promise<ApiSuccessResponse<PayrollDto[]>> => {
    const response = await shiftAxios.get<ServerResponse<PayrollDto[]>>(`/TheaterManager/Shifts/payroll/cinema/${cinemaId}`);
    return normalizeSuccessResponse<PayrollDto[]>(response);
  },
};
