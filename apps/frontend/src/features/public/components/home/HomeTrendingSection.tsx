import React from 'react';
import { Sparkles, Ticket, Play } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { TrendingMovie } from '../../../../types/comment.types';

interface HomeTrendingSectionProps {
  trendingMovies: TrendingMovie[];
  activeTrendingIndex: number;
  setActiveTrendingIndex: (index: number) => void;
  loadingTrending: boolean;
  trendingTab: 'system' | 'local';
  setTrendingTab: (tab: 'system' | 'local') => void;
  selectedCity: string;
  onMovieClick: (movieId: string) => void;
  placeholderPoster: string;
}

export const HomeTrendingSection: React.FC<HomeTrendingSectionProps> = ({
  trendingMovies,
  activeTrendingIndex,
  setActiveTrendingIndex,
  loadingTrending,
  trendingTab,
  setTrendingTab,
  selectedCity,
  onMovieClick,
  placeholderPoster,
}) => {
  const { t } = useTranslation();
  const activeTrendingMovie = trendingMovies[activeTrendingIndex] ?? trendingMovies[0];

  return (
    <section
      style={{
        width: '100%',
        maxWidth: 1280,
        margin: '0 auto',
        padding: 'clamp(56px, 8vw, 96px) clamp(16px, 4vw, 24px)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 'clamp(24px, 5vw, 48px)',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <Sparkles size={16} style={{ color: 'var(--accent)' }} />
            <span
              style={{
                fontSize: 'clamp(10px, 1.5vw, 11px)',
                color: 'var(--accent)',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                fontWeight: 700,
              }}
            >
              {t('home.weeklyLeaders')}
            </span>
          </div>
          <h2
            style={{
              fontFamily: "'Montserrat', sans-serif",
              fontSize: 'clamp(1.5rem, 4vw, 2.6rem)',
              fontWeight: 800,
              margin: 0,
            }}
          >
            {t('home.topTrending')}
          </h2>
        </div>

        <div
          style={{
            display: 'flex',
            gap: 6,
            padding: 4,
            borderRadius: 12,
            backgroundColor: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.05)',
          }}
        >
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
          <div
            style={{
              minHeight: 620,
              borderRadius: 24,
              background:
                'linear-gradient(110deg, rgba(255,255,255,0.04), rgba(255,255,255,0.1), rgba(255,255,255,0.04))',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          />
          <div className="home-trending-list">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                style={{
                  height: 94,
                  borderRadius: 18,
                  marginBottom: 8,
                  background: 'rgba(255,255,255,0.06)',
                }}
              />
            ))}
          </div>
        </div>
      ) : trendingMovies.length === 0 || !activeTrendingMovie ? (
        <div
          className="glass-card"
          style={{
            minHeight: 180,
            borderRadius: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: 24,
          }}
        >
          <div>
            <Sparkles size={28} style={{ color: 'var(--accent)', margin: '0 auto 12px' }} />
            <p style={{ color: 'white', fontWeight: 700, margin: 0 }}>{t('home.noTrendingData')}</p>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 8 }}>
              {t('home.noTrendingDesc')}
            </p>
          </div>
        </div>
      ) : (
        <div className="home-trending-stage">
          <div
            key={activeTrendingMovie.movieId}
            className="home-trending-feature"
            role="button"
            tabIndex={0}
            onClick={() => onMovieClick(activeTrendingMovie.movieId)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onMovieClick(activeTrendingMovie.movieId);
              }
            }}
          >
            <img
              src={
                activeTrendingMovie.movieBannerUrl ||
                activeTrendingMovie.movieImageUrl ||
                placeholderPoster
              }
              alt={activeTrendingMovie.movieName}
              onError={(event) => {
                event.currentTarget.onerror = null;
                event.currentTarget.src = placeholderPoster;
              }}
            />
            <div className="home-trending-rank">{activeTrendingIndex + 1}</div>
            <div className="home-trending-feature-content">
              <div className="home-trending-meta">
                <span className="home-trending-rating">
                  {Number(activeTrendingMovie.averageRating || 0).toFixed(1)} rating
                </span>
                {activeTrendingMovie.movieRequiredAgeSymbol && (
                  <span className="home-trending-genre">
                    {activeTrendingMovie.movieRequiredAgeSymbol}
                  </span>
                )}
                <span className="home-trending-genre">{activeTrendingMovie.viewCount} views</span>
              </div>
              <h3 className="home-trending-title">{activeTrendingMovie.movieName}</h3>
              <p className="home-trending-desc">
                {activeTrendingMovie.movieDescription ||
                  `${activeTrendingMovie.paidTicketCount} tickets, ${activeTrendingMovie.viewCount} views`}
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
                    onMovieClick(activeTrendingMovie.movieId);
                  }}
                >
                  <Ticket size={16} /> {t('home.bookNowBadge')}
                </button>
                <button
                  className="home-hero-secondary"
                  onClick={(event) => {
                    event.stopPropagation();
                    onMovieClick(activeTrendingMovie.movieId);
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
                  src={item.movieImageUrl || item.movieBannerUrl || placeholderPoster}
                  alt={item.movieName}
                  loading={index === 0 ? 'eager' : 'lazy'}
                  onError={(event) => {
                    event.currentTarget.onerror = null;
                    event.currentTarget.src = placeholderPoster;
                  }}
                />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p className="home-trending-row-title">{item.movieName}</p>
                  <p className="home-trending-row-desc">
                    {item.movieDescription ||
                      `${item.paidTicketCount} tickets, ${item.viewCount} views`}
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
  );
};
