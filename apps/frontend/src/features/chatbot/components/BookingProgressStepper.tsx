import React from 'react';
import { useTranslation } from 'react-i18next';
import { Armchair, CheckCircle, Clock, CreditCard, Film, MapPin, Ticket } from 'lucide-react';
import type { BookingDraft, BookingStep } from '../types/chatbot.types';
import { theme } from '../theme/chatbotTheme';

export const BOOKING_STEPS = (t: (key: string) => string): BookingStep[] => [
  { key: 'movie', label: t('chatbot.bookingStepMovie'), icon: <Film size={11} /> },
  { key: 'date', label: t('chatbot.bookingStepDate'), icon: <Clock size={11} /> },
  { key: 'cinema', label: t('chatbot.bookingStepCinema'), icon: <MapPin size={11} /> },
  { key: 'showtime', label: t('chatbot.bookingStepShowtime'), icon: <Ticket size={11} /> },
  { key: 'seat', label: t('chatbot.bookingStepSeat'), icon: <Armchair size={11} /> },
  { key: 'payment', label: t('chatbot.bookingStepPayment'), icon: <CreditCard size={11} /> },
];

export const getBookingStepIndex = (draft: BookingDraft): number => {
  if (draft.paymentUrl || draft.ticket) return 5;
  if (draft.seatMap || draft.suggestedSeats.length > 0) return 4;
  if (draft.showtime) return 3;
  if (draft.cinema) return 2;
  if (draft.date) return 1;
  if (draft.movie) return 0;
  if (draft.bookingPath) return 0;
  return -1;
};

export const BookingProgressStepper: React.FC<{ activeStep: number }> = ({ activeStep }) => {
  const { t } = useTranslation();
  if (activeStep < 0) return null;
  const steps = BOOKING_STEPS(t);
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 2, padding: '10px 14px',
      background: 'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)',
      borderBottom: `1px solid ${theme.borderSoft}`,
      overflowX: 'auto',
      flex: '0 0 auto',
      backdropFilter: theme.blurSoft,
      WebkitBackdropFilter: theme.blurSoft,
    }}>
      {steps.map((step, idx) => {
        const isActive = idx === activeStep;
        const isDone = idx < activeStep;
        return (
          <React.Fragment key={step.key}>
            {idx > 0 && <div style={{ width: 12, height: 1, background: isDone ? theme.accent : theme.borderSoft, flexShrink: 0 }} />}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '4px 8px', borderRadius: 10,
              background: isActive ? 'rgba(255,159,10,0.16)' : 'transparent',
              border: isActive ? '1px solid rgba(255,159,10,0.35)' : '1px solid transparent',
              boxShadow: isActive ? '0 1px 0 rgba(255,255,255,0.15) inset' : undefined,
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
