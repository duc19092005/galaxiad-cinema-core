import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import type { NormalizedSeat } from '../types/chatbot.types';
import type { PublicSeatMap } from '../../../types/public.types';
import { theme, baseButton, primaryButton, ghostButton } from '../theme/chatbotTheme';
import { normalizeSeatMap, getSeatGridMetrics, isCenterSeat } from '../utils/chatbotHelpers';

export const SeatMapBoard: React.FC<{
  seatMap?: PublicSeatMap;
  highlightedSeats: NormalizedSeat[];
  selectedSeats?: NormalizedSeat[];
  interactive?: boolean;
  onToggleSeat?: (seat: NormalizedSeat) => void;
}> = ({ seatMap, highlightedSeats, selectedSeats = [], interactive, onToggleSeat }) => {
  const { t } = useTranslation();
  const seats = normalizeSeatMap(seatMap);
  const { maxCol, maxRow } = getSeatGridMetrics(seats);
  const highlightedIds = new Set(highlightedSeats.map(seat => seat.seatId));
  const selectedIds = new Set(selectedSeats.map(seat => seat.seatId));

  if (!seatMap || seats.length === 0 || maxCol === 0 || maxRow === 0) {
    return null;
  }

  return (
    <div>
      <div style={{
        height: 18,
        borderRadius: '0 0 999px 999px',
        borderBottom: `3px solid ${theme.accent}`,
        background: 'linear-gradient(180deg, rgba(245,124,0,0.18), rgba(245,124,0,0.02))',
        margin: '0 auto 10px',
        maxWidth: 260,
      }} />
      <div style={{ textAlign: 'center', color: theme.muted, fontSize: 10, fontWeight: 900, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 10 }}>
        Screen
      </div>
      <div style={{
        overflow: 'auto',
        maxHeight: interactive ? '58vh' : 260,
        padding: 8,
        borderRadius: 12,
        background: 'rgba(0,0,0,0.18)',
        border: `1px solid ${theme.border}`,
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${maxCol}, minmax(28px, 1fr))`,
          gridTemplateRows: `repeat(${maxRow}, minmax(28px, 1fr))`,
          gap: 5,
          minWidth: Math.max(maxCol * 34, 280),
          position: 'relative',
        }}>
          {seatMap.centerRowStart !== undefined &&
            seatMap.centerRowEnd !== undefined &&
            seatMap.centerColStart !== undefined &&
            seatMap.centerColEnd !== undefined && (
              <div style={{
                gridRowStart: seatMap.centerRowStart + 1,
                gridRowEnd: seatMap.centerRowEnd + 2,
                gridColumnStart: seatMap.centerColStart + 1,
                gridColumnEnd: seatMap.centerColEnd + 2,
                border: '1px dashed rgba(245,124,0,0.55)',
                borderRadius: 10,
                pointerEvents: 'none',
                margin: -3,
              }} />
            )}
          {seats.map(seat => {
            const selected = selectedIds.has(seat.seatId);
            const highlighted = highlightedIds.has(seat.seatId);
            const center = isCenterSeat(seat, seatMap);
            const disabled = seat.isOccupied;
            return (
              <button
                key={seat.seatId}
                disabled={disabled || !interactive}
                onClick={() => onToggleSeat?.(seat)}
                title={seat.seatNumber}
                style={{
                  ...baseButton,
                  gridColumnStart: seat.colIndex + 1,
                  gridRowStart: seat.rowIndex + 1,
                  aspectRatio: '1 / 1',
                  minWidth: 28,
                  minHeight: 28,
                  borderRadius: 8,
                  fontSize: 10,
                  fontWeight: 900,
                  border: selected
                    ? `1px solid ${theme.accent}`
                    : highlighted
                      ? `1px solid ${theme.success}`
                      : center
                        ? '1px solid rgba(245,124,0,0.45)'
                        : `1px solid ${theme.border}`,
                  background: disabled
                    ? 'rgba(255,255,255,0.035)'
                    : selected
                      ? `linear-gradient(135deg, ${theme.accent}, ${theme.accentHover})`
                      : highlighted
                        ? 'rgba(34,197,94,0.22)'
                        : center
                          ? theme.accentSoft
                          : 'rgba(255,255,255,0.08)',
                  color: disabled ? 'rgba(255,255,255,0.28)' : selected ? '#fff' : highlighted ? '#86efac' : theme.text,
                  opacity: disabled ? 0.55 : 1,
                  cursor: disabled || !interactive ? 'default' : 'pointer',
                }}
              >
                {seat.seatNumber}
              </button>
            );
          })}
        </div>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8, color: theme.muted, fontSize: 10, fontWeight: 800 }}>
        <span><span style={{ color: theme.text }}>■</span> {t('chatbot.seatLegendAvailable')}</span>
        <span><span style={{ color: theme.accent }}>■</span> {t('chatbot.seatLegendCenter')}</span>
        <span><span style={{ color: theme.success }}>■</span> {t('chatbot.seatLegendSuggested')}</span>
        <span><span style={{ color: 'rgba(255,255,255,0.35)' }}>■</span> {t('chatbot.seatLegendOccupied')}</span>
      </div>
    </div>
  );
};

export const SeatSelectionModal: React.FC<{
  seatMap?: PublicSeatMap;
  suggestedSeats: NormalizedSeat[];
  quantity: number;
  onClose: () => void;
  onConfirm: (seats: NormalizedSeat[]) => void;
}> = ({ seatMap, suggestedSeats, quantity, onClose, onConfirm }) => {
  const { t } = useTranslation();
  const [selectedSeats, setSelectedSeats] = useState<NormalizedSeat[]>(suggestedSeats);

  const toggleSeat = (seat: NormalizedSeat) => {
    if (seat.isOccupied) return;
    setSelectedSeats(prev => {
      if (prev.some(item => item.seatId === seat.seatId)) {
        return prev.filter(item => item.seatId !== seat.seatId);
      }
      if (prev.length >= quantity) return prev;
      return [...prev, seat];
    });
  };

  const complete = selectedSeats.length === quantity;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 10000,
      background: 'rgba(0,0,0,0.68)',
      display: 'grid',
      placeItems: 'center',
      padding: 16,
    }}>
      <div style={{
        width: 'min(920px, 100%)',
        maxHeight: 'calc(100vh - 32px)',
        overflow: 'hidden',
        borderRadius: 16,
        background: theme.surface,
        border: `1px solid ${theme.border}`,
        boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, borderBottom: `1px solid ${theme.border}` }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: theme.text, fontWeight: 900 }}>{t('chatbot.manualSeatTitle')}</div>
            <div style={{ color: theme.muted, fontSize: 12, marginTop: 2 }}>
              {t('chatbot.manualSeatCount', { selected: selectedSeats.length, total: quantity })}
            </div>
          </div>
          <button onClick={onClose} style={{ ...ghostButton, width: 36, height: 36, padding: 0, display: 'grid', placeItems: 'center' }}>
            <X size={16} />
          </button>
        </div>
        <div style={{ padding: 14, overflow: 'auto' }}>
          <SeatMapBoard
            seatMap={seatMap}
            highlightedSeats={suggestedSeats}
            selectedSeats={selectedSeats}
            interactive
            onToggleSeat={toggleSeat}
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: 14, borderTop: `1px solid ${theme.border}` }}>
          <button onClick={onClose} style={ghostButton}>{t('chatbot.cancelManualSeats')}</button>
          <button disabled={!complete} onClick={() => onConfirm(selectedSeats)} style={{ ...primaryButton, opacity: complete ? 1 : 0.5 }}>
            {t('chatbot.confirmManualSeats')}
          </button>
        </div>
      </div>
    </div>
  );
};
