import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import type { PublicMovieListItem } from '../../../../types/public.types';
import type { RecommendedMovie } from '../../../../api/recommendationApi';

interface HomeMovieCarouselsProps {
  nowShowing: PublicMovieListItem[];
  comingSoon: PublicMovieListItem[];
  recommendations: RecommendedMovie[];
  loading: boolean;
  loadingRecs: boolean;
  error: string | null;
  surveyCompleted: boolean;
  isCashierSales: boolean;
  onMovieClick: (movieId: string) => void;
  onOpenSurvey: () => void;
  placeholderPoster: string;
}

export const HomeMovieCarousels: React.FC<HomeMovieCarouselsProps> = ({
  nowShowing,
  comingSoon,
  recommendations,
  loading,
  loadingRecs,
  error,
  surveyCompleted,
  isCashierSales,
  onMovieClick,
  onOpenSurvey,
  placeholderPoster,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const nowShowingRef = useRef<HTMLDivElement>(null);
  const comingSoonRef = useRef<HTMLDivElement>(null);

  const scroll = (ref: React.RefObject<HTMLDivElement | null>, direction: 'left' | 'right') => {
    if (ref.current) {
      const scrollAmount = ref.current.clientWidth * 0.75;
      ref.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <section
      style={{
        width: '100%',
        maxWidth: 1280,
        margin: '0 auto',
        padding: 'clamp(32px, 6vw, 60px) clamp(16px, 4vw, 24px)',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 64, minWidth: 0 }}>
        {/* Now Showing Section */}
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              marginBottom: 'clamp(16px, 3vw, 32px)',
            }}
          >
            <div>
              <span
                style={{
                  fontSize: 'clamp(10px, 1.5vw, 11px)',
                  color: 'var(--accent)',
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                  display: 'block',
                  marginBottom: 12,
                }}
              >
                {t('home.nowShowingBadge')}
              </span>
              <h2
                style={{
                  fontFamily: "'Montserrat', sans-serif",
                  fontSize: 'clamp(1.25rem, 4vw, 2rem)',
                  fontWeight: 700,
                  margin: 0,
                }}
              >
                {t('home.nowShowing')}
              </h2>
            </div>
          </div>

          {loading ? (
            <div className="state-center" style={{ minHeight: 300 }}>
              <Loader2
                size={32}
                style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite' }}
              />
              <p style={{ color: 'var(--text-secondary)', marginTop: 'var(--space-16)' }}>
                {t('common.loading', 'Loading movies...')}
              </p>
            </div>
          ) : error ? (
            <div className="state-center" style={{ minHeight: 300 }}>
              <AlertCircle size={40} style={{ color: 'var(--danger)' }} />
              <p style={{ color: 'var(--danger)', marginTop: 'var(--space-16)' }}>{error}</p>
            </div>
          ) : nowShowing.length === 0 ? (
            <div
              className="glass-card"
              style={{
                padding: 48,
                borderRadius: 16,
                textAlign: 'center',
                color: 'var(--text-secondary)',
              }}
            >
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
                    style={{
                      position: 'absolute',
                      left: -20,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      zIndex: 10,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
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
                  {nowShowing.slice(0, 10).map((movie) => (
                    <div
                      key={movie.movieId}
                      className="glass-card interactive home-movie-card"
                      onClick={() => onMovieClick(movie.movieId)}
                    >
                      <div style={{ position: 'relative', width: '100%', paddingTop: '150%' }}>
                        <img
                          src={movie.moviePosterURL || placeholderPoster}
                          alt={movie.movieName}
                          style={{
                            position: 'absolute',
                            inset: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = placeholderPoster;
                          }}
                        />
                      </div>
                      <div style={{ padding: 16 }}>
                        <h3
                          style={{
                            fontSize: 15,
                            fontWeight: 700,
                            marginBottom: 8,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {movie.movieName}
                        </h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {movie.movieFormatInfos
                            .split('/')
                            .filter(Boolean)
                            .map((f: string, i: number) => (
                              <span
                                key={i}
                                style={{
                                  padding: '2px 10px',
                                  borderRadius: 'var(--radius-full)',
                                  fontSize: 11,
                                  fontWeight: 700,
                                  background: 'var(--bg-surface)',
                                  color: 'var(--accent)',
                                  border: '1px solid var(--border-color)',
                                }}
                              >
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
                    style={{
                      position: 'absolute',
                      right: -20,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      zIndex: 10,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
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

        {/* Personalised Recommendation Section */}
        {!isCashierSales && surveyCompleted && (
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                marginBottom: 'clamp(16px, 3vw, 32px)',
                flexWrap: 'wrap',
                gap: 12,
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: 'clamp(10px, 1.5vw, 11px)',
                    color: 'var(--accent)',
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    fontWeight: 600,
                    display: 'block',
                    marginBottom: 12,
                  }}
                >
                  {t('home.forYou')}
                </span>
                <h2
                  style={{
                    fontFamily: "'Montserrat', sans-serif",
                    fontSize: 'clamp(1.25rem, 4vw, 2rem)',
                    fontWeight: 700,
                    margin: 0,
                  }}
                >
                  {t('home.personalizedRecs')}
                </h2>
              </div>
              <button
                onClick={onOpenSurvey}
                style={{
                  fontSize: 12,
                  color: 'var(--accent)',
                  background: 'rgba(255,138,0,0.08)',
                  border: '1px solid rgba(255,138,0,0.2)',
                  borderRadius: 8,
                  padding: '7px 16px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,138,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,138,0,0.08)';
                }}
              >
                {t('home.updatePreferences')}
              </button>
            </div>

            {loadingRecs ? (
              <div style={{ display: 'flex', gap: 20, overflowX: 'hidden', padding: '10px 4px' }}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    style={{
                      flex: '0 0 220px',
                      height: 340,
                      borderRadius: 16,
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}
                  />
                ))}
              </div>
            ) : recommendations.length === 0 ? (
              <div
                className="glass-card"
                style={{ padding: '36px 24px', borderRadius: 16, textAlign: 'center' }}
              >
                <Sparkles size={28} style={{ color: 'var(--accent)', margin: '0 auto 12px' }} />
                <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: 14 }}>
                  {t('home.noRecsYet')}
                </p>
              </div>
            ) : (
              <div
                className="hide-scrollbar"
                style={{
                  display: 'flex',
                  gap: 20,
                  overflowX: 'auto',
                  padding: '10px 4px',
                  scrollSnapType: 'x mandatory',
                  scrollBehavior: 'smooth',
                  WebkitOverflowScrolling: 'touch',
                }}
              >
                {recommendations.map((movie) => (
                  <div
                    key={movie.movieId}
                    className="glass-card interactive"
                    style={{
                      flex: '0 0 220px',
                      borderRadius: 16,
                      overflow: 'hidden',
                      cursor: 'pointer',
                      scrollSnapAlign: 'start',
                      position: 'relative',
                      transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                    }}
                    onClick={() => onMovieClick(movie.movieId)}
                  >
                    {/* AI badge */}
                    <div
                      style={{
                        position: 'absolute',
                        top: 10,
                        right: 10,
                        zIndex: 2,
                        background: 'linear-gradient(135deg, #ff8a00, #ff6b00)',
                        borderRadius: 6,
                        padding: '3px 8px',
                        fontSize: 10,
                        fontWeight: 800,
                        color: 'black',
                        boxShadow: '0 2px 8px rgba(255,138,0,0.4)',
                      }}
                    >
                      {t('home.aiPick')}
                    </div>
                    <div style={{ position: 'relative', width: '100%', paddingTop: '140%' }}>
                      <img
                        src={movie.moviePosterURL || placeholderPoster}
                        alt={movie.movieName}
                        style={{
                          position: 'absolute',
                          inset: 0,
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = placeholderPoster;
                        }}
                      />
                    </div>
                    <div style={{ padding: 14 }}>
                      <h3
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          marginBottom: 6,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {movie.movieName}
                      </h3>
                      <p
                        style={{
                          fontSize: 12,
                          color: 'var(--text-secondary)',
                          margin: 0,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
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
            <span
              style={{
                fontSize: 'clamp(10px, 1.5vw, 11px)',
                color: 'var(--accent)',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                fontWeight: 600,
                display: 'block',
                marginBottom: 12,
              }}
            >
              {t('home.comingSoonBadge', 'Coming Soon')}
            </span>
            <h2
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontSize: 'clamp(1.25rem, 4vw, 2rem)',
                fontWeight: 700,
                margin: 0,
              }}
            >
              {t('home.comingSoon', 'Coming Soon')}
            </h2>
          </div>

          {comingSoon.length === 0 ? (
            <div
              className="glass-card"
              style={{ padding: '36px 24px', borderRadius: 16, textAlign: 'center' }}
            >
              <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: 14 }}>
                {t('home.noComingSoon', 'No list available at the moment')}
              </p>
            </div>
          ) : (
            <div>
              <div style={{ position: 'relative' }}>
                {/* Prev Button */}
                {comingSoon.length > 4 && (
                  <button
                    onClick={() => scroll(comingSoonRef, 'left')}
                    className="carousel-nav carousel-nav-prev"
                    style={{
                      position: 'absolute',
                      left: -20,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      zIndex: 10,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
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
                  {comingSoon.slice(0, 10).map((movie) => (
                    <div
                      key={movie.movieId}
                      className="glass-card interactive home-movie-card"
                      onClick={() => onMovieClick(movie.movieId)}
                    >
                      <div style={{ position: 'relative', width: '100%', paddingTop: '150%' }}>
                        <img
                          src={movie.moviePosterURL || placeholderPoster}
                          alt={movie.movieName}
                          style={{
                            position: 'absolute',
                            inset: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = placeholderPoster;
                          }}
                        />
                      </div>
                      <div style={{ padding: 16 }}>
                        <h3
                          style={{
                            fontSize: 15,
                            fontWeight: 700,
                            marginBottom: 8,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {movie.movieName}
                        </h3>
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 6,
                            alignItems: 'flex-start',
                          }}
                        >
                          <span
                            style={{
                              padding: '2px 10px',
                              borderRadius: 'var(--radius-full)',
                              fontSize: 11,
                              fontWeight: 700,
                              background: 'var(--bg-surface)',
                              color: 'var(--accent)',
                              display: 'inline-block',
                            }}
                          >
                            {t('home.comingSoon')}
                          </span>
                          {movie.startedDate && (
                            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                              {t('home.releaseDate', 'Release Date')}:{' '}
                              {new Date(movie.startedDate).toLocaleDateString('vi-VN', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                              })}
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
                    style={{
                      position: 'absolute',
                      right: -20,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      zIndex: 10,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
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
  );
};
