import { Check, X, UserPlus } from 'lucide-react';
import type { GroupMemberDto } from '../../types/socialBooking.types';

interface Props {
  members?: GroupMemberDto[];
  maxMembers: number;
  onInvite?: () => void;
}

const statusConfig: Record<string, { color: string; bgColor: string; borderColor: string; label: string; pulse?: boolean }> = {
  Invited: { color: 'text-yellow-400', bgColor: 'bg-yellow-400/10', borderColor: 'border-yellow-400/30', label: 'Da moi' },
  Joined: { color: 'text-[#ffbd7f]', bgColor: 'bg-[#ff9500]/10', borderColor: 'border-[#ff9500]/30', label: 'Dang chon ghe', pulse: true },
  SeatsSelected: { color: 'text-[#ffbd7f]', bgColor: 'bg-[#ff9500]/10', borderColor: 'border-[#ff9500]/30', label: 'Dang chon ghe', pulse: true },
  Confirmed: { color: 'text-[#34C759]', bgColor: 'bg-[#34C759]/10', borderColor: 'border-[#34C759]/30', label: 'Confirmed' },
  Paid: { color: 'text-[#34C759]', bgColor: 'bg-[#34C759]/10', borderColor: 'border-[#34C759]/30', label: 'Da thanh toan' },
  PaymentFailed: { color: 'text-red-400', bgColor: 'bg-red-400/10', borderColor: 'border-red-400/30', label: 'Thanh toan that bai' },
  Covered: { color: 'text-purple-400', bgColor: 'bg-purple-400/10', borderColor: 'border-purple-400/30', label: 'Chu phong thanh toan' },
};

export default function GroupMemberList({ members = [], maxMembers, onInvite }: Props) {
  const currentUserId = JSON.parse(localStorage.getItem('user_info') || '{}').userId;

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <h2 className="text-[15px] font-semibold text-[#e3e2e7]">Members</h2>
        <span className="text-[11px] font-bold text-[#ffbd7f] bg-[#343539]/80 px-2.5 py-1 rounded-md">
          {members.length}/{maxMembers}
        </span>
      </div>

      {/* Member Cards */}
      <div className="flex flex-col gap-2.5">
        {members.map((member) => {
          const config = statusConfig[member.status] || statusConfig.Joined;
          const isConfirmed = member.status === 'Confirmed' || member.status === 'Paid';
          const isMe = member.userId === currentUserId;

          return (
            <div
              key={member.memberId}
              className={`bg-[#1a1b1f]/60 backdrop-blur-xl border border-[#554334]/20 p-3.5 rounded-xl relative overflow-hidden ${
                member.isHost ? 'border-l-[3px] border-l-[#ff9500]' : isConfirmed ? 'border-l-[3px] border-l-[#34C759]' : 'border-l-[3px] border-l-[#554334]/40'
              }`}
            >
              {/* Host badge */}
              {member.isHost && (
                <div className="absolute top-0 right-0 bg-[#ff9500] text-[#4b2800] px-2 py-0.5 rounded-bl-lg text-[9px] font-bold uppercase tracking-wider">
                  Host
                </div>
              )}

              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div className={`w-11 h-11 rounded-full overflow-hidden border-2 ${
                    member.isHost ? 'border-[#ff9500]' : isConfirmed ? 'border-[#34C759]/50' : 'border-[#554334]/40'
                  }`}>
                    {member.avatarUrl ? (
                      <img src={member.avatarUrl} alt={member.userName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#ff9500] to-[#ea580c] flex items-center justify-center text-[#4b2800] font-bold text-sm">
                        {member.userName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  {/* Status dot */}
                  <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-[#121317] flex items-center justify-center ${
                    isConfirmed ? 'bg-[#34C759]' : member.status === 'PaymentFailed' ? 'bg-red-400' : 'bg-[#343539]'
                  }`}>
                    {isConfirmed && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                    {member.status === 'PaymentFailed' && <X className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[13px] font-semibold text-[#e3e2e7] truncate">
                      {member.userName}{isMe ? ' (Ban)' : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${config.bgColor} ${config.color} ${config.borderColor} ${config.pulse ? 'animate-pulse' : ''}`}>
                      {config.label}
                    </span>
                  </div>
                  {member.selectedSeats.length > 0 && (
                    <p className="text-[11px] text-[#dbc2ad]/50 mt-1">
                      Ghế: {member.selectedSeats.map(s => s.seatNumber).join(', ')}
                    </p>
                  )}
                </div>

                {/* Price */}
                {member.amountToPay > 0 && (
                  <div className="text-right shrink-0">
                    <p className="text-[12px] font-semibold text-[#ffbd7f]">
                      {member.amountPaid > 0
                        ? `${member.amountPaid.toLocaleString()}d`
                        : `${member.amountToPay.toLocaleString()}d`}
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Empty Slots */}
        {Array.from({ length: maxMembers - members.length }, (_, i) => (
          <div
            key={`empty-${i}`}
            className="border-2 border-dashed border-[#554334]/20 p-4 rounded-xl flex items-center justify-center gap-2.5 opacity-40"
          >
            <UserPlus className="w-4 h-4 text-[#dbc2ad]" />
            <span className="text-[11px] font-bold text-[#dbc2ad] uppercase tracking-wider">Dang cho thanh vien...</span>
          </div>
        ))}
      </div>

      {/* Invite Button */}
      {onInvite && (
        <button
          onClick={onInvite}
          className="mt-1 w-full py-3 rounded-xl border border-dashed border-[#554334]/40 text-[#dbc2ad] text-[11px] font-bold uppercase tracking-wider hover:bg-[#343539]/40 transition-colors flex items-center justify-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          Moi Ban Be
        </button>
      )}
    </div>
  );
}
