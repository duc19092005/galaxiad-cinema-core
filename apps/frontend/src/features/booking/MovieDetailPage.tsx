import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, Loader2, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n/config';
import { publicApi } from '../../api/publicApi';
import { commentApi } from '../../api/commentApi';
import { recommendationApi } from '../../api/recommendationApi';
import type { PublicMovieDetail, PublicCinemaShowtimes, PublicMovieListItem } from '../../types/public.types';
import Header from '../../components/Header';
import MovieCommentsSection from './components/MovieCommentsSection';

const MOCK_RECOMMENDATIONS: PublicMovieListItem[] = [
    {
        movieId: 'oppenheimer',
        movieName: 'Oppenheimer',
        moviePosterURL: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD1O_H_0KoOy2puSsPLnT6dUR7E8WqrbId3se4-WfnHEqdA-czsRjYXqryLnBEOYtegrFXfzGSq-019JrlUhPp-kD1aKDfAlIILHsTQ8f0c3U8PpC0CmwfaheX2-wSCcW-w5l5-75wlI8eE1zRKJkOAJF-T7bVleF3scKMPjDNYcRQmpPvITHiHs9z-NKp6vAc8wH-qYIF4a5Ebz5vRVc7QT-twDNVzuxEPGwpotsRoIuAY26NecAlt9cdFitqCFjUt4jsp_089zjs',
        movieFormatInfos: 'IMAX • 2D',
        movieDuration: 180,
        movieRequiredAge: '18+',
        movieCategoryInfos: 'Drama',
        isCommingSoon: false,
    },
    {
        movieId: 'interstellar',
        movieName: 'Interstellar',
        moviePosterURL: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAIs3UTHbUVXCXJX7ZAM49urtKtTflPwsAnLGtarpOqVZ5snE7mjp7xTRed_8ClQ0ubFoCS1q2a2zXdcKr63f7zOydvRbkMuy-2MuXRKnbpVbN3ISJsecMCItqeV0ocUEpyVwpEBsGZsVSdf7LhC_vlzmceg7zHqq26Nzc9MbrnzMEPstancOirh0IGnf6_PaGDm-vRD7N1BN-xAVX36prBb7O5EqsIVI9nZQpZ5c-o7YrU5EEXLeKKPKzS5Y7cd-ERuNjhUuEwhbY',
        movieFormatInfos: 'IMAX • 2D',
        movieDuration: 169,
        movieRequiredAge: '13+',
        movieCategoryInfos: 'Sci-Fi',
        isCommingSoon: false,
    },
    {
        movieId: 'blade-runner-2049',
        movieName: 'Blade Runner 2049',
        moviePosterURL: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBm_rETSQAw2_mR7x2Dmk8dM_1ikKv7ZTwStEBA08AKIdUGTrzwnVBh6HrycFpVZO0dzy6h3CYmyDwTMJkhm4nfoWeWTjIWZSiCSDYqq8BtZ2D-f2xq4jWSxDU-cHUuhglSaVL2Busu4hOkub-TN-u1y_oikmFFNyiPjvtfE6euXfAbfeeN3REOayh2Wk4M2oV73HhgfPIcYbraUg-oRL5ZPDjOpY-Xxqz568HE0p9xpHVoPXKgwEthr-TT5GpjTmTYZxVogaJf5lM',
        movieFormatInfos: '2D • 3D',
        movieDuration: 164,
        movieRequiredAge: '16+',
        movieCategoryInfos: 'Sci-Fi',
        isCommingSoon: false,
    },
    {
        movieId: 'the-batman',
        movieName: 'The Batman',
        moviePosterURL: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDB-BqXjlzjlchGSQdGJNPOe5qA4U7eeFQ_aCm0mBszFfeX6u4TVbZPffBZ5YUaz8vwGJKehxAuZITpcjr3cbxIboJSPR-Q3hQ44LFoJq_7VD03J0HNM95tg83gpevnPCNsAKOJh12XTORrKS6DjltoUX25XZVfNAmPY1FZBN-jCsDshn_00-YI2H1rkAJaQYbIt7NX5JpXNek2WpCbCLvz0w1FBQpjPBS2BgeG2yDLZHAhvjG40VgWM8PSQPNqlFz5jp0J-40FTLE',
        movieFormatInfos: 'IMAX • 2D',
        movieDuration: 176,
        movieRequiredAge: '16+',
        movieCategoryInfos: 'Action',
        isCommingSoon: false,
    }
];

