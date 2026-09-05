// src/features/public/HomePage.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Cookies from 'js-cookie';
import { publicApi } from '../../api/publicApi';
import { commentApi } from '../../api/commentApi';
import type { ApiErrorResponse } from '../../types/auth.types';
import type { PublicMovieListItem } from '../../types/public.types';
import type { TrendingMovie } from '../../types/comment.types';
import Header from '../../components/Header';
import BackToTop from '../../components/BackToTop';
import PublicFooter from '../../components/PublicFooter';
import QuickBookingBar from './components/QuickBookingBar';
import SurveyModal from '../../components/SurveyModal';
import { recommendationApi, type RecommendedMovie } from '../../api/recommendationApi';
import { HomeHeroBanner, type HeroMovieItem } from './components/home/HomeHeroBanner';
import { HomeTrendingSection } from './components/home/HomeTrendingSection';
import { HomeMovieCarousels } from './components/home/HomeMovieCarousels';
import './HomePage.css';

const IMG_BASE = 'https://lh3.googleusercontent.com/aida-public/';
const HERO_IMG =
  IMG_BASE +
  'AB6AXuBb-6tDUgXoRgmgTRBXwngoVTj0smOmB_NZPmcLz1kiOTfMsZE0q1zTRpwjaDJODAErtBJ69LZgGfxSCF235D75zmh3x90AFKmA4E50fgujmCJDv_krUSKoqOXBtr_0Z6tQHY2yYzlnyzvt3W84u1BzPRod5sWHQqooJXYQDH3li2GMZsqPNhuYHBa0rR_CYURrjmM2OHScCUYex2_0lm6k-PzDwfgVk2s3Wd8hToSbNZvc0g_kD8RZzigLOWt0bPO0hif73yxHvNs';
const PLACEHOLDER_POSTER =
  'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=500';

interface HomePageProps {
  mode?: 'public' | 'cashier-sales';
}

const HomePage: React.FC<HomePageProps> = ({ mode = 'public' }) => {
  const navigate = useNavigate();
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
  const [selectedCity, setSelectedCity] = useState<string>(
    () => localStorage.getItem('user_selected_city') || '',
  );
  // Cinema filter state (driven by QuickBookingBar selection)
  const [selectedCinemaId, setSelectedCinemaId] = useState<string>('All');

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
      setSelectedCinemaId('All');
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
        if (cancelled) return;
        const items = response.data || [];
        setNowShowing(items.filter((m) => !m.isCommingSoon));
        setComingSoon(items.filter((m) => m.isCommingSoon));
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
    return () => {
      cancelled = true;
    };
  }, [selectedCity, selectedCinemaId, navigate]);

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
    return () => {
      cancelled = true;
    };
  }, [selectedCinemaId]);

  const fetchTrendingMovies = async () => {
    setLoadingTrending(true);
    try {
      const params: any = {
        days: 30,
        take: 5,
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

  useEffect(() => {
    fetchTrendingMovies();
  }, [selectedCity, trendingTab]);

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

  // ── Survey status check & recommendation loader ──
  useEffect(() => {
    const userInfo = localStorage.getItem('user_info');
    if (isCashierSales) return;
    if (!userInfo) return;

    const checkSurveyAndLoad = async () => {
      try {
        await recommendationApi.getSurveyStatus();
        setSurveyCompleted(true);
        loadRecommendations();
      } catch {
        // Not authenticated or server error
      }
    };
    checkSurveyAndLoad();
  }, [isCashierSales]);

  const handleSurveyComplete = () => {
    setShowSurvey(false);
    setSurveyCompleted(true);
    loadRecommendations();
  };

  // Merge banner items + trending movies for hero slider
  const heroMovies: HeroMovieItem[] = useMemo(() => {
    const bannerItems = banners.flatMap((b: any) =>
      (b.items || []).map((item: any) => ({
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
        _bannerType: b.contentType,
        _itemExtra: item.extra,
      })),
    );

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
    } catch {
      /* use default */
    }
    const interval = setInterval(() => {
      setActiveHeroIndex((prev) => (prev + 1) % heroMovies.length);
    }, intervalMs);
    return () => clearInterval(interval);
  }, [heroMovies, banners]);

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

  return (
    <>
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: 'var(--bg-base)',
          color: 'var(--text-primary)',
          overflowX: 'hidden',
        }}
      >
        {/* Redesigned Unified Header */}
        <Header />

        {/* Hero Slider */}
        <HomeHeroBanner
          heroMovies={heroMovies}
          activeHeroIndex={activeHeroIndex}
          setActiveHeroIndex={setActiveHeroIndex}
          loadingTrending={loadingTrending}
          onMovieClick={handleMovieClick}
          placeholderPoster={PLACEHOLDER_POSTER}
          heroImg={HERO_IMG}
        />

        {/* Quick Booking Bar */}
        <div
          style={{
            width: '100%',
            maxWidth: 1000,
            margin: '0 auto',
            padding: '0 16px',
            boxSizing: 'border-box',
          }}
        >
          <QuickBookingBar
            selectedCity={selectedCity}
            onCinemaChange={(cinemaId) => {
              setSelectedCinemaId(cinemaId);
            }}
            posMode={isCashierSales}
          />
        </div>

        {/* Top Trending Section */}
        <HomeTrendingSection
          trendingMovies={trendingMovies}
          activeTrendingIndex={activeTrendingIndex}
          setActiveTrendingIndex={setActiveTrendingIndex}
          loadingTrending={loadingTrending}
          trendingTab={trendingTab}
          setTrendingTab={setTrendingTab}
          selectedCity={selectedCity}
          onMovieClick={handleMovieClick}
          placeholderPoster={PLACEHOLDER_POSTER}
        />

        {/* Carousels: Now Showing, AI For You, Coming Soon */}
        <HomeMovieCarousels
          nowShowing={nowShowing}
          comingSoon={comingSoon}
          recommendations={recommendations}
          loading={loading}
          loadingRecs={loadingRecs}
          error={error}
          surveyCompleted={surveyCompleted}
          isCashierSales={isCashierSales}
          onMovieClick={handleMovieClick}
          onOpenSurvey={() => setShowSurvey(true)}
          placeholderPoster={PLACEHOLDER_POSTER}
        />

        {/* Footer */}
        <PublicFooter />
      </div>

      <BackToTop />

      {/* Survey Modal */}
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
