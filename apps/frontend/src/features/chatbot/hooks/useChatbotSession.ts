import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { API_BASE_URL, identityAxios } from '../../../api/axiosClient';
import { bookingApi } from '../../../api/bookingApi';
import { signalrClient, stopConnection } from '../../../api/signalrClient';
import type { PaymentEvent } from '../../../types/booking.types';
import type { ActiveMovie, PublicGenre, PublicSegmentPrice } from '../../../types/public.types';
import type { UserVoucherDto, VoucherDto } from '../../../api/voucherApi';
import type {
  BookingDraft,
  BookingPathMode,
  ChatAction,
  ChatActionType,
  ChatMessage,
  ChatbotResponsePayload,
  CinemaOption,
  DiscoveryMode,
  GuestContact,
  NormalizedSeat,
  ShowtimeOption,
  ShowtimePickMode,
} from '../types/chatbot.types';
import {
  CHAT_DRAFT_STORAGE_KEY,
  CHAT_HISTORY_STORAGE_KEY,
  agentSelection,
  buildBookingState,
  formatDate,
  formatTime,
  getChatSessionId,
  getStoredAccessToken,
  readStoredDraft,
  readStoredMessages,
  stripInternalChatMarkup,
  uid,
} from '../utils/chatbotHelpers';

export const useChatbotSession = () => {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<ChatMessage[]>(readStoredMessages);
  const [input, setInput] = useState('');
  const [draft, setDraft] = useState<BookingDraft>(readStoredDraft);
  const [isLoading, setIsLoading] = useState(false);
  const [streamStatus, setStreamStatus] = useState('');
  const [paymentChecking, setPaymentChecking] = useState(false);

  const paymentWindowRef = useRef<Window | null>(null);
  const chatSessionIdRef = useRef(getChatSessionId());

  useEffect(() => {
    sessionStorage.setItem(CHAT_HISTORY_STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    sessionStorage.setItem(CHAT_DRAFT_STORAGE_KEY, JSON.stringify(draft));
  }, [draft]);

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
            showtime: action.payload.scheduleId ? { scheduleId: action.payload.scheduleId } as any : prev.showtime,
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
    const text = mode === 'time' ? 'Tôi muốn chọn suất chiếu theo khung giờ' : 'Tôi muốn chọn suất chiếu theo định dạng';
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
    await executeSendMessage('Gợi ý ghế khác cho tôi');
  }, [executeSendMessage]);

  const handleVoucherMode = useCallback(async (mode: 'owned' | 'redeem' | 'skip') => {
    if (mode === 'skip') {
      await executeSendMessage(agentSelection('voucherModeSelected', { mode }, buildBookingState(draft)), 'Tôi muốn bỏ qua voucher');
    } else if (mode === 'redeem') {
      await executeSendMessage(agentSelection('voucherModeSelected', { mode }, buildBookingState(draft)), 'Tôi muốn mua voucher bằng điểm');
    } else {
      await executeSendMessage(agentSelection('voucherModeSelected', { mode }, buildBookingState(draft)), 'Tôi muốn dùng voucher đang có');
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
    await executeSendMessage(agentSelection('guestContactSubmitted', { ...contact }, buildBookingState(draft, { guestContact: contact })), 'Tôi đã nhập thông tin liên hệ');
  }, [draft, executeSendMessage]);

  const handleConfirmBooking = useCallback(async () => {
    await executeSendMessage(agentSelection('bookingConfirmed', {}, buildBookingState(draft)), 'Xác nhận đặt vé và thanh toán');
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

  const handleRequestLocationManual = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await identityAxios.post(
        '/chatbot/chat',
        {
          message: agentSelection('bookingPathSelected', { bookingPath: 'cinemaFirst' }, buildBookingState(draft, { bookingPath: 'cinemaFirst' })),
          sessionId: chatSessionIdRef.current,
        }
      );
      const botData = response.data?.data || {};
      const actions = botData.uiActions || [];
      const cleanFinalResponse = stripInternalChatMarkup(botData.response);

      setMessages(prev => [...prev, {
        id: uid('bot'),
        role: 'bot',
        text: cleanFinalResponse || 'Bạn chọn rạp thủ công dưới đây nhé:',
        actions: actions,
        createdAt: new Date().toISOString(),
      }]);
    } catch {
      appendBot('Lỗi tải danh sách rạp. Bạn hãy thử lại sau nhé.');
    } finally {
      setIsLoading(false);
    }
  }, [draft, appendBot]);

  const handleRequestLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      appendBot('Trình duyệt của bạn không hỗ trợ định vị. Vui lòng chọn rạp chiếu phim thủ công.');
      await handleRequestLocationManual();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        await executeSendMessage(
          agentSelection('locationProvided', { latitude, longitude }, buildBookingState(draft)),
          'Tôi đã chia sẻ vị trí của mình'
        );
      },
      async (error) => {
        console.warn('Geolocation permission error:', error);
        appendBot('Không thể truy cập vị trí của bạn. Vui lòng chọn rạp chiếu phim thủ công.');
        await handleRequestLocationManual();
      }
    );
  }, [draft, executeSendMessage, appendBot, handleRequestLocationManual]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text) return;
    setInput('');
    await executeSendMessage(text);
  }, [executeSendMessage, input]);

  return {
    messages,
    input,
    setInput,
    draft,
    isLoading,
    streamStatus,
    paymentChecking,
    handleSend,
    executeSendMessage,
    handlePickBookingPath,
    handlePickDiscoveryMode,
    handlePickGenre,
    handlePickMovie,
    handlePickDate,
    handlePickCinema,
    handlePickShowtimePreference,
    handlePickShowtime,
    handlePickSegment,
    handleAcceptSeats,
    handleRetrySeats,
    handleVoucherMode,
    handlePickOwnedVoucher,
    handleRedeemVoucher,
    handleGuestContact,
    handleConfirmBooking,
    handleOpenPayment,
    checkPaymentAndRenderTicket,
    handleRequestLocation,
    handleRequestLocationManual,
  };
};
