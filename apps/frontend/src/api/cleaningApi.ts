// src/api/cleaningApi.ts
import { shiftAxios } from './axiosClient';
import type { ApiSuccessResponse } from '../types/auth.types';
import type { AxiosResponse } from 'axios';
import type {
  CleaningBoardCellDto,
  CleaningTaskDto,
  AssignCleaningTaskRequest,
  CompleteCleaningTaskRequest,
  VerifyCleaningTaskRequest,
  CleaningTaskStatus,
} from '../types/cleaning.types';

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

export const cleaningApi = {
  // ===== Theater Manager =====

  /** GET /api/v1/TheaterManager/Cleaning/{cinemaId}/board */
  getBoard: async (cinemaId: string, date?: string, status?: CleaningTaskStatus): Promise<ApiSuccessResponse<CleaningBoardCellDto[]>> => {
    const response = await shiftAxios.get<ServerResponse<CleaningBoardCellDto[]>>(`/TheaterManager/Cleaning/${cinemaId}/board`, {
      params: { date, status },
    });
    return normalizeSuccessResponse<CleaningBoardCellDto[]>(response);
  },

  /** POST /api/v1/TheaterManager/Cleaning/tasks/{taskId}/assign */
  assignTask: async (taskId: string, data: AssignCleaningTaskRequest): Promise<ApiSuccessResponse<boolean>> => {
    const response = await shiftAxios.post<ServerResponse<boolean>>(`/TheaterManager/Cleaning/tasks/${taskId}/assign`, data);
    return normalizeSuccessResponse<boolean>(response);
  },

  /** POST /api/v1/TheaterManager/Cleaning/tasks/{taskId}/verify */
  verifyTask: async (taskId: string, data: VerifyCleaningTaskRequest): Promise<ApiSuccessResponse<boolean>> => {
    const response = await shiftAxios.post<ServerResponse<boolean>>(`/TheaterManager/Cleaning/tasks/${taskId}/verify`, data);
    return normalizeSuccessResponse<boolean>(response);
  },

  /** POST /api/v1/TheaterManager/Cleaning/{cinemaId}/generate-tasks?fromDate=&toDate= */
  generateTasks: async (cinemaId: string, fromDate: string, toDate: string): Promise<ApiSuccessResponse<number>> => {
    const response = await shiftAxios.post<ServerResponse<number>>(`/TheaterManager/Cleaning/${cinemaId}/generate-tasks`, null, {
      params: { fromDate, toDate },
    });
    return normalizeSuccessResponse<number>(response);
  },

  // ===== Staff (Janitor) =====

  /** GET /api/v1/Staff/Cleaning/my-tasks?date= */
  getMyTasks: async (date?: string): Promise<ApiSuccessResponse<CleaningTaskDto[]>> => {
    const response = await shiftAxios.get<ServerResponse<CleaningTaskDto[]>>('/Staff/Cleaning/my-tasks', { params: { date } });
    return normalizeSuccessResponse<CleaningTaskDto[]>(response);
  },

  /** POST /api/v1/Staff/Cleaning/tasks/{taskId}/start */
  startTask: async (taskId: string): Promise<ApiSuccessResponse<boolean>> => {
    const response = await shiftAxios.post<ServerResponse<boolean>>(`/Staff/Cleaning/tasks/${taskId}/start`, {});
    return normalizeSuccessResponse<boolean>(response);
  },

  /** POST /api/v1/Staff/Cleaning/tasks/{taskId}/complete */
  completeTask: async (taskId: string, data: CompleteCleaningTaskRequest): Promise<ApiSuccessResponse<boolean>> => {
    const response = await shiftAxios.post<ServerResponse<boolean>>(`/Staff/Cleaning/tasks/${taskId}/complete`, data);
    return normalizeSuccessResponse<boolean>(response);
  },
};
