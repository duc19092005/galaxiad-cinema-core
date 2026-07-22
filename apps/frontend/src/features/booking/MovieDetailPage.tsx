import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Play, Loader2, AlertCircle, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n/config';
import { publicApi } from '../../api/publicApi';
import { commentApi } from '../../api/commentApi';
import type { PublicMovieDetail, PublicCinemaShowtimes, PublicMovieListItem } from '../../types/public.types';
import Header from '../../components/Header';
import PublicFooter from '../../components/PublicFooter';
import MovieCommentsSection from './components/MovieCommentsSection';

const FALLBACK_COVER =
    'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=1920&q=80';

const actorAvatar = (name: string) =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name.trim())}&background=1a1a20&color=ffb77f&size=128&bold=true&format=svg`;

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

    useEffect(() => {
        if (movieId) fetchData();
    }, [movieId, isPosMode]);

    const fetchData = async () => {
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
            setError(t('movieDetail.loadError', 'Failed to load movie details. Please try again later.'));
        } finally {
            setLoading(false);
        }
    };

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

    const castNames = useMemo(() => {
        if (!movie?.actor) return [] as string[];
        return movie.actor
            .split(/[,;|]/)
            .map((s) => s.trim())
            .filter(Boolean)
            .slice(0, 8);
    }, [movie?.actor]);

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
        if (movieId && selectedCity) fetchScheduleDates();
    }, [movieId, selectedCity]);

    const fetchScheduleDates = async () => {
        try {
            const res = await publicApi.getScheduleDates(movieId!, selectedCity);
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
    };

    useEffect(() => {
        if (movieId && selectedCity && selectedDate) {
            fetchShowtimes();
        } else if (!selectedDate) {
            setShowtimes([]);
        }
    }, [movieId, selectedCity, selectedDate]);

    const fetchShowtimes = async () => {
        setLoadingShowtimes(true);
        try {
            const res = await publicApi.getShowtimes(movieId!, selectedCity, selectedDate);
            setShowtimes(res.data || []);
        } catch {
            console.error('Failed to load showtimes');
        } finally {
            setLoadingShowtimes(false);
        }
    };

    const formatDate = (dateStr: string) =>
        new Date(dateStr).toLocaleDateString(i18n.language === 'vi' ? 'vi-VN' : i18n.language === 'ru' ? 'ru-RU' : 'en-US', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });

    const releaseYear = movie?.releaseDate ? new Date(movie.releaseDate).getFullYear() : null;

    const goHero = useCallback(
        (dir: -1 | 1) => {
            setHeroIndex((i) => (i + dir + coverUrls.length) % coverUrls.length);
        },
        [coverUrls.length]
    );

    const scrollToBooking = () => {
        document.getElementById('movie-booking')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

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
                <p className="text-2xl font-bold text-white mb-6">{error || t('movieDetail.movieNotFound', 'Movie not found')}</p>
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
                @media (prefers-reduced-motion: reduce) {
                    .mdp-btn-primary:hover { transform: none; }
                }
            `}</style>

            <Header />

            <main className="relative z-10">
                {/* Fullscreen cinematic cover hero (HTML mock style) */}
                <section className="relative w-full h-[100dvh] min-h-[720px] md:min-h-[800px] flex items-end pb-20 md:pb-[10vh]">
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
                        {/* Bottom fade into page bg (same recipe as Home hero) */}
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

                            <div className="flex flex-wrap items-center gap-3 md:gap-4 mt-4">
                                {movie.trailerUrl ? (
                                    <a
                                        href={movie.trailerUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="mdp-btn-primary px-8 py-4 rounded-lg text-[14px] font-semibold flex items-center gap-2 uppercase tracking-wide no-underline"
                                    >
                                        <Play size={18} className="fill-[#111]" />
                                        {t('movieDetail.watchTrailer', 'Watch Trailer')}
                                    </a>
                                ) : null}
                                <button
                                    type="button"
                                    onClick={scrollToBooking}
                                    className="mdp-btn-glass px-6 py-4 rounded-lg text-[14px] font-semibold flex items-center gap-2 cursor-pointer"
                                >
                                    {t('movieDetail.scrollToBooking', 'Book now')}
                                    <ArrowRight size={16} />
                                </button>
                            </div>

                            {/* Cover filmstrip inside hero (multi banner) */}
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
                                    <div className="flex gap-2 overflow-x-auto mdp-scroll pb-1 max-w-full">
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

                {/* Content + booking: solid dark, slight pull-up over hero */}
                <section
                    id="movie-booking"
                    className="relative z-20 w-full bg-[var(--bg-base)] -mt-16 md:-mt-20 pt-6"
                >
                    <div className="max-w-[1440px] mx-auto px-5 md:px-16 py-10 md:py-14">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-6">
                        {/* Left: cast, storyline */}
                        <div className="lg:col-span-8 flex flex-col gap-12 md:gap-14">
                            {castNames.length > 0 && (
                                <div>
                                    <h2
                                        className="text-2xl font-semibold text-white mb-6 md:mb-8 border-l-4 border-[var(--accent)] pl-4"
                                        style={{ fontFamily: "'Montserrat', sans-serif" }}
                                    >
                                        {t('movieDetail.mainCast', 'Main cast')}
                                    </h2>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                        {castNames.map((name) => (
                                            <div
                                                key={name}
                                                className="mdp-surface rounded-xl p-4 flex flex-col items-center text-center group cursor-default transition-colors duration-300"
                                            >
                                                <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden mb-3 border-2 border-transparent group-hover:border-[rgba(255,138,0,0.5)] transition-colors duration-300 bg-[var(--bg-base)]">
                                                    <img
                                                        src={actorAvatar(name)}
                                                        alt={name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <p className="text-sm font-bold text-[var(--text-primary)] leading-snug group-hover:text-[#ffb77f] transition-colors">
                                                    {name}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div>
                                <h2
                                    className="text-2xl font-semibold text-white mb-4 border-l-4 border-[var(--accent)] pl-4"
                                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                                >
                                    {t('movieDetail.storyline', 'Storyline')}
                                </h2>
                                <p className="text-lg text-white/80 leading-relaxed max-w-3xl break-words">
                                    {movie.movieDescription || t('movieDetail.noDescription', 'No storyline details available.')}
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-[var(--border-color)]">
                                <div className="space-y-1">
                                    <p className="text-xs text-[#ffb77f] tracking-widest uppercase font-semibold">
                                        {t('movieDetail.director', 'Director')}
                                    </p>
                                    <p className="text-xl font-bold text-white">{movie.director || 'N/A'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-[#ffb77f] tracking-widest uppercase font-semibold">
                                        {t('movieDetail.genres', 'Genres')}
                                    </p>
                                    <p className="text-xl font-bold text-white">{movie.movieCategoryInfos || 'N/A'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-[#ffb77f] tracking-widest uppercase font-semibold">
                                        {t('movieDetail.cast', 'Cast')}
                                    </p>
                                    <p className="text-xl font-bold text-white">{movie.actor || 'N/A'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-[#ffb77f] tracking-widest uppercase font-semibold">
                                        {t('movieDetail.selectFormat', 'Format')}
                                    </p>
                                    <p className="text-xl font-bold text-white">{movie.movieFormatInfos || 'N/A'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Right: sticky booking panel */}
                        <div className="lg:col-span-4">
                            <div className="mdp-surface p-6 md:p-8 rounded-2xl sticky top-28">
                                <h2
                                    className="text-2xl font-bold text-white mb-6"
                                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                                >
                                    {t('movieDetail.bookTickets', 'Book Tickets')}
                                </h2>

                                <div className="flex flex-col gap-6">
                                    <div>
                                        <label className="text-[12px] text-[var(--text-secondary)] font-bold block mb-2 uppercase tracking-widest">
                                            {t('movieDetail.selectCity', 'SELECT CITY')}
                                        </label>
                                        <div className="relative">
                                            <span className="material-symbols-outlined text-[#ffb77f] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-[20px]">
                                                location_on
                                            </span>
                                            <select
                                                value={selectedCity}
                                                onChange={(e) => setSelectedCity(e.target.value)}
                                                className="w-full bg-[var(--bg-base)] text-white p-3.5 pl-11 rounded-xl border border-[var(--border-color)] font-semibold appearance-none outline-none focus:border-[var(--accent)] transition-colors cursor-pointer"
                                            >
                                                {cities.map((cityName) => (
                                                    <option key={cityName} value={cityName} className="bg-[var(--bg-elevated)]">
                                                        {cityName}
                                                    </option>
                                                ))}
                                            </select>
                                            <span className="material-symbols-outlined text-[var(--text-secondary)] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[20px]">
                                                expand_more
                                            </span>
                                        </div>
                                    </div>

                                    <div>
                                        {monthKeys.length > 1 && (
                                            <div className="flex gap-2 mb-3 overflow-x-auto pb-1 mdp-scroll">
                                                {monthKeys.map((key) => {
                                                    const d = new Date(key + '-01');
                                                    const label = d
                                                        .toLocaleDateString(
                                                            i18n.language === 'vi' ? 'vi-VN' : i18n.language === 'ru' ? 'ru-RU' : 'en-US',
                                                            { month: 'short', year: 'numeric' }
                                                        )
                                                        .toUpperCase();
                                                    const isActive = selectedMonth === key;
                                                    return (
                                                        <button
                                                            key={key}
                                                            type="button"
                                                            onClick={() => {
                                                                setSelectedMonth(key);
                                                                setSelectedDate('');
                                                            }}
                                                            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all border cursor-pointer whitespace-nowrap ${
                                                                isActive
                                                                    ? 'bg-[var(--accent)] text-black border-[var(--accent)]'
                                                                    : 'bg-[var(--bg-base)] text-[var(--text-secondary)] border-[var(--border-color)] hover:bg-[var(--bg-elevated)]'
                                                            }`}
                                                        >
                                                            {label}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        <label className="text-[12px] text-[var(--text-secondary)] font-bold block mb-2 uppercase tracking-widest">
                                            {t('movieDetail.selectDate', 'SELECT DATE')}
                                        </label>
                                        <div className="flex gap-2 overflow-x-auto pb-1 mdp-scroll">
                                            {filteredDates.length === 0 ? (
                                                <div className="text-sm text-zinc-500 py-3 w-full text-center">
                                                    {t('movieDetail.noDates', 'No dates available')}
                                                </div>
                                            ) : (
                                                filteredDates.map((date) => {
                                                    const d = new Date(date);
                                                    const isSelected = selectedDate === date;
                                                    const month = d
                                                        .toLocaleDateString(
                                                            i18n.language === 'vi' ? 'vi-VN' : i18n.language === 'ru' ? 'ru-RU' : 'en-US',
                                                            { month: 'short' }
                                                        )
                                                        .toUpperCase();
                                                    return (
                                                        <button
                                                            key={date}
                                                            type="button"
                                                            onClick={() => setSelectedDate(date)}
                                                            className={`flex flex-col items-center justify-center min-w-[64px] h-[72px] rounded-xl transition-all border cursor-pointer ${
                                                                isSelected
                                                                    ? 'bg-[var(--accent)] text-black border-[var(--accent)] shadow-[0_0_12px_var(--accent-glow)]'
                                                                    : 'bg-[var(--bg-base)] text-white border-[var(--border-color)] hover:bg-[var(--bg-elevated)]'
                                                            }`}
                                                        >
                                                            <span className={`text-[10px] font-bold ${isSelected ? 'text-black/80' : 'text-[var(--text-secondary)]'}`}>
                                                                {month}
                                                            </span>
                                                            <span className="text-xl font-bold">{d.getDate()}</span>
                                                        </button>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[12px] text-[var(--text-secondary)] font-bold block mb-2 uppercase tracking-widest">
                                            {t('movieDetail.selectCinemaTime', 'SELECT CINEMA & TIME')}
                                        </label>
                                        <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1 mdp-scroll">
                                            {loadingShowtimes ? (
                                                <div className="flex items-center justify-center py-8">
                                                    <Loader2 className="animate-spin text-[var(--accent)]" size={24} />
                                                </div>
                                            ) : showtimes.length === 0 ? (
                                                <div className="text-center py-6 text-zinc-500 text-sm">
                                                    {t('movieDetail.noSchedules', 'No schedules found for this date.')}
                                                </div>
                                            ) : (
                                                showtimes.map((cinema, idx) => (
                                                    <div key={idx} className="bg-[var(--bg-base)] p-3.5 rounded-xl border border-[var(--border-color)]">
                                                        <div className="mb-3">
                                                            <h4 className="font-bold text-white text-sm">{cinema.cinemaName}</h4>
                                                            <p className="text-[11px] text-[var(--text-secondary)]/70 mt-0.5">{cinema.cinemaAddress}</p>
                                                        </div>
                                                        <span className="block text-[10px] font-bold text-[var(--accent)] uppercase tracking-wider mb-2">
                                                            {cinema.movieFormatName}
                                                        </span>
                                                        <div className="flex flex-wrap gap-2">
                                                            {(cinema.scheduleTimesInfos || []).map((showtime) => (
                                                                <button
                                                                    key={showtime.scheduleId}
                                                                    type="button"
                                                                    onClick={() =>
                                                                        navigate(
                                                                            isPosMode
                                                                                ? `/booking/${showtime.scheduleId}?pos=1`
                                                                                : `/booking/${showtime.scheduleId}`
                                                                        )
                                                                    }
                                                                    className="px-4 py-2 rounded-lg bg-[var(--bg-elevated)] text-white border border-[var(--border-color)] hover:bg-[var(--accent)] hover:text-black hover:border-[var(--accent)] transition-all font-semibold text-sm cursor-pointer"
                                                                >
                                                                    {new Date(showtime.showTime).toLocaleTimeString('vi-VN', {
                                                                        hour: '2-digit',
                                                                        minute: '2-digit',
                                                                    })}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>

                                    {showtimes.length > 0 && (
                                        <p className="text-[11px] text-[var(--text-secondary)]/70 text-center">
                                            {t('movieDetail.continueSelectSeats', 'Continue to seats')} → {t('movieDetail.selectCinemaTime', 'pick a showtime')}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    </div>
                </section>

                <MovieCommentsSection movieId={movie.movieId} />

                {!isPosMode && (
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
                                    onClick={() => navigate(`/movie/${movieId}/similar`)}
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
                                            onClick={() => navigate(`/movie/${recMovie.movieId}`)}
                                            className="w-[180px] flex-shrink-0 group cursor-pointer"
                                        >
                                            <div className="w-[180px] h-[270px] rounded-xl overflow-hidden mb-3 relative shadow-lg border border-[var(--border-color)]">
                                                <img
                                                    src={recMovie.moviePosterURL}
                                                    alt={recMovie.movieName}
                                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                    onError={(e) => {
                                                        e.currentTarget.onerror = null;
                                                        e.currentTarget.src = FALLBACK_COVER;
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
                                                {recMovie.movieCategoryInfos || t('movieDetail.movie', 'Movie')} · {recMovie.movieDuration}{' '}
                                                {t('movieDetail.minutes', 'mins')}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-10 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)]">
                                    <span className="material-symbols-outlined text-4xl text-[var(--text-secondary)]/40 mb-2 block">movie</span>
                                    <p className="text-sm text-[var(--text-secondary)]/60">{t('movieDetail.noSimilarMovies', 'No similar movies found.')}</p>
                                </div>
                            )}
                        </div>
                    </section>
                )}
            </main>

            <PublicFooter />
        </div>
    );
};

export default MovieDetailPage;
