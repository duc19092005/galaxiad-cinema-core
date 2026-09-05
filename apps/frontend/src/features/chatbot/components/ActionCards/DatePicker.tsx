import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Clock } from 'lucide-react';
import { theme, ghostButton } from '../../theme/chatbotTheme';
import { ActionShell } from '../ActionShell';
import { todayInputValue, formatDate } from '../../utils/chatbotHelpers';

export const DatePicker: React.FC<{
  dates: string[];
  onPick: (date: string) => void;
}> = ({ dates, onPick }) => {
  const { t } = useTranslation();

  // Phan chia ngay theo thang/nam
  const groupedByMonth = useMemo(() => {
    const groups: { label: string; dates: string[] }[] = [];
    const monthNames = [
      'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
      'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12',
    ];

    for (const date of dates) {
      const d = new Date(date);
      if (isNaN(d.getTime())) continue;
      const monthLabel = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;

      let group = groups.find(g => g.label === monthLabel);
      if (!group) {
        group = { label: monthLabel, dates: [] };
        groups.push(group);
      }
      group.dates.push(date);
    }
    return groups;
  }, [dates]);

  return (
    <ActionShell title={t('chatbot.datePicker')} icon={<Clock size={13} />}>
      <input
        type="date"
        min={todayInputValue()}
        onChange={event => event.target.value && onPick(event.target.value)}
        style={{
          width: '100%',
          background: theme.surface,
          color: theme.text,
          border: `1px solid ${theme.border}`,
          borderRadius: 10,
          padding: '10px 11px',
          colorScheme: 'dark',
          fontFamily: 'inherit',
        }}
      />
      {groupedByMonth.length > 0 && (
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {groupedByMonth.map(group => (
            <div key={group.label}>
              <div style={{
                fontSize: 10, fontWeight: 900, color: theme.accent,
                textTransform: 'uppercase', letterSpacing: '0.08em',
                marginBottom: 6, fontFamily: "'JetBrains Mono', monospace",
              }}>
                {group.label}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {group.dates.map(date => (
                  <button key={date} onClick={() => onPick(date.slice(0, 10))} style={{ ...ghostButton, whiteSpace: 'nowrap', fontSize: 12 }}>
                    {formatDate(date)}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </ActionShell>
  );
};
