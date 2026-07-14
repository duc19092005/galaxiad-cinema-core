// src/features/public/HomePage.tsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, AlertCircle, Loader2,
  Sparkles, Play, Ticket, Film,
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

  // ── Dynamic Banner State ──
  const [banners, setBanners] = useState<any[]>([]);

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

  // ── Fetch Banners ──
  useEffect(() => {
    let cancelled = false;
    const fetchBanners = async () => {
      try {
        const cinemaId = selectedCinemaId !== 'All' ? selectedCinemaId : undefined;
        const response = await publicApi.getBanners(cinemaId);
        if (!cancelled && response.data) {
          setBanners(response.data);
        }
      } catch {
        // Silent fail — banners are optional
      }
    };
    fetchBanners();
    return () => { cancelled = true; };
  }, [selectedCinemaId]);

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

  // Merge banner items + trending movies for hero slider
  const heroMovies = useMemo(() => {
    // If banners have items, use them (they're curated by admin/system)
    const bannerItems = banners.flatMap((b: any) => (b.items || []).map((item: any) => ({
      movieId: item.id,
      movieName: item.name,
      movieImageUrl: item.imageUrl,
      movieBannerUrl: item.imageUrl,
      movieDescription: item.description,
      movieDuration: 0,
      averageRating: 0,
      viewCount: 0,
      paidTicketCount: 0,
      movieRequiredAgeSymbol: '',
      _fromBanner: true,
      _bannerTitle: b.title,
      _bannerType: b.contentType, // 'Trending' | 'Upcoming' | 'HotVouchers' | 'Fixed'
      _itemExtra: item.extra, // e.g. "5% off" for vouchers
    })));
    
    // If we have banner items, use them; otherwise fall back to trending movies
    if (bannerItems.length > 0) {
      return bannerItems.slice(0, 10);
    }
    return trendingMovies.slice(0, 5);
  }, [banners, trendingMovies]);

  // ── Auto-rotate hero slides ──
  useEffect(() => {
    if (heroMovies.length <= 1) return;
    let intervalMs = 5000;
    try {
      const cfg = JSON.parse(banners[0]?.contentConfig || '{}');
      if (cfg.autoRotate === false) return;
      if (cfg.rotateIntervalMs) intervalMs = cfg.rotateIntervalMs;
    } catch { /* use default */ }
    const interval = setInterval(() => {
      setActiveHeroIndex(prev => (prev + 1) % heroMovies.length);
    }, intervalMs);
    return () => clearInterval(interval);
  }, [heroMovies, banners]);

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
          from { opacity: 0.65; }
          to { opacity: 1; }
        }
        @keyframes homeCopySlide {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes homeFeatureSlide {
          from { opacity: 0; }
          to { opacity: 1; }
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
          /* Header + tall ~16:9 stage so banner cover fills the frame */
          --hero-header-offset: 72px;
          --hero-stage-h: max(520px, min(56.25vw, 760px, calc(92vh - 72px)));
          height: calc(var(--hero-header-offset) + var(--hero-stage-h));
          min-height: calc(var(--hero-header-offset) + 520px);
          max-height: 96vh;
          display: flex;
          align-items: stretch;
          overflow: hidden;
          isolation: isolate;
        }
        .home-hero-bg {
          position: absolute;
          inset: 0;
          z-index: 0;
          overflow: hidden;
          background: #120f0d;
        }
        /* Soft fill if image edges need blend */
        .home-hero-bg-fill {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center center;
          display: block;
          filter: blur(24px) saturate(1.15) brightness(0.45);
          transform: scale(1.04);
          pointer-events: none;
          user-select: none;
        }
        /* Stage under header — full width × tall height */
        .home-hero-stage {
          position: absolute;
          top: var(--hero-header-offset);
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 0;
          overflow: hidden;
        }
        /* Cover full stage (no letterbox); taller shell = less crop zoom */
        .home-hero-bg-main {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center center;
          display: block;
          filter: saturate(1.06) brightness(0.95);
          transition: opacity 0.28s ease;
          animation: homeBgSlide 0.28s ease-out both;
        }
        .home-hero-bg::after {
          content: "";
          position: absolute;
          inset: 0;
          z-index: 1;
          pointer-events: none;
          background:
            linear-gradient(100deg, rgba(12,10,12,0.78) 0%, rgba(12,10,12,0.38) 32%, rgba(12,10,12,0.1) 55%, rgba(12,10,12,0.3) 100%),
            linear-gradient(180deg, rgba(12,10,12,0.4) 0%, rgba(12,10,12,0.06) 26%, rgba(12,10,12,0.14) 62%, rgba(12,10,12,0.72) 100%);
        }
        .home-hero-content {
          position: relative;
          z-index: 2;
          width: 100%;
          max-width: 1280px;
          margin: 0 auto;
          padding: calc(var(--hero-header-offset) + 20px) clamp(16px, 4vw, 24px) clamp(40px, 5vw, 64px);
          display: grid;
          grid-template-columns: minmax(0, 1fr) 150px;
          gap: clamp(24px, 6vw, 72px);
          align-items: center;
          box-sizing: border-box;
          min-width: 0;
        }
        .home-hero-main {
          max-width: 720px;
          min-width: 0;
        }
        /* Glass panel for title / labels — blur so text stays readable on busy banners */
        .home-slide-copy {
          animation: homeCopySlide 0.16s ease-out both;
          padding: clamp(16px, 2.4vw, 28px);
          border-radius: 22px;
          background: linear-gradient(145deg, rgba(18,14,16,0.52), rgba(18,14,16,0.28));
          border: 1px solid rgba(255,255,255,0.12);
          box-shadow: 0 18px 48px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.06);
          backdrop-filter: blur(18px) saturate(1.2);
          -webkit-backdrop-filter: blur(18px) saturate(1.2);
        }
        .home-hero-kicker {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 7px 12px;
          border-radius: 999px;
          color: #ffb04a;
          background: rgba(255,138,0,0.18);
          border: 1px solid rgba(255,138,0,0.32);
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }
        .home-hero-title {
          margin: 16px 0 0;
          color: #fff;
          font-family: 'Montserrat', sans-serif;
          font-size: clamp(2.1rem, 6.2vw, 4.6rem);
          line-height: 1.05;
          font-weight: 800;
          letter-spacing: 0;
          text-transform: uppercase;
          text-wrap: balance;
          text-shadow: 0 2px 18px rgba(0,0,0,0.45), 0 1px 2px rgba(0,0,0,0.55);
        }
        .home-hero-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 18px;
        }
        .home-hero-chip {
          padding: 7px 11px;
          border-radius: 999px;
          color: rgba(255,255,255,0.92);
          background: rgba(0,0,0,0.28);
          border: 1px solid rgba(255,255,255,0.14);
          font-size: 12px;
          font-weight: 700;
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.18);
        }
        .home-hero-copy {
          margin: 18px 0 0;
          max-width: 620px;
          color: rgba(255,255,255,0.88);
          font-size: clamp(14px, 2vw, 16px);
          line-height: 1.7;
          text-shadow: 0 1px 8px rgba(0,0,0,0.35);
        }
        .home-hero-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 24px;
        }
        .home-hero-secondary {
          min-height: 48px;
          padding: 12px 22px;
          border-radius: var(--radius-full);
          border: 1px solid rgba(255,255,255,0.16);
          background: rgba(0,0,0,0.28);
          color: white;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
          transition: transform 0.2s ease, background 0.2s ease;
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }
        .home-hero-secondary:hover {
          background: rgba(255,255,255,0.12);
        }
        .home-hero-secondary:active {
          transform: translateY(1px);
        }
        .home-hero-counter {
          display: none;
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
          transition: opacity 0.12s ease, border-color 0.12s ease;
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
          border-color: rgba(255,138,0,0.9);
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
          transition: background 0.12s ease;
        }
        .home-hero-nav:hover {
          background: rgba(255,138,0,0.12);
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
          box-shadow: 0 16px 38px rgba(0,0,0,0.28);
          cursor: pointer;
          animation: homeFeatureSlide 0.16s ease-out both;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .home-trending-feature img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          display: block;
          transition: none;
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
          top: 0;
          transform: none;
          z-index: 2;
          min-width: 58px;
          padding: 10px 14px;
          border-radius: 0 0 16px 0;
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
          transition: background 0.12s ease, border-color 0.12s ease;
        }
        .home-trending-row + .home-trending-row {
          margin-top: 8px;
        }
        .home-trending-row:hover,
        .home-trending-row.is-active {
          background: rgba(255,138,0,0.1);
          border-color: rgba(255,138,0,0.22);
        }
        .home-trending-row img {
          width: 72px;
          aspect-ratio: 5 / 7;
          border-radius: 12px;
          object-fit: cover;
          flex: 0 0 auto;
          box-shadow: 0 6px 14px rgba(0,0,0,0.22);
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
        .home-movie-card {
          flex: 0 0 250px;
          border-radius: 16px;
          overflow: hidden;
          cursor: pointer;
          transition: box-shadow 0.12s ease;
          scroll-snap-align: start;
        }
        .home-movie-card:hover {
          box-shadow: 0 8px 22px rgba(0,0,0,0.28);
        }
        @media (max-width: 640px) {
          .home-movie-card {
            flex: 0 0 160px;
          }
        }
        @media (max-width: 480px) {
          .home-movie-card {
            flex: 0 0 140px;
          }
        }
        /* ── Tablet / mobile hero ── */
        @media (max-width: 900px) {
          .home-hero-shell {
            --hero-header-offset: 64px;
            /* Auto height: grow with copy + thumbs — no fixed height clipping */
            height: auto;
            min-height: calc(var(--hero-header-offset) + min(52vh, 420px));
            max-height: none;
            overflow: hidden;
          }
          .home-hero-bg,
          .home-hero-stage {
            top: 0;
            bottom: 0;
            left: 0;
            right: 0;
          }
          .home-hero-stage {
            /* Keep image full-bleed behind content */
            top: 0;
          }
          .home-hero-bg-main {
            object-fit: cover;
            object-position: center 30%;
          }
          .home-hero-bg::after {
            background:
              linear-gradient(180deg, rgba(12,10,12,0.55) 0%, rgba(12,10,12,0.2) 28%, rgba(12,10,12,0.45) 55%, rgba(12,10,12,0.88) 100%),
              linear-gradient(90deg, rgba(12,10,12,0.55) 0%, rgba(12,10,12,0.15) 50%, rgba(12,10,12,0.4) 100%);
          }
          .home-hero-content {
            grid-template-columns: 1fr;
            gap: 14px;
            width: 100%;
            max-width: 100%;
            box-sizing: border-box;
            padding:
              calc(var(--hero-header-offset) + 12px)
              16px
              18px;
            align-items: stretch;
            align-content: end;
          }
          .home-hero-main {
            max-width: 100%;
            width: 100%;
            min-width: 0;
          }
          .home-slide-copy {
            width: 100%;
            max-width: 100%;
            box-sizing: border-box;
            padding: 14px 14px 16px;
            border-radius: 16px;
          }
          .home-hero-title {
            font-size: clamp(1.45rem, 6.5vw, 2.15rem);
            line-height: 1.12;
            margin-top: 10px;
            word-break: break-word;
          }
          .home-hero-meta {
            margin-top: 12px;
            gap: 6px;
          }
          .home-hero-chip {
            font-size: 11px;
            padding: 5px 9px;
          }
          .home-hero-copy {
            margin-top: 12px;
            font-size: 13px;
            line-height: 1.55;
            display: -webkit-box;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
          .home-hero-actions {
            margin-top: 14px;
            gap: 8px;
          }
          .home-hero-actions button,
          .home-hero-secondary {
            font-size: 12px !important;
            padding: 10px 16px !important;
            min-height: 40px !important;
          }
          /* Thumbs: compact horizontal control under copy */
          .home-hero-thumbs {
            position: relative;
            width: 100%;
            max-width: 100%;
            min-height: 0;
            padding: 0 40px;
            box-sizing: border-box;
            display: flex;
            flex-direction: row;
            justify-content: center;
            align-items: center;
            gap: 8px;
          }
          .home-hero-nav {
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            width: 34px;
            height: 34px;
            border-radius: 50%;
            z-index: 2;
            flex-shrink: 0;
          }
          .home-hero-nav:nth-of-type(1) {
            left: 0;
            right: auto;
          }
          .home-hero-nav:nth-of-type(2) {
            right: 0;
            left: auto;
          }
          .home-hero-nav svg {
            transform: none !important;
          }
          .home-hero-thumb-list {
            width: min(160px, 42vw);
            max-width: min(160px, 42vw);
            min-width: 0;
            max-height: none;
            overflow: hidden;
            display: flex;
            flex-direction: row;
            justify-content: center;
            align-items: center;
            gap: 0;
            padding: 0;
          }
          .home-hero-thumb {
            width: 100%;
            max-width: 160px;
            aspect-ratio: 16 / 10;
            flex: 0 0 auto;
            border-radius: 10px;
          }
          .home-hero-thumb img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
            border-radius: 10px;
          }
          .home-hero-thumb:not(.is-active) {
            display: none;
          }
          .home-hero-counter {
            display: none;
          }
        }
        @media (max-width: 640px) {
          .home-hero-shell {
            --hero-header-offset: 56px;
            min-height: calc(var(--hero-header-offset) + min(48vh, 360px));
          }
          .home-hero-content {
            padding:
              calc(var(--hero-header-offset) + 10px)
              12px
              14px;
            gap: 12px;
          }
          .home-slide-copy {
            padding: 12px;
            border-radius: 14px;
            backdrop-filter: blur(14px);
            -webkit-backdrop-filter: blur(14px);
          }
          .home-hero-kicker {
            font-size: 10px;
            padding: 5px 10px;
            letter-spacing: 0.08em;
          }
          .home-hero-title {
            font-size: clamp(1.35rem, 7vw, 1.85rem);
            margin-top: 8px;
          }
          .home-hero-copy {
            -webkit-line-clamp: 2;
            font-size: 12px;
          }
          .home-hero-actions {
            flex-direction: column;
            align-items: stretch;
          }
          .home-hero-actions button,
          .home-hero-secondary {
            width: 100%;
            justify-content: center;
          }
          .home-hero-thumbs {
            padding: 0 36px;
          }
          .home-hero-thumb-list {
            width: min(140px, 48vw);
            max-width: min(140px, 48vw);
          }
          .home-hero-thumb {
            max-width: 140px;
            aspect-ratio: 16 / 10;
          }
        }
        @media (max-width: 380px) {
          .home-hero-title {
            font-size: 1.25rem;
          }
          .home-hero-meta {
            gap: 4px;
          }
          .home-hero-chip {
            font-size: 10px;
            padding: 4px 8px;
          }
        }
        @media (max-width: 980px) {
          .home-trending-stage {
            grid-template-columns: 1fr;
            overflow: hidden;
          }
          .home-trending-feature,
          .home-trending-list {
            min-height: auto !important;
            max-width: 100%;
          }
          .home-trending-list {
            overflow-y: auto;
            max-height: 400px;
            -webkit-overflow-scrolling: touch;
          }
          .home-trending-feature {
            aspect-ratio: 16 / 12;
          }
          .home-trending-feature-content {
            padding: clamp(16px, 4vw, 32px) !important;
          }
          .home-trending-title {
            font-size: clamp(18px, 4vw, 24px) !important;
          }
          .home-trending-desc {
            font-size: 13px;
            display: -webkit-box;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
        }
        @media (max-width: 640px) {
          .home-trending-feature {
            aspect-ratio: 3 / 4;
            max-height: 70vh;
          }
          .home-trending-feature img {
            max-height: 70vh;
          }
          .home-trending-rank {
            top: 18px;
            transform: none;
            font-size: 22px;
          }
          .home-trending-row img {
            width: 62px;
          }
          .home-trending-desc {
            -webkit-line-clamp: 2;
          }
          .home-trending-title {
            font-size: 16px !important;
          }
          .home-trending-actions {
            margin-top: 16px;
          }
          .home-trending-actions button {
            font-size: 12px !important;
            padding: 10px 16px !important;
            min-height: 40px !important;
          }
        }
      `}</style>
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)', overflowX: 'hidden' }}>

      {/* Redesigned Unified Header */}
      <Header />




      <section className="home-hero-shell">
        <div className="home-hero-bg">
          {activeHeroMovie ? (
            <>
              {/* Soft photo wash — no black letterbox */}
              <img
                key={`fill-${activeHeroMovie.movieId}-${activeHeroImage}`}
                className="home-hero-bg-fill"
                src={activeHeroImage}
                alt=""
                aria-hidden
                onError={(event) => {
                  event.currentTarget.onerror = null;
                  event.currentTarget.src = PLACEHOLDER_POSTER;
                }}
              />
              {/* Full image only in area below fixed header */}
              <div className="home-hero-stage">
                <img
                  key={`main-${activeHeroMovie.movieId}-${activeHeroImage}`}
                  className="home-hero-bg-main"
                  src={activeHeroImage}
                  alt={activeHeroMovie.movieName}
                  decoding="async"
                  fetchPriority="high"
                  sizes="100vw"
                  onError={(event) => {
                    event.currentTarget.onerror = null;
                    event.currentTarget.src = PLACEHOLDER_POSTER;
                  }}
                />
              </div>
            </>
          ) : (
            <>
              <img className="home-hero-bg-fill" src={HERO_IMG} alt="" aria-hidden />
              <div className="home-hero-stage">
                <img className="home-hero-bg-main" src={HERO_IMG} alt="Cinema theater" />
              </div>
            </>
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
                  {activeHeroMovie._bannerTitle || t('home.topTrending')}
                </span>
                <h1 className="home-hero-title">{activeHeroMovie.movieName}</h1>
                <div className="home-hero-meta">
                  {activeHeroMovie._bannerType === 'HotVouchers' && activeHeroMovie._itemExtra ? (
                    <span className="home-hero-chip" style={{ background: 'rgba(255,138,0,0.2)', color: '#ff8a00', fontWeight: 800 }}>{activeHeroMovie._itemExtra}</span>
                  ) : (
                    <>
                      {activeHeroMovie.movieRequiredAgeSymbol && (
                        <span className="home-hero-chip">{activeHeroMovie.movieRequiredAgeSymbol}</span>
                      )}
                      {activeHeroMovie.movieDuration > 0 && (
                        <span className="home-hero-chip">{activeHeroMovie.movieDuration} min</span>
                      )}
                      {activeHeroMovie.averageRating > 0 && (
                        <span className="home-hero-chip">{Number(activeHeroMovie.averageRating || 0).toFixed(1)} rating</span>
                      )}
                      {activeHeroMovie.viewCount > 0 && (
                        <span className="home-hero-chip">{activeHeroMovie.viewCount} views</span>
                      )}
                    </>
                  )}
                </div>
                <p className="home-hero-copy">
                  {activeHeroMovie.movieDescription || ''}
                </p>
                <div className="home-hero-actions">
                  {activeHeroMovie._bannerType === 'HotVouchers' ? (
                    <>
                      <button
                        className="btn-primary cta-glow"
                        style={{ minHeight: 48, padding: '12px 24px', borderRadius: 'var(--radius-full)', display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 800, border: 'none', cursor: 'pointer' }}
                        onClick={() => navigate('/offers')}
                      >
                        <Ticket size={16} /> {t('home.exploreNow', 'Tìm hiểu ngay')}
                      </button>
                      {activeHeroMovie._itemExtra && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 'var(--radius-full)', background: 'rgba(255,255,255,0.1)', color: '#fff', fontWeight: 800, fontSize: 13, backdropFilter: 'blur(8px)' }}>
                          {activeHeroMovie._itemExtra}
                        </span>
                      )}
                    </>
                  ) : activeHeroMovie._bannerType === 'Upcoming' ? (
                    <>
                      <button
                        className="btn-primary cta-glow"
                        style={{ minHeight: 48, padding: '12px 24px', borderRadius: 'var(--radius-full)', display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 800, border: 'none', cursor: 'pointer' }}
                        onClick={() => handleMovieClick(activeHeroMovie.movieId)}
                      >
                        <Film size={16} /> {t('home.viewDetails', 'Xem chi tiết')}
                      </button>
                      <button
                        className="home-hero-secondary"
                        onClick={() => navigate('/offers')}
                      >
                        <Sparkles size={16} /> {t('home.viewAllUpcoming', 'Xem tất cả sắp chiếu')}
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className="btn-primary cta-glow"
                        style={{ minHeight: 48, padding: '12px 24px', borderRadius: 'var(--radius-full)', display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 800, border: 'none', cursor: 'pointer' }}
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
                    </>
                  )}
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
            <>
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
            {/* Mobile counter */}
            <div className="home-hero-counter" style={{ textAlign: 'center', marginTop: 8, color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 700, letterSpacing: '0.1em' }}>
              {activeHeroIndex + 1} / {heroMovies.length}
            </div>
          </>
          )}
        </div>
      </section>

      {/* Quick Booking Bar */}
      <div style={{ width: '100%', maxWidth: 1000, margin: '0 auto', padding: '0 16px', boxSizing: 'border-box' }}>
        <QuickBookingBar selectedCity={selectedCity} onCinemaChange={(cinemaId) => {
          setSelectedCinemaId(cinemaId);
        }} posMode={isCashierSales} />
      </div>

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
                      WebkitOverflowScrolling: 'touch',
                      padding: '10px 4px',
                    }}
                  >
                    {nowShowing.slice(0, 10).map(movie => (
                      <div
                        key={movie.movieId}
                        className="glass-card interactive home-movie-card"
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
                    {t('home.forYou')}
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
                    WebkitOverflowScrolling: 'touch',
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
                        {t('home.aiPick')}
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
                      WebkitOverflowScrolling: 'touch',
                      padding: '10px 4px',
                    }}
                  >
                    {comingSoon.slice(0, 10).map(movie => (
                      <div
                        key={movie.movieId}
                        className="glass-card interactive home-movie-card"
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
