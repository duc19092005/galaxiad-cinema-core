import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Play, Loader2, AlertCircle, ChevronLeft
} from 'lucide-react';
import { publicApi } from '../../api/publicApi';
import type { PublicMovieDetail, PublicCinemaShowtimes, PublicMovieListItem } from '../../types/public.types';

const MovieDetailPage: React.FC = () => {
    const { movieId } = useParams<{ movieId: string }>();
    const navigate = useNavigate();

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

    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => { window.removeEventListener('scroll', handleScroll); };
    }, []);

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

            // Hardcoded cities
            const commonCities = ['Hồ Chí Minh', 'Hà Nội'];
            setCities(commonCities);
            setSelectedCity(commonCities[0]);

            // Fetch recommended movies
            try {
                const recRes = await publicApi.getNowShowing({ pageSize: 10 });
                if (recRes && recRes.data) {
                    const filtered = recRes.data.filter(m => m.movieId !== movieId);
                    setRecommendedMovies(filtered.slice(0, 6));
                }
            } catch (recErr) {
                console.error('Failed to load recommended movies:', recErr);
            }
        } catch (err) {
            console.error('Error fetching movie detail:', err);
            setError('Failed to load movie details. Please try again later.');
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
                <p className="text-2xl font-bold text-white mb-6">{error || 'Movie not found'}</p>
                <button className="px-6 py-3 rounded-xl font-bold text-black bg-[#ff8a00] border-none cursor-pointer" onClick={() => navigate('/home')}>Go Home</button>
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

            {/* Navbar */}
            <nav style={{
                position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
                height: 72, padding: '0 clamp(12px, 3vw, 24px)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                backgroundColor: isScrolled ? 'var(--color-surface, #121214)' : 'rgba(255,255,255,0.03)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                borderBottom: isScrolled ? '1px solid var(--color-border, #27272a)' : '1px solid rgba(255,255,255,0.06)',
                transition: 'background-color 0.3s ease, border-color 0.3s ease'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(8px, 2vw, 16px)' }}>
                    <button
                        onClick={() => navigate(-1)}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--color-border, #27272a)', borderRadius: '50%', width: 40, height: 40, color: 'var(--color-text-primary, #fafafa)', cursor: 'pointer', transition: 'all 0.3s ease', flexShrink: 0 }}
                        className="interactive"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div
                        onClick={() => navigate('/home')}
                        style={{
                            cursor: 'pointer',
                            fontFamily: "'Montserrat', sans-serif",
                            fontSize: 'clamp(20px, 4vw, 24px)', fontWeight: 800,
                            letterSpacing: '-0.3px',
                            background: 'linear-gradient(135deg, #ffb77f, #ff8a00)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        CINEMA
                    </div>
                </div>
            </nav>

            <main>
                {/* Hero Section */}
                <section className="relative h-[550px] md:h-[870px] w-full overflow-hidden flex items-end">
                    <div className="absolute inset-0 z-0">
                        <img
                            alt={movie.movieName}
                            className="w-full h-full object-cover filter blur-[20px] brightness-[0.4] scale-110"
                            src={movie.moviePosterURL}
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=500';
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
                                    <span className="bg-[#e9c349] text-[#241a00] px-3 py-1 rounded font-extrabold text-sm">Age: {movie.movieRequiredAge}</span>
                                    <span className="flex items-center gap-1 text-[#ffb77f]">
                                        <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                        <span className="font-semibold text-sm">Must Watch</span>
                                    </span>
                                </div>
                                <h1 className="font-bold text-4xl md:text-6xl text-white mb-6 tracking-tighter" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                                    {movie.movieName}
                                </h1>
                                <div className="flex flex-wrap gap-6 text-[#ddc1ae] text-sm font-medium">
                                    <span className="flex items-center gap-2"><span className="material-symbols-outlined text-[#ffb77f]">schedule</span> {movie.movieDuration} mins</span>
                                    <span className="flex items-center gap-2"><span className="material-symbols-outlined text-[#ffb77f]">calendar_today</span> {movie.releaseDate ? formatDate(movie.releaseDate) : 'Coming Soon'}</span>
                                    <span className="flex items-center gap-2"><span className="material-symbols-outlined text-[#ffb77f]">theaters</span> IMAX, 2D, 3D</span>
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
                                    <h2 className="text-2xl font-bold text-white" style={{ fontFamily: "'Montserrat', sans-serif" }}>Storyline</h2>
                                </div>
                                <p className="text-lg text-white/80 leading-relaxed break-words">
                                    {movie.movieDescription || 'No storyline details available.'}
                                </p>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-white/10">
                                <div className="space-y-1">
                                    <p className="text-xs text-[#ffb77f] tracking-widest uppercase font-semibold">Director</p>
                                    <p className="text-xl font-bold text-white">{movie.director || 'N/A'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-[#ffb77f] tracking-widest uppercase font-semibold">Cast</p>
                                    <p className="text-xl font-bold text-white">{movie.actor || 'N/A'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-[#ffb77f] tracking-widest uppercase font-semibold">Genres</p>
                                    <p className="text-xl font-bold text-white">{movie.movieCategoryInfos || 'N/A'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-[#ffb77f] tracking-widest uppercase font-semibold">Language</p>
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
                                        <Play size={18} className="text-[#ffb77f] fill-[#ffb77f]" />
                                        Watch Trailer
                                    </a>
                                </div>
                            )}
                        </div>

                        {/* Right Column: Booking */}
                        <div className="lg:col-span-5">
                            <div className="glass-card p-8 rounded-2xl border border-white/5 orange-glow sticky top-32">
                                <h2 className="text-2xl font-bold text-white mb-8" style={{ fontFamily: "'Montserrat', sans-serif" }}>Book Tickets</h2>
                                <div className="space-y-8">
                                    {/* City Selection */}
                                    <div>
                                        <label className="text-xs text-[#ddc1ae] font-bold block mb-3 uppercase tracking-wider">SELECT CITY</label>
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
                                        <label className="text-xs text-[#ddc1ae] font-bold block mb-3 uppercase tracking-wider">SELECT DATE</label>
                                        <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                                            {scheduleDates.length === 0 ? (
                                                <div className="text-sm text-zinc-500 py-4 w-full text-center">No dates available</div>
                                            ) : (
                                                scheduleDates.map(date => {
                                                    const d = new Date(date);
                                                    const isSelected = selectedDate === date;
                                                    const month = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
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
                                        <label className="text-xs text-[#ddc1ae] font-bold block mb-3 uppercase tracking-wider">SELECT CINEMA & TIME</label>
                                        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                                            {loadingShowtimes ? (
                                                <div className="flex items-center justify-center py-8">
                                                    <Loader2 className="animate-spin text-[#ff8a00]" size={24} />
                                                </div>
                                            ) : showtimes.length === 0 ? (
                                                <div className="text-center py-8 text-zinc-500 text-sm">
                                                    No schedules found for this date.
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

                {/* Recommended Movies */}
                {recommendedMovies.length > 0 && (
                    <section className="bg-[#0e0e0e] py-20 overflow-hidden">
                        <div className="px-6 md:px-16 max-w-7xl mx-auto">
                            <div className="flex justify-between items-end mb-10">
                                <div>
                                    <h2 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: "'Montserrat', sans-serif" }}>More Like This</h2>
                                    <p className="text-sm text-[#ddc1ae]/80">Curated cinematic events you might enjoy.</p>
                                </div>
                                <button onClick={() => navigate('/home')} className="text-[#ffb77f] font-semibold text-sm flex items-center gap-1 hover:underline bg-transparent border-none cursor-pointer">
                                    View All <span className="material-symbols-outlined text-[18px]">chevron_right</span>
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
                                                <button className="bg-[#ff8a00] text-black px-6 py-2 rounded-full font-bold text-sm border-none cursor-pointer">
                                                    Quick Book
                                                </button>
                                            </div>
                                        </div>
                                        <h3 className="font-bold text-md text-white group-hover:text-[#ff8a00] transition-colors truncate">{recMovie.movieName}</h3>
                                        <p className="text-xs text-[#ddc1ae] mt-1">{recMovie.movieCategoryInfos || 'Movie'} • {recMovie.movieDuration} mins</p>
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
