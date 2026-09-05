import React from 'react';
import Cookies from 'js-cookie';
import type { BookingDraft, ChatMessage, NormalizedSeat } from '../types/chatbot.types';
import type { PublicSeatMap } from '../../../types/public.types';
import { theme } from '../theme/chatbotTheme';

export const CHAT_HISTORY_STORAGE_KEY = 'cinemapro_agentic_chat_messages_v2';
export const CHAT_DRAFT_STORAGE_KEY = 'cinemapro_agentic_booking_draft_v2';
export const CHAT_SESSION_STORAGE_KEY = 'cinemapro_agentic_chat_session_id_v2';
export const MAX_TICKETS = 10;

export const uid = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export const todayInputValue = () => new Date().toISOString().slice(0, 10);

export const getChatSessionId = () => {
  const existing = sessionStorage.getItem(CHAT_SESSION_STORAGE_KEY);
  if (existing) return existing;
  const next = `web-chat-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  sessionStorage.setItem(CHAT_SESSION_STORAGE_KEY, next);
  return next;
};

export const getStoredAccessToken = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user_info') || '{}');
    return user.accessToken || Cookies.get('X-Access-Token') || '';
  } catch {
    return Cookies.get('X-Access-Token') || '';
  }
};

export const stripInternalChatMarkup = (value?: string) => {
  if (!value) return '';
  const tagIndex = value.indexOf('[UI_ACTION:');
  const visible = tagIndex >= 0 ? value.slice(0, tagIndex) : value;
  return visible
    .replace(/```json[\s\S]*?```/gi, '')
    .replace(/\|\s*(movieId|cinemaId|scheduleId|userSegmentId|seatIds|voucherId|genreId|bookingPath|discoveryMode)\s*=[^\n|]+/gi, '')
    .trim();
};

export const renderMarkdown = (text: string): React.ReactNode => {
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

export const buildBookingState = (draft: BookingDraft, patch: Partial<BookingDraft> = {}) => {
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

export const agentSelection = (
  type: string,
  payload: Record<string, unknown>,
  bookingState?: Record<string, unknown>
) => (
  `[USER_SELECTION] ${JSON.stringify({ type, payload, bookingState })}`
);

export const readStoredMessages = (): ChatMessage[] => {
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

export const readStoredDraft = (): BookingDraft => {
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

export const formatCurrency = (amount?: number) => `${Math.round(amount || 0).toLocaleString('vi-VN')}d`;

export const formatDate = (value?: string) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' });
};

export const formatTime = (value?: string) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
};

export const normalizeSeatMap = (seatMap: any): NormalizedSeat[] => {
  const rawSeats = seatMap?.seatMap || seatMap?.seats || [];
  return rawSeats.map((seat: any) => ({
    seatId: seat.seatId,
    seatNumber: seat.seatNumber || seat.seatName || '',
    rowIndex: Number(seat.rowIndex ?? seat.coordY ?? 0),
    colIndex: Number(seat.colIndex ?? seat.coordX ?? 0),
    isOccupied: Boolean(seat.isOccupied ?? seat.isBooked),
  })).filter((seat: NormalizedSeat) => Boolean(seat.seatId));
};

export const getSeatGridMetrics = (seats: NormalizedSeat[]) => {
  const maxCol = seats.length ? Math.max(...seats.map(seat => seat.colIndex)) + 1 : 0;
  const maxRow = seats.length ? Math.max(...seats.map(seat => seat.rowIndex)) + 1 : 0;
  return { maxCol, maxRow };
};

export const isCenterSeat = (seat: NormalizedSeat, seatMap?: PublicSeatMap) => (
  seatMap?.centerRowStart !== undefined &&
  seatMap.centerRowEnd !== undefined &&
  seatMap.centerColStart !== undefined &&
  seatMap.centerColEnd !== undefined &&
  seat.rowIndex >= seatMap.centerRowStart &&
  seat.rowIndex <= seatMap.centerRowEnd &&
  seat.colIndex >= seatMap.centerColStart &&
  seat.colIndex <= seatMap.centerColEnd
);
