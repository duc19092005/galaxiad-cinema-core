import React from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, Monitor, RefreshCw } from 'lucide-react';
import type { PublicSeatMap, PublicSeat } from '../../../types/public.types';

interface CashierSeatGridProps {
  loadingSeats: boolean;
  selectedScheduleId: string | null;
  seatMap: PublicSeatMap | null;
  selectedSeats: PublicSeat[];
  lockedSeats: Record<string, string>;
  unavailableSeats: Record<string, boolean>;
  onReloadSeats: () => void;
  onToggleSeat: (seat: PublicSeat) => void;
}

export const CashierSeatGrid: React.FC<CashierSeatGridProps> = ({
  loadingSeats,
  selectedScheduleId,
  seatMap,
  selectedSeats,
  lockedSeats,
  unavailableSeats,
  onReloadSeats,
  onToggleSeat,
}) => {
  const { t } = useTranslation();

  const maxCol = seatMap?.seatMap ? Math.max(...seatMap.seatMap.map((s) => s.colIndex)) + 1 : 0;
  const maxRow = seatMap?.seatMap ? Math.max(...seatMap.seatMap.map((s) => s.rowIndex)) + 1 : 0;

  return (
    <section className="col-span-5 bg-[#0f0f15]/30 flex flex-col overflow-hidden">
      {loadingSeats ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <Loader2 className="animate-spin text-[#ff8a00]" size={36} />
          <p className="text-sm text-zinc-400">{t('cashierSales.loadingSeatMap')}</p>
        </div>
      ) : !selectedScheduleId || !seatMap ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
          <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4">
            <Monitor className="text-zinc-600" size={32} />
          </div>
          <h2 className="text-lg font-bold text-white mb-1">
            {t('cashierSales.auditoriumScreen')}
          </h2>
          <p className="text-xs text-zinc-500 max-w-xs leading-relaxed">
            {t('cashierSales.selectMovieAndShowtime')}
          </p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden p-6">
          {/* Showtime brief banner */}
          <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-6">
            <div>
              <span className="text-[10px] uppercase font-extrabold tracking-widest text-[#ff8a00]">
                {seatMap.movieVisualFormatName}
              </span>
              <h2 className="text-base font-extrabold text-white leading-tight mt-0.5 mb-1">
                {seatMap.movieName}
              </h2>
              <p className="text-xs text-zinc-400 m-0">
                {t('cashierSales.room')}:{' '}
                <span className="text-white font-bold">{seatMap.auditoriumName}</span> •{' '}
                {t('cashierSales.showTime')}:{' '}
                <span className="text-white font-bold">
                  {new Date(seatMap.startTime).toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </p>
            </div>
            <button
              onClick={onReloadSeats}
              className="btn-icon p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-zinc-400 hover:text-white"
              title={t('cashierSales.reloadSeats')}
            >
              <RefreshCw size={14} />
            </button>
          </div>

          {/* Curve screen */}
          <div className="w-full flex flex-col items-center mb-12">
            <div className="screen-curve"></div>
            <p className="text-[9px] tracking-[0.4em] uppercase text-zinc-500 mt-2.5">
              {t('cashierSales.screen')}
            </p>
          </div>

          {/* Seats Grid */}
          <div className="flex-1 flex items-center justify-center overflow-auto custom-scroll mb-8">
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${maxCol}, minmax(0, 1fr))`,
                gridTemplateRows: `repeat(${maxRow}, minmax(0, 1fr))`,
                gap: 6,
                padding: 12,
                borderRadius: 16,
                backgroundColor: 'rgba(255, 255, 255, 0.01)',
                border: '1px solid rgba(255,255,255,0.02)',
                width: 'fit-content',
              }}
            >
              {seatMap.seatMap?.map((seat) => {
                const isSelected = selectedSeats.find((s) => s.seatId === seat.seatId);
                const lockedBy = lockedSeats[seat.seatId];
                const isLockedByOther = lockedBy && !isSelected;

                return (
                  <button
                    key={seat.seatId}
                    disabled={
                      seat.isBooked ||
                      !!isLockedByOther ||
                      unavailableSeats[seat.seatId.toLowerCase()]
                    }
                    onClick={() => onToggleSeat(seat)}
                    style={{
                      gridColumnStart: seat.colIndex + 1,
                      gridRowStart: seat.rowIndex + 1,
                      width: 34,
                      height: 34,
                      fontSize: 10,
                    }}
                    className={`rounded-lg flex items-center justify-center font-bold border transition-all duration-150 active:scale-90 ${
                      seat.isBooked
                        ? 'bg-zinc-950/60 text-zinc-800 border-zinc-900 cursor-not-allowed opacity-30'
                        : isLockedByOther
                        ? 'bg-red-950/30 text-red-500 border-red-900/50 cursor-not-allowed'
                        : isSelected
                        ? 'seat-selected'
                        : 'bg-[#181824] text-zinc-300 border-white/5 hover:bg-[#202030] hover:text-white cursor-pointer'
                    }`}
                    title={
                      isLockedByOther
                        ? `${t('cashierSales.lockedByOther')}: ${lockedBy}`
                        : seat.seatName
                    }
                  >
                    {seat.seatName}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Legends */}
          <div className="flex items-center justify-center gap-6 px-4 py-3 rounded-xl bg-white/5 border border-white/5 text-xs text-zinc-400">
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 rounded bg-[#181824] border border-white/5"></div>
              <span>{t('cashierSales.available')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 rounded bg-[#ff8a00] border border-[#ff8a00]"></div>
              <span>{t('cashierSales.selecting')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 rounded bg-red-950/30 border border-red-900/50"></div>
              <span>{t('cashierSales.reserving')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 rounded bg-zinc-950/60 border border-zinc-900 opacity-30"></div>
              <span>{t('cashierSales.sold')}</span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default CashierSeatGrid;
