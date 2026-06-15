// src/types/facilities.types.ts

// =============================================
// CINEMA TYPES
// =============================================

export interface Cinema {
    cinemaId: string;
    cinemaName: string;
    cinemaDescription: string;
    cinemaHotlineNumber: string;
    cinemaLocation: string;
    cinemaCity?: string;
    latitude?: number;
    longitude?: number;
    totalRooms: number;
    theaterManagerId?: string | null;
    theaterManagerName?: string | null;
    facilitiesManagerName?: string | null;
}

export interface CreateCinemaRequest {
    cinemaLocation: string;
    cinemaName: string;
    cinemaHotlineNumber: string;
    cinemaDescription: string;
    cinemaCity: string;
    activeAt?: string | null; // ISO datetime string
}

export interface UpdateCinemaRequest {
    cinemaLocation?: string;
    cinemaName?: string;
    cinemaHotlineNumber?: string;
    cinemaDescription?: string;
    cinemaCity?: string;
    activeAt?: string | null;
}

// =============================================
// AUDITORIUM TYPES
// =============================================

export interface FormatInfo {
    formatName: string;
    formatId: string;
}

export interface SeatInfo {
    seatNumber: string;
    coordX: number;
    coordY: number;
    colIndex: number;
    rowIndex: number;
}

/** Auditorium list item (from GET /api/facilities/auditorium) */
export interface Auditorium {
    auditoriumId: string;
    auditoriumNumber: string;
    formatInfos: FormatInfo[];
    cinemaName: string;
    totalSeats: number;
}

/** Auditorium detail (from GET /api/facilities/auditorium/{id}) */
export interface AuditoriumDetail extends Auditorium {
    seatsInfos: SeatInfo[];
}

export interface CreateAuditoriumRequest {
    auditoriumNumber: string;
    movieFormatId: string[]; // Array of format IDs
    cinemaId: string;
    addReqSeatsAuditoriumDto: SeatInfo[];
}

export interface UpdateAuditoriumRequest {
    auditoriumNumber?: string;
    cinemaId?: string;
    formatInfos?: string[]; // Array of format IDs
    addReqSeatsAuditoriumDto?: SeatInfo[];
}

// =============================================
// MOVIE FORMAT TYPES
// =============================================

// =============================================
// MOVIE FORMAT TYPES
// =============================================

export interface MovieFormat {
    formatId: string;
    formatName: string;
    formatDescription: string;
    movieFormatPrice: number;
}

// =============================================
// DEPARTMENT (PHÒNG BAN THU NGÂN) TYPES
// =============================================

export type CashierDepartmentType = 'TicketPOS' | 'FoodPOS';

export interface Department {
    departmentId: string;
    cinemaId: string;
    cinemaName: string;
    departmentName: string;
    departmentType: CashierDepartmentType;
    sharedUserId: string | null;
    sharedUserEmail: string | null;
    isActive: boolean;
}

export interface CreateDepartmentRequest {
    cinemaId: string;
    departmentName: string;
    departmentType: CashierDepartmentType;
}

export interface UpdateDepartmentRequest {
    departmentName?: string;
    isActive?: boolean;
}
