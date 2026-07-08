import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { downloadTicketAsPdf } from '../utils/ticketPdfGenerator';
import {
  Armchair,
  ArrowDown,
  Bot,
  Check,
  CheckCircle,
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
import Cookies from 'js-cookie';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL, identityAxios } from '../api/axiosClient';
import { bookingApi } from '../api/bookingApi';
import { signalrClient, stopConnection } from '../api/signalrClient';
import { type UserVoucherDto, type VoucherDto } from '../api/voucherApi';
import type {
  ActiveCinema,
  ActiveMovie,
  PublicSeatMap,
  PublicPricing,
  PublicSegmentPrice,
  PublicGenre,
} from '../types/public.types';
import type { CreateBookingResponse, PaymentEvent, TicketInfo } from '../types/booking.types';

type ChatRole = 'bot' | 'user';
type ChatActionType =
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
  processingPath?: string;
  elapsedMs?: number;
  isAuthenticated?: boolean;
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

type ShowtimePickMode = 'time' | 'format';
type BookingPathMode = 'movieFirst' | 'cinemaFirst';
type DiscoveryMode = 'genreFirst' | 'timeFirst';

interface ChoiceOption {
  id?: string;
  value?: string;
  label: string;
  description?: string;
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



const CHAT_HISTORY_STORAGE_KEY = 'cinemapro_agentic_chat_messages_v2';
const CHAT_DRAFT_STORAGE_KEY = 'cinemapro_agentic_booking_draft_v2';
const CHAT_SESSION_STORAGE_KEY = 'cinemapro_agentic_chat_session_id_v2';
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

const getChatSessionId = () => {
  const existing = sessionStorage.getItem(CHAT_SESSION_STORAGE_KEY);
  if (existing) return existing;
  const next = `web-chat-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  sessionStorage.setItem(CHAT_SESSION_STORAGE_KEY, next);
  return next;
};

const getStoredAccessToken = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user_info') || '{}');
    return user.accessToken || Cookies.get('X-Access-Token') || '';
  } catch {
    return Cookies.get('X-Access-Token') || '';
  }
};

const stripInternalChatMarkup = (value?: string) => {
  if (!value) return '';
  const tagIndex = value.indexOf('[UI_ACTION:');
  const visible = tagIndex >= 0 ? value.slice(0, tagIndex) : value;
  return visible
    .replace(/```json[\s\S]*?```/gi, '')
    .replace(/\|\s*(movieId|cinemaId|scheduleId|userSegmentId|seatIds|voucherId|genreId|bookingPath|discoveryMode)\s*=[^\n|]+/gi, '')
    .trim();
};

// Simple markdown renderer for chat messages
const renderMarkdown = (text: string): React.ReactNode => {
  if (!text) return null;

  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Check for markdown table
    if (line.includes('|') && i + 1 < lines.length && lines[i + 1]?.match(/^\|[\s\-:|]+\|$/)) {
      const tableLines: string[] = [line];
      let j = i + 1;
      while (j < lines.length && lines[j]?.includes('|')) {
        tableLines.push(lines[j]);
        j++;
      }

      // Parse table
      const headerCells = tableLines[0].split('|').filter(c => c.trim()).map(c => c.trim());
      const bodyRows = tableLines.slice(2).map(row =>
        row.split('|').filter(c => c.trim()).map(c => c.trim())
      );

      elements.push(
        <table key={`table-${i}`} style={{
          width: '100%', borderCollapse: 'collapse', margin: '10px 0',
          fontSize: 12, background: 'rgba(255,255,255,0.03)', borderRadius: 8, overflow: 'hidden',
        }}>
          <thead>
            <tr>
              {headerCells.map((cell, ci) => (
                <th key={ci} style={{
                  padding: '8px 12px', textAlign: 'left', fontWeight: 800,
                  borderBottom: `1px solid ${theme.border}`, color: theme.accent,
                  fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em',
                }}>
                  {cell.replace(/\*\*/g, '')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {bodyRows.map((row, ri) => (
              <tr key={ri} style={{ borderBottom: ri < bodyRows.length - 1 ? `1px solid ${theme.border}` : 'none' }}>
                {row.map((cell, ci) => (
                  <td key={ci} style={{
                    padding: '8px 12px', color: theme.text,
                    fontWeight: ci === 0 ? 700 : 500,
                  }}>
                    {cell.replace(/\*\*/g, '').replace(/\*([^*]+)\*/g, '$1')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      );

      i = j;
      continue;
    }

    // Bold text
    if (line.includes('**')) {
      const parts = line.split(/(\*\*[^*]+\*\*)/g);
      elements.push(
        <p key={`line-${i}`} style={{ margin: '4px 0', lineHeight: 1.6 }}>
          {parts.map((part, pi) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={pi} style={{ color: theme.accent }}>{part.slice(2, -2)}</strong>;
            }
            return part;
          })}
        </p>
      );
      i++;
      continue;
    }

    // Regular text
    if (line.trim()) {
      elements.push(<p key={`line-${i}`} style={{ margin: '4px 0', lineHeight: 1.6 }}>{line}</p>);
    }

    i++;
  }

  return <>{elements}</>;
};

const buildBookingState = (draft: BookingDraft, patch: Partial<BookingDraft> = {}) => {
  const next = { ...draft, ...patch };
  return {
    bookingPath: next.bookingPath,
    discoveryMode: next.discoveryMode,
    genre: next.genre,
    movie: next.movie,
    date: next.date,
    cinema: next.cinema,
    showtimePreference: next.showtimePreference,
    showtime: next.showtime,
    pricing: next.pricing,
    segment: next.segment,
    quantity: next.quantity,
    selectedSeats: next.suggestedSeats,
    suggestedSeats: next.suggestedSeats,
    voucherId: next.voucherId,
    voucherName: next.voucherName,
    guestContact: next.guestContact,
    formatName: next.formatName,
  };
};

const agentSelection = (
  type: string,
  payload: Record<string, unknown>,
  bookingState?: Record<string, unknown>
) => (
  `[USER_SELECTION] ${JSON.stringify({ type, payload, bookingState })}`
);







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
    text: 'Xin chào! Tôi là CinemaPro AI - Trợ lý ảo đặt vé thông minh của Galaxy Cinema. 🎬\n\nTôi sẵn sàng hỗ trợ bạn thực hiện các tác vụ:\n1. 🔍 Tìm kiếm phim đang chiếu, xem lịch chiếu theo rạp và ngày.\n2. 🎟️ Đặt vé nhanh chóng: Chọn nhiều loại vé cùng lúc (Người lớn, Học sinh, Trẻ em, Người cao tuổi).\n3. 🪑 Gợi ý chọn ghế ngồi tối ưu hoặc tự do lựa chọn ghế ngồi.\n4. 🎁 Áp dụng Voucher giảm giá và tích lũy điểm thưởng thành viên.\n5. 📄 Xuất vé điện tử dạng PDF trực tiếp để quét mã nhận vé cứng tại quầy.\n\nBạn muốn tìm kiếm phim hoặc đặt vé suất chiếu nào hôm nay? Hãy trò chuyện với tôi nhé!',
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





const getSeatGridMetrics = (seats: NormalizedSeat[]) => {
  const maxCol = seats.length ? Math.max(...seats.map(seat => seat.colIndex)) + 1 : 0;
  const maxRow = seats.length ? Math.max(...seats.map(seat => seat.rowIndex)) + 1 : 0;
  return { maxCol, maxRow };
};

const isCenterSeat = (seat: NormalizedSeat, seatMap?: PublicSeatMap) => (
  seatMap?.centerRowStart !== undefined &&
  seatMap.centerRowEnd !== undefined &&
  seatMap.centerColStart !== undefined &&
  seatMap.centerColEnd !== undefined &&
  seat.rowIndex >= seatMap.centerRowStart &&
  seat.rowIndex <= seatMap.centerRowEnd &&
  seat.colIndex >= seatMap.centerColStart &&
  seat.colIndex <= seatMap.centerColEnd
);



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
        overflow: 'hidden',
        color: isUser ? '#fff' : theme.text,
      }}>
        <div style={{
          padding: '11px 13px',
          borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
          background: isUser ? `linear-gradient(135deg, ${theme.accent}, ${theme.accentHover})` : theme.surfaceHigh,
          border: isUser ? 'none' : `1px solid ${theme.border}`,
          fontSize: 12,
          lineHeight: 1.6,
          wordBreak: 'break-word',
          overflowWrap: 'break-word',
          whiteSpace: 'pre-wrap',
        }}>
          {isUser ? message.text : renderMarkdown(message.text)}
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
    overflow: 'hidden',
    minWidth: 0,
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8, color: theme.muted, fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>
      {icon}
      <span>{title}</span>
    </div>
    {children}
  </div>
);

// ===== Typing Indicator Component =====
const TypingIndicator: React.FC<{ statusText?: string }> = ({ statusText }) => (
  <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-start' }}>
    <div style={{
      width: 30, height: 30, borderRadius: 10,
      background: theme.accentSoft, border: `1px solid ${theme.border}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2,
    }}>
      <Bot size={15} color={theme.accent} />
    </div>
    <div style={{
      padding: '12px 16px', borderRadius: '16px 16px 16px 4px',
      background: theme.surfaceHigh, border: `1px solid ${theme.border}`,
      display: 'flex', alignItems: 'center', gap: 8,
    }}>
      <div style={{ display: 'flex', gap: 4 }}>
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.15 }}
            style={{ width: 6, height: 6, borderRadius: '50%', background: theme.accent, opacity: 0.7 }}
          />
        ))}
      </div>
      {statusText && <span style={{ fontSize: 11, color: theme.muted, fontWeight: 600 }}>{statusText}</span>}
    </div>
  </div>
);

