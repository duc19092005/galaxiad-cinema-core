// src/types/schedule.types.ts

// =============================================
// SCHEDULE TYPES (Theater Manager)
// =============================================

/** A single schedule slot for the API payload */
export interface ScheduleSlot {
    scheduleId: string; // Empty GUID "00000000-0000-0000-0000-000000000000" for new slots
    movieId: string;
    formatId: string;
    startedDate: string; // ISO datetime
}

/** POST /api/TheaterManager/MovieSchedules */
export interface CreateScheduleRequest {
    auditoriumId: string;
    slots: ScheduleSlot[];
}

export interface UpdateScheduleRequest {
    slots: ScheduleSlot[];
}

export interface MovieWithFormat {
    movieId: string;
    movieName: string;
    formatId: string;
    formatName: string;
    formatVersion: string;
    formatCaption: string;
}

export interface MyAuditorium {
    auditoriumId: string;
    auditoriumNumber: number;
    totalSeats: number;
    formats?: {
        formatId: string;
        formatName: string;
    }[];
    // Legacy alias (kept for backward compatibility)
    formatInfos?: {
        formatId: string;
        formatName: string;
    }[];
}

export interface MyCinemaAuditoriums {
    cinemaName: string;
    auditoriums: MyAuditorium[];
}

export interface ScheduleDetail {
    scheduleId: string;
    movieId: string;
    movieName: string;
    formatId: string;
    formatName: string;
    auditoriumId: string;
    startedDate: string;
    endedTime: string; // From API docs
    isDeleted: boolean;
}
