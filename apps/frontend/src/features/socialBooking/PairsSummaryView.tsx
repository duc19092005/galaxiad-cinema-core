import { useTranslation } from 'react-i18next';
import { Users, User, CreditCard, Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react';
import type { GroupPairDto, GroupMemberDto } from '../../types/socialBooking.types';

interface Props {
  pairs: GroupPairDto[];
  members: GroupMemberDto[];
  isHost: boolean;
  status: string;
  currentUserId?: string;
  onPay: () => void;
  isPaying: boolean;
}

const PAIR_COLORS = ['#ff9500', '#5E9EFF', '#34C759', '#FF6B6B', '#A78BFA', '#F59E0B'];
const EMPTY_PAIR_ID = '00000000-0000-0000-0000-000000000000';

/** Trả về icon + màu + label cho trạng thái thanh toán của 1 thành viên */
function getPaymentStatusBadge(
  member: GroupMemberDto,
  t: any
): { icon: React.ReactNode; label: string; colorClass: string } {
  switch (member.status) {
    case 'Paid':
      return {
        icon: <CheckCircle2 className="w-3 h-3" />,
        label: t('socialBooking.payment.paid', 'Đã thanh toán'),
        colorClass: 'text-[#34C759] bg-[#34C759]/10 border-[#34C759]/30',
      };
    case 'Covered':
      return {
        icon: <CheckCircle2 className="w-3 h-3" />,
        label: t('socialBooking.payment.covered', 'Được chủ nhóm trả hộ'),
        colorClass: 'text-purple-400 bg-purple-400/10 border-purple-400/30',
      };
    case 'PaymentFailed':
      return {
        icon: <XCircle className="w-3 h-3" />,
        label: t('socialBooking.payment.failed', 'Thanh toán thất bại'),
        colorClass: 'text-red-400 bg-red-400/10 border-red-400/30',
      };
    default:
      return {
        icon: <Clock className="w-3 h-3" />,
        label: t('socialBooking.payment.pending', 'Chờ thanh toán'),
        colorClass: 'text-[#dbc2ad]/50 bg-[#dbc2ad]/5 border-[#dbc2ad]/20',
      };
  }
}

export default function PairsSummaryView({
  pairs,
  members,
  isHost,
  status,
  currentUserId,
  onPay,
  isPaying,
}: Props) {
  const { t } = useTranslation();

  const realPairs = pairs.filter(p => p.pairId !== EMPTY_PAIR_ID && p.member2);
  const individuals = pairs.filter(p => p.pairId === EMPTY_PAIR_ID || !p.member2);
  const currentMember = members.find(m => m.userId === currentUserId);
  const currentMemberRemaining = Math.max((currentMember?.amountToPay || 0) - (currentMember?.amountPaid || 0), 0);
  const isIndividualPayment = status === 'PayingIndividual';
  const isHostPayAll = status === 'PayingAll';
  const canPayHostAll = isHostPayAll && isHost;
  const canPayIndividual = isIndividualPayment && !!currentMember && currentMember.status !== 'Paid' && currentMemberRemaining > 0;
  const showPayButton = canPayHostAll || canPayIndividual;
  const payButtonLabel = canPayIndividual
    ? t('socialBooking.payment.payYourPart', 'Thanh toán phần của bạn')
    : t('socialBooking.payment.startPayment', 'Bắt đầu thanh toán');
  const payButtonAmount = canPayIndividual ? currentMemberRemaining : pairs.reduce((sum, pair) => sum + pair.totalAmount, 0);

  // Đếm số thành viên đã thanh toán
  const paidCount = members.filter(m => m.status === 'Paid' || m.status === 'Covered').length;
  const totalMembers = members.length;

  return (
    <div className="w-full max-w-lg mx-auto">
      <h2 className="text-[#e3e2e7] text-lg font-bold text-center mb-2">
        {t('socialBooking.pair.pairsSummary', 'Danh sách thanh toán')}
      </h2>

      {/* Thanh tiến trình thanh toán chung */}
      <div className="flex items-center justify-center gap-2 mb-6">
        <div className="flex-1 max-w-xs h-1.5 bg-[#343539] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#34C759] rounded-full transition-all duration-500"
            style={{ width: `${totalMembers > 0 ? (paidCount / totalMembers) * 100 : 0}%` }}
          />
        </div>
        <span className="text-[11px] text-[#dbc2ad]/60 font-medium whitespace-nowrap">
          {paidCount}/{totalMembers} {t('socialBooking.payment.paidCount', 'đã thanh toán')}
        </span>
      </div>

      <div className="space-y-3">
        {realPairs.map((pair, idx) => {
          const member1Badge = getPaymentStatusBadge(pair.member1, t);
          const member2Badge = pair.member2 ? getPaymentStatusBadge(pair.member2, t) : undefined;
          const bothPaid = pair.member1.status === 'Paid' && pair.member2?.status === 'Paid';
          const anyFailed = pair.member1.status === 'PaymentFailed' || pair.member2?.status === 'PaymentFailed';

          return (
            <div
              key={pair.pairId}
              className={`bg-[#1a1b1f]/60 border rounded-xl p-4 transition-colors ${
                bothPaid ? 'border-[#34C759]/30' : anyFailed ? 'border-red-400/30' : 'border-[#554334]/20'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" style={{ color: PAIR_COLORS[idx % PAIR_COLORS.length] }} />
                  <span className="text-[#e3e2e7] text-sm font-semibold">
                    {t('socialBooking.pair.pairLabel', { index: idx + 1 })}
                  </span>
                </div>
                {/* Trạng thái tổng quan của cặp */}
                {bothPaid && (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-[#34C759] bg-[#34C759]/10 border border-[#34C759]/30 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3 h-3" />
                    {t('socialBooking.payment.pairPaid', 'Cặp đã thanh toán')}
                  </span>
                )}
                {anyFailed && (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-red-400 bg-red-400/10 border border-red-400/30 px-2 py-0.5 rounded-full">
                    <XCircle className="w-3 h-3" />
                    {t('socialBooking.payment.pairFailed', 'Có lỗi thanh toán')}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <MemberChip member={pair.member1} color={PAIR_COLORS[idx % PAIR_COLORS.length]} statusBadge={member1Badge} />
                <span className="text-[#dbc2ad]/30 text-lg">+</span>
                {pair.member2 && (
                  <MemberChip member={pair.member2} color={PAIR_COLORS[(idx + 1) % PAIR_COLORS.length]} statusBadge={member2Badge} />
                )}
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px]">
                <span className="text-[#dbc2ad]/40">
                  {t('socialBooking.pair.totalSeats', { count: pair.seatCount })}
                </span>
                <span className="text-[#ffbd7f] font-bold">{pair.totalAmount.toLocaleString()}d</span>
              </div>
            </div>
          );
        })}

        {individuals.map(ind => {
          const memberBadge = getPaymentStatusBadge(ind.member1, t);
          const isPaid = ind.member1.status === 'Paid' || ind.member1.status === 'Covered';
          const isFailed = ind.member1.status === 'PaymentFailed';

          return (
            <div
              key={ind.member1.memberId}
              className={`bg-[#1a1b1f]/60 border rounded-xl p-4 transition-colors ${
                isPaid ? 'border-[#34C759]/30' : isFailed ? 'border-red-400/30' : 'border-[#554334]/20'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-[#dbc2ad]/60" />
                  <span className="text-[#dbc2ad]/60 text-sm">{t('socialBooking.pair.individual', 'Đơn lẻ')}</span>
                </div>
                {/* Trạng thái thanh toán */}
                <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${memberBadge.colorClass}`}>
                  {memberBadge.icon}
                  {memberBadge.label}
                </span>
              </div>
              <MemberChip member={ind.member1} color="#dbc2ad" statusBadge={memberBadge} />
              <div className="mt-3 flex items-center justify-between text-[11px]">
                <span className="text-[#dbc2ad]/40">
                  {t('socialBooking.pair.totalSeats', { count: ind.seatCount })}
                </span>
                <span className="text-[#ffbd7f] font-bold">{ind.totalAmount.toLocaleString()}d</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Nút thanh toán */}
      {showPayButton && (
        <button
          onClick={onPay}
          disabled={isPaying}
          className="w-full mt-6 py-3 bg-[#ff9500] text-[#4b2800] rounded-xl font-bold text-sm hover:bg-[#ffbd7f] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {isPaying ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
          <span>{payButtonLabel}</span>
          {payButtonAmount > 0 && <span>({payButtonAmount.toLocaleString()}d)</span>}
        </button>
      )}

      {/* Thông báo khi đã thanh toán xong (cá nhân) */}
      {isIndividualPayment && currentMember?.status === 'Paid' && (
        <div className="mt-6 flex items-center justify-center gap-2 text-[#34C759] text-sm font-semibold bg-[#34C759]/5 border border-[#34C759]/20 rounded-xl py-3 px-4">
          <CheckCircle2 className="w-5 h-5" />
          <span>{t('socialBooking.payment.yourPartPaid', 'Bạn đã thanh toán thành công phần của mình')}</span>
        </div>
      )}

      {/* Thông báo khi chủ nhóm đang trả hộ tất cả */}
      {isHostPayAll && !isHost && (
        <div className="mt-6 text-center bg-[#ff9500]/5 border border-[#ff9500]/20 rounded-xl py-3 px-4">
          <p className="text-[#ffbd7f] text-sm font-medium">
            {t('socialBooking.payment.hostPayingAll', 'Chủ nhóm đang thanh toán cho tất cả...')}
          </p>
        </div>
      )}

      {/* Thông báo chờ thanh toán */}
      {!showPayButton && !isHostPayAll && currentMember?.status !== 'Paid' && currentMember?.status !== 'PaymentFailed' && (
        <div className="mt-6 text-center bg-[#dbc2ad]/5 border border-[#dbc2ad]/10 rounded-xl py-3 px-4">
          <p className="text-[#dbc2ad]/50 text-sm">
            {t('socialBooking.payment.waitingUpdate', 'Đang chờ cập nhật trạng thái thanh toán...')}
          </p>
        </div>
      )}
    </div>
  );
}

function MemberChip({ member, color, statusBadge }: { member: GroupMemberDto; color: string; statusBadge?: { icon: React.ReactNode; label: string; colorClass: string } }) {
  return (
    <div className="flex items-center gap-2 flex-1 min-w-0">
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center text-[#4b2800] font-bold text-[11px] shrink-0"
        style={{ backgroundColor: color }}
      >
        {member.userName?.[0]?.toUpperCase() || '?'}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[#e3e2e7] text-xs font-medium truncate">{member.userName}</p>
        <p className="text-[#dbc2ad]/30 text-[9px]">
          {member.selectedSeats?.map(s => s.seatNumber).filter(Boolean).join(', ')}
        </p>
        {/* Badge trạng thái thanh toán */}
        {statusBadge && (
          <span className={`inline-flex items-center gap-1 text-[9px] font-bold mt-1 px-1.5 py-0.5 rounded-full border ${statusBadge.colorClass}`}>
            {statusBadge.icon}
            {statusBadge.label}
          </span>
        )}
      </div>
    </div>
  );
}
