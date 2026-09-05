import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Loader2, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n/config';
import { publicApi } from '../../api/publicApi';
import { commentApi } from '../../api/commentApi';
import type {
  PublicMovieDetail,
  PublicCinemaShowtimes,
  PublicMovieListItem,
  PublicMoviePerson,
} from '../../types/public.types';
import Header from '../../components/Header';
import PublicFooter from '../../components/PublicFooter';
import MovieCommentsSection from './components/MovieCommentsSection';
import {
  MovieDetailPeopleRow,
  splitPeopleCsv,
} from './components/movieDetail/MovieDetailPeopleRow';
import { MovieDetailHero } from './components/movieDetail/MovieDetailHero';
import { MovieDetailBookingPanel } from './components/movieDetail/MovieDetailBookingPanel';
import { MovieDetailSimilarMovies } from './components/movieDetail/MovieDetailSimilarMovies';

const FALLBACK_COVER =
  'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=1920&q=80';

const MovieDetailPage: React.FC = () => {
  const { movieId } = useParams<{ movieId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const isPosMode = new URLSearchParams(location.search).get('pos') === '1';

  const [movie, setMovie] = useState<PublicMovieDetail | null>(null);
  const [cities, setCities] = useState<string[]>([]);
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [scheduleDates, setScheduleDates] = useState<string[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [showtimes, setShowtimes] = useState<PublicCinemaShowtimes[]>([]);
  const [recommendedMovies, setRecommendedMovies] = useState<PublicMovieListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingShowtimes, setLoadingShowtimes] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [heroIndex, setHeroIndex] = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const movieRes = await publicApi.getMovieDetail(movieId!);
      setMovie(movieRes.data);
      setHeroIndex(0);
      commentApi.trackMovieView(movieId!).catch(() => undefined);

      const commonCities = ['Hồ Chí Minh', 'Hà Nội'];
      setCities(commonCities);
      setSelectedCity(commonCities[0]);

      if (!isPosMode) {
        try {
          const similarRes = await publicApi.getSimilarMovies(movieId!);
          if (similarRes?.data && similarRes.data.length > 0) {
            const mapped = similarRes.data.map((m: any) => ({
              ...m,
              moviePosterURL: m.moviePosterURL || m.movieImageUrl || '',
              movieFormatInfos: m.movieFormatInfos || m.movieFormats?.join(', ') || '',
              movieCategoryInfos: m.movieCategoryInfos || m.movieGenres?.join(', ') || '',
            }));
            setRecommendedMovies(mapped);
          } else {
            setRecommendedMovies([]);
          }
        } catch (recErr) {
          console.error('Failed to load recommended movies:', recErr);
          setRecommendedMovies([]);
        }
      }
    } catch (err) {
      console.error('Error fetching movie detail:', err);
      setError(
        t('movieDetail.loadError', 'Failed to load movie details. Please try again later.'),
      );
    } finally {
      setLoading(false);
    }
  }, [movieId, isPosMode, t]);

  useEffect(() => {
    if (movieId) fetchData();
  }, [movieId, fetchData]);

  const coverUrls = useMemo(() => {
    if (!movie) return [FALLBACK_COVER];
    const fromApi = (movie.coverImages || [])
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((c) => c.imageUrl)
      .filter(Boolean);
    if (fromApi.length > 0) return fromApi;
    if (movie.movieBannerURL) return [movie.movieBannerURL];
    if (movie.moviePosterURL) return [movie.moviePosterURL];
    return [FALLBACK_COVER];
  }, [movie]);

  useEffect(() => {
    if (coverUrls.length <= 1) return;
    const id = window.setInterval(() => {
      setHeroIndex((i) => (i + 1) % coverUrls.length);
    }, 6000);
    return () => window.clearInterval(id);
  }, [coverUrls.length]);

  const directors = useMemo((): PublicMoviePerson[] => {
    if (!movie) return [];
    if (movie.directors && movie.directors.length > 0) return movie.directors;
    return splitPeopleCsv(movie.director);
  }, [movie]);

  const cast = useMemo((): PublicMoviePerson[] => {
    if (!movie) return [];
    if (movie.cast && movie.cast.length > 0) return movie.cast;
    return splitPeopleCsv(movie.actor).slice(0, 12);
  }, [movie]);

  const monthGroups = useMemo(() => {
    const groups: Record<string, string[]> = {};
    scheduleDates.forEach((date) => {
      const key = date.substring(0, 7);
      if (!groups[key]) groups[key] = [];
      groups[key].push(date);
    });
    return groups;
  }, [scheduleDates]);

  const monthKeys = Object.keys(monthGroups).sort();
  const filteredDates = selectedMonth ? monthGroups[selectedMonth] || [] : scheduleDates;

  useEffect(() => {
    if (monthKeys.length > 0 && !monthKeys.includes(selectedMonth)) {
      setSelectedMonth(monthKeys[0]);
    }
  }, [monthKeys, selectedMonth]);

  useEffect(() => {
    if (movieId && selectedCity) {
      void (async () => {
        try {
          const res = await publicApi.getScheduleDates(movieId, selectedCity);
          const dates = res.data || [];
          setScheduleDates(dates);
          if (dates.length > 0) {
            if (!dates.includes(selectedDate)) setSelectedDate(dates[0]);
          } else {
            setSelectedDate('');
          }
        } catch {
          console.error('Failed to load schedule dates');
          setScheduleDates([]);
          setSelectedDate('');
        }
      })();
    }
  }, [movieId, selectedCity, selectedDate]);

  useEffect(() => {
    if (movieId && selectedCity && selectedDate) {
      void (async () => {
        setLoadingShowtimes(true);
        try {
          const res = await publicApi.getShowtimes(movieId, selectedCity, selectedDate);
          setShowtimes(res.data || []);
        } catch {
          console.error('Failed to load showtimes');
        } finally {
          setLoadingShowtimes(false);
        }
      })();
    } else if (!selectedDate) {
      setShowtimes([]);
    }
  }, [movieId, selectedCity, selectedDate]);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString(
      i18n.language === 'vi' ? 'vi-VN' : i18n.language === 'ru' ? 'ru-RU' : 'en-US',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      },
    );

  const releaseYear = movie?.releaseDate ? new Date(movie.releaseDate).getFullYear() : null;

  const goHero = useCallback(
    (dir: -1 | 1) => {
      setHeroIndex((i) => (i + dir + coverUrls.length) % coverUrls.length);
    },
    [coverUrls.length],
  );

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-[var(--bg-base)] flex items-center justify-center">
        <Loader2 size={48} className="text-[var(--accent)] animate-spin" />
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="min-h-[100dvh] bg-[var(--bg-base)] flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle size={64} className="text-red-400 mb-4" />
        <p className="text-2xl font-bold text-white mb-6">
          {error || t('movieDetail.movieNotFound', 'Movie not found')}
        </p>
        <button
          className="px-6 py-3 rounded-xl font-bold text-black bg-[var(--accent)] border-none cursor-pointer"
          onClick={() => navigate('/home')}
        >
          {t('movieDetail.goHome', 'Go Home')}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[var(--bg-base)] text-[var(--text-primary)] font-sans antialiased selection:bg-[var(--accent-soft)] selection:text-[#ffb77f] overflow-x-hidden">
      <style>{`
        .mdp-surface {
            background: var(--bg-surface);
            border: 1px solid var(--border-color);
        }
        .mdp-surface-elevated {
            background: var(--bg-elevated);
            border: 1px solid var(--border-color);
        }
        .mdp-surface:hover {
            border-color: rgba(255, 138, 0, 0.22);
        }
        .mdp-btn-primary {
            background-color: var(--accent);
            color: #111;
            transition: box-shadow 0.3s ease, transform 0.3s ease;
        }
        .mdp-btn-primary:hover {
            box-shadow: 0 4px 20px var(--accent-glow);
            transform: translateY(-1px);
        }
        .mdp-btn-primary:active {
            transform: translateY(0) scale(0.98);
        }
        .mdp-btn-glass {
            background: rgba(255, 255, 255, 0.07);
            border: 1px solid rgba(255, 255, 255, 0.12);
            color: #fff;
            backdrop-filter: blur(8px);
            transition: background 0.2s ease, border-color 0.2s ease;
        }
        .mdp-btn-glass:hover {
            background: rgba(255, 255, 255, 0.12);
            border-color: rgba(255, 138, 0, 0.35);
            color: #ffb77f;
        }
        .mdp-hero-scrim-bottom {
            background: linear-gradient(0deg, var(--bg-base) 0%, rgba(19,19,22,0) 55%);
        }
        .mdp-hero-scrim-left {
            background: linear-gradient(90deg, var(--bg-base) 0%, rgba(19,19,22,0.55) 42%, transparent 72%);
        }
        .mdp-text-glow {
            text-shadow: 0 0 18px var(--accent-glow);
        }
        .mdp-scroll::-webkit-scrollbar { width: 4px; height: 4px; }
        .mdp-scroll::-webkit-scrollbar-track { background: var(--bg-base); }
        .mdp-scroll::-webkit-scrollbar-thumb { background: var(--accent); border-radius: 10px; opacity: 0.7; }
        .mdp-hide-x-scroll {
            scrollbar-width: none;
            -ms-overflow-style: none;
        }
        .mdp-hide-x-scroll::-webkit-scrollbar { display: none; width: 0; height: 0; }
        .mdp-people-scroll {
            scrollbar-width: none;
            -ms-overflow-style: none;
            cursor: grab;
            touch-action: pan-x;
        }
        .mdp-people-scroll::-webkit-scrollbar { display: none; width: 0; height: 0; }
        .mdp-people-scroll.mdp-people-dragging { cursor: grabbing; }
        @media (prefers-reduced-motion: reduce) {
            .mdp-btn-primary:hover { transform: none; }
        }
      `}</style>

      <Header />

      <main className="relative z-10">
        {/* Fullscreen cinematic cover hero */}
        <MovieDetailHero
          movie={movie}
          coverUrls={coverUrls}
          heroIndex={heroIndex}
          setHeroIndex={setHeroIndex}
          goHero={goHero}
          formatDate={formatDate}
          releaseYear={releaseYear}
        />

        {/* Content + booking */}
        <section
          id="movie-booking"
          className="relative z-20 w-full bg-[var(--bg-base)] -mt-16 md:-mt-20 pt-6"
        >
          <div className="max-w-[1440px] mx-auto px-5 md:px-16 py-10 md:py-14">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-6">
              {/* Left: director, cast */}
              <div className="lg:col-span-8 flex flex-col gap-12 md:gap-14">
                {directors.length > 0 && (
                  <div>
                    <h2
                      className="text-2xl font-semibold text-white mb-6 md:mb-8 border-l-4 border-[var(--accent)] pl-4"
                      style={{ fontFamily: "'Montserrat', sans-serif" }}
                    >
                      {t('movieDetail.director', 'Đạo diễn')}
                    </h2>
                    <MovieDetailPeopleRow people={directors} role="director" />
                  </div>
                )}

                {cast.length > 0 && (
                  <div>
                    <h2
                      className="text-2xl font-semibold text-white mb-6 md:mb-8 border-l-4 border-[var(--accent)] pl-4"
                      style={{ fontFamily: "'Montserrat', sans-serif" }}
                    >
                      {t('movieDetail.mainCast', 'Diễn viên chính')}
                    </h2>
                    <MovieDetailPeopleRow people={cast} role="actor" />
                  </div>
                )}
              </div>

              {/* Right: sticky booking panel */}
              <div className="lg:col-span-4">
                <MovieDetailBookingPanel
                  cities={cities}
                  selectedCity={selectedCity}
                  setSelectedCity={setSelectedCity}
                  monthKeys={monthKeys}
                  selectedMonth={selectedMonth}
                  setSelectedMonth={setSelectedMonth}
                  selectedDate={selectedDate}
                  setSelectedDate={setSelectedDate}
                  filteredDates={filteredDates}
                  showtimes={showtimes}
                  loadingShowtimes={loadingShowtimes}
                  isPosMode={isPosMode}
                  onSelectSchedule={(scheduleId) =>
                    navigate(
                      isPosMode
                        ? `/booking/${scheduleId}?pos=1`
                        : `/booking/${scheduleId}`,
                    )
                  }
                />
              </div>
            </div>
          </div>
        </section>

        <MovieCommentsSection movieId={movie.movieId} />

        {!isPosMode && (
          <MovieDetailSimilarMovies
            recommendedMovies={recommendedMovies}
            fallbackCover={FALLBACK_COVER}
            onMovieClick={(id) => navigate(`/movie/${id}`)}
            onViewAll={() => navigate(`/movie/${movieId}/similar`)}
          />
        )}
      </main>

      <PublicFooter />
    </div>
  );
};

export default MovieDetailPage;
