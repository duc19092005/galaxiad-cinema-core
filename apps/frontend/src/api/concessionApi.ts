// src/api/concessionApi.ts
import { shiftAxios } from './axiosClient';
import type { ApiSuccessResponse } from '../types/auth.types';
import type { AxiosResponse } from 'axios';
import type {
  ConcessionProductDto,
  ConcessionMenuItemDto,
  SellConcessionPosRequest,
  CheckConcessionStockRequest,
  ConcessionSaleResultDto,
  ConcessionStockCheckResultDto,
  InventoryStatusDto,
  InventoryTransactionDto,
  InventoryHistoryFilter,
} from '../types/concession.types';
import type {
  StockRequestDto,
  ReqCreateStockRequest,
  ReqReceiveStockRequest,
  StockRequestStatus,
} from '../types/stockRequest.types';
import type {
  WasteReportDto,
  ReqCreateWasteReport,
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

export const concessionApi = {
  /** Public online menu used by the customer booking flow. */
  getPublicMenu: async (cinemaId: string): Promise<ApiSuccessResponse<ConcessionMenuItemDto[]>> => {
    const response = await shiftAxios.get<ServerResponse<ConcessionMenuItemDto[]>>(`/Public/Concessions/${cinemaId}/menu`);
    return normalizeSuccessResponse<ConcessionMenuItemDto[]>(response);
  },

  // ===== Theater Manager: read-only catalog & inventory =====

  /** GET /api/v1/TheaterManager/Concessions/{cinemaId}/products */
  getProducts: async (cinemaId: string): Promise<ApiSuccessResponse<ConcessionProductDto[]>> => {
    const response = await shiftAxios.get<ServerResponse<ConcessionProductDto[]>>(`/TheaterManager/Concessions/${cinemaId}/products`);
    return normalizeSuccessResponse<ConcessionProductDto[]>(response);
  },

  /** GET /api/v1/TheaterManager/Concessions/{cinemaId}/inventory */
  getInventoryStatus: async (cinemaId: string): Promise<ApiSuccessResponse<InventoryStatusDto[]>> => {
    const response = await shiftAxios.get<ServerResponse<InventoryStatusDto[]>>(`/TheaterManager/Concessions/${cinemaId}/inventory`);
    return normalizeSuccessResponse<InventoryStatusDto[]>(response);
  },

  /** GET /api/v1/TheaterManager/Concessions/{cinemaId}/inventory/history */
  getInventoryHistory: async (cinemaId: string, filter: InventoryHistoryFilter): Promise<ApiSuccessResponse<InventoryTransactionDto[]>> => {
    const response = await shiftAxios.get<ServerResponse<InventoryTransactionDto[]>>(`/TheaterManager/Concessions/${cinemaId}/inventory/history`, {
      params: filter,
    });
    return normalizeSuccessResponse<InventoryTransactionDto[]>(response);
  },

  // ===== Theater Manager: Stock Requests =====

  /** POST /api/v1/TheaterManager/Concessions/stock-requests */
  createStockRequest: async (data: ReqCreateStockRequest): Promise<ApiSuccessResponse<StockRequestDto>> => {
    const response = await shiftAxios.post<ServerResponse<StockRequestDto>>('/TheaterManager/Concessions/stock-requests', data);
    return normalizeSuccessResponse<StockRequestDto>(response);
  },

  /** GET /api/v1/TheaterManager/Concessions/{cinemaId}/stock-requests */
  getStockRequests: async (cinemaId: string, status?: StockRequestStatus): Promise<ApiSuccessResponse<StockRequestDto[]>> => {
    const response = await shiftAxios.get<ServerResponse<StockRequestDto[]>>(`/TheaterManager/Concessions/${cinemaId}/stock-requests`, {
      params: { status },
    });
    return normalizeSuccessResponse<StockRequestDto[]>(response);
  },

  /** POST /api/v1/TheaterManager/Concessions/stock-requests/{id}/receive */
  receiveStockRequest: async (id: string, data: ReqReceiveStockRequest): Promise<ApiSuccessResponse<StockRequestDto>> => {
    const response = await shiftAxios.post<ServerResponse<StockRequestDto>>(`/TheaterManager/Concessions/stock-requests/${id}/receive`, data);
    return normalizeSuccessResponse<StockRequestDto>(response);
  },

  // ===== Theater Manager: Waste Reports =====

  /** POST /api/v1/TheaterManager/Concessions/waste-reports */
  createWasteReport: async (data: ReqCreateWasteReport): Promise<ApiSuccessResponse<WasteReportDto>> => {
    const response = await shiftAxios.post<ServerResponse<WasteReportDto>>('/TheaterManager/Concessions/waste-reports', data);
    return normalizeSuccessResponse<WasteReportDto>(response);
  },

  /** GET /api/v1/TheaterManager/Concessions/{cinemaId}/waste-reports */
  getWasteReports: async (cinemaId: string, status?: WasteReportStatus): Promise<ApiSuccessResponse<WasteReportDto[]>> => {
    const response = await shiftAxios.get<ServerResponse<WasteReportDto[]>>(`/TheaterManager/Concessions/${cinemaId}/waste-reports`, {
      params: { status },
    });
    return normalizeSuccessResponse<WasteReportDto[]>(response);
  },

  // ===== Staff POS =====

  /** GET /api/v1/Staff/Pos/{cinemaId}/menu */
  getMenu: async (cinemaId: string): Promise<ApiSuccessResponse<ConcessionMenuItemDto[]>> => {
    const response = await shiftAxios.get<ServerResponse<ConcessionMenuItemDto[]>>(`/Staff/Pos/${cinemaId}/menu`);
    return normalizeSuccessResponse<ConcessionMenuItemDto[]>(response);
  },

  /** POST /api/v1/Staff/Pos/stock-check */
  checkStock: async (data: CheckConcessionStockRequest): Promise<ApiSuccessResponse<ConcessionStockCheckResultDto>> => {
    const response = await shiftAxios.post<ServerResponse<ConcessionStockCheckResultDto>>('/Staff/Pos/stock-check', data);
    return normalizeSuccessResponse<ConcessionStockCheckResultDto>(response);
  },

  /** POST /api/v1/Staff/Pos/sell */
  sell: async (data: SellConcessionPosRequest): Promise<ApiSuccessResponse<ConcessionSaleResultDto>> => {
    const response = await shiftAxios.post<ServerResponse<ConcessionSaleResultDto>>('/Staff/Pos/sell', data);
    return normalizeSuccessResponse<ConcessionSaleResultDto>(response);
  },
};
