import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, Navigation } from 'lucide-react';
import type { CinemaOption } from '../../types/chatbot.types';
import { theme, optionButtonStyle } from '../../theme/chatbotTheme';
import { ActionShell } from '../ActionShell';
import { SearchInput } from '../CommonInputs';

export const CinemaPicker: React.FC<{
  cinemas: CinemaOption[];
  onPick: (cinema: CinemaOption) => void;
}> = ({ cinemas, onPick }) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const filtered = cinemas
    .filter(cinema => `${cinema.cinemaName} ${cinema.cinemaCity || ''} ${cinema.cinemaLocation || ''}`.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 14);

  return (
    <ActionShell title={t('chatbot.cinemaPicker')} icon={<MapPin size={13} />}>
      <SearchInput value={query} onChange={setQuery} placeholder={t('chatbot.searchCinema')} />
      <div style={{ display: 'grid', gap: 7, marginTop: 8 }}>
        {filtered.map(cinema => (
          <button key={cinema.cinemaId} onClick={() => onPick(cinema)} style={{ ...optionButtonStyle, alignItems: 'flex-start' }}>
            <span style={{ minWidth: 0, textAlign: 'left' }}>
              <span style={{ display: 'block', fontWeight: 900 }}>{cinema.cinemaName}</span>
              <span style={{ display: 'block', color: theme.muted, fontSize: 11, marginTop: 2 }}>
                {cinema.cinemaLocation || cinema.cinemaCity || 'CinemaPro'}
              </span>
            </span>
            {cinema.distanceInKm != null && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: theme.accent, fontSize: 11, fontWeight: 800 }}>
                <Navigation size={11} />
                {cinema.distanceInKm < 1 ? `${Math.round(cinema.distanceInKm * 1000)}m` : `${cinema.distanceInKm.toFixed(1)}km`}
              </span>
            )}
          </button>
        ))}
      </div>
    </ActionShell>
  );
};
