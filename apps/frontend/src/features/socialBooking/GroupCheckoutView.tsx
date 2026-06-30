import { useState, useEffect } from 'react';
import { Loader2, CreditCard, ChevronRight, Armchair, CheckCircle2 } from 'lucide-react';
import { publicApi } from '../../api/publicApi';
import type { GroupBookingState } from '../../types/socialBooking.types';
import type { PublicSeatMap } from '../../types/public.types';

interface Props {
  groupState: GroupBookingState;
  scheduleId: string;
  isHost: boolean;
  onPay: () => void;
  isPaying: boolean;
}

export default function GroupCheckoutView({ groupState, scheduleId, isHost, onPay, isPaying }: Props) {
  const [seatMap, setSeatMap] = useState<PublicSeatMap | null>(null);
  const [loading, setLoading] = useState(true);

  const activeMembers = groupState.members?.filter(m => m.status !== 'Removed') || [];
  const totalSeats = groupState.allGroupSeats?.length || 0;

  useEffect(() => {
    const fetchSeatMap = async () => {
      try {
        const res = await publicApi.getSeatMap(scheduleId);
        setSeatMap(res.data);
      } catch {
        console.error('Failed to load seat map');
      } finally {
        setLoading(false);
      }
    };
    if (scheduleId) fetchSeatMap();
  }, [scheduleId]);

  const memberColors = [
    '#3b82f6', '#22c55e', '#a855f7', '#f59e0b',
    '#06b6d4', '#ec4899', '#e17600', '#ef4444'
  ];

  const getMemberColor = (memberId?: string) => {
    if (!memberId) return '#666';
    const idx = groupState.members?.findIndex(m => m.memberId.toLowerCase() === memberId.toLowerCase()) ?? 0;
    return memberColors[idx % memberColors.length];
  };

  const getSeatForMember = (seatId: string) => {
    return groupState.allGroupSeats?.find(s => s.seatId.toLowerCase() === seatId.toLowerCase());
  };

  const isConfirmedSeat = (seatId: string) => {
    return groupState.allGroupSeats?.some(s => s.seatId.toLowerCase() === seatId.toLowerCase() && s.isConfirmed);
  };

  if (loading) {
    return (
      <div className="bg-[#1a1b1f]/60 backdrop-blur-xl border border-[#554334]/20 rounded-2xl p-6 flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-[#ff9500]" />
      </div>
    );
  }

  const seats = seatMap?.seatMap || [];
  const maxRow = seats.length > 0 ? Math.max(...seats.map(s => s.rowIndex)) + 1 : 0;
  const maxCol = seats.length > 0 ? Math.max(...seats.map(s => s.colIndex)) + 1 : 0;

  return (
    <div className="flex flex-col gap-4 w-full max-w-2xl mx-auto">
      {/* Stepper */}
      <div className="flex items-center justify-center bg-[#1a1b1f]/60 rounded-xl p-2 gap-2 w-full">
        <div className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-[#343539]/60 text-[#dbc2ad]/50 text-[11px] font-bold uppercase tracking-wider">
          <Armchair className="w-4 h-4" />
          <span>Chon ghe</span>
          <CheckCircle2 className="w-3.5 h-3.5 text-[#34C759]" />
        </div>
        <ChevronRight className="w-4 h-4 text-[#554334]" />
        <div className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-[#ff9500] text-[#4b2800] text-[11px] font-bold uppercase tracking-wider">
          <CreditCard className="w-4 h-4" />
          <span>Thanh toan</span>
        </div>
      </div>

      {/* Seat Grid - Read Only */}
      <div className="bg-[#1a1b1f]/60 backdrop-blur-xl border border-[#554334]/20 rounded-2xl p-6 relative overflow-hidden">
        {/* Screen Glow */}
        <div className="w-full max-w-xl mx-auto mb-8 relative">
          <div className="h-[3px] w-full bg-[#ff9500]/40 rounded-full"></div>
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-4/5 h-10 bg-[#ff9500]/10 rounded-full blur-2xl"></div>
          <p className="text-center mt-3 text-[#dbc2ad]/40 text-[9px] font-bold tracking-[0.4em] uppercase">Man Hinh / Screen</p>
        </div>

        {/* Seat Grid */}
        {seats.length > 0 && (
          <div className="w-full overflow-x-auto pb-4 flex justify-center" style={{ scrollbarWidth: 'none' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${maxCol}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${maxRow}, minmax(0, 1fr))`,
              gap: 'clamp(4px, 1.2vw, 8px)',
              padding: '12px',
              borderRadius: 16,
              backgroundColor: 'rgba(52,53,57,0.2)',
              width: 'fit-content',
              minWidth: `${maxCol * 34}px`,
            }} className="justify-center">
              {seats.map((seat) => {
                const groupSeat = getSeatForMember(seat.seatId);
                const hasGroupOwner = Boolean(groupSeat?.memberId);
                const confirmed = isConfirmedSeat(seat.seatId);
                const isBooked = seat.isBooked;

                let bgColor = 'bg-[#343539]/40 text-[#dbc2ad]/30 border border-[#554334]/10 opacity-40';
                let extraStyle: React.CSSProperties = {
                  gridColumnStart: seat.colIndex + 1,
                  gridRowStart: seat.rowIndex + 1,
                };

                if (isBooked && !hasGroupOwner) {
                  bgColor = 'bg-[#343539]/20 text-[#dbc2ad]/15 border border-[#554334]/10 opacity-25';
                } else if (confirmed && hasGroupOwner) {
                  bgColor = 'text-white border-none font-bold';
                  extraStyle.backgroundColor = '#34C759';
                  extraStyle.boxShadow = '0 0 12px rgba(52,199,89,0.4)';
                } else if (hasGroupOwner) {
                  const color = getMemberColor(groupSeat?.memberId);
                  bgColor = 'text-white border-none font-bold';
                  extraStyle.backgroundColor = color;
                  extraStyle.boxShadow = `0 0 10px ${color}60`;
                }

                return (
                  <div
                    key={seat.seatId}
                    style={extraStyle}
                    className={`w-[30px] h-[30px] md:w-[34px] md:h-[34px] rounded-lg flex items-center justify-center font-bold text-[9px] transition-all duration-200 ${bgColor}`}
                    title={hasGroupOwner ? `${groupSeat?.memberName}: ${seat.seatName}` : seat.seatName}
                  >
                    {seat.seatName}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="mt-8 flex flex-wrap justify-center gap-5 py-3 px-4 rounded-xl bg-[#0d0e12]/40 border border-[#554334]/10">
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded bg-[#34C759]" />
            <span className="text-[11px] text-[#dbc2ad]/60 font-medium">Da xac nhan (Nhom)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded bg-[#343539]/60 border border-[#554334]/30 opacity-40" />
            <span className="text-[11px] text-[#dbc2ad]/60 font-medium">Ghe trong</span>
          </div>
          {groupState.members?.filter(m => m.status !== 'Removed').map((m, i) => (
            <div key={m.memberId} className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 rounded" style={{ backgroundColor: memberColors[i % memberColors.length] }} />
              <span className="text-[11px] text-[#dbc2ad]/60 font-medium">{m.userName}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Summary Card */}
      <div className="bg-[#1a1b1f]/60 backdrop-blur-xl border border-[#554334]/20 rounded-2xl p-6 border-l-[3px] border-l-[#ff9500]">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex gap-8">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-[#dbc2ad]/50 uppercase tracking-wider">Thanh vien</span>
              <span className="text-[20px] font-semibold text-[#ffbd7f]">{activeMembers.length}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-[#dbc2ad]/50 uppercase tracking-wider">So ghe</span>
              <span className="text-[20px] font-semibold text-[#ffbd7f]">{totalSeats}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-[#dbc2ad]/50 uppercase tracking-wider">Tong cong</span>
              <span className="text-[20px] font-semibold text-[#e3e2e7]">{groupState.totalGroupAmount.toLocaleString()}d</span>
            </div>
          </div>

          {isHost ? (
            <button
              onClick={onPay}
              disabled={isPaying || groupState.status !== 'Confirming'}
              className="w-full md:w-auto px-8 py-4 bg-[#ff9500] text-[#4b2800] rounded-full font-bold flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-[#ff9500]/20 disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <div className="flex flex-col items-start leading-tight text-left">
                <span className="text-[10px] font-bold uppercase opacity-80">Thanh toan tong cong</span>
                <span className="text-[15px] font-semibold">Tiep tuc voi VNPay</span>
              </div>
              {isPaying ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <CreditCard className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              )}
            </button>
          ) : (
            <div className="flex items-center gap-3 px-6 py-4 bg-[#343539]/40 rounded-xl border border-[#554334]/20">
              <Loader2 className="w-4 h-4 animate-spin text-[#ffbd7f]" />
              <span className="text-[13px] text-[#dbc2ad]">Dang cho chu phong thanh toan...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
