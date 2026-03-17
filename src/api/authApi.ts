// src/api/authApi.ts
import { identityAxios } from './axiosClient';
import type {
  RegisterRequest,
  LoginRequest,
  ChangePasswordRequest,
  UpdateProfileRequest,
  ApiSuccessResponse,
  UserLoginData,
  UserProfileData,
  LogoutResponse,
} from '../types/auth.types';

export const authApi = {
  /** POST /api/v1/IdentityAccess/regular-register */
  regularRegister: async (data: RegisterRequest): Promise<ApiSuccessResponse> => {
    const response = await identityAxios.post<ApiSuccessResponse>(
      '/IdentityAccess/regular-register',
      data
    );
    return response.data;
  },

  /** POST /api/v1/IdentityAccess/regular-login */
  regularLogin: async (data: LoginRequest): Promise<ApiSuccessResponse<UserLoginData>> => {
    const response = await identityAxios.post<ApiSuccessResponse<UserLoginData>>(
      '/IdentityAccess/regular-login',
      data
    );
    return response.data;
  },

  /** POST /api/v1/IdentityAccess/Logout */
  logout: async (): Promise<LogoutResponse> => {
    const response = await identityAxios.post<LogoutResponse>('/IdentityAccess/Logout');
    return response.data;
  },

  /** GET /api/v1/IdentityAccess/get-profile */
  getProfile: async (): Promise<ApiSuccessResponse<UserProfileData>> => {
    const response = await identityAxios.get<ApiSuccessResponse<UserProfileData>>(
      '/IdentityAccess/get-profile'
    );
    return response.data;
  },

  /** PUT /api/v1/IdentityAccess/update-profile */
  updateProfile: async (data: UpdateProfileRequest): Promise<ApiSuccessResponse> => {
    const response = await identityAxios.put<ApiSuccessResponse>(
      '/IdentityAccess/update-profile',
      data
    );
    return response.data;
  },

  /** POST /api/v1/IdentityAccess/change-password */
  changePassword: async (data: ChangePasswordRequest): Promise<ApiSuccessResponse> => {
    const response = await identityAxios.post<ApiSuccessResponse>(
      '/IdentityAccess/change-password',
      data
    );
    return response.data;
  },
};