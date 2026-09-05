import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Armchair } from 'lucide-react';
import type { NormalizedSeat } from '../../types/chatbot.types';
import type { PublicSeatMap } from '../../../../types/public.types';
import { theme, ghostButton, primaryButton } from '../../theme/chatbotTheme';
import { ActionShell } from '../ActionShell';
import { SeatMapBoard, SeatSelectionModal } from '../SeatMapBoard';

export const SeatSuggestionCard: React.FC<{
  seatMap?: PublicSeatMap;
  seats: NormalizedSeat[];
  quantity: number;
  onAccept: (seats?: NormalizedSeat[]) => void;
  onRetry: () => void;
}> = ({ seatMap, seats, quantity, onAccept, onRetry }) => {
  const { t } = useTranslation();
  const [manualOpen, setManualOpen] = useState(false);

  return (
    <ActionShell title={t('chatbot.seatSuggestion')} icon={<Armchair size={13} />}>
      {seats.length === 0 ? (
        <>
          <p style={{ margin: '0 0 10px', color: theme.muted, fontSize: 12 }}>{t('chatbot.noSeatsFound')}</p>
          <button onClick={onRetry} style={{ ...ghostButton, width: '100%' }}>{t('chatbot.retry')}</button>
        </>
      ) : (
        <>
          <SeatMapBoard seatMap={seatMap} highlightedSeats={seats} />
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {seats.map(seat => (
              <span key={seat.seatId} style={{
                background: theme.accentSoft,
                color: theme.accent,
                border: `1px solid ${theme.accent}`,
                borderRadius: 9,
                padding: '7px 10px',
                fontWeight: 900,
              }}>
                {seat.seatNumber}
              </span>
            ))}
          </div>
          <p style={{ margin: '9px 0 0', color: theme.muted, fontSize: 12 }}>
            {t('chatbot.seatsDescription')}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10 }}>
            <button onClick={onRetry} style={ghostButton}>{t('chatbot.resuggest')}</button>
            <button onClick={() => onAccept()} style={primaryButton}>{t('chatbot.acceptSeats')}</button>
          </div>
          <button onClick={() => setManualOpen(true)} style={{ ...ghostButton, width: '100%', marginTop: 8 }}>
            {t('chatbot.pickSeatsManually')}
          </button>
          {manualOpen && (
            <SeatSelectionModal
              seatMap={seatMap}
              suggestedSeats={seats}
              quantity={quantity}
              onClose={() => setManualOpen(false)}
              onConfirm={(selected) => {
                setManualOpen(false);
                onAccept(selected);
              }}
            />
          )}
        </>
      )}
    </ActionShell>
  );
};
