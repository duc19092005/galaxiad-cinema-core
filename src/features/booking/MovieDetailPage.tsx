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
            <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Loader2 size={48} style={{ color: 'var(--color-accent-primary)', animation: 'spin 1s linear infinite' }} />
            </div>
        );
    }

    if (error || !movie) {
        return (
            <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-bg-base)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-24)' }}>
                <AlertCircle size={64} style={{ color: '#ffb4ab', marginBottom: 'var(--space-16)' }} />
                <p style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 'var(--space-24)' }}>{error || 'Movie not found'}</p>
                <button className="btn-primary cta-glow" onClick={() => navigate('/home')}>Go Home</button>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-bg-base)', color: 'var(--color-text-primary)' }}>
            {/* Navbar Glass */}
            <nav style={{
                position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
                height: 72, padding: '0 var(--space-24)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                backgroundColor: isScrolled ? 'var(--color-surface)' : 'rgba(255,255,255,0.03)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                borderBottom: isScrolled ? '1px solid var(--color-border)' : '1px solid rgba(255,255,255,0.06)',
                transition: 'background-color 0.3s ease, border-color 0.3s ease'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-16)' }}>
                    <button 
                        onClick={() => navigate(-1)} 
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-glass)', border: '1px solid var(--color-border)', borderRadius: '50%', width: 40, height: 40, color: 'var(--color-text-primary)', cursor: 'pointer', transition: 'all 0.3s ease' }}
                        className="interactive"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div
                        onClick={() => navigate('/home')}
                        style={{
                            cursor: 'pointer',
                            fontFamily: "'Montserrat', sans-serif",
                            fontSize: '24px', fontWeight: 800,
                            letterSpacing: '-0.3px',
                            background: 'linear-gradient(135deg, #ffb77f, #ff8a00)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                        }}
                    >
                        CINEMA
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <div style={{ position: 'relative', height: '65vh', minHeight: 500, overflow: 'hidden' }}>
                <div style={{ position: 'absolute', inset: 0 }}>
                    <img
                        src={movie.moviePosterURL}
                        alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(20px) brightness(0.4)', transform: 'scale(1.1)' }}
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=500';
                        }}
                    />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, var(--color-bg-base) 0%, rgba(10,10,10,0.5) 60%, transparent 100%)' }} />
                </div>

                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-end' }}>
                    <div style={{ width: '100%', maxWidth: 1280, margin: '0 auto', padding: 'var(--space-24)', display: 'flex', gap: 'var(--space-32)', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                        {/* Poster Card */}
                        <div style={{
                            width: 240, flexShrink: 0,
                            borderRadius: 'var(--radius-lg)', overflow: 'hidden',
                            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            transform: 'translateY(var(--space-40))',
                            zIndex: 10
                        }}>
                            <img 
                                src={movie.moviePosterURL} 
                                alt={movie.movieName} 
                                style={{ width: '100%', height: 'auto', display: 'block' }}
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=500';
                                }}
                            />
                        </div>

                        {/* Basic Info */}
                        <div style={{ flex: 1, minWidth: 300, paddingBottom: 'var(--space-24)', zIndex: 10 }}>
                            <h1 style={{
                                fontFamily: "'Montserrat', sans-serif",
                                fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                                fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.02em',
                                color: 'white', marginBottom: 'var(--space-16)',
                                textShadow: '0 4px 12px rgba(0,0,0,0.5)'
                            }}>
                                {movie.movieName}
                            </h1>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-12)', fontSize: 14, fontWeight: 500, color: 'var(--color-text-primary)' }}>
                                <span className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 16px', borderRadius: 'var(--radius-full)' }}>
                                    <Clock size={16} style={{ color: 'var(--color-accent-primary)' }} /> {movie.movieDuration} mins
                                </span>
                                <span className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 16px', borderRadius: 'var(--radius-full)' }}>
                                    <Calendar size={16} style={{ color: 'var(--color-accent-primary)' }} /> {movie.releaseDate ? formatDate(movie.releaseDate) : 'Coming Soon'}
                                </span>
                                <span style={{ padding: '6px 16px', backgroundColor: 'var(--color-accent-cta)', color: 'black', borderRadius: 'var(--radius-full)', fontWeight: 700, fontSize: 13, boxShadow: '0 0 16px rgba(255,138,0,0.3)' }}>
                                    {movie.movieRequiredAge}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div style={{ width: '100%', maxWidth: 1280, margin: '0 auto', padding: 'calc(var(--space-40) + var(--space-40)) var(--space-24) var(--space-80)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-40)' }}>
                {/* Storyline & Details */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-32)' }}>
                    <div>
                        <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 'var(--space-12)', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Info size={20} style={{ color: 'var(--color-accent-primary)' }} /> Storyline
                        </h3>
                        <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>{movie.movieDescription}</p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-20)' }}>
                        <div>
                            <h4 style={{ fontSize: 11, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--color-accent-primary)', marginBottom: 'var(--space-4)' }}>Director</h4>
                            <p style={{ fontWeight: 600 }}>{movie.director || 'N/A'}</p>
                        </div>
                        <div>
                            <h4 style={{ fontSize: 11, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--color-accent-primary)', marginBottom: 'var(--space-4)' }}>Cast</h4>
                            <p style={{ fontWeight: 600 }}>{movie.actor || 'N/A'}</p>
                        </div>
                        <div>
                            <h4 style={{ fontSize: 11, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--color-accent-primary)', marginBottom: 'var(--space-8)' }}>Genres</h4>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-8)' }}>
                                {movie.movieCategoryInfos && movie.movieCategoryInfos.split(',').map(g => g.trim()).filter(Boolean).map((g: string, i: number) => (
                                    <span key={i} style={{ padding: '6px 12px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', fontSize: 12, fontWeight: 500 }}>
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
                            className="glass-card interactive"
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 'var(--space-16)', borderRadius: 'var(--radius-md)', fontWeight: 700, color: 'var(--color-text-primary)', textDecoration: 'none' }}
                        >
                            <Play size={20} style={{ color: 'var(--color-accent-cta)' }} /> Watch Trailer
                        </a>
                    )}
                </div>

                {/* Showtimes Booking */}
                <div style={{ gridColumn: 'span 2' }}>
                    <div style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-32)' }}>
                        <h3 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 28, fontWeight: 800, marginBottom: 'var(--space-32)' }}>Book Tickets</h3>

                        {/* Filters */}
                        <div style={{ display: 'flex', gap: 'var(--space-24)', marginBottom: 'var(--space-32)', flexWrap: 'wrap' }}>
                            <div style={{ flex: 1, minWidth: 200 }}>
                                <label style={{ display: 'block', fontSize: 11, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-8)' }}>Select City</label>
                                <div style={{ position: 'relative' }}>
                                    <MapPin size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-accent-primary)' }} />
                                    <select
                                        value={selectedCity}
                                        onChange={(e) => setSelectedCity(e.target.value)}
                                        style={{ width: '100%', padding: '14px 16px 14px 48px', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', color: 'var(--color-text-primary)', fontSize: 14, outline: 'none', appearance: 'none', cursor: 'pointer' }}
                                    >
                                        {cities.map(cityName => (
                                            <option key={cityName} value={cityName}>{cityName}</option>
                                        ))}
                                    </select>
                                    <ChevronRight size={18} style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%) rotate(90deg)', color: 'var(--color-text-secondary)', pointerEvents: 'none' }} />
                                </div>
                            </div>

                            <div style={{ flex: 2, minWidth: 300 }}>
                                <label style={{ display: 'block', fontSize: 11, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-8)' }}>Select Date</label>
                                <div style={{ display: 'flex', gap: 'var(--space-8)', overflowX: 'auto', paddingBottom: 'var(--space-8)' }}>
                                    {scheduleDates.length === 0 ? (
                                        <div style={{ fontSize: 14, color: 'var(--color-text-secondary)', padding: 'var(--space-12) 0' }}>No dates available</div>
                                    ) : scheduleDates.map((date) => {
                                        const d = new Date(date);
                                        const isSelected = selectedDate === date;
                                        return (
                                            <button
                                                key={date}
                                                onClick={() => setSelectedDate(date)}
                                                style={{
                                                    flexShrink: 0, width: 72, padding: 'var(--space-12) 0',
                                                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                                                    borderRadius: 'var(--radius-md)', cursor: 'pointer', transition: 'all 0.3s ease',
                                                    backgroundColor: isSelected ? 'var(--color-accent-cta)' : 'var(--color-surface)',
                                                    border: isSelected ? '1px solid var(--color-accent-cta)' : '1px solid var(--color-border)',
                                                    color: isSelected ? 'black' : 'var(--color-text-primary)',
                                                    boxShadow: isSelected ? '0 0 16px rgba(255,138,0,0.3)' : 'none'
                                                }}
                                            >
                                                <span style={{ fontSize: 11, textTransform: 'uppercase', fontWeight: 700, opacity: isSelected ? 0.8 : 0.6 }}>{d.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                                                <span style={{ fontSize: 20, fontWeight: 800 }}>{d.getDate()}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Showtimes List */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-24)' }}>
                            {loadingShowtimes ? (
                                <div style={{ padding: 'var(--space-40) 0', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                                    <Loader2 size={32} style={{ margin: '0 auto var(--space-16)', color: 'var(--color-accent-primary)', animation: 'spin 1s linear infinite' }} />
                                    <p>Searching for showtimes...</p>
                                </div>
                            ) : showtimes.length === 0 ? (
                                <div style={{ padding: 'var(--space-40) 0', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                                    <AlertCircle size={48} style={{ margin: '0 auto var(--space-16)', opacity: 0.5 }} />
                                    <p>No showtimes found for this location and date.</p>
                                </div>
                            ) : (
                                showtimes.map((cinema, idx) => (
                                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-16)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-12)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-12)' }}>
                                            <MapPin size={20} style={{ color: 'var(--color-accent-primary)' }} />
                                            <h4 style={{ fontSize: 18, fontWeight: 700 }}>{cinema.cinemaName}</h4>
                                            <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>— {cinema.cinemaAddress}</span>
                                        </div>
                                        <div style={{ paddingLeft: 'var(--space-32)' }}>
                                            <span style={{ display: 'block', fontSize: 11, textTransform: 'uppercase', fontWeight: 700, color: 'var(--color-accent-primary)', letterSpacing: '0.1em', marginBottom: 'var(--space-12)' }}>{cinema.movieFormatName}</span>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-12)' }}>
                                                {(cinema.scheduleTimesInfos || []).map((showtime) => (
                                                    <button
                                                        key={showtime.scheduleId}
                                                        onClick={() => navigate(`/booking/${showtime.scheduleId}`)}
                                                        className="interactive"
                                                        style={{
                                                            padding: '10px 20px', borderRadius: 'var(--radius-sm)',
                                                            backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-accent-primary)',
                                                            color: 'var(--color-accent-primary)', fontWeight: 700, fontSize: 14,
                                                            cursor: 'pointer', transition: 'all 0.3s ease'
                                                        }}
                                                        onMouseEnter={e => {
                                                            e.currentTarget.style.backgroundColor = 'var(--color-accent-primary)';
                                                            e.currentTarget.style.color = 'black';
                                                            e.currentTarget.style.boxShadow = '0 0 16px rgba(255,183,127,0.4)';
                                                        }}
                                                        onMouseLeave={e => {
                                                            e.currentTarget.style.backgroundColor = 'var(--color-surface)';
                                                            e.currentTarget.style.color = 'var(--color-accent-primary)';
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
