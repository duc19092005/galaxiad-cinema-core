// src/components/ChatBot.tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, X, Send, Bot, User, ArrowDownUp, Plus, Ticket, Clock, Play, Tag } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { flushSync } from 'react-dom';
import { API_BASE_URL, identityAxios } from '../api/axiosClient';

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
}

interface ChatMessage {
  role: 'bot' | 'user';
  text: string;
  createdAt: string;
  clientId?: string;
  movies?: ReferencedMovie[];
  schedules?: ReferencedSchedule[];
}

type HistorySortOrder = 'newest' | 'oldest';

interface ChatbotResponsePayload {
  response?: string;
  referencedMovies?: ReferencedMovie[];
  referencedSchedules?: ReferencedSchedule[];
}

const CHAT_HISTORY_STORAGE_KEY = 'cinemapro_chat_messages';

const makeGreetingMessage = (text: string): ChatMessage => ({
  role: 'bot',
  text,
  createdAt: new Date().toISOString(),
});

const readStoredMessages = (fallbackText: string): ChatMessage[] => {
  try {
    const stored = sessionStorage.getItem(CHAT_HISTORY_STORAGE_KEY);
    if (!stored) return [makeGreetingMessage(fallbackText)];

    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [makeGreetingMessage(fallbackText)];

    const restored = parsed
      .filter((msg) => msg && (msg.role === 'bot' || msg.role === 'user') && typeof msg.text === 'string')
      .map((msg) => ({
        ...msg,
        role: msg.role as ChatMessage['role'],
        text: msg.text,
        createdAt: typeof msg.createdAt === 'string' ? msg.createdAt : new Date().toISOString(),
      }));

    return restored.length > 0 ? restored : [makeGreetingMessage(fallbackText)];
  } catch {
    return [makeGreetingMessage(fallbackText)];
  }
};

// ── Inline style helpers ──────────────────────────────────────────────
const theme = {
  accent: '#f57c00',
  accentHover: '#e67300',
  accentSoft: 'rgba(245,124,0,0.15)',
  surface: '#131313',
  surfaceLow: '#1b1b1c',
  surfaceContainer: '#202020',
  surfaceHigh: '#2a2a2a',
  surfaceHighest: '#353535',
  onSurface: '#e5e2e1',
  onSurfaceVariant: '#dec1af',
  onAccent: '#572800',
  border: 'rgba(87,66,53,0.3)',
  borderLight: 'rgba(87,66,53,0.15)',
};

