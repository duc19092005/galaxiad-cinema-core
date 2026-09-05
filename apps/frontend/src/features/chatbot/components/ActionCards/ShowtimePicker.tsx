import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Clock } from 'lucide-react';
import type { ShowtimeOption, ShowtimePickMode } from '../../types/chatbot.types';
import { theme, optionButtonStyle } from '../../theme/chatbotTheme';
import { ActionShell } from '../ActionShell';
import { formatTime } from '../../utils/chatbotHelpers';

export const ShowtimePicker: React.FC<{
  showtimes: ShowtimeOption[];
  mode?: ShowtimePickMode;
  onPick: (showtime: ShowtimeOption) => void;
}> = ({ showtimes, mode = 'time', onPick }) => {
  const { t } = useTranslation();
  const formats = Array.from(new Set(showtimes.map(showtime => showtime.formatName))).sort((a, b) => a.localeCompare(b));
  const [selectedFormat, setSelectedFormat] = useState<string>(mode === 'format' ? '' : 'all');
  const visibleShowtimes = (mode === 'format' && selectedFormat)
    ? showtimes.filter(showtime => showtime.formatName === selectedFormat)
    : mode === 'format'
      ? []
      : showtimes;

  return (
    <ActionShell title={t('chatbot.showtimePicker')} icon={<Clock size={13} />}>
      {mode === 'format' && (
        <div style={{ display: 'grid', gap: 7, marginBottom: selectedFormat ? 10 : 0 }}>
          {formats.map(format => {
            const count = showtimes.filter(showtime => showtime.formatName === format).length;
            const firstTime = showtimes.filter(showtime => showtime.formatName === format).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())[0];
            return (
              <button
                key={format}
                onClick={() => setSelectedFormat(format)}
                style={{
                  ...optionButtonStyle,
                  borderColor: selectedFormat === format ? theme.accent : theme.border,
                  background: selectedFormat === format ? theme.accentSoft : 'rgba(255,255,255,0.055)',
                }}
              >
                <span style={{ textAlign: 'left' }}>
                  <span style={{ display: 'block', fontWeight: 900 }}>{format}</span>
                  <span style={{ display: 'block', color: theme.muted, fontSize: 11, marginTop: 2 }}>
                    {t('chatbot.formatShowtimeCount', { count, first: formatTime(firstTime?.startTime) })}
                  </span>
                </span>
                <Check size={14} />
              </button>
            );
          })}
        </div>
      )}
      <div style={{ display: 'grid', gap: 7 }}>
        {visibleShowtimes.map(showtime => (
          <button key={showtime.scheduleId} onClick={() => onPick(showtime)} style={optionButtonStyle}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <span style={{
                background: `linear-gradient(135deg, ${theme.accent}, ${theme.accentHover})`,
                color: '#fff',
                borderRadius: 8,
                padding: '5px 9px',
                fontWeight: 900,
                minWidth: 54,
              }}>
                {formatTime(showtime.startTime)}
              </span>
              <span style={{ textAlign: 'left', minWidth: 0 }}>
                <span style={{ display: 'block', fontWeight: 900 }}>{showtime.formatName}</span>
                <span style={{ color: theme.muted, fontSize: 11 }}>{t('chatbot.auditoriumLabel', { number: showtime.auditoriumNumber })}</span>
              </span>
            </span>
            <Check size={14} />
          </button>
        ))}
      </div>
    </ActionShell>
  );
};
