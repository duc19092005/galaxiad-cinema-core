import React from 'react';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import i18n from '../../../../i18n/config';
import type { PublicCinemaShowtimes } from '../../../../types/public.types';

interface MovieDetailBookingPanelProps {
  cities: string[];
  selectedCity: string;
  setSelectedCity: (city: string) => void;
  monthKeys: string[];
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  filteredDates: string[];
  showtimes: PublicCinemaShowtimes[];
  loadingShowtimes: boolean;
  isPosMode: boolean;
  onSelectSchedule: (scheduleId: string) => void;
}

export const MovieDetailBookingPanel: React.FC<MovieDetailBookingPanelProps> = ({
  cities,
  selectedCity,
  setSelectedCity,
  monthKeys,
  selectedMonth,
  setSelectedMonth,
  selectedDate,
  setSelectedDate,
  filteredDates,
  showtimes,
  loadingShowtimes,
  onSelectSchedule,
}) => {
  const { t } = useTranslation();

  return (
    <div className="mdp-surface p-6 md:p-8 rounded-2xl sticky top-28">
      <h2
        className="text-2xl font-bold text-white mb-6"
        style={{ fontFamily: "'Montserrat', sans-serif" }}
      >
        {t('movieDetail.bookTickets', 'Book Tickets')}
      </h2>

      <div className="flex flex-col gap-6">
        <div>
          <label className="text-[12px] text-[var(--text-secondary)] font-bold block mb-2 uppercase tracking-widest">
            {t('movieDetail.selectCity', 'SELECT CITY')}
          </label>
          <div className="relative">
            <span className="material-symbols-outlined text-[#ffb77f] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-[20px]">
              location_on
            </span>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full bg-[var(--bg-base)] text-white p-3.5 pl-11 rounded-xl border border-[var(--border-color)] font-semibold appearance-none outline-none focus:border-[var(--accent)] transition-colors cursor-pointer"
            >
              {cities.map((cityName) => (
                <option key={cityName} value={cityName} className="bg-[var(--bg-elevated)]">
                  {cityName}
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined text-[var(--text-secondary)] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[20px]">
              expand_more
            </span>
          </div>
        </div>

        <div>
          {monthKeys.length > 1 && (
            <div className="flex gap-2 mb-3 overflow-x-auto pb-1 mdp-scroll">
              {monthKeys.map((key) => {
                const d = new Date(key + '-01');
                const label = d
                  .toLocaleDateString(
                    i18n.language === 'vi' ? 'vi-VN' : i18n.language === 'ru' ? 'ru-RU' : 'en-US',
                    { month: 'short', year: 'numeric' },
                  )
                  .toUpperCase();
                const isActive = selectedMonth === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setSelectedMonth(key);
                      setSelectedDate('');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all border cursor-pointer whitespace-nowrap ${
                      isActive
                        ? 'bg-[var(--accent)] text-black border-[var(--accent)]'
                        : 'bg-[var(--bg-base)] text-[var(--text-secondary)] border-[var(--border-color)] hover:bg-[var(--bg-elevated)]'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          )}

          <label className="text-[12px] text-[var(--text-secondary)] font-bold block mb-2 uppercase tracking-widest">
            {t('movieDetail.selectDate', 'SELECT DATE')}
          </label>
          <div className="flex gap-2 overflow-x-auto pb-1 mdp-scroll">
            {filteredDates.length === 0 ? (
              <div className="text-sm text-zinc-500 py-3 w-full text-center">
                {t('movieDetail.noDates', 'No dates available')}
              </div>
            ) : (
              filteredDates.map((date) => {
                const d = new Date(date);
                const isSelected = selectedDate === date;
                const month = d
                  .toLocaleDateString(
                    i18n.language === 'vi' ? 'vi-VN' : i18n.language === 'ru' ? 'ru-RU' : 'en-US',
                    { month: 'short' },
                  )
                  .toUpperCase();
                return (
                  <button
                    key={date}
                    type="button"
                    onClick={() => setSelectedDate(date)}
                    className={`flex flex-col items-center justify-center min-w-[64px] h-[72px] rounded-xl transition-all border cursor-pointer ${
                      isSelected
                        ? 'bg-[var(--accent)] text-black border-[var(--accent)] shadow-[0_0_12px_var(--accent-glow)]'
                        : 'bg-[var(--bg-base)] text-white border-[var(--border-color)] hover:bg-[var(--bg-elevated)]'
                    }`}
                  >
                    <span
                      className={`text-[10px] font-bold ${
                        isSelected ? 'text-black/80' : 'text-[var(--text-secondary)]'
                      }`}
                    >
                      {month}
                    </span>
                    <span className="text-xl font-bold">{d.getDate()}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div>
          <label className="text-[12px] text-[var(--text-secondary)] font-bold block mb-2 uppercase tracking-widest">
            {t('movieDetail.selectCinemaTime', 'SELECT CINEMA & TIME')}
          </label>
          <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1 mdp-scroll">
            {loadingShowtimes ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="animate-spin text-[var(--accent)]" size={24} />
              </div>
            ) : showtimes.length === 0 ? (
              <div className="text-center py-6 text-zinc-500 text-sm">
                {t('movieDetail.noSchedules', 'No schedules found for this date.')}
              </div>
            ) : (
              showtimes.map((cinema, idx) => (
                <div
                  key={idx}
                  className="bg-[var(--bg-base)] p-3.5 rounded-xl border border-[var(--border-color)]"
                >
                  <div className="mb-3">
                    <h4 className="font-bold text-white text-sm">{cinema.cinemaName}</h4>
                    <p className="text-[11px] text-[var(--text-secondary)]/70 mt-0.5">
                      {cinema.cinemaAddress}
                    </p>
                  </div>
                  <span className="block text-[10px] font-bold text-[var(--accent)] uppercase tracking-wider mb-2">
                    {cinema.movieFormatName}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {(cinema.scheduleTimesInfos || []).map((showtime) => (
                      <button
                        key={showtime.scheduleId}
                        type="button"
                        onClick={() => onSelectSchedule(showtime.scheduleId)}
                        className="px-4 py-2 rounded-lg bg-[var(--bg-elevated)] text-white border border-[var(--border-color)] hover:bg-[var(--accent)] hover:text-black hover:border-[var(--accent)] transition-all font-semibold text-sm cursor-pointer"
                      >
                        {new Date(showtime.showTime).toLocaleTimeString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {showtimes.length > 0 && (
          <p className="text-[11px] text-[var(--text-secondary)]/70 text-center">
            {t('movieDetail.continueSelectSeats', 'Continue to seats')} →{' '}
            {t('movieDetail.selectCinemaTime', 'pick a showtime')}
          </p>
        )}
      </div>
    </div>
  );
};
