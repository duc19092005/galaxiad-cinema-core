import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Clock, Calendar, MapPin,
    Play, Info, Loader2, AlertCircle, ChevronLeft
} from 'lucide-react';
import { publicApi } from '../../api/publicApi';
import type { PublicMovieDetail, PublicCinemaShowtimes } from '../../types/public.types';
import { useTheme } from '../../contexts/ThemeContext';

const MovieDetailPage: React.FC = () => {
    const { movieId } = useParams<{ movieId: string }>();
    const navigate = useNavigate();
    const { theme } = useTheme();

    const [movie, setMovie] = useState<PublicMovieDetail | null>(null);
    const [cities, setCities] = useState<string[]>([]);
    const [selectedCity, setSelectedCity] = useState<string>('');
    const getLocalDateString = (date = new Date()) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const [selectedDate, setSelectedDate] = useState<string>(getLocalDateString());
    const [showtimes, setShowtimes] = useState<PublicCinemaShowtimes[]>([]);

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
            
            // Hardcoded cities or fetch from a known endpoint
            // Since publicApi doesn't have getCities currently, we use a sensible default
            const commonCities = ['Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ'];
            setCities(commonCities);
            setSelectedCity(commonCities[0]);
        } catch (err) {
            console.error('Error fetching movie detail:', err);
            setError('Failed to load movie details. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (movieId && selectedCity) {
            fetchShowtimes();
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
        return new Date(dateStr).toLocaleDateString('vi-VN', {
            day: '2-digit', month: '2-digit', year: 'numeric'
        });
    };

    const generateDates = () => {
        const dates = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date();
            d.setDate(d.getDate() + i);
            dates.push(getLocalDateString(d));
        }
        return dates;
    };

    if (loading) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-black text-white' : theme === 'modern' ? 'bg-[#0D081D] text-white' : 'bg-gray-50 text-gray-900'} `}>
                <Loader2 className="w-12 h-12 animate-spin text-red-600" />
            </div>
        );
    }

    if (error || !movie) {
        return (
            <div className={`min-h-screen flex flex-col items-center justify-center p-6 ${theme === 'dark' ? 'bg-black text-white' : theme === 'modern' ? 'bg-[#0D081D] text-white' : 'bg-gray-50 text-gray-900'} `}>
                <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
                <p className="text-xl font-bold mb-4">{error || 'Movie not found'}</p>
                <button onClick={() => navigate('/home')} className="px-6 py-2 bg-red-600 text-white rounded-lg">Go Home</button>
            </div>
        );
    }

    return (
        <div className={`min-h-screen transition-colors duration-300 ${
            theme === 'dark' ? 'bg-black text-white' : 
            theme === 'modern' ? 'bg-[#0D081D] text-white' : 
            'bg-gray-50 text-gray-900'
        }`}>
            {/* Header */}
            <header className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b h-16 flex items-center px-6 transition-all ${
                theme === 'dark' ? 'bg-black/80 border-gray-800' : 
                theme === 'modern' ? 'bg-[#0E0A20]/90 border-indigo-500/30 shadow-sm shadow-indigo-500/10' : 
                'bg-white/80 border-gray-200 shadow-sm'
            }`}>
                <button 
                    onClick={() => navigate(-1)} 
                    className={`p-2 mr-4 rounded-lg transition-colors ${
                        theme === 'dark' ? 'hover:bg-gray-800 text-white' : 
                        theme === 'modern' ? 'hover:bg-indigo-500/20 text-white' : 
                        'hover:bg-gray-100 text-gray-700'
                    }`}
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <h2 className={`font-black truncate ${
                    theme === 'dark' || theme === 'modern' ? 'text-white' : 'text-gray-900'
                }`}>
                    {movie.movieName}
                </h2>
            </header>

            {/* Hero Section */}
            <div className="relative pt-16 h-[50vh] sm:h-[70vh] overflow-hidden">
                {/* Backdrop Image */}
                <div className="absolute inset-0">
                    <img
                        src={movie.movieImageUrl}
                        alt=""
                        className="w-full h-full object-cover opacity-30 scale-110 blur-xl"
                    />
                    <div className={`absolute inset-0 ${
                        theme === 'dark' ? 'bg-gradient-to-t from-black via-black/40 to-transparent' : 
                        theme === 'modern' ? 'bg-gradient-to-t from-[#0D081D] via-[#0D081D]/60 to-transparent' : 
                        'bg-gradient-to-t from-gray-50 via-gray-50/20 to-transparent'
                    }`} />
                </div>

                <div className="absolute inset-0 flex items-end">
                    <div className="container mx-auto px-6 pb-12 flex flex-col md:flex-row gap-8 items-center md:items-end">
                        {/* Movie Poster */}
                        <div className={`w-40 sm:w-56 lg:w-64 shrink-0 rounded-2xl overflow-hidden shadow-2xl border-4 transition-transform hover:scale-[1.02] duration-300 ${
                            theme === 'modern' ? 'border-cyan-400/30' : 'border-white/10'
                        }`}>
                            <img 
                                src={movie.movieImageUrl} 
                                alt={movie.movieName} 
                                className="w-full h-auto object-cover"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=500';
                                }}
                            />
                        </div>

                        {/* Movie Basic Info */}
                        <div className="flex-1 text-center md:text-left">
                            <h1 className={`text-4xl sm:text-6xl font-black mb-4 drop-shadow-2xl leading-tight ${
                                theme === 'dark' || theme === 'modern' ? 'text-white' : 'text-gray-900'
                            }`}>
                                {movie.movieName}
                            </h1>
                            <div className={`flex flex-wrap justify-center md:justify-start gap-4 text-sm sm:text-base font-medium ${
                                theme === 'dark' || theme === 'modern' ? 'text-white/80' : 'text-gray-600'
                            }`}>
                                <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
                                    <Clock className="w-4 h-4 text-red-600" /> {movie.movieDuration} mins
                                </span>
                                <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
                                    <Calendar className="w-4 h-4 text-red-600" /> {formatDate(movie.startedDate)}
                                </span>
                                <span className="px-3 py-1 bg-red-600 text-white rounded-full text-xs font-black shadow-lg shadow-red-600/30">
                                    {movie.movieRequiredAgeSymbol}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="container mx-auto px-6 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Movie Info */}
                    <div className="lg:col-span-1 space-y-8">
                        <div>
                            <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Info className="w-5 h-5 text-red-600" /> Storyline</h3>
                            <p className="opacity-80 leading-relaxed">{movie.movieDescription}</p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <h4 className={`text-xs uppercase font-bold tracking-widest mb-1 ${
                                    theme === 'modern' ? 'text-cyan-400' : 'text-red-600'
                                }`}>Director</h4>
                                <p className="font-bold">{movie.director || 'N/A'}</p>
                            </div>
                            <div>
                                <h4 className={`text-xs uppercase font-bold tracking-widest mb-1 ${
                                    theme === 'modern' ? 'text-cyan-400' : 'text-red-600'
                                }`}>Cast</h4>
                                <p className="font-bold">{movie.actors || 'N/A'}</p>
                            </div>
                            <div>
                                <h4 className={`text-xs uppercase font-bold tracking-widest mb-1 ${
                                    theme === 'modern' ? 'text-cyan-400' : 'text-red-600'
                                }`}>Genres</h4>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {movie.movieGenres.map((g, i) => (
                                        <span key={i} className={`px-3 py-1 rounded-lg text-xs font-bold border transition-colors ${
                                            theme === 'dark' ? 'bg-gray-800 border-gray-700 text-gray-300' : 
                                            theme === 'modern' ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300' : 
                                            'bg-gray-100 border-gray-200 text-gray-700'
                                        }`}>
                                            {g}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {movie.trailerUrl && (
                            <a
                                href={movie.trailerUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-3 w-full py-4 bg-white/10 hover:bg-white/20 rounded-xl font-bold transition-all border border-white/10"
                            >
                                <Play className="w-5 h-5 fill-current" /> Watch Trailer
                            </a>
                        )}
                    </div>

                    {/* Showtime Booking */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className={`p-6 rounded-2xl border ${theme === 'dark' ? 'bg-gray-900 border-gray-800' : theme === 'modern' ? 'bg-white/5 border-indigo-500/20' : 'bg-white border-gray-200 shadow-sm'} `}>
                            <h3 className="text-2xl font-black mb-8">Book Tickets</h3>

                            {/* City & Date Selection */}
                            <div className="flex flex-col sm:flex-row gap-6 mb-8">
                                <div className="flex-1">
                                    <label className="block text-xs uppercase font-bold opacity-60 mb-2 tracking-widest">Select City</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-red-600" />
                                        <select
                                            value={selectedCity}
                                            onChange={(e) => setSelectedCity(e.target.value)}
                                            className={`w-full pl-11 pr-4 py-3 rounded-xl appearance-none focus:outline-none border transition-all ${
                                                theme === 'dark' ? 'bg-black border-gray-700 text-white focus:border-red-600' : 
                                                theme === 'modern' ? 'bg-black/50 border-indigo-500/30 text-white focus:border-cyan-400' : 
                                                'bg-gray-50 border-gray-300 text-gray-900 focus:border-red-600 focus:bg-white'
                                            } `}
                                        >
                                            {cities.map(cityName => (
                                                <option key={cityName} value={cityName}>{cityName}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <label className="block text-xs uppercase font-bold opacity-60 mb-2 tracking-widest">Select Date</label>
                                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                                        {generateDates().map((date) => {
                                            const d = new Date(date);
                                            const isSelected = selectedDate === date;
                                            return (
                                                <button
                                                    key={date}
                                                    onClick={() => setSelectedDate(date)}
                                                    className={`shrink-0 w-16 py-2 rounded-xl border flex flex-col items-center transition-all ${isSelected
                                                        ? 'bg-red-600 border-red-600 text-white shadow-lg shadow-red-600/30'
                                                        : theme === 'dark' ? 'bg-black border-gray-700 hover:border-gray-500' : 'bg-gray-50 border-gray-300'
                                                        } `}
                                                >
                                                    <span className="text-[10px] uppercase font-bold opacity-70">{d.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                                                    <span className="text-lg font-black">{d.getDate()}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Showtimes List */}
                            <div className="space-y-6">
                                {loadingShowtimes ? (
                                    <div className="flex flex-col items-center py-12 opacity-50">
                                        <Loader2 className="w-8 h-8 animate-spin mb-2" />
                                        <p>Searching for showtimes...</p>
                                    </div>
                                ) : showtimes.length === 0 ? (
                                    <div className="text-center py-12 opacity-50">
                                        <AlertCircle className="w-12 h-12 mx-auto mb-4" />
                                        <p>No showtimes found for this location and date.</p>
                                    </div>
                                ) : (
                                    showtimes.map((cinema) => (
                                        <div key={cinema.cinemaId} className="space-y-4">
                                            <div className="flex items-center gap-2 border-b border-white/10 pb-2">
                                                <MapPin className="w-4 h-4 text-red-600" />
                                                <h4 className="font-bold">{cinema.cinemaName}</h4>
                                                <span className="text-xs opacity-60">— {cinema.cinemaLocation}</span>
                                            </div>
                                            <div className="space-y-6 pl-6">
                                                {cinema.formatShowtimes.map((format) => (
                                                    <div key={format.formatId}>
                                                        <span className="text-xs font-bold text-red-500 uppercase tracking-wider mb-3 block">{format.formatName}</span>
                                                        <div className="flex flex-wrap gap-3">
                                                            {format.showtimes.map((showtime) => (
                                                                <button
                                                                    key={showtime.scheduleId}
                                                                    onClick={() => navigate(`/booking/${showtime.scheduleId}`)}
                                                                    className={`px-4 py-2 rounded-lg border font-bold transition-all ${theme === 'dark' ? 'border-yellow-600/50 hover:border-yellow-500 hover:bg-yellow-500/20 text-yellow-500 hover:text-yellow-400' : theme === 'modern' ? 'border-yellow-500/30 bg-yellow-500/10 hover:bg-yellow-500/20 hover:border-yellow-400/50 hover:shadow-lg hover:shadow-yellow-500/20 text-yellow-400' : 'border-yellow-300 bg-yellow-50 hover:border-yellow-400 hover:bg-yellow-100 text-yellow-700 shadow-sm'
                                                                        } `}
                                                                >
                                                                    {new Date(showtime.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
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
    );
};

export default MovieDetailPage;
