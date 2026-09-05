import React from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Calendar, Film, Loader2, Clock } from 'lucide-react';
import type { SearchScheduleResult } from '../../../types/public.types';

interface CashierScheduleCatalogProps {
  searchKeyword: string;
  onSearchChange: (val: string) => void;
  selectedDate: string;
  loadingCatalog: boolean;
  filteredSchedules: SearchScheduleResult[];
  selectedMovieId: string | null;
  onSelectMovieId: (id: string) => void;
  selectedScheduleId: string | null;
  onSelectScheduleId: (id: string | null) => void;
}

export const CashierScheduleCatalog: React.FC<CashierScheduleCatalogProps> = ({
  searchKeyword,
  onSearchChange,
  selectedDate,
  loadingCatalog,
  filteredSchedules,
  selectedMovieId,
  onSelectMovieId,
  selectedScheduleId,
  onSelectScheduleId,
}) => {
  const { t } = useTranslation();

  return (
    <section className="col-span-3 border-r border-white/5 bg-[#0b0b0f] flex flex-col overflow-hidden">
      <div className="p-4 border-b border-white/5 bg-black/10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
          <input
            type="text"
            placeholder={t('cashierSales.searchMovies')}
            value={searchKeyword}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-[#161622] text-sm text-white pl-9 pr-4 py-2.5 rounded-xl border border-white/5 outline-none focus:border-[#ff8a00]/50 transition-colors"
          />
        </div>
        <div className="mt-3 flex items-center gap-2">
          <Calendar size={14} className="text-zinc-400" />
          <span className="text-xs text-zinc-300 font-medium">
            {t('cashierSales.today')} (
            {new Date(selectedDate).toLocaleDateString('vi-VN', {
              day: '2-digit',
              month: '2-digit',
            })}
            )
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scroll p-3 space-y-2.5">
        {loadingCatalog ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="animate-spin text-[#ff8a00]" size={32} />
            <p className="text-xs text-zinc-400">{t('cashierSales.loadingMovies')}</p>
          </div>
        ) : filteredSchedules.length === 0 ? (
          <div className="text-center py-16 text-zinc-500">
            <Film className="mx-auto text-zinc-700 mb-3" size={36} />
            <p className="text-xs">{t('cashierSales.noMoviesFound')}</p>
          </div>
        ) : (
          filteredSchedules.map((movie) => {
            const isSelected = selectedMovieId === movie.movieId;
            return (
              <div
                key={movie.movieId}
                className={`rounded-xl border transition-all duration-200 overflow-hidden cursor-pointer ${
                  isSelected
                    ? 'bg-[#1e1a12]/30 border-[#ff8a00]/40 shadow-sm shadow-[#ff8a00]/5'
                    : 'bg-[#12121a]/60 border-white/5 hover:bg-[#181824]'
                }`}
                onClick={() => {
                  onSelectMovieId(movie.movieId);
                  if (selectedMovieId !== movie.movieId) {
                    onSelectScheduleId(null);
                  }
                }}
              >
                <div className="p-3 flex gap-3">
                  <img
                    src={movie.movieImageUrl}
                    alt={movie.movieName}
                    className="w-14 h-20 object-cover rounded-lg bg-zinc-900 flex-shrink-0"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src =
                        'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=150';
                    }}
                  />
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-white truncate leading-snug mb-1">
                        {movie.movieName}
                      </h3>
                      <p className="text-[11px] text-zinc-400 truncate">
                        {movie.movieGenres.join(', ')}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 font-bold border border-zinc-700/40">
                        {movie.movieRequiredAgeSymbol}
                      </span>
                      <span className="text-[10px] text-zinc-400 flex items-center gap-1 font-semibold">
                        <Clock size={10} /> {movie.movieDuration} {t('cashierSales.minutes')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Showtimes slots list if selected */}
                {isSelected && (
                  <div className="px-3 pb-3 pt-2 border-t border-white/5 bg-black/10">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
                      {t('cashierSales.todayShowtimes')}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {movie.cinemas
                        .flatMap((c) => c.formatShowtimes)
                        .flatMap((fs) =>
                          fs.showtimes.map((st) => {
                            const isSlotSelected = selectedScheduleId === st.scheduleId;
                            return (
                              <button
                                key={st.scheduleId}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSelectScheduleId(st.scheduleId);
                                }}
                                className={`px-2 py-1.5 rounded-lg text-xs font-bold transition-all border text-center ${
                                  isSlotSelected
                                    ? 'bg-[#ff8a00] text-black border-[#ff8a00]'
                                    : 'bg-[#20202e] text-zinc-300 border-white/5 hover:bg-[#28283a] hover:text-white'
                                }`}
                              >
                                {new Date(st.startTime).toLocaleTimeString('vi-VN', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                                <span className="block text-[9px] font-medium opacity-70 truncate">
                                  {st.auditoriumNumber}
                                </span>
                              </button>
                            );
                          })
                        )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
};

export default CashierScheduleCatalog;
