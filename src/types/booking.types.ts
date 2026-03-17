// src/types/booking.types.ts

export interface CreateBookingRequest {
    scheduleId: string;
    seatIds: string[];
    customerName?: string;
    customerEmail?: string;
    customerAddress?: string;
}

export interface CreateBookingResponse {
    orderId: string;
    paymentUrl: string;
    totalPrice: number;
    totalQuantity: number;
    orderDate: string;
}

export interface PaymentEvent {
    orderId: string;
    status: "success" | "failed";
    message: string;
    transactionId?: string;
    totalPrice?: number;
}

export interface UserAccountInfo {
    userId: string;
    email: string;
    userName: string;
    identityCode: string;
    dateOfBirth: string;
    phoneNumber: string;
}

export interface BookingHistoryItem {
    orderId: string;
    orderDate: string;
    totalPrice: number;
    orderStatus: "Pending" | "Booked" | "Canceled";
    movieName: string;
    movieImageUrl: string;
    cinemaName: string;
    auditoriumNumber: string;
    startTime: string;
    seats: string[];
    isMovieAired: boolean;
    movieAiringStatus: "Upcoming" | "Airing" | "Finished";
}
