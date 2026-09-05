import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { showSuccess, showError } from '../../utils/ToastUtils';
import {
  Loader2,
  MessageCircle,
  Armchair,
  ChevronRight,
  CreditCard,
} from 'lucide-react';
import GroupChatPanel from './GroupChatPanel';
import GroupSeatGrid from './GroupSeatGrid';
import GroupCheckoutView from './GroupCheckoutView';
import GroupSuccessView from './GroupSuccessView';
import GroupPaymentModal from './GroupPaymentModal';
import GroupMovieVote from './GroupMovieVote';
import GroupMemberList from './GroupMemberList';
import PaymentMethodVoteView from './PaymentMethodVoteView';
import PairRequestModal from './PairRequestModal';
import PairsSummaryView from './PairsSummaryView';
import PaymentFailureVoteModal from './PaymentFailureVoteModal';
import SocialBookingHeader from './SocialBookingHeader';
import { useSocialBookingSession } from './hooks/useSocialBookingSession';

type MobileTab = 'seats' | 'chat' | 'vote';

export default function SocialBookingPage() {
  const { t } = useTranslation();
  const { groupCode } = useParams<{ groupCode: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [copied, setCopied] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [mobileTab] = useState<MobileTab>('seats');
  const [showPairModal, setShowPairModal] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const {
    loading,
    error,
    groupState,
    currentUserId,
    chatMessages,
    voteState,
    paymentMethodVoteState,
    failureVoteState,
    paymentAction,
    showPaymentModal,
    setShowPaymentModal,
    isProcessingPayment,
    refreshGroupState,
    handleSendChat,
    handleVotePaymentMethod,
    handleCreatePair,
    handleVoteFailureOption,
    handleRaiseHand,
    handleVote,
    handlePaymentAction,
    handleLeaveGroup,
  } = useSocialBookingSession(groupCode);

  const isHost = groupState?.members?.some((m) => m.isHost && m.userId === currentUserId);
  const currentMember = groupState?.members?.find((m) => m.userId === currentUserId);
  const currentMemberRemaining = Math.max(
    (currentMember?.amountToPay || 0) - (currentMember?.amountPaid || 0),
    0
  );

  const canPay =
    (isHost && (groupState?.status === 'Paying' || groupState?.status === 'PayingAll')) ||
    ((groupState?.status === 'PayingIndividual' ||
      groupState?.status === 'PaymentFailedPartial') &&
      currentMember?.status !== 'Paid' &&
      currentMember?.status !== 'PaymentFailed' &&
      currentMemberRemaining > 0);

  useEffect(() => {
    if (location.state?.autoShowQR && groupState) {
      setShowQrModal(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state, groupState?.groupSessionId]);

  // Handle group cancelled by host — kick all members out
  useEffect(() => {
    if (groupState?.status === 'Cancelled') {
      showError(
        t('socialBooking.error.groupCancelledByHost', 'Phòng đặt đã bị hủy bởi chủ phòng.')
      );
      const timer = setTimeout(() => {
        navigate(groupState?.scheduleId ? `/booking/${groupState.scheduleId}` : '/');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [groupState?.status, groupState?.scheduleId, navigate, t]);

  // Auto-scroll mobile chat to bottom on new messages
  useEffect(() => {
    if (mobileTab === 'chat') {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, mobileTab]);

  const handleCopyInviteLink = () => {
    if (groupState) {
      navigator.clipboard.writeText(
        `${window.location.origin}/group-booking/${groupState.groupCode}`
      );
      setCopied(true);
      showSuccess(t('socialBooking.header.linkCopied', 'Đã sao chép link邀约!'));
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePayGroup = async (failedMemberId?: string) => {
    if (!groupState?.groupSessionId || isProcessingPayment) return;

    let amount = currentMemberRemaining;
    let confirmMessage = t(
      'socialBooking.payment.confirmPayOwn',
      'Bạn muốn thanh toán phần của mình? Tổng: '
    );

    if (failedMemberId && failureVoteState) {
      const target = failureVoteState.failedMembers.find(
        (fm) => fm.failedMemberId === failedMemberId
      );
      if (target) {
        amount = target.failedAmount;
        confirmMessage = t(
          'socialBooking.payment.confirmPayFor',
          'Bạn muốn thanh toán hộ cho {{name}}? Tổng: '
        ).replace('{{name}}', target.failedMemberName);
      }
    } else if (
      groupState.status !== 'PayingIndividual' &&
      groupState.status !== 'PaymentFailedPartial'
    ) {
      amount = groupState.totalGroupAmount;
      confirmMessage = t(
        'socialBooking.payment.confirmPayAll',
        'Bạn muốn thanh toán cho cả nhóm? Tổng: '
      );
    }

    const confirmed = window.confirm(confirmMessage + amount.toLocaleString() + 'đ');
    if (!confirmed) return;

    try {
      const { socialBookingApi } = await import('../../api/socialBookingApi');
      const result = await socialBookingApi.payGroup(groupState.groupSessionId, failedMemberId);
      if (result.isSuccess && result.data) {
        window.location.href = result.data.paymentUrl;
      } else {
        showError(
          result.message ||
            t(
              'socialBooking.payment.errorCreatePaymentUrl',
              'Không thể tạo liên kết thanh toán. Vui lòng thử lại.'
            )
        );
      }
    } catch (err: any) {
      showError(
        err?.response?.data?.message ||
          t('socialBooking.payment.errorGeneric', 'Có lỗi xảy ra khi thanh toán')
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#121317' }}>
        <Loader2 className="w-8 h-8 animate-spin text-[#ff9500]" />
      </div>
    );
  }

  if (error || !groupState) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#121317' }}>
        <div className="bg-[#1a1b1f]/60 backdrop-blur-xl border border-[#554334]/20 rounded-2xl p-8 text-center max-w-md">
          <p className="text-[#e3e2e7] text-lg">{error || 'Group not found'}</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 px-6 py-2 bg-[#ff9500] text-[#4b2800] rounded-xl font-bold hover:bg-[#ffbd7f] transition-colors cursor-pointer border-none"
          >
            {t('socialBooking.common.backToHome', 'Về trang chủ')}
          </button>
        </div>
      </div>
    );
  }

  const statusLabel =
    {
      Open: t('socialBooking.status.open', 'Đang chờ thành viên chọn ghế'),
      SeatsSelected: t('socialBooking.status.seatsSelected', 'Đã chọn ghế - Chờ xác nhận'),
      Confirming: t('socialBooking.status.confirming', 'Tất cả đã xác nhận - Chờ bình chọn'),
      VotingPaymentMethod: t(
        'socialBooking.status.votingPaymentMethod',
        'Đang bình chọn phương thức thanh toán'
      ),
      Pairing: t('socialBooking.status.pairing', 'Đang ghép đôi'),
      PayingAll: t('socialBooking.status.payingAll', 'Chủ nhóm đang thanh toán cho tất cả'),
      PayingIndividual: t(
        'socialBooking.status.payingIndividual',
        'Mỗi người tự thanh toán phần của mình'
      ),
      PayingPair: t('socialBooking.status.payingPair', 'Các cặp đang thanh toán'),
      PaymentFailed: t('socialBooking.status.paymentFailed', 'Thanh toán thất bại'),
      PaymentFailedPartial: t(
        'socialBooking.status.paymentFailedPartial',
        'Một số thành viên thanh toán thất bại'
      ),
      Completed: t('socialBooking.status.completed', 'Thanh toán thành công!'),
      Cancelled: t('socialBooking.status.cancelled', 'Phòng đã bị hủy'),
    }[groupState.status] || '';

  const statusDotColor =
    {
      Open: 'bg-white/30',
      SeatsSelected: 'bg-[#ffbd7f]',
      Confirming: 'bg-[#34C759]',
      VotingPaymentMethod: 'bg-[#5E9EFF] animate-pulse',
      Pairing: 'bg-[#A78BFA] animate-pulse',
      PayingAll: 'bg-[#ff9500] animate-pulse',
      PayingIndividual: 'bg-[#34C759] animate-pulse',
      PayingPair: 'bg-[#5E9EFF] animate-pulse',
      PaymentFailed: 'bg-red-400',
      PaymentFailedPartial: 'bg-red-400',
      Completed: 'bg-[#34C759]',
      Cancelled: 'bg-red-400',
    }[groupState.status] || 'bg-white/30';

  return (
    <div className="min-h-screen" style={{ background: '#121317' }}>
      {/* Header */}
      <SocialBookingHeader
        groupState={groupState}
        canPay={canPay}
        isProcessingPayment={isProcessingPayment}
        copied={copied}
        onPayGroup={() => handlePayGroup()}
        onOpenQrModal={() => setShowQrModal(true)}
        onCopyInviteLink={handleCopyInviteLink}
        onLeaveGroup={handleLeaveGroup}
        onRefreshGroupState={refreshGroupState}
      />

      {/* Main Layout */}
      <main className="flex h-screen pt-[68px] pb-20 md:pb-0 overflow-hidden">
        {/* Center Content */}
        <div
          className="flex-1 overflow-y-auto px-4 md:px-8 py-6 flex flex-col items-center seat-grid-container"
          style={{ scrollbarWidth: 'none' }}
        >
          {/* Status indicator */}
          <div className="w-full max-w-2xl mb-6 flex items-center justify-center">
            <div className="flex items-center gap-2 bg-[#1a1b1f]/60 px-4 py-2 rounded-full border border-[#554334]/20">
              <div className={`w-2 h-2 rounded-full ${statusDotColor}`} />
              <span className="text-[11px] text-[#dbc2ad]/60 font-medium">{statusLabel}</span>
            </div>
          </div>

          {/* Stage 1: Seat Selection */}
          {(groupState.status === 'Open' || groupState.status === 'SeatsSelected') && (
            <>
              {/* Stepper for Seat Selection */}
              <div className="w-full max-w-2xl mb-4 flex items-center justify-center bg-[#1a1b1f]/60 rounded-xl p-2 gap-2">
                <div className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-[#ff9500] text-[#4b2800] text-[11px] font-bold uppercase tracking-wider">
                  <Armchair className="w-4 h-4" />
                  <span>{t('socialBooking.stepper.selectSeats', 'Chọn ghế')}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-[#554334]" />
                <div className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-[#343539]/60 text-[#dbc2ad]/50 text-[11px] font-bold uppercase tracking-wider">
                  <CreditCard className="w-4 h-4" />
                  <span>{t('socialBooking.stepper.payment', 'Thanh toán')}</span>
                </div>
              </div>

              <div className={`w-full max-w-2xl ${mobileTab !== 'seats' ? 'hidden md:block' : ''}`}>
                <GroupSeatGrid
                  groupState={groupState}
                  scheduleId={groupState.scheduleId}
                  onRefresh={refreshGroupState}
                />
              </div>

              {mobileTab === 'vote' && (
                <div className="w-full max-w-2xl md:hidden mt-4">
                  <GroupMovieVote
                    voteState={voteState}
                    groupState={groupState}
                    onVote={handleVote}
                    isHost={!!isHost}
                  />
                </div>
              )}

              <div className="hidden md:block w-full max-w-2xl mt-6">
                <GroupMovieVote
                  voteState={voteState}
                  groupState={groupState}
                  onVote={handleVote}
                  isHost={!!isHost}
                />
              </div>
            </>
          )}

          {/* Stage 2: Voting & Payment Methods */}
          {(groupState.status === 'Confirming' ||
            groupState.status === 'VotingPaymentMethod' ||
            groupState.status === 'Pairing' ||
            groupState.status === 'PayingAll' ||
            groupState.status === 'PayingIndividual' ||
            groupState.status === 'PayingPair' ||
            groupState.status === 'PaymentFailedPartial') && (
            <div className="w-full max-w-2xl flex flex-col items-center">
              {/* Stepper for Payment */}
              <div className="w-full mb-6 flex items-center justify-center bg-[#1a1b1f]/60 rounded-xl p-2 gap-2">
                <div className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-[#343539]/60 text-[#dbc2ad]/50 text-[11px] font-bold uppercase tracking-wider">
                  <Armchair className="w-4 h-4" />
                  <span>{t('socialBooking.stepper.seatsConfirmed', 'Đã chọn ghế')}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-[#554334]" />
                <div className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-[#ff9500] text-[#4b2800] text-[11px] font-bold uppercase tracking-wider">
                  <CreditCard className="w-4 h-4" />
                  <span>{t('socialBooking.stepper.payment', 'Thanh toán')}</span>
                </div>
              </div>

              {groupState.status === 'Pairing' && (
                <PairsSummaryView
                  pairs={groupState.pairs || []}
                  members={groupState.members || []}
                  currentUserId={currentUserId}
                  isHost={!!isHost}
                  status={groupState.status}
                  onPay={() => handlePayGroup()}
                  isPaying={isProcessingPayment}
                />
              )}

              {(groupState.status === 'Confirming' ||
                groupState.status === 'VotingPaymentMethod' ||
                groupState.voteStatus === 'Voting') && (
                <PaymentMethodVoteView
                  voteState={paymentMethodVoteState}
                  isHost={!!isHost}
                  onVote={handleVotePaymentMethod}
                />
              )}

              {(groupState.status === 'PayingAll' ||
                groupState.status === 'PayingIndividual' ||
                groupState.status === 'PayingPair' ||
                groupState.status === 'PaymentFailedPartial') && (
                <GroupCheckoutView
                  groupState={groupState}
                  scheduleId={groupState.scheduleId}
                  isHost={!!isHost}
                  onPay={() => handlePayGroup()}
                  isPaying={isProcessingPayment}
                />
              )}
            </div>
          )}

          {/* Stage 3: Success View */}
          {groupState.status === 'Completed' && (
            <div className="w-full max-w-2xl">
              <GroupSuccessView groupState={groupState} />
            </div>
          )}
        </div>

        {/* Right Sidebar: Members & Chat */}
        <div className="hidden lg:flex w-80 flex-col bg-[#16171b] border-l border-[#554334]/20">
          <div className="p-4 border-b border-[#554334]/20 flex justify-between items-center bg-[#1a1b1f]/40">
            <span className="text-xs font-bold text-[#ffbd7f] uppercase tracking-wider">
              {t('socialBooking.members.title', 'Thành viên')} ({groupState.members?.length || 0})
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            <GroupMemberList
              members={groupState.members || []}
              maxMembers={groupState.maxMembers || 8}
              onInvite={handleCopyInviteLink}
            />
          </div>

          <div className="h-72 border-t border-[#554334]/20 flex flex-col bg-[#121317]/50">
            <GroupChatPanel
              messages={chatMessages}
              onSend={handleSendChat}
              members={groupState.members || []}
              isOpen={true}
              onClose={() => {}}
            />
          </div>
        </div>
      </main>

      {/* Floating Chat Button for Tablet & Mobile */}
      <button
        onClick={() => setShowChat(!showChat)}
        className="fixed bottom-20 right-4 lg:hidden z-40 bg-[#ff9500] text-[#4b2800] p-3.5 rounded-full shadow-lg shadow-[#ff9500]/30 hover:bg-[#ffbd7f] transition-all cursor-pointer border-none"
      >
        <MessageCircle className="w-6 h-6" />
      </button>

      {/* Mobile/Tablet Slide-over Chat */}
      {showChat && (
        <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#16171b] border-t border-[#554334]/30 rounded-t-2xl h-[70vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-[#554334]/20 flex justify-between items-center bg-[#1a1b1f]">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-[#ff9500]" />
                <span className="text-xs font-bold text-[#ffbd7f] uppercase tracking-wider">
                  {t('socialBooking.chat.title', 'Trò chuyện nhóm')}
                </span>
              </div>
              <button
                onClick={() => setShowChat(false)}
                className="text-xs text-[#dbc2ad]/60 hover:text-[#ffbd7f] bg-transparent border-none cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <GroupChatPanel
                messages={chatMessages}
                onSend={handleSendChat}
                members={groupState.members || []}
                isOpen={showChat}
                onClose={() => setShowChat(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {showPaymentModal && paymentAction && (
        <GroupPaymentModal
          paymentAction={paymentAction}
          isHost={!!isHost}
          onAction={handlePaymentAction}
          onClose={() => setShowPaymentModal(false)}
        />
      )}

      {showPairModal && groupState && (
        <PairRequestModal
          onClose={() => setShowPairModal(false)}
          members={groupState.members || []}
          currentUserId={currentUserId || ''}
          onCreatePair={handleCreatePair}
        />
      )}

      {failureVoteState && failureVoteState.phase !== 'Completed' && (
        <PaymentFailureVoteModal
          failureState={failureVoteState}
          currentUserId={currentUserId}
          onVote={handleVoteFailureOption}
          onRaiseHand={handleRaiseHand}
          onPayVolunteer={(targetId: string) => handlePayGroup(targetId)}
        />
      )}

      {/* QR Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#1a1b1f] border border-[#554334]/30 rounded-3xl p-6 max-w-xs w-full flex flex-col items-center gap-4 text-center shadow-2xl">
            <h3 className="text-sm font-bold text-[#ffbd7f] uppercase tracking-wider">
              {t('socialBooking.qr.title', 'Mã QR phòng')}
            </h3>
            <div className="p-3 bg-white rounded-2xl">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                  `${window.location.origin}/group-booking/${groupState.groupCode}`
                )}`}
                alt="QR Code"
                className="w-44 h-44"
              />
            </div>
            <p className="text-xs text-[#dbc2ad]/60 leading-relaxed">
              {t('socialBooking.qr.desc', 'Quét mã để tham gia ngay vào phòng đặt vé này.')}
            </p>
            <button
              onClick={() => setShowQrModal(false)}
              className="w-full py-2.5 bg-[#292a2e] text-[#e3e2e7] rounded-xl text-xs font-bold hover:bg-[#343539] transition-colors border border-[#554334]/20 cursor-pointer"
            >
              {t('socialBooking.common.close', 'Đóng')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
