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

export const voucherApi = {
  // Admin APIs
  createVoucher: async (dto: CreateVoucherDto): Promise<ApiSuccessResponse<VoucherDto>> => {
    const response = await identityAxios.post<ApiSuccessResponse<VoucherDto>>('/admin/vouchers', dto);
    return response.data;
  },
  updateVoucher: async (id: string, dto: UpdateVoucherDto): Promise<ApiSuccessResponse<VoucherDto>> => {
    const response = await identityAxios.put<ApiSuccessResponse<VoucherDto>>(`/admin/vouchers/${id}`, dto);
    return response.data;
  },
  getAllVouchers: async (): Promise<ApiSuccessResponse<VoucherDto[]>> => {
    const response = await identityAxios.get<ApiSuccessResponse<VoucherDto[]>>('/admin/vouchers');
    return response.data;
  },
  getVoucherById: async (id: string): Promise<ApiSuccessResponse<VoucherDto>> => {
    const response = await identityAxios.get<ApiSuccessResponse<VoucherDto>>(`/admin/vouchers/${id}`);
    return response.data;
  },
  deleteVoucher: async (id: string): Promise<ApiSuccessResponse> => {
    const response = await identityAxios.delete<ApiSuccessResponse>(`/admin/vouchers/${id}`);
    return response.data;
  },

  // Public/User APIs
  getActiveVouchers: async (): Promise<ApiSuccessResponse<VoucherDto[]>> => {
    const response = await identityAxios.get<ApiSuccessResponse<VoucherDto[]>>('/public/vouchers');
    return response.data;
  },
  redeemVoucher: async (id: string): Promise<ApiSuccessResponse<UserVoucherDto>> => {
    const response = await identityAxios.post<ApiSuccessResponse<UserVoucherDto>>(`/public/vouchers/${id}/redeem`);
    return response.data;
  },
  getMyVouchers: async (): Promise<ApiSuccessResponse<UserVoucherDto[]>> => {
    const response = await identityAxios.get<ApiSuccessResponse<UserVoucherDto[]>>('/public/vouchers/my-vouchers');
    return response.data;
  }
};
