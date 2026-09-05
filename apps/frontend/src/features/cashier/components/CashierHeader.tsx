import React from 'react';
import { useTranslation } from 'react-i18next';
import { Ticket, Popcorn, User, LogOut } from 'lucide-react';
import type { CashierShiftSession } from '../../../types/shift.types';

interface CashierHeaderProps {
  cinemaName: string;
  session: CashierShiftSession | null;
  bookingLoading: boolean;
  onOpenConcessionPanel: () => void;
  onClockOut: () => void;
  onLogout: () => void;
}

export const CashierHeader: React.FC<CashierHeaderProps> = ({
  cinemaName,
  session,
  bookingLoading,
  onOpenConcessionPanel,
  onClockOut,
  onLogout,
}) => {
  const { t } = useTranslation();

  return (
    <header className="h-16 border-b border-white/5 bg-[#0f0f15]/80 backdrop-blur-md px-6 flex items-center justify-between z-10">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#ff8a00] to-violet-600 flex items-center justify-center shadow-lg shadow-[#ff8a00]/10">
          <Ticket className="text-white" size={18} />
        </div>
        <div>
          <h1 className="font-extrabold text-md tracking-tight text-white m-0 flex items-center gap-2">
            CINEMA POS{' '}
            <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-amber-500/20 text-[#ff8a00] border border-amber-500/30">
              Terminal
            </span>
          </h1>
          <p className="text-[11px] text-zinc-400 m-0">{cinemaName}</p>
        </div>
      </div>

      {session && (
        <div className="flex items-center gap-4">
          <button
            onClick={onOpenConcessionPanel}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-[#ff8a00] bg-[#ff8a00]/10 border border-[#ff8a00]/30 hover:bg-[#ff8a00]/20 transition-colors"
          >
            <Popcorn size={14} />
            Bán bắp nước
          </button>

          <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-white/5 border border-white/5">
            <User className="text-[#ff8a00]" size={16} />
            <div className="text-left">
              <p className="text-xs font-bold text-white leading-tight m-0">{session.staffName}</p>
              <p className="text-[10px] text-zinc-400 m-0">{t('cashierSales.cashierActive')}</p>
            </div>
          </div>

          <button
            onClick={onClockOut}
            disabled={bookingLoading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-red-400 bg-red-950/20 border border-red-900/30 hover:bg-red-950/40 hover:text-red-300 transition-colors"
          >
            <LogOut size={14} />
            {t('cashierSales.shiftHandover')}
          </button>

          <button
            onClick={onLogout}
            disabled={bookingLoading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-zinc-400 bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white transition-colors"
          >
            <LogOut size={14} />
            {t('cashierSales.logout')}
          </button>
        </div>
      )}
    </header>
  );
};

export default CashierHeader;
