// src/features/public/AllMoviesPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, AlertCircle, Loader2, Film, Calendar } from 'lucide-react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { publicApi } from '../../api/publicApi';
import type { ApiErrorResponse } from '../../types/auth.types';
import type { PublicMovieListItem } from '../../types/public.types';
import Header from '../../components/Header';
import BackToTop from '../../components/BackToTop';

const PLACEHOLDER_POSTER = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=500';

const AllMoviesPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  // Selected tab: 'now-showing' or 'coming-soon'
  const [activeTab, setActiveTab] = useState<'now-showing' | 'coming-soon'>(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    return tabParam === 'coming-soon' ? 'coming-soon' : 'now-showing';
  });

  const [movies, setMovies] = useState<PublicMovieListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters state (sync with header/homepage selection)
  const [selectedCity, setSelectedCity] = useState<string>(() => localStorage.getItem('user_selected_city') || '');
  const [selectedCinemaId, setSelectedCinemaId] = useState<string>('All');

  // Pagination state
  const ITEMS_PER_PAGE = 12;
  const [currentPage, setCurrentPage] = useState(1);

  // Sync city selection from header
  useEffect(() => {
    const handleCityChange = () => {
      setSelectedCity(localStorage.getItem('user_selected_city') || '');
      setSelectedCinemaId('All');
      setCurrentPage(1);
    };
    window.addEventListener('user_selected_city_changed', handleCityChange);
    return () => window.removeEventListener('user_selected_city_changed', handleCityChange);
  }, []);

  // Fetch movies when active tab, city, or cinema changes
  useEffect(() => {
    fetchMovies();
  }, [activeTab, selectedCity, selectedCinemaId]);

  const fetchMovies = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await publicApi.getAllMovies({
        city: selectedCity || undefined,
        cinemaId: selectedCinemaId !== 'All' ? selectedCinemaId : undefined,
        pageSize: 100 // Load all for client-side pagination
      });
      const items = response.data || [];
      
      if (activeTab === 'now-showing') {
        setMovies(items.filter(m => !m.isCommingSoon));
      } else {
        setMovies(items.filter(m => m.isCommingSoon));
      }
      setCurrentPage(1);
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
      } else {
        setError('Cannot connect to server.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Pagination calculations
  const totalPages = Math.ceil(movies.length / ITEMS_PER_PAGE) || 1;
  const slicedMovies = movies.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)', overflowX: 'hidden' }}>
      <Header />

      {/* Banner / Title Area */}
      <section style={{
        position: 'relative',
        paddingTop: 140,
        paddingBottom: 40,
        textAlign: 'center',
        background: 'linear-gradient(to bottom, rgba(5,20,36,0.3) 0%, var(--bg-base) 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.05)'
      }}>
        <h1 style={{
          fontFamily: "'Montserrat', sans-serif",
          fontSize: 'clamp(24px, 5vw, 36px)',
          fontWeight: 800,
          color: 'white',
          marginBottom: 12
        }}>
          {t('allmovies.title', 'Danh Sách Phim')}
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, maxWidth: 600, margin: '0 auto', padding: '0 16px' }}>
          {selectedCity ? `${t('allmovies.showingIn', 'Đang chiếu tại')} ${selectedCity}` : t('allmovies.browseAll', 'Khám phá tất cả bộ phim bom tấn đỉnh cao')}
        </p>

        {/* Tab Controls */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 16,
          marginTop: 32,
          padding: '0 16px'
        }}>
          <button
            onClick={() => {
              setActiveTab('now-showing');
              navigate('/movies?tab=now-showing');
            }}
            className="interactive"
            style={{
              padding: '12px 28px',
              borderRadius: 12,
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'all 0.3s',
              border: '1px solid ' + (activeTab === 'now-showing' ? 'var(--accent)' : 'rgba(255,255,255,0.1)'),
              background: activeTab === 'now-showing' ? 'rgba(255,138,0,0.15)' : 'rgba(255,255,255,0.02)',
              color: activeTab === 'now-showing' ? 'var(--accent)' : 'rgba(255,255,255,0.7)',
            }}
          >
            <Film size={16} />
            <span>{t('home.nowShowing', 'Phim Đang Chiếu')}</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('coming-soon');
              navigate('/movies?tab=coming-soon');
            }}
            className="interactive"
            style={{
              padding: '12px 28px',
              borderRadius: 12,
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'all 0.3s',
              border: '1px solid ' + (activeTab === 'coming-soon' ? 'var(--accent)' : 'rgba(255,255,255,0.1)'),
              background: activeTab === 'coming-soon' ? 'rgba(255,138,0,0.15)' : 'rgba(255,255,255,0.02)',
              color: activeTab === 'coming-soon' ? 'var(--accent)' : 'rgba(255,255,255,0.7)',
            }}
          >
            <Calendar size={16} />
            <span>{t('home.comingSoon', 'Phim Sắp Chiếu')}</span>
          </button>
        </div>
      </section>

      {/* Movies Grid Section */}
      <section style={{ width: '100%', maxWidth: 1280, margin: '0 auto', padding: '48px clamp(16px, 4vw, 24px) 100px' }}>
        {loading ? (
          <div className="state-center" style={{ minHeight: 400 }}>
            <Loader2 size={36} style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
            <p style={{ color: 'var(--text-secondary)', marginTop: 16 }}>Loading movies...</p>
          </div>
        ) : error ? (
          <div className="state-center" style={{ minHeight: 400 }}>
            <AlertCircle size={44} style={{ color: 'var(--danger)' }} />
            <p style={{ color: 'var(--danger)', marginTop: 16 }}>{error}</p>
          </div>
        ) : movies.length === 0 ? (
          <div className="glass-card" style={{ padding: '64px 24px', borderRadius: 16, textAlign: 'center', color: 'var(--text-secondary)' }}>
            <Film size={40} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
            <p style={{ fontSize: 16, fontWeight: 600, color: 'white', margin: 0 }}>
              {activeTab === 'now-showing' ? 'Không có phim đang chiếu.' : 'Không có phim sắp chiếu.'}
            </p>
            <p style={{ fontSize: 13, marginTop: 8, color: 'var(--text-secondary)' }}>
              Hãy thử chọn thành phố hoặc rạp khác để xem lịch chiếu.
            </p>
          </div>
        ) : (
          <div>
            <div className="movie-grid">
              {slicedMovies.map(movie => (
                <div
                  key={movie.movieId}
                  className="glass-card interactive"
                  style={{
                    borderRadius: 16,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  }}
                  onClick={() => navigate(`/movie/${movie.movieId}`)}
                >
                  <div style={{ position: 'relative', width: '100%', paddingTop: '150%' }}>
                    <img
                      src={movie.moviePosterURL || PLACEHOLDER_POSTER}
                      alt={movie.movieName}
                      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                      loading="lazy"
                      onError={e => { (e.target as HTMLImageElement).src = PLACEHOLDER_POSTER; }}
                    />
                  </div>
                  <div style={{ padding: 16 }}>
                    <h3 style={{
                      fontSize: 15,
                      fontWeight: 700,
                      marginBottom: 8,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      color: 'white'
                    }}>
                      {movie.movieName}
                    </h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {activeTab === 'now-showing' ? (
                        movie.movieFormatInfos.split('/').filter(Boolean).map((f: string, i: number) => (
                          <span key={i} style={{ padding: '2px 10px', borderRadius: 'var(--radius-full)', fontSize: 11, fontWeight: 700, background: 'var(--bg-surface)', color: 'var(--accent)', border: '1px solid var(--border-color)' }}>
                            {f}
                          </span>
                        ))
                      ) : (
                        <span style={{ padding: '2px 10px', borderRadius: 'var(--radius-full)', fontSize: 11, fontWeight: 700, background: 'var(--bg-surface)', color: 'var(--accent)' }}>
                          Coming Soon
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 48 }}>
                <button
                  disabled={currentPage === 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                  className="interactive glass-card"
                  style={{
                    padding: '10px 20px',
                    borderRadius: 8,
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: currentPage === 1 ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.05)',
                    color: currentPage === 1 ? 'rgba(255,255,255,0.3)' : 'white',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    fontSize: 13,
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    transition: 'all 0.2s',
                  }}
                >
                  <ChevronLeft size={16} />
                  <span>{t('pagination.prev', 'Trước')}</span>
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => handlePageChange(p)}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 8,
                      border: '1px solid ' + (p === currentPage ? 'var(--accent)' : 'rgba(255,255,255,0.1)'),
                      background: p === currentPage ? 'rgba(255,138,0,0.15)' : 'rgba(255,255,255,0.05)',
                      color: p === currentPage ? 'var(--accent)' : 'white',
                      cursor: 'pointer',
                      fontWeight: 700,
                      fontSize: 13,
                      transition: 'all 0.2s',
                    }}
                    className="interactive"
                  >
                    {p}
                  </button>
                ))}

                <button
                  disabled={currentPage === totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                  className="interactive glass-card"
                  style={{
                    padding: '10px 20px',
                    borderRadius: 8,
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: currentPage === totalPages ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.05)',
                    color: currentPage === totalPages ? 'rgba(255,255,255,0.3)' : 'white',
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    fontSize: 13,
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    transition: 'all 0.2s',
                  }}
                >
                  <span>{t('pagination.next', 'Sau')}</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-surface)', padding: '48px clamp(16px, 4vw, 24px) 32px' }}>
        <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-secondary)' }}>
          © 2024 CinemaPro. All rights reserved.
        </div>
      </footer>

      <BackToTop />
    </div>
  );
};

export default AllMoviesPage;
