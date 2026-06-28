import { identityAxios } from './axiosClient';
import type { ApiSuccessResponse } from '../types/auth.types';

export type PromotionTypeName = 'FixedTicketPrice' | 'PercentDiscount' | 'FixedDiscount' | 'Surcharge';

export interface PricingPromotionOptionDto {
  id: string;
  name: string;
}

export interface PricingPromotionOptionsDto {
  formats: PricingPromotionOptionDto[];
  cinemas: PricingPromotionOptionDto[];
  auditoriums: PricingPromotionOptionDto[];
  membershipTiers: PricingPromotionOptionDto[];
}

export interface PricingPromotionRuleDto {
  pricingPromotionRuleId: string;
  movieFormatId: string | null;
  movieFormatName: string | null;
  cinemaId: string | null;
  cinemaName: string | null;
  auditoriumId: string | null;
  auditoriumName: string | null;
  requiredMembershipTierId: string | null;
  requiredMembershipTierName: string | null;
  promotionType: number | string;
  promotionTypeName: PromotionTypeName | string;
  adjustmentValue: number;
  startDate: string | null;
  endDate: string | null;
  timeFrom: string | null;
  timeTo: string | null;
  daysOfWeek: string[];
  daysOfWeekText: string;
  priority: number;
  isActive: boolean;
}

export interface PricingPromotionDto {
  pricingPromotionId: string;
  name: string;
  slug: string;
  title: string;
  shortDescription: string | null;
  description: string | null;
  termsAndConditions: string | null;
  imageUrl: string | null;
  isActive: boolean;
  excludeHolidays: boolean;
  startDate: string | null;
  endDate: string | null;
  rules: PricingPromotionRuleDto[];
}

export interface PricingPromotionRuleRequestDto {
  pricingPromotionRuleId?: string | null;
  movieFormatIds?: string[];
  cinemaIds?: string[];
  promotionType: PromotionTypeName;
  adjustmentValue: number;
  startDate?: string | null;
  endDate?: string | null;
  timeFrom?: string | null;
  timeTo?: string | null;
  daysOfWeek: string[];
  priority: number;
  isActive: boolean;
}

export interface PricingPromotionUpsertDto {
  name: string;
  slug?: string | null;
  title: string;
  shortDescription?: string | null;
  description?: string | null;
  termsAndConditions?: string | null;
  imageUrl?: string | null;
  isActive: boolean;
  excludeHolidays: boolean;
  startDate?: string | null;
  endDate?: string | null;
  rules: PricingPromotionRuleRequestDto[];
}

const wrapResponse = <T>(data: unknown): ApiSuccessResponse<T> => {
  if (data && typeof data === 'object' && 'isSuccess' in data) {
    return data as ApiSuccessResponse<T>;
  }

  return {
    isSuccess: true,
    message: 'Success',
    data: data as T,
  };
};

export const pricingPromotionApi = {
  getAll: async (): Promise<ApiSuccessResponse<PricingPromotionDto[]>> => {
    const response = await identityAxios.get<unknown>('/admin/pricing-promotions');
    return wrapResponse<PricingPromotionDto[]>(response.data);
  },
  getById: async (id: string): Promise<ApiSuccessResponse<PricingPromotionDto>> => {
    const response = await identityAxios.get<unknown>(`/admin/pricing-promotions/${id}`);
    return wrapResponse<PricingPromotionDto>(response.data);
  },
  getOptions: async (): Promise<ApiSuccessResponse<PricingPromotionOptionsDto>> => {
    const response = await identityAxios.get<unknown>('/admin/pricing-promotions/options');
    return wrapResponse<PricingPromotionOptionsDto>(response.data);
  },
  create: async (dto: PricingPromotionUpsertDto): Promise<ApiSuccessResponse<PricingPromotionDto>> => {
    const response = await identityAxios.post<unknown>('/admin/pricing-promotions', dto);
    return wrapResponse<PricingPromotionDto>(response.data);
  },
  update: async (id: string, dto: PricingPromotionUpsertDto): Promise<ApiSuccessResponse<PricingPromotionDto>> => {
    const response = await identityAxios.put<unknown>(`/admin/pricing-promotions/${id}`, dto);
    return wrapResponse<PricingPromotionDto>(response.data);
  },
  toggle: async (id: string): Promise<ApiSuccessResponse<PricingPromotionDto>> => {
    const response = await identityAxios.patch<unknown>(`/admin/pricing-promotions/${id}/toggle`);
    return wrapResponse<PricingPromotionDto>(response.data);
  },
  delete: async (id: string): Promise<ApiSuccessResponse<null>> => {
    const response = await identityAxios.delete<unknown>(`/admin/pricing-promotions/${id}`);
    return wrapResponse<null>(response.data);
  },
};
