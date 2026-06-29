// src/features/public/HomePage.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, AlertCircle, Loader2,
  Sparkles, Play, Ticket,
} from 'lucide-react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { publicApi } from '../../api/publicApi';
import { commentApi } from '../../api/commentApi';
import type { ApiErrorResponse } from '../../types/auth.types';
import type { PublicMovieListItem } from '../../types/public.types';
import type { TrendingMovie } from '../../types/comment.types';
import { useTranslation } from 'react-i18next';
import Header from '../../components/Header';
import BackToTop from '../../components/BackToTop';
import QuickBookingBar from './components/QuickBookingBar';
import SurveyModal from '../../components/SurveyModal';
import { recommendationApi, type RecommendedMovie } from '../../api/recommendationApi';


const IMG_BASE = 'https://lh3.googleusercontent.com/aida-public/';

const HERO_IMG = IMG_BASE + 'AB6AXuBb-6tDUgXoRgmgTRBXwngoVTj0smOmB_NZPmcLz1kiOTfMsZE0q1zTRpwjaDJODAErtBJ69LZgGfxSCF235D75zmh3x90AFKmA4E50fgujmCJDv_krUSKoqOXBtr_0Z6tQHY2yYzlnyzvt3W84u1BzPRod5sWHQqooJXYQDH3li2GMZsqPNhuYHBa0rR_CYURrjmM2OHScCUYex2_0lm6k-PzDwfgVk2s3Wd8hToSbNZvc0g_kD8RZzigLOWt0bPO0hif73yxHvNs';

const PLACEHOLDER_POSTER = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=500';

interface HomePageProps {
  mode?: 'public' | 'cashier-sales';
}

const FooterLink: React.FC<{ label: string; path: string }> = ({ label, path }) => {
  const nav = useNavigate();
  return (
    <button onClick={() => nav(path)} style={{
      fontSize: 13, color: 'var(--text-secondary)', textDecoration: 'none',
      background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
      padding: 0, transition: 'color 0.2s ease',
    }}
      onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
      onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
    >
      {label}
    </button>
  );
};

