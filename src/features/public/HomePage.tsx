// src/features/public/HomePage.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronDown, AlertCircle, Loader2,
  Sparkles, Play, Ticket,
  Search,
} from 'lucide-react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { publicApi } from '../../api/publicApi';
import type { ApiErrorResponse } from '../../types/auth.types';
import type { PublicMovieListItem, ActiveCinema, ActiveMovie } from '../../types/public.types';
import { useTranslation } from 'react-i18next';
import Header from '../../components/Header';


const IMG_BASE = 'https://lh3.googleusercontent.com/aida-public/';

const HERO_IMG = IMG_BASE + 'AB6AXuBb-6tDUgXoRgmgTRBXwngoVTj0smOmB_NZPmcLz1kiOTfMsZE0q1zTRpwjaDJODAErtBJ69LZgGfxSCF235D75zmh3x90AFKmA4E50fgujmCJDv_krUSKoqOXBtr_0Z6tQHY2yYzlnyzvt3W84u1BzPRod5sWHQqooJXYQDH3li2GMZsqPNhuYHBa0rR_CYURrjmM2OHScCUYex2_0lm6k-PzDwfgVk2s3Wd8hToSbNZvc0g_kD8RZzigLOWt0bPO0hif73yxHvNs';

const TRENDING_IMGS = [
  IMG_BASE + 'AB6AXuBsKQqKZqwwk8ExH3xxxIZVnMwZboVJ3uYny_qRLjMKINARFOmHWOXN0Th5Odn5uBeMX5z2kczB6DNJokbGlkQD7jmwrw5Urtj1iiaVa0l2qCB60o4wdqVo5I8b5Pw7qn-sU8WjuniuA1joA23jUKCX-zS4VDQprajtfxqVo6DnN_DdCUHtRG7vDcYp2U7aJKtHVg9Y8jof0PoJDBp0Ecq0eq9gGGdc0eQgMLWuYQSditLzPaagM1UtH5qAwvriO2EM0hWM-hmV3WY',
  IMG_BASE + 'AB6AXuDAqs9Gw6k0ILUJlRA0qtwYbOLLQIp55LncUHiNZpPvIOPQv4roM3E9g8w_wfZHLoSzEdXbADEnmlmeSOdSPH7F5KLeh9cLlA23F6_mpcqjokMV1ddbzCZe_7x_ejTabsoAlFFz4b_QYjxUidsVKafLW5NsmV5-1KYb6P9LzuAALYbT-Z2KMv2UVKUiRIZv7qLWRxou8svln_vJOg_hc14zBmcUCQZPnYOSKYeeAAmi1sGFZcx3sr0XJWl2E0iTgYwYkhy6XHRg5Oc',
  IMG_BASE + 'AB6AXuByZJ095eJoAbV3swmdF9iL9A0JHsJ5cSgcUbOeDqhHKpHR_YciZ0Ym-8F70L8bK82K8Yl5Wr2a4LehNOLuU0KmnFwTOtG6xHNBjnDTcO9Gp0c5MrPAIsUDs-T0loTDc2vBX4AKnrsslq9HOb_l_waWOdhkVHrBCv8TivxdP9HI8aTB5cxrljw6Pt0lQv6slreXWh29ABpi1I2W7JzUQ-Ki-EPeLh1lHrsLjuxVGDl7blnb584Eoh5KfqrtU-PmV6w8hxCjysAW3Ko',
];

const TRENDING_DATA = [
  { title: 'Techno World', desc: 'In a future where reality is digital, one glitch could redefine humanity forever.' },
  { title: 'Void Seekers', desc: 'The edge of the universe is just the beginning of the journey home.' },
  { title: 'Dawn of Embers', desc: 'A historical epic of survival and legacy in a world on the brink of change.' },
];

const PLACEHOLDER_POSTER = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=500';

interface CustomSelectProps {
  step: string;
  label: string;
  value: string;
  displayValue: string;
  options: { value: string; label: string }[];
  onChange: (val: string) => void;
  borderLeft?: boolean;
}

