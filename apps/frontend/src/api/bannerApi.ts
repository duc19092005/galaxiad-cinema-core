import { identityAxios, publicAxios } from './axiosClient';
import type { ApiSuccessResponse } from '../types/auth.types';

export type BannerContentType = 'Fixed' | 'Trending' | 'Upcoming' | 'HotVouchers';

export interface BannerDto {
  bannerId: string;
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  linkUrl: string | null;
  contentType: BannerContentType;
  contentTypeDisplay: string;
  contentConfig: string | null;
  displayOrder: number;
  isActive: boolean;
  cinemaId: string | null;
  cinemaName: string | null;
  cinemaCity: string | null;
  scopeDisplay: string | null;
  startDisplayAt: string | null;
  endDisplayAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BannerUpsertDto {
  title: string;
  subtitle?: string | null;
  imageUrl?: string | null;
  linkUrl?: string | null;
  contentType: BannerContentType;
  contentConfig?: string | null;
  displayOrder: number;
  isActive: boolean;
  cinemaId?: string | null;
  cinemaCity?: string | null;
  startDisplayAt?: string | null;
  endDisplayAt?: string | null;
}

export interface BannerScopeDto {
  cinemas: { cinemaId: string; cinemaName: string; cinemaCity: string }[];
  cities: string[];
}

export interface CinemaBannerStatus {
  cinemaId: string;
  cinemaName: string;
  cinemaCity: string;
  bannerCount: number;
  banners: BannerDto[];
  hasOverride: boolean; // system-wide banner overrides this cinema
}

export interface BannerOverviewDto {
  systemBanners: BannerDto[];
  cinemasByCity: Record<string, CinemaBannerStatus[]>;
  allCinemas: CinemaBannerStatus[];
}

const wrapResponse = <T>(data: unknown): ApiSuccessResponse<T> => {
  if (data && typeof data === 'object' && 'isSuccess' in data) {
    return data as ApiSuccessResponse<T>;
  }
  return { isSuccess: true, message: 'Success', data: data as T };
};

export const bannerApi = {
  getAll: async (): Promise<ApiSuccessResponse<BannerDto[]>> => {
    const response = await identityAxios.get<unknown>('/admin/banners');
    return wrapResponse<BannerDto[]>(response.data);
  },
  getById: async (id: string): Promise<ApiSuccessResponse<BannerDto>> => {
    const response = await identityAxios.get<unknown>(`/admin/banners/${id}`);
    return wrapResponse<BannerDto>(response.data);
  },
  getScope: async (): Promise<ApiSuccessResponse<BannerScopeDto>> => {
    const response = await identityAxios.get<unknown>('/admin/banners/scope');
    return wrapResponse<BannerScopeDto>(response.data);
  },
  create: async (dto: BannerUpsertDto): Promise<ApiSuccessResponse<BannerDto>> => {
    const response = await identityAxios.post<unknown>('/admin/banners', dto);
    return wrapResponse<BannerDto>(response.data);
  },
  update: async (id: string, dto: BannerUpsertDto): Promise<ApiSuccessResponse<BannerDto>> => {
    const response = await identityAxios.put<unknown>(`/admin/banners/${id}`, dto);
    return wrapResponse<BannerDto>(response.data);
  },
  toggle: async (id: string): Promise<ApiSuccessResponse<BannerDto>> => {
    const response = await identityAxios.patch<unknown>(`/admin/banners/${id}/toggle`);
    return wrapResponse<BannerDto>(response.data);
  },
  delete: async (id: string): Promise<ApiSuccessResponse<null>> => {
    const response = await identityAxios.delete<unknown>(`/admin/banners/${id}`);
    return wrapResponse<null>(response.data);
  },
  getMoviesForPicker: async (status?: string): Promise<ApiSuccessResponse<any[]>> => {
    const params: Record<string, string> = {};
    if (status) params.status = status;
    const response = await identityAxios.get<unknown>('/admin/banners/picker/movies', { params });
    return wrapResponse<any[]>(response.data);
  },
  getVouchersForPicker: async (): Promise<ApiSuccessResponse<any[]>> => {
    const response = await identityAxios.get<unknown>('/admin/banners/picker/vouchers');
    return wrapResponse<any[]>(response.data);
  },
  getOverview: async (): Promise<ApiSuccessResponse<BannerOverviewDto>> => {
    const response = await identityAxios.get<unknown>('/admin/banners/overview');
    return wrapResponse<BannerOverviewDto>(response.data);
  },
  copySystemToLocal: async (cinemaIds: string[]): Promise<ApiSuccessResponse<null>> => {
    const response = await identityAxios.post<unknown>('/admin/banners/copy-to-local', { cinemaIds });
    return wrapResponse<null>(response.data);
  },
  overrideLocal: async (cinemaIds: string[]): Promise<ApiSuccessResponse<null>> => {
    const response = await identityAxios.post<unknown>('/admin/banners/override-local', { cinemaIds });
    return wrapResponse<null>(response.data);
  },
  autoGenerateAll: async (): Promise<ApiSuccessResponse<any>> => {
    const response = await identityAxios.post<unknown>('/admin/banners/auto-all');
    return wrapResponse<any>(response.data);
  },
};

export const publicBannerApi = {
  getActive: async (cinemaId?: string): Promise<ApiSuccessResponse<BannerDto[]>> => {
    const params: Record<string, string> = {};
    if (cinemaId) params.cinemaId = cinemaId;
    const response = await publicAxios.get<unknown>('/banners', { params });
    return wrapResponse<BannerDto[]>(response.data);
  },
  trackInterest: async (movieId: string): Promise<void> => {
    await publicAxios.post('/banners/track-interest', { movieId });
  },
};
