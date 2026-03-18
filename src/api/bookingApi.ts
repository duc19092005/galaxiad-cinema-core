// src/api/bookingApi.ts
import { bookingAxios, API_BASE_URL } from './axiosClient';
import type { ApiSuccessResponse } from '../types/auth.types';
import type { CreateBookingRequest, CreateBookingResponse, UserAccountInfo, BookingHistoryItem, TicketInfo } from '../types/booking.types';

export const bookingApi = {
    /** 7. Create Booking Order */
    createBooking: async (data: CreateBookingRequest): Promise<ApiSuccessResponse<CreateBookingResponse>> => {
        const response = await bookingAxios.post<ApiSuccessResponse<CreateBookingResponse>>(
            `/create`,
            data
        );
        return response.data;
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