const MovieDetailPage: React.FC = () => {
    const { movieId } = useParams<{ movieId: string }>();
    const navigate = useNavigate();
    const { t } = useTranslation();

    const [movie, setMovie] = useState<PublicMovieDetail | null>(null);
    const [cities, setCities] = useState<string[]>([]);
    const [selectedCity, setSelectedCity] = useState<string>('');

    const [selectedDate, setSelectedDate] = useState<string>('');
    const [scheduleDates, setScheduleDates] = useState<string[]>([]);
    const [showtimes, setShowtimes] = useState<PublicCinemaShowtimes[]>([]);
    const [recommendedMovies, setRecommendedMovies] = useState<PublicMovieListItem[]>([]);

    const [loading, setLoading] = useState(true);
    const [loadingShowtimes, setLoadingShowtimes] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (movieId) {
            fetchData();
        }
    }, [movieId]);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const movieRes = await publicApi.getMovieDetail(movieId!);
            setMovie(movieRes.data);
            commentApi.trackMovieView(movieId!).catch(() => undefined);

            // Hardcoded cities
            const commonCities = ['Hồ Chí Minh', 'Hà Nội'];
            setCities(commonCities);
            setSelectedCity(commonCities[0]);

            // Fetch recommended movies with fallback
            try {
                let list: PublicMovieListItem[] = [];
                const storedUser = localStorage.getItem('user_info');
                if (storedUser) {
                    try {
                        const aiRecsRes = await recommendationApi.getRecommendations();
                        if (aiRecsRes?.data && aiRecsRes.data.length > 0) {
                            list = aiRecsRes.data.map((item: any) => ({
                                movieId: item.movieId,
                                movieName: item.movieName,
                                moviePosterURL: item.moviePosterURL || item.movieImageUrl,
                                movieBannerURL: item.movieBannerURL || item.movieBannerUrl,
                                movieFormatInfos: item.movieFormatInfos || '',
                                movieDuration: item.movieDuration,
                                movieRequiredAge: item.movieRequiredAge || item.movieRequiredAgeSymbol,
                                movieCategoryInfos: item.movieGenres || 'AI Pick',
                                isCommingSoon: item.isCommingSoon || false,
                            }));
                        }
                    } catch (e) {
                        console.log('Survey not completed, using trending fallback');
                    }
                }

                if (list.length === 0) {
                    const trendingRes = await commentApi.getTrendingMovies({ take: 8 });
                    list = (trendingRes?.data || []).map(item => ({
                        movieId: item.movieId,
                        movieName: item.movieName,
                        moviePosterURL: item.movieImageUrl,
                        movieBannerURL: item.movieBannerUrl,
                        movieFormatInfos: '',
                        movieDuration: item.movieDuration,
                        movieRequiredAge: item.movieRequiredAgeSymbol,
                        movieCategoryInfos: `Trending score ${item.trendingScore}`,
                        isCommingSoon: false,
                    }));
                }

                if (list.length === 0) {
                    let recRes = await publicApi.getNowShowing({ pageSize: 10 });
                    list = recRes?.data || [];
                    if (list.length === 0) {
                        const allRes = await publicApi.getAllMovies({ pageSize: 10 });
                        list = allRes?.data || [];
                    }
                }

                let filtered = list.filter(m => m.movieId !== movieId);
                if (filtered.length === 0) {
                    filtered = MOCK_RECOMMENDATIONS;
                }
                setRecommendedMovies(filtered.slice(0, 6));
            } catch (recErr) {
                console.error('Failed to load recommended movies:', recErr);
                setRecommendedMovies(MOCK_RECOMMENDATIONS);
            }
        } catch (err) {
            console.error('Error fetching movie detail:', err);
            setError(t('movieDetail.loadError', 'Failed to load movie details. Please try again later.'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (movieId && selectedCity) {
            fetchScheduleDates();
        }
    }, [movieId, selectedCity]);

    const fetchScheduleDates = async () => {
        try {
            const res = await publicApi.getScheduleDates(movieId!, selectedCity);
            const dates = res.data || [];
            setScheduleDates(dates);
            if (dates.length > 0) {
                if (!dates.includes(selectedDate)) {
                    setSelectedDate(dates[0]);
                }
            } else {
                setSelectedDate('');
            }
        } catch (err) {
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
        } catch (err) {
            console.error('Failed to load showtimes');
        } finally {
            setLoadingShowtimes(false);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            day: '2-digit', month: 'short', year: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
                <Loader2 size={48} className="text-[#ff8a00] animate-spin" />
            </div>
        );
    }

    if (error || !movie) {
        return (
            <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center p-6 text-center">
                <AlertCircle size={64} className="text-red-400 mb-4" />
                                <p className="text-2xl font-bold text-white mb-6">{error || t('movieDetail.movieNotFound', 'Movie not found')}</p>
                <button className="px-6 py-3 rounded-xl font-bold text-black bg-[#ff8a00] border-none cursor-pointer" onClick={() => navigate('/home')}>{t("movieDetail.goHome", "Go Home")}</button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0A0A0A] text-[#e5e2e1] font-sans selection:bg-[#ff8a00]/30 selection:text-[#ffb77f]">
            <style>{`
                .glass-card {
                    background: rgba(255, 255, 255, 0.05);
                    backdrop-filter: blur(32px);
                    border-top: 1px solid rgba(255, 255, 255, 0.1);
                    border-left: 1px solid rgba(255, 255, 255, 0.1);
                }
                .orange-glow {
                    box-shadow: 0 0 20px rgba(255, 138, 0, 0.15);
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                    height: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(0,0,0,0.1);
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #ffb77f;
                    border-radius: 10px;
                }
            `}</style>

            {/* Redesigned Unified Header */}
            <Header />

            <main className="pt-20">
                {/* Hero Section */}
                <section className="relative h-[480px] md:h-[720px] w-full overflow-hidden flex items-end">
                    <div className="absolute inset-0 z-0">
                        <img
                            alt={movie.movieName}
                            className="w-full h-full object-cover object-center filter blur-[1px] brightness-[0.6] scale-105"
                            src={movie.movieBannerURL || movie.moviePosterURL}
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = movie.moviePosterURL || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=500';
                            }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/40 to-transparent"></div>
                        <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0A] via-transparent to-transparent"></div>
                    </div>
                    
                    <div className="relative z-10 px-6 md:px-16 pb-20 max-w-7xl mx-auto w-full">
                        <div className="flex flex-col md:flex-row items-end gap-12">
                            {/* Movie Poster (Bento feel) */}
                            <div className="hidden md:block w-64 aspect-[2/3] rounded-xl overflow-hidden glass-card p-2 group cursor-pointer shadow-2xl transition-transform hover:scale-[1.02]">
                                <img
                                    alt={movie.movieName}
                                    className="w-full h-full object-cover rounded-lg"
                                    src={movie.moviePosterURL}
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=500';
                                    }}
                                />
                            </div>
                            
                            <div className="flex-1">
                                <div className="flex items-center gap-4 mb-4">
                                                                        <span className="bg-[#e9c349] text-[#241a00] px-3 py-1 rounded font-extrabold text-sm">{t('movieDetail.age', 'Age')}: {movie.movieRequiredAge}</span>
                                    <span className="flex items-center gap-1 text-[#ffb77f]">
                                        <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                        <span className="font-semibold text-sm">{t("movieDetail.mustWatch", "Must Watch")}</span>
                                    </span>
                                </div>
                                <h1 className="font-bold text-4xl md:text-6xl text-white mb-6 tracking-tighter" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                                    {movie.movieName}
                                </h1>
                                <div className="flex flex-wrap gap-6 text-[#ddc1ae] text-sm font-medium">
                                                                        <span className="flex items-center gap-2"><span className="material-symbols-outlined text-[#ffb77f]">schedule</span> {movie.movieDuration} {t('movieDetail.minutes', 'mins')}</span>
                                                                        <span className="flex items-center gap-2"><span className="material-symbols-outlined text-[#ffb77f]">calendar_today</span> {movie.releaseDate ? formatDate(movie.releaseDate) : t('movieDetail.comingSoon', 'Coming Soon')}</span>
                                                                        <span className="flex items-center gap-2"><span className="material-symbols-outlined text-[#ffb77f]">theaters</span> {movie.movieFormatInfos || t('movieDetail.formatUpdating', 'Updating')}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Main Content (Two Columns) */}
                <section className="px-6 md:px-16 py-20 max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                        {/* Left Column: Storyline & Details */}
                        <div className="lg:col-span-7 space-y-12">
                            <div>
                                <div className="flex items-center gap-3 mb-6">
                                    <span className="material-symbols-outlined text-[#ffb77f] text-[28px]">info</span>
                                                                        <h2 className="text-2xl font-bold text-white" style={{ fontFamily: "'Montserrat', sans-serif" }}>{t("movieDetail.storyline", "Storyline")}</h2>
                                </div>
                                <p className="text-lg text-white/80 leading-relaxed break-words">
                                                                        {movie.movieDescription || t('movieDetail.noDescription', 'No storyline details available.')}
                                </p>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-white/10">
                                <div className="space-y-1">
                                                                        <p className="text-xs text-[#ffb77f] tracking-widest uppercase font-semibold">{t("movieDetail.director", "Director")}</p>
                                    <p className="text-xl font-bold text-white">{movie.director || 'N/A'}</p>
                                </div>
                                <div className="space-y-1">
                                                                        <p className="text-xs text-[#ffb77f] tracking-widest uppercase font-semibold">{t("movieDetail.cast", "Cast")}</p>
                                    <p className="text-xl font-bold text-white">{movie.actor || 'N/A'}</p>
                                </div>
                                <div className="space-y-1">
                                                                        <p className="text-xs text-[#ffb77f] tracking-widest uppercase font-semibold">{t("movieDetail.genres", "Genres")}</p>
                                    <p className="text-xl font-bold text-white">{movie.movieCategoryInfos || 'N/A'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-[#ffb77f] tracking-widest uppercase font-semibold">{t("movieDetail.language", "Language")}</p>
                                    <p className="text-xl font-bold text-white">English, Vietnamese</p>
                                </div>
                            </div>
                            
                            {movie.trailerUrl && (
                                <div className="pt-4">
                                    <a
                                        href={movie.trailerUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-[#ffb77f]/50 transition-all font-semibold text-white no-underline"
                                    >
                                        <Play size={18} className="text-[#ffb77f] fill-[#ffb77f]" />                                        {t('movieDetail.watchTrailer', 'Watch Trailer')}
                                    </a>
                                </div>
                            )}
                        </div>

                        {/* Right Column: Booking */}
                        <div className="lg:col-span-5">
                            <div className="glass-card p-8 rounded-2xl border border-white/5 orange-glow sticky top-32">
                                <h2 className="text-2xl font-bold text-white mb-8" style={{ fontFamily: "'Montserrat', sans-serif" }}>{t("movieDetail.bookTickets", "Book Tickets")}</h2>
                                <div className="space-y-8">
                                    {/* City Selection */}
                                    <div>
                                        <label className="text-xs text-[#ddc1ae] font-bold block mb-3 uppercase tracking-wider">{t("movieDetail.selectCity", "SELECT CITY")}</label>
                                        <div className="relative">
                                            <span className="material-symbols-outlined text-[#ffb77f] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">location_on</span>
                                            <select
                                                value={selectedCity}
                                                onChange={(e) => setSelectedCity(e.target.value)}
                                                className="w-full bg-[#201f1f] text-white p-4 pl-12 rounded-xl border border-white/5 font-semibold appearance-none outline-none focus:border-[#ff8a00] transition-colors cursor-pointer"
                                            >
                                                {cities.map(cityName => (
                                                    <option key={cityName} value={cityName} className="bg-[#1c1b1b] text-white">{cityName}</option>
                                                ))}
                                            </select>
                                            <span className="material-symbols-outlined text-[#ddc1ae] absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">expand_more</span>
                                        </div>
                                    </div>
                                    
                                    {/* Date Selection */}
                                    <div>
                                        <label className="text-xs text-[#ddc1ae] font-bold block mb-3 uppercase tracking-wider">{t("movieDetail.selectDate", "SELECT DATE")}</label>
                                        <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                                            {scheduleDates.length === 0 ? (
                                                <div className="text-sm text-zinc-500 py-4 w-full text-center">{t("movieDetail.noDates", "No dates available")}</div>
                                            ) : (
                                                scheduleDates.map(date => {
                                                    const d = new Date(date);
                                                    const isSelected = selectedDate === date;
                                                    const month = d.toLocaleDateString(i18n.language === 'vi' ? 'vi-VN' : i18n.language === 'ru' ? 'ru-RU' : 'en-US', { month: 'short' }).toUpperCase();
                                                    const dayNum = d.getDate();
                                                    return (
                                                        <button
                                                            key={date}
                                                            onClick={() => setSelectedDate(date)}
                                                            className={`flex flex-col items-center justify-center min-w-[70px] h-20 rounded-xl transition-all duration-300 border cursor-pointer ${
                                                                isSelected
                                                                    ? 'bg-[#ff8a00] text-black border-[#ff8a00] shadow-[0_0_15px_rgba(255,138,0,0.3)]'
                                                                    : 'bg-[#201f1f] text-white border-white/5 hover:bg-[#2a2a2a]'
                                                            }`}
                                                        >
                                                            <span className={`text-[10px] font-bold ${isSelected ? 'text-black/80' : 'text-[#ddc1ae]'}`}>{month}</span>
                                                            <span className="text-2xl font-bold">{dayNum}</span>
                                                        </button>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* Location & Time */}
                                    <div>
                                        <label className="text-xs text-[#ddc1ae] font-bold block mb-3 uppercase tracking-wider">{t("movieDetail.selectCinemaTime", "SELECT CINEMA & TIME")}</label>
                                        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                                            {loadingShowtimes ? (
                                                <div className="flex items-center justify-center py-8">
                                                    <Loader2 className="animate-spin text-[#ff8a00]" size={24} />
                                                </div>
                                            ) : showtimes.length === 0 ? (
                                                <div className="text-center py-8 text-zinc-500 text-sm">                                                    {t('movieDetail.noSchedules', 'No schedules found for this date.')}
                                                </div>
                                            ) : (
                                                showtimes.map((cinema, idx) => (
                                                    <div key={idx} className="bg-[#1c1b1b] p-4 rounded-xl border border-white/5">
                                                        <div className="mb-4">
                                                            <h4 className="font-bold text-white text-md">{cinema.cinemaName}</h4>
                                                            <p className="text-[11px] text-[#ddc1ae]/70 mt-0.5">{cinema.cinemaAddress}</p>
                                                        </div>
                                                        <span className="block text-[10px] font-bold text-[#ff8a00] uppercase tracking-wider mb-2">{cinema.movieFormatName}</span>
                                                        <div className="flex flex-wrap gap-2">
                                                            {(cinema.scheduleTimesInfos || []).map((showtime) => (
                                                                <button
                                                                    key={showtime.scheduleId}
                                                                    onClick={() => navigate(`/booking/${showtime.scheduleId}`)}
                                                                    className="px-6 py-2 rounded-lg bg-[#353534] text-white border border-[#ffb77f]/20 hover:bg-[#ff8a00] hover:text-black transition-all font-semibold text-sm cursor-pointer"
                                                                >
                                                                    {new Date(showtime.showTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <MovieCommentsSection movieId={movie.movieId} />

                {/* Recommended Movies */}
                {recommendedMovies.length > 0 && (
                    <section className="bg-[#0e0e0e] py-20 overflow-hidden">
                        <div className="px-6 md:px-16 max-w-7xl mx-auto">
                            <div className="flex justify-between items-end mb-10">
                                <div>
                                    <h2 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: "'Montserrat', sans-serif" }}>{t("movieDetail.moreLikeThis", "More Like This")}</h2>
                                    <p className="text-sm text-[#ddc1ae]/80">{t("movieDetail.recommendationDesc", "Curated cinematic events you might enjoy.")}</p>
                                </div>
                                <button onClick={() => navigate('/home')} className="text-[#ffb77f] font-semibold text-sm flex items-center gap-1 hover:underline bg-transparent border-none cursor-pointer">
                                                                        {t('movieDetail.viewAll', 'View All')} <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                                </button>
                            </div>
                            <div className="flex gap-6 overflow-x-auto pb-8 custom-scrollbar scroll-smooth">
                                {recommendedMovies.map((recMovie) => (
                                    <div
                                        key={recMovie.movieId}
                                        onClick={() => navigate(`/movie/${recMovie.movieId}`)}
                                        className="min-w-[280px] group cursor-pointer"
                                    >
                                        <div className="aspect-[2/3] rounded-xl overflow-hidden mb-4 relative shadow-lg">
                                            <img
                                                src={recMovie.moviePosterURL}
                                                alt={recMovie.movieName}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=500';
                                                }}
                                            />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                                                                                <button className="bg-[#ff8a00] text-black px-6 py-2 rounded-full font-bold text-sm border-none cursor-pointer">                                                    {t('movieDetail.quickBook', 'Quick Book')}
                                                </button>
                                            </div>
                                        </div>
                                        <h3 className="font-bold text-md text-white group-hover:text-[#ff8a00] transition-colors truncate">{recMovie.movieName}</h3>
                                                                                <p className="text-xs text-[#ddc1ae] mt-1">{recMovie.movieCategoryInfos || t('movieDetail.movie', 'Movie')} • {recMovie.movieDuration} phút</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}
            </main>

            {/* Footer */}
            <footer className="w-full pt-20 pb-10 bg-[#0e0e0e] border-t border-white/5">
                <div className="flex flex-col md:flex-row justify-between items-start px-6 md:px-16 max-w-7xl mx-auto gap-8">
                    <div className="space-y-6">
                        <a className="font-bold text-2xl text-[#ffb77f] no-underline" href="#" style={{ fontFamily: "'Montserrat', sans-serif" }}>CINEMA</a>
                        <p className="text-sm text-[#ddc1ae] max-w-xs leading-relaxed">
                            The Ultimate Cinematic Experience. Redefining how you experience films with state-of-the-art technology and luxury comfort.
                        </p>
                        <div className="flex gap-4">
                            <span className="material-symbols-outlined text-[#ffb77f] cursor-pointer hover:scale-110 transition-transform">face_nod</span>
                            <span className="material-symbols-outlined text-[#ffb77f] cursor-pointer hover:scale-110 transition-transform">movie</span>
                            <span className="material-symbols-outlined text-[#ffb77f] cursor-pointer hover:scale-110 transition-transform">theaters</span>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-12">
                        <div className="space-y-4">
                            <h5 className="text-white font-bold text-sm uppercase tracking-wider">Quick Links</h5>
                            <ul className="space-y-2 text-[#ddc1ae] text-sm list-none p-0 m-0">
                                <li><a className="hover:text-[#ffb77f] transition-colors no-underline" href="#">Privacy Policy</a></li>
                                <li><a className="hover:text-[#ffb77f] transition-colors no-underline" href="#">Terms of Service</a></li>
                                <li><a className="hover:text-[#ffb77f] transition-colors no-underline" href="#">Contact Us</a></li>
                            </ul>
                        </div>
                        <div className="space-y-4">
                            <h5 className="text-white font-bold text-sm uppercase tracking-wider">Company</h5>
                            <ul className="space-y-2 text-[#ddc1ae] text-sm list-none p-0 m-0">
                                <li><a className="hover:text-[#ffb77f] transition-colors no-underline" href="#">Careers</a></li>
                                <li><a className="hover:text-[#ffb77f] transition-colors no-underline" href="#">Feedback</a></li>
                                <li><a className="hover:text-[#ffb77f] transition-colors no-underline" href="#">About Us</a></li>
                            </ul>
                        </div>
                        <div className="hidden md:block space-y-4">
                            <h5 className="text-white font-bold text-sm uppercase tracking-wider">Legal</h5>
                            <ul className="space-y-2 text-[#ddc1ae] text-sm list-none p-0 m-0">
                                <li><a className="hover:text-[#ffb77f] transition-colors no-underline" href="#">Cookie Policy</a></li>
                                <li><a className="hover:text-[#ffb77f] transition-colors no-underline" href="#">Safety Rules</a></li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div className="px-6 md:px-16 max-w-7xl mx-auto mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-[#ddc1ae] text-xs">
                    <p>© 2026 CINEMA. The Ultimate Cinematic Experience.</p>
                    <div className="flex gap-6">
                        <span>Designed for Cinephiles</span>
                        <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">bolt</span> Powered by IMAX</span>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default MovieDetailPage;
