import { shiftAxios } from './axiosClient';
import type { ApiSuccessResponse } from '../types/auth.types';
import type { AxiosResponse } from 'axios';
import type { PendingDeletionRequestDto } from '../types/shift.types';

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

export const adminShiftApi = {
  /** GET /api/v1/Admin/Shifts/pending-deletions */
  getPendingDeletionRequests: async (): Promise<ApiSuccessResponse<PendingDeletionRequestDto[]>> => {
    const response = await shiftAxios.get<ServerResponse<PendingDeletionRequestDto[]>>('/Admin/Shifts/pending-deletions');
    return normalizeSuccessResponse<PendingDeletionRequestDto[]>(response);
  },

  /** POST /api/v1/Admin/Shifts/schedules/{id}/approve-deletion */
  approveDeletionRequest: async (id: string): Promise<ApiSuccessResponse<boolean>> => {
    const response = await shiftAxios.post<ServerResponse<boolean>>(`/Admin/Shifts/schedules/${id}/approve-deletion`);
    return normalizeSuccessResponse<boolean>(response);
  },

  /** POST /api/v1/Admin/Shifts/schedules/{id}/reject-deletion */
  rejectDeletionRequest: async (id: string): Promise<ApiSuccessResponse<boolean>> => {
    const response = await shiftAxios.post<ServerResponse<boolean>>(`/Admin/Shifts/schedules/${id}/reject-deletion`);
    return normalizeSuccessResponse<boolean>(response);
  },
};