// ===== Booking Progress Stepper =====
interface BookingStep {
  key: string;
  label: string;
  icon: React.ReactNode;
}

const BOOKING_STEPS = (t: (key: string) => string): BookingStep[] => [
  { key: 'movie', label: t('chatbot.bookingStepMovie'), icon: <Film size={11} /> },
  { key: 'date', label: t('chatbot.bookingStepDate'), icon: <Clock size={11} /> },
  { key: 'cinema', label: t('chatbot.bookingStepCinema'), icon: <MapPin size={11} /> },
  { key: 'showtime', label: t('chatbot.bookingStepShowtime'), icon: <Ticket size={11} /> },
  { key: 'seat', label: t('chatbot.bookingStepSeat'), icon: <Armchair size={11} /> },
  { key: 'payment', label: t('chatbot.bookingStepPayment'), icon: <CreditCard size={11} /> },
];

const getBookingStepIndex = (draft: BookingDraft): number => {
  if (draft.paymentUrl || draft.ticket) return 5;
  if (draft.seatMap || draft.suggestedSeats.length > 0) return 4;
  if (draft.showtime) return 3;
  if (draft.cinema) return 2;
  if (draft.date) return 1;
  if (draft.movie) return 0;
  if (draft.bookingPath) return 0;
  return -1;
};

