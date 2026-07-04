import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Armchair,
  Bot,
  Check,
  Clock,
  CreditCard,
  Download,
  Film,
  Loader2,
  MapPin,
  MessageCircle,
  Navigation,
  Search,
  Send,
  Sparkles,
  Tag,
  Ticket,
  User,
  X,
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL, identityAxios } from '../api/axiosClient';
import { publicApi } from '../api/publicApi';
import { bookingApi } from '../api/bookingApi';
import { signalrClient, stopConnection } from '../api/signalrClient';
import { voucherApi, type UserVoucherDto, type VoucherDto } from '../api/voucherApi';
import type {
  ActiveCinema,
  ActiveMovie,
  NearestCinema,
  PublicPricing,
  PublicSegmentPrice,
  SearchCinemaShowtimes,
  SearchScheduleResult,
} from '../types/public.types';
import type { CreateBookingResponse, PaymentEvent, TicketInfo } from '../types/booking.types';

type ChatRole = 'bot' | 'user';
type ChatActionType =
  | 'moviePicker'
  | 'datePicker'
  | 'cinemaPicker'
  | 'showtimePicker'
  | 'segmentQuantityPicker'
  | 'seatSuggestion'
  | 'voucherPicker'
  | 'guestContact'
  | 'bookingSummary'
  | 'paymentAction'
  | 'ticketCard';

interface ReferencedMovie {
  movieId: string;
  movieName: string;
}

interface ReferencedSchedule {
  scheduleId: string;
  movieId: string;
  movieName: string;
  showTime: string;
  cinemaName: string;
  formatName: string;
  cinemaLatitude?: number;
  cinemaLongitude?: number;
}

interface ChatbotResponsePayload {
  response?: string;
  referencedMovies?: ReferencedMovie[];
  referencedSchedules?: ReferencedSchedule[];
  uiActions?: ChatAction[];
  bookingState?: Record<string, unknown>;
  orderId?: string;
}

interface ChatAction {
  actionId: string;
  type: ChatActionType;
  title: string;
  payload?: any;
}

interface ChatMessage {
  id: string;
  role: ChatRole;
  text: string;
  createdAt: string;
  actions?: ChatAction[];
  movies?: ReferencedMovie[];
  schedules?: ReferencedSchedule[];
}

interface NormalizedSeat {
  seatId: string;
  seatNumber: string;
  rowIndex: number;
  colIndex: number;
  isOccupied: boolean;
}

