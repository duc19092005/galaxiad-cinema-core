import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle, XCircle, Loader2, Clock, CheckCircle2,
  Vote, ShieldCheck, CreditCard, Users
} from 'lucide-react';
import type { PaymentFailureVoteState } from '../../types/socialBooking.types';

interface Props {
  failureState: PaymentFailureVoteState;
  onVote: (option: number) => Promise<void>;
  onRaiseHand: (failedMemberId: string, isRaise: boolean) => Promise<void>;
  onExpire?: () => void;
  onPayVolunteer?: (failedMemberId: string) => void;
  currentUserId?: string;
  currentMemberId?: string;
}

export default function PaymentFailureVoteModal({
  failureState, onVote, onRaiseHand, onExpire, onPayVolunteer, currentUserId, currentMemberId
}: Props) {
  const { t } = useTranslation();
  const [voting, setVoting] = useState(false);
  const [raisingId, setRaisingId] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const phase = failureState.phase || 'Selection';
  const expiresAt = failureState.expiresAt;
  const failedMembers = failureState.failedMembers || [];
  const optionVotes = failureState.optionVotes || [];
  const resolutionAction = failureState.resolutionAction;

  // Check if current user is one of the failed members
  const isFailedMember = failedMembers.some(fm => fm.failedMemberId === currentMemberId);

  // Expiration countdown
  useEffect(() => {
    if (!expiresAt) {
      setCountdown(null);
      return;
    }

    const calculateRemaining = () => {
      const diff = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
      setCountdown(diff);
      if (diff <= 0) {
        if (countdownRef.current) clearInterval(countdownRef.current);
        onExpire?.();
      }
    };

    calculateRemaining();
    countdownRef.current = setInterval(calculateRemaining, 1000);

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [expiresAt, onExpire]);

  const handleVote = async (option: number) => {
    setVoting(true);
    try {
      await onVote(option);
    } finally {
      setVoting(false);
    }
  };

  const handleRaiseHand = async (failedMemberId: string, isRaise: boolean) => {
    setRaisingId(failedMemberId);
    try {
      await onRaiseHand(failedMemberId, isRaise);
    } finally {
      setRaisingId(null);
    }
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const renderSelectionPhase = () => {
    return (
      <div className="space-y-4">
        <p className="text-[#dbc2ad]/60 text-xs">
          {isFailedMember 
            ? t('socialBooking.paymentFailure.waitingSponsor', 'Đang chờ các thành viên khác đăng ký trả hộ...')
            : t('socialBooking.paymentFailure.chooseToPay', 'Chọn thành viên bạn muốn trả hộ:')}
        </p>

        <div className="space-y-3">
          {failedMembers.map(fm => {
            const hasVolunteers = fm.volunteers && fm.volunteers.length > 0;
            const isVolunteerForThis = fm.volunteers?.some(v => v.userId === currentUserId);
            const isConflict = fm.volunteers && fm.volunteers.length >= 2;
            const isSelf = fm.failedMemberId === currentMemberId;

            return (
              <div 
                key={fm.failedMemberId} 
                className={`p-4 rounded-xl border transition-all ${
                  isVolunteerForThis 
                    ? 'bg-[#ff9500]/5 border-[#ff9500]/30' 
                    : isConflict 
                      ? 'bg-red-500/5 border-red-500/30 animate-pulse'
                      : 'bg-[#343539]/30 border-[#554334]/20'
                }`}
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="min-w-0 flex-1">
                    <span className="text-[#e3e2e7] font-semibold text-sm block truncate">
                      {fm.failedMemberName} {isSelf && <span className="text-red-400 text-xs font-normal">(Bạn)</span>}
                    </span>
                    <span className="text-[#ff9500] text-xs font-bold block mt-0.5">
                      {fm.failedAmount.toLocaleString()}đ
                    </span>
                  </div>

                  {!isFailedMember && !isSelf && (
                    <button
                      onClick={() => handleRaiseHand(fm.failedMemberId, !isVolunteerForThis)}
                      disabled={raisingId !== null}
                      className={`px-4 py-2 rounded-lg font-bold text-xs shrink-0 transition-all ${
                        isVolunteerForThis
                          ? 'bg-red-500 text-white hover:bg-red-600'
                          : 'bg-[#ff9500] text-[#4b2800] hover:bg-[#ffbd7f]'
                      }`}
                    >
                      {raisingId === fm.failedMemberId ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : isVolunteerForThis ? (
                        t('socialBooking.paymentFailure.cancelVolunteer', 'Hủy trả hộ')
                      ) : (
                        t('socialBooking.paymentFailure.volunteer', 'Trả hộ')
                      )}
                    </button>
                  )}
                </div>

                {/* Volunteers list */}
                {hasVolunteers && (
                  <div className="mt-3 pt-3 border-t border-[#554334]/10 space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#34C759]" />
                      <span className="text-[11px] text-[#dbc2ad]/50 font-medium">
                        {t('socialBooking.paymentFailure.volunteerList', 'Người đăng ký trả hộ:')}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {fm.volunteers.map(v => (
                        <span 
                          key={v.userId} 
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                            v.userId === currentUserId 
                              ? 'bg-[#ff9500]/20 text-[#ffbd7f]' 
                              : 'bg-[#343539]/80 text-[#dbc2ad]'
                          }`}
                        >
                          {v.userName}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Conflict warning */}
                {isConflict && (
                  <div className="mt-3 p-2 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2">
                    <Users className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-red-300 leading-normal font-medium">
                      {t('socialBooking.paymentFailure.conflictWarning', 'Trùng lặp: Đang có nhiều người muốn trả hộ cho thành viên này. Hãy trao đổi và bấm hủy để nhường nhau.')}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderDiscussionPhase = () => {
    const totalVoted = optionVotes.length;
    const votesOpt1 = optionVotes.filter(v => v.option === 1).length;
    const votesOpt2 = optionVotes.filter(v => v.option === 2).length;
    const votesOpt3 = optionVotes.filter(v => v.option === 3).length;

    const myVote = optionVotes.find(v => v.voterUserId === currentUserId)?.option;

    const options = [
      { id: 1, text: t('socialBooking.paymentFailure.optVolunteer', 'Tiếp tục chọn người trả hộ'), votes: votesOpt1, color: 'text-[#ff9500]' },
      { id: 2, text: t('socialBooking.paymentFailure.optCancel', 'Hủy vé và hoàn tiền toàn bộ'), votes: votesOpt2, color: 'text-red-400' },
      { id: 3, text: t('socialBooking.paymentFailure.optProceed', 'Tiếp tục, bỏ thành viên lẻ'), votes: votesOpt3, color: 'text-purple-400' }
    ];

    return (
      <div className="space-y-4">
        {isFailedMember ? (
          <div className="bg-[#ff9500]/5 border border-[#ff9500]/20 rounded-xl p-4 text-center">
            <Clock className="w-8 h-8 text-[#ff9500] mx-auto mb-2 animate-pulse" />
            <p className="text-[#ffbd7f] text-sm font-semibold">
              {t('socialBooking.paymentFailure.groupDiscussing', 'Nhóm đang thảo luận phương án xử lý lẻ...')}
            </p>
            <p className="text-[#dbc2ad]/40 text-[11px] mt-1">
              {t('socialBooking.paymentFailure.failedCantVote', 'Bạn thanh toán thất bại nên không thể tham gia vote. Vui lòng chờ kết quả.')}
            </p>
          </div>
        ) : (
          <>
            <p className="text-[#dbc2ad]/60 text-xs">
              {t('socialBooking.paymentFailure.chooseResolution', 'Bình chọn phương án xử lý thành viên lẻ:')}
            </p>

            <div className="space-y-2.5">
              {options.map(opt => {
                const isSelected = myVote === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleVote(opt.id)}
                    disabled={voting}
                    className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                      isSelected 
                        ? 'bg-[#343539] border-[#ff9500] shadow-md shadow-[#ff9500]/5' 
                        : 'bg-[#343539]/30 border-[#554334]/20 hover:border-[#554334]/40'
                    }`}
                  >
                    <span className="text-[#e3e2e7] text-sm font-medium text-left">
                      {opt.text}
                    </span>
                    <div className="flex items-center gap-3 shrink-0">
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-[#ff9500]" />}
                      <span className="bg-[#1a1b1f] text-[#dbc2ad] text-xs px-2.5 py-1 rounded-lg font-bold">
                        {opt.votes} vote
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between text-[11px] text-[#dbc2ad]/40 pt-1">
              <div className="flex items-center gap-1.5">
                <Vote className="w-3.5 h-3.5 text-[#ff9500]" />
                <span>{t('socialBooking.paymentFailure.votedCount', { count: totalVoted })}</span>
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  const renderCompletedPhase = () => {
    if (resolutionAction === 'CancelOrder') {
      return (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
          <XCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
          <p className="text-red-400 text-sm font-bold">
            {t('socialBooking.paymentFailure.cancelledAndRefund', 'Hủy đơn vé & hoàn tiền')}
          </p>
          <p className="text-[#dbc2ad]/40 text-[11px] mt-1">
            {t('socialBooking.paymentFailure.refundNotice', 'Hệ thống đang tiến hành hoàn tiền lại vào ví ứng dụng.')}
          </p>
        </div>
      );
    }

    // Render sponsored items where sponsor is required to pay
    const sponsoredItems = failedMembers.filter(fm => fm.volunteers && fm.volunteers.length > 0);

    return (
      <div className="space-y-4">
        <div className="p-3 bg-[#34C759]/10 border border-[#34C759]/20 rounded-xl text-center flex items-center justify-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#34C759]" />
          <span className="text-[#34C759] text-sm font-bold">
            {t('socialBooking.paymentFailure.setupComplete', 'Hoàn tất đăng ký trả hộ!')}
          </span>
        </div>

        <div className="space-y-2">
          {sponsoredItems.map(fm => {
            const sponsor = fm.volunteers[0];
            const isMySponsor = sponsor.userId === currentUserId;
            const isMeSponsored = fm.failedMemberId === currentUserId;

            return (
              <div key={fm.failedMemberId} className="bg-[#343539]/30 border border-[#554334]/20 rounded-xl p-4 space-y-3">
                <div className="text-xs">
                  <span className="text-[#dbc2ad]/60 block">
                    {t('socialBooking.paymentFailure.sponsorFor', 'Thành viên được trả hộ:')}{' '}
                    <strong className="text-[#e3e2e7]">{fm.failedMemberName}</strong>
                  </span>
                  <span className="text-[#dbc2ad]/60 block mt-1">
                    {t('socialBooking.paymentFailure.sponsorBy', 'Người đứng ra trả hộ:')}{' '}
                    <strong className="text-[#ffbd7f]">{sponsor.userName}</strong>
                  </span>
                </div>

                {isMySponsor && onPayVolunteer && (
                  <button
                    onClick={() => onPayVolunteer(fm.failedMemberId)}
                    className="w-full py-2.5 bg-[#ff9500] text-[#4b2800] rounded-xl font-bold text-sm hover:bg-[#ffbd7f] transition-colors flex items-center justify-center gap-2 shadow-lg shadow-[#ff9500]/10"
                  >
                    <CreditCard className="w-4 h-4" />
                    {t('socialBooking.paymentFailure.payForMember', 'Thanh toán ngay')} ({fm.failedAmount.toLocaleString()}đ)
                  </button>
                )}

                {isMeSponsored && (
                  <div className="p-2 bg-[#ff9500]/5 border border-[#ff9500]/10 rounded-lg text-center">
                    <p className="text-[11px] text-[#ffbd7f] font-semibold animate-pulse">
                      {t('socialBooking.paymentFailure.waitingSponsorPay', 'Đang chờ người bảo trợ hoàn tất giao dịch...')}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-[#1a1b1f]/95 backdrop-blur-2xl border border-red-500/20 rounded-2xl w-full p-5 shadow-2xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
          <AlertTriangle className="w-5 h-5 text-red-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-[#e3e2e7] font-bold text-[15px]">
            {t('socialBooking.paymentFailure.title', 'Thanh toán thất bại')}
          </h3>
          <p className="text-[#dbc2ad]/50 text-[11px] truncate">
            {phase === 'Selection' && t('socialBooking.paymentFailure.stepSelection', 'Bước 1: Chọn người trả hộ')}
            {phase === 'Discussion' && t('socialBooking.paymentFailure.stepDiscussion', 'Bước 2: Biểu quyết phương án')}
            {phase === 'Completed' && t('socialBooking.paymentFailure.stepCompleted', 'Bước 3: Hoàn tất thanh toán')}
          </p>
        </div>
        {countdown !== null && countdown > 0 && phase !== 'Completed' && (
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-mono shrink-0 ${
            countdown <= 10 ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-[#ff9500]/20 text-[#ffbd7f]'
          }`}>
            <Clock className="w-4 h-4" />
            <span className="font-bold">{formatTime(countdown)}</span>
          </div>
        )}
      </div>

      {/* Render phase contents */}
      {phase === 'Selection' && renderSelectionPhase()}
      {phase === 'Discussion' && renderDiscussionPhase()}
      {phase === 'Completed' && renderCompletedPhase()}
    </div>
  );
}
