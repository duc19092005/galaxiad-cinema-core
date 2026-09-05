import React from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles } from 'lucide-react';
import type { BookingDraft } from '../../types/chatbot.types';
import { primaryButton } from '../../theme/chatbotTheme';
import { ActionShell } from '../ActionShell';
import { SummaryRow } from '../CommonInputs';
import { formatDate, formatTime, formatCurrency } from '../../utils/chatbotHelpers';

export const BookingSummaryCard: React.FC<{
  draft: BookingDraft;
  onConfirm: () => void;
}> = ({ draft, onConfirm }) => {
  const { t } = useTranslation();
  const subtotal = (draft.segment?.finalPrice || 0) * draft.quantity;
  const voucherText = draft.voucherName ? draft.voucherName : t('chatbot.noVoucher');

  return (
    <ActionShell title={t('chatbot.bookingSummary')} icon={<Sparkles size={13} />}>
      <div style={{ display: 'grid', gap: 7, fontSize: 12 }}>
        <SummaryRow label={t('chatbot.summaryMovie')} value={draft.movie?.movieName || '-'} />
        <SummaryRow label={t('chatbot.summaryCinema')} value={draft.cinema?.cinemaName || '-'} />
        <SummaryRow label={t('chatbot.summaryShowtime')} value={`${formatDate(draft.showtime?.startTime)} ${formatTime(draft.showtime?.startTime)}`} />
        <SummaryRow label={t('chatbot.summaryTicketType')} value={`${draft.segment?.segmentName || '-'} x ${draft.quantity}`} />
        <SummaryRow label={t('chatbot.summarySeats')} value={draft.suggestedSeats.map(seat => seat.seatNumber).join(', ')} />
        <SummaryRow label={t('chatbot.summaryVoucher')} value={voucherText} />
        <SummaryRow label={t('chatbot.subtotal')} value={formatCurrency(subtotal)} strong />
      </div>
      <button onClick={onConfirm} style={{ ...primaryButton, width: '100%', marginTop: 10 }}>
        {t('chatbot.payAndBook')}
      </button>
    </ActionShell>
  );
};