const CustomSelect: React.FC<CustomSelectProps> = ({
  step,
  label,
  value,
  displayValue,
  options,
  onChange,
  borderLeft,
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

  return (
    <div
      ref={dropdownRef}
      style={{
        position: 'relative',
        padding: '12px 16px',
        borderRadius: 12,
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        transition: 'background-color 0.2s ease',
      }}
      className={`hover:bg-white/5 ${borderLeft ? 'md:border-l md:border-white/10' : ''}`}
      onClick={() => setIsOpen(!isOpen)}
    >
      <span style={{ fontSize: 10, color: 'var(--accent, #ff8a00)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
        {step}. {label}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        <span style={{ fontWeight: 500, color: 'white', fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '90%' }}>
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
            borderRadius: 12,
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
                color: opt.value === value ? 'var(--accent, #ff8a00)' : 'rgba(255,255,255,0.8)',
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

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [nowShowing, setNowShowing] = useState<PublicMovieListItem[]>([]);
  const [comingSoon, setComingSoon] = useState<PublicMovieListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // City select sync state
  const [selectedCity, setSelectedCity] = useState<string>(() => localStorage.getItem('user_selected_city') || '');

  // Quick Booking states
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedMovieId, setSelectedMovieId] = useState<string>('All');
  const [selectedCinemaId, setSelectedCinemaId] = useState<string>('All');
  const [cinemas, setCinemas] = useState<ActiveCinema[]>([]);
  const [movies, setMovies] = useState<ActiveMovie[]>([]);
  const [dateList, setDateList] = useState<{ label: string; value: string; dayName: string }[]>([]);

  useEffect(() => {
    const handleCityChange = () => {
      setSelectedCity(localStorage.getItem('user_selected_city') || '');
    };
    window.addEventListener('user_selected_city_changed', handleCityChange);
    return () => window.removeEventListener('user_selected_city_changed', handleCityChange);
  }, []);

  useEffect(() => {
    // Generate dates
    const dates = [];
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
    setDateList(dates);
    setSelectedDate(dates[0].value);

    // Fetch master data for booking bar
    const fetchMasterData = async () => {
      try {
        const [cinemaRes, movieRes] = await Promise.all([
          publicApi.getActiveCinemas(),
          publicApi.getActiveMovies(),
        ]);
        if (cinemaRes.isSuccess) setCinemas(cinemaRes.data || []);
        if (movieRes.isSuccess) setMovies(movieRes.data || []);
      } catch (err) {
        console.error('Error fetching master data for booking bar:', err);
      }
    };
    fetchMasterData();
  }, []);

  useEffect(() => {
    fetchMovies();
  }, [selectedCity]);

  const fetchMovies = async () => {
    setLoading(true); setError(null);
    try {
      const response = await publicApi.getAllMovies({ city: selectedCity || undefined, pageSize: 20 });
      const items = response.data || [];
      setNowShowing(items.filter(m => !m.isCommingSoon));
      setComingSoon(items.filter(m => m.isCommingSoon));
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        const data = err.response.data as ApiErrorResponse;
        if (data.statusCode === 401) {
          localStorage.removeItem('user_info');
          Cookies.remove('X-Access-Token');
          navigate('/login');
          return;
        }
        setError(data.message || 'Cannot load movies list.');
      } else { setError('Cannot connect to server.'); }
    } finally { setLoading(false); }
  };

  // 1. Date options
  const dateOptions = dateList.map((d) => ({
    value: d.value,
    label: `${d.label} (${d.dayName === 'Today' ? t('home.today', 'Today') : d.dayName})`,
  }));
  const selectedDateOption = dateList.find((d) => d.value === selectedDate);
  const selectedDateLabel = selectedDateOption
    ? `${selectedDateOption.label} (${selectedDateOption.dayName === 'Today' ? t('home.today', 'Today') : selectedDateOption.dayName})`
    : '';

  // 2. Movie options
  const movieOptions = [
    { value: 'All', label: t('home.allMovies', 'All Movies') },
    ...movies.map((m) => ({ value: m.movieId, label: m.movieName })),
  ];
  const selectedMovieLabel = movies.find((m) => m.movieId === selectedMovieId)?.movieName || t('home.allMovies', 'All Movies');

  // 3. Cinema options
  const cinemaOptions = [
    { value: 'All', label: t('home.allCinemas', 'All Cinemas') },
    ...cinemas.map((c) => ({ value: c.cinemaId, label: c.cinemaName })),
  ];
  const selectedCinemaLabel = cinemas.find((c) => c.cinemaId === selectedCinemaId)?.cinemaName || t('home.allCinemas', 'All Cinemas');

  return (
    <>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)', overflowX: 'hidden' }}>

      {/* Redesigned Unified Header */}
      <Header />



      {/* ===== HERO SECTION ===== */}
      <section style={{
        position: 'relative', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        paddingTop: 80, paddingLeft: 'clamp(12px, 4vw, 24px)',
        paddingRight: 'clamp(12px, 4vw, 24px)',
        minHeight: 'min(600px, 90vh)',
        overflow: 'visible'
      }}>
        <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
          <img alt="Cinema theater" src={HERO_IMG} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.3)' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, var(--bg-base) 0%, rgba(5,20,36,0.4) 40%, rgba(5,20,36,0.8) 100%)' }} />
        </div>
        <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', width: '100%', maxWidth: 900, margin: '0 auto', paddingTop: 'clamp(24px, 6vw, 60px)' }}>
          <span style={{ fontSize: 'clamp(10px, 2vw, 11px)', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--accent)', fontWeight: 700, display: 'block', marginBottom: 'clamp(12px, 3vw, 24px)' }}>
            {t('home.experienceBadge')}
          </span>
          <h1 style={{
            fontFamily: "'Montserrat', sans-serif",
            fontSize: 'clamp(1.75rem, 8vw, 4rem)',
            fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.02em',
            color: 'white', maxWidth: '100%', overflowWrap: 'break-word',
            margin: '0 auto',
          }}>
            {t('home.cinematic')}<br />
            <span style={{ color: 'var(--accent)' }}>{t('home.adventure')}</span>
          </h1>
          <p style={{
            fontSize: 'clamp(14px, 2.5vw, 16px)',
            lineHeight: 1.7, color: 'rgba(255,255,255,0.65)',
            maxWidth: 600, margin: 'clamp(12px, 3vw, 24px) auto',
            padding: '0 8px', overflowWrap: 'break-word',
          }}>
            {t('home.heroDesc')}
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 'clamp(8px, 2vw, 16px)', flexWrap: 'wrap', flexDirection: 'row' }}>
            <button className="btn-primary cta-glow" style={{
              padding: 'clamp(12px, 2vw, 16px) clamp(24px, 4vw, 40px)',
              fontWeight: 700, fontSize: 'clamp(13px, 2vw, 14px)',
              whiteSpace: 'nowrap', minHeight: 48,
            }}>
              {t('home.exploreNow')}
            </button>
            <button className="glass-card" style={{
              padding: 'clamp(12px, 2vw, 16px) clamp(24px, 4vw, 40px)',
              color: 'white', fontWeight: 700, fontSize: 'clamp(13px, 2vw, 14px)',
              border: 'none', borderRadius: 16, cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 8,
              transition: 'all 0.3s ease', background: 'rgba(255,255,255,0.05)',
              whiteSpace: 'nowrap', minHeight: 48,
            }}>
              <Play size={16} fill="white" /> {t('home.watchTrailer')}
            </button>
          </div>
        </div>

        {/* Quick Booking Bar */}
        <div style={{
          position: 'relative', zIndex: 20, width: '100%',
          maxWidth: 1000, marginTop: 'clamp(32px, 6vw, 64px)',
          paddingLeft: 'clamp(8px, 2vw, 20px)',
          paddingRight: 'clamp(8px, 2vw, 20px)',
        }}>
          <div className="glass-card" style={{ padding: 8, borderRadius: 16 }}>
            <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_180px] gap-2 items-stretch">
              
              {/* 1. Date Selector */}
              <CustomSelect
                step="1"
                label={t('home.date')}
                value={selectedDate}
                displayValue={selectedDateLabel}
                options={dateOptions}
                onChange={setSelectedDate}
              />

              {/* 2. Movie Selector */}
              <CustomSelect
                step="2"
                label={t('home.movie')}
                value={selectedMovieId}
                displayValue={selectedMovieLabel}
                options={movieOptions}
                onChange={setSelectedMovieId}
                borderLeft={true}
              />

              {/* 3. Cinema Selector */}
              <CustomSelect
                step="3"
                label={t('home.cinema')}
                value={selectedCinemaId}
                displayValue={selectedCinemaLabel}
                options={cinemaOptions}
                onChange={setSelectedCinemaId}
                borderLeft={true}
              />

              {/* Search Button */}
              <button 
                onClick={() => navigate(`/showtimes?date=${selectedDate}&movie=${selectedMovieId}&cinema=${selectedCinemaId}`)}
                className="btn-primary cta-glow" 
                style={{
                  width: '100%',
                  padding: '12px 24px',
                  fontWeight: 700,
                  fontSize: 14,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  borderRadius: 12,
                  border: 'none',
                  cursor: 'pointer',
                  minHeight: 48,
                }}
              >
                <Search size={16} />
                <span>{t('home.searchNow')}</span>
              </button>

            </div>
          </div>
        </div>
      </section>

      {/* ===== TOP TRENDING SECTION ===== */}
      <section style={{ width: '100%', maxWidth: 1280, margin: '0 auto', padding: 'clamp(40px, 8vw, 80px) clamp(16px, 4vw, 24px)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 'clamp(24px, 5vw, 48px)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <Sparkles size={16} style={{ color: 'var(--accent)' }} />
              <span style={{ fontSize: 'clamp(10px, 1.5vw, 11px)', color: 'var(--accent)', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 600 }}>{t('home.weeklyLeaders')}</span>
            </div>
            <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 'clamp(1.25rem, 4vw, 2rem)', fontWeight: 700, margin: 0 }}>
              {t('home.topTrending')}
            </h2>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))',
          gap: 'clamp(16px, 4vw, 40px)',
        }}>
          {TRENDING_DATA.map((item, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ position: 'relative', aspectRatio: '4/5', borderRadius: 16, overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
                <img src={TRENDING_IMGS[i]} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.7s ease' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, black 0%, rgba(0,0,0,0.2) 50%, transparent 100%)' }} />
                <div style={{ position: 'absolute', bottom: 'clamp(12px, 3vw, 24px)', left: 'clamp(12px, 3vw, 24px)', right: 'clamp(12px, 3vw, 24px)' }}>
                  <h3 style={{ fontSize: 'clamp(16px, 3vw, 20px)', fontWeight: 700, color: 'white', marginBottom: 8 }}>{item.title}</h3>
                  <p style={{ fontSize: 'clamp(12px, 2vw, 13px)', color: 'rgba(255,255,255,0.65)', lineHeight: 1.6 }}>{item.desc}</p>
                  <button className="btn-primary cta-glow" style={{ marginTop: 16, padding: '10px 24px', fontSize: 13, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <Ticket size={14} /> Book Now
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== NOW SHOWING SECTION ===== */}
      <section style={{ width: '100%', maxWidth: 1280, margin: '0 auto', padding: 'clamp(32px, 6vw, 60px) clamp(16px, 4vw, 24px)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 'clamp(24px, 5vw, 48px)' }}>
          <div>
            <span style={{ fontSize: 'clamp(10px, 1.5vw, 11px)', color: 'var(--accent)', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: 12 }}>
              {t('home.nowShowingBadge')}
            </span>
            <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 'clamp(1.25rem, 4vw, 2rem)', fontWeight: 700, margin: 0 }}>
              {t('home.nowShowing')}
            </h2>
          </div>
        </div>

        {loading ? (
          <div className="state-center" style={{ minHeight: 300 }}>
            <Loader2 size={32} style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
            <p style={{ color: 'var(--text-secondary)', marginTop: 'var(--space-16)' }}>Loading movies...</p>
          </div>
        ) : error ? (
          <div className="state-center" style={{ minHeight: 300 }}>
            <AlertCircle size={40} style={{ color: 'var(--danger)' }} />
            <p style={{ color: 'var(--danger)', marginTop: 'var(--space-16)' }}>{error}</p>
          </div>
        ) : (
          <div className="movie-grid">
            {nowShowing.map(movie => (
              <div key={movie.movieId} className="glass-card interactive" style={{ borderRadius: 16, overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.3s ease, box-shadow 0.3s ease' }}
                onClick={() => navigate(`/movie/${movie.movieId}`)}>
                <div style={{ position: 'relative', width: '100%', paddingTop: '150%' }}>
                  <img
                    src={movie.moviePosterURL || PLACEHOLDER_POSTER}
                    alt={movie.movieName}
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                    loading="lazy"
                  />
                </div>
                <div style={{ padding: 'clamp(12px, 2vw, 16px)' }}>
                  <h3 style={{ fontSize: 'clamp(14px, 2vw, 16px)', fontWeight: 700, marginBottom: 'var(--space-8)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{movie.movieName}</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {movie.movieFormatInfos.split('/').filter(Boolean).map((f: string, i: number) => (
                      <span key={i} style={{ padding: '2px 10px', borderRadius: 'var(--radius-full)', fontSize: 11, fontWeight: 700, background: 'var(--bg-surface)', color: 'var(--accent)', border: '1px solid var(--border-color)' }}>
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ===== COMING SOON SECTION ===== */}
      {comingSoon.length > 0 && (
        <section style={{ width: '100%', maxWidth: 1280, margin: '0 auto', padding: 'clamp(32px, 6vw, 60px) clamp(16px, 4vw, 24px) 100px' }}>
          <div style={{ marginBottom: 'clamp(24px, 5vw, 48px)' }}>
            <span style={{ fontSize: 'clamp(10px, 1.5vw, 11px)', color: 'var(--accent)', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: 12 }}>
              {t('home.comingSoonBadge')}
            </span>
            <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 'clamp(1.25rem, 4vw, 2rem)', fontWeight: 700, margin: 0 }}>
              {t('home.comingSoon')}
            </h2>
          </div>
          <div className="movie-grid">
            {comingSoon.map(movie => (
              <div key={movie.movieId} className="glass-card interactive" style={{ borderRadius: 16, overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.3s ease' }}
                onClick={() => navigate(`/movie/${movie.movieId}`)}>
                <div style={{ position: 'relative', width: '100%', paddingTop: '150%' }}>
                  <img
                    src={movie.moviePosterURL || PLACEHOLDER_POSTER}
                    alt={movie.movieName}
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                    loading="lazy"
                  />
                </div>
                <div style={{ padding: 'clamp(12px, 2vw, 16px)' }}>
                  <h3 style={{ fontSize: 'clamp(14px, 2vw, 16px)', fontWeight: 700, marginBottom: 'var(--space-8)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{movie.movieName}</h3>
                  <span style={{ padding: '2px 10px', borderRadius: 'var(--radius-full)', fontSize: 11, fontWeight: 700, background: 'var(--bg-surface)', color: 'var(--accent)' }}>
                    Coming Soon
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ===== FOOTER ===== */}
      <footer style={{ borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-surface)', padding: 'clamp(32px, 6vw, 60px) clamp(16px, 4vw, 24px) clamp(24px, 4vw, 40px)' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
          gap: 'clamp(24px, 5vw, 40px)',
          maxWidth: 1280, margin: '0 auto'
        }}>
          <div>
            <h3 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 20, fontWeight: 800, background: 'linear-gradient(135deg, var(--accent), var(--accent))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', marginBottom: 16 }}>
              CINEMA PRO
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              Bringing the magic of cinema to life. Premium experiences, unforgettable stories.
            </p>
          </div>
          <div>
            <h4 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>Quick Links</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[{ label: 'Movies', path: '/home' }, { label: 'Showtimes', path: '/showtimes' }, { label: 'Theaters', path: '/theaters' }, { label: 'Offers', path: '/offers' }].map(link => (
                <button key={link.label} onClick={() => navigate(link.path)} style={{ fontSize: 13, color: 'var(--text-secondary)', textDecoration: 'none', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}>{link.label}</button>
              ))}
            </div>
          </div>
          <div>
            <h4 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>Contact</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13, color: 'var(--text-secondary)' }}>
              <span>support@cinemapro.com</span>
              <span>1800-123-456</span>
              <span>123 Cinema Boulevard</span>
            </div>
          </div>
        </div>
        <div style={{ borderTop: '1px solid var(--border-color)', marginTop: 'clamp(24px, 5vw, 40px)', paddingTop: 24, textAlign: 'center', fontSize: 12, color: 'var(--text-secondary)' }}>
          © 2024 CinemaPro. All rights reserved.
        </div>
      </footer>
      </div>
    </>
  );
};

export default HomePage;