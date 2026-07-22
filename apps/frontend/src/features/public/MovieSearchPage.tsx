import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertCircle, ChevronLeft, ChevronRight, Film, Loader2, Search } from 'lucide-react';
import Header from '../../components/Header';
import BackToTop from '../../components/BackToTop';
import { publicApi, type PublicMovieSearchItem } from '../../api/publicApi';

const PLACEHOLDER =
  'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=400';
const PAGE_SIZE = 12;
const DEBOUNCE_MS = 400;

const MovieSearchPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useTranslation();

  const qParam = searchParams.get('q') || '';
  const pageParam = Math.max(1, Number(searchParams.get('page') || '1') || 1);
  const statusParam = (searchParams.get('status') === 'coming-soon' ? 'coming-soon' : 'now-showing') as
    | 'now-showing'
    | 'coming-soon';

  const [input, setInput] = useState(qParam);
  const [movies, setMovies] = useState<PublicMovieSearchItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync input when URL changes (e.g. back/forward)
  useEffect(() => {
    setInput(qParam);
  }, [qParam]);

  const fetchPage = useCallback(async (keyword: string, page: number, status: 'now-showing' | 'coming-soon') => {
    if (!keyword.trim()) {
      setMovies([]);
      setTotalCount(0);
      setTotalPages(1);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await publicApi.searchMoviesPaged({
        keyword: keyword.trim(),
        status,
        pageIndex: page,
        pageSize: PAGE_SIZE,
      });
      setMovies(res.data?.items || []);
      setTotalCount(res.data?.totalCount || 0);
      setTotalPages(Math.max(1, res.data?.totalPages || 1));
    } catch (err: any) {
      if (err?.response?.status === 429) {
        setError(t('search.rateLimited', 'Quá nhiều yêu cầu. Vui lòng thử lại sau.'));
      } else {
        setError(t('search.failed', 'Không tìm được phim.'));
      }
      setMovies([]);
    } finally {
      setLoading(false);
    }
  }, [t]);

  // Debounce URL update when typing on this page
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const next = input.trim();
      if (next === qParam) return;
      const params = new URLSearchParams();
      if (next) params.set('q', next);
      params.set('page', '1');
      params.set('status', statusParam);
      setSearchParams(params, { replace: true });
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [input]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    void fetchPage(qParam, pageParam, statusParam);
  }, [qParam, pageParam, statusParam, fetchPage]);

  const setPage = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', String(page));
    if (qParam) params.set('q', qParam);
    params.set('status', statusParam);
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const setStatus = (status: 'now-showing' | 'coming-soon') => {
    const params = new URLSearchParams();
    if (qParam) params.set('q', qParam);
    params.set('page', '1');
    params.set('status', status);
    setSearchParams(params);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white">
      <Header />
      <main className="pt-28 pb-20 px-4 md:px-8 max-w-6xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-extrabold mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          {t('search.pageTitle', 'Tìm kiếm phim')}
        </h1>
        <p className="text-zinc-500 text-sm mb-6">
          {qParam
            ? t('search.resultsFor', 'Kết quả cho “{{q}}”', { q: qParam })
            : t('search.pageHint', 'Nhập tên phim để bắt đầu')}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex-1 flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 focus-within:border-[#ff8a00]/50">
            <Search size={18} className="text-[#ff8a00] flex-shrink-0" />
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('search.placeholder', 'Tìm phim…')}
              className="bg-transparent border-none outline-none text-white text-sm flex-1 min-w-0 placeholder:text-zinc-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStatus('now-showing')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold border cursor-pointer transition-colors ${
                statusParam === 'now-showing'
                  ? 'bg-[#ff8a00] text-black border-[#ff8a00]'
                  : 'bg-white/5 text-zinc-300 border-white/10 hover:border-white/20'
              }`}
            >
              {t('search.nowShowing', 'Đang chiếu')}
            </button>
            <button
              type="button"
              onClick={() => setStatus('coming-soon')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold border cursor-pointer transition-colors ${
                statusParam === 'coming-soon'
                  ? 'bg-[#ff8a00] text-black border-[#ff8a00]'
                  : 'bg-white/5 text-zinc-300 border-white/10 hover:border-white/20'
              }`}
            >
              {t('search.comingSoon', 'Sắp chiếu')}
            </button>
          </div>
        </div>

        {loading && (
          <div className="flex justify-center py-20">
            <Loader2 size={36} className="animate-spin text-[#ff8a00]" />
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center py-16 text-center gap-3">
            <AlertCircle size={40} className="text-red-400" />
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {!loading && !error && qParam && movies.length === 0 && (
          <div className="flex flex-col items-center py-16 text-zinc-500 gap-2">
            <Film size={40} className="opacity-40" />
            <p>{t('search.noResults', 'Không có phim phù hợp')}</p>
          </div>
        )}

        {!loading && movies.length > 0 && (
          <>
            <p className="text-xs text-zinc-500 mb-4">
              {t('search.totalResults', '{{count}} phim', { count: totalCount })} · {t('search.page', 'Trang')}{' '}
              {pageParam}/{totalPages}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-5">
              {movies.map((m) => (
                <button
                  key={m.movieId}
                  type="button"
                  onClick={() => navigate(`/movie/${m.movieId}`)}
                  className="text-left bg-transparent border-none cursor-pointer group p-0"
                >
                  <div className="aspect-[2/3] rounded-xl overflow-hidden bg-zinc-900 border border-white/5 mb-2">
                    <img
                      src={m.movieImageUrl || PLACEHOLDER}
                      alt={m.movieName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = PLACEHOLDER;
                      }}
                    />
                  </div>
                  <div className="text-sm font-bold text-white line-clamp-2 group-hover:text-[#ff8a00] transition-colors">
                    {m.movieName}
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-1">
                    {[m.movieRequiredAgeSymbol, m.movieDuration ? `${m.movieDuration}’` : null]
                      .filter(Boolean)
                      .join(' · ')}
                  </div>
                </button>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <button
                  type="button"
                  disabled={pageParam <= 1}
                  onClick={() => setPage(pageParam - 1)}
                  className="w-10 h-10 rounded-xl border border-white/10 bg-white/5 text-white disabled:opacity-30 cursor-pointer flex items-center justify-center hover:border-[#ff8a00]/40"
                >
                  <ChevronLeft size={18} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - pageParam) <= 1)
                  .reduce<(number | '…')[]>((acc, p, idx, arr) => {
                    if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push('…');
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, i) =>
                    p === '…' ? (
                      <span key={`e-${i}`} className="text-zinc-500 px-1">
                        …
                      </span>
                    ) : (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPage(p as number)}
                        className={`min-w-10 h-10 px-2 rounded-xl text-sm font-bold border cursor-pointer ${
                          p === pageParam
                            ? 'bg-[#ff8a00] text-black border-[#ff8a00]'
                            : 'bg-white/5 text-white border-white/10 hover:border-[#ff8a00]/40'
                        }`}
                      >
                        {p}
                      </button>
                    )
                  )}
                <button
                  type="button"
                  disabled={pageParam >= totalPages}
                  onClick={() => setPage(pageParam + 1)}
                  className="w-10 h-10 rounded-xl border border-white/10 bg-white/5 text-white disabled:opacity-30 cursor-pointer flex items-center justify-center hover:border-[#ff8a00]/40"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </>
        )}
      </main>
      <BackToTop />
    </div>
  );
};

export default MovieSearchPage;
