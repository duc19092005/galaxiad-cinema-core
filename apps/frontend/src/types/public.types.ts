// src/types/public.types.ts

export interface PublicMovieListItem {
    isCommingSoon: boolean;
    movieId: string;
    movieName: string;
    moviePosterURL: string;
    movieBannerURL?: string;
    movieFormatInfos: string;
    movieDuration: number;
    movieRequiredAge: string;
    movieCategoryInfos: string;
    releaseDate?: string;
    expectedReleaseDate?: string;
    startedDate?: string;
}

export interface PaginatedResponse<T> {
    items: T[];
    totalCount: number;
    pageIndex: number;
    pageSize: number;
    totalPages: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
}

export interface PublicMovieDetail extends PublicMovieListItem {
    trailerUrl?: string;
    director: string;
    actor: string;
    movieDescription: string;
    movieBannerURL?: string;
}

export interface PublicCity {
    cityName: string;
    cinemaCount: number;
}

export interface PublicShowtime {
    scheduleId: string;
    startTime: string;
    auditoriumNumber: string;
}

export interface PublicFormatShowtimes {
    formatId: string;
    formatName: string;
    showtimes: PublicShowtime[];
}

export interface PublicCinemaShowtimes {
    cinemaName: string;
    cinemaAddress: string;
    movieFormatName: string;
    scheduleTimesInfos: {
        scheduleId: string;
        showTime: string;
    }[];
}

export interface PublicSeat {
    seatId: string;
    seatName: string;
    coordX: number;
    coordY: number;
    colIndex: number;
    rowIndex: number;
    isBooked: boolean;
}

export interface PublicSeatMap {
    scheduleId: string;
    auditoriumName: string;
    movieName: string;
    movieVisualFormatName: string;
    startTime: string;
    seatMap: PublicSeat[];
}

export interface PublicSegmentPrice {
    userSegmentId: string;
    segmentName: string;
    description: string;
    basePrice: number;
    priceBeforePromotion: number;
    promotionAdjustmentAmount: number;
    finalPrice: number;
    appliedPromotions: PublicAppliedPricingPromotion[];
}

export interface PublicAppliedPricingPromotion {
    promotionId: string;
    ruleId: string;
    title: string;
    promotionTypeName: string;
    adjustmentValue: number;
    amountChanged: number;
    priceBefore: number;
    priceAfter: number;
}

export interface PublicPricing {
    scheduleId: string;
    basePrice: number;
    segmentPrices: PublicSegmentPrice[];
    appliedPromotions: PublicAppliedPricingPromotion[];
}

export interface PublicPromotionRule {
    pricingPromotionRuleId: string;
    movieFormatId: string | null;
    movieFormatName: string | null;
    cinemaId: string | null;
    cinemaName: string | null;
    auditoriumId: string | null;
    auditoriumName: string | null;
    requiredMembershipTierId: string | null;
    requiredMembershipTierName: string | null;
    promotionType: number | string;
    promotionTypeName: string;
    adjustmentValue: number;
    startDate: string | null;
    endDate: string | null;
    timeFrom: string | null;
    timeTo: string | null;
    daysOfWeek: string[];
    daysOfWeekText: string;
    priority: number;
    isActive: boolean;
}

export interface PublicPromotion {
    pricingPromotionId: string;
    name: string;
    slug: string;
    title: string;
    shortDescription: string | null;
    description: string | null;
    termsAndConditions: string | null;
    imageUrl: string | null;
    isActive: boolean;
    excludeHolidays: boolean;
    startDate: string | null;
    endDate: string | null;
    rules: PublicPromotionRule[];
}

export interface PublicGenre {
    genreId: string;
    genreName: string;
    description: string;
}

export interface ActiveCinema {
    cinemaId: string;
    cinemaName: string;
    cinemaCity?: string;
}

export interface NearestCinema extends ActiveCinema {
    cinemaLocation?: string;
    latitude?: number;
    longitude?: number;
    distanceInKm: number;
}

export interface ActiveMovie {
    movieId: string;
    movieName: string;
}

export interface SearchShowtime {
    scheduleId: string;
    startTime: string;
    endedTime: string;
    auditoriumId: string;
    auditoriumNumber: string;
}

export interface SearchFormatShowtimes {
    formatId: string;
    formatName: string;
    showtimes: SearchShowtime[];
}

export interface SearchCinemaShowtimes {
    cinemaId: string;
    cinemaName: string;
    cinemaLocation: string;
    cinemaCity: string;
    formatShowtimes: SearchFormatShowtimes[];
}

export interface SearchScheduleResult {
    movieId: string;
    movieName: string;
    movieImageUrl: string;
    movieDescription: string;
    movieDuration: number;
    movieRequiredAgeSymbol: string;
    movieGenres: string[];
    cinemas: SearchCinemaShowtimes[];
}
