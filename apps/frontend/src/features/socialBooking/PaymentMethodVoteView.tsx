import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Crown, Users, UserCheck, Loader2, Check, Clock } from 'lucide-react';
import type { PaymentMethodVoteState, PaymentMethodType } from '../../types/socialBooking.types';

interface Props {
  voteState: PaymentMethodVoteState | null;
  onVote: (method: PaymentMethodType) => Promise<void>;
  isHost: boolean;
}

const METHODS: { key: PaymentMethodType; icon: typeof Crown; color: string }[] = [
  { key: 'HostPayAll', icon: Crown, color: '#ff9500' },
  { key: 'IndividualPay', icon: Users, color: '#34C759' },
  { key: 'PairPay', icon: UserCheck, color: '#5E9EFF' },
];

export default function PaymentMethodVoteView({ voteState, onVote }: Props) {
  const { t } = useTranslation();
  const [voting, setVoting] = useState<PaymentMethodType | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);

  // Countdown timer
  useEffect(() => {
    if (!voteState?.voteExpiresAt || voteState.voteStatus === 'Completed') {
      setTimeLeft(0);
      return;
    }

    const update = () => {
      const expires = new Date(voteState.voteExpiresAt!).getTime();
      const now = Date.now();
      const diff = Math.max(0, Math.ceil((expires - now) / 1000));
      setTimeLeft(diff);
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [voteState?.voteExpiresAt, voteState?.voteStatus]);

  const progress = voteState && voteState.totalMembers > 0 ? (voteState.votedCount / voteState.totalMembers) * 100 : 0;
  const isCompleted = voteState?.voteStatus === 'Completed';
  const isVoting = voteState?.voteStatus === 'Voting';
  const isVoteExpired = isVoting && timeLeft <= 0;

  const handleVote = async (method: PaymentMethodType) => {
    if (voteState?.hasVoted || voting || isVoteExpired) return;
    setVoting(method);
    try { await onVote(method); } finally { setVoting(null); }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-[#e3e2e7] text-lg font-bold">{t('socialBooking.paymentMethodVote.title', 'Chọn phương thức thanh toán')}</h2>
        <p className="text-[#dbc2ad]/50 text-sm mt-1">{t('socialBooking.paymentMethodVote.subtitle', 'Bình chọn cách nhóm sẽ thanh toán')}</p>
      </div>

      {/* Countdown Timer */}
      {isVoting && timeLeft > 0 && (
        <div className="flex items-center justify-center gap-2 mb-4">
          <Clock className={`w-4 h-4 ${timeLeft <= 10 ? 'text-red-400 animate-pulse' : 'text-[#ffbd7f]'}`} />
          <span className={`text-lg font-bold font-mono ${timeLeft <= 10 ? 'text-red-400' : 'text-[#ffbd7f]'}`}>
            {formatTime(timeLeft)}
          </span>
          <span className="text-[10px] text-[#dbc2ad]/40">{t('socialBooking.paymentMethodVote.secondsLeft', 'giây còn lại')}</span>
        </div>
      )}

      {/* Completed banner */}
      {isCompleted && voteState?.resultMethod && (
        <div className="mb-4 p-3 bg-[#34C759]/10 border border-[#34C759]/20 rounded-xl text-center">
          <p className="text-[#34C759] text-sm font-bold">
            ✅ {t(`socialBooking.paymentMethodVote.${voteState.resultMethod}`, voteState.resultMethod)}
          </p>
          <p className="text-[#dbc2ad]/40 text-[10px] mt-1">{t('socialBooking.paymentMethodVote.resultLocked', 'Đã chốt kết quả')}</p>
        </div>
      )}

      <div className="space-y-3">
        {METHODS.map(({ key, icon: Icon, color }) => {
          const isSelected = voteState?.hasVoted && voteState.votes.some(v => v.paymentMethod === key);
          const count = voteState?.voteCounts?.[key] || 0;
          const isWinner = isCompleted && voteState?.resultMethod === key;
          return (
            <button
              key={key}
              onClick={() => handleVote(key)}
              disabled={!!voteState?.hasVoted || !!voting || isVoteExpired}
              className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all ${
                isWinner
                  ? 'border-[#34C759]/50 bg-[#34C759]/10'
                  : isSelected
                    ? 'border-[#ff9500]/50 bg-[#ff9500]/10'
                    : 'border-[#554334]/30 bg-[#1a1b1f]/60 hover:border-[#554334]/60'
              } ${(voteState?.hasVoted || isVoteExpired) ? 'cursor-default' : 'cursor-pointer'}`}
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
                {voting === key ? <Loader2 className="w-5 h-5 animate-spin" style={{ color }} /> : <Icon className="w-5 h-5" style={{ color }} />}
              </div>
              <div className="flex-1 text-left">
                <p className="text-[#e3e2e7] text-sm font-semibold">
                  {t(`socialBooking.paymentMethodVote.${key}`, key)}
                </p>
                <p className="text-[#dbc2ad]/40 text-[11px]">
                  {t(`socialBooking.paymentMethodVote.${key}Desc`, '')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#dbc2ad]/60 text-xs">{count} vote{count !== 1 ? 's' : ''}</span>
                {isSelected && <Check className="w-4 h-4 text-[#ff9500]" />}
                {isWinner && <span className="text-[10px] text-[#34C759] font-bold">✓</span>}
              </div>
            </button>
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="mt-4">
        <div className="flex justify-between text-[11px] text-[#dbc2ad]/50 mb-1">
          <span>{t('socialBooking.paymentMethodVote.progress', { voted: voteState?.votedCount || 0, total: voteState?.totalMembers || 0 })}</span>
          {isVoting && timeLeft > 0 && (
            <span className={timeLeft <= 10 ? 'text-red-400' : ''}>
              {formatTime(timeLeft)}
            </span>
          )}
        </div>
        <div className="w-full h-1.5 bg-[#343539]/60 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${timeLeft <= 10 && isVoting ? 'bg-red-400' : 'bg-[#ff9500]'}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