const HomePage: React.FC<HomePageProps> = ({ mode = 'public' }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const isCashierSales = mode === 'cashier-sales';

  const handleMovieClick = (movieId: string) => {
    commentApi.trackMovieView(movieId).catch(() => undefined);
    navigate(isCashierSales ? `/movie/${movieId}?pos=1` : `/movie/${movieId}`);
  };

  const [nowShowing, setNowShowing] = useState<PublicMovieListItem[]>([]);
  const [comingSoon, setComingSoon] = useState<PublicMovieListItem[]>([]);
  const [trendingMovies, setTrendingMovies] = useState<TrendingMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingTrending, setLoadingTrending] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // City select sync state
  const [selectedCity, setSelectedCity] = useState<string>(() => localStorage.getItem('user_selected_city') || '');
  // Cinema filter state (driven by QuickBookingBar selection)
  const [selectedCinemaId, setSelectedCinemaId] = useState<string>('All');

  // Sliders refs
  const nowShowingRef = useRef<HTMLDivElement>(null);
  const comingSoonRef = useRef<HTMLDivElement>(null);

  const [trendingTab, setTrendingTab] = useState<'system' | 'local'>('system');

  // ── Personalised Recommendation State ──
  const [showSurvey, setShowSurvey] = useState(false);
  const [recommendations, setRecommendations] = useState<RecommendedMovie[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [surveyCompleted, setSurveyCompleted] = useState(false);

  useEffect(() => {
    if (isCashierSales && !localStorage.getItem('cashier_shift_session')) {
      navigate('/cashier', { replace: true });
    }
  }, [isCashierSales, navigate]);

  useEffect(() => {
    const handleCityChange = () => {
      setSelectedCity(localStorage.getItem('user_selected_city') || '');
      setSelectedCinemaId('All'); // reset cinema filter when city changes
    };
    window.addEventListener('user_selected_city_changed', handleCityChange);
    return () => window.removeEventListener('user_selected_city_changed', handleCityChange);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const doFetch = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await publicApi.getAllMovies({
          city: selectedCity || undefined,
          cinemaId: selectedCinemaId !== 'All' ? selectedCinemaId : undefined,
          pageSize: 40,
        });
        if (cancelled) return; // discard stale response
        const items = response.data || [];
        setNowShowing(items.filter(m => !m.isCommingSoon));
        setComingSoon(items.filter(m => m.isCommingSoon));
      } catch (err) {
        if (cancelled) return;
        if (axios.isAxiosError(err) && err.response) {
          const data = err.response.data as ApiErrorResponse;
          if (data.statusCode === 401) {
            localStorage.removeItem('user_info');
            Cookies.remove('X-Access-Token');
            navigate('/login');
            return;
          }
          setError(data.message || 'Cannot load movies list.');
        } else {
          setError('Cannot connect to server.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    doFetch();
    return () => { cancelled = true; }; // cleanup: cancel stale fetch
  }, [selectedCity, selectedCinemaId]);

  useEffect(() => {
    fetchTrendingMovies();
  }, [selectedCity, trendingTab]);

  // ── Survey status check & recommendation loader ──
  useEffect(() => {
    const userInfo = localStorage.getItem('user_info');
    if (isCashierSales) return;
    if (!userInfo) return; // not logged in, skip

    const checkSurveyAndLoad = async () => {
      try {
        await recommendationApi.getSurveyStatus();
        setSurveyCompleted(true);
        loadRecommendations();
      } catch {
        // Not authenticated or server error – do nothing
      }
    };
    checkSurveyAndLoad();
  }, [isCashierSales]);

  const loadRecommendations = async () => {
    setLoadingRecs(true);
    try {
      const res = await recommendationApi.getRecommendations();
      setRecommendations(res.data || []);
    } catch {
      setRecommendations([]);
    } finally {
      setLoadingRecs(false);
    }
  };

  const handleSurveyComplete = () => {
    setShowSurvey(false);
    setSurveyCompleted(true);
    loadRecommendations();
  };


  const fetchTrendingMovies = async () => {
    setLoadingTrending(true);
    try {
      const params: any = {
        days: 30,
        take: 3
      };
      if (trendingTab === 'local') {
        if (selectedCity) {
          params.city = selectedCity;
        }
      }
      const response = await commentApi.getTrendingMovies(params);
      setTrendingMovies(response.data || []);
    } catch (err) {
      console.error('Error fetching trending movies:', err);
      setTrendingMovies([]);
    } finally {
      setLoadingTrending(false);
    }
  };

  const scroll = (ref: React.RefObject<HTMLDivElement | null>, direction: 'left' | 'right') => {
    if (ref.current) {
      const scrollAmount = ref.current.clientWidth * 0.75;
      ref.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
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
              borderRadius: 9999,
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
          <QuickBookingBar selectedCity={selectedCity} onCinemaChange={(cinemaId) => {
            setSelectedCinemaId(cinemaId);
          }} posMode={isCashierSales} />
        </div>
      </section>

      {/* ===== TOP TRENDING SECTION ===== */}
      <section style={{ width: '100%', maxWidth: 1280, margin: '0 auto', padding: 'clamp(40px, 8vw, 80px) clamp(16px, 4vw, 24px)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'clamp(24px, 5vw, 48px)', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <Sparkles size={16} style={{ color: 'var(--accent)' }} />
              <span style={{ fontSize: 'clamp(10px, 1.5vw, 11px)', color: 'var(--accent)', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 600 }}>{t('home.weeklyLeaders')}</span>
            </div>
            <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 'clamp(1.25rem, 4vw, 2rem)', fontWeight: 700, margin: 0 }}>
              {t('home.topTrending')}
            </h2>
          </div>

          {/* Trending Tab Switcher */}
          <div style={{ display: 'flex', gap: 6, padding: 4, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <button
              onClick={() => setTrendingTab('system')}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                border: 'none',
                background: trendingTab === 'system' ? 'rgba(255,138,0,0.15)' : 'transparent',
                color: trendingTab === 'system' ? 'var(--accent)' : 'rgba(255,255,255,0.6)',
                transition: 'all 0.2s',
              }}
            >
              {t('home.systemWide')}
            </button>
            <button
              onClick={() => setTrendingTab('local')}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                border: 'none',
                background: trendingTab === 'local' ? 'rgba(255,138,0,0.15)' : 'transparent',
                color: trendingTab === 'local' ? 'var(--accent)' : 'rgba(255,255,255,0.6)',
                transition: 'all 0.2s',
              }}
            >
              {selectedCity ? t('home.inCity', { city: selectedCity }) : t('home.localLabel')}
            </button>
          </div>
        </div>

        <div className="trending-carousel-wrapper" style={{ position: 'relative' }}>
          {/* Prev Arrow */}
          <button
            onClick={() => { const el = document.querySelector('.trending-carousel'); if (el) el.scrollBy({ left: -320, behavior: 'smooth' }); }}
            className="carousel-nav carousel-nav-prev"
            aria-label="Previous"
          >
            <ChevronLeft size={20} />
          </button>

          {loadingTrending ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))',
                gap: 'clamp(16px, 4vw, 40px)',
              }}
            >
              {[1, 2, 3].map((item) => (
                <div key={item} style={{ aspectRatio: '4/5', borderRadius: 16, overflow: 'hidden', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ height: '100%', width: '100%', background: 'linear-gradient(110deg, rgba(255,255,255,0.04), rgba(255,255,255,0.1), rgba(255,255,255,0.04))' }} />
                </div>
              ))}
            </div>
          ) : trendingMovies.length === 0 ? (
            <div className="glass-card" style={{ minHeight: 180, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 24 }}>
              <div>
                <Sparkles size={28} style={{ color: 'var(--accent)', margin: '0 auto 12px' }} />
                <p style={{ color: 'white', fontWeight: 700, margin: 0 }}>{t('home.noTrendingData')}</p>
                <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 8 }}>{t('home.noTrendingDesc')}</p>
              </div>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))',
              gap: 'clamp(16px, 4vw, 40px)',
            }}
              className="trending-carousel"
            >
              {trendingMovies.map((item, i) => (
                <div key={item.movieId} style={{ display: 'flex', flexDirection: 'column' }}>
                  <div
                    onClick={() => handleMovieClick(item.movieId)}
                    style={{ position: 'relative', aspectRatio: '4/5', borderRadius: 16, overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    <img
                      src={item.movieImageUrl || PLACEHOLDER_POSTER}
                      alt={item.movieName}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.7s ease' }}
                      loading={i === 0 ? 'eager' : 'lazy'}
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = PLACEHOLDER_POSTER;
                      }}
                    />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.45) 52%, rgba(0,0,0,0.08) 100%)' }} />
                    <div style={{ position: 'absolute', top: 16, left: 16, minWidth: 44, height: 44, borderRadius: 14, background: 'rgba(255,138,0,0.92)', color: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 18 }}>
                      {i + 1}
                    </div>
                    <div style={{ position: 'absolute', bottom: 'clamp(12px, 3vw, 24px)', left: 'clamp(12px, 3vw, 24px)', right: 'clamp(12px, 3vw, 24px)' }}>
                      <h3 style={{ fontSize: 'clamp(16px, 3vw, 20px)', fontWeight: 700, color: 'white', marginBottom: 8, lineHeight: 1.25 }}>{item.movieName}</h3>
                      <p style={{ fontSize: 'clamp(12px, 2vw, 13px)', color: 'rgba(255,255,255,0.72)', lineHeight: 1.6, minHeight: 42, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {item.movieDescription || 'This movie is generating buzz this month.'}
                      </p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                        <span style={{ padding: '5px 10px', borderRadius: 999, background: 'rgba(255,255,255,0.08)', color: '#ffb77f', fontSize: 11, fontWeight: 700, border: '1px solid rgba(255,255,255,0.1)' }}>{item.paidTicketCount} vé</span>
                        <span style={{ padding: '5px 10px', borderRadius: 999, background: 'rgba(255,255,255,0.08)', color: '#ffb77f', fontSize: 11, fontWeight: 700, border: '1px solid rgba(255,255,255,0.1)' }}>{item.viewCount} lượt xem</span>
                        <span style={{ padding: '5px 10px', borderRadius: 999, background: 'rgba(255,255,255,0.08)', color: '#ffb77f', fontSize: 11, fontWeight: 700, border: '1px solid rgba(255,255,255,0.1)' }}>{item.averageRating.toFixed(1)} sao</span>
                      </div>
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          handleMovieClick(item.movieId);
                        }}
                        className="btn-primary cta-glow"
                        style={{ marginTop: 16, padding: '10px 24px', fontSize: 13, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 8, border: 'none', cursor: 'pointer' }}
                      >
                        <Ticket size={14} /> {t('home.bookNowBadge')}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Next Arrow */}
          <button
            onClick={() => { const el = document.querySelector('.trending-carousel'); if (el) el.scrollBy({ left: 320, behavior: 'smooth' }); }}
            className="carousel-nav carousel-nav-next"
            aria-label="Next"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </section>

      {/* ===== MOVIES SECTION ===== */}
      <section style={{ width: '100%', maxWidth: 1280, margin: '0 auto', padding: 'clamp(32px, 6vw, 60px) clamp(16px, 4vw, 24px)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 64, minWidth: 0 }}>
          
          {/* Now Showing Section */}
          <div>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 'clamp(16px, 3vw, 32px)' }}>
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
                <p style={{ color: 'var(--text-secondary)', marginTop: 'var(--space-16)' }}>{t('common.loading', 'Loading movies...')}</p>
              </div>
            ) : error ? (
              <div className="state-center" style={{ minHeight: 300 }}>
                <AlertCircle size={40} style={{ color: 'var(--danger)' }} />
                <p style={{ color: 'var(--danger)', marginTop: 'var(--space-16)' }}>{error}</p>
              </div>
            ) : nowShowing.length === 0 ? (
              <div className="glass-card" style={{ padding: 48, borderRadius: 16, textAlign: 'center', color: 'var(--text-secondary)' }}>
                {t('home.noNowShowing')}
              </div>
            ) : (
              <div>
                <div style={{ position: 'relative' }}>
                  {/* Prev Button */}
                  {nowShowing.length > 4 && (
                    <button
                      onClick={() => scroll(nowShowingRef, 'left')}
                      className="carousel-nav carousel-nav-prev"
                      style={{ position: 'absolute', left: -20, top: '50%', transform: 'translateY(-50%)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      aria-label="Previous"
                    >
                      <ChevronLeft size={20} />
                    </button>
                  )}

                  <div 
                    ref={nowShowingRef}
                    className="hide-scrollbar"
                    style={{
                      display: 'flex',
                      gap: 20,
                      overflowX: 'auto',
                      scrollSnapType: 'x mandatory',
                      scrollBehavior: 'smooth',
                      padding: '10px 4px',
                    }}
                  >
                    {nowShowing.slice(0, 10).map(movie => (
                      <div 
                        key={movie.movieId} 
                        className="glass-card interactive" 
                        style={{ 
                          flex: '0 0 250px',
                          borderRadius: 16, 
                          overflow: 'hidden', 
                          cursor: 'pointer', 
                          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                          scrollSnapAlign: 'start',
                        }}
                        onClick={() => handleMovieClick(movie.movieId)}
                      >
                        <div style={{ position: 'relative', width: '100%', paddingTop: '150%' }}>
                          <img
                            src={movie.moviePosterURL || PLACEHOLDER_POSTER}
                            alt={movie.movieName}
                            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                            loading="lazy"
                            onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = PLACEHOLDER_POSTER; }}
                          />
                        </div>
                        <div style={{ padding: 16 }}>
                          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{movie.movieName}</h3>
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

                  {/* Next Button */}
                  {nowShowing.length > 4 && (
                    <button
                      onClick={() => scroll(nowShowingRef, 'right')}
                      className="carousel-nav carousel-nav-next"
                      style={{ position: 'absolute', right: -20, top: '50%', transform: 'translateY(-50%)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      aria-label="Next"
                    >
                      <ChevronRight size={20} />
                    </button>
                  )}
                </div>

                {/* See More Button */}
                {nowShowing.length > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
                    <button 
                      onClick={() => navigate('/movies?tab=now-showing')}
                      className="glass-card interactive"
                      style={{
                        padding: '10px 24px',
                        borderRadius: 12,
                        border: '1px solid rgba(255,255,255,0.1)',
                        background: 'rgba(255,255,255,0.05)',
                        color: 'white',
                        fontWeight: 700,
                        fontSize: 13,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      {t('home.seeMore', 'See More')}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Personalised Recommendation Section ── */}
          {!isCashierSales && surveyCompleted && (
            <div>
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 'clamp(16px, 3vw, 32px)', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <span style={{ fontSize: 'clamp(10px, 1.5vw, 11px)', color: 'var(--accent)', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: 12 }}>
                    ✨ {t('home.forYou')}
                  </span>
                  <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 'clamp(1.25rem, 4vw, 2rem)', fontWeight: 700, margin: 0 }}>
                    {t('home.personalizedRecs')}
                  </h2>
                </div>
                <button
                  onClick={() => setShowSurvey(true)}
                  style={{
                    fontSize: 12, color: 'var(--accent)',
                    background: 'rgba(255,138,0,0.08)',
                    border: '1px solid rgba(255,138,0,0.2)',
                    borderRadius: 8, padding: '7px 16px',
                    cursor: 'pointer', fontWeight: 600,
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,138,0,0.15)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,138,0,0.08)'; }}
                >
                  {t('home.updatePreferences')}
                </button>
              </div>

              {loadingRecs ? (
                <div style={{ display: 'flex', gap: 20, overflowX: 'hidden', padding: '10px 4px' }}>
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} style={{
                      flex: '0 0 220px', height: 340, borderRadius: 16,
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }} />
                  ))}
                </div>
              ) : recommendations.length === 0 ? (
                <div className="glass-card" style={{ padding: '36px 24px', borderRadius: 16, textAlign: 'center' }}>
                  <Sparkles size={28} style={{ color: 'var(--accent)', margin: '0 auto 12px' }} />
                  <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: 14 }}>{t('home.noRecsYet')}</p>
                </div>
              ) : (
                <div
                  className="hide-scrollbar"
                  style={{
                    display: 'flex', gap: 20,
                    overflowX: 'auto',
                    padding: '10px 4px',
                    scrollSnapType: 'x mandatory',
                    scrollBehavior: 'smooth',
                  }}
                >
                  {recommendations.map(movie => (
                    <div
                      key={movie.movieId}
                      className="glass-card interactive"
                      style={{
                        flex: '0 0 220px',
                        borderRadius: 16, overflow: 'hidden',
                        cursor: 'pointer', scrollSnapAlign: 'start',
                        position: 'relative',
                        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                      }}
                      onClick={() => handleMovieClick(movie.movieId)}
                    >
                      {/* AI badge */}
                      <div style={{
                        position: 'absolute', top: 10, right: 10, zIndex: 2,
                        background: 'linear-gradient(135deg, #ff8a00, #ff6b00)',
                        borderRadius: 6, padding: '3px 8px',
                        fontSize: 10, fontWeight: 800, color: 'black',
                        boxShadow: '0 2px 8px rgba(255,138,0,0.4)',
                      }}>
                        ✨ {t('home.aiPick')}
                      </div>
                      <div style={{ position: 'relative', width: '100%', paddingTop: '140%' }}>
                        <img
                          src={movie.moviePosterURL || PLACEHOLDER_POSTER}
                          alt={movie.movieName}
                          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                          loading="lazy"
                          onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = PLACEHOLDER_POSTER; }}
                        />
                      </div>
                      <div style={{ padding: 14 }}>
                        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {movie.movieName}
                        </h3>
                        <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {movie.movieGenres}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Coming Soon Section */}
          <div style={{ marginTop: 'clamp(32px, 6vw, 64px)' }}>
            <div style={{ marginBottom: 'clamp(16px, 3vw, 32px)' }}>
              <span style={{ fontSize: 'clamp(10px, 1.5vw, 11px)', color: 'var(--accent)', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: 12 }}>
                {t('home.comingSoonBadge', 'Coming Soon')}
              </span>
              <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 'clamp(1.25rem, 4vw, 2rem)', fontWeight: 700, margin: 0 }}>
                {t('home.comingSoon', 'Coming Soon')}
              </h2>
            </div>

            {comingSoon.length === 0 ? (
              <div className="glass-card" style={{ padding: '36px 24px', borderRadius: 16, textAlign: 'center' }}>
                <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: 14 }}>{t('home.noComingSoon', 'No list available at the moment')}</p>
              </div>
            ) : (
              <div>
                <div style={{ position: 'relative' }}>
                  {/* Prev Button */}
                  {comingSoon.length > 4 && (
                    <button
                      onClick={() => scroll(comingSoonRef, 'left')}
                      className="carousel-nav carousel-nav-prev"
                      style={{ position: 'absolute', left: -20, top: '50%', transform: 'translateY(-50%)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      aria-label="Previous"
                    >
                      <ChevronLeft size={20} />
                    </button>
                  )}

                  <div 
                    ref={comingSoonRef}
                    className="hide-scrollbar"
                    style={{
                      display: 'flex',
                      gap: 20,
                      overflowX: 'auto',
                      scrollSnapType: 'x mandatory',
                      scrollBehavior: 'smooth',
                      padding: '10px 4px',
                    }}
                  >
                    {comingSoon.slice(0, 10).map(movie => (
                      <div 
                        key={movie.movieId} 
                        className="glass-card interactive" 
                        style={{ 
                          flex: '0 0 250px',
                          borderRadius: 16, 
                          overflow: 'hidden', 
                          cursor: 'pointer', 
                          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                          scrollSnapAlign: 'start',
                        }}
                        onClick={() => handleMovieClick(movie.movieId)}
                      >
                        <div style={{ position: 'relative', width: '100%', paddingTop: '150%' }}>
                          <img
                            src={movie.moviePosterURL || PLACEHOLDER_POSTER}
                            alt={movie.movieName}
                            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                            loading="lazy"
                            onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = PLACEHOLDER_POSTER; }}
                          />
                        </div>
                        <div style={{ padding: 16 }}>
                          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{movie.movieName}</h3>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start' }}>
                            <span style={{ padding: '2px 10px', borderRadius: 'var(--radius-full)', fontSize: 11, fontWeight: 700, background: 'var(--bg-surface)', color: 'var(--accent)', display: 'inline-block' }}>
                              {t('home.comingSoon')}
                            </span>
                            {movie.startedDate && (
                              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                                {t('home.releaseDate', 'Release Date')}: {new Date(movie.startedDate).toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Next Button */}
                  {comingSoon.length > 4 && (
                    <button
                      onClick={() => scroll(comingSoonRef, 'right')}
                      className="carousel-nav carousel-nav-next"
                      style={{ position: 'absolute', right: -20, top: '50%', transform: 'translateY(-50%)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      aria-label="Next"
                    >
                      <ChevronRight size={20} />
                    </button>
                  )}
                </div>

                {/* See More Button */}
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
                  <button 
                    onClick={() => navigate('/movies?tab=coming-soon')}
                    className="glass-card interactive"
                    style={{
                      padding: '10px 24px',
                      borderRadius: 12,
                      border: '1px solid rgba(255,255,255,0.1)',
                      background: 'rgba(255,255,255,0.05)',
                      color: 'white',
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    {t('home.seeMore', 'See More')}
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer style={{ borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-surface)', padding: 'clamp(32px, 6vw, 60px) clamp(16px, 4vw, 24px) clamp(24px, 4vw, 40px)' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 160px), 1fr))',
          gap: 'clamp(24px, 4vw, 40px)',
          maxWidth: 1280, marginLeft: 'auto', marginRight: 'auto',
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
            <h4 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16, color: 'var(--accent)' }}>Quick Links</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <FooterLink label="Privacy Policy" path="/privacy-policy" />
              <FooterLink label="Terms of Service" path="/terms-of-service" />
              <FooterLink label="Contact Us" path="/contact-us" />
            </div>
          </div>
          <div>
            <h4 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16, color: 'var(--accent)' }}>Company</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <FooterLink label="Careers" path="/careers" />
              <FooterLink label="Feedback" path="/contact-us" />
              <FooterLink label="About Us" path="/about-us" />
            </div>
          </div>
          <div>
            <h4 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16, color: 'var(--accent)' }}>Legal</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <FooterLink label="Cookie Policy" path="/cookie-policy" />
              <FooterLink label="Safety Rules" path="/safety-rules" />
            </div>
          </div>
          <div>
            <h4 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16, color: 'var(--accent)' }}>Contact</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13, color: 'var(--text-secondary)' }}>
              <span>support@cinemapro.com</span>
              <span>1800-123-456</span>
              <span>123 Cinema Boulevard</span>
            </div>
          </div>
        </div>
        {/* Help CTA Banner */}
        <div style={{
          marginTop: 'clamp(24px, 5vw, 40px)',
          padding: '20px 24px',
          maxWidth: 1280, marginLeft: 'auto', marginRight: 'auto',
          borderRadius: 'var(--radius-lg)',
          backgroundColor: 'rgba(255,138,0,0.06)',
          border: '1px solid rgba(255,138,0,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 'var(--radius-md)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backgroundColor: 'rgba(255,138,0,0.12)', color: 'var(--accent)',
              fontSize: 20, fontWeight: 800,
            }}>
              ?
            </div>
            <div>
              <p style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>{t('help.stillNeedHelp', 'Still need help?')}</p>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '2px 0 0' }}>{t('help.stillNeedHelpDesc', 'Our support team is available 24/7 to assist you.')}</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/help')}
            className="interactive"
            style={{
              padding: '10px 24px', fontSize: 13, fontWeight: 700,
              background: 'var(--accent)', color: 'black', border: 'none',
              borderRadius: 'var(--radius-full)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 8,
              transition: 'transform 0.2s ease',
            }}
          >
            <span>?</span>
            {t('help.contactSupport', 'Contact Support')}
          </button>
        </div>

        <div style={{ borderTop: '1px solid var(--border-color)', marginTop: 'clamp(24px, 5vw, 40px)', paddingTop: 24, textAlign: 'center', fontSize: 12, color: 'var(--text-secondary)' }}>
          © 2024 CinemaPro. All rights reserved.
        </div>
      </footer>
      </div>
      <BackToTop />

      {/* Survey Modal – rendered at root level for correct z-index */}
      {!isCashierSales && showSurvey && (
        <SurveyModal
          onClose={() => setShowSurvey(false)}
          onComplete={handleSurveyComplete}
        />
      )}
    </>
  );
};

export default HomePage;