interface ShowtimeOption {
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

interface CinemaOption extends ActiveCinema {
  cinemaLocation?: string;
  latitude?: number;
  longitude?: number;
  distanceInKm?: number;
}

interface GuestContact {
  name: string;
  email: string;
  phone: string;
}

interface BookingDraft {
  movie?: ActiveMovie;
  date?: string;
  cinema?: CinemaOption;
  showtime?: ShowtimeOption;
  pricing?: PublicPricing;
  segment?: PublicSegmentPrice;
  quantity: number;
  suggestedSeats: NormalizedSeat[];
  voucherId?: string;
  voucherName?: string;
  guestContact: GuestContact;
  order?: CreateBookingResponse;
  paymentUrl?: string;
  ticket?: TicketInfo;
}

interface UserLocation {
  lat: number;
  lng: number;
}

const CHAT_HISTORY_STORAGE_KEY = 'cinemapro_agentic_chat_messages';
const CHAT_DRAFT_STORAGE_KEY = 'cinemapro_agentic_booking_draft';
const MAX_TICKETS = 10;

const theme = {
  accent: '#f57c00',
  accentHover: '#e67300',
  accentSoft: 'rgba(245,124,0,0.16)',
  surface: '#131313',
  surfaceLow: '#1b1b1c',
  surfaceHigh: '#252525',
  surfaceHighest: '#343434',
  border: 'rgba(255,255,255,0.11)',
  text: '#f5f1ed',
  muted: '#d6bba9',
  success: '#22c55e',
  danger: '#ef4444',
};

const uid = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const todayInputValue = () => new Date().toISOString().slice(0, 10);

const isBookingIntent = (text: string) => {
  const normalized = text.toLowerCase();
  return ['dat ve', 'đặt vé', 'mua ve', 'mua vé', 'book', 'ticket'].some(keyword => normalized.includes(keyword));
};

const getStoredUser = (): any | null => {
  try {
    const raw = localStorage.getItem('user_info');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const isLoggedIn = () => Boolean(getStoredUser());

const readStoredMessages = (): ChatMessage[] => {
  try {
    const raw = sessionStorage.getItem(CHAT_HISTORY_STORAGE_KEY);
    if (!raw) throw new Error('empty');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch {
    // Use greeting below.
  }

  return [{
    id: uid('bot'),
    role: 'bot',
    text: '👋',
    createdAt: new Date().toISOString(),
  }];
};

const readStoredDraft = (): BookingDraft => {
  const fallback: BookingDraft = {
    quantity: 1,
    suggestedSeats: [],
    guestContact: { name: '', email: '', phone: '' },
  };

  try {
    const raw = sessionStorage.getItem(CHAT_DRAFT_STORAGE_KEY);
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
  } catch {
    return fallback;
  }
};

const formatCurrency = (amount?: number) => `${Math.round(amount || 0).toLocaleString('vi-VN')}d`;

const formatDate = (value?: string) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' });
};

const formatTime = (value?: string) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
};

const normalizeSeatMap = (seatMap: any): NormalizedSeat[] => {
  const rawSeats = seatMap?.seatMap || seatMap?.seats || [];
  return rawSeats.map((seat: any) => ({
    seatId: seat.seatId,
    seatNumber: seat.seatNumber || seat.seatName || '',
    rowIndex: Number(seat.rowIndex ?? seat.coordY ?? 0),
    colIndex: Number(seat.colIndex ?? seat.coordX ?? 0),
    isOccupied: Boolean(seat.isOccupied ?? seat.isBooked),
  })).filter((seat: NormalizedSeat) => Boolean(seat.seatId));
};

const getSeatCenter = (seats: NormalizedSeat[], seatMap: any) => {
  const rows = seats.map(seat => seat.rowIndex);
  const cols = seats.map(seat => seat.colIndex);
  const maxRow = Math.max(...rows, 1);
  const maxCol = Math.max(...cols, 1);
  const centerRowStart = Number(seatMap?.centerRowStart || Math.floor(maxRow / 3));
  const centerRowEnd = Number(seatMap?.centerRowEnd || Math.ceil(maxRow * 2 / 3));
  const centerColStart = Number(seatMap?.centerColStart || Math.floor(maxCol / 3));
  const centerColEnd = Number(seatMap?.centerColEnd || Math.ceil(maxCol * 2 / 3));
  return {
    row: (centerRowStart + centerRowEnd) / 2,
    col: (centerColStart + centerColEnd) / 2,
  };
};

const consecutiveClusters = (seats: NormalizedSeat[], quantity: number) => {
  const byRow = new Map<number, NormalizedSeat[]>();
  seats.forEach(seat => {
    byRow.set(seat.rowIndex, [...(byRow.get(seat.rowIndex) || []), seat]);
  });

  const clusters: NormalizedSeat[][] = [];
  byRow.forEach(rowSeats => {
    const sorted = [...rowSeats].sort((a, b) => a.colIndex - b.colIndex);
    for (let i = 0; i <= sorted.length - quantity; i += 1) {
      const slice = sorted.slice(i, i + quantity);
      const isConsecutive = slice.every((seat, index) => index === 0 || seat.colIndex === slice[index - 1].colIndex + 1);
      if (isConsecutive) clusters.push(slice);
    }
  });
  return clusters;
};

const extractSeatPreference = (history: any[] = []) => {
  const seats = history.flatMap(item => item?.seats || []);
  const rows = seats.map((seat: string) => seat.match(/[A-Za-z]+/)?.[0]?.toUpperCase()).filter(Boolean) as string[];
  const cols = seats.map((seat: string) => Number(seat.match(/\d+/)?.[0])).filter(n => Number.isFinite(n));
  const row = rows.length ? rows.sort((a, b) => rows.filter(r => r === b).length - rows.filter(r => r === a).length)[0] : null;
  const avgCol = cols.length ? cols.reduce((sum, value) => sum + value, 0) / cols.length : null;
  return { row, avgCol };
};

const suggestSeats = (seatMap: any, quantity: number, history: any[] = []) => {
  const seats = normalizeSeatMap(seatMap);
  const available = seats.filter(seat => !seat.isOccupied);
  if (available.length < quantity) return [];

  const center = getSeatCenter(seats, seatMap);
  const preference = extractSeatPreference(history);
  const clusters = consecutiveClusters(available, quantity);
  const candidates = clusters.length ? clusters : available.map(seat => [seat]);

  const scoreCluster = (cluster: NormalizedSeat[]) => {
    const avgRow = cluster.reduce((sum, seat) => sum + seat.rowIndex, 0) / cluster.length;
    const avgCol = cluster.reduce((sum, seat) => sum + seat.colIndex, 0) / cluster.length;
    const centerScore = (avgRow - center.row) ** 2 + (avgCol - center.col) ** 2;
    const historyRowBonus = preference.row && cluster.some(seat => seat.seatNumber.toUpperCase().startsWith(preference.row!)) ? -1.5 : 0;
    const historyColBonus = preference.avgCol != null ? Math.abs(avgCol - preference.avgCol) * 0.15 : 0;
    return centerScore + historyRowBonus + historyColBonus;
  };

  const best = [...candidates].sort((a, b) => scoreCluster(a) - scoreCluster(b))[0];
  if (best.length >= quantity) return best.slice(0, quantity);

  const selectedIds = new Set(best.map(seat => seat.seatId));
  const rest = available
    .filter(seat => !selectedIds.has(seat.seatId))
    .sort((a, b) => {
      const scoreA = (a.rowIndex - center.row) ** 2 + (a.colIndex - center.col) ** 2;
      const scoreB = (b.rowIndex - center.row) ** 2 + (b.colIndex - center.col) ** 2;
      return scoreA - scoreB;
    });
  return [...best, ...rest].slice(0, quantity);
};

const flattenShowtimes = (results: SearchScheduleResult[], selectedCinemaId?: string): ShowtimeOption[] => {
  return results.flatMap(movie => movie.cinemas.flatMap((cinema: SearchCinemaShowtimes) => {
    if (selectedCinemaId && cinema.cinemaId !== selectedCinemaId) return [];
    return cinema.formatShowtimes.flatMap(format => format.showtimes.map(showtime => ({
      scheduleId: showtime.scheduleId,
      movieId: movie.movieId,
      movieName: movie.movieName,
      cinemaId: cinema.cinemaId,
      cinemaName: cinema.cinemaName,
      cinemaLocation: cinema.cinemaLocation,
      formatName: format.formatName,
      auditoriumNumber: showtime.auditoriumNumber,
      startTime: showtime.startTime,
      endedTime: showtime.endedTime,
    })));
  }));
};

const baseButton: React.CSSProperties = {
  border: 'none',
  cursor: 'pointer',
  fontFamily: 'inherit',
  transition: 'transform 0.15s ease, border-color 0.15s ease, background 0.15s ease',
};

const primaryButton: React.CSSProperties = {
  ...baseButton,
  background: `linear-gradient(135deg, ${theme.accent}, ${theme.accentHover})`,
  color: '#fff',
  borderRadius: 10,
  padding: '10px 12px',
  fontWeight: 800,
};

const ghostButton: React.CSSProperties = {
  ...baseButton,
  background: 'rgba(255,255,255,0.06)',
  color: theme.text,
  border: `1px solid ${theme.border}`,
  borderRadius: 10,
  padding: '10px 12px',
  fontWeight: 700,
};

const ChatMessageBubble: React.FC<{
  message: ChatMessage;
  children?: React.ReactNode;
}> = ({ message, children }) => {
  const isUser = message.role === 'user';
  return (
    <div style={{ display: 'flex', gap: 10, justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
      {!isUser && (
        <div style={{
          width: 30,
          height: 30,
          borderRadius: 10,
          background: theme.accentSoft,
          border: `1px solid ${theme.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          marginTop: 2,
        }}>
          <Bot size={15} color={theme.accent} />
        </div>
      )}
      <div style={{
        maxWidth: isUser ? '78%' : '86%',
        minWidth: 0,
        color: isUser ? '#fff' : theme.text,
      }}>
        <div style={{
          padding: '11px 13px',
          borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
          background: isUser ? `linear-gradient(135deg, ${theme.accent}, ${theme.accentHover})` : theme.surfaceHigh,
          border: isUser ? 'none' : `1px solid ${theme.border}`,
          fontSize: 13,
          lineHeight: 1.5,
          whiteSpace: 'pre-wrap',
          overflowWrap: 'anywhere',
        }}>
          {message.text}
        </div>
        {children}
      </div>
      {isUser && (
        <div style={{
          width: 30,
          height: 30,
          borderRadius: 10,
          background: 'rgba(255,255,255,0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          marginTop: 2,
        }}>
          <User size={15} color="#fff" />
        </div>
      )}
    </div>
  );
};

const ActionShell: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
  <div style={{
    marginTop: 10,
    padding: 10,
    borderRadius: 12,
    background: 'rgba(255,255,255,0.045)',
    border: `1px solid ${theme.border}`,
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8, color: theme.muted, fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>
      {icon}
      <span>{title}</span>
    </div>
    {children}
  </div>
);

const MoviePicker: React.FC<{
  movies: ActiveMovie[];
  onPick: (movie: ActiveMovie) => void;
}> = ({ movies, onPick }) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const filtered = movies
    .filter(movie => movie.movieName.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 12);

  return (
    <ActionShell title={t('chatbot.moviePicker')} icon={<Film size={13} />}>
      <SearchInput value={query} onChange={setQuery} placeholder={t('chatbot.searchMovie')} />
      <div style={{ display: 'grid', gap: 6, marginTop: 8 }}>
        {filtered.map(movie => (
          <button key={movie.movieId} onClick={() => onPick(movie)} style={optionButtonStyle}>
            <span style={{ fontWeight: 800 }}>{movie.movieName}</span>
            <Check size={14} />
          </button>
        ))}
      </div>
    </ActionShell>
  );
};

const DatePicker: React.FC<{
  dates: string[];
  onPick: (date: string) => void;
}> = ({ dates, onPick }) => {
  const { t } = useTranslation();
  const suggestedDates = dates.slice(0, 7);
  return (
    <ActionShell title={t('chatbot.datePicker')} icon={<Clock size={13} />}>
      <input
        type="date"
        min={todayInputValue()}
        onChange={event => event.target.value && onPick(event.target.value)}
        style={{
          width: '100%',
          background: theme.surface,
          color: theme.text,
          border: `1px solid ${theme.border}`,
          borderRadius: 10,
          padding: '10px 11px',
          colorScheme: 'dark',
          fontFamily: 'inherit',
        }}
      />
      {suggestedDates.length > 0 && (
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', marginTop: 8, paddingBottom: 2 }}>
          {suggestedDates.map(date => (
            <button key={date} onClick={() => onPick(date.slice(0, 10))} style={{ ...ghostButton, whiteSpace: 'nowrap', fontSize: 12 }}>
              {formatDate(date)}
            </button>
          ))}
        </div>
      )}
    </ActionShell>
  );
};

const CinemaPicker: React.FC<{
  cinemas: CinemaOption[];
  onPick: (cinema: CinemaOption) => void;
}> = ({ cinemas, onPick }) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const filtered = cinemas
    .filter(cinema => `${cinema.cinemaName} ${cinema.cinemaCity || ''} ${cinema.cinemaLocation || ''}`.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 14);

  return (
    <ActionShell title={t('chatbot.cinemaPicker')} icon={<MapPin size={13} />}>
      <SearchInput value={query} onChange={setQuery} placeholder={t('chatbot.searchCinema')} />
      <div style={{ display: 'grid', gap: 7, marginTop: 8 }}>
        {filtered.map(cinema => (
          <button key={cinema.cinemaId} onClick={() => onPick(cinema)} style={{ ...optionButtonStyle, alignItems: 'flex-start' }}>
            <span style={{ minWidth: 0, textAlign: 'left' }}>
              <span style={{ display: 'block', fontWeight: 900 }}>{cinema.cinemaName}</span>
              <span style={{ display: 'block', color: theme.muted, fontSize: 11, marginTop: 2 }}>
                {cinema.cinemaLocation || cinema.cinemaCity || 'CinemaPro'}
              </span>
            </span>
            {cinema.distanceInKm != null && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: theme.accent, fontSize: 11, fontWeight: 800 }}>
                <Navigation size={11} />
                {cinema.distanceInKm < 1 ? `${Math.round(cinema.distanceInKm * 1000)}m` : `${cinema.distanceInKm.toFixed(1)}km`}
              </span>
            )}
          </button>
        ))}
      </div>
    </ActionShell>
  );
};

const ShowtimePicker: React.FC<{
  showtimes: ShowtimeOption[];
  onPick: (showtime: ShowtimeOption) => void;
}> = ({ showtimes, onPick }) => {
  const { t } = useTranslation();
  return (
    <ActionShell title={t('chatbot.showtimePicker')} icon={<Clock size={13} />}>
      <div style={{ display: 'grid', gap: 7 }}>
        {showtimes.map(showtime => (
          <button key={showtime.scheduleId} onClick={() => onPick(showtime)} style={optionButtonStyle}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <span style={{
                background: `linear-gradient(135deg, ${theme.accent}, ${theme.accentHover})`,
                color: '#fff',
                borderRadius: 8,
                padding: '5px 9px',
                fontWeight: 900,
                minWidth: 54,
              }}>
                {formatTime(showtime.startTime)}
              </span>
              <span style={{ textAlign: 'left', minWidth: 0 }}>
                <span style={{ display: 'block', fontWeight: 900 }}>{showtime.formatName}</span>
                <span style={{ color: theme.muted, fontSize: 11 }}>{t('chatbot.auditoriumLabel', { number: showtime.auditoriumNumber })}</span>
              </span>
            </span>
            <Check size={14} />
          </button>
        ))}
      </div>
    </ActionShell>
  );
};

const SegmentQuantityPicker: React.FC<{
  pricing: PublicPricing;
  onPick: (segment: PublicSegmentPrice, quantity: number) => void;
}> = ({ pricing, onPick }) => {
  const { t } = useTranslation();
  const [segmentId, setSegmentId] = useState(pricing.segmentPrices[0]?.userSegmentId || '');
  const [quantity, setQuantity] = useState(1);
  const segment = pricing.segmentPrices.find(item => item.userSegmentId === segmentId) || pricing.segmentPrices[0];

  return (
    <ActionShell title={t('chatbot.segmentPicker')} icon={<Ticket size={13} />}>
      <div style={{ display: 'grid', gap: 8 }}>
        {pricing.segmentPrices.map(item => (
          <button
            key={item.userSegmentId}
            onClick={() => setSegmentId(item.userSegmentId)}
            style={{
              ...optionButtonStyle,
              borderColor: item.userSegmentId === segmentId ? theme.accent : theme.border,
              background: item.userSegmentId === segmentId ? theme.accentSoft : 'rgba(255,255,255,0.05)',
            }}
          >
            <span style={{ textAlign: 'left' }}>
              <span style={{ display: 'block', fontWeight: 900 }}>{item.segmentName}</span>
              <span style={{ display: 'block', color: theme.muted, fontSize: 11 }}>{item.description || t('chatbot.segmentDesc')}</span>
            </span>
            <span style={{ color: theme.accent, fontWeight: 900 }}>{formatCurrency(item.finalPrice)}</span>
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
        <button onClick={() => setQuantity(Math.max(1, quantity - 1))} style={{ ...ghostButton, width: 40, padding: 9 }}>-</button>
        <input
          type="number"
          min={1}
          max={MAX_TICKETS}
          value={quantity}
          onChange={event => setQuantity(Math.max(1, Math.min(MAX_TICKETS, Number(event.target.value) || 1)))}
          style={{
            flex: 1,
            minWidth: 0,
            background: theme.surface,
            color: theme.text,
            border: `1px solid ${theme.border}`,
            borderRadius: 10,
            padding: '10px 12px',
            textAlign: 'center',
            fontWeight: 900,
          }}
        />
        <button onClick={() => setQuantity(Math.min(MAX_TICKETS, quantity + 1))} style={{ ...ghostButton, width: 40, padding: 9 }}>+</button>
      </div>
      <button
        disabled={!segment}
        onClick={() => segment && onPick(segment, quantity)}
        style={{ ...primaryButton, width: '100%', marginTop: 10, opacity: segment ? 1 : 0.5 }}
      >
        {t('chatbot.suggestSeats', { count: quantity })}
      </button>
    </ActionShell>
  );
};

const SeatSuggestionCard: React.FC<{
  seats: NormalizedSeat[];
  onAccept: () => void;
  onRetry: () => void;
}> = ({ seats, onAccept, onRetry }) => {
  const { t } = useTranslation();
  return (
    <ActionShell title={t('chatbot.seatSuggestion')} icon={<Armchair size={13} />}>
      {seats.length === 0 ? (
        <>
          <p style={{ margin: '0 0 10px', color: theme.muted, fontSize: 12 }}>{t('chatbot.noSeatsFound')}</p>
          <button onClick={onRetry} style={{ ...ghostButton, width: '100%' }}>{t('chatbot.retry')}</button>
        </>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {seats.map(seat => (
              <span key={seat.seatId} style={{
                background: theme.accentSoft,
                color: theme.accent,
                border: `1px solid ${theme.accent}`,
                borderRadius: 9,
                padding: '7px 10px',
                fontWeight: 900,
              }}>
                {seat.seatNumber}
              </span>
            ))}
          </div>
          <p style={{ margin: '9px 0 0', color: theme.muted, fontSize: 12 }}>
            {t('chatbot.seatsDescription')}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10 }}>
            <button onClick={onRetry} style={ghostButton}>{t('chatbot.resuggest')}</button>
            <button onClick={onAccept} style={primaryButton}>{t('chatbot.acceptSeats')}</button>
          </div>
        </>
      )}
    </ActionShell>
  );
};

const VoucherPicker: React.FC<{
  mode: 'mode' | 'owned' | 'redeem';
  vouchers: UserVoucherDto[];
  redeemableVouchers: VoucherDto[];
  rewardPoints: number;
  onChooseMode: (mode: 'owned' | 'redeem' | 'skip') => void;
  onPickOwned: (voucher: UserVoucherDto) => void;
  onRedeem: (voucher: VoucherDto) => void;
}> = ({ mode, vouchers, redeemableVouchers, rewardPoints, onChooseMode, onPickOwned, onRedeem }) => {
  const { t } = useTranslation();
  return (
    <ActionShell title={t('chatbot.voucherTitle')} icon={<Tag size={13} />}>
      {mode === 'mode' && (
        <div style={{ display: 'grid', gap: 8 }}>
          <button onClick={() => onChooseMode('owned')} style={optionButtonStyle}>{t('chatbot.useVoucher')}</button>
          <button onClick={() => onChooseMode('redeem')} style={optionButtonStyle}>{t('chatbot.buyVoucher')}</button>
          <button onClick={() => onChooseMode('skip')} style={ghostButton}>{t('chatbot.skipVoucher')}</button>
        </div>
      )}
      {mode === 'owned' && (
        <div style={{ display: 'grid', gap: 8 }}>
          {vouchers.length === 0 && <p style={{ color: theme.muted, fontSize: 12, margin: 0 }}>{t('chatbot.noVoucherAvailable')}</p>}
          {vouchers.map(voucher => (
            <button key={voucher.userVoucherId} onClick={() => onPickOwned(voucher)} style={optionButtonStyle}>
              <span style={{ textAlign: 'left' }}>
                <span style={{ display: 'block', fontWeight: 900 }}>{voucher.voucherName}</span>
                <span style={{ display: 'block', color: theme.muted, fontSize: 11 }}>{t('chatbot.discountPercent', { percent: voucher.voucherDiscountPercent })}</span>
              </span>
              <Check size={14} />
            </button>
          ))}
          <button onClick={() => onChooseMode('skip')} style={ghostButton}>{t('chatbot.skipVoucher')}</button>
        </div>
      )}
      {mode === 'redeem' && (
        <div style={{ display: 'grid', gap: 8 }}>
          <div style={{ color: theme.muted, fontSize: 12, fontWeight: 800 }}>{t('chatbot.rewardPoints', { points: rewardPoints.toLocaleString('vi-VN') })}</div>
          {redeemableVouchers.length === 0 && <p style={{ color: theme.muted, fontSize: 12, margin: 0 }}>{t('chatbot.noRedeemableVouchers')}</p>}
          {redeemableVouchers.map(voucher => (
            <button key={voucher.voucherId} onClick={() => onRedeem(voucher)} style={optionButtonStyle}>
              <span style={{ textAlign: 'left' }}>
                <span style={{ display: 'block', fontWeight: 900 }}>{voucher.voucherName}</span>
                <span style={{ display: 'block', color: theme.muted, fontSize: 11 }}>{t('chatbot.discountPercent', { percent: voucher.voucherDiscountPercent })}</span>
              </span>
              <span style={{ color: theme.accent, fontWeight: 900 }}>{t('chatbot.pointsCost', { points: voucher.voucherPointsCost })}</span>
            </button>
          ))}
          <button onClick={() => onChooseMode('skip')} style={ghostButton}>{t('chatbot.skipVoucher')}</button>
        </div>
      )}
    </ActionShell>
  );
};

const GuestContactForm: React.FC<{
  initial: GuestContact;
  onSubmit: (contact: GuestContact) => void;
}> = ({ initial, onSubmit }) => {
  const { t } = useTranslation();
  const [contact, setContact] = useState(initial);
  const valid = contact.name.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email.trim()) && contact.phone.trim();

  return (
    <ActionShell title={t('chatbot.guestContact')} icon={<User size={13} />}>
      <div style={{ display: 'grid', gap: 8 }}>
        <TextInput value={contact.name} onChange={name => setContact(prev => ({ ...prev, name }))} placeholder={t('chatbot.namePlaceholder')} />
        <TextInput value={contact.email} onChange={email => setContact(prev => ({ ...prev, email }))} placeholder={t('chatbot.emailPlaceholder')} />
        <TextInput value={contact.phone} onChange={phone => setContact(prev => ({ ...prev, phone }))} placeholder={t('chatbot.phonePlaceholder')} />
        <button disabled={!valid} onClick={() => onSubmit(contact)} style={{ ...primaryButton, opacity: valid ? 1 : 0.5 }}>
          {t('chatbot.continueBtn')}
        </button>
      </div>
    </ActionShell>
  );
};

const BookingSummaryCard: React.FC<{
  draft: BookingDraft;
  onConfirm: () => void;
}> = ({ draft, onConfirm }) => {
  const { t } = useTranslation();
  const subtotal = (draft.segment?.finalPrice || 0) * draft.quantity;
  const voucherText = draft.voucherName ? draft.voucherName : t('chatbot.noVoucher');

  return (
    <ActionShell title={t('chatbot.bookingSummary')} icon={<Sparkles size={13} />}>
      <div style={{ display: 'grid', gap: 7, fontSize: 12 }}>
        <SummaryRow label={t('chatbot.summaryMovie')} value={draft.movie?.movieName || '-'} />
        <SummaryRow label={t('chatbot.summaryCinema')} value={draft.cinema?.cinemaName || '-'} />
        <SummaryRow label={t('chatbot.summaryShowtime')} value={`${formatDate(draft.showtime?.startTime)} ${formatTime(draft.showtime?.startTime)}`} />
        <SummaryRow label={t('chatbot.summaryTicketType')} value={`${draft.segment?.segmentName || '-'} x ${draft.quantity}`} />
        <SummaryRow label={t('chatbot.summarySeats')} value={draft.suggestedSeats.map(seat => seat.seatNumber).join(', ')} />
        <SummaryRow label={t('chatbot.summaryVoucher')} value={voucherText} />
        <SummaryRow label={t('chatbot.subtotal')} value={formatCurrency(subtotal)} strong />
      </div>
      <button onClick={onConfirm} style={{ ...primaryButton, width: '100%', marginTop: 10 }}>
        {t('chatbot.payAndBook')}
      </button>
    </ActionShell>
  );
};

const PaymentStatusCard: React.FC<{
  paymentUrl?: string;
  loading: boolean;
  onOpen: () => void;
  onCheck: () => void;
}> = ({ paymentUrl, loading, onOpen, onCheck }) => {
  const { t } = useTranslation();
  return (
    <ActionShell title={t('chatbot.paymentTitle')} icon={<CreditCard size={13} />}>
      <p style={{ color: theme.muted, fontSize: 12, margin: '0 0 10px' }}>
        {t('chatbot.paymentDesc')}
      </p>
      <div style={{ display: 'grid', gap: 8 }}>
        {paymentUrl && <button onClick={onOpen} style={primaryButton}>{t('chatbot.openPayment')}</button>}
        <button onClick={onCheck} style={ghostButton} disabled={loading}>
          {loading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : t('chatbot.paid')}
        </button>
      </div>
    </ActionShell>
  );
};

const TicketCard: React.FC<{ ticket: TicketInfo; onDownload: () => void }> = ({ ticket, onDownload }) => {
  const { t } = useTranslation();
  return (
    <ActionShell title={t('chatbot.ticket')} icon={<Ticket size={13} />}>
      <div style={{ display: 'flex', gap: 10 }}>
        {ticket.movieImageUrl && (
          <img src={ticket.movieImageUrl} alt={ticket.movieName} style={{ width: 62, height: 86, objectFit: 'cover', borderRadius: 8 }} />
        )}
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontWeight: 900, color: theme.text, overflowWrap: 'anywhere' }}>{ticket.movieName}</div>
          <div style={{ color: theme.muted, fontSize: 12, marginTop: 4 }}>{ticket.cinemaName}</div>
          <div style={{ color: theme.muted, fontSize: 12 }}>{formatDate(ticket.showTime)} {formatTime(ticket.showTime)}</div>
        </div>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
        {ticket.seats.map(seat => (
          <span key={`${seat.seatNumber}-${seat.segmentName}`} style={{
            background: theme.accentSoft,
            color: theme.accent,
            borderRadius: 8,
            padding: '6px 9px',
            fontWeight: 900,
            fontSize: 12,
          }}>
            {seat.seatNumber} - {seat.segmentName}
          </span>
        ))}
      </div>
      <SummaryRow label={t('chatbot.total')} value={formatCurrency(ticket.totalPrice)} strong />
      <button onClick={onDownload} style={{ ...primaryButton, width: '100%', marginTop: 10 }}>
        <Download size={14} /> {t('chatbot.download')}
      </button>
    </ActionShell>
  );
};

const SummaryRow: React.FC<{ label: string; value: string; strong?: boolean }> = ({ label, value, strong }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '6px 0', borderBottom: `1px solid ${theme.border}` }}>
    <span style={{ color: theme.muted }}>{label}</span>
    <span style={{ color: strong ? theme.accent : theme.text, fontWeight: strong ? 900 : 700, textAlign: 'right', overflowWrap: 'anywhere' }}>{value}</span>
  </div>
);

const SearchInput: React.FC<{ value: string; onChange: (value: string) => void; placeholder: string }> = ({ value, onChange, placeholder }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 10, padding: '0 10px' }}>
    <Search size={14} color={theme.muted} />
    <input
      value={value}
      onChange={event => onChange(event.target.value)}
      placeholder={placeholder}
      style={{ flex: 1, minWidth: 0, background: 'transparent', border: 'none', color: theme.text, outline: 'none', padding: '10px 0', fontSize: 13 }}
    />
  </div>
);

const TextInput: React.FC<{ value: string; onChange: (value: string) => void; placeholder: string }> = ({ value, onChange, placeholder }) => (
  <input
    value={value}
    onChange={event => onChange(event.target.value)}
    placeholder={placeholder}
    style={{
      width: '100%',
      background: theme.surface,
      color: theme.text,
      border: `1px solid ${theme.border}`,
      borderRadius: 10,
      padding: '10px 11px',
      outline: 'none',
      fontFamily: 'inherit',
      fontSize: 13,
    }}
  />
);

const optionButtonStyle: React.CSSProperties = {
  ...baseButton,
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 10,
  background: 'rgba(255,255,255,0.055)',
  border: `1px solid ${theme.border}`,
  borderRadius: 10,
  padding: '10px 11px',
  color: theme.text,
  fontSize: 12,
};

const ChatActionRenderer: React.FC<{
  action: ChatAction;
  draft: BookingDraft;
  onPickMovie: (movie: ActiveMovie) => void;
  onPickDate: (date: string) => void;
  onPickCinema: (cinema: CinemaOption) => void;
  onPickShowtime: (showtime: ShowtimeOption) => void;
  onPickSegment: (segment: PublicSegmentPrice, quantity: number) => void;
  onAcceptSeats: () => void;
  onRetrySeats: () => void;
  onVoucherMode: (mode: 'owned' | 'redeem' | 'skip') => void;
  onPickOwnedVoucher: (voucher: UserVoucherDto) => void;
  onRedeemVoucher: (voucher: VoucherDto) => void;
  onGuestContact: (contact: GuestContact) => void;
  onConfirmBooking: () => void;
  onOpenPayment: () => void;
  onCheckPayment: () => void;
  onDownloadTicket: (orderId: string) => void;
  paymentChecking: boolean;
}> = ({
  action,
  draft,
  onPickMovie,
  onPickDate,
  onPickCinema,
  onPickShowtime,
  onPickSegment,
  onAcceptSeats,
  onRetrySeats,
  onVoucherMode,
  onPickOwnedVoucher,
  onRedeemVoucher,
  onGuestContact,
  onConfirmBooking,
  onOpenPayment,
  onCheckPayment,
  onDownloadTicket,
  paymentChecking,
}) => {
  switch (action.type) {
    case 'moviePicker':
      return <MoviePicker movies={action.payload.movies || []} onPick={onPickMovie} />;
    case 'datePicker':
      return <DatePicker dates={action.payload.dates || []} onPick={onPickDate} />;
    case 'cinemaPicker':
      return <CinemaPicker cinemas={action.payload.cinemas || []} onPick={onPickCinema} />;
    case 'showtimePicker':
      return <ShowtimePicker showtimes={action.payload.showtimes || []} onPick={onPickShowtime} />;
    case 'segmentQuantityPicker':
      return <SegmentQuantityPicker pricing={action.payload.pricing} onPick={onPickSegment} />;
    case 'seatSuggestion':
      return <SeatSuggestionCard seats={draft.suggestedSeats} onAccept={onAcceptSeats} onRetry={onRetrySeats} />;
    case 'voucherPicker':
      return (
        <VoucherPicker
          mode={action.payload.mode}
          vouchers={action.payload.vouchers || []}
          redeemableVouchers={action.payload.redeemableVouchers || []}
          rewardPoints={action.payload.rewardPoints || 0}
          onChooseMode={onVoucherMode}
          onPickOwned={onPickOwnedVoucher}
          onRedeem={onRedeemVoucher}
        />
      );
    case 'guestContact':
      return <GuestContactForm initial={draft.guestContact} onSubmit={onGuestContact} />;
    case 'bookingSummary':
      return <BookingSummaryCard draft={draft} onConfirm={onConfirmBooking} />;
    case 'paymentAction':
      return <PaymentStatusCard paymentUrl={draft.paymentUrl} loading={paymentChecking} onOpen={onOpenPayment} onCheck={onCheckPayment} />;
    case 'ticketCard':
      return draft.ticket && draft.order?.orderId ? <TicketCard ticket={draft.ticket} onDownload={() => onDownloadTicket(draft.order!.orderId)} /> : null;
    default:
      return null;
  }
};

const ChatBot: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(readStoredMessages);
  const [input, setInput] = useState('');
  const [draft, setDraft] = useState<BookingDraft>(readStoredDraft);
  const [isLoading, setIsLoading] = useState(false);
  const [streamStatus, setStreamStatus] = useState('');
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [paymentChecking, setPaymentChecking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const paymentWindowRef = useRef<Window | null>(null);

  useEffect(() => {
    sessionStorage.setItem(CHAT_HISTORY_STORAGE_KEY, JSON.stringify(messages));
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    sessionStorage.setItem(CHAT_DRAFT_STORAGE_KEY, JSON.stringify(draft));
  }, [draft]);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      pos => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setUserLocation(null),
      { timeout: 5000, maximumAge: 600000 },
    );
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (panelRef.current?.contains(target) || buttonRef.current?.contains(target)) return;
      setIsOpen(false);
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  const appendMessage = useCallback((message: Omit<ChatMessage, 'id' | 'createdAt'>) => {
    setMessages(prev => [...prev, { ...message, id: uid(message.role), createdAt: new Date().toISOString() }]);
  }, []);

  const appendBot = useCallback((text: string, actions?: ChatAction[]) => {
    appendMessage({ role: 'bot', text, actions });
  }, [appendMessage]);

  const appendUser = useCallback((text: string) => {
    appendMessage({ role: 'user', text });
  }, [appendMessage]);

  const makeAction = useCallback((type: ChatActionType, title: string, payload?: any): ChatAction => ({
    actionId: uid(type),
    type,
    title,
    payload,
  }), []);

  const resetBooking = useCallback(() => {
    setDraft({ quantity: 1, suggestedSeats: [], guestContact: { name: '', email: '', phone: '' } });
  }, []);

  const sendMessageWithSse = useCallback(async (
    text: string,
    onToken: (streamedText: string) => void,
    onStatus?: (statusText: string) => void,
  ): Promise<ChatbotResponsePayload> => {
    const language = localStorage.getItem('language') || 'vi';
    const response = await fetch(`${API_BASE_URL}/api/v1/chatbot/chat/stream`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        Accept: 'text/event-stream',
        'Content-Type': 'application/json',
        'Accept-Language': language,
        'X-Language': language,
      },
      body: JSON.stringify({ message: text }),
    });

    if (!response.ok || !response.body) throw new Error('Chat stream is not available');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let finalPayload: ChatbotResponsePayload | null = null;
    let streamError = '';
    let streamedText = '';

    const handleEventBlock = (block: string) => {
      const lines = block.split(/\r?\n/);
      const eventLine = lines.find(line => line.startsWith('event:'));
      const dataLines = lines.filter(line => line.startsWith('data:'));
      const eventName = eventLine?.replace(/^event:\s*/, '').trim() || 'message';
      const dataText = dataLines.map(line => line.replace(/^data:\s?/, '')).join('\n');
      if (!dataText) return;

      const payload = JSON.parse(dataText);
      if (eventName === 'status') {
        const statusText = payload.message || t('chatbot.processing');
        setStreamStatus(statusText);
        onStatus?.(statusText);
      } else if (eventName === 'token') {
        streamedText += payload.text || '';
        onToken(streamedText);
      } else if (eventName === 'metadata') {
        finalPayload = { ...finalPayload, ...payload, response: streamedText };
      } else if (eventName === 'message') {
        finalPayload = payload;
      } else if (eventName === 'error') {
        streamError = payload.message || t('chatbot.errorBusy');
      }
    };

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const blocks = buffer.split(/\r?\n\r?\n/);
      buffer = blocks.pop() || '';
      blocks.forEach(handleEventBlock);
    }

    if (buffer.trim()) handleEventBlock(buffer);
    if (streamError) throw new Error(streamError);
    return finalPayload || { response: streamedText };
  }, [t]);

  const askForMovie = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await publicApi.getActiveMovies();
      appendBot(t('chatbot.askMovie'), [
        makeAction('moviePicker', t('chatbot.moviePicker'), { movies: response.data || [] }),
      ]);
    } catch {
      appendBot(t('chatbot.errorLoadMovies'));
    } finally {
      setIsLoading(false);
    }
  }, [appendBot, makeAction, t]);

  const startBookingFlow = useCallback(async (userText?: string) => {
    resetBooking();
    if (userText) appendUser(userText);
    await askForMovie();
  }, [appendUser, askForMovie, resetBooking]);

  const handlePickMovie = useCallback(async (movie: ActiveMovie) => {
    appendUser(t('chatbot.selectedMovie', { name: movie.movieName }));
    setDraft(prev => ({ ...prev, movie, date: undefined, cinema: undefined, showtime: undefined, suggestedSeats: [] }));
    setIsLoading(true);
    try {
      const response = await publicApi.getScheduleDates(movie.movieId);
      appendBot(t('chatbot.askDate'), [
        makeAction('datePicker', t('chatbot.datePicker'), { dates: response.data || [] }),
      ]);
    } catch {
      appendBot(t('chatbot.errorLoadDates'), [
        makeAction('datePicker', t('chatbot.datePicker'), { dates: [] }),
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [appendBot, appendUser, makeAction, t]);

  const handlePickDate = useCallback(async (date: string) => {
    if (!draft.movie) {
      appendBot(t('chatbot.errorMissingInfo'));
      await askForMovie();
      return;
    }

    appendUser(`${t('chatbot.selectedDate')} ${formatDate(date)}`);
    setDraft(prev => ({ ...prev, date, cinema: undefined, showtime: undefined, suggestedSeats: [] }));
    setIsLoading(true);

    try {
      const scheduleResponse = await publicApi.searchSchedules(date, draft.movie.movieId);
      const cinemaMap = new Map<string, CinemaOption>();
      scheduleResponse.data?.forEach(movie => {
        movie.cinemas.forEach(cinema => {
          cinemaMap.set(cinema.cinemaId, {
            cinemaId: cinema.cinemaId,
            cinemaName: cinema.cinemaName,
            cinemaCity: cinema.cinemaCity,
            cinemaLocation: cinema.cinemaLocation,
          });
        });
      });

      let cinemas = Array.from(cinemaMap.values());
      if (userLocation) {
        try {
          const nearestResponse = await publicApi.getNearestCinemas(userLocation.lat, userLocation.lng);
          const nearestById = new Map((nearestResponse.data || []).map((cinema: NearestCinema) => [cinema.cinemaId, cinema]));
          cinemas = cinemas
            .map(cinema => {
              const nearest = nearestById.get(cinema.cinemaId);
              return nearest ? { ...cinema, ...nearest, distanceInKm: nearest.distanceInKm } : cinema;
            })
            .sort((a, b) => (a.distanceInKm ?? Number.MAX_VALUE) - (b.distanceInKm ?? Number.MAX_VALUE));
        } catch {
          cinemas = cinemas.sort((a, b) => a.cinemaName.localeCompare(b.cinemaName));
        }
      } else {
        cinemas = cinemas.sort((a, b) => a.cinemaName.localeCompare(b.cinemaName));
      }

      if (cinemas.length === 0) {
        appendBot(t('chatbot.errorNoCinemas'), [
          makeAction('datePicker', t('chatbot.datePicker'), { dates: [] }),
        ]);
        return;
      }

      appendBot(t('chatbot.askCinema'), [
        makeAction('cinemaPicker', t('chatbot.cinemaPicker'), { cinemas }),
      ]);
    } catch {
      appendBot(t('chatbot.errorLoadMovies'));
    } finally {
      setIsLoading(false);
    }
  }, [appendBot, appendUser, askForMovie, draft.movie, makeAction, userLocation, t]);

  const handlePickCinema = useCallback(async (cinema: CinemaOption) => {
    if (!draft.movie || !draft.date) {
      appendBot(t('chatbot.errorMissingInfo'));
      return;
    }

    appendUser(`${t('chatbot.selectedCinema')} ${cinema.cinemaName}`);
    setDraft(prev => ({ ...prev, cinema, showtime: undefined, suggestedSeats: [] }));
    setIsLoading(true);

    try {
      const response = await publicApi.searchSchedules(draft.date, draft.movie.movieId, cinema.cinemaId);
      const showtimes = flattenShowtimes(response.data || [], cinema.cinemaId)
        .filter(showtime => new Date(showtime.startTime).getTime() > Date.now())
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

      if (showtimes.length === 0) {
        appendBot(t('chatbot.errorNoShowtimes'));
        return;
      }

      appendBot(t('chatbot.askShowtime'), [
        makeAction('showtimePicker', t('chatbot.showtimePicker'), { showtimes }),
      ]);
    } catch {
      appendBot(t('chatbot.errorNoPricing'));
    } finally {
      setIsLoading(false);
    }
  }, [appendBot, appendUser, draft.date, draft.movie, makeAction, t]);

  const handlePickShowtime = useCallback(async (showtime: ShowtimeOption) => {
    appendUser(`${t('chatbot.selectedShowtime')} ${formatTime(showtime.startTime)} - ${showtime.formatName}`);
    setDraft(prev => ({ ...prev, showtime, pricing: undefined, segment: undefined, suggestedSeats: [] }));
    setIsLoading(true);

    try {
      const response = await publicApi.getPricing(showtime.scheduleId);
      if (!response.data?.segmentPrices?.length) {
        appendBot(t('chatbot.errorNoPricing'));
        return;
      }
      setDraft(prev => ({ ...prev, pricing: response.data }));
      appendBot(t('chatbot.askSegment'), [
        makeAction('segmentQuantityPicker', t('chatbot.segmentPicker'), { pricing: response.data }),
      ]);
    } catch {
      appendBot(t('chatbot.errorNoPricing'));
    } finally {
      setIsLoading(false);
    }
  }, [appendBot, appendUser, makeAction, t]);

  const handlePickSegment = useCallback(async (segment: PublicSegmentPrice, quantity: number) => {
    if (!draft.showtime) {
      appendBot(t('chatbot.errorMissingInfo'));
      return;
    }

    appendUser(t('chatbot.selectedSegment', { count: quantity, name: segment.segmentName }));
    setDraft(prev => ({ ...prev, segment, quantity }));
    setIsLoading(true);

    try {
      const [seatMapResponse, historyResponse] = await Promise.allSettled([
        publicApi.getSeatMap(draft.showtime.scheduleId),
        isLoggedIn() ? bookingApi.getBookingHistory() : Promise.resolve({ data: [] }),
      ]);

      if (seatMapResponse.status !== 'fulfilled') {
        appendBot(t('chatbot.errorNoSeatMap'));
        return;
      }

      const history = historyResponse.status === 'fulfilled' ? (historyResponse.value.data || []) : [];
      const seats = suggestSeats(seatMapResponse.value.data, quantity, history as any[]);
      setDraft(prev => ({ ...prev, suggestedSeats: seats }));
      appendBot(seats.length ? t('chatbot.seatsSuggested') : t('chatbot.errorNoSeats'), [
        makeAction('seatSuggestion', t('chatbot.seatSuggestion'), {}),
      ]);
    } catch {
      appendBot(t('chatbot.errorNoSeatMap'));
    } finally {
      setIsLoading(false);
    }
  }, [appendBot, appendUser, draft.showtime, makeAction, t]);

  const continueAfterSeats = useCallback(async () => {
    if (isLoggedIn()) {
      appendBot(t('chatbot.askVoucherMode'), [
        makeAction('voucherPicker', t('chatbot.voucherPicker'), { mode: 'mode' }),
      ]);
    } else {
      appendBot(t('chatbot.askGuestInfo'), [
        makeAction('guestContact', t('chatbot.guestContact'), {}),
      ]);
    }
  }, [appendBot, makeAction, t]);

  const handleAcceptSeats = useCallback(async () => {
    appendUser(t('chatbot.acceptSeatsLog', { seats: draft.suggestedSeats.map(seat => seat.seatNumber).join(', ') }));
    await continueAfterSeats();
  }, [appendUser, continueAfterSeats, draft.suggestedSeats, t]);

  const handleRetrySeats = useCallback(async () => {
    if (!draft.segment) return;
    await handlePickSegment(draft.segment, draft.quantity);
  }, [draft.quantity, draft.segment, handlePickSegment, t]);

  const handleVoucherMode = useCallback(async (mode: 'owned' | 'redeem' | 'skip') => {
    if (mode === 'skip') {
      appendUser(t('chatbot.skipVoucherLog'));
      appendBot(t('chatbot.bookingConfirm'), [
        makeAction('bookingSummary', t('chatbot.bookingSummary'), {}),
      ]);
      return;
    }

    appendUser(mode === 'owned' ? t('chatbot.useVoucherLog') : t('chatbot.buyVoucherLog'));
    setIsLoading(true);

    try {
      if (mode === 'owned') {
        const response = await voucherApi.getMyVouchers();
        const now = Date.now();
        const vouchers = (response.data || [])
          .filter(voucher => !voucher.isUsed && (!voucher.validTo || new Date(voucher.validTo).getTime() >= now))
          .sort((a, b) => b.voucherDiscountPercent - a.voucherDiscountPercent);
        appendBot(t('chatbot.ownedVouchers'), [
          makeAction('voucherPicker', t('chatbot.ownedVoucherTitle'), { mode: 'owned', vouchers }),
        ]);
      } else {
        const [voucherResponse, accountResponse] = await Promise.all([
          voucherApi.getActiveVouchers(),
          bookingApi.getAccountInfo(),
        ]);
        const rewardPoints = accountResponse.data?.rewardPoints || 0;
        const redeemableVouchers = (voucherResponse.data || [])
          .filter(voucher => voucher.isActive && voucher.remainingQuantity > 0 && voucher.voucherPointsCost <= rewardPoints)
          .sort((a, b) => b.voucherDiscountPercent - a.voucherDiscountPercent);
        appendBot(t('chatbot.redeemableVouchers'), [
          makeAction('voucherPicker', t('chatbot.redeemVoucherTitle'), { mode: 'redeem', redeemableVouchers, rewardPoints }),
        ]);
      }
    } catch {
      appendBot(t('chatbot.errorNoVouchers'), [
        makeAction('voucherPicker', t('chatbot.voucherTitle'), { mode: 'mode' }),
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [appendBot, appendUser, makeAction, t]);

  const handlePickOwnedVoucher = useCallback((voucher: UserVoucherDto) => {
    appendUser(t('chatbot.appliedVoucherLog', { name: voucher.voucherName }));
    setDraft(prev => ({ ...prev, voucherId: voucher.voucherId, voucherName: voucher.voucherName }));
    appendBot(t('chatbot.voucherApplied'), [
      makeAction('bookingSummary', t('chatbot.bookingSummary'), {}),
    ]);
  }, [appendBot, appendUser, makeAction, t]);

  const handleRedeemVoucher = useCallback(async (voucher: VoucherDto) => {
    appendUser(t('chatbot.redeemVoucherLog', { name: voucher.voucherName }));
    setIsLoading(true);
    try {
      const response = await voucherApi.redeemVoucher(voucher.voucherId);
      setDraft(prev => ({
        ...prev,
        voucherId: response.data?.voucherId || voucher.voucherId,
        voucherName: response.data?.voucherName || voucher.voucherName,
      }));
      appendBot(t('chatbot.voucherRedeemed'), [
        makeAction('bookingSummary', t('chatbot.bookingSummary'), {}),
      ]);
    } catch {
      appendBot(t('chatbot.voucherRedeemFail'), [
        makeAction('voucherPicker', t('chatbot.voucherTitle'), { mode: 'mode' }),
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [appendBot, appendUser, makeAction, t]);

  const handleGuestContact = useCallback((contact: GuestContact) => {
    appendUser(t('chatbot.guestContactLog', { name: contact.name, email: contact.email }));
    setDraft(prev => ({ ...prev, guestContact: contact }));
    appendBot(t('chatbot.bookingConfirm'), [
      makeAction('bookingSummary', t('chatbot.bookingSummary'), {}),
    ]);
  }, [appendBot, appendUser, makeAction, t]);

  const checkPaymentAndRenderTicket = useCallback(async (orderId?: string) => {
    const id = orderId || draft.order?.orderId;
    if (!id) return false;
    setPaymentChecking(true);
    try {
      const response = await bookingApi.getTicketInfo(id);
      if (response.data) {
        setDraft(prev => ({ ...prev, ticket: response.data }));
        appendBot(t('chatbot.bookingSuccess'), [
          makeAction('ticketCard', t('chatbot.ticket'), {}),
        ]);
        return true;
      }
    } catch {
      // Ticket is only available after VNPay confirms the order.
    } finally {
      setPaymentChecking(false);
    }
    return false;
  }, [appendBot, draft.order?.orderId, makeAction, t]);

  const handleConfirmBooking = useCallback(async () => {
    if (!draft.showtime || !draft.segment || draft.suggestedSeats.length === 0) {
      appendBot(t('chatbot.errorMissingInfo'));
      return;
    }

    appendUser(t('chatbot.confirmBookingLog'));
    const paymentWindow = window.open('', '_blank', 'width=520,height=760');
    paymentWindowRef.current = paymentWindow;
    setIsLoading(true);

    try {
      const loggedIn = isLoggedIn();
      const response = await bookingApi.createBooking({
        scheduleId: draft.showtime.scheduleId,
        seatSelections: draft.suggestedSeats.map(seat => ({
          seatId: seat.seatId,
          userSegmentId: draft.segment!.userSegmentId,
        })),
        customerName: loggedIn ? undefined : draft.guestContact.name.trim(),
        customerEmail: loggedIn ? undefined : draft.guestContact.email.trim(),
        customerPhone: loggedIn ? undefined : draft.guestContact.phone.trim(),
        voucherId: draft.voucherId || undefined,
        paymentMethod: 0,
      });

      const order = response.data;
      setDraft(prev => ({ ...prev, order, paymentUrl: order.paymentUrl }));

      if (order.paymentUrl) {
        if (paymentWindow && !paymentWindow.closed) {
          paymentWindow.location.href = order.paymentUrl;
        } else {
          appendBot(t('chatbot.blockedPopup'), [
            makeAction('paymentAction', t('chatbot.paymentTitle'), {}),
          ]);
          return;
        }

        appendBot(t('chatbot.paymentOpened'), [
          makeAction('paymentAction', t('chatbot.paymentTitle'), {}),
        ]);
      } else {
        paymentWindow?.close();
        await checkPaymentAndRenderTicket(order.orderId);
      }
    } catch (error: any) {
      paymentWindow?.close();
      appendBot(error?.response?.data?.message || t('chatbot.errorBooking'));
    } finally {
      setIsLoading(false);
    }
  }, [appendBot, appendUser, checkPaymentAndRenderTicket, draft.guestContact, draft.segment, draft.showtime, draft.suggestedSeats, draft.voucherId, makeAction, t]);

  const handleOpenPayment = useCallback(() => {
    if (!draft.paymentUrl) return;
    const opened = window.open(draft.paymentUrl, '_blank', 'width=520,height=760');
    paymentWindowRef.current = opened;
    if (!opened) appendBot(t('chatbot.blockedPopupManual'));
  }, [appendBot, draft.paymentUrl, t]);

  useEffect(() => {
    const orderId = draft.order?.orderId;
    if (!orderId || draft.ticket) return undefined;

    let cancelled = false;
    let intervalId: number | undefined;
    let connection: ReturnType<typeof signalrClient.createPaymentConnection> | null = null;

    const start = async () => {
      try {
        connection = signalrClient.createPaymentConnection(orderId);
        connection.on('payment-result', async (event: PaymentEvent) => {
          if (event.status === 'success') {
            await checkPaymentAndRenderTicket(orderId);
          } else {
            appendBot(event.message || t('chatbot.paymentFailed'), [
              makeAction('paymentAction', t('chatbot.paymentTitle'), {}),
            ]);
          }
        });
        await connection.start();
      } catch {
        // Anonymous users may not be allowed to join the payment hub; polling below still covers them.
      }

      intervalId = window.setInterval(async () => {
        if (cancelled) return;
        const done = await checkPaymentAndRenderTicket(orderId);
        if (done && intervalId) window.clearInterval(intervalId);
      }, 5000);
    };

    start();

    return () => {
      cancelled = true;
      if (intervalId) window.clearInterval(intervalId);
      void stopConnection(connection);
    };
  }, [appendBot, checkPaymentAndRenderTicket, draft.order?.orderId, draft.ticket, makeAction, t]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput('');

    if (isBookingIntent(text)) {
      await startBookingFlow(text);
      return;
    }

    appendUser(text);
    const botMessageId = uid('bot');
    setMessages(prev => [...prev, {
      id: botMessageId,
      role: 'bot',
      text: t('chatbot.connecting'),
      createdAt: new Date().toISOString(),
    }]);
    setIsLoading(true);

    const updateBot = (textValue: string, extra?: Partial<ChatMessage>) => {
      setMessages(prev => prev.map(message => message.id === botMessageId ? { ...message, text: textValue, ...extra } : message));
    };

    try {
      let botData: ChatbotResponsePayload;
      try {
        botData = await sendMessageWithSse(text, streamed => updateBot(streamed), status => updateBot(status));
      } catch {
        setStreamStatus(t('chatbot.fallbackConnection'));
        const response = await identityAxios.post('/chatbot/chat', { message: text });
        botData = response.data?.data || {};
      }
      updateBot(botData.response || t('chatbot.errorDefault'), {
        movies: botData.referencedMovies || [],
        schedules: botData.referencedSchedules || [],
        actions: botData.uiActions || [],
      });
    } catch {
      updateBot(t('chatbot.errorBusy'));
    } finally {
      setStreamStatus('');
      setIsLoading(false);
    }
  }, [appendUser, input, isLoading, sendMessageWithSse, startBookingFlow, t]);

  const quickActions = useMemo(() => [
    { icon: Ticket, label: t('chatbot.quickBook'), value: t('chatbot.quickBookValue') },
    { icon: Clock, label: t('chatbot.quickShowtimes'), value: t('chatbot.quickShowtimesValue') },
    { icon: Tag, label: t('chatbot.quickPromotions'), value: t('chatbot.quickPromotionsValue') },
  ], [t]);

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={panelRef}
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 320, damping: 24 }}
            style={{
              position: 'fixed',
              right: 24,
              bottom: 92,
              zIndex: 9998,
              width: 'calc(100vw - 32px)',
              maxWidth: 430,
              height: 660,
              maxHeight: 'calc(100vh - 120px)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              borderRadius: 20,
              background: theme.surface,
              border: `1px solid ${theme.border}`,
              boxShadow: '0 24px 70px rgba(0,0,0,0.55)',
            }}
          >
            <div style={{
              flexShrink: 0,
              padding: '16px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              background: `linear-gradient(135deg, ${theme.accent}, ${theme.accentHover})`,
              color: '#fff',
            }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, display: 'grid', placeItems: 'center', background: 'rgba(255,255,255,0.14)' }}>
                <Bot size={21} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 900, fontSize: 16 }}>CinemaPro AI</div>
                <div style={{ fontSize: 11, opacity: 0.86, fontWeight: 700, textTransform: 'uppercase' }}>{t('chatbot.subtitle')}</div>
              </div>
              <button onClick={() => setIsOpen(false)} style={{ ...baseButton, width: 34, height: 34, borderRadius: 10, display: 'grid', placeItems: 'center', background: 'rgba(255,255,255,0.12)', color: '#fff' }} title={t('chatbot.close')}>
                <X size={18} />
              </button>
            </div>

            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {messages.map(message => (
                <ChatMessageBubble key={message.id} message={message}>
                  {message.actions?.map(action => (
                    <ChatActionRenderer
                      key={action.actionId}
                      action={action}
                      draft={draft}
                      onPickMovie={handlePickMovie}
                      onPickDate={handlePickDate}
                      onPickCinema={handlePickCinema}
                      onPickShowtime={handlePickShowtime}
                      onPickSegment={handlePickSegment}
                      onAcceptSeats={handleAcceptSeats}
                      onRetrySeats={handleRetrySeats}
                      onVoucherMode={handleVoucherMode}
                      onPickOwnedVoucher={handlePickOwnedVoucher}
                      onRedeemVoucher={handleRedeemVoucher}
                      onGuestContact={handleGuestContact}
                      onConfirmBooking={handleConfirmBooking}
                      onOpenPayment={handleOpenPayment}
                      onCheckPayment={() => void checkPaymentAndRenderTicket()}
                      onDownloadTicket={(orderId) => window.open(bookingApi.getTicketDownloadUrl(orderId), '_blank')}
                      paymentChecking={paymentChecking}
                    />
                  ))}
                  {message.movies && message.movies.length > 0 && (
                    <ActionShell title={t('chatbot.relatedMovies')} icon={<Film size={13} />}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {message.movies.map(movie => (
                          <button key={movie.movieId} onClick={() => { setIsOpen(false); navigate(`/movie/${movie.movieId}`); }} style={{ ...ghostButton, fontSize: 12 }}>
                            {movie.movieName}
                          </button>
                        ))}
                      </div>
                    </ActionShell>
                  )}
                </ChatMessageBubble>
              ))}
              {isLoading && (
                <ChatMessageBubble message={{ id: 'loading', role: 'bot', text: streamStatus || t('chatbot.loading'), createdAt: new Date().toISOString() }}>
                  <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6, color: theme.muted, fontSize: 11 }}>
                    <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
                    <span>{t('chatbot.loadingData')}</span>
                  </div>
                </ChatMessageBubble>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div style={{ flexShrink: 0, padding: '8px 14px 0', display: 'flex', gap: 7, overflowX: 'auto' }}>
              {quickActions.map(action => (
                <button
                  key={action.label}
                  onClick={() => setInput(action.value)}
                  style={{ ...ghostButton, display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', fontSize: 12, padding: '7px 10px' }}
                >
                  <action.icon size={14} />
                  {action.label}
                </button>
              ))}
            </div>

            <div style={{ flexShrink: 0, padding: 14 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'rgba(255,255,255,0.055)',
                border: `1px solid ${theme.border}`,
                borderRadius: 14,
                padding: '4px 4px 4px 12px',
              }}>
                <input
                  value={input}
                  disabled={isLoading}
                  onChange={event => setInput(event.target.value)}
                  onKeyDown={event => {
                    if (event.key === 'Enter' && !event.shiftKey) void handleSend();
                  }}
                  placeholder={t('chatbot.placeholder')}
                  style={{ flex: 1, minWidth: 0, background: 'transparent', border: 'none', outline: 'none', color: theme.text, fontSize: 14, padding: '10px 0' }}
                />
                <button
                  disabled={!input.trim() || isLoading}
                  onClick={() => void handleSend()}
                  style={{
                    ...primaryButton,
                    width: 40,
                    height: 40,
                    padding: 0,
                    display: 'grid',
                    placeItems: 'center',
                    opacity: input.trim() && !isLoading ? 1 : 0.45,
                  }}
                  title={t('chatbot.send')}
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{__html: `
        .chatbot-trigger-btn {
          bottom: 92px !important;
        }
        @media (max-width: 768px) {
          .chatbot-trigger-btn.is-open {
            display: none !important;
          }
        }
        @media (min-width: 768px) {
          .chatbot-trigger-btn {
            bottom: 24px !important;
          }
        }
      `}} />

      <motion.button
        ref={buttonRef}
        onClick={() => setIsOpen(value => !value)}
        aria-label="Open CinemaPro AI"
        className={`chatbot-trigger-btn ${isOpen ? 'is-open' : ''}`}
        whileHover={shouldReduceMotion ? {} : { scale: 1.08, translateY: -2 }}
        whileTap={shouldReduceMotion ? {} : { scale: 0.94 }}
        style={{
          position: 'fixed',
          right: 24,
          zIndex: 9999,
          width: 56,
          height: 56,
          borderRadius: '50%',
          border: 'none',
          cursor: 'pointer',
          background: `linear-gradient(135deg, ${theme.accent}, ${theme.accentHover})`,
          color: '#fff',
          display: 'grid',
          placeItems: 'center',
          boxShadow: `0 12px 34px ${theme.accentSoft}`,
        }}
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </motion.button>
    </>
  );
};

export default ChatBot;
