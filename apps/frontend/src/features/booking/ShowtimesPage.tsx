// src/features/booking/ShowtimesPage.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Film, MapPin, Search, Loader2, Sparkles, ChevronDown } from 'lucide-react';
import { publicApi } from '../../api/publicApi';
import type { ActiveCinema, ActiveMovie, SearchScheduleResult } from '../../types/public.types';
import Header from '../../components/Header';
import { showError } from '../../utils/ToastUtils';

interface CustomSelectProps {
  label: string;
  value: string;
  displayValue: string;
  options: { value: string; label: string }[];
  onChange: (val: string) => void;
  icon: React.ReactNode;
  disabled?: boolean;
}

const CustomSelect: React.FC<CustomSelectProps> = ({
  label,
  value,
  displayValue,
  options,
  onChange,
  icon,
  disabled,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (disabled) {
    return (
      <div
        style={{
          padding: '12px 16px',
          borderRadius: 8,
          backgroundColor: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.04)',
          color: 'var(--text-secondary)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          opacity: 0.5,
          cursor: 'not-allowed',
        }}
      >
        <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4, display: 'flex', alignItems: 'center', gap: '6px' }}>
          {icon} {label}
        </span>
        <span style={{ fontSize: '14px' }}>Loading...</span>
      </div>
    );
  }

  return (
    <div
      ref={dropdownRef}
      style={{
        position: 'relative',
        padding: '12px 16px',
        borderRadius: 8,
        backgroundColor: 'rgba(0,0,0,0.3)',
        border: '1px solid rgba(255,255,255,0.08)',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        transition: 'all 0.3s ease',
      }}
      className="hover:border-primary-soft"
      onClick={() => setIsOpen(!isOpen)}
    >
      <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4, display: 'flex', alignItems: 'center', gap: '6px' }}>
        {icon} {label}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        <span style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '90%' }}>
          {displayValue}
        </span>
        <ChevronDown size={16} style={{ color: 'rgba(255,255,255,0.4)', transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
      </div>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: 8,
            backgroundColor: '#18181b',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8,
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)',
            zIndex: 50,
            maxHeight: 250,
            overflowY: 'auto',
          }}
          className="scrollbar-thin"
        >
          {options.map((opt) => (
            <div
              key={opt.value}
              onClick={(e) => {
                e.stopPropagation();
                onChange(opt.value);
                setIsOpen(false);
              }}
              style={{
                padding: '10px 16px',
                fontSize: 13,
                color: opt.value === value ? 'var(--primary, #ff8a00)' : 'rgba(255,255,255,0.8)',
                backgroundColor: opt.value === value ? 'rgba(255,138,0,0.1)' : 'transparent',
                fontWeight: opt.value === value ? 600 : 400,
                transition: 'background-color 0.15s, color 0.15s',
              }}
              className="hover:bg-white/5 hover:text-white"
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const ShowtimesPage: React.FC = () => {
  const navigate = useNavigate();

  // Read initial parameters from URL or localStorage to prevent race conditions on mount
  const getInitialParams = () => {
    const params = new URLSearchParams(window.location.search);
    const qDate = params.get('date');
    const qMovie = params.get('movie');
    const qCinema = params.get('cinema');

    let initialCinema = 'All';
    if (qCinema) {
      initialCinema = qCinema;
    } else {
      const stored = localStorage.getItem('user_selected_cinema');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed.cinemaId) {
            initialCinema = parsed.cinemaId;
          }
        } catch {
          // ignore
        }
      }
    }

    return {
      date: qDate || '',
      movie: qMovie || 'All',
      cinema: initialCinema,
    };
  };

  const initialParams = getInitialParams();

  // Filter States
  const [selectedDate, setSelectedDate] = useState<string>(initialParams.date);
  const [selectedCinemaId, setSelectedCinemaId] = useState<string>(initialParams.cinema);
  const [selectedMovieId, setSelectedMovieId] = useState<string>(initialParams.movie);

  // Master Data
  const [cinemas, setCinemas] = useState<ActiveCinema[]>([]);
  const [movies, setMovies] = useState<ActiveMovie[]>([]);
  const [scheduleResults, setScheduleResults] = useState<SearchScheduleResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  // Generate next 7 days for the quick horizontal picker
  const [dateList, setDateList] = useState<{ label: string; value: string; dayName: string }[]>([]);
  const [availableDates, setAvailableDates] = useState<string[]>([]);

  // Fetch available dates from API & generate date list
  useEffect(() => {
    let active = true;
    const fetchAndGenerateDates = async () => {
      try {
        const res = await publicApi.getUpcomingDates({
          cinemaId: selectedCinemaId !== 'All' ? selectedCinemaId : undefined
        });
        if (!active) return;
        const availableFromApi: string[] = res.isSuccess ? (res.data || []) : [];
        setAvailableDates(availableFromApi);
      } catch (err) {
        console.error('Error fetching upcoming dates:', err);
        if (active) {
          setAvailableDates([]);
        }
      }
    };
    fetchAndGenerateDates();
    return () => {
      active = false;
    };
  }, [selectedCinemaId]);

  // Generate date list from available dates (max 7 days ahead)
  useEffect(() => {
    const dates: { label: string; value: string; dayName: string }[] = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(today.getDate() + i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const dateVal = String(d.getDate()).padStart(2, '0');
      const valueStr = `${year}-${month}-${dateVal}`;
      
      let dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      if (i === 0) dayName = 'Today';
      
      dates.push({
        label: `${d.getDate()}/${d.getMonth() + 1}`,
        value: valueStr,
        dayName,
      });
    }

    // Filter to only keep dates that exist in availableDates
    const filteredDates = dates.filter(d => availableDates.includes(d.value));
    
    const finalDates = filteredDates;
    
    setDateList(finalDates);
    if (finalDates.length > 0) {
      setSelectedDate(finalDates[0].value);
    } else {
      setSelectedDate('');
      setScheduleResults([]);
    }
  }, [availableDates]);

  // Fetch filter master data on mount
  useEffect(() => {
    const fetchMasterData = async () => {
      setDataLoading(true);
      try {
        const [cinemaRes, movieRes] = await Promise.all([
          publicApi.getActiveCinemas(),
          publicApi.getActiveMovies(),
        ]);
        if (cinemaRes.isSuccess) setCinemas(cinemaRes.data || []);
        if (movieRes.isSuccess) setMovies(movieRes.data || []);
      } catch (err) {
        console.error(err);
        showError('Error loading filter options.');
      } finally {
        setDataLoading(false);
      }
    };
    fetchMasterData();

    // Check if user pre-selected a cinema in proximity selector
    const checkPreselectedCinema = () => {
      // If cinema is in the URL, do not overwrite it with stored cinema
      const params = new URLSearchParams(window.location.search);
      if (params.get('cinema')) return;

      const stored = localStorage.getItem('user_selected_cinema');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed.cinemaId) {
            setSelectedCinemaId(parsed.cinemaId);
          }
        } catch {
          // ignore
        }
      }
    };
    checkPreselectedCinema();
    window.addEventListener('user_selected_cinema_changed', checkPreselectedCinema);
    return () => window.removeEventListener('user_selected_cinema_changed', checkPreselectedCinema);
  }, []);

  // Fetch schedules when filters change
  useEffect(() => {
    if (!selectedDate) return;
    let active = true;
    const fetchSchedules = async () => {
      setLoading(true);
      try {
        const res = await publicApi.searchSchedules(
          selectedDate,
          selectedMovieId === 'All' ? undefined : selectedMovieId,
          selectedCinemaId === 'All' ? undefined : selectedCinemaId
        );
        if (!active) return;
        if (res.isSuccess) {
          setScheduleResults(res.data || []);
        } else {
          showError('Failed to fetch schedules.');
        }
      } catch (err) {
        console.error(err);
        if (active) {
          showError('Error loading schedules.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    fetchSchedules();
    return () => {
      active = false;
    };
  }, [selectedDate, selectedCinemaId, selectedMovieId]);

  const formatTime = (timeStr: string) => {
    try {
      const date = new Date(timeStr);
      return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
    } catch {
      return timeStr;
    }
  };

  // Cinema options list
  const cinemaOptions = [
    { value: 'All', label: 'All Theaters' },
    ...cinemas.map((c) => ({ value: c.cinemaId, label: c.cinemaName })),
  ];
  const selectedCinemaLabel = cinemas.find((c) => c.cinemaId === selectedCinemaId)?.cinemaName || 'All Theaters';

  // Movie options list
  const movieOptions = [
    { value: 'All', label: 'All Movies' },
    ...movies.map((m) => ({ value: m.movieId, label: m.movieName })),
  ];
  const selectedMovieLabel = movies.find((m) => m.movieId === selectedMovieId)?.movieName || 'All Movies';

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)', overflowX: 'hidden' }}>
      <Header />
      
      <main style={{ paddingTop: '100px', paddingBottom: '60px', maxWidth: '1200px', margin: '0 auto', paddingLeft: '24px', paddingRight: '24px' }}>
        
        {/* Title */}
        <div style={{ marginBottom: '40px', textAlign: 'center' }}>
          <span style={{
            fontSize: '12px',
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            color: 'var(--primary, #ff8a00)',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            marginBottom: '8px'
          }}>
            <Sparkles size={14} /> Showtime Calendar
          </span>
          <h1 style={{ fontSize: '36px', fontWeight: 900, margin: 0, letterSpacing: '-0.02em' }}>
            Book Your Session
          </h1>
        </div>

        {/* Date Selector (Horizontal Glass Slider) */}
        <div 
          className="glass-card" 
          style={{ 
            display: 'flex', 
            gap: '12px', 
            padding: '16px', 
            borderRadius: 'var(--radius-xl)', 
            overflowX: 'auto',
            marginBottom: '32px',
            border: '1px solid rgba(255,255,255,0.06)'
          }}
        >
          {dateList.map((date) => {
            const isSelected = selectedDate === date.value;
            return (
              <button
                key={date.value}
                onClick={() => setSelectedDate(date.value)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '85px',
                  padding: '12px 8px',
                  borderRadius: 'var(--radius-md, 10px)',
                  background: isSelected ? 'linear-gradient(135deg, var(--primary, #ff8a00), #e17600)' : 'rgba(255,255,255,0.02)',
                  border: isSelected ? 'none' : '1px solid rgba(255,255,255,0.04)',
                  color: isSelected ? 'black' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: isSelected ? '0 8px 20px rgba(255,138,0,0.25)' : 'none',
                }}
                onMouseOver={(e) => {
                  if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                }}
                onMouseOut={(e) => {
                  if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                }}
              >
                <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', opacity: 0.8, marginBottom: '4px' }}>
                  {date.dayName}
                </span>
                <span style={{ fontSize: '18px', fontWeight: 800 }}>
                  {date.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Filters Panel */}
        <div 
          className="glass-card" 
          style={{ 
            position: 'relative',
            zIndex: 30,
            padding: '20px', 
            borderRadius: 'var(--radius-lg)', 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '20px', 
            marginBottom: '40px',
            border: '1px solid rgba(255,255,255,0.06)'
          }}
        >
          {/* Cinema Filter */}
          <CustomSelect
            label="Select Theater"
            value={selectedCinemaId}
            displayValue={selectedCinemaLabel}
            options={cinemaOptions}
            onChange={setSelectedCinemaId}
            icon={<MapPin size={14} style={{ color: 'var(--primary)' }} />}
            disabled={dataLoading}
          />

          {/* Movie Filter */}
          <CustomSelect
            label="Select Movie"
            value={selectedMovieId}
            displayValue={selectedMovieLabel}
            options={movieOptions}
            onChange={setSelectedMovieId}
            icon={<Film size={14} style={{ color: 'var(--primary)' }} />}
            disabled={dataLoading}
          />
        </div>

        {/* Schedule Display */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
            <Loader2 size={40} className="animate-spin" style={{ color: 'var(--primary)', animation: 'spin 1s linear infinite', marginBottom: '16px' }} />
            <span style={{ color: 'var(--text-secondary)' }}>Finding available showtimes...</span>
          </div>
        ) : scheduleResults.length === 0 ? (
          <div className="glass-card" style={{ padding: '60px', textAlign: 'center', borderRadius: 'var(--radius-xl)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <Search size={48} style={{ color: 'var(--text-secondary)', opacity: 0.2, margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>No Showtimes Found</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '400px', margin: '0 auto' }}>
              We couldn't find any scheduled sessions for the selected criteria. Try changing the date or theater filters.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            {scheduleResults.map((result) => (
              <div 
                key={result.movieId} 
                className="glass-card" 
                style={{ 
                  padding: '24px', 
                  borderRadius: 'var(--radius-xl)', 
                  border: '1px solid rgba(255,255,255,0.05)',
                  background: 'rgba(18, 18, 20, 0.4)'
                }}
              >
                {/* Movie Header Info */}
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '20px' }}>
                  <div style={{ width: '80px', height: '110px', borderRadius: 'var(--radius-md)', overflow: 'hidden', flexShrink: 0, boxShadow: 'var(--shadow-md)' }}>
                    <img 
                      src={result.movieImageUrl || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=500'} 
                      alt={result.movieName}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=500' }}
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '8px' }}>
                      <h2 style={{ fontSize: '22px', fontWeight: 800, margin: 0 }}>{result.movieName}</h2>
                      <span style={{
                        background: 'rgba(255,138,0,0.15)',
                        color: 'var(--primary, #ff8a00)',
                        fontSize: '10px',
                        fontWeight: 800,
                        padding: '3px 8px',
                        borderRadius: '4px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>
                        {result.movieRequiredAgeSymbol || 'T16'}
                      </span>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                        {result.movieDuration} mins
                      </span>
                    </div>
                    
                    <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '0 0 12px 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {result.movieDescription}
                    </p>

                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {result.movieGenres?.map((g) => (
                        <span key={g} style={{ fontSize: '11px', background: 'rgba(255,255,255,0.04)', padding: '2px 8px', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)' }}>
                          {g}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Cinemas and Showtimes list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {result.cinemas.map((cinema) => (
                    <div key={cinema.cinemaId} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <MapPin size={14} style={{ color: 'var(--primary)' }} />
                        <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {cinema.cinemaName}
                        </span>
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          ({cinema.cinemaLocation})
                        </span>
                      </div>

                      {/* Format blocks */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingLeft: '20px' }}>
                        {cinema.formatShowtimes.map((format) => (
                          <div key={format.formatId} style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', flexWrap: 'wrap' }}>
                            <div style={{
                              padding: '4px 10px',
                              background: 'rgba(255,255,255,0.06)',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: 800,
                              color: 'var(--text-secondary)',
                              marginTop: '4px',
                              textTransform: 'uppercase'
                            }}>
                              {format.formatName}
                            </div>
                            
                            {/* Showtime bubbles */}
                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', flex: 1 }}>
                              {format.showtimes.map((showtime) => (
                                <button
                                  key={showtime.scheduleId}
                                  onClick={() => navigate(`/booking/${showtime.scheduleId}`)}
                                  style={{
                                    padding: '8px 16px',
                                    borderRadius: 'var(--radius-sm, 6px)',
                                    background: 'rgba(255,255,255,0.03)',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    color: 'var(--text-primary)',
                                    fontWeight: 700,
                                    fontSize: '13px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                  }}
                                  onMouseOver={(e) => {
                                    e.currentTarget.style.background = 'var(--primary-soft)';
                                    e.currentTarget.style.borderColor = 'var(--primary)';
                                    e.currentTarget.style.color = 'var(--primary)';
                                  }}
                                  onMouseOut={(e) => {
                                    e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                                    e.currentTarget.style.color = 'var(--text-primary)';
                                  }}
                                >
                                  {formatTime(showtime.startTime)}
                                  <div style={{ fontSize: '9px', fontWeight: 400, opacity: 0.6, marginTop: '2px' }}>
                                    Room {showtime.auditoriumNumber}
                                  </div>
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
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