const BookingProgressStepper: React.FC<{ activeStep: number }> = ({ activeStep }) => {
  const { t } = useTranslation();
  if (activeStep < 0) return null;
  const steps = BOOKING_STEPS(t);
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 2, padding: '10px 14px',
      background: 'rgba(255,255,255,0.03)', borderBottom: `1px solid ${theme.border}`,
      overflowX: 'auto', flexShrink: 0,
    }}>
      {steps.map((step, idx) => {
        const isActive = idx === activeStep;
        const isDone = idx < activeStep;
        return (
          <React.Fragment key={step.key}>
            {idx > 0 && <div style={{ width: 12, height: 1, background: isDone ? theme.accent : theme.border, flexShrink: 0 }} />}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '4px 8px', borderRadius: 8,
              background: isActive ? theme.accentSoft : 'transparent',
              border: isActive ? `1px solid ${theme.accent}33` : '1px solid transparent',
              flexShrink: 0,
            }}>
              {isDone ? <CheckCircle size={12} color={theme.accent} /> : step.icon}
              <span style={{
                fontSize: 10, fontWeight: isActive ? 900 : 700,
                color: isActive ? theme.accent : isDone ? theme.text : theme.muted,
                whiteSpace: 'nowrap',
              }}>{step.label}</span>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ===== Quick Reply Chips =====
interface QuickReply {
  label: string;
  value: string;
  icon?: React.ReactNode;
}

const QuickReplyChips: React.FC<{ replies: QuickReply[]; onSelect: (value: string) => void }> = ({ replies, onSelect }) => {
  if (!replies.length) return null;
  return (
    <div style={{
      display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8, paddingLeft: 40,
    }}>
      {replies.map(reply => (
        <button
          key={reply.label}
          onClick={() => onSelect(reply.value)}
          style={{
            ...ghostButton,
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '6px 10px', fontSize: 11, fontWeight: 700,
            background: 'rgba(255,255,255,0.06)', color: theme.text,
            border: `1px solid ${theme.border}`, borderRadius: 8,
            whiteSpace: 'nowrap', cursor: 'pointer',
          }}
        >
          {reply.icon}
          {reply.label}
        </button>
      ))}
    </div>
  );
};

const ChoicePicker: React.FC<{
  title: string;
  icon: React.ReactNode;
  options: ChoiceOption[];
  onPick: (value: string, option: ChoiceOption) => void;
}> = ({ title, icon, options, onPick }) => (
  <ActionShell title={title} icon={icon}>
    <div style={{ display: 'grid', gap: 8 }}>
      {options.map(option => {
        const value = option.value || option.id || option.label;
        return (
          <button
            key={value}
            onClick={() => onPick(value, option)}
            style={{ ...optionButtonStyle, alignItems: 'flex-start' }}
          >
            <span style={{ textAlign: 'left', minWidth: 0 }}>
              <span style={{ display: 'block', fontWeight: 900 }}>{option.label}</span>
              {option.description && (
                <span style={{ display: 'block', color: theme.muted, fontSize: 11, marginTop: 2 }}>
                  {option.description}
                </span>
              )}
            </span>
            <Check size={14} />
          </button>
        );
      })}
    </div>
  </ActionShell>
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

  // Phan chia ngay theo thang/nam
  const groupedByMonth = useMemo(() => {
    const groups: { label: string; dates: string[] }[] = [];
    const monthNames = [
      'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
      'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12',
    ];

    for (const date of dates) {
      const d = new Date(date);
      if (isNaN(d.getTime())) continue;
      const monthLabel = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;

      let group = groups.find(g => g.label === monthLabel);
      if (!group) {
        group = { label: monthLabel, dates: [] };
        groups.push(group);
      }
      group.dates.push(date);
    }
    return groups;
  }, [dates]);

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
      {groupedByMonth.length > 0 && (
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {groupedByMonth.map(group => (
            <div key={group.label}>
              <div style={{
                fontSize: 10, fontWeight: 900, color: theme.accent,
                textTransform: 'uppercase', letterSpacing: '0.08em',
                marginBottom: 6, fontFamily: "'JetBrains Mono', monospace",
              }}>
                {group.label}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {group.dates.map(date => (
                  <button key={date} onClick={() => onPick(date.slice(0, 10))} style={{ ...ghostButton, whiteSpace: 'nowrap', fontSize: 12 }}>
                    {formatDate(date)}
                  </button>
                ))}
              </div>
            </div>
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

const GenrePicker: React.FC<{
  genres: PublicGenre[];
  onPick: (genre: PublicGenre) => void;
}> = ({ genres, onPick }) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const filtered = genres
    .filter(genre => `${genre.genreName} ${genre.description || ''}`.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 16);

  return (
    <ActionShell title={t('chatbot.genrePicker')} icon={<Film size={13} />}>
      <SearchInput value={query} onChange={setQuery} placeholder={t('chatbot.searchGenre')} />
      <div style={{ display: 'grid', gap: 7, marginTop: 8 }}>
        {filtered.map(genre => (
          <button key={genre.genreId} onClick={() => onPick(genre)} style={{ ...optionButtonStyle, alignItems: 'flex-start' }}>
            <span style={{ textAlign: 'left', minWidth: 0 }}>
              <span style={{ display: 'block', fontWeight: 900 }}>{genre.genreName}</span>
              {genre.description && (
                <span style={{ display: 'block', color: theme.muted, fontSize: 11, marginTop: 2 }}>{genre.description}</span>
              )}
            </span>
            <Check size={14} />
          </button>
        ))}
      </div>
    </ActionShell>
  );
};

const ShowtimePreferencePicker: React.FC<{
  onPick: (mode: ShowtimePickMode) => void;
}> = ({ onPick }) => {
  const { t } = useTranslation();
  return (
    <ActionShell title={t('chatbot.showtimePreference')} icon={<Clock size={13} />}>
      <div style={{ display: 'grid', gap: 8 }}>
        <button onClick={() => onPick('time')} style={{ ...optionButtonStyle, alignItems: 'flex-start' }}>
          <span style={{ textAlign: 'left' }}>
            <span style={{ display: 'block', fontWeight: 900 }}>{t('chatbot.showtimeByTime')}</span>
            <span style={{ display: 'block', color: theme.muted, fontSize: 11, marginTop: 2 }}>{t('chatbot.showtimeByTimeDesc')}</span>
          </span>
          <Check size={14} />
        </button>
        <button onClick={() => onPick('format')} style={{ ...optionButtonStyle, alignItems: 'flex-start' }}>
          <span style={{ textAlign: 'left' }}>
            <span style={{ display: 'block', fontWeight: 900 }}>{t('chatbot.showtimeByFormat')}</span>
            <span style={{ display: 'block', color: theme.muted, fontSize: 11, marginTop: 2 }}>{t('chatbot.showtimeByFormatDesc')}</span>
          </span>
          <Check size={14} />
        </button>
      </div>
    </ActionShell>
  );
};

const ShowtimePicker: React.FC<{
  showtimes: ShowtimeOption[];
  mode?: ShowtimePickMode;
  onPick: (showtime: ShowtimeOption) => void;
}> = ({ showtimes, mode = 'time', onPick }) => {
  const { t } = useTranslation();
  const formats = Array.from(new Set(showtimes.map(showtime => showtime.formatName))).sort((a, b) => a.localeCompare(b));
  const [selectedFormat, setSelectedFormat] = useState<string>(mode === 'format' ? '' : 'all');
  const visibleShowtimes = (mode === 'format' && selectedFormat)
    ? showtimes.filter(showtime => showtime.formatName === selectedFormat)
    : mode === 'format'
      ? []
      : showtimes;

  return (
    <ActionShell title={t('chatbot.showtimePicker')} icon={<Clock size={13} />}>
      {mode === 'format' && (
        <div style={{ display: 'grid', gap: 7, marginBottom: selectedFormat ? 10 : 0 }}>
          {formats.map(format => {
            const count = showtimes.filter(showtime => showtime.formatName === format).length;
            const firstTime = showtimes.filter(showtime => showtime.formatName === format).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())[0];
            return (
              <button
                key={format}
                onClick={() => setSelectedFormat(format)}
                style={{
                  ...optionButtonStyle,
                  borderColor: selectedFormat === format ? theme.accent : theme.border,
                  background: selectedFormat === format ? theme.accentSoft : 'rgba(255,255,255,0.055)',
                }}
              >
                <span style={{ textAlign: 'left' }}>
                  <span style={{ display: 'block', fontWeight: 900 }}>{format}</span>
                  <span style={{ display: 'block', color: theme.muted, fontSize: 11, marginTop: 2 }}>
                    {t('chatbot.formatShowtimeCount', { count, first: formatTime(firstTime?.startTime) })}
                  </span>
                </span>
                <Check size={14} />
              </button>
            );
          })}
        </div>
      )}
      <div style={{ display: 'grid', gap: 7 }}>
        {visibleShowtimes.map(showtime => (
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
  ageRestriction?: string;
  onPick: (segment: PublicSegmentPrice, quantity: number) => void;
}> = ({ pricing, ageRestriction, onPick }) => {
  const { t } = useTranslation();

  const filteredSegments = useMemo(() => {
    const age = ageRestriction?.trim();
    if (!age || age === 'P' || age === 'K') return pricing.segmentPrices;
    if (age === 'T13' || age === 'T16' || age === 'T18') {
      return pricing.segmentPrices.filter(s => s.segmentName !== 'Child');
    }
    return pricing.segmentPrices;
  }, [pricing.segmentPrices, ageRestriction]);

  const [segmentId, setSegmentId] = useState(filteredSegments[0]?.userSegmentId || '');
  const [quantity, setQuantity] = useState(1);
  const segment = filteredSegments.find(item => item.userSegmentId === segmentId) || filteredSegments[0];

  return (
    <ActionShell title={t('chatbot.segmentPicker')} icon={<Ticket size={13} />}>
      <div style={{ display: 'grid', gap: 8 }}>
        {filteredSegments.map(item => (
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

const SeatMapBoard: React.FC<{
  seatMap?: PublicSeatMap;
  highlightedSeats: NormalizedSeat[];
  selectedSeats?: NormalizedSeat[];
  interactive?: boolean;
  onToggleSeat?: (seat: NormalizedSeat) => void;
}> = ({ seatMap, highlightedSeats, selectedSeats = [], interactive, onToggleSeat }) => {
  const { t } = useTranslation();
  const seats = normalizeSeatMap(seatMap);
  const { maxCol, maxRow } = getSeatGridMetrics(seats);
  const highlightedIds = new Set(highlightedSeats.map(seat => seat.seatId));
  const selectedIds = new Set(selectedSeats.map(seat => seat.seatId));

  if (!seatMap || seats.length === 0 || maxCol === 0 || maxRow === 0) {
    return null;
  }

  return (
    <div>
      <div style={{
        height: 18,
        borderRadius: '0 0 999px 999px',
        borderBottom: `3px solid ${theme.accent}`,
        background: 'linear-gradient(180deg, rgba(245,124,0,0.18), rgba(245,124,0,0.02))',
        margin: '0 auto 10px',
        maxWidth: 260,
      }} />
      <div style={{ textAlign: 'center', color: theme.muted, fontSize: 10, fontWeight: 900, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 10 }}>
        Screen
      </div>
      <div style={{
        overflow: 'auto',
        maxHeight: interactive ? '58vh' : 260,
        padding: 8,
        borderRadius: 12,
        background: 'rgba(0,0,0,0.18)',
        border: `1px solid ${theme.border}`,
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${maxCol}, minmax(28px, 1fr))`,
          gridTemplateRows: `repeat(${maxRow}, minmax(28px, 1fr))`,
          gap: 5,
          minWidth: Math.max(maxCol * 34, 280),
          position: 'relative',
        }}>
          {seatMap.centerRowStart !== undefined &&
            seatMap.centerRowEnd !== undefined &&
            seatMap.centerColStart !== undefined &&
            seatMap.centerColEnd !== undefined && (
              <div style={{
                gridRowStart: seatMap.centerRowStart + 1,
                gridRowEnd: seatMap.centerRowEnd + 2,
                gridColumnStart: seatMap.centerColStart + 1,
                gridColumnEnd: seatMap.centerColEnd + 2,
                border: '1px dashed rgba(245,124,0,0.55)',
                borderRadius: 10,
                pointerEvents: 'none',
                margin: -3,
              }} />
            )}
          {seats.map(seat => {
            const selected = selectedIds.has(seat.seatId);
            const highlighted = highlightedIds.has(seat.seatId);
            const center = isCenterSeat(seat, seatMap);
            const disabled = seat.isOccupied;
            return (
              <button
                key={seat.seatId}
                disabled={disabled || !interactive}
                onClick={() => onToggleSeat?.(seat)}
                title={seat.seatNumber}
                style={{
                  ...baseButton,
                  gridColumnStart: seat.colIndex + 1,
                  gridRowStart: seat.rowIndex + 1,
                  aspectRatio: '1 / 1',
                  minWidth: 28,
                  minHeight: 28,
                  borderRadius: 8,
                  fontSize: 10,
                  fontWeight: 900,
                  border: selected
                    ? `1px solid ${theme.accent}`
                    : highlighted
                      ? `1px solid ${theme.success}`
                      : center
                        ? '1px solid rgba(245,124,0,0.45)'
                        : `1px solid ${theme.border}`,
                  background: disabled
                    ? 'rgba(255,255,255,0.035)'
                    : selected
                      ? `linear-gradient(135deg, ${theme.accent}, ${theme.accentHover})`
                      : highlighted
                        ? 'rgba(34,197,94,0.22)'
                        : center
                          ? theme.accentSoft
                          : 'rgba(255,255,255,0.08)',
                  color: disabled ? 'rgba(255,255,255,0.28)' : selected ? '#fff' : highlighted ? '#86efac' : theme.text,
                  opacity: disabled ? 0.55 : 1,
                  cursor: disabled || !interactive ? 'default' : 'pointer',
                }}
              >
                {seat.seatNumber}
              </button>
            );
          })}
        </div>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8, color: theme.muted, fontSize: 10, fontWeight: 800 }}>
        <span><span style={{ color: theme.text }}>■</span> {t('chatbot.seatLegendAvailable')}</span>
        <span><span style={{ color: theme.accent }}>■</span> {t('chatbot.seatLegendCenter')}</span>
        <span><span style={{ color: theme.success }}>■</span> {t('chatbot.seatLegendSuggested')}</span>
        <span><span style={{ color: 'rgba(255,255,255,0.35)' }}>■</span> {t('chatbot.seatLegendOccupied')}</span>
      </div>
    </div>
  );
};

const SeatSelectionModal: React.FC<{
  seatMap?: PublicSeatMap;
  suggestedSeats: NormalizedSeat[];
  quantity: number;
  onClose: () => void;
  onConfirm: (seats: NormalizedSeat[]) => void;
}> = ({ seatMap, suggestedSeats, quantity, onClose, onConfirm }) => {
  const { t } = useTranslation();
  const [selectedSeats, setSelectedSeats] = useState<NormalizedSeat[]>(suggestedSeats);

  const toggleSeat = (seat: NormalizedSeat) => {
    if (seat.isOccupied) return;
    setSelectedSeats(prev => {
      if (prev.some(item => item.seatId === seat.seatId)) {
        return prev.filter(item => item.seatId !== seat.seatId);
      }
      if (prev.length >= quantity) return prev;
      return [...prev, seat];
    });
  };

  const complete = selectedSeats.length === quantity;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 10000,
      background: 'rgba(0,0,0,0.68)',
      display: 'grid',
      placeItems: 'center',
      padding: 16,
    }}>
      <div style={{
        width: 'min(920px, 100%)',
        maxHeight: 'calc(100vh - 32px)',
        overflow: 'hidden',
        borderRadius: 16,
        background: theme.surface,
        border: `1px solid ${theme.border}`,
        boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, borderBottom: `1px solid ${theme.border}` }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: theme.text, fontWeight: 900 }}>{t('chatbot.manualSeatTitle')}</div>
            <div style={{ color: theme.muted, fontSize: 12, marginTop: 2 }}>
              {t('chatbot.manualSeatCount', { selected: selectedSeats.length, total: quantity })}
            </div>
          </div>
          <button onClick={onClose} style={{ ...ghostButton, width: 36, height: 36, padding: 0, display: 'grid', placeItems: 'center' }}>
            <X size={16} />
          </button>
        </div>
        <div style={{ padding: 14, overflow: 'auto' }}>
          <SeatMapBoard
            seatMap={seatMap}
            highlightedSeats={suggestedSeats}
            selectedSeats={selectedSeats}
            interactive
            onToggleSeat={toggleSeat}
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: 14, borderTop: `1px solid ${theme.border}` }}>
          <button onClick={onClose} style={ghostButton}>{t('chatbot.cancelManualSeats')}</button>
          <button disabled={!complete} onClick={() => onConfirm(selectedSeats)} style={{ ...primaryButton, opacity: complete ? 1 : 0.5 }}>
            {t('chatbot.confirmManualSeats')}
          </button>
        </div>
      </div>
    </div>
  );
};

const SeatSuggestionCard: React.FC<{
  seatMap?: PublicSeatMap;
  seats: NormalizedSeat[];
  quantity: number;
  onAccept: (seats?: NormalizedSeat[]) => void;
  onRetry: () => void;
}> = ({ seatMap, seats, quantity, onAccept, onRetry }) => {
  const { t } = useTranslation();
  const [manualOpen, setManualOpen] = useState(false);

  return (
    <ActionShell title={t('chatbot.seatSuggestion')} icon={<Armchair size={13} />}>
      {seats.length === 0 ? (
        <>
          <p style={{ margin: '0 0 10px', color: theme.muted, fontSize: 12 }}>{t('chatbot.noSeatsFound')}</p>
          <button onClick={onRetry} style={{ ...ghostButton, width: '100%' }}>{t('chatbot.retry')}</button>
        </>
      ) : (
        <>
          <SeatMapBoard seatMap={seatMap} highlightedSeats={seats} />
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
            <button onClick={() => onAccept()} style={primaryButton}>{t('chatbot.acceptSeats')}</button>
          </div>
          <button onClick={() => setManualOpen(true)} style={{ ...ghostButton, width: '100%', marginTop: 8 }}>
            {t('chatbot.pickSeatsManually')}
          </button>
          {manualOpen && (
            <SeatSelectionModal
              seatMap={seatMap}
              suggestedSeats={seats}
              quantity={quantity}
              onClose={() => setManualOpen(false)}
              onConfirm={(selected) => {
                setManualOpen(false);
                onAccept(selected);
              }}
            />
          )}
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

const TicketCard: React.FC<{ ticket: TicketInfo }> = ({ ticket }) => {
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
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '6px 0', borderBottom: `1px solid ${theme.border}` }}>
        <span style={{ color: theme.muted }}>{t('chatbot.total')}</span>
        <span style={{ color: theme.accent, fontWeight: 900, textAlign: 'right', overflowWrap: 'anywhere' }}>{formatCurrency(ticket.totalPrice)}</span>
      </div>
      <button onClick={() => downloadTicketAsPdf(ticket)} style={{ ...primaryButton, width: '100%', marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
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
  overflow: 'hidden',
  minWidth: 0,
};

const RequestLocationCard: React.FC<{
  onShare: () => void;
  onManual: () => void;
}> = ({ onShare, onManual }) => {
  return (
    <ActionShell title="Định vị vị trí" icon={<Navigation size={13} />}>
      <p style={{ margin: '0 0 10px', color: theme.muted, fontSize: 12, lineHeight: 1.4 }}>
        Để tìm các rạp gần bạn nhất, vui lòng chia sẻ vị trí hiện tại của bạn.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <button onClick={onManual} style={ghostButton}>Chọn thủ công</button>
        <button onClick={onShare} style={primaryButton}>Chia sẻ vị trí</button>
      </div>
    </ActionShell>
  );
};

const ChatActionRenderer: React.FC<{
  action: ChatAction;
  draft: BookingDraft;
  onPickBookingPath: (mode: BookingPathMode) => void;
  onPickDiscoveryMode: (mode: DiscoveryMode) => void;
  onPickGenre: (genre: PublicGenre) => void;
  onPickMovie: (movie: ActiveMovie) => void;
  onPickDate: (date: string) => void;
  onPickCinema: (cinema: CinemaOption) => void;
  onPickShowtimePreference: (mode: ShowtimePickMode, showtimes: ShowtimeOption[]) => void;
  onPickShowtime: (showtime: ShowtimeOption) => void;
  onPickSegment: (segment: PublicSegmentPrice, quantity: number) => void;
  onAcceptSeats: (seats?: NormalizedSeat[]) => void;
  onRetrySeats: () => void;
  onVoucherMode: (mode: 'owned' | 'redeem' | 'skip') => void;
  onPickOwnedVoucher: (voucher: UserVoucherDto) => void;
  onRedeemVoucher: (voucher: VoucherDto) => void;
  onGuestContact: (contact: GuestContact) => void;
  onConfirmBooking: () => void;
  onOpenPayment: () => void;
  onCheckPayment: () => void;
  paymentChecking: boolean;
  onShareLocation: () => void;
  onManualLocation: () => void;
}> = ({
  action,
  draft,
  onPickBookingPath,
  onPickDiscoveryMode,
  onPickGenre,
  onPickMovie,
  onPickDate,
  onPickCinema,
  onPickShowtimePreference,
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
  paymentChecking,
  onShareLocation,
  onManualLocation,
}) => {
  const { t } = useTranslation();
  const bookingPathOptions: ChoiceOption[] = action.payload?.options || [
    { value: 'movieFirst', label: t('chatbot.bookingPathMovie'), description: t('chatbot.bookingPathMovieDesc') },
    { value: 'cinemaFirst', label: t('chatbot.bookingPathCinema'), description: t('chatbot.bookingPathCinemaDesc') },
  ];
  const discoveryModeOptions: ChoiceOption[] = action.payload?.options || [
    { value: 'genreFirst', label: t('chatbot.discoveryGenre'), description: t('chatbot.discoveryGenreDesc') },
    { value: 'timeFirst', label: t('chatbot.discoveryTime'), description: t('chatbot.discoveryTimeDesc') },
  ];

  switch (action.type) {
    case 'bookingPathPicker':
      return (
        <ChoicePicker
          title={t('chatbot.bookingPathPicker')}
          icon={<Navigation size={13} />}
          options={bookingPathOptions}
          onPick={(value) => onPickBookingPath(value === 'cinemaFirst' ? 'cinemaFirst' : 'movieFirst')}
        />
      );
    case 'discoveryModePicker':
      return (
        <ChoicePicker
          title={t('chatbot.discoveryModePicker')}
          icon={<Search size={13} />}
          options={discoveryModeOptions}
          onPick={(value) => onPickDiscoveryMode(value === 'timeFirst' ? 'timeFirst' : 'genreFirst')}
        />
      );
    case 'genrePicker':
      return <GenrePicker genres={action.payload?.genres || []} onPick={onPickGenre} />;
    case 'moviePicker':
      return <MoviePicker movies={action.payload?.movies || []} onPick={onPickMovie} />;
    case 'datePicker':
      return <DatePicker dates={action.payload?.dates || []} onPick={onPickDate} />;
    case 'cinemaPicker':
      return <CinemaPicker cinemas={action.payload?.cinemas || []} onPick={onPickCinema} />;
    case 'showtimePreferencePicker':
      return <ShowtimePreferencePicker onPick={(mode) => onPickShowtimePreference(mode, action.payload?.showtimes || [])} />;
    case 'showtimePicker':
      return <ShowtimePicker showtimes={action.payload?.showtimes || []} mode={action.payload?.mode || 'time'} onPick={onPickShowtime} />;
    case 'segmentQuantityPicker':
      return action.payload?.pricing ? <SegmentQuantityPicker pricing={action.payload.pricing} ageRestriction={action.payload.pricing.ageRestriction} onPick={onPickSegment} /> : null;
    case 'seatSuggestion':
      return <SeatSuggestionCard seatMap={draft.seatMap} seats={draft.suggestedSeats} quantity={draft.quantity} onAccept={onAcceptSeats} onRetry={onRetrySeats} />;
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
      return draft.ticket ? <TicketCard ticket={draft.ticket} /> : null;
    case 'requestLocation':
      return <RequestLocationCard onShare={onShareLocation} onManual={onManualLocation} />;
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
  const [paymentChecking, setPaymentChecking] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Toggle body class when chatbot opens/closes
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('chatbot-open');
    } else {
      document.body.classList.remove('chatbot-open');
    }
    return () => document.body.classList.remove('chatbot-open');
  }, [isOpen]);

  // Auto-resize textarea when input changes
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const scrollHeight = textarea.scrollHeight;
      textarea.style.height = Math.min(scrollHeight, 120) + 'px';
    }
  }, [input]);

  const paymentWindowRef = useRef<Window | null>(null);
  const chatSessionIdRef = useRef(getChatSessionId());

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const isNearBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 150;
    setShowScrollButton(!isNearBottom);
  };

  useEffect(() => {
    sessionStorage.setItem(CHAT_HISTORY_STORAGE_KEY, JSON.stringify(messages));
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setShowScrollButton(false);
  }, [messages]);

  useEffect(() => {
    sessionStorage.setItem(CHAT_DRAFT_STORAGE_KEY, JSON.stringify(draft));
  }, [draft]);



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



  const sendMessageWithSse = useCallback(async (
    text: string,
    onToken: (streamedText: string) => void,
    onStatus?: (statusText: string) => void,
  ): Promise<ChatbotResponsePayload> => {
    const language = localStorage.getItem('language') || 'vi';
    const accessToken = getStoredAccessToken();
    const response = await fetch(`${API_BASE_URL}/api/v1/chatbot/chat/stream`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        Accept: 'text/event-stream',
        'Content-Type': 'application/json',
        'Accept-Language': language,
        'X-Language': language,
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify({ message: text, sessionId: chatSessionIdRef.current }),
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
        finalPayload = { ...finalPayload, ...payload, response: payload.response || streamedText };
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

  const executeSendMessage = useCallback(async (agentTextToSend: string, displayTextToShow?: string) => {
    const agentText = agentTextToSend.trim();
    const displayText = (displayTextToShow || agentTextToSend).trim();
    if (!agentText || isLoading) return;

    appendUser(stripInternalChatMarkup(displayText) || displayText);
    const botMessageId = uid('bot');
    setMessages(prev => [...prev, {
      id: botMessageId,
      role: 'bot',
      text: t('chatbot.connecting'),
      createdAt: new Date().toISOString(),
    }]);
    setIsLoading(true);

    const updateBot = (textValue: string, extra?: Partial<ChatMessage>) => {
      const cleanText = stripInternalChatMarkup(textValue);
      setMessages(prev => prev.map(message => message.id === botMessageId ? { ...message, text: cleanText, ...extra } : message));
    };

    try {
      let botData: ChatbotResponsePayload;
      try {
        botData = await sendMessageWithSse(agentText, streamed => updateBot(streamed), status => updateBot(status));
      } catch {
        setStreamStatus(t('chatbot.fallbackConnection'));
        const accessToken = getStoredAccessToken();
        const response = await identityAxios.post(
          '/chatbot/chat',
          { message: agentText, sessionId: chatSessionIdRef.current },
          accessToken ? { headers: { Authorization: `Bearer ${accessToken}` } } : undefined
        );
        botData = response.data?.data || {};
      }

      const actions = botData.uiActions || [];
      const cleanFinalResponse = stripInternalChatMarkup(botData.response);

      updateBot(cleanFinalResponse || t('chatbot.errorDefault'), {
        movies: botData.referencedMovies || [],
        schedules: botData.referencedSchedules || [],
        actions: actions,
      });

      if (botData.bookingState) {
        setDraft(prev => ({
          ...prev,
          ...botData.bookingState,
        }));
      }

      if (actions.length > 0) {
        const action = actions[0];
        if (action.payload?.bookingState) {
          setDraft(prev => ({
            ...prev,
            ...action.payload.bookingState,
          }));
        }
        if (action.type === 'seatSuggestion' && action.payload) {
          const suggestedSeats = action.payload.suggestedSeats || action.payload.seats || [];
          setDraft(prev => ({
            ...prev,
            seatMap: action.payload.seatMap || prev.seatMap,
            suggestedSeats,
            quantity: action.payload.quantity || 0,
            showtime: action.payload.scheduleId ? { scheduleId: action.payload.scheduleId } as any : prev.showtime
          }));
        } else if (action.type === 'segmentQuantityPicker' && action.payload?.pricing) {
          setDraft(prev => ({
            ...prev,
            pricing: action.payload.pricing,
            ageRestriction: action.payload.pricing.ageRestriction || '',
          }));
        } else if (action.type === 'showtimePreferencePicker' && action.payload?.showtimes) {
          setDraft(prev => ({
            ...prev,
            availableShowtimes: action.payload.showtimes,
          }));
        } else if (action.type === 'showtimePicker' && action.payload?.showtimes) {
          setDraft(prev => ({
            ...prev,
            availableShowtimes: action.payload.showtimes,
            showtimePreference: action.payload.mode || prev.showtimePreference,
          }));
        } else if (action.type === 'paymentAction' && action.payload) {
          setDraft(prev => ({
            ...prev,
            paymentUrl: action.payload.paymentUrl,
            order: { orderId: action.payload.orderId } as any,
          }));
        }
      }
    } catch {
      updateBot(t('chatbot.errorBusy'));
    } finally {
      setStreamStatus('');
      setIsLoading(false);
    }
  }, [appendUser, isLoading, sendMessageWithSse, t]);

  const handlePickBookingPath = useCallback(async (mode: BookingPathMode) => {
    const label = mode === 'cinemaFirst' ? 'theo rạp trước' : 'theo phim trước';
    setDraft(prev => ({ ...prev, bookingPath: mode }));
    await executeSendMessage(agentSelection('bookingPathSelected', { bookingPath: mode }, buildBookingState(draft, { bookingPath: mode })), `Tôi muốn bắt đầu ${label}`);
  }, [draft, executeSendMessage]);

  const handlePickDiscoveryMode = useCallback(async (mode: DiscoveryMode) => {
    const label = mode === 'timeFirst' ? 'theo giờ chiếu trước' : 'theo thể loại phim trước';
    setDraft(prev => ({ ...prev, discoveryMode: mode }));
    await executeSendMessage(agentSelection('discoveryModeSelected', { discoveryMode: mode }, buildBookingState(draft, { discoveryMode: mode })), `Tôi muốn chọn ${label}`);
  }, [draft, executeSendMessage]);

  const handlePickGenre = useCallback(async (genre: PublicGenre) => {
    setDraft(prev => ({ ...prev, genre }));
    await executeSendMessage(
      agentSelection('genreSelected', { genreId: genre.genreId, genreName: genre.genreName }, buildBookingState(draft, { genre })),
      `Tôi chọn thể loại: ${genre.genreName}`
    );
  }, [draft, executeSendMessage]);

  const handlePickMovie = useCallback(async (movie: ActiveMovie) => {
    setDraft(prev => ({ ...prev, movie }));
    await executeSendMessage(
      agentSelection('movieSelected', { movieId: movie.movieId, movieName: movie.movieName }, buildBookingState(draft, { movie })),
      `Tôi chọn phim: ${movie.movieName}`
    );
  }, [draft, executeSendMessage]);

  const handlePickDate = useCallback(async (date: string) => {
    setDraft(prev => ({ ...prev, date }));
    await executeSendMessage(agentSelection('dateSelected', { date }, buildBookingState(draft, { date })), `Tôi chọn ngày: ${formatDate(date)}`);
  }, [draft, executeSendMessage]);

  const handlePickCinema = useCallback(async (cinema: CinemaOption) => {
    setDraft(prev => ({ ...prev, cinema }));
    await executeSendMessage(
      agentSelection('cinemaSelected', { cinemaId: cinema.cinemaId, cinemaName: cinema.cinemaName }, buildBookingState(draft, { cinema })),
      `Tôi chọn rạp: ${cinema.cinemaName}`
    );
  }, [draft, executeSendMessage]);

  const handlePickShowtimePreference = useCallback(async (mode: ShowtimePickMode) => {
    const text = mode === 'time' ? "Tôi muốn chọn suất chiếu theo khung giờ" : "Tôi muốn chọn suất chiếu theo định dạng";
    const patch: Partial<BookingDraft> = { showtimePreference: mode };
    if (mode === 'format') {
      patch.formatName = undefined;
    }
    setDraft(prev => ({ ...prev, ...patch }));
    await executeSendMessage(agentSelection('showtimePreferenceSelected', { mode, ...patch }, buildBookingState(draft, { ...patch })), text);
  }, [draft, executeSendMessage]);

  const handlePickShowtime = useCallback(async (showtime: ShowtimeOption) => {
    const timeStr = `${formatDate(showtime.startTime)} ${formatTime(showtime.startTime)}`;
    setDraft(prev => ({ ...prev, showtime, formatName: showtime.formatName }));
    await executeSendMessage(
      agentSelection('showtimeSelected', {
        scheduleId: showtime.scheduleId,
        movieId: showtime.movieId,
        movieName: showtime.movieName,
        cinemaId: showtime.cinemaId,
        cinemaName: showtime.cinemaName,
        formatName: showtime.formatName,
        startTime: showtime.startTime,
      }, buildBookingState(draft, { showtime, formatName: showtime.formatName })),
      `Tôi chọn suất chiếu: ${timeStr} (${showtime.formatName})`
    );
  }, [draft, executeSendMessage]);

  const handlePickSegment = useCallback(async (segment: PublicSegmentPrice, quantity: number) => {
    setDraft(prev => ({ ...prev, segment, quantity }));
    await executeSendMessage(
      agentSelection('ticketSegmentSelected', {
        userSegmentId: segment.userSegmentId,
        segmentName: segment.segmentName,
        quantity,
      }, buildBookingState(draft, { segment, quantity })),
      `Tôi chọn ${quantity} vé ${segment.segmentName}`
    );
  }, [draft, executeSendMessage]);

  const handleAcceptSeats = useCallback(async (seats?: NormalizedSeat[]) => {
    const selectedSeats = seats?.length ? seats : draft.suggestedSeats;
    setDraft(prev => ({ ...prev, suggestedSeats: selectedSeats }));
    const seatNumbers = selectedSeats.map(seat => seat.seatNumber).join(', ');
    await executeSendMessage(
      agentSelection('seatsSelected', {
        seatIds: selectedSeats.map(seat => seat.seatId),
        seatNumbers: selectedSeats.map(seat => seat.seatNumber),
      }, buildBookingState(draft, { suggestedSeats: selectedSeats })),
      `Tôi chọn ghế: ${seatNumbers}`
    );
  }, [draft, executeSendMessage]);

  const handleRetrySeats = useCallback(async () => {
    await executeSendMessage("Gợi ý ghế khác cho tôi");
  }, [executeSendMessage]);

  const handleVoucherMode = useCallback(async (mode: 'owned' | 'redeem' | 'skip') => {
    if (mode === 'skip') {
      await executeSendMessage(agentSelection('voucherModeSelected', { mode }, buildBookingState(draft)), "Tôi muốn bỏ qua voucher");
    } else if (mode === 'redeem') {
      await executeSendMessage(agentSelection('voucherModeSelected', { mode }, buildBookingState(draft)), "Tôi muốn mua voucher bằng điểm");
    } else {
      await executeSendMessage(agentSelection('voucherModeSelected', { mode }, buildBookingState(draft)), "Tôi muốn dùng voucher đang có");
    }
  }, [draft, executeSendMessage]);

  const handlePickOwnedVoucher = useCallback(async (voucher: UserVoucherDto) => {
    setDraft(prev => ({ ...prev, voucherId: voucher.userVoucherId, voucherName: voucher.voucherName }));
    const voucherId = voucher.userVoucherId;
    const voucherName = voucher.voucherName;
    await executeSendMessage(
      agentSelection('ownedVoucherSelected', {
        userVoucherId: voucher.userVoucherId,
        voucherId: (voucher as any).voucherId,
        voucherName: voucher.voucherName,
      }, buildBookingState(draft, { voucherId, voucherName })),
      `Tôi chọn voucher: ${voucher.voucherName}`
    );
  }, [draft, executeSendMessage]);

  const handleRedeemVoucher = useCallback(async (voucher: VoucherDto) => {
    setDraft(prev => ({ ...prev, voucherId: voucher.voucherId, voucherName: voucher.voucherName }));
    const voucherId = voucher.voucherId;
    const voucherName = voucher.voucherName;
    await executeSendMessage(
      agentSelection('redeemVoucherSelected', { voucherId: voucher.voucherId, voucherName: voucher.voucherName }, buildBookingState(draft, { voucherId, voucherName })),
      `Tôi mua voucher: ${voucher.voucherName}`
    );
  }, [draft, executeSendMessage]);

  const handleGuestContact = useCallback(async (contact: GuestContact) => {
    setDraft(prev => ({ ...prev, guestContact: contact }));
    await executeSendMessage(agentSelection('guestContactSubmitted', { ...contact }, buildBookingState(draft, { guestContact: contact })), "Tôi đã nhập thông tin liên hệ");
  }, [draft, executeSendMessage]);

  const handleConfirmBooking = useCallback(async () => {
    await executeSendMessage(agentSelection('bookingConfirmed', {}, buildBookingState(draft)), "Xác nhận đặt vé và thanh toán");
  }, [draft, executeSendMessage]);

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

  // Redundant old handlers removed



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

  const handleRequestLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      appendBot("Trình duyệt của bạn không hỗ trợ định vị. Vui lòng chọn rạp chiếu phim thủ công.");
      await handleRequestLocationManual();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        await executeSendMessage(
          agentSelection('locationProvided', { latitude, longitude }, buildBookingState(draft)),
          "Tôi đã chia sẻ vị trí của mình"
        );
      },
      async (error) => {
        console.warn("Geolocation permission error:", error);
        appendBot("Không thể truy cập vị trí của bạn. Vui lòng chọn rạp chiếu phim thủ công.");
        await handleRequestLocationManual();
      }
    );
  }, [draft, executeSendMessage, appendBot]);

  const handleRequestLocationManual = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await identityAxios.post(
        '/chatbot/chat',
        { 
          message: agentSelection('bookingPathSelected', { bookingPath: 'cinemaFirst' }, buildBookingState(draft, { bookingPath: 'cinemaFirst' })),
          sessionId: chatSessionIdRef.current 
        }
      );
      const botData = response.data?.data || {};
      const actions = botData.uiActions || [];
      const cleanFinalResponse = stripInternalChatMarkup(botData.response);
      
      setMessages(prev => [...prev, {
        id: uid('bot'),
        role: 'bot',
        text: cleanFinalResponse || "Bạn chọn rạp thủ công dưới đây nhé:",
        actions: actions,
        createdAt: new Date().toISOString()
      }]);
    } catch {
      appendBot("Lỗi tải danh sách rạp. Bạn hãy thử lại sau nhé.");
    } finally {
      setIsLoading(false);
    }
  }, [draft, appendBot]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text) return;
    setInput('');
    await executeSendMessage(text);
  }, [executeSendMessage, input]);

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
            className="chatbot-panel"
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.96 }}
            transition={{ duration: 0.14, ease: 'easeOut' }}
            style={{
              position: 'fixed',
              right: 24,
              bottom: 92,
              zIndex: 9998,
              width: 'calc(100vw - 32px)',
              maxWidth: 430,
              height: 'min(660px, calc(100vh - 170px))',
              maxHeight: 'calc(100vh - 120px)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              overflowX: 'hidden',
              borderRadius: 20,
              background: theme.surface,
              border: `1px solid ${theme.border}`,
              boxShadow: '0 24px 70px rgba(0,0,0,0.55)',
            }}
          >
            <div className="chatbot-header" style={{
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
                <div className="chatbot-header-title" style={{ fontWeight: 900, fontSize: 16 }}>CinemaPro AI</div>
                <div style={{ fontSize: 11, opacity: 0.86, fontWeight: 700, textTransform: 'uppercase' }}>{t('chatbot.subtitle')}</div>
              </div>
              <button onClick={() => setIsOpen(false)} style={{ ...baseButton, width: 34, height: 34, borderRadius: 10, display: 'grid', placeItems: 'center', background: 'rgba(255,255,255,0.12)', color: '#fff' }} title={t('chatbot.close')}>
                <X size={18} />
              </button>
            </div>

            {/* Booking Progress Stepper */}
            <BookingProgressStepper activeStep={getBookingStepIndex(draft)} />

            <div style={{ position: 'relative', flex: 1, minHeight: 0, overflow: 'hidden', minWidth: 0 }}>
              <div
                ref={scrollContainerRef}
                onScroll={handleScroll}
                style={{ height: '100%', overflowY: 'auto', overflowX: 'hidden', padding: 16, display: 'flex', flexDirection: 'column', gap: 14, wordBreak: 'break-word' }}
                className="chatbot-messages"
              >
                {messages.map(message => (
                  <ChatMessageBubble key={message.id} message={message}>
                    {message.actions?.map(action => (
                      <ChatActionRenderer
                        key={action.actionId}
                        action={action}
                        draft={draft}
                        onPickBookingPath={handlePickBookingPath}
                        onPickDiscoveryMode={handlePickDiscoveryMode}
                        onPickGenre={handlePickGenre}
                        onPickMovie={handlePickMovie}
                        onPickDate={handlePickDate}
                        onPickCinema={handlePickCinema}
                        onPickShowtimePreference={handlePickShowtimePreference}
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
                        paymentChecking={paymentChecking}
                        onShareLocation={handleRequestLocation}
                        onManualLocation={handleRequestLocationManual}
                      />
                    ))}
                    {message.movies && message.movies.length > 0 && (
                      <ActionShell title={t('chatbot.relatedMovies')} icon={<Film size={13} />}>
              <div style={{ display: 'flex', gap: 6, overflowX: 'auto', flexWrap: 'nowrap', paddingBottom: 4, WebkitOverflowScrolling: 'touch' }}>
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
                  <TypingIndicator statusText={streamStatus || t('chatbot.processing')} />
                )}
                {/* Quick Reply Suggestions */}
                {messages.length > 0 && !isLoading && (() => {
                  const lastBotMsg = [...messages].reverse().find(m => m.role === 'bot' && m.actions && m.actions.length > 0);
                  if (!lastBotMsg) return null;
                  const replies: QuickReply[] = [];
                  const hasAction = lastBotMsg.actions?.some(a => a.type === 'bookingPathPicker');
                  if (hasAction) {
                    replies.push({ label: 'Chọn phim trước', value: 'Tôi muốn chọn phim trước', icon: <Film size={11} /> });
                    replies.push({ label: 'Chọn rạp trước', value: 'Tôi muốn chọn rạp trước', icon: <MapPin size={11} /> });
                  }
                  const hasShowtimePref = lastBotMsg.actions?.some(a => a.type === 'showtimePreferencePicker');
                  if (hasShowtimePref) {
                    replies.push({ label: 'Theo khung giờ', value: 'Tôi muốn chọn suất theo khung giờ', icon: <Clock size={11} /> });
                    replies.push({ label: 'Theo định dạng', value: 'Tôi muốn chọn suất theo định dạng', icon: <Ticket size={11} /> });
                  }
                  if (replies.length === 0) return null;
                  return <QuickReplyChips replies={replies} onSelect={(v) => { setInput(v); void handleSend(); }} />;
                })()}
                <div ref={messagesEndRef} />
              </div>
              {showScrollButton && (
                <button
                  onClick={() => {
                    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  style={{
                    position: 'absolute',
                    bottom: 16,
                    right: 16,
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: theme.accent,
                    color: '#fff',
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 40,
                  }}
                  title="Cuộn xuống tin nhắn mới nhất"
                >
                  <ArrowDown size={18} />
                </button>
              )}
            </div>

            <div style={{ flexShrink: 0, padding: '8px 14px 0', display: 'flex', gap: 7, overflowX: 'auto', minWidth: 0 }}>
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

            <div style={{ flexShrink: 0, padding: 14, minWidth: 0 }}>
              <div style={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: 8,
                background: 'rgba(255,255,255,0.055)',
                border: `1px solid ${theme.border}`,
                borderRadius: 14,
                padding: '4px 4px 4px 12px',
              }}>
                <textarea
                  ref={textareaRef}
                  value={input}
                  disabled={isLoading}
                  onChange={event => setInput(event.target.value)}
                  onKeyDown={event => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault();
                      void handleSend();
                    }
                  }}
                  placeholder={t('chatbot.placeholder')}
                  rows={1}
                  style={{
                    flex: 1, minWidth: 0, background: 'transparent', border: 'none', outline: 'none',
                    color: theme.text, fontSize: 14, padding: '10px 0', resize: 'none',
                    maxHeight: 120, lineHeight: '20px', fontFamily: 'inherit', overflow: 'auto',
                  }}
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
        .chatbot-panel {
          overflow-x: hidden !important;
          overflow-wrap: break-word !important;
          word-break: break-word !important;
        }
        .chatbot-panel * {
          max-width: 100% !important;
          box-sizing: border-box !important;
        }
        .chatbot-panel div,
        .chatbot-panel span,
        .chatbot-panel p,
        .chatbot-panel h3,
        .chatbot-panel button,
        .chatbot-panel input,
        .chatbot-panel textarea {
          overflow-wrap: break-word !important;
          word-break: break-word !important;
        }
        .chatbot-panel img {
          max-width: 100% !important;
          height: auto !important;
        }
        .chatbot-panel button {
          white-space: normal !important;
        }
        .chatbot-panel textarea {
          scrollbar-width: thin !important;
          scrollbar-color: rgba(255,255,255,0.2) transparent !important;
        }
        .chatbot-panel textarea::-webkit-scrollbar {
          width: 4px !important;
        }
        .chatbot-panel textarea::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.2) !important;
          border-radius: 2px !important;
        }
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
        @media (max-width: 480px) {
          .chatbot-panel {
            right: 8px !important;
            bottom: 84px !important;
            width: calc(100vw - 16px) !important;
            border-radius: 14px !important;
          }
          .chatbot-header {
            padding: 10px 12px !important;
            gap: 8px !important;
          }
          .chatbot-header-title {
            font-size: 14px !important;
          }
          .chatbot-messages {
            padding: 10px !important;
            gap: 10px !important;
          }
        }
      `}} />

      <motion.button
        ref={buttonRef}
        onClick={() => setIsOpen(value => !value)}
        aria-label="Open CinemaPro AI"
        className={`chatbot-trigger-btn ${isOpen ? 'is-open' : ''}`}
        whileHover={shouldReduceMotion ? {} : { scale: 1.02 }}
        whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
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
