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

export interface GenerateShowtimeRecommendationsRequest {
    cinemaId: string;
    fromDate: string;
    toDate: string;
    auditoriumId?: string | null;
    maxSuggestions?: number;
}

export interface ShowtimeRecommendationBatch {
    batchId: string;
    cinemaId: string;
    fromDate: string;
    toDate: string;
    recommendations: ShowtimeRecommendationItem[];
}

export interface ShowtimeRecommendationItem {
    recommendationId: string;
    batchId: string;
    movieId: string;
    movieName: string;
    movieImageUrl: string;
    formatId: string;
    formatName: string;
    auditoriumId: string;
    auditoriumNumber: string;
    startTime: string;
    endTime: string;
    demandLevel: 'Low' | 'Medium' | 'High' | string;
    confidenceScore: number;
    expectedImpact: string;
    status: 'Suggested' | 'Applied' | 'Dismissed' | 'Expired' | 'FailedValidation' | string;
    reasons: string[];
    appliedScheduleId?: string | null;
}

export interface RecommendationSelectionRequest {
    batchId: string;
    recommendationIds: string[];
}

export interface ApplyShowtimeRecommendationsRequest extends RecommendationSelectionRequest {
    applyValidOnly?: boolean;
}

export interface ShowtimeRecommendationPreview {
    batchId: string;
    validSuggestions: ShowtimeRecommendationValidation[];
    invalidSuggestions: ShowtimeRecommendationValidation[];
    warnings: string[];
}

export interface ShowtimeRecommendationValidation {
    recommendationId: string;
    movieName: string;
    auditoriumNumber: string;
    startTime: string;
    endTime: string;
    isValid: boolean;
    reasons: string[];
}

export interface ApplyShowtimeRecommendationsResponse {
    batchId: string;
    applied: {
        recommendationId: string;
        scheduleId: string;
        movieName: string;
        auditoriumNumber: string;
        startTime: string;
        endTime: string;
    }[];
    failed: ShowtimeRecommendationValidation[];
}
