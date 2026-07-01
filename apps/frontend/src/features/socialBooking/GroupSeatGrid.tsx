import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { socialBookingApi } from '../../api/socialBookingApi';
import { publicApi } from '../../api/publicApi';
import { useSeatWs } from '../../hooks/useSeatWs';
import { showError, showSuccess } from '../../utils/ToastUtils';
import type { GroupBookingState } from '../../types/socialBooking.types';
import type { PublicSeatMap, PublicSeat, PublicPricing } from '../../types/public.types';

interface Props {
  groupState: GroupBookingState;
  scheduleId: string;
  onRefresh: () => void;
}

const memberColors = [
  '#3b82f6', '#22c55e', '#a855f7', '#f59e0b',
  '#06b6d4', '#ec4899', '#e17600', '#ef4444'
];

export default function GroupSeatGrid({ groupState, scheduleId, onRefresh }: Props) {
  const { t } = useTranslation();
  const [submitting, setSubmitting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [seatMap, setSeatMap] = useState<PublicSeatMap | null>(null);
  const [pricing, setPricing] = useState<PublicPricing | null>(null);
  const [seatSegmentMap, setSeatSegmentMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const { lockedSeats } = useSeatWs(scheduleId, { ignoreGroupSessionId: groupState.groupSessionId });

  const currentUserId = JSON.parse(localStorage.getItem('user_info') || '{}').userId;
  const isMember = groupState.members?.some(m => m.userId === currentUserId);
  const myMember = groupState.members?.find(m => m.userId === currentUserId);
  const myConfirmedSeats = useMemo(() => myMember?.selectedSeats?.map(s => s.seatId) || [], [myMember]);
  const isMyStatusConfirmed = myMember?.status === 'Confirmed' || myMember?.status === 'Paid';

  useEffect(() => {
    const fetchSeatMap = async () => {
      try {
        const [seatRes, priceRes] = await Promise.all([
          publicApi.getSeatMap(scheduleId),
          publicApi.getPricing(scheduleId).catch(() => null),
        ]);
        setSeatMap(seatRes.data);
        if (priceRes?.isSuccess) setPricing(priceRes.data);
      } catch {
        console.error('Failed to load seat map');
      } finally {
        setLoading(false);
      }
    };
    if (scheduleId) fetchSeatMap();
  }, [scheduleId]);

  const getMemberColor = (memberId?: string) => {
    if (!memberId) return '#666';
    const idx = groupState.members?.findIndex(m => m.memberId.toLowerCase() === memberId.toLowerCase()) ?? 0;
    return memberColors[idx % memberColors.length];
  };

  const getGroupSeatForMember = (seatId: string) => {
    return groupState.allGroupSeats?.find(s => s.seatId.toLowerCase() === seatId.toLowerCase());
  };

  const toggleSeat = async (seat: PublicSeat) => {
    if (!isMember || seat.isBooked || submitting) return;
    if (isMyStatusConfirmed || groupState.status === 'Confirming' || groupState.status === 'Paying' || groupState.status === 'Completed') return;

    const isCurrentlySelected = myConfirmedSeats.includes(seat.seatId);
    const groupSeat = getGroupSeatForMember(seat.seatId);

    const isLockedByOther = lockedSeats[seat.seatId.toLowerCase()] && !isCurrentlySelected && !groupSeat;
    if (isLockedByOther) {
      showError(t('socialBooking.seat.lockedByOther', 'Ghế này đang được giữ bởi người khác.'));
      return;
    }

    if (groupSeat && groupSeat.memberId && groupSeat.memberId.toLowerCase() !== myMember?.memberId?.toLowerCase()) {
      showError(t('socialBooking.seat.selectedByTeammate', 'Ghế này đã được đồng đội trong nhóm chọn.'));
      return;
    }

    let newSeatIds: string[];
    if (isCurrentlySelected) {
      newSeatIds = myConfirmedSeats.filter(id => id !== seat.seatId);
      setSeatSegmentMap(prev => { const next = { ...prev }; delete next[seat.seatId]; return next; });
    } else {
      if (myConfirmedSeats.length >= 10) {
        showError(t('socialBooking.seat.maxReached', 'Bạn có thể chọn tối đa 10 ghế.'));
        return;
      }
      newSeatIds = [...myConfirmedSeats, seat.seatId];
      if (pricing && pricing.segmentPrices.length > 0) {
        setSeatSegmentMap(prev => ({ ...prev, [seat.seatId]: pricing.segmentPrices[0].userSegmentId }));
      }
    }

    setSubmitting(true);
    try {
      const result = await socialBookingApi.selectSeats(groupState.groupSessionId, {
        seatSelections: newSeatIds.map(id => ({
          seatId: id,
          userSegmentId: seatSegmentMap[id] || pricing?.segmentPrices?.[0]?.userSegmentId || '7b2e1a9d-3f5c-4e8b-91d2-a6b3c4d5e6f7'
        }))
      });
      if (result.isSuccess) {
        onRefresh();
      } else {
        showError(result.message || t('socialBooking.seat.errorUpdate', 'Không thể cập nhật chọn ghế'));
      }
    } catch (err: any) {
      showError(err?.response?.data?.message || 'Khong the cap nhat chon ghe');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmSeats = async () => {
    if (!isMember || myConfirmedSeats.length === 0 || confirming || isMyStatusConfirmed) return;
    setConfirming(true);
    try {
      const result = await socialBookingApi.confirmSeats(groupState.groupSessionId, myConfirmedSeats);
      if (result.isSuccess) {
        showSuccess(result.message || t('socialBooking.seat.confirmSuccess', 'Đã xác nhận ghế thành công!'));
        onRefresh();
      } else {
        showError(result.message || t('socialBooking.seat.errorConfirm', 'Không thể xác nhận ghế'));
      }
    } catch (err: any) {
      showError(err?.response?.data?.message || 'Khong the xac nhan ghe');
    } finally {
      setConfirming(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-[#1a1b1f]/60 backdrop-blur-xl border border-[#554334]/20 rounded-2xl p-6 flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-[#ff9500]" />
      </div>
    );
  }

  if (!seatMap) {
    return (
      <div className="bg-[#1a1b1f]/60 backdrop-blur-xl border border-[#554334]/20 rounded-2xl p-6 text-center py-20">
        <p className="text-[#dbc2ad]/50">{t('socialBooking.seat.errorLoadMap', 'Không thể tải bản đồ ghế')}</p>
      </div>
    );
  }

  const seats = seatMap.seatMap || [];
  const maxRow = Math.max(...seats.map(s => s.rowIndex)) + 1;
  const maxCol = Math.max(...seats.map(s => s.colIndex)) + 1;

  return (
    <div className="bg-[#1a1b1f]/60 backdrop-blur-xl border border-[#554334]/20 rounded-2xl p-6 relative overflow-hidden">
      {/* Screen Glow */}
      <div className="w-full max-w-xl mx-auto mb-10 relative">
        <div className="h-[3px] w-full bg-[#ff9500]/40 rounded-full"></div>
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-4/5 h-10 bg-[#ff9500]/10 rounded-full blur-2xl"></div>
        <p className="text-center mt-3 text-[#dbc2ad]/40 text-[9px] font-bold tracking-[0.4em] uppercase">{t('socialBooking.seat.screenLabel', 'Màn Hình / Screen')}</p>
      </div>

      {/* Seat Grid */}
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
            const isSelected = myConfirmedSeats.some(id => id.toLowerCase() === seat.seatId.toLowerCase());
            const groupSeat = getGroupSeatForMember(seat.seatId);
            const isBooked = seat.isBooked;
            const groupSeatMemberId = groupSeat?.memberId ?? '';
            const hasGroupOwner = Boolean(groupSeatMemberId);
            const isTeammateSeat = hasGroupOwner && groupSeatMemberId.toLowerCase() !== (myMember?.memberId ?? '').toLowerCase();
            const isLockedByOther = Boolean(lockedSeats[seat.seatId.toLowerCase()] && !isSelected && !hasGroupOwner);

            let bgColor = 'bg-[#343539]/40 text-[#dbc2ad]/40 border border-[#554334]/20 hover:border-[#ff9500]/50';
            let extraStyle: React.CSSProperties = {
              gridColumnStart: seat.colIndex + 1,
              gridRowStart: seat.rowIndex + 1,
            };
            let cursorClass = 'cursor-pointer active:scale-95';

            if (isBooked && !hasGroupOwner) {
              bgColor = 'bg-[#343539]/20 text-[#dbc2ad]/20 border border-[#554334]/10 opacity-30';
              cursorClass = 'cursor-not-allowed';
            } else if (isSelected) {
              bgColor = 'bg-[#ff9500] text-[#4b2800] border-none';
              extraStyle.boxShadow = '0 0 15px rgba(255,149,0,0.4)';
              cursorClass = 'cursor-pointer scale-105 active:scale-95';
            } else if (isTeammateSeat) {
              const color = getMemberColor(groupSeatMemberId);
              bgColor = 'text-white border-none font-bold scale-105';
              extraStyle.backgroundColor = color;
              extraStyle.boxShadow = `0 0 10px ${color}60`;
              cursorClass = 'cursor-not-allowed';
            } else if (isLockedByOther) {
              bgColor = 'bg-red-500/15 text-red-400 border border-red-500/30';
              cursorClass = 'cursor-not-allowed';
            }

            return (
              <button
                key={seat.seatId}
                onClick={() => toggleSeat(seat)}
                disabled={isBooked || isLockedByOther || (isTeammateSeat && !isSelected)}
                style={extraStyle}
                className={`w-[30px] h-[30px] md:w-[34px] md:h-[34px] rounded-lg flex items-center justify-center font-bold text-[9px] transition-all duration-200 border ${bgColor} ${cursorClass}`}
                title={
                  isBooked && !hasGroupOwner ? t('socialBooking.seat.booked', 'Đã có người mua')
                  : isTeammateSeat ? t('socialBooking.seat.selectedBy', 'Được chọn bởi {{name}}').replace('{{name}}', groupSeat?.memberName ?? 'thành viên')
                  : isLockedByOther ? t('socialBooking.seat.lockedByOtherShort', 'Đang được giữ bởi người khác')
                  : isSelected ? t('socialBooking.seat.yourSeat', 'Ghế của bạn')
                  : seat.seatName
                }
              >
                {seat.seatName}
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-8 flex flex-wrap justify-center gap-5 py-3 px-4 rounded-xl bg-[#0d0e12]/40 border border-[#554334]/10">
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 rounded bg-[#343539]/60 border border-[#554334]/30" />
          <span className="text-[11px] text-[#dbc2ad]/60 font-medium">{t('socialBooking.seat.legendEmpty', 'Trống')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 rounded bg-[#ff9500]" />
          <span className="text-[11px] text-[#dbc2ad]/60 font-medium">{t('socialBooking.seat.legendYourChoice', 'Bạn Chọn')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 rounded bg-[#34C759]" />
          <span className="text-[11px] text-[#dbc2ad]/60 font-medium">{t('socialBooking.seat.legendConfirmed', 'Đã Xác Nhận')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 rounded bg-red-500/20 border border-red-500/30" />
          <span className="text-[11px] text-[#dbc2ad]/60 font-medium">{t('socialBooking.seat.legendLocked', 'Người lạ giữ')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 rounded bg-[#343539]/30 opacity-30" />
          <span className="text-[11px] text-[#dbc2ad]/60 font-medium">{t('socialBooking.seat.legendSold', 'Đã bán')}</span>
        </div>
        {groupState.members?.map((m, i) => (
          <div key={m.memberId} className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded" style={{ backgroundColor: memberColors[i % memberColors.length] }} />
            <span className="text-[11px] text-[#dbc2ad]/60 font-medium">{m.userName}{m.userId === currentUserId && ` ${t('socialBooking.seat.you', '(Bạn)')}`}</span>
          </div>
        ))}
      </div>

      {/* Segment Selector for Selected Seats */}
      {isMember && myConfirmedSeats.length > 0 && !isMyStatusConfirmed && pricing && pricing.segmentPrices.length > 1 && (
        <div className="mt-5 bg-[#0d0e12]/40 border border-[#554334]/10 rounded-xl p-4">
          <p className="text-[10px] font-bold text-[#dbc2ad]/50 uppercase tracking-wider mb-3">{t('socialBooking.seat.selectSegment', 'Chọn danh đối cho từng ghế')}</p>
          <div className="flex flex-col gap-2">
            {myConfirmedSeats.map(seatId => {
              const groupSeat = getGroupSeatForMember(seatId);
              const seatName = groupSeat?.seatNumber || seatId.slice(-3);
              return (
                <div key={seatId} className="flex items-center gap-3">
                  <span className="text-[12px] font-bold text-[#ffbd7f] w-12">{seatName}</span>
                  <select
                    value={seatSegmentMap[seatId] || pricing.segmentPrices[0].userSegmentId}
                    onChange={(e) => setSeatSegmentMap(prev => ({ ...prev, [seatId]: e.target.value }))}
                    className="flex-1 bg-[#343539]/60 border border-[#554334]/30 text-[#e3e2e7] text-[12px] px-3 py-1.5 rounded-lg outline-none cursor-pointer focus:border-[#ff9500]/50 transition-colors"
                  >
                    {pricing.segmentPrices.map(sp => (
                      <option key={sp.userSegmentId} value={sp.userSegmentId} className="bg-[#1a1b1f]">
                        {sp.segmentName}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Confirm Button */}
      {isMember && myConfirmedSeats.length > 0 && (
        <div className="mt-5">
          <button
            onClick={handleConfirmSeats}
            disabled={isMyStatusConfirmed || confirming || groupState.status === 'Confirming' || groupState.status === 'Paying' || groupState.status === 'Completed'}
            className={`w-full py-3.5 rounded-full font-semibold text-sm flex items-center justify-center gap-2.5 transition-all duration-200 ${
              isMyStatusConfirmed
                ? 'bg-[#34C759]/15 text-[#34C759] border border-[#34C759]/30 cursor-default'
                : 'bg-[#ff9500] text-[#4b2800] hover:bg-[#ffbd7f] active:scale-[0.98] shadow-lg shadow-[#ff9500]/20'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {confirming ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isMyStatusConfirmed ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : null}
            {isMyStatusConfirmed ? t('socialBooking.seat.confirmed', 'Đã xác nhận ghế') : confirming ? t('socialBooking.seat.confirming', 'Đang xác nhận...') : t('socialBooking.seat.confirmSeats', 'Xác nhận ghế')}
          </button>
        </div>
      )}
    </div>
  );
}
