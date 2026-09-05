import React from 'react';
import {
  Ticket,
  MapPin,
  IdCard,
  Clock,
  Calendar,
  ExternalLink,
  Timer,
  CheckCircle2,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { BookingHistoryItem } from '../../../../types/booking.types';

export const getStatusColor = (status: string): React.CSSProperties => {
  switch (status) {
    case 'Booked':
      return {
        color: 'var(--success)',
        backgroundColor: 'rgba(16,185,129,0.08)',
        borderColor: 'rgba(16,185,129,0.2)',
      };
    case 'Pending':
      return {
        color: 'var(--warning)',
        backgroundColor: 'rgba(245,158,11,0.08)',
        borderColor: 'rgba(245,158,11,0.2)',
      };
    case 'Canceled':
      return {
        color: 'var(--danger)',
        backgroundColor: 'rgba(255,180,171,0.08)',
        borderColor: 'rgba(255,180,171,0.2)',
      };
    default:
      return {
        color: 'var(--text-secondary)',
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-color)',
      };
  }
};

export const getAiringStatusIcon = (status: string) => {
  switch (status) {
    case 'Upcoming':
      return <Timer size={14} />;
    case 'Airing':
      return (
        <svg
          style={{ width: 14, height: 14, animation: 'pulse 2s infinite' }}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <polygon points="10 8 16 12 10 16 10 8" />
        </svg>
      );
    case 'Finished':
      return <CheckCircle2 size={14} />;
    default:
      return null;
  }
};

interface BookingHistoryListProps {
  history: BookingHistoryItem[];
  formatDate: (dateStr: string) => string;
  onViewTicket: (orderId: string) => void;
}

export const BookingHistoryList: React.FC<BookingHistoryListProps> = ({
  history,
  formatDate,
  onViewTicket,
}) => {
  const { t } = useTranslation();

  if (history.length === 0) {
    return (
      <div
        style={{
          padding: '48px',
          textAlign: 'center',
          borderRadius: 'var(--radius-xl)',
          backgroundColor: 'var(--bg-elevated)',
          border: '1px solid var(--border-color)',
        }}
      >
        <Ticket
          size={48}
          style={{ margin: '0 auto 16px', opacity: 0.2, color: 'var(--text-secondary)' }}
        />
        <p style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{t('account.noBookings')}</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {history.map((item) => (
        <div
          key={item.orderId}
          style={{
            padding: 'clamp(12px, 3vw, 24px)',
            borderRadius: 'var(--radius-xl)',
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-md)',
            transition: 'all 0.3s ease',
          }}
          className="interactive"
        >
          <div style={{ display: 'flex', gap: 'clamp(12px, 3vw, 24px)', flexWrap: 'wrap' }}>
            <div
              style={{
                width: 100,
                height: 140,
                flexShrink: 0,
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-lg)',
              }}
            >
              <img
                src={
                  item.movieImageUrl ||
                  'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=500'
                }
                alt={item.movieName}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>

            <div
              style={{
                flex: 1,
                minWidth: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '16px',
                }}
              >
                <div>
                  <h3
                    style={{
                      fontSize: 20,
                      fontWeight: 800,
                      marginBottom: 'var(--space-4)',
                      wordBreak: 'break-word',
                    }}
                  >
                    {item.movieName}
                  </h3>
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      gap: '12px',
                      fontSize: 13,
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <MapPin size={14} style={{ color: 'var(--accent)' }} /> {item.cinemaName}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <IdCard size={14} style={{ color: 'var(--accent)' }} /> {item.auditoriumNumber}
                    </span>
                  </div>
                </div>
                <div
                  style={{
                    padding: '4px 16px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    ...getStatusColor(item.orderStatus),
                  }}
                >
                  {item.orderStatus}
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(min(160px, 100%), 1fr))',
                  gap: '16px',
                  paddingTop: '16px',
                  borderTop: '1px solid var(--border-color)',
                }}
              >
                <div>
                  <p
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: 'var(--text-secondary)',
                      marginBottom: 'var(--space-4)',
                      overflowWrap: 'break-word',
                      wordBreak: 'break-word',
                    }}
                  >
                    {t('booking.bookingDate')}
                  </p>
                  <p
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <Clock size={14} style={{ color: 'var(--accent)' }} />{' '}
                    {formatDate(item.orderDate)}
                  </p>
                </div>
                <div>
                  <p
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: 'var(--text-secondary)',
                      marginBottom: 'var(--space-4)',
                      overflowWrap: 'break-word',
                      wordBreak: 'break-word',
                    }}
                  >
                    {t('booking.showtime')}
                  </p>
                  <p
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <Calendar size={14} style={{ color: 'var(--accent)' }} />{' '}
                    {formatDate(item.startTime)}
                  </p>
                </div>
                <div>
                  <p
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: 'var(--text-secondary)',
                      marginBottom: 'var(--space-4)',
                      overflowWrap: 'break-word',
                      wordBreak: 'break-word',
                    }}
                  >
                    {t('booking.totalSeats', 'Tổng số ghế')}
                  </p>
                  <p style={{ fontSize: 15, fontWeight: 800, color: 'var(--accent)' }}>
                    {item.seats?.length || 0}
                  </p>
                </div>
                <div>
                  <p
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: 'var(--text-secondary)',
                      marginBottom: 'var(--space-4)',
                      overflowWrap: 'break-word',
                      wordBreak: 'break-word',
                    }}
                  >
                    {t('booking.selectedSeats', 'Ghế đã chọn')}
                  </p>
                  <p
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      wordBreak: 'break-word',
                    }}
                  >
                    {(item.seats || []).join(', ') || '—'}
                  </p>
                </div>
                <div>
                  <p
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: 'var(--text-secondary)',
                      marginBottom: 'var(--space-4)',
                      overflowWrap: 'break-word',
                      wordBreak: 'break-word',
                    }}
                  >
                    {t('booking.amount')}
                  </p>
                  <p style={{ fontSize: 20, fontWeight: 800, color: 'var(--accent)' }}>
                    {item.totalPrice.toLocaleString('vi-VN')}đ
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              marginTop: '16px',
              paddingTop: '16px',
              borderTop: '1px dashed var(--border-color)',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 12,
                fontWeight: 700,
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-secondary)',
              }}
            >
              {getAiringStatusIcon(item.movieAiringStatus)}
              {item.movieAiringStatus}
            </div>
            <button
              onClick={() => onViewTicket(item.orderId)}
              style={{
                fontSize: 11,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--accent)',
              }}
            >
              {t('booking.viewTicket')} <ExternalLink size={14} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
