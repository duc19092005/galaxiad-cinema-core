import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Clapperboard,
  Film,
  Loader2,
  UserRound,
} from 'lucide-react';
import Header from '../../components/Header';
import PublicFooter from '../../components/PublicFooter';
import PublicBreadcrumb from '../../components/PublicBreadcrumb';
import BackToTop from '../../components/BackToTop';
import { publicApi } from '../../api/publicApi';
import type { PublicMovieListItem, PublicPersonDetail } from '../../types/public.types';

const PLACEHOLDER_POSTER =
  'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=500';

const personAvatar = (name: string, profileUrl?: string | null) =>
  profileUrl?.trim() ||
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name.trim())}&background=1a1a20&color=ffb77f&size=256&bold=true&format=svg`;

const PAGE_SIZE = 12;

const PersonDetailPage: React.FC = () => {
  const { role: roleParam, personName: nameFromPath } = useParams<{
    role: string;
    personName?: string;
  }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const role = (roleParam === 'director' ? 'director' : 'actor') as 'actor' | 'director';
  const personName = useMemo(() => {
    // Query param is preferred (already decoded by URLSearchParams)
    const fromQuery = searchParams.get('name');
    if (fromQuery?.trim()) return fromQuery.trim();

    const raw = (nameFromPath || '').trim();
    if (!raw) return '';
    try {
      return decodeURIComponent(raw).trim();
    } catch {
      return raw;
    }
  }, [searchParams, nameFromPath]);

  const pageIndex = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);

  const [person, setPerson] = useState<PublicPersonDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPerson = useCallback(async () => {
    if (!personName) {
      setError(t('personDetail.notFound', 'Không tìm thấy người này.'));
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await publicApi.getPersonDetail({
        name: personName,
        role,
        pageIndex,
        pageSize: PAGE_SIZE,
      });
      setPerson(res.data);
    } catch (err) {
      console.error(err);
      setError(t('personDetail.loadError', 'Không thể tải thông tin. Vui lòng thử lại.'));
      setPerson(null);
    } finally {
      setLoading(false);
    }
  }, [personName, role, pageIndex, t]);

  useEffect(() => {
    fetchPerson();
  }, [fetchPerson]);

  const movies: PublicMovieListItem[] = person?.movies?.items ?? [];
  const totalCount = person?.movies?.totalCount ?? 0;
  const totalPages = Math.max(1, person?.movies?.totalPages ?? 1);
  const displayName = person?.name || personName;

  const roleLabel =
    role === 'director'
      ? t('personDetail.roleDirector', 'Đạo diễn')
      : t('personDetail.roleActor', 'Diễn viên');

  const breadcrumbItems = useMemo(
    () => [
      { label: t('breadcrumb.home', 'Home'), path: '/home' },
      { label: t('breadcrumb.movies', 'Phim'), path: '/movies' },
      {
        label:
          role === 'director'
            ? t('breadcrumb.director', 'Đạo diễn')
            : t('breadcrumb.actor', 'Diễn viên'),
      },
      { label: displayName || roleLabel },
    ],
    [t, role, roleLabel, displayName]
  );

  const goPage = (page: number) => {
    const next = Math.min(Math.max(1, page), totalPages);
    const nextParams: Record<string, string> = {};
    // Keep person name in query when using /person/:role?name=
    if (searchParams.get('name')) nextParams.name = searchParams.get('name')!;
    else if (personName) nextParams.name = personName;
    if (next > 1) nextParams.page = String(next);
    setSearchParams(nextParams);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-base)', color: 'var(--text-primary)' }}>
        <Header />
        <div className="state-center" style={{ minHeight: '60vh' }}>
          <Loader2 size={40} style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
        </div>
      </div>
    );
  }

  if (error || !personName) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-base)', color: 'var(--text-primary)' }}>
        <Header />
        <main style={{ maxWidth: 960, margin: '0 auto', padding: '120px 24px', textAlign: 'center' }}>
          <AlertCircle size={48} style={{ color: 'var(--danger)', marginBottom: 16 }} />
          <p style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>
            {error || t('personDetail.notFound', 'Không tìm thấy người này.')}
          </p>
          <button
            type="button"
            className="interactive"
            onClick={() => navigate('/movies')}
            style={{
              padding: '12px 24px',
              borderRadius: 12,
              border: 'none',
              background: 'var(--accent)',
              color: '#111',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {t('breadcrumb.movies', 'Phim')}
          </button>
        </main>
        <PublicFooter />
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-base)',
        color: 'var(--text-primary)',
        overflowX: 'hidden',
      }}
    >
      <Header />

      <main
        className="page-enter"
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          padding: 'clamp(96px, 12vw, 120px) clamp(16px, 4vw, 24px) 64px',
        }}
      >
        <PublicBreadcrumb items={breadcrumbItems} />

        {/* Person hero card */}
        <section
          className="glass-card page-enter-d1"
          style={{
            borderRadius: 20,
            border: '1px solid var(--border-color)',
            background: 'var(--bg-elevated)',
            padding: 'clamp(20px, 4vw, 32px)',
            marginBottom: 40,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 24,
            alignItems: 'center',
          }}
        >
          <div
            style={{
              width: 120,
              height: 120,
              borderRadius: '50%',
              overflow: 'hidden',
              flexShrink: 0,
              border: '2px solid rgba(255,138,0,0.35)',
              background: 'var(--bg-base)',
            }}
          >
            <img
              src={personAvatar(displayName, person?.profileUrl)}
              alt={displayName}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = personAvatar(displayName);
              }}
            />
          </div>

          <div style={{ flex: 1, minWidth: 200 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '4px 12px',
                borderRadius: 999,
                background: 'rgba(255,138,0,0.12)',
                border: '1px solid rgba(255,138,0,0.35)',
                color: '#ffb77f',
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                marginBottom: 10,
              }}
            >
              {role === 'director' ? <Clapperboard size={14} /> : <UserRound size={14} />}
              {roleLabel}
            </div>
            <h1
              style={{
                fontFamily: "'Montserrat', sans-serif",
                fontSize: 'clamp(26px, 4vw, 36px)',
                fontWeight: 800,
                margin: '0 0 8px',
                letterSpacing: '-0.02em',
              }}
            >
              {displayName}
            </h1>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 14 }}>
              {t('personDetail.filmCount', '{{count}} phim trong hệ thống', { count: totalCount })}
              {person?.knownForDepartment
                ? ` · ${person.knownForDepartment}`
                : ''}
            </p>
          </div>
        </section>

        {/* Filmography from internal catalog */}
        <section>
          <h2
            style={{
              fontFamily: "'Montserrat', sans-serif",
              fontSize: 22,
              fontWeight: 700,
              margin: '0 0 20px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              borderLeft: '4px solid var(--accent)',
              paddingLeft: 14,
            }}
          >
            <Film size={22} style={{ color: 'var(--accent)' }} />
            {role === 'director'
              ? t('personDetail.directedMovies', 'Phim đạo diễn')
              : t('personDetail.actedMovies', 'Phim tham gia')}
          </h2>

          {movies.length === 0 ? (
            <div
              className="glass-card"
              style={{
                padding: '48px 24px',
                borderRadius: 16,
                textAlign: 'center',
                color: 'var(--text-secondary)',
              }}
            >
              <Film size={40} style={{ margin: '0 auto 12px', opacity: 0.45 }} />
              <p style={{ margin: 0, fontWeight: 600, color: 'white' }}>
                {t('personDetail.noMovies', 'Chưa có phim nào trong hệ thống cho người này.')}
              </p>
            </div>
          ) : (
            <>
              <div className="movie-grid">
                {movies.map((movie) => (
                  <div
                    key={movie.movieId}
                    className="glass-card interactive"
                    role="button"
                    tabIndex={0}
                    onClick={() => navigate(`/movie/${movie.movieId}`)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        navigate(`/movie/${movie.movieId}`);
                      }
                    }}
                    style={{
                      borderRadius: 16,
                      overflow: 'hidden',
                      cursor: 'pointer',
                      transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                    }}
                  >
                    <div style={{ position: 'relative', width: '100%', paddingTop: '150%' }}>
                      <img
                        src={movie.moviePosterURL || PLACEHOLDER_POSTER}
                        alt={movie.movieName}
                        loading="lazy"
                        style={{
                          position: 'absolute',
                          inset: 0,
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = PLACEHOLDER_POSTER;
                        }}
                      />
                      {movie.isCommingSoon && (
                        <span
                          style={{
                            position: 'absolute',
                            top: 10,
                            left: 10,
                            padding: '4px 10px',
                            borderRadius: 999,
                            fontSize: 11,
                            fontWeight: 700,
                            background: 'rgba(0,0,0,0.65)',
                            border: '1px solid rgba(255,138,0,0.5)',
                            color: '#ffb77f',
                          }}
                        >
                          {t('movieDetail.comingSoon', 'Sắp chiếu')}
                        </span>
                      )}
                    </div>
                    <div style={{ padding: 14 }}>
                      <h3
                        style={{
                          fontSize: 15,
                          fontWeight: 700,
                          margin: '0 0 8px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          color: 'white',
                        }}
                      >
                        {movie.movieName}
                      </h3>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {movie.movieCategoryInfos
                          ?.split(',')
                          .map((g) => g.trim())
                          .filter(Boolean)
                          .slice(0, 2)
                          .map((g) => (
                            <span
                              key={g}
                              style={{
                                padding: '2px 10px',
                                borderRadius: 999,
                                fontSize: 11,
                                fontWeight: 700,
                                background: 'var(--bg-surface)',
                                color: 'var(--accent)',
                                border: '1px solid var(--border-color)',
                              }}
                            >
                              {g}
                            </span>
                          ))}
                        {movie.movieDuration > 0 && (
                          <span
                            style={{
                              padding: '2px 10px',
                              borderRadius: 999,
                              fontSize: 11,
                              fontWeight: 600,
                              color: 'var(--text-secondary)',
                              border: '1px solid var(--border-color)',
                            }}
                          >
                            {movie.movieDuration} {t('movieDetail.minutes', 'phút')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexWrap: 'wrap',
                    gap: 10,
                    marginTop: 40,
                  }}
                >
                  <button
                    type="button"
                    disabled={pageIndex <= 1}
                    onClick={() => goPage(pageIndex - 1)}
                    className="interactive glass-card"
                    style={{
                      padding: '10px 18px',
                      borderRadius: 8,
                      border: '1px solid rgba(255,255,255,0.1)',
                      background: pageIndex <= 1 ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.05)',
                      color: pageIndex <= 1 ? 'rgba(255,255,255,0.3)' : 'white',
                      cursor: pageIndex <= 1 ? 'not-allowed' : 'pointer',
                      fontSize: 13,
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <ChevronLeft size={16} />
                    {t('pagination.prev', 'Trước')}
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => {
                      if (totalPages <= 7) return true;
                      if (p === 1 || p === totalPages) return true;
                      return Math.abs(p - pageIndex) <= 1;
                    })
                    .reduce<(number | '…')[]>((acc, p, idx, arr) => {
                      if (idx > 0) {
                        const prev = arr[idx - 1];
                        if (typeof prev === 'number' && p - prev > 1) acc.push('…');
                      }
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((p, idx) =>
                      p === '…' ? (
                        <span key={`e-${idx}`} style={{ color: 'var(--text-secondary)', padding: '0 4px' }}>
                          …
                        </span>
                      ) : (
                        <button
                          key={p}
                          type="button"
                          onClick={() => goPage(p)}
                          className="interactive"
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 8,
                            border: `1px solid ${p === pageIndex ? 'var(--accent)' : 'rgba(255,255,255,0.1)'}`,
                            background: p === pageIndex ? 'rgba(255,138,0,0.15)' : 'rgba(255,255,255,0.05)',
                            color: p === pageIndex ? 'var(--accent)' : 'white',
                            cursor: 'pointer',
                            fontWeight: 700,
                            fontSize: 13,
                          }}
                        >
                          {p}
                        </button>
                      )
                    )}

                  <button
                    type="button"
                    disabled={pageIndex >= totalPages}
                    onClick={() => goPage(pageIndex + 1)}
                    className="interactive glass-card"
                    style={{
                      padding: '10px 18px',
                      borderRadius: 8,
                      border: '1px solid rgba(255,255,255,0.1)',
                      background:
                        pageIndex >= totalPages ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.05)',
                      color: pageIndex >= totalPages ? 'rgba(255,255,255,0.3)' : 'white',
                      cursor: pageIndex >= totalPages ? 'not-allowed' : 'pointer',
                      fontSize: 13,
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    {t('pagination.next', 'Sau')}
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </main>

      <PublicFooter />
      <BackToTop />
    </div>
  );
};

export default PersonDetailPage;
