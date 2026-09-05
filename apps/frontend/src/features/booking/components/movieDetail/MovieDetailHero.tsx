import React from 'react';
import { Play, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { PublicMovieDetail } from '../../../../types/public.types';
import PublicBreadcrumb from '../../../../components/PublicBreadcrumb';

interface MovieDetailHeroProps {
  movie: PublicMovieDetail;
  coverUrls: string[];
  heroIndex: number;
  setHeroIndex: (index: number) => void;
  goHero: (dir: -1 | 1) => void;
  formatDate: (dateStr: string) => string;
  releaseYear: number | null;
}

export const MovieDetailHero: React.FC<MovieDetailHeroProps> = ({
  movie,
  coverUrls,
  heroIndex,
  setHeroIndex,
  goHero,
  formatDate,
  releaseYear,
}) => {
  const { t } = useTranslation();

  return (
    <section className="relative w-full h-[100dvh] min-h-[720px] md:min-h-[800px] flex items-end pb-20 md:pb-[10vh]">
      <div className="absolute top-[88px] md:top-[100px] left-0 right-0 z-20 pointer-events-none">
        <div className="max-w-[1440px] mx-auto px-5 md:px-16 pointer-events-auto">
          <PublicBreadcrumb
            variant="overlay"
            items={[
              { label: t('breadcrumb.home', 'Home'), path: '/home' },
              { label: t('breadcrumb.movies', 'Phim'), path: '/movies' },
              { label: movie.movieName },
            ]}
          />
        </div>
      </div>
      <div className="absolute inset-0 z-0 overflow-hidden">
        {coverUrls.map((url, idx) => (
          <div
            key={`${url}-${idx}`}
            className="absolute inset-0 transition-opacity duration-[1200ms] ease-out"
            style={{
              opacity: idx === heroIndex ? 1 : 0,
              backgroundImage: `url('${url}')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center center',
              backgroundRepeat: 'no-repeat',
            }}
            role="img"
            aria-label={t('movieDetail.heroCoverAlt', 'Movie cover')}
            aria-hidden={idx !== heroIndex}
          />
        ))}
        {/* Bottom fade into page bg */}
        <div className="absolute inset-0 mdp-hero-scrim-bottom" />
        {/* Left scrim for title readability */}
        <div className="absolute inset-0 mdp-hero-scrim-left" />
        {/* Subtle top dim under header */}
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[var(--bg-base)]/70 to-transparent" />
      </div>

      <div className="relative z-10 w-full max-w-[1440px] mx-auto px-5 md:px-16 grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 flex flex-col gap-5 md:gap-6">
          <div className="flex flex-wrap items-center gap-3">
            {movie.movieFormatInfos && (
              <span className="px-3 py-1 bg-[var(--accent)]/20 border border-[var(--accent)]/50 text-[#ffb77f] text-[12px] font-bold tracking-widest uppercase rounded-sm">
                {movie.movieFormatInfos}
              </span>
            )}
            {releaseYear && (
              <span className="px-3 py-1 bg-white/10 border border-white/20 text-white text-[12px] font-bold tracking-widest rounded-sm">
                {releaseYear}
              </span>
            )}
            {movie.movieRequiredAge && (
              <span className="px-2 py-0.5 border border-red-400/50 text-red-300 text-[12px] font-bold rounded-sm">
                {movie.movieRequiredAge}
              </span>
            )}
          </div>

          <h1
            className="text-[40px] md:text-[64px] font-extrabold text-white uppercase tracking-tighter leading-none mdp-text-glow drop-shadow-2xl"
            style={{ fontFamily: "'Montserrat', 'Plus Jakarta Sans', sans-serif" }}
          >
            {movie.movieName}
          </h1>

          <div className="flex flex-wrap items-center gap-3 md:gap-5 text-[14px] font-semibold text-[var(--text-secondary)]">
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">schedule</span>
              {movie.movieDuration} {t('movieDetail.minutes', 'mins')}
            </span>
            <span className="w-1 h-1 rounded-full bg-white/30" />
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">movie</span>
              {movie.movieCategoryInfos || t('movieDetail.formatUpdating', 'Updating')}
            </span>
            {movie.releaseDate && (
              <>
                <span className="w-1 h-1 rounded-full bg-white/30" />
                <span className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px]">calendar_today</span>
                  {formatDate(movie.releaseDate)}
                </span>
              </>
            )}
          </div>

          <p className="text-[16px] md:text-[18px] leading-7 text-white/80 max-w-2xl line-clamp-3 mt-1">
            {movie.movieDescription || t('movieDetail.noDescription', 'No storyline details available.')}
          </p>

          {movie.trailerUrl ? (
            <div className="flex flex-wrap items-center gap-3 md:gap-4 mt-4">
              <a
                href={movie.trailerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mdp-btn-primary px-8 py-4 rounded-lg text-[14px] font-semibold flex items-center gap-2 uppercase tracking-wide no-underline"
              >
                <Play size={18} className="fill-[#111]" />
                {t('movieDetail.watchTrailer', 'Watch Trailer')}
              </a>
            </div>
          ) : null}

          {/* Cover filmstrip inside hero */}
          {coverUrls.length > 1 && (
            <div className="mt-6 flex items-center gap-3">
              <button
                type="button"
                onClick={() => goHero(-1)}
                className="w-9 h-9 rounded-full mdp-btn-glass flex items-center justify-center cursor-pointer shrink-0"
                aria-label="Previous cover"
              >
                <ChevronLeft size={16} />
              </button>
              <div className="flex gap-2 overflow-x-auto mdp-hide-x-scroll pb-1 max-w-full">
                {coverUrls.map((url, idx) => (
                  <button
                    key={`hero-thumb-${idx}`}
                    type="button"
                    onClick={() => setHeroIndex(idx)}
                    className={`relative flex-shrink-0 w-20 md:w-28 aspect-video rounded-lg overflow-hidden border-2 cursor-pointer p-0 transition-all ${
                      idx === heroIndex
                        ? 'border-[var(--accent)] shadow-[0_0_14px_var(--accent-glow)] scale-[1.03]'
                        : 'border-white/15 hover:border-white/40 opacity-75 hover:opacity-100'
                    }`}
                    aria-label={`${t('movieDetail.heroCoverAlt', 'Movie cover')} ${idx + 1}`}
                  >
                    <span
                      className="absolute inset-0 block bg-cover bg-center"
                      style={{ backgroundImage: `url('${url}')` }}
                    />
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => goHero(1)}
                className="w-9 h-9 rounded-full mdp-btn-glass flex items-center justify-center cursor-pointer shrink-0"
                aria-label="Next cover"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
