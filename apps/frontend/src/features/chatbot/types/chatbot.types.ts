import type React from 'react';
import type {
  ActiveCinema,
  ActiveMovie,
  PublicSeatMap,
  PublicPricing,
  PublicSegmentPrice,
  PublicGenre,
} from '../../../types/public.types';
import type { CreateBookingResponse, TicketInfo } from '../../../types/booking.types';

export type ChatRole = 'bot' | 'user';

export type ChatActionType =
  | 'bookingPathPicker'
  | 'discoveryModePicker'
  | 'genrePicker'
  | 'moviePicker'
  | 'datePicker'
  | 'cinemaPicker'
  | 'showtimePreferencePicker'
  | 'showtimePicker'
  | 'segmentQuantityPicker'
  | 'seatSuggestion'
  | 'voucherPicker'
  | 'guestContact'
  | 'bookingSummary'
  | 'paymentAction'
  | 'ticketCard'
  | 'requestLocation';

export interface ReferencedMovie {
  movieId: string;
  movieName: string;
}

export interface ReferencedSchedule {
  scheduleId: string;
  movieId: string;
  movieName: string;
  showTime: string;
  cinemaName: string;
  formatName: string;
  cinemaLatitude?: number;
  cinemaLongitude?: number;
}

export interface ChatAction {
  actionId: string;
  type: ChatActionType;
  title: string;
  payload?: any;
}

export interface ChatbotResponsePayload {
  response?: string;
  referencedMovies?: ReferencedMovie[];
  referencedSchedules?: ReferencedSchedule[];
  uiActions?: ChatAction[];
  bookingState?: Record<string, unknown>;
  orderId?: string;
  processingPath?: string;
  elapsedMs?: number;
  isAuthenticated?: boolean;
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  text: string;
  createdAt: string;
  actions?: ChatAction[];
  movies?: ReferencedMovie[];
  schedules?: ReferencedSchedule[];
}

export interface NormalizedSeat {
  seatId: string;
  seatNumber: string;
  rowIndex: number;
  colIndex: number;
  isOccupied: boolean;
}

export type ShowtimePickMode = 'time' | 'format';
export type BookingPathMode = 'movieFirst' | 'cinemaFirst';
export type DiscoveryMode = 'genreFirst' | 'timeFirst';

export interface ChoiceOption {
  id?: string;
  value?: string;
  label: string;
  description?: string;
}

export interface ShowtimeOption {
  scheduleId: string;
  movieId: string;
  movieName: string;
  cinemaId: string;
  cinemaName: string;
  cinemaLocation?: string;
  formatName: string;
  auditoriumNumber: string;
  startTime: string;
  endedTime: string;
}

export interface CinemaOption extends ActiveCinema {
  cinemaLocation?: string;
  latitude?: number;
  longitude?: number;
  distanceInKm?: number;
}

export interface GuestContact {
  name: string;
  email: string;
  phone: string;
}

export interface BookingDraft {
  bookingPath?: BookingPathMode;
  discoveryMode?: DiscoveryMode;
  genre?: PublicGenre;
  movie?: ActiveMovie;
  date?: string;
  cinema?: CinemaOption;
  showtimePreference?: ShowtimePickMode;
  availableShowtimes?: ShowtimeOption[];
  showtime?: ShowtimeOption;
  seatMap?: PublicSeatMap;
  pricing?: PublicPricing;
  ageRestriction?: string;
  segment?: PublicSegmentPrice;
  quantity: number;
  suggestedSeats: NormalizedSeat[];
  voucherId?: string;
  voucherName?: string;
  guestContact: GuestContact;
  order?: CreateBookingResponse;
  paymentUrl?: string;
  ticket?: TicketInfo;
  initialPrompt?: string;
  formatName?: string;
}

export interface BookingStep {
  key: string;
  label: string;
  icon: React.ReactNode;
}

export interface QuickReply {
  label: string;
  value: string;
  icon?: React.ReactNode;
}
