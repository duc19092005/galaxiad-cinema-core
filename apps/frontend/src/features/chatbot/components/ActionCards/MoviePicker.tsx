import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Film } from 'lucide-react';
import type { ActiveMovie } from '../../../../types/public.types';
import { optionButtonStyle } from '../../theme/chatbotTheme';
import { ActionShell } from '../ActionShell';
import { SearchInput } from '../CommonInputs';

export const MoviePicker: React.FC<{
  movies: ActiveMovie[];
  onPick: (movie: ActiveMovie) => void;
}> = ({ movies, onPick }) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const filtered = movies
    .filter(movie => movie.movieName.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 12);

  return (
    <ActionShell title={t('chatbot.moviePicker')} icon={<Film size={13} />}>
      <SearchInput value={query} onChange={setQuery} placeholder={t('chatbot.searchMovie')} />
      <div style={{ display: 'grid', gap: 6, marginTop: 8 }}>
        {filtered.map(movie => (
          <button key={movie.movieId} onClick={() => onPick(movie)} style={optionButtonStyle}>
            <span style={{ fontWeight: 800 }}>{movie.movieName}</span>
            <Check size={14} />
          </button>
        ))}
      </div>
    </ActionShell>
  );
};
