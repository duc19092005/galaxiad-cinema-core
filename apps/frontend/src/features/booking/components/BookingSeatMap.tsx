import React from 'react';
import { useTranslation } from 'react-i18next';
import type { PublicSeatMap, PublicSeat } from '../../../types/public.types';

interface BookingSeatMapProps {
  seatMap: PublicSeatMap;
  selectedSeats: PublicSeat[];
  lockedSeats: Record<string, string>;
  unavailableSeats: Record<string, boolean>;
  ticketQuantity: number;
  onToggleSeat: (seat: PublicSeat) => void;
}

export const BookingSeatMap: React.FC<BookingSeatMapProps> = ({
  seatMap,
  selectedSeats,
  lockedSeats,
  unavailableSeats,
  ticketQuantity,
  onToggleSeat,
}) => {
  const { t } = useTranslation();

  const maxCol = Math.max(...(seatMap.seatMap?.map((s) => s.colIndex) || [0])) + 1;
  const maxRow = Math.max(...(seatMap.seatMap?.map((s) => s.rowIndex) || [0])) + 1;

  return (
    <section className="glass-card rounded-2xl p-6 border border-white/10 flex flex-col items-center">
      <div className="w-full flex justify-between items-center border-b border-white/10 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-extrabold ${
              ticketQuantity > 0 ? 'bg-[#ff8a00] text-black' : 'bg-zinc-800 text-zinc-500'
            }`}
          >
            2
          </span>
          <h2
            className={`text-lg md:text-xl font-bold m-0 ${
              ticketQuantity > 0 ? 'text-white' : 'text-zinc-500'
            }`}
          >
            {t('booking.selectSeatsStep', 'Chọn ghế')}
          </h2>
        </div>
        <span
          className={`text-xs font-bold ${
            selectedSeats.length === ticketQuantity && ticketQuantity > 0
              ? 'text-emerald-400'
              : 'text-[#ff8a00]'
          }`}
        >
          {selectedSeats.length}/{ticketQuantity || 0}
        </span>
      </div>

      {/* Screen Curve */}
      <div
        className={`w-full max-w-2xl mb-10 relative transition-opacity ${
          ticketQuantity > 0 ? 'opacity-100' : 'opacity-50'
        }`}
      >
        <div className="screen-curve"></div>
        <p className="text-center text-[#ddc1ae] text-[10px] tracking-[0.4em] uppercase mt-3 font-semibold">
          SCREEN
        </p>
      </div>

      {/* Seat Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${maxCol}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${maxRow}, minmax(0, 1fr))`,
          gap: 'clamp(4px, 1.5vw, 8px)',
          padding: 'clamp(8px, 2vw, 16px)',
          borderRadius: 16,
          backgroundColor: 'rgba(255,255,255,0.02)',
          width: '100%',
          maxWidth: `min(${maxCol * 60}px, 100%)`,
          justifyContent: 'center',
          placeItems: 'center',
        }}
        className="mb-8"
      >
        {seatMap.centerRowStart !== undefined &&
          seatMap.centerRowEnd !== undefined &&
          seatMap.centerColStart !== undefined &&
          seatMap.centerColEnd !== undefined &&
          seatMap.centerRowStart > 0 &&
          seatMap.centerColStart > 0 && (
            <div
              style={{
                gridRowStart: seatMap.centerRowStart + 1,
                gridRowEnd: seatMap.centerRowEnd + 2,
                gridColumnStart: seatMap.centerColStart + 1,
                gridColumnEnd: seatMap.centerColEnd + 2,
                border: '2px dashed rgba(255, 138, 0, 0.45)',
                backgroundColor: 'rgba(255, 138, 0, 0.02)',
                borderRadius: '16px',
                pointerEvents: 'none',
                zIndex: 0,
                boxShadow: '0 0 15px rgba(255, 138, 0, 0.05)',
                margin: '-6px',
              }}
            />
          )}

        {seatMap.seatMap?.map((seat) => {
          const isSelected = selectedSeats.find((s) => s.seatId === seat.seatId);
          const seatUnavailable = unavailableSeats[seat.seatId.toLowerCase()];
          const lockedBy = lockedSeats[seat.seatId.toLowerCase()];
          const isLockedByOther = lockedBy && !isSelected;

          const isCenterSeat =
            seatMap.centerRowStart !== undefined &&
            seatMap.centerRowEnd !== undefined &&
            seatMap.centerColStart !== undefined &&
            seatMap.centerColEnd !== undefined &&
            seat.rowIndex >= seatMap.centerRowStart &&
            seat.rowIndex <= seatMap.centerRowEnd &&
            seat.colIndex >= seatMap.centerColStart &&
            seat.colIndex <= seatMap.centerColEnd;

          const title = isLockedByOther ? `Selected by ${lockedBy}` : seat.seatName;

          return (
            <button
              key={seat.seatId}
              disabled={seat.isBooked || seatUnavailable || !!isLockedByOther}
              onClick={() => onToggleSeat(seat)}
              style={{
                gridColumnStart: seat.colIndex + 1,
                gridRowStart: seat.rowIndex + 1,
              }}
              className={`w-full aspect-square max-w-[42px] md:max-w-[48px] rounded-lg flex items-center justify-center font-bold text-xs transition-all duration-200 active:scale-90 border ${
                seat.isBooked || seatUnavailable
                  ? 'bg-zinc-900/50 text-zinc-700 border-zinc-800/40 opacity-40 cursor-not-allowed'
                  : isLockedByOther
                  ? 'bg-red-500/20 text-[#ef4444] border-red-500/40 cursor-not-allowed'
                  : isSelected
                  ? 'seat-selected'
                  : isCenterSeat
                  ? 'bg-zinc-800 text-[#ff8a00] hover:bg-zinc-700 hover:text-white border-[#ff8a00]/60 shadow-[0_0_6px_rgba(255,138,0,0.25)] cursor-pointer'
                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white cursor-pointer border-zinc-700/50'
              }`}
              title={title}
            >
              {seat.seatName}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-6 px-6 py-3.5 rounded-full glass-card">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-sm bg-zinc-800 border border-zinc-700/50"></div>
          <span className="text-xs text-[#ddc1ae]">{t('booking.available', 'Available')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-sm bg-zinc-800 border border-[#ff8a00]/60 shadow-[0_0_6px_rgba(255,138,0,0.25)]"></div>
          <span className="text-xs text-[#ddc1ae]">
            {t('booking.center', 'Vùng trung tâm (Góc đẹp)')}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-sm bg-[#ff8a00] shadow-[0_0_8px_rgba(255,138,0,0.5)] border border-[#ff8a00]"></div>
          <span className="text-xs text-[#ddc1ae]">{t('booking.selected', 'Selected')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-sm bg-red-500/20 border border-red-500/40"></div>
          <span className="text-xs text-[#ddc1ae]">
            {t('booking.locked', 'Locked (by others)')}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-sm bg-zinc-900/50 border border-zinc-800/40 opacity-40"></div>
          <span className="text-xs text-[#ddc1ae]">{t('booking.occupied', 'Occupied')}</span>
        </div>
      </div>
    </section>
  );
};

export default BookingSeatMap;
