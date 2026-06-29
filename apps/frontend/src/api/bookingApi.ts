// src/api/bookingApi.ts
import { bookingAxios, API_BASE_URL } from './axiosClient';
import type { ApiSuccessResponse } from '../types/auth.types';
import type { BookingCustomerLookup, CreateBookingRequest, CreateBookingResponse, UserAccountInfo, BookingHistoryItem, TicketInfo } from '../types/booking.types';

const normalizeSuccessResponse = <T = any>(response: any): ApiSuccessResponse<T> => ({
    isSuccess: response.data?.isSuccess ?? response.data?.IsSuccess ?? (response.status >= 200 && response.status < 300),
    message: response.data?.message ?? response.data?.Message ?? 'Success',
    data: response.data?.data ?? response.data?.Data,
});

export const bookingApi = {
    /** 7. Create Booking Order */
    createBooking: async (data: CreateBookingRequest): Promise<ApiSuccessResponse<CreateBookingResponse>> => {
        const response = await bookingAxios.post<any>(
            `/create`,
            data
        );
        return normalizeSuccessResponse<CreateBookingResponse>(response);
    },

    /** Get user information */
    getAccountInfo: async (): Promise<ApiSuccessResponse<UserAccountInfo>> => {
        const response = await bookingAxios.get<ApiSuccessResponse<UserAccountInfo>>(
            `/account-info`
        );
        return response.data;
    },

    /** Get booking history */
    getBookingHistory: async (): Promise<ApiSuccessResponse<BookingHistoryItem[]>> => {
        const response = await bookingAxios.get<ApiSuccessResponse<BookingHistoryItem[]>>(
            `/history`
        );
        return response.data;
    },

    lookupCustomerByEmail: async (email: string): Promise<ApiSuccessResponse<BookingCustomerLookup | null>> => {
        const response = await bookingAxios.get<any>(`/customer-lookup`, { params: { email } });
        return normalizeSuccessResponse<BookingCustomerLookup | null>(response);
    },

    /** SSE Realtime Payment Status setup URL helper */
    getPaymentStatusUrl: (orderId: string): string => {
        return `${API_BASE_URL}/api/v1/booking/payment-status/${orderId}`;
    },

    /** Get ticket info */
    getTicketInfo: async (orderId: string): Promise<ApiSuccessResponse<TicketInfo>> => {
        const response = await bookingAxios.get<ApiSuccessResponse<TicketInfo>>(
            `/ticket/${orderId}`
        );
        return response.data;
    },

    /** Get ticket download URL */
    getTicketDownloadUrl: (orderId: string): string => {
        return `${API_BASE_URL}/api/v1/booking/ticket/${orderId}/download`;
    }
};

