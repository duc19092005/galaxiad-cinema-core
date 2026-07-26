// src/api/adminConcessionApi.ts
import { shiftAxios } from './axiosClient';
import type { ApiSuccessResponse } from '../types/auth.types';
import type { AxiosResponse } from 'axios';
import type {
  ConcessionProductDto,
  CreateConcessionProductRequest,
  CreateComboRequest,
  UpdateConcessionProductRequest,
} from '../types/concession.types';

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

export const adminConcessionApi = {
  /** POST /api/v1/Admin/Concessions/products */
  createProduct: async (data: CreateConcessionProductRequest): Promise<ApiSuccessResponse<ConcessionProductDto>> => {
    const response = await shiftAxios.post<ServerResponse<ConcessionProductDto>>('/Admin/Concessions/products', data);
    return normalizeSuccessResponse<ConcessionProductDto>(response);
  },

  /** POST /api/v1/Admin/Concessions/combos */
  createCombo: async (data: CreateComboRequest): Promise<ApiSuccessResponse<ConcessionProductDto>> => {
    const response = await shiftAxios.post<ServerResponse<ConcessionProductDto>>('/Admin/Concessions/combos', data);
    return normalizeSuccessResponse<ConcessionProductDto>(response);
  },

  /** PUT /api/v1/Admin/Concessions/products/{productId} */
  updateProduct: async (productId: string, data: UpdateConcessionProductRequest): Promise<ApiSuccessResponse<boolean>> => {
    const response = await shiftAxios.put<ServerResponse<boolean>>(`/Admin/Concessions/products/${productId}`, data);
    return normalizeSuccessResponse<boolean>(response);
  },

  /** PATCH /api/v1/Admin/Concessions/products/{productId}/status?isActive= */
  toggleProductStatus: async (productId: string, isActive: boolean): Promise<ApiSuccessResponse<boolean>> => {
    const response = await shiftAxios.patch<ServerResponse<boolean>>(`/Admin/Concessions/products/${productId}/status`, null, {
      params: { isActive },
    });
    return normalizeSuccessResponse<boolean>(response);
  },
};
