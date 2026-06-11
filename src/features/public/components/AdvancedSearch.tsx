// src/features/public/components/AdvancedSearch.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Film, MapPin, Search, Clock, MapPinned, Info } from 'lucide-react';
import { publicApi } from '../../../api/publicApi';
import type { ActiveCinema, ActiveMovie, SearchScheduleResult } from '../../../types/public.types';
import { useTranslation } from 'react-i18next';
import { showError } from '../../../utils/ToastUtils';

const AdvancedSearch: React.FC = () => {
  const { t } = useTranslation();
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
      if (res.data?.length === 0) showError(t('toast.noShowtimesFound'));
    } catch {
      showError(t('toast.searchError'));
    } finally { setLoading(false); }
  };

  const handleTimeClick = (scheduleId: string) => navigate(`/booking/${scheduleId}`);

  return (
    <div style={{ width: '100%', maxWidth: 1200, margin: '0 auto', marginBottom: 'var(--space-16)', padding: '0 clamp(4px, 2vw, 16px)' }}>
      {/* Search form - responsive grid */}
      <div className="card" style={{
        padding: 0, overflow: 'hidden',
        boxShadow: 'var(--shadow-lg)',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
        }}
          className="sm:grid-cols-2 lg:grid-cols-4"
        >
          {/* Date */}
          <div className="input-wrapper lg:border-b-0" style={{
            padding: 'clamp(12px, 2vw, 20px)',
            borderRight: '1px solid var(--border)',
            borderBottom: '1px solid var(--border)',
          }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
              <Calendar size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              <span className="text-muted" style={{ fontSize: 'var(--text-xs)', letterSpacing: '0.3px' }}>1. {t('Date')}</span>
            </div>
            <select
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="input"
              style={{ width: '100%', border: 'none', padding: '8px 0', height: 'auto', backgroundColor: 'transparent', fontSize: 'var(--text-sm)', minHeight: 44 }}
            >
              {dateOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Movie */}
          <div className="lg:border-b-0" style={{
            padding: 'clamp(12px, 2vw, 20px)',
            borderRight: '1px solid var(--border)',
            borderBottom: '1px solid var(--border)',
          }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
              <Film size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              <span className="text-muted" style={{ fontSize: 'var(--text-xs)', letterSpacing: '0.3px' }}>2. {t('Movie')}</span>
            </div>
            <select
              value={selectedMovieId}
              onChange={e => setSelectedMovieId(e.target.value)}
              className="input"
              style={{ width: '100%', border: 'none', padding: '8px 0', height: 'auto', backgroundColor: 'transparent', fontSize: 'var(--text-sm)', minHeight: 44 }}
            >
              <option value="">{t('All Movies')}</option>
              {activeMovies?.map(m => (
                <option key={m.movieId} value={m.movieId}>{m.movieName}</option>
              ))}
            </select>
          </div>

          {/* Cinema */}
          <div className="sm:border-b-0 lg:border-r-0" style={{
            padding: 'clamp(12px, 2vw, 20px)',
            borderRight: '1px solid var(--border)',
            borderBottom: '1px solid var(--border)',
          }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
              <MapPin size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              <span className="text-muted" style={{ fontSize: 'var(--text-xs)', letterSpacing: '0.3px' }}>3. {t('Cinema')}</span>
            </div>
            <select
              value={selectedCinemaId}
              onChange={e => setSelectedCinemaId(e.target.value)}
              className="input"
              style={{ width: '100%', border: 'none', padding: '8px 0', height: 'auto', backgroundColor: 'transparent', fontSize: 'var(--text-sm)', minHeight: 44 }}
            >
              <option value="">{t('All Cinemas')}</option>
              {activeCinemas?.map(c => (
                <option key={c.cinemaId} value={c.cinemaId}>{c.cinemaName}</option>
              ))}
            </select>
          </div>

          {/* Search button */}
          <button
            onClick={handleSearch}
            disabled={loading}
            className="btn btn-primary"
            style={{
              borderRadius: 0,
              fontSize: 'var(--text-sm)',
              letterSpacing: '0.3px',
              height: '100%',
              minHeight: 'clamp(56px, 15vw, 80px)',
              whiteSpace: 'nowrap',
            }}
          >
            {loading ? <Clock size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Search size={16} />}
            {t('Search Now')}
          </button>
        </div>
      </div>

      {/* Results */}
      {isSearching && (
        <div style={{ marginTop: 'var(--space-8)' }}>
          {loading ? (
            <div className="state-center" style={{ minHeight: 200 }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                border: '3px solid var(--bg-elevated)',
                borderTopColor: 'var(--accent)',
                animation: 'spin 0.8s linear infinite',
              }} />
              <span className="text-muted" style={{ fontSize: 'var(--text-xs)', letterSpacing: '0.5em', textTransform: 'uppercase' }}>
                {t('Finding Your Magic...')}
              </span>
            </div>
          ) : searchResults && searchResults.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
              {searchResults.map(movie => (
                <div key={movie.movieId} className="card card-hover" style={{ padding: 'clamp(16px, 3vw, 24px)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
                    {/* Movie header - responsive */}
                    <div style={{ display: 'flex', gap: 'clamp(12px, 3vw, 24px)', flexWrap: 'wrap' }}>
                      <div style={{ width: 'clamp(80px, 20vw, 120px)', flexShrink: 0 }}>
                        <img
                          src={movie.movieImageUrl}
                          alt={movie.movieName}
                          onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=500'; }}
                          style={{ width: '100%', aspectRatio: '2/3', objectFit: 'cover', borderRadius: 'var(--radius-md)', display: 'block' }}
                        />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 className="heading-lg section-header" style={{ marginTop: 0, fontSize: 'clamp(16px, 3vw, 20px)', overflowWrap: 'break-word' }}>{movie.movieName}</h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', marginTop: 'var(--space-3)' }}>
                          {(movie.movieGenres || []).map((g: string) => (
                            <span key={g} className="badge badge-neutral">{g}</span>
                          ))}
                          {movie.movieRequiredAgeSymbol && (
                            <span className="badge badge-accent">{movie.movieRequiredAgeSymbol}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Cinemas */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
                      {movie.cinemas?.map((cinema, cIdx) => (
                        <div key={cIdx}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
                            <MapPinned size={16} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                            <div style={{ minWidth: 0 }}>
                              <p style={{ fontWeight: 500, fontSize: 'var(--text-sm)', overflowWrap: 'break-word' }}>{cinema.cinemaName}</p>
                              <p className="text-muted" style={{ fontSize: 'var(--text-xs)', overflowWrap: 'break-word' }}>{cinema.cinemaLocation}</p>
                            </div>
                          </div>

                          <div style={{ paddingLeft: 'clamp(16px, 4vw, 32px)' }}>
                            {cinema.formatShowtimes?.map((format, fIdx) => (
                              <div key={fIdx} style={{ marginBottom: 'var(--space-5)' }}>
                                <div style={{
                                  display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
                                  marginBottom: 'var(--space-3)',
                                }}>
                                  <span className="badge badge-accent" style={{ fontSize: 'var(--text-xs)', letterSpacing: '0.2em' }}>
                                    {format.formatName}
                                  </span>
                                  <div style={{ flex: 1, height: 1, backgroundColor: 'var(--border)' }} />
                                </div>
                                <div style={{
                                  display: 'grid',
                                  gridTemplateColumns: 'repeat(auto-fill, minmax(clamp(70px, 15vw, 80px), 1fr))',
                                  gap: 'var(--space-2)',
                                }}>
                                  {format.showtimes?.map(st => (
                                    <button
                                      key={st.scheduleId}
                                      onClick={() => handleTimeClick(st.scheduleId)}
                                      className="btn btn-secondary"
                                      style={{
                                        flexDirection: 'column',
                                        padding: 'var(--space-2)',
                                        gap: 0,
                                        height: 'auto',
                                        fontSize: 'var(--text-sm)',
                                        minHeight: 44,
                                        width: '100%',
                                      }}
                                    >
                                      <span style={{ fontWeight: 500 }}>
                                        {new Date(st.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                      <span className="text-muted" style={{ fontSize: '10px' }}>
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
            <div className="state-center" style={{ minHeight: 200 }}>
              <Info size={40} style={{ color: 'var(--text-muted)', opacity: 0.3 }} />
              <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 500, color: 'var(--text-secondary)' }}>
                {t('No showtimes found')}
              </h3>
              <p className="text-muted" style={{ fontSize: 'var(--text-sm)', maxWidth: 320 }}>
                {t('Try adjusting your filters to find more options for your cinematic journey.')}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdvancedSearch;
