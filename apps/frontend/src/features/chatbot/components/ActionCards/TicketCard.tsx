import React from 'react';
import { useTranslation } from 'react-i18next';
import { Download, Ticket } from 'lucide-react';
import type { TicketInfo } from '../../../../types/booking.types';
import { downloadTicketAsPdf } from '../../../../utils/ticketPdfGenerator';
import { theme, primaryButton } from '../../theme/chatbotTheme';
import { ActionShell } from '../ActionShell';
import { formatCurrency, formatDate, formatTime } from '../../utils/chatbotHelpers';

export const TicketCard: React.FC<{ ticket: TicketInfo }> = ({ ticket }) => {
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
