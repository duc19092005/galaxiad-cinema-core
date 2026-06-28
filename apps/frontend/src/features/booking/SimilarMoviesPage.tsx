// src/features/booking/SimilarMoviesPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2, AlertCircle, Zap } from 'lucide-react';
import { publicApi } from '../../api/publicApi';
import type { PublicMovieListItem, PublicMovieDetail } from '../../types/public.types';
import Header from '../../components/Header';
import BackToTop from '../../components/BackToTop';

const PLACEHOLDER_POSTER = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=500';
const ITEMS_PER_PAGE = 12;

const SimilarMoviesPage: React.FC = () => {
    const { movieId } = useParams<{ movieId: string }>();
    const navigate = useNavigate();
    const { t } = useTranslation();

    const [sourceMovie, setSourceMovie] = useState<PublicMovieDetail | null>(null);
    const [movies, setMovies] = useState<PublicMovieListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        if (!movieId) return;
        fetchData();
    }, [movieId]);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [detailRes, similarRes] = await Promise.all([
                publicApi.getMovieDetail(movieId!),
                publicApi.getSimilarMovies(movieId!, 20),
            ]);
            setSourceMovie(detailRes.data);
            setMovies(similarRes.data || []);
        } catch (err) {
            console.error('Failed to load similar movies:', err);
            setError(t('movieDetail.loadError', 'Failed to load. Please try again.'));
        } finally {
            setLoading(false);
        }
    };

    const totalPages = Math.ceil(movies.length / ITEMS_PER_PAGE) || 1;
    const paged = movies.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        window.scrollTo({ top: 300, behavior: 'smooth' });
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)', overflowX: 'hidden' }}>
            <Header />

            {/* Hero Banner */}
            <section style={{
                position: 'relative',
                paddingTop: 140,
                paddingBottom: 56,
                textAlign: 'center',
                overflow: 'hidden',
            }}>
                {/* Background glow */}
                <div style={{
                    position: 'absolute', inset: 0,
                    background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(255,138,0,0.08) 0%, transparent 70%)',
                    pointerEvents: 'none',
                }} />

                {/* Back button */}
                <div style={{ position: 'absolute', top: 96, left: 'clamp(16px, 4vw, 64px)', zIndex: 10 }}>
                    <button
                        onClick={() => navigate(`/movie/${movieId}`)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            background: 'rgba(255,255,255,0.06)',
                            border: '1px solid rgba(255,255,255,0.12)',
                            borderRadius: 12,
                            color: 'rgba(255,255,255,0.8)',
                            padding: '10px 18px',
                            fontSize: 13, fontWeight: 600,
                            cursor: 'pointer',
                            backdropFilter: 'blur(8px)',
                            transition: 'all 0.2s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,138,0,0.12)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                    >
                        <ArrowLeft size={16} />
                        {t('common.back', 'Back')}
                    </button>
                </div>

                {/* Vector icon + label */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 16 }}>
                    <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        background: 'rgba(255,138,0,0.12)',
                        border: '1px solid rgba(255,138,0,0.3)',
                        borderRadius: 999,
                        padding: '6px 16px',
                        fontSize: 12, fontWeight: 700,
                        color: 'var(--accent)',
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                    }}>
                        <Zap size={13} />
                        {t('similarMovies.vectorSimilarity', 'Vector Similarity Search')}
                    </span>
                </div>

                <h1 style={{
                    fontFamily: "'Montserrat', sans-serif",
                    fontSize: 'clamp(26px, 5vw, 42px)',
                    fontWeight: 800,
                    color: 'white',
                    margin: '0 0 12px',
                    padding: '0 16px',
                }}>
                    {t('movieDetail.moreLikeThis', 'More Like This')}
                </h1>

                {sourceMovie && (
                    <p style={{ color: 'var(--text-secondary)', fontSize: 15, margin: 0, padding: '0 16px' }}>
                        {t('similarMovies.basedOn', 'Based on')}
                        {' '}
                        <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{sourceMovie.movieName}</span>
                    </p>
                )}

                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, marginTop: 8 }}>
                    {movies.length} {t('similarMovies.resultsFound', 'results found')}
                </p>
            </section>

            {/* Content */}
            <section style={{ width: '100%', maxWidth: 1280, margin: '0 auto', padding: '8px clamp(16px, 4vw, 24px) 100px' }}>
                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 16 }}>
                        <Loader2 size={40} style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
                        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                            {t('similarMovies.searching', 'Searching by vector similarity...')}
                        </p>
                    </div>
                ) : error ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 16 }}>
                        <AlertCircle size={44} style={{ color: 'var(--danger)' }} />
                        <p style={{ color: 'var(--danger)' }}>{error}</p>
                    </div>
                ) : movies.length === 0 ? (
                    <div style={{
                        textAlign: 'center', padding: '80px 24px',
                        borderRadius: 20, border: '1px solid rgba(255,255,255,0.06)',
                        background: 'rgba(255,255,255,0.02)',
                    }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 56, color: 'rgba(255,255,255,0.15)', display: 'block', marginBottom: 16 }}>movie</span>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 16, fontWeight: 600 }}>
                            {t('movieDetail.noSimilarMovies', 'No similar movies found.')}
                        </p>
                    </div>
                ) : (
                    <div>
                        {/* Grid */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                            gap: 24,
                        }}>
                            {paged.map((movie, idx) => (
                                <div
                                    key={movie.movieId}
                                    onClick={() => navigate(`/movie/${movie.movieId}`)}
                                    style={{
                                        borderRadius: 16,
                                        overflow: 'hidden',
                                        cursor: 'pointer',
                                        background: 'rgba(255,255,255,0.03)',
                                        border: '1px solid rgba(255,255,255,0.06)',
                                        transition: 'transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease',
                                        animation: `fadeInUp 0.4s ease ${idx * 0.04}s both`,
                                    }}
                                    onMouseEnter={e => {
                                        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-6px)';
                                        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 20px 40px rgba(0,0,0,0.4)';
                                        (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,138,0,0.35)';
                                    }}
                                    onMouseLeave={e => {
                                        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                                        (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                                        (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.06)';
                                    }}
                                >
                                    {/* Poster */}
                                    <div style={{ position: 'relative', width: '100%', paddingTop: '150%' }}>
                                        <img
                                            src={movie.moviePosterURL || PLACEHOLDER_POSTER}
                                            alt={movie.movieName}
                                            loading="lazy"
                                            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                                            onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = PLACEHOLDER_POSTER; }}
                                        />
                                        {/* Hover overlay */}
                                        <div style={{
                                            position: 'absolute', inset: 0,
                                            background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 50%)',
                                            opacity: 0,
                                            transition: 'opacity 0.25s',
                                            display: 'flex', alignItems: 'flex-end', padding: 12,
                                        }}
                                            className="poster-overlay"
                                        >
                                            <span style={{
                                                background: 'var(--accent)',
                                                color: 'black',
                                                fontWeight: 800, fontSize: 11,
                                                padding: '4px 12px', borderRadius: 999,
                                            }}>
                                                {t('movieDetail.quickBook', 'Quick Book')}
                                            </span>
                                        </div>
                                        {/* Age badge */}
                                        {movie.movieRequiredAge && (
                                            <span style={{
                                                position: 'absolute', top: 10, right: 10,
                                                background: 'rgba(0,0,0,0.7)',
                                                backdropFilter: 'blur(4px)',
                                                border: '1px solid rgba(255,255,255,0.15)',
                                                color: 'white',
                                                fontSize: 10, fontWeight: 800,
                                                padding: '2px 8px', borderRadius: 6,
                                            }}>
                                                {movie.movieRequiredAge}
                                            </span>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div style={{ padding: '14px 14px 16px' }}>
                                        <h3 style={{
                                            fontSize: 14, fontWeight: 700,
                                            color: 'white', margin: '0 0 6px',
                                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                        }}>
                                            {movie.movieName}
                                        </h3>
                                        <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>
                                            {movie.movieCategoryInfos || t('movieDetail.movie', 'Movie')}
                                            {movie.movieDuration ? ` • ${movie.movieDuration} phút` : ''}
                                        </p>
                                        {movie.movieFormatInfos && (
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
                                                {movie.movieFormatInfos.split('/').filter(Boolean).map((f, i) => (
                                                    <span key={i} style={{
                                                        fontSize: 10, fontWeight: 700,
                                                        padding: '2px 8px', borderRadius: 999,
                                                        background: 'rgba(255,138,0,0.1)',
                                                        border: '1px solid rgba(255,138,0,0.25)',
                                                        color: 'var(--accent)',
                                                    }}>{f}</span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 56 }}>
                                <button
                                    disabled={currentPage === 1}
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 6,
                                        padding: '10px 20px', borderRadius: 10,
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        background: currentPage === 1 ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.05)',
                                        color: currentPage === 1 ? 'rgba(255,255,255,0.25)' : 'white',
                                        cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                                        fontSize: 13, fontWeight: 600, transition: 'all 0.2s',
                                    }}
                                >
                                    <ChevronLeft size={16} />
                                    {t('pagination.prev', 'Prev')}
                                </button>

                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                                    <button
                                        key={p}
                                        onClick={() => handlePageChange(p)}
                                        style={{
                                            width: 40, height: 40, borderRadius: 10,
                                            border: '1px solid ' + (p === currentPage ? 'var(--accent)' : 'rgba(255,255,255,0.1)'),
                                            background: p === currentPage ? 'rgba(255,138,0,0.15)' : 'rgba(255,255,255,0.04)',
                                            color: p === currentPage ? 'var(--accent)' : 'white',
                                            cursor: 'pointer', fontWeight: 700, fontSize: 13, transition: 'all 0.2s',
                                        }}
                                    >
                                        {p}
                                    </button>
                                ))}

                                <button
                                    disabled={currentPage === totalPages}
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 6,
                                        padding: '10px 20px', borderRadius: 10,
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        background: currentPage === totalPages ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.05)',
                                        color: currentPage === totalPages ? 'rgba(255,255,255,0.25)' : 'white',
                                        cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                                        fontSize: 13, fontWeight: 600, transition: 'all 0.2s',
                                    }}
                                >
                                    {t('pagination.next', 'Next')}
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </section>

            {/* Footer */}
            <footer style={{ borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-surface)', padding: '40px clamp(16px, 4vw, 24px) 28px' }}>
                <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-secondary)' }}>
                    © 2026 CINEMA. The Ultimate Cinematic Experience.
                </div>
            </footer>

            <BackToTop />

            <style>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                div:hover .poster-overlay {
                    opacity: 1 !important;
                }
            `}</style>
        </div>
    );
};

export default SimilarMoviesPage;
