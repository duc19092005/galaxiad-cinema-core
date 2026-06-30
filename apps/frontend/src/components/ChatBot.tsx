// src/components/ChatBot.tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, X, Send, Bot, User, List, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { identityAxios } from '../api/axiosClient';

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
  movies?: ReferencedMovie[];
  schedules?: ReferencedSchedule[];
}

const ChatBot: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'bot', text: t('chatbot.greeting') },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isNearBottom, setIsNearBottom] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const shouldReduceMotion = useReducedMotion();
  const chatPanelRef = useRef<HTMLDivElement>(null);
  const floatBtnRef = useRef<HTMLButtonElement>(null);

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

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput('');

    const userMsg: ChatMessage = { role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const response = await identityAxios.post('/chatbot/chat', { message: text });
      const reply = response.data?.data?.response || t('chatbot.replyDefault');
      const referencedMovies = response.data?.data?.referencedMovies || [];
      const referencedSchedules = response.data?.data?.referencedSchedules || [];
      setMessages(prev => [...prev, { role: 'bot', text: reply, movies: referencedMovies, schedules: referencedSchedules }]);
    } catch (error) {
      console.error('Chatbot error:', error);
      setMessages(prev => [...prev, { role: 'bot', text: t('chatbot.replyDefault') }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Extract user questions for history sidebar
  const userQuestions = messages
    .map((msg, index) => ({ msg, index }))
    .filter(({ msg }) => msg.role === 'user');

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
                  animate={{ width: 180, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{
                    flexShrink: 0,
                    borderRight: '1px solid var(--border-color)',
                    background: 'var(--bg-base)',
                    display: 'flex', flexDirection: 'column',
                    overflow: 'hidden',
                  }}
                >
                  <div style={{
                    padding: '12px 14px',
                    borderBottom: '1px solid var(--border-color)',
                    fontSize: 11, fontWeight: 700, color: 'var(--accent)',
                    textTransform: 'uppercase', letterSpacing: '0.08em',
                    whiteSpace: 'nowrap',
                  }}>
                    Câu hỏi ({userQuestions.length})
                  </div>
                  <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
                    {userQuestions.length === 0 ? (
                      <div style={{ padding: '16px 14px', fontSize: 11, color: 'var(--text-secondary)', opacity: 0.6 }}>
                        Chưa có câu hỏi nào
                      </div>
                    ) : (
                      userQuestions.map(({ msg, index }) => (
                        <button
                          key={index}
                          onClick={() => scrollToMessage(index)}
                          style={{
                            display: 'block', width: '100%',
                            padding: '8px 14px', textAlign: 'left',
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
                              #{userQuestions.indexOf({ msg, index }) + 1}
                            </span>
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
                    <List size={16} />
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
                {isLoading && (
                  <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                    <div style={{
                      maxWidth: '80%', padding: '10px 14px',
                      borderRadius: '16px 16px 16px 4px',
                      background: 'var(--bg-elevated)',
                      color: 'var(--text-primary)', fontSize: 13,
                    }}>
                      <span style={{ opacity: 0.6 }}>CinemaPro AI đang nhập...</span>
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
