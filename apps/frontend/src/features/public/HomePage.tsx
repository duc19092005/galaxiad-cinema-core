// src/features/public/HomePage.tsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);
  const [activeTrendingIndex, setActiveTrendingIndex] = useState(0);

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

  const heroMovies = useMemo(() => trendingMovies.slice(0, 5), [trendingMovies]);

  const activeHeroMovie = heroMovies[activeHeroIndex] ?? heroMovies[0];
  const activeHeroImage = activeHeroMovie?.movieBannerUrl || activeHeroMovie?.movieImageUrl || PLACEHOLDER_POSTER;
  const activeTrendingMovie = trendingMovies[activeTrendingIndex] ?? trendingMovies[0];

  useEffect(() => {
    if (activeHeroIndex >= heroMovies.length) {
      setActiveHeroIndex(0);
    }
  }, [activeHeroIndex, heroMovies.length]);

  useEffect(() => {
    if (activeTrendingIndex >= trendingMovies.length) {
      setActiveTrendingIndex(0);
    }
  }, [activeTrendingIndex, trendingMovies.length]);

  const changeHeroSlide = (direction: 'prev' | 'next') => {
    if (heroMovies.length === 0) return;

    setActiveHeroIndex((current) => {
      if (direction === 'prev') {
        return current === 0 ? heroMovies.length - 1 : current - 1;
      }

      return (current + 1) % heroMovies.length;
    });
  };


  const fetchTrendingMovies = async () => {
    setLoadingTrending(true);
    try {
      const params: any = {
        days: 30,
        take: 5
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
        @keyframes homeBgSlide {
          from { opacity: 0.45; transform: translate3d(26px, 0, 0) scale(1.045); }
          to { opacity: 1; transform: translate3d(0, 0, 0) scale(1.02); }
        }
        @keyframes homeCopySlide {
          from { opacity: 0; transform: translate3d(-22px, 0, 0); }
          to { opacity: 1; transform: translate3d(0, 0, 0); }
        }
        @keyframes homeFeatureSlide {
          from { opacity: 0; transform: translate3d(24px, 0, 0) scale(0.985); }
          to { opacity: 1; transform: translate3d(0, 0, 0) scale(1); }
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .home-hero-shell {
          position: relative;
          min-height: min(760px, 96dvh);
          display: flex;
          align-items: stretch;
          overflow: visible;
          isolation: isolate;
        }
        .home-hero-bg {
          position: absolute;
          inset: 0;
          z-index: 0;
          overflow: hidden;
          background: var(--bg-base);
        }
        .home-hero-bg img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          filter: saturate(1.05) brightness(0.72);
          transform: scale(1.02);
          transition: opacity 0.35s ease, transform 0.6s ease;
          animation: homeBgSlide 0.62s cubic-bezier(0.2, 0.8, 0.2, 1) both;
        }
        .home-hero-bg::after {
          content: "";
          position: absolute;
          inset: 0;
          background:
            linear-gradient(90deg, rgba(19,19,22,0.96) 0%, rgba(19,19,22,0.64) 46%, rgba(19,19,22,0.86) 100%),
            linear-gradient(0deg, var(--bg-base) 0%, rgba(19,19,22,0) 34%, rgba(19,19,22,0.34) 100%);
        }
        .home-hero-content {
          position: relative;
          z-index: 2;
          width: 100%;
          max-width: 1280px;
          margin: 0 auto;
          padding: clamp(96px, 12vw, 132px) clamp(16px, 4vw, 24px) clamp(88px, 12vw, 124px);
          display: grid;
          grid-template-columns: minmax(0, 1fr) 150px;
          gap: clamp(24px, 6vw, 72px);
          align-items: center;
        }
        .home-hero-main {
          max-width: 720px;
        }
        .home-slide-copy {
          animation: homeCopySlide 0.46s cubic-bezier(0.2, 0.8, 0.2, 1) both;
          will-change: transform, opacity;
        }
        .home-hero-kicker {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 7px 12px;
          border-radius: 999px;
          color: var(--accent);
          background: rgba(255,138,0,0.12);
          border: 1px solid rgba(255,138,0,0.24);
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }
        .home-hero-title {
          margin: 18px 0 0;
          color: #fff;
          font-family: 'Montserrat', sans-serif;
          font-size: clamp(2.35rem, 7vw, 5.25rem);
          line-height: 1.02;
          font-weight: 800;
          letter-spacing: 0;
          text-transform: uppercase;
          text-wrap: balance;
        }
        .home-hero-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 20px;
        }
        .home-hero-chip {
          padding: 7px 11px;
          border-radius: 999px;
          color: rgba(255,255,255,0.82);
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.1);
          font-size: 12px;
          font-weight: 700;
        }
        .home-hero-copy {
          margin: 22px 0 0;
          max-width: 620px;
          color: rgba(255,255,255,0.74);
          font-size: clamp(14px, 2vw, 16px);
          line-height: 1.75;
        }
        .home-hero-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 30px;
        }
        .home-hero-secondary {
          min-height: 48px;
          padding: 12px 22px;
          border-radius: var(--radius-full);
          border: 1px solid rgba(255,255,255,0.14);
          background: rgba(255,255,255,0.07);
          color: white;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
          transition: transform 0.2s ease, background 0.2s ease;
        }
        .home-hero-secondary:hover {
          background: rgba(255,255,255,0.12);
        }
        .home-hero-secondary:active {
          transform: translateY(1px);
        }
        .home-hero-thumbs {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }
        .home-hero-thumb-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-height: 420px;
          overflow: auto;
          padding: 2px;
        }
        .home-hero-thumb-list::-webkit-scrollbar {
          width: 0;
          height: 0;
        }
        .home-hero-thumb {
          width: 126px;
          aspect-ratio: 16 / 10;
          border-radius: var(--radius-md);
          overflow: hidden;
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.06);
          opacity: 0.58;
          cursor: pointer;
          padding: 0;
          transition: opacity 0.2s ease, transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .home-hero-thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .home-hero-thumb:hover,
        .home-hero-thumb.is-active {
          opacity: 1;
          transform: scale(1.04);
          border-color: rgba(255,138,0,0.9);
          box-shadow: 0 0 0 3px rgba(255,138,0,0.18);
        }
        .home-hero-nav {
          width: 44px;
          height: 44px;
          border-radius: 999px;
          border: 1px solid rgba(255,138,0,0.26);
          background: rgba(20,20,20,0.68);
          color: var(--accent);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: transform 0.2s ease, background 0.2s ease;
        }
        .home-hero-nav:hover {
          background: rgba(255,138,0,0.12);
          transform: scale(1.04);
        }
        .home-hero-booking {
          position: absolute;
          z-index: 4;
          left: 50%;
          bottom: 0;
          width: min(100% - 32px, 1000px);
          transform: translate(-50%, 50%);
        }
        .home-trending-stage {
          display: grid;
          grid-template-columns: minmax(0, 2fr) minmax(300px, 0.95fr);
          gap: clamp(20px, 4vw, 44px);
          align-items: stretch;
        }
        .home-trending-feature {
          position: relative;
          min-height: 620px;
          border-radius: 24px;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.04);
          box-shadow: 0 28px 70px rgba(0,0,0,0.36);
          cursor: pointer;
          animation: homeFeatureSlide 0.48s cubic-bezier(0.2, 0.8, 0.2, 1) both;
          will-change: transform, opacity;
        }
        .home-trending-feature img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform 0.45s ease;
        }
        .home-trending-feature:hover img {
          transform: scale(1.035);
        }
        .home-trending-feature::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(0,0,0,0.94) 0%, rgba(0,0,0,0.52) 48%, rgba(0,0,0,0.08) 100%);
          pointer-events: none;
        }
        .home-trending-rank {
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          z-index: 2;
          min-width: 58px;
          padding: 10px 14px;
          border-radius: 0 16px 16px 0;
          background: var(--accent);
          color: #111;
          font-size: 30px;
          font-weight: 900;
          text-align: center;
          box-shadow: 0 18px 40px rgba(255,138,0,0.24);
        }
        .home-trending-feature-content {
          position: absolute;
          z-index: 2;
          left: clamp(20px, 4vw, 48px);
          right: clamp(20px, 4vw, 48px);
          bottom: clamp(22px, 4vw, 46px);
        }
        .home-trending-meta {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px;
          margin-bottom: 14px;
        }
        .home-trending-rating {
          padding: 6px 10px;
          border-radius: 10px;
          background: var(--accent);
          color: #111;
          font-size: 12px;
          font-weight: 900;
        }
        .home-trending-genre {
          color: rgba(255,255,255,0.7);
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .home-trending-title {
          margin: 0 0 14px;
          color: white;
          font-family: 'Montserrat', sans-serif;
          font-size: clamp(1.9rem, 5vw, 4.2rem);
          line-height: 1.05;
          font-weight: 800;
          letter-spacing: 0;
          text-transform: uppercase;
        }
        .home-trending-desc {
          margin: 0;
          max-width: 640px;
          color: rgba(255,255,255,0.76);
          line-height: 1.7;
          font-size: clamp(13px, 2vw, 16px);
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .home-trending-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 24px;
        }
        .home-trending-list {
          border-radius: 24px;
          padding: 18px;
          min-height: 620px;
          background: linear-gradient(135deg, rgba(255,255,255,0.045), rgba(255,255,255,0.015));
          border: 1px solid rgba(255,255,255,0.08);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.04);
        }
        .home-trending-list-title {
          margin: 0 0 16px;
          color: var(--accent);
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }
        .home-trending-row {
          width: 100%;
          display: flex;
          gap: 14px;
          align-items: center;
          padding: 10px;
          border-radius: 18px;
          border: 1px solid transparent;
          background: transparent;
          color: inherit;
          cursor: pointer;
          text-align: left;
          transition: background 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
        }
        .home-trending-row + .home-trending-row {
          margin-top: 8px;
        }
        .home-trending-row:hover,
        .home-trending-row.is-active {
          background: rgba(255,138,0,0.1);
          border-color: rgba(255,138,0,0.22);
        }
        .home-trending-row:active {
          transform: translateY(1px);
        }
        .home-trending-row img {
          width: 72px;
          aspect-ratio: 5 / 7;
          border-radius: 12px;
          object-fit: cover;
          flex: 0 0 auto;
          box-shadow: 0 10px 24px rgba(0,0,0,0.28);
        }
        .home-trending-row-title {
          margin: 0;
          color: white;
          font-size: 14px;
          font-weight: 800;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .home-trending-row-desc {
          margin: 5px 0 8px;
          color: var(--text-secondary);
          font-size: 12px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .home-trending-row-stats {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          color: #ffb77f;
          font-size: 11px;
          font-weight: 800;
        }
        @media (max-width: 900px) {
          .home-hero-shell {
            min-height: auto;
          }
          .home-hero-content {
            grid-template-columns: 1fr;
            padding-top: 96px;
            padding-bottom: 132px;
          }
          .home-hero-thumbs {
            align-items: stretch;
          }
          .home-hero-nav {
            display: none;
          }
          .home-hero-thumb-list {
            flex-direction: row;
            max-height: none;
            overflow-x: auto;
            padding-bottom: 4px;
          }
          .home-hero-thumb {
            width: min(34vw, 142px);
            flex: 0 0 auto;
          }
        }
        @media (max-width: 980px) {
          .home-trending-stage {
            grid-template-columns: 1fr;
          }
          .home-trending-feature,
          .home-trending-list {
            min-height: auto;
          }
          .home-trending-feature {
            aspect-ratio: 16 / 12;
          }
        }
        @media (max-width: 640px) {
          .home-trending-feature {
            aspect-ratio: 3 / 4;
          }
          .home-trending-rank {
            top: 18px;
            transform: none;
            font-size: 22px;
          }
          .home-trending-row img {
            width: 62px;
          }
        }
      `}</style>
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)', overflowX: 'hidden' }}>

      {/* Redesigned Unified Header */}
      <Header />



      {/* ===== HERO SECTION ===== */}
      <section className="home-hero-shell">
        <div className="home-hero-bg">
          {activeHeroMovie ? (
            <img
              key={activeHeroMovie.movieId}
              alt={activeHeroMovie.movieName}
              src={activeHeroImage}
              onError={(event) => {
                event.currentTarget.onerror = null;
                event.currentTarget.src = PLACEHOLDER_POSTER;
              }}
            />
          ) : (
            <img alt="Cinema theater" src={HERO_IMG} />
          )}
        </div>

        <div className="home-hero-content">
          <div className="home-hero-main">
            {loadingTrending ? (
              <div className="glass-card" style={{ width: 'min(100%, 620px)', minHeight: 260, padding: 28 }}>
                <Loader2 size={28} style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite', marginBottom: 18 }} />
                <div style={{ width: '68%', height: 22, borderRadius: 999, background: 'rgba(255,255,255,0.08)', marginBottom: 16 }} />
                <div style={{ width: '92%', height: 64, borderRadius: 16, background: 'rgba(255,255,255,0.06)' }} />
              </div>
            ) : activeHeroMovie ? (
              <div key={activeHeroMovie.movieId} className="home-slide-copy">
                <span className="home-hero-kicker">
                  <Sparkles size={14} />
                  {t('home.topTrending')}
                </span>
                <h1 className="home-hero-title">{activeHeroMovie.movieName}</h1>
                <div className="home-hero-meta">
                  {activeHeroMovie.movieRequiredAgeSymbol && (
                    <span className="home-hero-chip">{activeHeroMovie.movieRequiredAgeSymbol}</span>
                  )}
                  {activeHeroMovie.movieDuration > 0 && (
                    <span className="home-hero-chip">{activeHeroMovie.movieDuration} min</span>
                  )}
                  <span className="home-hero-chip">{Number(activeHeroMovie.averageRating || 0).toFixed(1)} rating</span>
                  <span className="home-hero-chip">{activeHeroMovie.viewCount} views</span>
                </div>
                <p className="home-hero-copy">
                  {activeHeroMovie.movieDescription || `${activeHeroMovie.paidTicketCount} tickets, ${activeHeroMovie.viewCount} views`}
                </p>
                <div className="home-hero-actions">
                  <button
                    className="btn-primary cta-glow"
                    style={{
                      minHeight: 48,
                      padding: '12px 24px',
                      borderRadius: 'var(--radius-full)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      fontSize: 13,
                      fontWeight: 800,
                      border: 'none',
                      cursor: 'pointer',
                    }}
                    onClick={() => handleMovieClick(activeHeroMovie.movieId)}
                  >
                    <Ticket size={16} /> {t('home.bookNowBadge')}
                  </button>
                  <button
                    className="home-hero-secondary"
                    onClick={() => handleMovieClick(activeHeroMovie.movieId)}
                  >
                    <Play size={16} fill="white" /> {t('home.watchTrailer')}
                  </button>
                </div>
              </div>
            ) : (
              <div className="glass-card" style={{ width: 'min(100%, 620px)', padding: 28 }}>
                <Sparkles size={28} style={{ color: 'var(--accent)', marginBottom: 14 }} />
                <p style={{ color: 'white', fontWeight: 800, margin: 0 }}>{t('home.noTrendingData')}</p>
              </div>
            )}
          </div>

          {heroMovies.length > 1 && (
            <div className="home-hero-thumbs" aria-label="Trending movie list">
              <button
                className="home-hero-nav"
                type="button"
                onClick={() => changeHeroSlide('prev')}
                aria-label="Previous trending movie"
              >
                <ChevronLeft size={20} style={{ transform: 'rotate(90deg)' }} />
              </button>
              <div className="home-hero-thumb-list">
                {heroMovies.map((movie, index) => {
                  const thumb = movie.movieImageUrl || movie.movieBannerUrl || PLACEHOLDER_POSTER;

                  return (
                    <button
                      key={movie.movieId}
                      type="button"
                      className={`home-hero-thumb${index === activeHeroIndex ? ' is-active' : ''}`}
                      onClick={() => setActiveHeroIndex(index)}
                      aria-label={movie.movieName}
                    >
                      <img
                        src={thumb}
                        alt={movie.movieName}
                        loading={index === 0 ? 'eager' : 'lazy'}
                        onError={(event) => {
                          event.currentTarget.onerror = null;
                          event.currentTarget.src = PLACEHOLDER_POSTER;
                        }}
                      />
                    </button>
                  );
                })}
              </div>
              <button
                className="home-hero-nav"
                type="button"
                onClick={() => changeHeroSlide('next')}
                aria-label="Next trending movie"
              >
                <ChevronRight size={20} style={{ transform: 'rotate(90deg)' }} />
              </button>
            </div>
          )}
        </div>

        {/* Quick Booking Bar */}
        <div className="home-hero-booking">
          <QuickBookingBar selectedCity={selectedCity} onCinemaChange={(cinemaId) => {
            setSelectedCinemaId(cinemaId);
          }} posMode={isCashierSales} />
        </div>
      </section>

      {/* ===== TOP TRENDING FEATURE SECTION ===== */}
      <section style={{ width: '100%', maxWidth: 1280, margin: '0 auto', padding: 'clamp(56px, 8vw, 96px) clamp(16px, 4vw, 24px)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'clamp(24px, 5vw, 48px)', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <Sparkles size={16} style={{ color: 'var(--accent)' }} />
              <span style={{ fontSize: 'clamp(10px, 1.5vw, 11px)', color: 'var(--accent)', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 700 }}>{t('home.weeklyLeaders')}</span>
            </div>
            <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 'clamp(1.5rem, 4vw, 2.6rem)', fontWeight: 800, margin: 0 }}>
              {t('home.topTrending')}
            </h2>
          </div>

          <div style={{ display: 'flex', gap: 6, padding: 4, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <button
              onClick={() => setTrendingTab('system')}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
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
                fontWeight: 700,
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

        {loadingTrending ? (
          <div className="home-trending-stage">
            <div style={{ minHeight: 620, borderRadius: 24, background: 'linear-gradient(110deg, rgba(255,255,255,0.04), rgba(255,255,255,0.1), rgba(255,255,255,0.04))', border: '1px solid rgba(255,255,255,0.08)' }} />
            <div className="home-trending-list">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} style={{ height: 94, borderRadius: 18, marginBottom: 8, background: 'rgba(255,255,255,0.06)' }} />
              ))}
            </div>
          </div>
        ) : trendingMovies.length === 0 || !activeTrendingMovie ? (
          <div className="glass-card" style={{ minHeight: 180, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 24 }}>
            <div>
              <Sparkles size={28} style={{ color: 'var(--accent)', margin: '0 auto 12px' }} />
              <p style={{ color: 'white', fontWeight: 700, margin: 0 }}>{t('home.noTrendingData')}</p>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 8 }}>{t('home.noTrendingDesc')}</p>
            </div>
          </div>
        ) : (
          <div className="home-trending-stage">
            <div
              key={activeTrendingMovie.movieId}
              className="home-trending-feature"
              role="button"
              tabIndex={0}
              onClick={() => handleMovieClick(activeTrendingMovie.movieId)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  handleMovieClick(activeTrendingMovie.movieId);
                }
              }}
            >
              <img
                src={activeTrendingMovie.movieBannerUrl || activeTrendingMovie.movieImageUrl || PLACEHOLDER_POSTER}
                alt={activeTrendingMovie.movieName}
                onError={(event) => {
                  event.currentTarget.onerror = null;
                  event.currentTarget.src = PLACEHOLDER_POSTER;
                }}
              />
              <div className="home-trending-rank">{activeTrendingIndex + 1}</div>
              <div className="home-trending-feature-content">
                <div className="home-trending-meta">
                  <span className="home-trending-rating">{Number(activeTrendingMovie.averageRating || 0).toFixed(1)} rating</span>
                  {activeTrendingMovie.movieRequiredAgeSymbol && (
                    <span className="home-trending-genre">{activeTrendingMovie.movieRequiredAgeSymbol}</span>
                  )}
                  <span className="home-trending-genre">{activeTrendingMovie.viewCount} views</span>
                </div>
                <h3 className="home-trending-title">{activeTrendingMovie.movieName}</h3>
                <p className="home-trending-desc">
                  {activeTrendingMovie.movieDescription || `${activeTrendingMovie.paidTicketCount} tickets, ${activeTrendingMovie.viewCount} views`}
                </p>
                <div className="home-trending-actions">
                  <button
                    className="btn-primary cta-glow"
                    style={{
                      minHeight: 48,
                      padding: '12px 24px',
                      borderRadius: 'var(--radius-full)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      fontSize: 13,
                      fontWeight: 800,
                      border: 'none',
                      cursor: 'pointer',
                    }}
                    onClick={(event) => {
                      event.stopPropagation();
                      handleMovieClick(activeTrendingMovie.movieId);
                    }}
                  >
                    <Ticket size={16} /> {t('home.bookNowBadge')}
                  </button>
                  <button
                    className="home-hero-secondary"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleMovieClick(activeTrendingMovie.movieId);
                    }}
                  >
                    <Play size={16} fill="white" /> {t('home.watchTrailer')}
                  </button>
                </div>
              </div>
            </div>

            <aside className="home-trending-list" aria-label="Trending ranking list">
              <h3 className="home-trending-list-title">Ranking</h3>
              {trendingMovies.map((item, index) => (
                <button
                  key={item.movieId}
                  type="button"
                  className={`home-trending-row${index === activeTrendingIndex ? ' is-active' : ''}`}
                  onClick={() => setActiveTrendingIndex(index)}
                  aria-label={item.movieName}
                >
                  <img
                    src={item.movieImageUrl || item.movieBannerUrl || PLACEHOLDER_POSTER}
                    alt={item.movieName}
                    loading={index === 0 ? 'eager' : 'lazy'}
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src = PLACEHOLDER_POSTER;
                    }}
                  />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p className="home-trending-row-title">{item.movieName}</p>
                    <p className="home-trending-row-desc">
                      {item.movieDescription || `${item.paidTicketCount} tickets, ${item.viewCount} views`}
                    </p>
                    <div className="home-trending-row-stats">
                      <span>#{index + 1}</span>
                      <span>{Number(item.averageRating || 0).toFixed(1)} rating</span>
                      <span>{item.viewCount} views</span>
                    </div>
                  </div>
                </button>
              ))}
            </aside>
          </div>
        )}
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
                                {t('home.releaseDate', 'Release Date')}: {new Date(movie.startedDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
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
