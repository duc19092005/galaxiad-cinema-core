// src/api/voucherApi.ts
import { identityAxios } from './axiosClient';
import type { ApiSuccessResponse } from '../types/auth.types';

export interface VoucherDto {
  voucherId: string;
  voucherName: string;
  voucherDescription: string;
  voucherAmount: number;
  voucherDiscountPercent: number;
  roleId: string;
  roleName: string;
  validFrom: string | null;
  validTo: string | null;
  voucherPointsCost: number;
  voucherQuantity: number;
  remainingQuantity: number;
  isActive: boolean;
}

export interface CreateVoucherDto {
  voucherName: string;
  voucherDescription: string;
  voucherAmount: number;
  voucherDiscountPercent: number;
  roleId: string;
  validFrom: string | null;
  validTo: string | null;
  voucherPointsCost: number;
  voucherQuantity: number;
}

export interface UpdateVoucherDto {
  voucherName: string;
  voucherDescription: string;
  voucherAmount: number;
  voucherDiscountPercent: number;
  roleId: string;
  validFrom: string | null;
  validTo: string | null;
  voucherPointsCost: number;
  voucherQuantity: number;
}

export interface UserVoucherDto {
  userVoucherId: string;
  userId: string;
  voucherId: string;
  voucherName: string;
  voucherDescription: string;
  voucherDiscountPercent: number;
  isUsed: boolean;
  purchasedAt: string;
  usedAt: string | null;
  validFrom: string | null;
  validTo: string | null;
}

const wrapResponse = <T>(data: any): ApiSuccessResponse<T> => {
  if (data && typeof data === 'object' && 'isSuccess' in data) {
    return data as ApiSuccessResponse<T>;
  }
  return {
    isSuccess: true,
    message: 'Success',
    data: data as T
  };
};

export const voucherApi = {
  // Admin APIs
  createVoucher: async (dto: CreateVoucherDto): Promise<ApiSuccessResponse<VoucherDto>> => {
    const response = await identityAxios.post<any>('/admin/vouchers', dto);
    return wrapResponse<VoucherDto>(response.data);
  },
  updateVoucher: async (id: string, dto: UpdateVoucherDto): Promise<ApiSuccessResponse<VoucherDto>> => {
    const response = await identityAxios.put<any>(`/admin/vouchers/${id}`, dto);
    return wrapResponse<VoucherDto>(response.data);
  },
  getAllVouchers: async (): Promise<ApiSuccessResponse<VoucherDto[]>> => {
    const response = await identityAxios.get<any>('/admin/vouchers');
    return wrapResponse<VoucherDto[]>(response.data);
  },
  getVoucherById: async (id: string): Promise<ApiSuccessResponse<VoucherDto>> => {
    const response = await identityAxios.get<any>(`/admin/vouchers/${id}`);
    return wrapResponse<VoucherDto>(response.data);
  },
  deleteVoucher: async (id: string): Promise<ApiSuccessResponse> => {
    const response = await identityAxios.delete<any>(`/admin/vouchers/${id}`);
    if (response.status === 204 || !response.data) {
      return {
        isSuccess: true,
        message: 'Deleted successfully',
        data: null
      };
    }
    return wrapResponse<any>(response.data);
  },

  // Public/User APIs
  getActiveVouchers: async (): Promise<ApiSuccessResponse<VoucherDto[]>> => {
    const response = await identityAxios.get<any>('/public/vouchers');
    return wrapResponse<VoucherDto[]>(response.data);
  },
  redeemVoucher: async (id: string): Promise<ApiSuccessResponse<UserVoucherDto>> => {
    const response = await identityAxios.post<any>(`/public/vouchers/${id}/redeem`);
    return wrapResponse<UserVoucherDto>(response.data);
  },
  getMyVouchers: async (): Promise<ApiSuccessResponse<UserVoucherDto[]>> => {
    const response = await identityAxios.get<any>('/public/vouchers/my-vouchers');
    return wrapResponse<UserVoucherDto[]>(response.data);
  }
};
