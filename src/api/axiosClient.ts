import axios from 'axios';
import Cookies from 'js-cookie';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5032';

/**
 * Axios instance for Identity Access APIs
 * Base URL: {API_BASE_URL}/api/v1
 */
export const identityAxios = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true,
  timeout: 10000,
});

/**
 * Axios instance for Facilities Manager APIs
 * Base URL: {API_BASE_URL}/api
 */
export const facilitiesAxios = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true,
  timeout: 10000,
});

/**
 * Axios instance for Movie Manager APIs
 * Base URL: {API_BASE_URL}/api
 */
export const movieAxios = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true,
  timeout: 30000, // Longer timeout for file uploads
});

/**
 * Axios instance for Theater Manager APIs
 * Base URL: {API_BASE_URL}/api
 */
export const theaterAxios = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true,
  timeout: 10000,
});

// =============================================
// SHARED INTERCEPTORS
// =============================================

/**
 * Axios instance for Booking APIs
 * Base URL: {API_BASE_URL}/api/v1/booking
 */
export const bookingAxios = axios.create({
  baseURL: `${API_BASE_URL}/api/v1/booking`,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true,
  timeout: 10000,
});

/**
 * Axios instance for Public APIs
 * Base URL: {API_BASE_URL}/api/v1/public
 * Notice: No withCredentials since it is public, but you can include interceptors for Language
 */
export const publicAxios = axios.create({
  baseURL: `${API_BASE_URL}/api/v1/public`,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true,
  timeout: 10000,
});

const allInstances = [identityAxios, facilitiesAxios, movieAxios, theaterAxios, bookingAxios, publicAxios];

allInstances.forEach((instance) => {
  // Request interceptor — attach language header
  instance.interceptors.request.use(
    (config) => {
      // Priority 1: Get from localStorage (set by i18n.on('languageChanged'))
      // Priority 2: Default to 'vi' as requested in guidelines
      const currentLanguage = localStorage.getItem('language') || 'vi';

      // Traditional header
      config.headers['Accept-Language'] = currentLanguage;

      // Custom header for backend translation engine
      config.headers['X-Language'] = currentLanguage;

      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor — handle 401 globally
  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        // Token expired or invalid — clear local storage and cookies
        localStorage.removeItem('user_info');
        Cookies.remove('X-Access-Token');
        // Redirect to login if not already there
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
      return Promise.reject(error);
    }
  );
});

// Default export for backward compatibility
export default identityAxios;