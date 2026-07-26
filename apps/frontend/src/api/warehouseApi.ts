// src/api/warehouseApi.ts
import { shiftAxios } from './axiosClient';
import type { ApiSuccessResponse } from '../types/auth.types';
import type { AxiosResponse } from 'axios';
import type {
  StockRequestDto,
  ReqApproveStockRequest,
  ReqRejectStockRequest,
  StockRequestStatus,
} from '../types/stockRequest.types';
import type {
  WasteReportDto,
  ReqReviewWasteReport,
  WasteReportStatus,
} from '../types/wasteReport.types';

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

export const warehouseApi = {
  // ===== Stock Requests =====

  /** GET /api/v1/WarehouseManager/StockRequests */
  getStockRequests: async (cinemaId?: string, status?: StockRequestStatus): Promise<ApiSuccessResponse<StockRequestDto[]>> => {
    const response = await shiftAxios.get<ServerResponse<StockRequestDto[]>>('/WarehouseManager/StockRequests', {
      params: { cinemaId, status },
    });
    return normalizeSuccessResponse<StockRequestDto[]>(response);
  },

  /** POST /api/v1/WarehouseManager/StockRequests/{id}/approve */
  approveStockRequest: async (id: string, data: ReqApproveStockRequest): Promise<ApiSuccessResponse<StockRequestDto>> => {
    const response = await shiftAxios.post<ServerResponse<StockRequestDto>>(`/WarehouseManager/StockRequests/${id}/approve`, data);
    return normalizeSuccessResponse<StockRequestDto>(response);
  },

  /** POST /api/v1/WarehouseManager/StockRequests/{id}/reject */
  rejectStockRequest: async (id: string, data: ReqRejectStockRequest): Promise<ApiSuccessResponse<StockRequestDto>> => {
    const response = await shiftAxios.post<ServerResponse<StockRequestDto>>(`/WarehouseManager/StockRequests/${id}/reject`, data);
    return normalizeSuccessResponse<StockRequestDto>(response);
  },

  /** POST /api/v1/WarehouseManager/StockRequests/{id}/ship */
  shipStockRequest: async (id: string): Promise<ApiSuccessResponse<StockRequestDto>> => {
    const response = await shiftAxios.post<ServerResponse<StockRequestDto>>(`/WarehouseManager/StockRequests/${id}/ship`);
    return normalizeSuccessResponse<StockRequestDto>(response);
  },

  // ===== Waste Reports =====

  /** GET /api/v1/WarehouseManager/WasteReports */
  getWasteReports: async (cinemaId?: string, status?: WasteReportStatus): Promise<ApiSuccessResponse<WasteReportDto[]>> => {
    const response = await shiftAxios.get<ServerResponse<WasteReportDto[]>>('/WarehouseManager/WasteReports', {
      params: { cinemaId, status },
    });
    return normalizeSuccessResponse<WasteReportDto[]>(response);
  },

  /** POST /api/v1/WarehouseManager/WasteReports/{id}/review */
  reviewWasteReport: async (id: string, data: ReqReviewWasteReport): Promise<ApiSuccessResponse<WasteReportDto>> => {
    const response = await shiftAxios.post<ServerResponse<WasteReportDto>>(`/WarehouseManager/WasteReports/${id}/review`, data);
    return normalizeSuccessResponse<WasteReportDto>(response);
  },
};
