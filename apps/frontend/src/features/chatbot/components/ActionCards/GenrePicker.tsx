import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Film } from 'lucide-react';
import type { PublicGenre } from '../../../../types/public.types';
import { theme, optionButtonStyle } from '../../theme/chatbotTheme';
import { ActionShell } from '../ActionShell';
import { SearchInput } from '../CommonInputs';

export const GenrePicker: React.FC<{
  genres: PublicGenre[];
  onPick: (genre: PublicGenre) => void;
}> = ({ genres, onPick }) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const filtered = genres
    .filter(genre => `${genre.genreName} ${genre.description || ''}`.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 16);

  return (
    <ActionShell title={t('chatbot.genrePicker')} icon={<Film size={13} />}>
      <SearchInput value={query} onChange={setQuery} placeholder={t('chatbot.searchGenre')} />
      <div style={{ display: 'grid', gap: 7, marginTop: 8 }}>
        {filtered.map(genre => (
          <button key={genre.genreId} onClick={() => onPick(genre)} style={{ ...optionButtonStyle, alignItems: 'flex-start' }}>
            <span style={{ textAlign: 'left', minWidth: 0 }}>
              <span style={{ display: 'block', fontWeight: 900 }}>{genre.genreName}</span>
              {genre.description && (
                <span style={{ display: 'block', color: theme.muted, fontSize: 11, marginTop: 2 }}>{genre.description}</span>
              )}
            </span>
            <Check size={14} />
          </button>
        ))}
      </div>
    </ActionShell>
  );
};