const ChatBot: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => readStoredMessages(t('chatbot.greeting')));
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamStatus, setStreamStatus] = useState('');
  const [isStreamingResponseVisible, setIsStreamingResponseVisible] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [historySortOrder, setHistorySortOrder] = useState<HistorySortOrder>('newest');
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [isCompactHistory, setIsCompactHistory] = useState(() => window.matchMedia('(max-width: 520px)').matches);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const shouldReduceMotion = useReducedMotion();
  const chatPanelRef = useRef<HTMLDivElement>(null);
  const floatBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 520px)');
    const handleChange = () => setIsCompactHistory(mediaQuery.matches);
    handleChange();
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    sessionStorage.setItem(CHAT_HISTORY_STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (event: MouseEvent) => {
      const clickedOutsidePanel = chatPanelRef.current && !chatPanelRef.current.contains(event.target as Node);
      const clickedOutsideBtn = floatBtnRef.current && !floatBtnRef.current.contains(event.target as Node);

      if (clickedOutsidePanel && clickedOutsideBtn) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  // Smart auto-scroll
  const scrollToBottom = useCallback(() => {
    if (isNearBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isNearBottom]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  // Track scroll position
  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const { scrollTop, scrollHeight, clientHeight } = container;
    const threshold = 80;
    setIsNearBottom(scrollHeight - scrollTop - clientHeight < threshold);
  }, []);

  // Scroll to a specific message
  const scrollToMessage = useCallback((index: number) => {
    const el = messageRefs.current.get(index);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.style.transition = 'background 0.3s';
      el.style.background = 'rgba(255,138,0,0.08)';
      setTimeout(() => { el.style.background = 'transparent'; }, 1200);
    }
    setShowHistory(false);
  }, []);

  const sendMessageWithSse = async (
    text: string,
    onToken: (streamedText: string) => void,
    onStatus?: (statusText: string) => void
  ): Promise<ChatbotResponsePayload> => {
    const language = localStorage.getItem('language') || 'vi';
    const response = await fetch(`${API_BASE_URL}/api/v1/chatbot/chat/stream`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Accept': 'text/event-stream',
        'Content-Type': 'application/json',
        'Accept-Language': language,
        'X-Language': language,
      },
      body: JSON.stringify({ message: text }),
    });

    if (!response.ok || !response.body) {
      throw new Error('Chat stream is not available');
    }

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
        const statusText = payload.message || 'Đang xử lý...';
        setStreamStatus(statusText);
        onStatus?.(statusText);
      } else if (eventName === 'token') {
        streamedText += payload.text || '';
        onToken(streamedText);
      } else if (eventName === 'metadata') {
        finalPayload = {
          ...finalPayload,
          ...payload,
          response: streamedText,
        };
      } else if (eventName === 'message') {
        finalPayload = payload;
      } else if (eventName === 'error') {
        streamError = payload.message || 'Chatbot đang bận, bạn thử lại sau ít phút nhé.';
      }
    };

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const blocks = buffer.split(/\r?\n\r?\n/);
      buffer = blocks.pop() || '';
      for (const block of blocks) {
        handleEventBlock(block);
        if (block.includes('event: token')) {
          await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
        }
      }
    }

    if (buffer.trim()) {
      handleEventBlock(buffer);
    }

    if (streamError) {
      throw new Error(streamError);
    }

    if (!finalPayload && streamedText) {
      finalPayload = { response: streamedText };
    }

    if (!finalPayload) {
      throw new Error('Chat stream ended without a response');
    }

    return finalPayload;
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput('');

    const botClientId = `bot-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const initialStatus = 'Đang kết nối chatbot...';
    const userMsg: ChatMessage = { role: 'user', text, createdAt: new Date().toISOString() };
    const botMsg: ChatMessage = {
      role: 'bot',
      text: initialStatus,
      createdAt: new Date().toISOString(),
      clientId: botClientId,
    };

    flushSync(() => {
      setMessages(prev => [...prev, userMsg, botMsg]);
      setIsLoading(true);
      setIsStreamingResponseVisible(true);
      setStreamStatus(initialStatus);
    });

    const upsertStreamingBotMessage = (streamedText: string, extra?: Partial<ChatMessage>) => {
      flushSync(() => {
        setIsStreamingResponseVisible(true);
        setMessages(prev => {
          const messageIndex = prev.findIndex(msg => msg.clientId === botClientId);
          if (messageIndex === -1) return prev;

          const next = [...prev];
          next[messageIndex] = {
            ...next[messageIndex],
            role: 'bot',
            text: streamedText,
            ...extra,
            clientId: botClientId,
          };
          return next;
        });
      });
    };

    try {
      let botData: ChatbotResponsePayload;

      try {
        botData = await sendMessageWithSse(text, upsertStreamingBotMessage, upsertStreamingBotMessage);
      } catch (streamError) {
        console.warn('Chatbot stream fallback:', streamError);
        const fallbackStatus = 'Đang dùng kết nối dự phòng...';
        setStreamStatus(fallbackStatus);
        upsertStreamingBotMessage(fallbackStatus);
        const response = await identityAxios.post('/chatbot/chat', { message: text });
        botData = response.data?.data || {};
      }

      const reply = botData.response || t('chatbot.replyDefault');
      const referencedMovies = botData.referencedMovies || [];
      const referencedSchedules = botData.referencedSchedules || [];
      upsertStreamingBotMessage(reply, { movies: referencedMovies, schedules: referencedSchedules });
    } catch (error) {
      console.error('Chatbot error:', error);
      upsertStreamingBotMessage(t('chatbot.replyDefault'));
    } finally {
      setStreamStatus('');
      setIsStreamingResponseVisible(false);
      setIsLoading(false);
    }
  };

  const formatChatTime = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';

    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Extract user questions for history sidebar
  const userQuestions = messages
    .map((msg, index) => ({ msg, index }))
    .filter(({ msg }) => msg.role === 'user')
    .sort((a, b) => {
      const timeA = new Date(a.msg.createdAt).getTime();
      const timeB = new Date(b.msg.createdAt).getTime();
      return historySortOrder === 'newest' ? timeB - timeA : timeA - timeB;
    });

  const historyWidth = isCompactHistory ? 126 : 150;

  const formatTimeShort = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <>
      {/* Floating Button */}

      {/* ── Chat Panel ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={chatPanelRef}
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
            style={{
              position: 'fixed',
              bottom: 92,
              right: 24,
              zIndex: 9998,
              width: '100%',
              maxWidth: 420,
              height: 650,
              maxHeight: 'calc(100vh - 120px)',
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 24,
              overflow: 'hidden',
              background: theme.surface,
              border: `1px solid ${theme.border}`,
              boxShadow: `0 25px 60px rgba(0,0,0,0.5), 0 0 0 1px ${theme.border}`,
            }}
          >
            {/* ── Header ── */}
            <div
              style={{
                background: `linear-gradient(135deg, ${theme.accent}, ${theme.accentHover})`,
                padding: '18px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                flexShrink: 0,
                position: 'relative',
              }}
            >
              {/* Avatar */}
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  background: 'rgba(255,255,255,0.12)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Bot size={22} color="#fff" />
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 16, color: '#fff', letterSpacing: '-0.02em' }}>
                  CinemaPro AI
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                  <span style={{ position: 'relative', width: 8, height: 8 }}>
                    <span
                      style={{
                        position: 'absolute',
                        inset: 0,
                        borderRadius: '50%',
                        background: '#22c55e',
                        animation: 'ping 1.5s cubic-bezier(0,0,0.2,1) infinite',
                        opacity: 0.75,
                      }}
                    />
                    <span
                      style={{
                        position: 'relative',
                        display: 'inline-block',
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: '#22c55e',
                      }}
                    />
                  </span>
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.85)', fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                    Concierge Online
                  </span>
                </div>
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <button
                  onClick={() => setIsOpen(false)}
                  title="Đóng"
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    border: 'none',
                    cursor: 'pointer',
                    background: 'rgba(255,255,255,0.08)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s',
                    flexShrink: 0,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* ── Body: flex row (sidebar + main) ── */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'row', minHeight: 0, position: 'relative' }}>

              {/* History Sidebar */}
              <AnimatePresence>
                {showHistory && (
                  <motion.div
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: historyWidth, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{
                      flexShrink: 0,
                      borderRight: `1px solid ${theme.border}`,
                      background: theme.surfaceLow,
                      display: 'flex',
                      flexDirection: 'column',
                      overflow: 'hidden',
                      position: 'relative',
                    }}
                  >
                    <button
                      onClick={() => setShowHistory(false)}
                      title="Đóng lịch sử"
                      style={{
                        position: 'absolute',
                        right: 6,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        zIndex: 4,
                        width: 26,
                        height: 44,
                        borderRadius: 999,
                        border: `1px solid ${theme.border}`,
                        background: `linear-gradient(135deg, ${theme.accent}, ${theme.accentHover})`,
                        color: '#fff',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 8px 20px rgba(0,0,0,0.28)',
                      }}
                    >
                      <X size={14} />
                    </button>
                    <div style={{
                      padding: '10px 10px',
                      borderBottom: `1px solid ${theme.border}`,
                      fontSize: 10,
                      fontWeight: 700,
                      color: theme.accent,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      whiteSpace: 'nowrap',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 6,
                    }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        Câu hỏi ({userQuestions.length})
                      </span>
                      <button
                        onClick={() => setHistorySortOrder(prev => prev === 'newest' ? 'oldest' : 'newest')}
                        title={historySortOrder === 'newest' ? 'Sắp xếp: mới nhất' : 'Sắp xếp: lâu nhất'}
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: 7,
                          border: `1px solid ${theme.border}`,
                          background: theme.surface,
                          color: theme.accent,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <ArrowDownUp size={13} />
                      </button>
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
                      {userQuestions.length === 0 ? (
                        <div style={{ padding: '16px 14px', fontSize: 11, color: theme.onSurfaceVariant, opacity: 0.6 }}>
                          Chưa có câu hỏi nào
                        </div>
                      ) : (
                        userQuestions.map(({ msg, index }, position) => (
                          <button
                            key={index}
                            onClick={() => scrollToMessage(index)}
                            style={{
                              display: 'block',
                              width: '100%',
                              padding: '8px 10px',
                              textAlign: 'left',
                              background: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              color: theme.onSurface,
                              fontSize: 12,
                              lineHeight: 1.4,
                              borderBottom: `1px solid ${theme.borderLight}`,
                              transition: 'background 0.15s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = theme.accentSoft; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                              <User size={10} color={theme.accent} />
                              <span style={{
                                fontSize: 9,
                                fontWeight: 600,
                                color: theme.accent,
                                opacity: 0.7,
                                textTransform: 'uppercase',
                              }}>
                                #{position + 1}
                              </span>
                            </div>
                            <div style={{ fontSize: 9, lineHeight: 1.25, color: theme.onSurfaceVariant, marginBottom: 4, opacity: 0.82 }}>
                              {formatChatTime(msg.createdAt)}
                            </div>
                            <div style={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              wordBreak: 'break-word',
                            }}>
                              {msg.text}
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── Main Chat Area ── */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, position: 'relative' }}>

                {/* Messages */}
                <div
                  ref={messagesContainerRef}
                  onScroll={handleScroll}
                  style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '18px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                    // chat-scroll-mask equivalent
                    maskImage: 'linear-gradient(to bottom, transparent, black 4%, black 96%, transparent)',
                    WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 4%, black 96%, transparent)',
                  }}
                >
                  {messages.map((msg, i) => (
                    <div
                      key={i}
                      ref={(el) => { if (el) messageRefs.current.set(i, el); }}
                      style={{
                        display: 'flex',
                        flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                        gap: 10,
                        maxWidth: '92%',
                        marginLeft: msg.role === 'user' ? 'auto' : 0,
                        marginRight: msg.role === 'user' ? 0 : 'auto',
                        transition: 'background 0.3s',
                        borderRadius: 8,
                      }}
                    >
                      {/* Avatar */}
                      <div
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: '50%',
                          background: msg.role === 'bot'
                            ? `${theme.accentSoft}`
                            : theme.accent,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          marginTop: 4,
                          border: msg.role === 'bot' ? `1px solid ${theme.border}` : 'none',
                        }}
                      >
                        {msg.role === 'bot' ? (
                          <Bot size={14} color={theme.accent} />
                        ) : (
                          <User size={14} color="#fff" />
                        )}
                      </div>

                      {/* Bubble */}
                      <div
                        style={{
                          padding: '12px 16px',
                          borderRadius: msg.role === 'user'
                            ? '18px 18px 4px 18px'
                            : '18px 18px 18px 4px',
                          background: msg.role === 'user'
                            ? `linear-gradient(135deg, ${theme.accent}, ${theme.accentHover})`
                            : theme.surfaceHigh,
                          color: msg.role === 'user' ? '#fff' : theme.onSurface,
                          fontSize: 14,
                          lineHeight: 1.55,
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                          boxShadow: msg.role === 'user'
                            ? `0 4px 15px ${theme.accentSoft}`
                            : '0 2px 8px rgba(0,0,0,0.15)',
                          position: 'relative',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                          <span style={{
                            fontSize: 10,
                            fontWeight: 600,
                            opacity: 0.7,
                            textTransform: 'uppercase',
                            letterSpacing: '0.03em',
                          }}>
                            {msg.role === 'bot' ? 'AI' : t('chatbot.you')}
                          </span>
                          <span style={{ fontSize: 10, opacity: 0.45, marginLeft: 'auto' }}>
                            {formatTimeShort(msg.createdAt)}
                          </span>
                        </div>
                        {msg.text}

                        {/* Referenced movies */}
                        {msg.role === 'bot' && msg.movies && msg.movies.length > 0 && (
                          <div style={{
                            marginTop: 12,
                            // Role is 'bot' here (TypeScript narrows it), use theme.border directly
                            borderTop: `1px solid ${theme.border}`,
                            paddingTop: 10,
                          }}>
                            <div style={{ fontSize: 10, opacity: 0.7, fontWeight: 600, marginBottom: 6 }}>
                              Phim liên quan:
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                              {msg.movies.map((mv) => (
                                <button
                                  key={mv.movieId}
                                  onClick={() => { setIsOpen(false); navigate(`/movie/${mv.movieId}`); }}
                                  style={{
                                    background: theme.accent,
                                    color: '#fff',
                                    border: 'none',
                                    padding: '5px 12px',
                                    borderRadius: 8,
                                    cursor: 'pointer',
                                    fontSize: 11,
                                    fontWeight: 600,
                                    transition: 'all 0.2s',
                                  }}
                                  onMouseEnter={e => { e.currentTarget.style.background = theme.accentHover; }}
                                  onMouseLeave={e => { e.currentTarget.style.background = theme.accent; }}
                                >
                                  Chi tiết: {mv.movieName}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Referenced schedules */}
                        {msg.role === 'bot' && msg.schedules && msg.schedules.length > 0 && (
                          <div style={{
                            marginTop: 12,
                            // Role is 'bot' here, use theme.border directly
                            borderTop: `1px solid ${theme.border}`,
                            paddingTop: 10,
                          }}>
                            <div style={{ fontSize: 10, opacity: 0.7, fontWeight: 600, marginBottom: 8 }}>
                              Lịch chiếu — Chọn để đặt vé:
                            </div>
                            {Array.from(new Set(msg.schedules.map(s => s.movieName))).map(movieName => {
                              const movieSchedules = msg.schedules!.filter(s => s.movieName === movieName);
                              return (
                                <div key={movieName} style={{ marginBottom: 8 }}>
                                  <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.9, marginBottom: 4 }}>{movieName}</div>
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                                    {movieSchedules.map(s => (
                                      <button
                                        key={s.scheduleId}
                                        onClick={() => { setIsOpen(false); navigate(`/booking/${s.scheduleId}`); }}
                                        title={`${s.cinemaName} – ${s.formatName}`}
                                        style={{
                                          background: '#7c3aed',
                                          color: '#fff',
                                          border: 'none',
                                          padding: '4px 10px',
                                          borderRadius: 8,
                                          cursor: 'pointer',
                                          fontSize: 11,
                                          fontWeight: 600,
                                          display: 'flex',
                                          flexDirection: 'column',
                                          alignItems: 'center',
                                          lineHeight: 1.3,
                                          transition: 'all 0.2s',
                                        }}
                                        onMouseEnter={e => {
                                          e.currentTarget.style.transform = 'scale(1.05)';
                                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(124,58,237,0.5)';
                                        }}
                                        onMouseLeave={e => {
                                          e.currentTarget.style.transform = 'scale(1)';
                                          e.currentTarget.style.boxShadow = 'none';
                                        }}
                                      >
                                        <span style={{ fontSize: 12, fontWeight: 700 }}>{s.showTime}</span>
                                        <span style={{ fontSize: 9, opacity: 0.85 }}>{s.formatName}</span>
                                      </button>
                                    ))}
                                  </div>
                                  <div style={{ fontSize: 9, opacity: 0.6, marginTop: 2 }}>{movieSchedules[0]?.cinemaName}</div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Loading indicator */}
                  {isLoading && !isStreamingResponseVisible && (
                    <div style={{ display: 'flex', gap: 10, maxWidth: '80%' }}>
                      <div style={{
                        width: 30,
                        height: 30,
                        borderRadius: '50%',
                        background: theme.accentSoft,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: 4,
                        border: `1px solid ${theme.border}`,
                      }}>
                        <Bot size={14} color={theme.accent} />
                      </div>
                      <div style={{
                        padding: '12px 16px',
                        borderRadius: '18px 18px 18px 4px',
                        background: theme.surfaceHigh,
                        color: theme.onSurface,
                        fontSize: 14,
                        lineHeight: 1.55,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                      }}>
                        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                          <span style={{ width: 6, height: 6, background: theme.accent, borderRadius: '50%', opacity: 0.4, animation: 'bounce 1s infinite' }} />
                          <span style={{ width: 6, height: 6, background: theme.accent, borderRadius: '50%', opacity: 0.6, animation: 'bounce 1s infinite 0.15s' }} />
                          <span style={{ width: 6, height: 6, background: theme.accent, borderRadius: '50%', opacity: 0.8, animation: 'bounce 1s infinite 0.3s' }} />
                          <span style={{ marginLeft: 6, fontSize: 10, opacity: 0.65, textTransform: 'uppercase', letterSpacing: '0.03em', fontWeight: 500 }}>
                            {streamStatus || 'AI đang suy nghĩ...'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Scroll-to-bottom */}

                {/* ── Quick Action Pills ── */}
                <div style={{
                  padding: '8px 16px 4px',
                  flexShrink: 0,
                  overflow: 'hidden',
                }}>
                  <div style={{
                    display: 'flex',
                    gap: 8,
                    overflowX: 'auto',
                    paddingBottom: 4,
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                  }}>
                    {[
                      { icon: Ticket, label: 'Book Now', query: 'cho tôi đặt vé xem phim' },
                      { icon: Clock, label: 'Showtimes', query: 'suất chiếu hôm nay' },
                      { icon: Play, label: 'Trailers', query: 'cho tôi xem trailer phim' },
                      { icon: Tag, label: 'Offers', query: 'khuyến mãi đang có' },
                    ].map((action) => (
                      <button
                        key={action.label}
                        onClick={() => {
                          setInput(action.query);
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          background: theme.surfaceHighest + '80',
                          border: `1px solid ${theme.border}`,
                          padding: '6px 14px',
                          borderRadius: 999,
                          color: theme.onSurfaceVariant,
                          fontSize: 12,
                          fontWeight: 500,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          transition: 'all 0.2s',
                          flexShrink: 0,
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = theme.accent;
                          e.currentTarget.style.color = '#fff';
                          e.currentTarget.style.borderColor = 'transparent';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = theme.surfaceHighest + '80';
                          e.currentTarget.style.color = theme.onSurfaceVariant;
                          e.currentTarget.style.borderColor = theme.border;
                        }}
                      >
                        <action.icon size={14} />
                        {action.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ── Input Area ── */}
                <div style={{
                  padding: '10px 16px 16px',
                  flexShrink: 0,
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    background: theme.surfaceHighest + '40',
                    borderRadius: 16,
                    border: `1px solid ${theme.border}`,
                    padding: '4px 4px 4px 12px',
                    transition: 'all 0.2s',
                    backdropFilter: 'blur(4px)',
                  }}
                    onFocusCapture={(e) => {
                      const container = e.currentTarget;
                      container.style.borderColor = theme.accent + '80';
                      container.style.background = theme.surfaceHighest + '60';
                    }}
                    onBlurCapture={(e) => {
                      const container = e.currentTarget;
                      container.style.borderColor = theme.border;
                      container.style.background = theme.surfaceHighest + '40';
                    }}
                  >
                    <button
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 8,
                        border: 'none',
                        cursor: 'pointer',
                        background: 'transparent',
                        color: theme.onSurfaceVariant,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        transition: 'color 0.2s',
                        fontSize: 20,
                        lineHeight: 1,
                      }}
                      onMouseEnter={e => { e.currentTarget.style.color = theme.accent; }}
                      onMouseLeave={e => { e.currentTarget.style.color = theme.onSurfaceVariant; }}
                    >
                      <Plus size={18} />
                    </button>

                    <input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) handleSend(); }}
                      placeholder="Ask about movies, theaters..."
                      disabled={isLoading}
                      style={{
                        flex: 1,
                        padding: '8px 8px',
                        borderRadius: 12,
                        border: 'none',
                        background: 'transparent',
                        color: theme.onSurface,
                        fontSize: 14,
                        outline: 'none',
                        minWidth: 0,
                        fontFamily: 'inherit',
                      }}
                    />

                    <button
                      onClick={handleSend}
                      disabled={!input.trim() || isLoading}
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 12,
                        border: 'none',
                        cursor: input.trim() && !isLoading ? 'pointer' : 'default',
                        background: input.trim() && !isLoading
                          ? `linear-gradient(135deg, ${theme.accent}, ${theme.accentHover})`
                          : theme.surfaceHighest,
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s',
                        opacity: input.trim() && !isLoading ? 1 : 0.4,
                        flexShrink: 0,
                        boxShadow: input.trim() && !isLoading ? `0 4px 12px ${theme.accentSoft}` : 'none',
                      }}
                      onMouseEnter={e => {
                        if (input.trim() && !isLoading) {
                          e.currentTarget.style.transform = 'scale(1.05)';
                        }
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      <Send size={16} />
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Floating Button ── */}
      <motion.button
        ref={floatBtnRef}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={t('chatbot.ariaLabel')}
        whileHover={shouldReduceMotion ? {} : { scale: 1.1, translateY: -2 }}
        whileTap={shouldReduceMotion ? {} : { scale: 0.9, translateY: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 9999,
          width: 56,
          height: 56,
          borderRadius: '50%',
          border: 'none',
          cursor: 'pointer',
          background: `linear-gradient(135deg, ${theme.accent}, ${theme.accentHover})`,
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `0 8px 32px ${theme.accentSoft}, 0 0 0 1px ${theme.accent}40`,
        }}
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </motion.button>
    </>
  );
};

export default ChatBot;
