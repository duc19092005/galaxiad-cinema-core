// src/types/booking.types.ts

export interface SeatSelection {
    seatId: string;
    userSegmentId: string;
}

export interface CreateBookingRequest {
    scheduleId: string;
    seatSelections: SeatSelection[];
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
    customerAddress?: string;
}

export interface CreateBookingResponse {
    orderId: string;
    paymentUrl: string;
    totalPrice: number;
    totalQuantity: number;
    orderDate: string;
}

export interface TicketSeat {
    seatNumber: string;
    segmentName: string;
    priceEach: number;
}

export interface TicketInfo {
    orderId: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    customerAddress: string;
    movieName: string;
    movieImageUrl: string;
    cinemaName: string;
    cinemaAddress: string;
    auditoriumNumber: string;
    formatName: string;
    showTime: string;
    endedTime: string;
    orderDate: string;
    totalPrice: number;
    vnPayTransactionId: string;
    seats: TicketSeat[];
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
