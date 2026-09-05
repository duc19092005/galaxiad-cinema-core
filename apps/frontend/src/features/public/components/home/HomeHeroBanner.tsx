import React from 'react';
import { Sparkles, Play, Ticket, Film, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

export interface HeroMovieItem {
  movieId: string;
  movieName: string;
  movieImageUrl?: string;
  movieBannerUrl?: string;
  movieDescription?: string;
  movieDuration?: number;
  averageRating?: number;
  viewCount?: number;
  paidTicketCount?: number;
  movieRequiredAgeSymbol?: string;
  _fromBanner?: boolean;
  _bannerTitle?: string;
  _bannerType?: string;
  _itemExtra?: string;
}

interface HomeHeroBannerProps {
  heroMovies: HeroMovieItem[];
  activeHeroIndex: number;
  setActiveHeroIndex: (index: number | ((prev: number) => number)) => void;
  loadingTrending: boolean;
  onMovieClick: (movieId: string) => void;
  placeholderPoster: string;
  heroImg: string;
}

export const HomeHeroBanner: React.FC<HomeHeroBannerProps> = ({
  heroMovies,
  activeHeroIndex,
  setActiveHeroIndex,
  loadingTrending,
  onMovieClick,
  placeholderPoster,
  heroImg,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const activeHeroMovie = heroMovies[activeHeroIndex] ?? heroMovies[0];
  const activeHeroImage =
    activeHeroMovie?.movieBannerUrl || activeHeroMovie?.movieImageUrl || placeholderPoster;

  const changeHeroSlide = (direction: 'prev' | 'next') => {
    if (heroMovies.length === 0) return;

    setActiveHeroIndex((current) => {
      if (typeof current !== 'number') return 0;
      if (direction === 'prev') {
        return current === 0 ? heroMovies.length - 1 : current - 1;
      }
      return (current + 1) % heroMovies.length;
    });
  };

  return (
    <section className="home-hero-shell">
      <div className="home-hero-bg">
        {activeHeroMovie ? (
          <>
            {/* Soft photo wash */}
            <img
              key={`fill-${activeHeroMovie.movieId}-${activeHeroImage}`}
              className="home-hero-bg-fill"
              src={activeHeroImage}
              alt=""
              aria-hidden
              onError={(event) => {
                event.currentTarget.onerror = null;
                event.currentTarget.src = placeholderPoster;
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
                  event.currentTarget.src = placeholderPoster;
                }}
              />
            </div>
          </>
        ) : (
          <>
            <img className="home-hero-bg-fill" src={heroImg} alt="" aria-hidden />
            <div className="home-hero-stage">
              <img className="home-hero-bg-main" src={heroImg} alt="Cinema theater" />
            </div>
          </>
        )}
      </div>

      <div className="home-hero-content">
        <div className="home-hero-main">
          {loadingTrending ? (
            <div className="glass-card" style={{ width: 'min(100%, 620px)', minHeight: 260, padding: 28 }}>
              <Loader2
                size={28}
                style={{
                  color: 'var(--accent)',
                  animation: 'spin 1s linear infinite',
                  marginBottom: 18,
                }}
              />
              <div
                style={{
                  width: '68%',
                  height: 22,
                  borderRadius: 999,
                  background: 'rgba(255,255,255,0.08)',
                  marginBottom: 16,
                }}
              />
              <div
                style={{
                  width: '92%',
                  height: 64,
                  borderRadius: 16,
                  background: 'rgba(255,255,255,0.06)',
                }}
              />
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
                  <span
                    className="home-hero-chip"
                    style={{
                      background: 'rgba(255,138,0,0.2)',
                      color: '#ff8a00',
                      fontWeight: 800,
                    }}
                  >
                    {activeHeroMovie._itemExtra}
                  </span>
                ) : (
                  <>
                    {activeHeroMovie.movieRequiredAgeSymbol && (
                      <span className="home-hero-chip">{activeHeroMovie.movieRequiredAgeSymbol}</span>
                    )}
                    {typeof activeHeroMovie.movieDuration === 'number' && activeHeroMovie.movieDuration > 0 && (
                      <span className="home-hero-chip">{activeHeroMovie.movieDuration} min</span>
                    )}
                    {typeof activeHeroMovie.averageRating === 'number' && activeHeroMovie.averageRating > 0 && (
                      <span className="home-hero-chip">
                        {Number(activeHeroMovie.averageRating || 0).toFixed(1)} rating
                      </span>
                    )}
                    {typeof activeHeroMovie.viewCount === 'number' && activeHeroMovie.viewCount > 0 && (
                      <span className="home-hero-chip">{activeHeroMovie.viewCount} views</span>
                    )}
                  </>
                )}
              </div>
              <p className="home-hero-copy">{activeHeroMovie.movieDescription || ''}</p>
              <div className="home-hero-actions">
                {activeHeroMovie._bannerType === 'HotVouchers' ? (
                  <>
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
                      onClick={() => navigate('/offers')}
                    >
                      <Ticket size={16} /> {t('home.exploreNow', 'Tìm hiểu ngay')}
                    </button>
                    {activeHeroMovie._itemExtra && (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '10px 20px',
                          borderRadius: 'var(--radius-full)',
                          background: 'rgba(255,255,255,0.1)',
                          color: '#fff',
                          fontWeight: 800,
                          fontSize: 13,
                          backdropFilter: 'blur(8px)',
                        }}
                      >
                        {activeHeroMovie._itemExtra}
                      </span>
                    )}
                  </>
                ) : activeHeroMovie._bannerType === 'Upcoming' ? (
                  <>
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
                      onClick={() => onMovieClick(activeHeroMovie.movieId)}
                    >
                      <Film size={16} /> {t('home.viewDetails', 'Xem chi tiết')}
                    </button>
                    <button className="home-hero-secondary" onClick={() => navigate('/offers')}>
                      <Sparkles size={16} /> {t('home.viewAllUpcoming', 'Xem tất cả sắp chiếu')}
                    </button>
                  </>
                ) : (
                  <>
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
                      onClick={() => onMovieClick(activeHeroMovie.movieId)}
                    >
                      <Ticket size={16} /> {t('home.bookNowBadge')}
                    </button>
                    <button
                      className="home-hero-secondary"
                      onClick={() => onMovieClick(activeHeroMovie.movieId)}
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
                  const thumb = movie.movieImageUrl || movie.movieBannerUrl || placeholderPoster;

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
                          event.currentTarget.src = placeholderPoster;
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
            <div
              className="home-hero-counter"
              style={{
                textAlign: 'center',
                marginTop: 8,
                color: 'rgba(255,255,255,0.5)',
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '0.1em',
              }}
            >
              {activeHeroIndex + 1} / {heroMovies.length}
            </div>
          </>
        )}
      </div>
    </section>
  );
};
