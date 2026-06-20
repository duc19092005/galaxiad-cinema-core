// src/components/ChatBot.tsx
import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User } from 'lucide-react';
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const chatPanelRef = useRef<HTMLDivElement>(null);
  const floatBtnRef = useRef<HTMLButtonElement>(null);

  // Close chatbot when scrolling or clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (event: MouseEvent) => {
      const clickedOutsidePanel = chatPanelRef.current && !chatPanelRef.current.contains(event.target as Node);
      const clickedOutsideBtn = floatBtnRef.current && !floatBtnRef.current.contains(event.target as Node);
      
      if (clickedOutsidePanel && clickedOutsideBtn) {
        setIsOpen(false);
      }
    };

    const handleScroll = () => {
      setIsOpen(false);
    };

    document.addEventListener('mousedown', handleOutsideClick);
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isOpen]);

  const [isLoading, setIsLoading] = useState(false);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput('');

    // Add user message
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
          background: 'linear-gradient(135deg, var(--accent), var(--accent-hover))',
          color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 32px var(--accent-soft)',
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
              background: 'var(--bg-surface)',
              borderRadius: 16, border: '1px solid var(--border-color)',
              display: 'flex', flexDirection: 'column',
              boxShadow: 'var(--shadow-elevated)',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div style={{
              padding: '16px 20px',
              background: 'linear-gradient(135deg, var(--accent), var(--accent-hover))',
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <Bot size={20} color="#fff" />
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#fff' }}>CinemaPro AI</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>{t('chatbot.subtitle')}</div>
              </div>
            </div>

            {/* Messages */}
            <div style={{
              flex: 1, overflowY: 'auto', padding: 16,
              display: 'flex', flexDirection: 'column', gap: 12,
              minHeight: 280, maxHeight: 340,
            }}>
              {messages.map((msg, i) => (
                <div key={i} style={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                }}>
                  <div style={{
                    maxWidth: '80%',
                    padding: '10px 14px',
                    borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    background: msg.role === 'user'
                      ? 'linear-gradient(135deg, var(--accent), var(--accent-hover))'
                      : 'var(--bg-elevated)',
                    color: msg.role === 'user' ? '#fff' : 'var(--text-primary)',
                    fontSize: 13, lineHeight: 1.5, whiteSpace: 'pre-wrap',
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
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 6,
                        borderTop: '1px solid var(--border-color)',
                        paddingTop: 8,
                      }}>
                        <div style={{ fontSize: 10, opacity: 0.7, fontWeight: 600 }}>Phim liên quan:</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {msg.movies.map((mv) => (
                            <button
                              key={mv.movieId}
                              onClick={() => {
                                setIsOpen(false);
                                navigate(`/movie/${mv.movieId}`);
                              }}
                              style={{
                                background: 'var(--accent)',
                                color: '#fff',
                                border: 'none',
                                padding: '6px 12px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '11px',
                                fontWeight: 600,
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s ease',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'var(--accent-hover)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'var(--accent)';
                              }}
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
                        borderTop: '1px solid var(--border-color)',
                        paddingTop: 8,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                      }}>
                        <div style={{ fontSize: 10, opacity: 0.7, fontWeight: 600 }}>🎬 Lịch chiếu khả dụng – Chọn để đặt vé ngay:</div>
                        {/* Group schedules by movieName */}
                        {Array.from(new Set(msg.schedules.map(s => s.movieName))).map(movieName => {
                          const movieSchedules = msg.schedules!.filter(s => s.movieName === movieName);
                          return (
                            <div key={movieName} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.9 }}>🎥 {movieName}</div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                                {movieSchedules.map(s => (
                                  <button
                                    key={s.scheduleId}
                                    onClick={() => {
                                      setIsOpen(false);
                                      navigate(`/booking/${s.scheduleId}`);
                                    }}
                                    title={`${s.cinemaName} – ${s.formatName}`}
                                    style={{
                                      background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                                      color: '#fff',
                                      border: 'none',
                                      padding: '5px 10px',
                                      borderRadius: '8px',
                                      cursor: 'pointer',
                                      fontSize: '11px',
                                      fontWeight: 600,
                                      display: 'inline-flex',
                                      flexDirection: 'column',
                                      alignItems: 'center',
                                      lineHeight: 1.3,
                                      transition: 'all 0.2s ease',
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.transform = 'scale(1.05)';
                                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(124,58,237,0.5)';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.transform = 'scale(1)';
                                      e.currentTarget.style.boxShadow = 'none';
                                    }}
                                  >
                                    <span style={{ fontSize: 12, fontWeight: 700 }}>🕐 {s.showTime}</span>
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
                <div style={{ display: 'flex', justifyContent: 'start' }}>
                  <div style={{
                    maxWidth: '80%',
                    padding: '10px 14px',
                    borderRadius: '16px 16px 16px 4px',
                    background: 'var(--bg-elevated)',
                    color: 'var(--text-primary)',
                    fontSize: 13,
                  }}>
                    <span style={{ opacity: 0.6 }}>CinemaPro AI đang nhập...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div style={{
              padding: '12px 16px',
              borderTop: '1px solid var(--border-color)',
              display: 'flex', gap: 8,
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
                  outline: 'none',
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
                  transition: 'background 0.2s ease',
                  opacity: input.trim() && !isLoading ? 1 : 0.5,
                }}
              >
                <Send size={16} />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatBot;
