import React from 'react';
import { useTranslation } from 'react-i18next';
import type { PublicMovieListItem } from '../../../../types/public.types';

interface MovieDetailSimilarMoviesProps {
  recommendedMovies: PublicMovieListItem[];
  fallbackCover: string;
  onMovieClick: (movieId: string) => void;
  onViewAll: () => void;
}

export const MovieDetailSimilarMovies: React.FC<MovieDetailSimilarMoviesProps> = ({
  recommendedMovies,
  fallbackCover,
  onMovieClick,
  onViewAll,
}) => {
  const { t } = useTranslation();

  return (
    <section className="bg-[var(--bg-base)] py-16 overflow-hidden border-t border-[var(--border-color)]">
      <div className="px-5 md:px-16 max-w-[1440px] mx-auto">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2
              className="text-2xl md:text-3xl font-bold text-white mb-1"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              {t('movieDetail.moreLikeThis', 'More Like This')}
            </h2>
            <p className="text-sm text-[var(--text-secondary)]/80">
              {t('movieDetail.recommendationDesc', 'Curated cinematic events you might enjoy.')}
            </p>
          </div>
          <button
            type="button"
            onClick={onViewAll}
            className="group flex items-center gap-1 bg-transparent border-none cursor-pointer text-[#ffb77f] font-semibold text-sm"
          >
            <span className="group-hover:underline">{t('movieDetail.viewAll', 'View All')}</span>
            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
          </button>
        </div>
        {recommendedMovies.length > 0 ? (
          <div className="flex gap-5 overflow-x-auto pb-6 mdp-scroll scroll-smooth">
            {recommendedMovies.slice(0, 5).map((recMovie) => (
              <div
                key={recMovie.movieId}
                onClick={() => onMovieClick(recMovie.movieId)}
                className="w-[180px] flex-shrink-0 group cursor-pointer"
              >
                <div className="w-[180px] h-[270px] rounded-xl overflow-hidden mb-3 relative shadow-lg border border-[var(--border-color)]">
                  <img
                    src={recMovie.moviePosterURL}
                    alt={recMovie.movieName}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = fallbackCover;
                    }}
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="bg-[var(--accent)] text-black px-4 py-1.5 rounded-full font-bold text-xs">
                      {t('movieDetail.quickBook', 'Quick Book')}
                    </span>
                  </div>
                </div>
                <h3 className="font-bold text-sm text-white group-hover:text-[var(--accent)] transition-colors truncate">
                  {recMovie.movieName}
                </h3>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  {recMovie.movieCategoryInfos || t('movieDetail.movie', 'Movie')} ·{' '}
                  {recMovie.movieDuration} {t('movieDetail.minutes', 'mins')}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)]">
            <span className="material-symbols-outlined text-4xl text-[var(--text-secondary)]/40 mb-2 block">
              movie
            </span>
            <p className="text-sm text-[var(--text-secondary)]/60">
              {t('movieDetail.noSimilarMovies', 'No similar movies found.')}
            </p>
          </div>
        )}
      </div>
    </section>
  );
};
