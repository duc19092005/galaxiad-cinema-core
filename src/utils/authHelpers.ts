// src/utils/authHelpers.ts
// Helper functions để verify authentication với HttpOnly cookie

import axios from 'axios';
import { authApi } from '../api/authApi';
import type { ApiErrorResponse } from '../types/auth.types';
import Cookies from 'js-cookie';

/**
 * Verify authentication bằng cách gọi API get-profile
 * Cookie HttpOnly sẽ tự động được gửi với request
 */
export const verifyAuth = async (): Promise<boolean> => {
  try {
    await authApi.getProfile();
    return true;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      const data = error.response.data as ApiErrorResponse;
      if (data.statusCode === 401) {
        return false;
      }
    }
    // Nếu không phải 401, có thể là lỗi network hoặc server
    return true;
  }
};

/**
 * Verify authentication và lấy user info từ API get-profile
 * Nếu chưa đăng nhập (401), sẽ return null để redirect về login
 */
export const verifyAuthAndGetUser = async (): Promise<{ userId?: string; username: string; roles: string[] } | null> => {
  try {
    const response = await authApi.getProfile();

    if (response.isSuccess && response.data) {
      // Profile API trả về userId và username
      const userData = {
        userId: response.data.userId,
        username: response.data.username,
        roles: response.data.roles,
      };
      // Cập nhật localStorage với thông tin mới nhất từ server
      localStorage.setItem('user_info', JSON.stringify(userData));
      return userData;
    }

    localStorage.removeItem('user_info');
    return null;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      const data = error.response.data as ApiErrorResponse;
      if (data.statusCode === 401) {
        localStorage.removeItem('user_info');
        return null;
      }
    }

    localStorage.removeItem('user_info');
    Cookies.remove('X-Access-Token');
    return null;
  }
};
