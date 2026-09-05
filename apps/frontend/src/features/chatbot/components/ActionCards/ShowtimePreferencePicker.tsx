import React from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Clock } from 'lucide-react';
import type { ShowtimePickMode } from '../../types/chatbot.types';
import { theme, optionButtonStyle } from '../../theme/chatbotTheme';
import { ActionShell } from '../ActionShell';

export const ShowtimePreferencePicker: React.FC<{
  onPick: (mode: ShowtimePickMode) => void;
}> = ({ onPick }) => {
  const { t } = useTranslation();
  return (
    <ActionShell title={t('chatbot.showtimePreference')} icon={<Clock size={13} />}>
      <div style={{ display: 'grid', gap: 8 }}>
        <button onClick={() => onPick('time')} style={{ ...optionButtonStyle, alignItems: 'flex-start' }}>
          <span style={{ textAlign: 'left' }}>
            <span style={{ display: 'block', fontWeight: 900 }}>{t('chatbot.showtimeByTime')}</span>
            <span style={{ display: 'block', color: theme.muted, fontSize: 11, marginTop: 2 }}>{t('chatbot.showtimeByTimeDesc')}</span>
          </span>
          <Check size={14} />
        </button>
        <button onClick={() => onPick('format')} style={{ ...optionButtonStyle, alignItems: 'flex-start' }}>
          <span style={{ textAlign: 'left' }}>
            <span style={{ display: 'block', fontWeight: 900 }}>{t('chatbot.showtimeByFormat')}</span>
            <span style={{ display: 'block', color: theme.muted, fontSize: 11, marginTop: 2 }}>{t('chatbot.showtimeByFormatDesc')}</span>
          </span>
          <Check size={14} />
        </button>
      </div>
    </ActionShell>
  );
};
