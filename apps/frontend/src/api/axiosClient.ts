import axios from 'axios';
import Cookies from 'js-cookie';

// In Production (Vercel): empty string → requests go to same-origin /api/... → proxied by vercel.json rewrites
// In Development: fallback to localhost:5032
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const isProtectedPath = (pathname: string): boolean => {
  const protectedPrefixes = [
    '/role-selection',
    '/cashier',
    '/staff',
    '/admin',
    '/movie-manager',
    '/theater-manager',
    '/facilities-manager',
    '/schedule',
    '/account',
  ];
  return protectedPrefixes.some((prefix) =>
    pathname === prefix || pathname.startsWith(prefix + '/')
  );
};

/**
 * Factory to create standardized Axios instances with language,
 * auth token injection, and centralized error/401 handling.
 */
export const createApiClient = (path: string, timeout = 10000) => {
  const instance = axios.create({
    baseURL: `${API_BASE_URL}${path}`,
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: true,
    timeout,
  });

  // Request interceptor: language + auth token injection
  instance.interceptors.request.use(
    (config) => {
      const currentLanguage = localStorage.getItem('language') || 'en';
      config.headers['Accept-Language'] = currentLanguage;
      config.headers['X-Language'] = currentLanguage;

      const token = Cookies.get('X-Access-Token');
      if (token && !config.headers['Authorization']) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }

      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor: handle 401 globally
  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        localStorage.removeItem('user_info');
        Cookies.remove('X-Access-Token');
        const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
        if (isProtectedPath(currentPath) && currentPath !== '/login') {
          window.location.href = '/login';
        }
      }
      return Promise.reject(error);
    }
  );

  return instance;
};

/**
 * Axios instance for Identity Access APIs
 * Base URL: {API_BASE_URL}/api/v1
 */
export const identityAxios = createApiClient('/api/v1', 10000);

/**
 * Axios instance for Facilities Manager APIs
 * Base URL: {API_BASE_URL}/api
 */
export const facilitiesAxios = createApiClient('/api', 10000);

/**
 * Axios instance for Movie Manager APIs
 * Base URL: {API_BASE_URL}/api
 */
export const movieAxios = createApiClient('/api', 30000);

/**
 * Axios instance for Theater Manager APIs
 * Base URL: {API_BASE_URL}/api
 */
export const theaterAxios = createApiClient('/api', 10000);

/**
 * Axios instance for Booking APIs
 * Base URL: {API_BASE_URL}/api/v1/booking
 */
export const bookingAxios = createApiClient('/api/v1/booking', 10000);

/**
 * Axios instance for Staff and Theater Manager Shift APIs
 * Base URL: {API_BASE_URL}/api/v1
 */
export const shiftAxios = createApiClient('/api/v1', 10000);

/**
 * Axios instance for Public APIs
 * Base URL: {API_BASE_URL}/api/v1/Public
 */
export const publicAxios = createApiClient('/api/v1/Public', 10000);

// Default export for backward compatibility
export default identityAxios;

