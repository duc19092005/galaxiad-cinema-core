import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Clock, Calendar, MapPin,
    Play, Info, Loader2, AlertCircle, ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { publicApi } from '../../api/publicApi';
import type { PublicMovieDetail, PublicCinemaShowtimes } from '../../types/public.types';

const MovieDetailPage: React.FC = () => {
    const { movieId } = useParams<{ movieId: string }>();
    const navigate = useNavigate();

    const [movie, setMovie] = useState<PublicMovieDetail | null>(null);
    const [cities, setCities] = useState<string[]>([]);
    const [selectedCity, setSelectedCity] = useState<string>('');

    const [selectedDate, setSelectedDate] = useState<string>('');
    const [scheduleDates, setScheduleDates] = useState<string[]>([]);
    const [showtimes, setShowtimes] = useState<PublicCinemaShowtimes[]>([]);

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
            <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-bg-base, #09090b)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Loader2 size={48} style={{ color: 'var(--color-accent-primary, #ff8a00)', animation: 'spin 1s linear infinite' }} />
            </div>
        );
    }

    if (error || !movie) {
        return (
            <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-bg-base, #09090b)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
                <AlertCircle size={64} style={{ color: '#ffb4ab', marginBottom: '16px' }} />
                <p style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-text-primary, #fafafa)', marginBottom: '24px' }}>{error || 'Movie not found'}</p>
                <button className="btn-primary cta-glow" onClick={() => navigate('/home')}>Go Home</button>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-bg-base, #09090b)', color: 'var(--color-text-primary, #fafafa)' }}>
            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
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

            {/* Hero Section - Improved */}
            <div style={{ position: 'relative', minHeight: 'min(65vh, 500px)', overflow: 'hidden' }}>
                {/* Background blur */}
                <div style={{ position: 'absolute', inset: 0 }}>
                    <img
                        src={movie.moviePosterURL}
                        alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(20px) brightness(0.4)', transform: 'scale(1.1)' }}
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=500';
                        }}
                    />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, var(--color-bg-base, #09090b) 0%, rgba(10,10,10,0.5) 60%, transparent 100%)' }} />
                </div>

                {/* Content */}
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-end' }}>
                    <div style={{
                        width: '100%', maxWidth: 1280, margin: '0 auto',
                        padding: 'clamp(12px, 3vw, 24px)',
                        display: 'flex', gap: 'clamp(16px, 4vw, 32px)',
                        flexWrap: 'wrap', alignItems: 'flex-end',
                    }}>
                        {/* Poster Card */}
                        <div style={{
                            width: 'clamp(140px, 20vw, 240px)',
                            flexShrink: 0,
                            borderRadius: 'var(--radius-lg, 16px)', overflow: 'hidden',
                            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            transform: 'translateY(clamp(16px, 5vw, 40px))',
                            aspectRatio: '2/3',
                            zIndex: 10,
                        }}>
                            <img
                                src={movie.moviePosterURL}
                                alt={movie.movieName}
                                style={{ width: '100%', height: '100%', display: 'block', objectFit: 'cover' }}
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=500';
                                }}
                            />
                        </div>

                        {/* Basic Info */}
                        <div style={{ flex: 1, minWidth: 'min(100%, 300px)', paddingBottom: 'clamp(12px, 3vw, 24px)', zIndex: 10 }}>
                            <h1 style={{
                                fontFamily: "'Montserrat', sans-serif",
                                fontSize: 'clamp(1.5rem, 5vw, 3.5rem)',
                                fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.02em',
                                color: 'white', marginBottom: 'clamp(8px, 2vw, 16px)',
                                textShadow: '0 4px 12px rgba(0,0,0,0.5)',
                                overflowWrap: 'break-word',
                                wordBreak: 'break-word',
                            }}>
                                {movie.movieName}
                            </h1>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'clamp(8px, 2vw, 12px)', fontSize: 'clamp(12px, 2vw, 14px)', fontWeight: 500, color: 'var(--color-text-primary, #fafafa)' }}>
                                <span className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 16px', borderRadius: 'var(--radius-full, 9999px)' }}>
                                    <Clock size={16} style={{ color: 'var(--color-accent-primary, #ff8a00)', flexShrink: 0 }} /> {movie.movieDuration} mins
                                </span>
                                <span className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 16px', borderRadius: 'var(--radius-full, 9999px)' }}>
                                    <Calendar size={16} style={{ color: 'var(--color-accent-primary, #ff8a00)', flexShrink: 0 }} /> {movie.releaseDate ? formatDate(movie.releaseDate) : 'Coming Soon'}
                                </span>
                                <span style={{ padding: '6px 16px', backgroundColor: '#ff8a00', color: 'black', borderRadius: 'var(--radius-full, 9999px)', fontWeight: 700, fontSize: 13, boxShadow: '0 0 16px rgba(255,138,0,0.3)' }}>
                                    {movie.movieRequiredAge}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Section - Fixed 2-column layout on desktop */}
            <div style={{
                width: '100%', maxWidth: 1280, margin: '0 auto',
                padding: 'clamp(24px, 5vw, 40px) clamp(12px, 3vw, 24px) 80px',
                display: 'grid',
                gridTemplateColumns: '1fr',
                gap: 'clamp(24px, 5vw, 40px)',
            }}
                className="lg:grid-cols-[minmax(0,1fr)_minmax(380px,500px)]"
            >
                {/* LEFT: Storyline & Details */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(24px, 4vw, 32px)', minWidth: 0 }}>
                    {/* Storyline */}
                    <div>
                        <h3 style={{ fontSize: 'clamp(18px, 3vw, 20px)', fontWeight: 700, marginBottom: 'clamp(8px, 2vw, 12px)', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Info size={20} style={{ color: 'var(--color-accent-primary, #ff8a00)', flexShrink: 0 }} /> Storyline
                        </h3>
                        <p style={{ color: 'var(--color-text-secondary, #a1a1aa)', lineHeight: 1.7, fontSize: 'clamp(14px, 2vw, 15px)', overflowWrap: 'break-word', wordBreak: 'break-word' }}>
                            {movie.movieDescription || 'No description available.'}
                        </p>
                    </div>

                    {/* Meta details */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: 'clamp(16px, 3vw, 24px)' }}>
                        <div>
                            <h4 style={{ fontSize: 11, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--color-accent-primary, #ff8a00)', marginBottom: 'var(--space-4, 4px)' }}>Director</h4>
                            <p style={{ fontWeight: 600, fontSize: 'clamp(14px, 2vw, 15px)', overflowWrap: 'break-word' }}>{movie.director || 'N/A'}</p>
                        </div>
                        <div>
                            <h4 style={{ fontSize: 11, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--color-accent-primary, #ff8a00)', marginBottom: 'var(--space-4, 4px)' }}>Cast</h4>
                            <p style={{ fontWeight: 600, fontSize: 'clamp(14px, 2vw, 15px)', overflowWrap: 'break-word' }}>{movie.actor || 'N/A'}</p>
                        </div>
                        <div>
                            <h4 style={{ fontSize: 11, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--color-accent-primary, #ff8a00)', marginBottom: 'var(--space-8, 8px)' }}>Genres</h4>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'clamp(4px, 1vw, 8px)' }}>
                                {movie.movieCategoryInfos && movie.movieCategoryInfos.split(',').map(g => g.trim()).filter(Boolean).map((g: string, i: number) => (
                                    <span key={i} style={{ padding: '6px 12px', borderRadius: 'var(--radius-sm, 6px)', backgroundColor: 'var(--color-surface, #18181b)', border: '1px solid var(--color-border, #27272a)', fontSize: 12, fontWeight: 500 }}>
                                        {g}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Trailer link */}
                    {movie.trailerUrl && (
                        <a
                            href={movie.trailerUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="glass-card interactive"
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 'clamp(12px, 2vw, 16px)', borderRadius: 'var(--radius-md, 10px)', fontWeight: 700, color: 'var(--color-text-primary, #fafafa)', textDecoration: 'none' }}
                        >
                            <Play size={20} style={{ color: '#ff8a00', flexShrink: 0 }} /> Watch Trailer
                        </a>
                    )}
                </div>

                {/* RIGHT: Booking Tickets */}
                <div style={{ minWidth: 0 }}>
                    <div style={{
                        backgroundColor: 'var(--color-surface, #121214)',
                        border: '1px solid var(--color-border, #27272a)',
                        borderRadius: 'var(--radius-lg, 16px)',
                        padding: 'clamp(16px, 3vw, 32px)',
                        position: 'sticky', top: 88,
                    }}>
                        <h3 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 'clamp(22px, 4vw, 28px)', fontWeight: 800, marginBottom: 'clamp(20px, 4vw, 32px)' }}>Book Tickets</h3>

                        {/* Filters */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(16px, 3vw, 24px)', marginBottom: 'clamp(20px, 4vw, 32px)' }}>
                            {/* City */}
                            <div>
                                <label style={{ display: 'block', fontSize: 11, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--color-text-secondary, #a1a1aa)', marginBottom: '8px' }}>Select City</label>
                                <div style={{ position: 'relative' }}>
                                    <MapPin size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#ff8a00', pointerEvents: 'none' }} />
                                    <select
                                        value={selectedCity}
                                        onChange={(e) => setSelectedCity(e.target.value)}
                                        style={{
                                            width: '100%', minHeight: 48, padding: '14px 16px 14px 48px',
                                            backgroundColor: 'var(--color-bg-elevated, #18181b)',
                                            border: '1px solid var(--color-border, #27272a)',
                                            borderRadius: 'var(--radius-md, 10px)',
                                            color: 'var(--color-text-primary, #fafafa)', fontSize: 14,
                                            outline: 'none', appearance: 'none', cursor: 'pointer',
                                        }}
                                    >
                                        {cities.map(cityName => (
                                            <option key={cityName} value={cityName}>{cityName}</option>
                                        ))}
                                    </select>
                                    <ChevronRight size={18} style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%) rotate(90deg)', color: 'var(--color-text-secondary, #a1a1aa)', pointerEvents: 'none' }} />
                                </div>
                            </div>

                            {/* Date */}
                            <div>
                                <label style={{ display: 'block', fontSize: 11, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--color-text-secondary, #a1a1aa)', marginBottom: '8px' }}>Select Date</label>
                                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', flexWrap: 'wrap' }}>
                                    {scheduleDates.length === 0 ? (
                                        <div style={{ fontSize: 14, color: 'var(--color-text-secondary, #a1a1aa)', padding: '12px 0' }}>No dates available</div>
                                    ) : scheduleDates.map((date) => {
                                        const d = new Date(date);
                                        const isSelected = selectedDate === date;
                                        return (
                                            <button
                                                key={date}
                                                onClick={() => setSelectedDate(date)}
                                                style={{
                                                    flexShrink: 0, width: 'clamp(60px, 12vw, 72px)',
                                                    padding: 'clamp(8px, 1.5vw, 12px) 0',
                                                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                                                    borderRadius: 'var(--radius-md, 10px)', cursor: 'pointer', transition: 'all 0.3s ease',
                                                    backgroundColor: isSelected ? '#ff8a00' : 'var(--color-bg-elevated, #18181b)',
                                                    border: isSelected ? '1px solid #ff8a00' : '1px solid var(--color-border, #27272a)',
                                                    color: isSelected ? 'black' : 'var(--color-text-primary, #fafafa)',
                                                    boxShadow: isSelected ? '0 0 16px rgba(255,138,0,0.3)' : 'none',
                                                    fontFamily: "'Inter', sans-serif",
                                                }}
                                            >
                                                <span style={{ fontSize: 11, textTransform: 'uppercase', fontWeight: 700, opacity: isSelected ? 0.8 : 0.6 }}>{d.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                                                <span style={{ fontSize: 'clamp(18px, 3vw, 20px)', fontWeight: 800 }}>{d.getDate()}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Showtimes */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {loadingShowtimes ? (
                                <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--color-text-secondary, #a1a1aa)' }}>
                                    <Loader2 size={32} style={{ margin: '0 auto 16px', color: '#ff8a00', animation: 'spin 1s linear infinite' }} />
                                    <p>Searching for showtimes...</p>
                                </div>
                            ) : showtimes.length === 0 ? (
                                <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--color-text-secondary, #a1a1aa)' }}>
                                    <AlertCircle size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                                    <p>No showtimes found for this location and date.</p>
                                </div>
                            ) : (
                                showtimes.map((cinema, idx) => (
                                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(8px, 2vw, 12px)', borderBottom: '1px solid var(--color-border, #27272a)', paddingBottom: '12px', flexWrap: 'wrap' }}>
                                            <MapPin size={20} style={{ color: '#ff8a00', flexShrink: 0 }} />
                                            <h4 style={{ fontSize: 'clamp(15px, 2.5vw, 18px)', fontWeight: 700, margin: 0 }}>{cinema.cinemaName}</h4>
                                            <span style={{ fontSize: 'clamp(12px, 2vw, 13px)', color: 'var(--color-text-secondary, #a1a1aa)' }}>— {cinema.cinemaAddress}</span>
                                        </div>
                                        <div style={{ paddingLeft: 'clamp(16px, 4vw, 32px)' }}>
                                            <span style={{ display: 'block', fontSize: 11, textTransform: 'uppercase', fontWeight: 700, color: '#ff8a00', letterSpacing: '0.1em', marginBottom: '12px' }}>{cinema.movieFormatName}</span>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'clamp(8px, 2vw, 12px)' }}>
                                                {(cinema.scheduleTimesInfos || []).map((showtime) => (
                                                    <button
                                                        key={showtime.scheduleId}
                                                        onClick={() => navigate(`/booking/${showtime.scheduleId}`)}
                                                        className="interactive"
                                                        style={{
                                                            padding: 'clamp(8px, 1.5vw, 10px) clamp(14px, 3vw, 20px)',
                                                            borderRadius: 'var(--radius-sm, 6px)',
                                                            backgroundColor: 'var(--color-bg-elevated, #18181b)',
                                                            border: '1px solid #ff8a00',
                                                            color: '#ff8a00', fontWeight: 700,
                                                            fontSize: 'clamp(13px, 2vw, 14px)',
                                                            cursor: 'pointer', transition: 'all 0.3s ease',
                                                            minHeight: 44,
                                                        }}
                                                        onMouseEnter={e => {
                                                            e.currentTarget.style.backgroundColor = '#ff8a00';
                                                            e.currentTarget.style.color = 'black';
                                                            e.currentTarget.style.boxShadow = '0 0 16px rgba(255,183,127,0.4)';
                                                        }}
                                                        onMouseLeave={e => {
                                                            e.currentTarget.style.backgroundColor = 'var(--color-bg-elevated, #18181b)';
                                                            e.currentTarget.style.color = '#ff8a00';
                                                            e.currentTarget.style.boxShadow = 'none';
                                                        }}
                                                    >
                                                        {new Date(showtime.showTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MovieDetailPage;
