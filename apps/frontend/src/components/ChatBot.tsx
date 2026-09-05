import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  ArrowDown,
  Clock,
  Film,
  MapPin,
  MessageCircle,
  Send,
  Sparkles,
  Tag,
  Ticket,
  X,
} from 'lucide-react';
import {
  baseButton,
  ghostButton,
  glassChip,
  glassPanel,
  primaryButton,
  theme,
} from '../features/chatbot/theme/chatbotTheme';
import type { QuickReply } from '../features/chatbot/types/chatbot.types';
import { ActionShell } from '../features/chatbot/components/ActionShell';
import { BookingProgressStepper, getBookingStepIndex } from '../features/chatbot/components/BookingProgressStepper';
import { ChatActionRenderer } from '../features/chatbot/components/ChatActionRenderer';
import { ChatMessageBubble } from '../features/chatbot/components/ChatMessageBubble';
import { QuickReplyChips } from '../features/chatbot/components/QuickReplyChips';
import { TypingIndicator } from '../features/chatbot/components/TypingIndicator';
import { useChatbotSession } from '../features/chatbot/hooks/useChatbotSession';

const ChatBot: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
  const [isOpen, setIsOpen] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const {
    messages,
    input,
    setInput,
    draft,
    isLoading,
    streamStatus,
    paymentChecking,
    handleSend,
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
  } = useChatbotSession();

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

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const isNearBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 150;
    setShowScrollButton(!isNearBottom);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView?.({ behavior: 'smooth' });
    setShowScrollButton(false);
  }, [messages]);

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
            className="chatbot-panel liquid-glass-panel"
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: 'fixed',
              right: 24,
              bottom: 24,
              top: 'auto',
              left: 'auto',
              zIndex: 9998,
              width: 'min(430px, calc(100vw - 32px))',
              maxWidth: 430,
              height: 'min(640px, calc(100dvh - 110px))',
              maxHeight: 'min(640px, calc(100dvh - 110px))',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              borderRadius: 28,
              transformOrigin: 'bottom right',
              willChange: 'opacity, transform',
              ...glassPanel,
            }}
          >
            <div className="chatbot-header liquid-glass-header" style={{
              flexShrink: 0,
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              background: 'linear-gradient(180deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%)',
              borderBottom: `1px solid ${theme.borderSoft}`,
              color: theme.text,
              backdropFilter: theme.blurSoft,
              WebkitBackdropFilter: theme.blurSoft,
            }}>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                display: 'grid',
                placeItems: 'center',
                background: 'linear-gradient(145deg, rgba(232,137,11,0.28), rgba(232,137,11,0.12))',
                border: '1px solid rgba(255,255,255,0.14)',
                boxShadow: '0 1px 0 rgba(255,255,255,0.12) inset',
                flexShrink: 0,
              }}>
                <Sparkles size={18} color={theme.accent} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="chatbot-header-title" style={{ fontWeight: 900, fontSize: 16, letterSpacing: '-0.02em' }}>CinemaPro AI</div>
                <div style={{ fontSize: 11, color: theme.muted, fontWeight: 700, letterSpacing: '0.04em' }}>{t('chatbot.subtitle')}</div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  ...baseButton,
                  ...glassChip,
                  width: 34,
                  height: 34,
                  borderRadius: 12,
                  display: 'grid',
                  placeItems: 'center',
                  color: theme.text,
                }}
                title={t('chatbot.close')}
              >
                <X size={18} />
              </button>
            </div>

            {/* Booking Progress Stepper */}
            <BookingProgressStepper activeStep={getBookingStepIndex(draft)} />

            <div style={{ position: 'relative', flex: '1 1 auto', minHeight: 0, overflow: 'hidden', minWidth: 0 }}>
              <div
                ref={scrollContainerRef}
                onScroll={handleScroll}
                style={{
                  position: 'absolute',
                  inset: 0,
                  overflowY: 'auto',
                  overflowX: 'hidden',
                  padding: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                  wordBreak: 'break-word',
                }}
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
                    messagesEndRef.current?.scrollIntoView?.({ behavior: 'smooth' });
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

            <div style={{ flex: '0 0 auto', padding: '8px 14px 0', display: 'flex', gap: 7, overflowX: 'auto', minWidth: 0 }}>
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

            <div style={{ flex: '0 0 auto', padding: 14, minWidth: 0 }}>
              <div className="liquid-glass-input" style={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: 8,
                background: 'linear-gradient(160deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.03) 100%)',
                border: `1px solid ${theme.borderSoft}`,
                borderRadius: 18,
                padding: '4px 4px 4px 12px',
                boxShadow: '0 1px 0 rgba(255,255,255,0.08) inset, 0 4px 12px rgba(0,0,0,0.12)',
                backdropFilter: theme.blurSoft,
                WebkitBackdropFilter: theme.blurSoft,
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
                  className="liquid-glass-send"
                  style={{
                    ...primaryButton,
                    width: 40,
                    height: 40,
                    padding: 0,
                    borderRadius: 14,
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
        .liquid-glass-panel {
          overflow-x: hidden !important;
          overflow-wrap: break-word !important;
          word-break: break-word !important;
          isolation: isolate;
          transform: translateZ(0);
        }
        .liquid-glass-panel::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          pointer-events: none;
          z-index: 0;
          background:
            radial-gradient(120% 70% at 12% -8%, rgba(255,255,255,0.07) 0%, transparent 40%),
            radial-gradient(80% 50% at 100% 0%, rgba(232,137,11,0.05) 0%, transparent 42%);
        }
        .liquid-glass-panel > * {
          position: relative;
          z-index: 1;
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
          scrollbar-color: rgba(255,255,255,0.25) transparent !important;
        }
        .chatbot-panel textarea::-webkit-scrollbar {
          width: 4px !important;
        }
        .chatbot-panel textarea::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.25) !important;
          border-radius: 2px !important;
        }
        .chatbot-trigger-btn {
          right: 24px !important;
          bottom: calc(76px + 12px + env(safe-area-inset-bottom, 0px)) !important;
          width: 52px !important;
          height: 52px !important;
        }
        .chatbot-trigger-btn.is-open {
          display: none !important;
        }
        @media (max-width: 768px) {
          .chatbot-panel {
            right: 12px !important;
            bottom: calc(76px + 8px + env(safe-area-inset-bottom, 0px)) !important;
            width: calc(100vw - 24px) !important;
            height: min(560px, calc(100dvh - 76px - 24px - env(safe-area-inset-bottom, 0px))) !important;
            max-height: min(560px, calc(100dvh - 76px - 24px - env(safe-area-inset-bottom, 0px))) !important;
          }
        }
        @media (min-width: 768px) {
          .chatbot-trigger-btn {
            right: 24px !important;
            bottom: 24px !important;
            width: 52px !important;
            height: 52px !important;
          }
          .chatbot-panel {
            bottom: 24px !important;
            right: 24px !important;
          }
        }
        @media (max-width: 480px) {
          .chatbot-trigger-btn {
            right: 16px !important;
            bottom: calc(76px + 12px + env(safe-area-inset-bottom, 0px)) !important;
            width: 48px !important;
            height: 48px !important;
          }
          .chatbot-panel {
            right: 8px !important;
            width: calc(100vw - 16px) !important;
            border-radius: 22px !important;
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
        whileHover={shouldReduceMotion ? {} : { scale: 1.04 }}
        whileTap={shouldReduceMotion ? {} : { scale: 0.97 }}
        style={{
          position: 'fixed',
          right: 24,
          zIndex: 9999,
          width: 52,
          height: 52,
          borderRadius: '50%',
          border: '1px solid rgba(255,255,255,0.2)',
          cursor: 'pointer',
          background: 'linear-gradient(145deg, rgba(232,137,11,0.88) 0%, rgba(200,110,8,0.9) 100%)',
          color: '#1c1c1e',
          display: 'grid',
          placeItems: 'center',
          boxShadow: '0 1px 0 rgba(255,255,255,0.18) inset, 0 8px 20px rgba(0,0,0,0.28)',
          backdropFilter: 'blur(10px) saturate(120%)',
          WebkitBackdropFilter: 'blur(10px) saturate(120%)',
        }}
      >
        <MessageCircle size={22} />
      </motion.button>
    </>
  );
};

export default ChatBot;
