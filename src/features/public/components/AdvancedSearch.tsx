import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Film, MapPin, Search, Clock, MapPinned, Info, Sparkles } from 'lucide-react';
import { publicApi } from '../../../api/publicApi';
import type { ActiveCinema, ActiveMovie, SearchScheduleResult } from '../../../types/public.types';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../contexts/ThemeContext';
import { toast } from 'react-hot-toast';

const AdvancedSearch: React.FC = () => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const navigate = useNavigate();

    const [activeMovies, setActiveMovies] = useState<ActiveMovie[]>([]);
    const [activeCinemas, setActiveCinemas] = useState<ActiveCinema[]>([]);

    const getLocalDateString = (date = new Date()) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const [selectedDate, setSelectedDate] = useState<string>(getLocalDateString());
    const [selectedMovieId, setSelectedMovieId] = useState<string>('');
    const [selectedCinemaId, setSelectedCinemaId] = useState<string>('');

    const [searchResults, setSearchResults] = useState<SearchScheduleResult[] | null>(null);
    const [loading, setLoading] = useState(false);
    const [isSearching, setIsSearching] = useState(false);

    // Generate date options (today + next 7 days)
    const dateOptions = Array.from({ length: 8 }).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() + i);
        const dateStr = getLocalDateString(d);
        const label = i === 0 ? t('Today') : i === 1 ? t('Tomorrow') : d.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit' });
        return { value: dateStr, label };
    });

    useEffect(() => {
        const loadFilters = async () => {
            try {
                const [movRes, cinRes] = await Promise.all([
                    publicApi.getActiveMovies(),
                    publicApi.getActiveCinemas()
                ]);
                setActiveMovies(movRes.data || []);
                setActiveCinemas(cinRes.data || []);
            } catch (err) {
                console.error('Failed to load search filters', err);
            }
        };
        loadFilters();
    }, []);

    const handleSearch = async () => {
        setIsSearching(true);
        setLoading(true);
        try {
            const res = await publicApi.searchSchedules(selectedDate, selectedMovieId || undefined, selectedCinemaId || undefined);
            setSearchResults(res.data || []);
            if (res.data?.length === 0) {
                toast.error(t('No showtimes found for these filters.'));
            }
        } catch (err) {
            toast.error(t('Error searching schedules.'));
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleTimeClick = (scheduleId: string) => {
        navigate(`/booking/${scheduleId}`);
    };

    return (
        <div className="w-full max-w-6xl mx-auto mb-16 px-4">
            {/* Search Form */}
            <div className={`p-1.5 rounded-3xl shadow-2xl transition-all duration-500 hover:shadow-indigo-500/10 ${theme === 'modern'
                    ? 'bg-white/5 backdrop-blur-2xl border border-white/10'
                    : theme === 'dark'
                        ? 'bg-gray-900 border border-gray-800'
                        : 'bg-white border border-gray-200 shadow-xl'
                }`}>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-1">
                    {/* Date Selector */}
                    <div className={`flex flex-col p-5 border-b md:border-b-0 md:border-r transition-all duration-300 group ${theme === 'modern' ? 'border-white/5 hover:bg-white/5' : theme === 'dark' ? 'border-gray-800 hover:bg-white/5' : 'border-gray-100 hover:bg-gray-50'} md:rounded-l-2xl`}>
                        <div className="flex items-center gap-2 mb-3">
                            <Calendar className="w-4 h-4 text-indigo-400" />
                            <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${theme === 'light' ? 'text-gray-500' : 'text-white/50'}`}>1. {t('Date')}</span>
                        </div>
                        <select
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className={`bg-transparent border-none p-0 text-sm font-black focus:ring-0 w-full outline-none cursor-pointer appearance-none ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}
                        >
                            {dateOptions.map(opt => (
                                <option key={opt.value} value={opt.value} className="bg-slate-900 text-white">{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Movie Selector */}
                    <div className={`flex flex-col p-5 border-b md:border-b-0 md:border-r transition-all duration-300 group ${theme === 'modern' ? 'border-white/5 hover:bg-white/5' : theme === 'dark' ? 'border-gray-800 hover:bg-white/5' : 'border-gray-100 hover:bg-gray-50'}`}>
                        <div className="flex items-center gap-2 mb-3">
                            <Film className="w-4 h-4 text-pink-400" />
                            <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${theme === 'light' ? 'text-gray-500' : 'text-white/50'}`}>2. {t('Movie')}</span>
                        </div>
                        <select
                            value={selectedMovieId}
                            onChange={(e) => setSelectedMovieId(e.target.value)}
                            className={`bg-transparent border-none p-0 text-sm font-black focus:ring-0 w-full outline-none cursor-pointer appearance-none ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}
                        >
                            <option value="" className="bg-slate-900 text-white">{t('All Movies')}</option>
                            {activeMovies.map(m => (
                                <option key={m.movieId} value={m.movieId} className="bg-slate-900 text-white">{m.movieName}</option>
                            ))}
                        </select>
                    </div>

                    {/* Cinema Selector */}
                    <div className={`flex flex-col p-5 border-b md:border-b-0 md:border-r transition-all duration-300 group ${theme === 'modern' ? 'border-white/5 hover:bg-white/5' : theme === 'dark' ? 'border-gray-800 hover:bg-white/5' : 'border-gray-100 hover:bg-gray-50'}`}>
                        <div className="flex items-center gap-2 mb-3">
                            <MapPin className="w-4 h-4 text-cyan-400" />
                            <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${theme === 'light' ? 'text-gray-500' : 'text-white/50'}`}>3. {t('Cinema')}</span>
                        </div>
                        <select
                            value={selectedCinemaId}
                            onChange={(e) => setSelectedCinemaId(e.target.value)}
                            className={`bg-transparent border-none p-0 text-sm font-black focus:ring-0 w-full outline-none cursor-pointer appearance-none ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}
                        >
                            <option value="" className="bg-slate-900 text-white">{t('All Cinemas')}</option>
                            {activeCinemas.map(c => (
                                <option key={c.cinemaId} value={c.cinemaId} className="bg-slate-900 text-white">{c.cinemaName}</option>
                            ))}
                        </select>
                    </div>

                    {/* Search Button */}
                    <button
                        onClick={handleSearch}
                        disabled={loading}
                        className={`m-2 rounded-2xl flex items-center justify-center gap-3 font-black uppercase tracking-widest text-sm transition-all shadow-xl active:scale-95 group relative overflow-hidden ${theme === 'modern'
                                ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-rose-600 text-white hover:shadow-indigo-500/40 md:rounded-r-2xl'
                                : 'bg-red-600 text-white hover:bg-red-700 md:rounded-2xl'
                            }`}
                    >
                        <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skeleton-glow"></div>
                        {loading ? <Clock className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5 group-hover:scale-110 transition-transform" />}
                        {t('Search Now')}
                    </button>
                </div>
            </div>

            {/* Results Display */}
            {isSearching && (
                <div className="mt-16 animate-in fade-in slide-in-from-bottom-6 duration-700">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-24">
                            <div className="relative">
                                <div className={`w-20 h-20 border-4 rounded-full animate-spin ${theme === 'modern' ? 'border-indigo-500/20 border-t-indigo-500' : 'border-red-600/20 border-t-red-600'}`}></div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Sparkles className={`w-8 h-8 animate-pulse ${theme === 'modern' ? 'text-indigo-400' : 'text-red-500'}`} />
                                </div>
                            </div>
                            <p className="mt-6 text-[10px] font-black tracking-[0.4em] uppercase opacity-40">{t('Finding Your Magic...')}</p>
                        </div>
                    ) : searchResults && searchResults.length > 0 ? (
                        <div className="space-y-16">
                            {searchResults.map(movie => (
                                <div key={movie.movieId} className={`p-8 rounded-[2rem] border transition-all duration-500 ${theme === 'modern' ? 'bg-white/5 border-white/10 hover:border-white/20' : theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100 shadow-2xl shadow-gray-200/50'}`}>
                                    <div className="flex flex-col lg:flex-row gap-12">
                                        {/* Movie Sidebar */}
                                        <div className="w-full lg:w-72 flex-shrink-0">
                                            <div className="relative aspect-[2/3] rounded-3xl overflow-hidden shadow-2xl mb-6 group">
                                                <img src={movie.movieImageUrl} alt={movie.movieName} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                                <div className="absolute top-4 left-4 flex items-center gap-2">
                                                    <div className="px-3 py-1.5 bg-black/60 backdrop-blur-md text-white text-[10px] font-black rounded-xl border border-white/20">
                                                        {movie.movieRequiredAgeSymbol}
                                                    </div>
                                                </div>
                                            </div>
                                            <h3 className={`text-2xl font-black mb-4 leading-tight uppercase tracking-tighter ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>{movie.movieName}</h3>
                                            <div className="flex flex-wrap gap-2">
                                                {movie.movieGenres.map(g => (
                                                    <span key={g} className={`text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-wider ${theme === 'modern' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-gray-100 text-gray-600'}`}>{g}</span>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Cinemas Grid */}
                                        <div className="flex-1 space-y-12">
                                            {movie.cinemas.map((cinema, cIdx) => (
                                                <div key={cIdx} className="space-y-6">
                                                    <div className="flex items-center gap-5">
                                                        <div className={`p-4 rounded-2xl ${theme === 'modern' ? 'bg-indigo-500/10 border border-indigo-500/20 shadow-lg shadow-indigo-500/5' : 'bg-gray-100'}`}>
                                                            <MapPinned className={`w-7 h-7 ${theme === 'modern' ? 'text-indigo-400' : 'text-red-500'}`} />
                                                        </div>
                                                        <div>
                                                            <h4 className={`text-xl font-black uppercase tracking-tight ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>{cinema.cinemaName}</h4>
                                                            <p className={`text-sm font-medium ${theme === 'light' ? 'text-gray-500' : 'opacity-50 text-white'}`}>{cinema.cinemaLocation}</p>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-8 pl-0 sm:pl-16">
                                                        {cinema.formatShowtimes.map((format, fIdx) => (
                                                            <div key={fIdx} className="space-y-5">
                                                                <div className="flex items-center gap-4">
                                                                    <div className={`px-4 py-1.5 rounded-xl text-[10px] font-black tracking-widest uppercase border ${theme === 'modern' ? 'bg-white/5 border-white/10 text-indigo-300' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
                                                                        {format.formatName}
                                                                    </div>
                                                                    <div className={`h-px flex-1 ${theme === 'modern' ? 'bg-gradient-to-r from-white/10 to-transparent' : 'bg-gray-100'}`}></div>
                                                                </div>
                                                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
                                                                    {format.showtimes.map(st => (
                                                                        <button
                                                                            key={st.scheduleId}
                                                                            onClick={() => handleTimeClick(st.scheduleId)}
                                                                            className={`group flex flex-col items-center justify-center gap-1 p-4 rounded-[1.5rem] border transition-all duration-300 active:scale-95 ${theme === 'modern'
                                                                                    ? 'bg-yellow-500/10 border-yellow-500/30 hover:bg-yellow-500/20 hover:border-yellow-400/50 hover:shadow-lg hover:shadow-yellow-500/20'
                                                                                    : theme === 'dark'
                                                                                    ? 'bg-yellow-600/20 border-yellow-600/40 hover:bg-yellow-500/30 border-yellow-500/50'
                                                                                    : 'bg-yellow-50 border-yellow-200 hover:border-yellow-400 hover:bg-yellow-100 shadow-sm'
                                                                                }`}
                                                                        >
                                                                            <span className={`text-xl font-black tracking-tighter ${theme === 'modern' ? 'text-yellow-400 group-hover:text-yellow-300' : theme === 'dark' ? 'text-yellow-500 group-hover:text-yellow-400' : 'text-yellow-700 group-hover:text-yellow-600'}`}>
                                                                                {new Date(st.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                                                            </span>
                                                                            <span className={`text-[10px] font-bold opacity-50 uppercase tracking-[0.1em] group-hover:opacity-80 transition-opacity ${theme === 'light' ? 'text-yellow-800' : 'text-yellow-200'}`}>
                                                                                {st.auditoriumNumber}
                                                                            </span>
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-24 text-center animate-in zoom-in-95 duration-700">
                            <div className="inline-flex p-8 rounded-full bg-red-500/5 mb-8 border border-red-500/10 shadow-2xl shadow-red-500/5">
                                <Info className="w-16 h-16 text-red-500/50" />
                            </div>
                            <h3 className="text-3xl font-black mb-3 uppercase tracking-tighter text-white/80">{t('No showtimes found')}</h3>
                            <p className="opacity-30 max-w-sm mx-auto font-medium">{t('Try adjusting your filters to find more options for your cinematic journey.')}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AdvancedSearch;
