import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Film, Loader2, Search, X } from 'lucide-react';
import { publicApi, type PublicMovieSearchItem } from '../api/publicApi';

const PLACEHOLDER =
  'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=200';
const DEBOUNCE_MS = 450;
const PREVIEW_LIMIT = 5;
const MIN_CHARS = 1;

/**
 * Desktop: compact header search + dropdown (max 5).
 * Mobile: icon → full-screen search overlay (portal to body).
 * Debounced API: GET /api/v1/public/movies/now-showing
 */
const MovieSearchBar: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PublicMovieSearchItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [openDesktop, setOpenDesktop] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const desktopWrapRef = useRef<HTMLDivElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const reqIdRef = useRef(0);

  const runSearch = useCallback(async (keyword: string) => {
    const q = keyword.trim();
    if (q.length < MIN_CHARS) {
      setResults([]);
      setTotalCount(0);
      setError(null);
      setLoading(false);
      return;
    }

    const reqId = ++reqIdRef.current;
    setLoading(true);
    setError(null);

    try {
      const res = await publicApi.searchMoviesPaged({
        keyword: q,
        status: 'now-showing',
        pageIndex: 1,
        pageSize: PREVIEW_LIMIT,
      });
      if (reqId !== reqIdRef.current) return;
      setResults(res.data?.items || []);
      setTotalCount(res.data?.totalCount || 0);
    } catch (err: any) {
      if (reqId !== reqIdRef.current) return;
      if (err?.response?.status === 429) {
        setError(t('search.rateLimited', 'Quá nhiều yêu cầu. Vui lòng thử lại sau.'));
      } else {
        setError(t('search.failed', 'Không tìm được phim.'));
      }
      setResults([]);
      setTotalCount(0);
    } finally {
      if (reqId === reqIdRef.current) setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setTotalCount(0);
      setLoading(false);
      return;
    }
    setLoading(true);
    const timer = window.setTimeout(() => {
      void runSearch(query);
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [query, runSearch]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (desktopWrapRef.current && !desktopWrapRef.current.contains(e.target as Node)) {
        setOpenDesktop(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => mobileInputRef.current?.focus(), 80);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const goMovie = (movieId: string) => {
    if (!movieId) return;
    setOpenDesktop(false);
    setMobileOpen(false);
    setQuery('');
    setResults([]);
    navigate(`/movie/${movieId}`);
  };

  const goSeeMore = () => {
    const q = query.trim();
    setOpenDesktop(false);
    setMobileOpen(false);
    navigate(`/movies/search?q=${encodeURIComponent(q)}`);
  };

  const closeMobile = () => {
    setMobileOpen(false);
    setQuery('');
    setResults([]);
    setError(null);
  };

  const showPanel = openDesktop && query.trim().length >= MIN_CHARS;

  const ResultsList = () => (
    <div className="flex flex-col">
      {loading && (
        <div className="flex items-center gap-2 px-4 py-6 text-sm text-zinc-400 justify-center">
          <Loader2 size={16} className="animate-spin text-[#ff8a00]" />
          {t('search.searching', 'Đang tìm…')}
        </div>
      )}
      {!loading && error && (
        <div className="px-4 py-4 text-sm text-red-400 text-center">{error}</div>
      )}
      {!loading && !error && results.length === 0 && query.trim() && (
        <div className="px-4 py-6 text-sm text-zinc-500 text-center">
          {t('search.noResults', 'Không có phim phù hợp')}
        </div>
      )}
      {!loading &&
        results.map((m) => (
          <button
            key={m.movieId || m.movieName}
            type="button"
            onClick={() => goMovie(m.movieId)}
            className="flex items-center gap-3 px-4 py-3 text-left hover:bg-white/8 active:bg-white/10 transition-colors bg-transparent border-none cursor-pointer w-full"
          >
            <img
              src={m.movieImageUrl || PLACEHOLDER}
              alt=""
              className="w-10 h-14 object-cover rounded-md bg-zinc-800 flex-shrink-0"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = PLACEHOLDER;
              }}
            />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold text-white truncate">{m.movieName || '—'}</div>
              <div className="text-[11px] text-zinc-400 mt-0.5 truncate">
                {[m.movieRequiredAgeSymbol, m.movieDuration ? `${m.movieDuration} phút` : null]
                  .filter(Boolean)
                  .join(' · ') || t('search.nowShowing', 'Đang chiếu')}
              </div>
            </div>
            <Film size={14} className="text-[#ff8a00]/70 flex-shrink-0" />
          </button>
        ))}
      {!loading && results.length > 0 && (
        <div className="p-3 border-t border-white/10">
          <button
            type="button"
            onClick={goSeeMore}
            className="w-full py-2.5 rounded-xl bg-[#ff8a00]/15 border border-[#ff8a00]/35 text-[#ff8a00] text-xs font-bold cursor-pointer hover:bg-[#ff8a00]/25 transition-colors"
          >
            {t('search.seeMore', 'Xem thêm')}
            {totalCount > PREVIEW_LIMIT ? ` (${totalCount})` : ''}
          </button>
        </div>
      )}
    </div>
  );

  const mobileOverlay =
    mobileOpen &&
    createPortal(
      <div
        className="fixed inset-0 flex flex-col"
        style={{ zIndex: 10050, background: '#0a0a0c' }}
        role="dialog"
        aria-modal="true"
        aria-label={t('search.placeholder', 'Tìm phim…')}
      >
        <div
          className="flex items-center gap-2 px-3 py-3 border-b border-white/10"
          style={{ paddingTop: 'max(12px, env(safe-area-inset-top))' }}
        >
          <button
            type="button"
            onClick={closeMobile}
            className="p-2.5 rounded-full text-white bg-white/10 border-none cursor-pointer flex items-center justify-center flex-shrink-0"
            aria-label="Close"
          >
            <X size={20} />
          </button>
          <div className="flex-1 flex items-center bg-zinc-900 rounded-full px-3 py-2.5 border border-white/15 min-w-0">
            <Search size={16} className="text-[#ff8a00] flex-shrink-0" />
            <input
              ref={mobileInputRef}
              className="bg-transparent border-none focus:outline-none text-white text-base ml-2 flex-1 min-w-0 placeholder:text-zinc-500"
              placeholder={t('search.placeholder', 'Tìm phim…')}
              type="search"
              inputMode="search"
              autoComplete="off"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && query.trim()) goSeeMore();
                if (e.key === 'Escape') closeMobile();
              }}
            />
            {loading && <Loader2 size={16} className="animate-spin text-[#ff8a00] flex-shrink-0" />}
            {!loading && query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setResults([]);
                  setError(null);
                }}
                className="bg-transparent border-none text-zinc-400 p-1 cursor-pointer flex"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        <div
          className="flex-1 overflow-y-auto overscroll-contain"
          style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}
        >
          {!query.trim() ? (
            <div className="px-6 py-20 text-center text-zinc-500 text-sm leading-relaxed">
              {t('search.mobileHint', 'Nhập tên phim để tìm kiếm')}
            </div>
          ) : (
            <ResultsList />
          )}
        </div>
      </div>,
      document.body
    );

  return (
    <>
      {/* Desktop: compact search */}
      <div className="hidden md:block relative" ref={desktopWrapRef}>
        <div className="flex items-center bg-white/5 rounded-full px-3 py-1.5 border border-white/10 focus-within:border-[#ff8a00]/50 transition-colors">
          <Search size={15} className="text-[#ddc1ae] flex-shrink-0" />
          <input
            className="bg-transparent border-none focus:outline-none text-white text-xs ml-2 w-28 lg:w-40 xl:w-48 placeholder:text-[#ddc1ae]/50"
            placeholder={t('search.placeholder', 'Tìm phim…')}
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpenDesktop(true);
            }}
            onFocus={() => setOpenDesktop(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && query.trim()) goSeeMore();
              if (e.key === 'Escape') setOpenDesktop(false);
            }}
            aria-label={t('search.placeholder', 'Tìm phim…')}
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setResults([]);
              }}
              className="bg-transparent border-none text-zinc-400 hover:text-white cursor-pointer p-0.5 flex"
              aria-label="Clear"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {showPanel && (
          <div
            className="absolute right-0 mt-2 rounded-2xl overflow-hidden z-[80] max-h-[min(70vh,420px)] overflow-y-auto"
            style={{
              width: 'min(360px, calc(100vw - 32px))',
              background: 'rgba(24,24,27,0.98)',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 16px 48px rgba(0,0,0,0.55)',
            }}
          >
            <ResultsList />
          </div>
        )}
      </div>

      {/* Mobile: icon → full-screen (portal) */}
      <button
        type="button"
        className="md:hidden hover:bg-white/5 p-2 rounded-full transition-all text-[#ffb77f] bg-transparent border-none cursor-pointer flex items-center justify-center"
        onClick={() => setMobileOpen(true)}
        aria-label={t('search.placeholder', 'Tìm phim…')}
      >
        <Search size={19} />
      </button>

      {mobileOverlay}
    </>
  );
};

export default MovieSearchBar;
