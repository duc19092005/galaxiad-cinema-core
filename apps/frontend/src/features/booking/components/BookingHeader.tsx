import React from 'react';
import { Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { PublicSeatMap } from '../../../types/public.types';

interface BookingHeaderProps {
  seatMap: PublicSeatMap;
  ageSymbol?: string;
  onOpenGroupModal: () => void;
  onBack: () => void;
}

export const BookingHeader: React.FC<BookingHeaderProps> = ({
  seatMap,
  ageSymbol,
  onOpenGroupModal,
  onBack,
}) => {
  const { t } = useTranslation();

  return (
    <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 border-l-4 border-[#ff8a00] pl-6">
      <div>
        <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-2 leading-tight">
          {seatMap.movieName}
        </h1>
        <div className="flex flex-wrap items-center gap-4 text-[#ddc1ae] text-sm font-semibold">
          <span className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[#ff8a00] text-[18px]">theaters</span>
            {seatMap.auditoriumName} ({seatMap.movieVisualFormatName || '2D'})
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-white/20"></span>
          <span className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[#ff8a00] text-[18px]">calendar_today</span>
            {new Date(seatMap.startTime).toLocaleDateString('vi-VN', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-white/20"></span>
          <span className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[#ff8a00] text-[18px]">schedule</span>
            {new Date(seatMap.startTime).toLocaleTimeString('vi-VN', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
          {ageSymbol && (
            <span className="px-2.5 py-0.5 bg-red-900/60 text-red-200 border border-red-700/40 rounded text-[11px] uppercase font-bold tracking-wider ml-2">
              {ageSymbol}
            </span>
          )}
        </div>
      </div>

      {/* Action buttons: Group Booking & Change Session */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenGroupModal}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 border border-white/10 text-white/90 hover:bg-[#ff8a00]/20 hover:border-[#ff8a00]/40 hover:text-[#ff8a00] transition-all duration-200 cursor-pointer font-semibold text-sm"
        >
          <Users size={16} />
          {t('socialBooking.groupBookingBtn', 'Đặt vé nhóm')}
        </button>
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-[#ff8a00] hover:gap-3 transition-all duration-200 bg-transparent border-none cursor-pointer font-bold text-sm"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Change Session
        </button>
      </div>
    </div>
  );
};

export default BookingHeader;
