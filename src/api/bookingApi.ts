// src/api/bookingApi.ts
import { bookingAxios } from './axiosClient';
import type { ApiSuccessResponse } from '../types/auth.types';
import type { CreateBookingRequest, CreateBookingResponse, UserAccountInfo, BookingHistoryItem } from '../types/booking.types';

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

    /** 9. SSE Realtime Payment Status setup URL helper 
     * Since SSE is consumed via EventSource, returning the URL is useful.
     */
    getPaymentStatusUrl: (orderId: string): string => {
        return `http://localhost:5032/api/v1/booking/payment-status/${orderId}`;
    }
};
