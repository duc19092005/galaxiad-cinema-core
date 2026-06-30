// src/components/ChatBot.tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowDownUp, MessageCircle, X, Send, Bot, User, List, ChevronRight } from 'lucide-react';
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
    const stored = localStorage.getItem(CHAT_HISTORY_STORAGE_KEY);
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
    localStorage.setItem(CHAT_HISTORY_STORAGE_KEY, JSON.stringify(messages));
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

  // Smart auto-scroll: only scroll if user is near bottom
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

  // Scroll to a specific message by index
  const scrollToMessage = useCallback((index: number) => {
    const el = messageRefs.current.get(index);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Flash highlight
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

    try {
      let botData: ChatbotResponsePayload;

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

  return (
    <>
      {/* Floating Button */}
      <motion.button
        ref={floatBtnRef}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={t('chatbot.ariaLabel')}
        whileHover={shouldReduceMotion ? {} : { scale: 1.1, translateY: -2 }}
        whileTap={shouldReduceMotion ? {} : { scale: 0.9, translateY: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
          width: 56, height: 56, borderRadius: '50%',
          border: 'none', cursor: 'pointer',
          background: 'linear-gradient(135deg, #e68a00, #cc7a00)',
          color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 32px rgba(230,138,0,0.25)',
        }}
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </motion.button>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={chatPanelRef}
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
            style={{
              position: 'fixed', bottom: 92, right: 24, zIndex: 9998,
              width: 360, maxWidth: 'calc(100vw - 32px)',
              height: 'min(520px, calc(100vh - 120px))',
              background: 'var(--bg-surface)',
              borderRadius: 16, border: '1px solid var(--border-color)',
              display: 'flex', flexDirection: 'row',
              boxShadow: 'var(--shadow-elevated)',
              overflow: 'hidden',
              // Muted orange accent for chatbot — matches site theme, not harsh
              '--accent': '#c2761a',
              '--accent-hover': '#a16207',
              '--accent-soft': 'rgba(194,118,26,0.2)',
            } as React.CSSProperties}
          >
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
                    borderRight: '1px solid var(--border-color)',
                    background: 'var(--bg-base)',
                    display: 'flex', flexDirection: 'column',
                    overflow: 'hidden',
                    position: 'relative',
                  }}
                >
                  <button
                    onClick={() => setShowHistory(false)}
                    title="Đóng lịch sử"
                    aria-label="Đóng lịch sử"
                    style={{
                      position: 'absolute',
                      right: 6,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      zIndex: 4,
                      width: 26,
                      height: 44,
                      borderRadius: 999,
                      border: '1px solid rgba(255,255,255,0.16)',
                      background: 'linear-gradient(135deg, var(--accent), var(--accent-hover))',
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
                    borderBottom: '1px solid var(--border-color)',
                    fontSize: 10, fontWeight: 700, color: 'var(--accent)',
                    textTransform: 'uppercase', letterSpacing: '0.08em',
                    whiteSpace: 'nowrap',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6,
                  }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      Câu hỏi ({userQuestions.length})
                    </span>
                    <button
                      onClick={() => setHistorySortOrder(prev => prev === 'newest' ? 'oldest' : 'newest')}
                      title={historySortOrder === 'newest' ? 'Sắp xếp: mới nhất' : 'Sắp xếp: lâu nhất'}
                      aria-label={historySortOrder === 'newest' ? 'Sắp xếp mới nhất' : 'Sắp xếp lâu nhất'}
                      style={{
                        width: 26, height: 26, borderRadius: 7,
                        border: '1px solid var(--border-color)',
                        background: 'var(--bg-surface)',
                        color: 'var(--accent)', cursor: 'pointer',
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <ArrowDownUp size={13} />
                    </button>
                  </div>
                  <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
                    {userQuestions.length === 0 ? (
                      <div style={{ padding: '16px 14px', fontSize: 11, color: 'var(--text-secondary)', opacity: 0.6 }}>
                        Chưa có câu hỏi nào
                      </div>
                    ) : (
                      userQuestions.map(({ msg, index }, position) => (
                        <button
                          key={index}
                          onClick={() => scrollToMessage(index)}
                          style={{
                            display: 'block', width: '100%',
                            padding: '8px 10px', textAlign: 'left',
                            background: 'transparent', border: 'none',
                            cursor: 'pointer', color: 'var(--text-primary)',
                            fontSize: 12, lineHeight: 1.4,
                            borderBottom: '1px solid var(--border-color)',
                            transition: 'background 0.15s',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,138,0,0.06)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                        >
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: 4,
                            marginBottom: 2,
                          }}>
                            <User size={10} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                            <span style={{
                              fontSize: 9, fontWeight: 600, color: 'var(--accent)',
                              opacity: 0.7, textTransform: 'uppercase',
                            }}>
                              #{position + 1}
                            </span>
                          </div>
                          <div style={{
                            fontSize: 9,
                            lineHeight: 1.25,
                            color: 'var(--text-secondary)',
                            marginBottom: 4,
                            opacity: 0.82,
                          }}>
                            {formatChatTime(msg.createdAt)}
                          </div>
                          <div style={{
                            overflow: 'hidden', textOverflow: 'ellipsis',
                            display: '-webkit-box', WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical', wordBreak: 'break-word',
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

            {/* Main Chat Area */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              {/* Header */}
              <div style={{
                padding: '14px 16px',
                background: 'linear-gradient(135deg, var(--accent), var(--accent-hover))',
                display: 'flex', alignItems: 'center', gap: 10,
                flexShrink: 0,
              }}>
                <Bot size={18} color="#fff" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#fff' }}>CinemaPro AI</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)' }}>{t('chatbot.subtitle')}</div>
                </div>
                {userQuestions.length > 0 && (
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    title="Lịch sử câu hỏi"
                    style={{
                      width: 32, height: 32, borderRadius: 8,
                      border: 'none', cursor: 'pointer',
                      background: showHistory ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.1)',
                      color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'background 0.2s', flexShrink: 0,
                    }}
                  >
                    {showHistory ? <X size={16} /> : <List size={16} />}
                  </button>
                )}
              </div>

              {/* Messages */}
              <div
                ref={messagesContainerRef}
                onScroll={handleScroll}
                style={{
                  flex: 1, overflowY: 'auto', padding: 14,
                  display: 'flex', flexDirection: 'column', gap: 10,
                }}
              >
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    ref={(el) => { if (el) messageRefs.current.set(i, el); }}
                    style={{
                      display: 'flex',
                      justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                      transition: 'background 0.3s',
                      borderRadius: 8,
                    }}
                  >
                    <div style={{
                      maxWidth: '85%',
                      padding: '10px 14px',
                      borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      background: msg.role === 'user'
                        ? 'linear-gradient(135deg, var(--accent), var(--accent-hover))'
                        : 'var(--bg-elevated)',
                      color: msg.role === 'user' ? '#fff' : 'var(--text-primary)',
                      fontSize: 13, lineHeight: 1.5, whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        {msg.role === 'bot' ? <Bot size={12} /> : <User size={12} />}
                        <span style={{ fontSize: 10, opacity: 0.6 }}>
                          {msg.role === 'bot' ? 'AI' : t('chatbot.you')}
                        </span>
                        <span style={{ fontSize: 10, opacity: 0.45, marginLeft: 'auto' }}>
                          {formatChatTime(msg.createdAt)}
                        </span>
                      </div>
                      {msg.text}
                      {msg.role === 'bot' && msg.movies && msg.movies.length > 0 && (
                        <div style={{
                          marginTop: 10,
                          display: 'flex', flexDirection: 'column', gap: 6,
                          borderTop: '1px solid var(--border-color)', paddingTop: 8,
                        }}>
                          <div style={{ fontSize: 10, opacity: 0.7, fontWeight: 600 }}>Phim liên quan:</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {msg.movies.map((mv) => (
                              <button
                                key={mv.movieId}
                                onClick={() => { setIsOpen(false); navigate(`/movie/${mv.movieId}`); }}
                                style={{
                                  background: 'var(--accent)', color: '#fff', border: 'none',
                                  padding: '6px 12px', borderRadius: 8, cursor: 'pointer',
                                  fontSize: 11, fontWeight: 600,
                                  display: 'inline-flex', alignItems: 'center',
                                  transition: 'all 0.2s',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-hover)'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'var(--accent)'; }}
                              >
                                Chi tiết: {mv.movieName}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      {msg.role === 'bot' && msg.schedules && msg.schedules.length > 0 && (
                        <div style={{
                          marginTop: 10,
                          borderTop: '1px solid var(--border-color)', paddingTop: 8,
                          display: 'flex', flexDirection: 'column', gap: 8,
                        }}>
                          <div style={{ fontSize: 10, opacity: 0.7, fontWeight: 600 }}>Lịch chiếu — Chọn để đặt vé:</div>
                          {Array.from(new Set(msg.schedules.map(s => s.movieName))).map(movieName => {
                            const movieSchedules = msg.schedules!.filter(s => s.movieName === movieName);
                            return (
                              <div key={movieName} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.9 }}>{movieName}</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                                  {movieSchedules.map(s => (
                                    <button
                                      key={s.scheduleId}
                                      onClick={() => { setIsOpen(false); navigate(`/booking/${s.scheduleId}`); }}
                                      title={`${s.cinemaName} – ${s.formatName}`}
                                      style={{
                                        background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                                        color: '#fff', border: 'none',
                                        padding: '5px 10px', borderRadius: 8, cursor: 'pointer',
                                        fontSize: 11, fontWeight: 600,
                                        display: 'inline-flex', flexDirection: 'column',
                                        alignItems: 'center', lineHeight: 1.3,
                                        transition: 'all 0.2s',
                                      }}
                                      onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(124,58,237,0.5)'; }}
                                      onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; }}
                                    >
                                      <span style={{ fontSize: 12, fontWeight: 700 }}>{s.showTime}</span>
                                      <span style={{ fontSize: 9, opacity: 0.85 }}>{s.formatName}</span>
                                    </button>
                                  ))}
                                </div>
                                <div style={{ fontSize: 9, opacity: 0.6 }}>{movieSchedules[0]?.cinemaName}</div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && !isStreamingResponseVisible && (
                  <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                    <div style={{
                      maxWidth: '80%', padding: '10px 14px',
                      borderRadius: '16px 16px 16px 4px',
                      background: 'var(--bg-elevated)',
                      color: 'var(--text-primary)', fontSize: 13,
                    }}>
                      <span style={{ opacity: 0.75 }}>{streamStatus || 'CinemaPro AI đang xử lý...'}</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Scroll-to-bottom indicator */}
              {!isNearBottom && (
                <button
                  onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })}
                  style={{
                    position: 'absolute', bottom: 56, left: '50%', transform: 'translateX(-50%)',
                    padding: '4px 12px', borderRadius: 12,
                    background: 'var(--accent)', color: '#fff',
                    border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                    display: 'flex', alignItems: 'center', gap: 4,
                    zIndex: 10,
                  }}
                >
                  <ChevronRight size={12} style={{ transform: 'rotate(90deg)' }} /> Mới nhất
                </button>
              )}

              {/* Input */}
              <div style={{
                padding: '10px 14px',
                borderTop: '1px solid var(--border-color)',
                display: 'flex', gap: 8,
                flexShrink: 0,
              }}>
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) handleSend(); }}
                  placeholder={t('chatbot.placeholder')}
                  disabled={isLoading}
                  style={{
                    flex: 1, padding: '10px 14px', borderRadius: 12,
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-base)',
                    color: 'var(--text-primary)', fontSize: 13,
                    outline: 'none', minWidth: 0,
                  }}
                />
                <motion.button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  whileHover={shouldReduceMotion || !input.trim() || isLoading ? {} : { scale: 1.05 }}
                  whileTap={shouldReduceMotion || !input.trim() || isLoading ? {} : { scale: 0.95 }}
                  style={{
                    width: 40, height: 40, borderRadius: 12,
                    border: 'none', cursor: input.trim() && !isLoading ? 'pointer' : 'default',
                    background: input.trim() && !isLoading
                      ? 'linear-gradient(135deg, var(--accent), var(--accent-hover))'
                      : 'var(--bg-elevated)',
                    color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'background 0.2s', opacity: input.trim() && !isLoading ? 1 : 0.5,
                    flexShrink: 0,
                  }}
                >
                  <Send size={16} />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatBot;
