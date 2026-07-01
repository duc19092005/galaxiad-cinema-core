import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { socialBookingApi } from '../../api/socialBookingApi';
import { signalrClient, stopConnection } from '../../api/signalrClient';
import { verifyAuthAndGetUser } from '../../utils/authHelpers';
import { showSuccess, showError } from '../../utils/ToastUtils';
import { Loader2, MessageCircle, ThumbsUp, Copy, Check, QrCode, LogOut, CreditCard, LayoutGrid, Armchair, ChevronRight, Send } from 'lucide-react';
import type { GroupBookingState, ChatMessage, MovieVoteState, GroupPaymentActionResponse, PaymentMethodVoteState, PaymentFailureVoteState, PaymentMethodType } from '../../types/socialBooking.types';
import GroupChatPanel from './GroupChatPanel';
import GroupSeatGrid from './GroupSeatGrid';
import GroupCheckoutView from './GroupCheckoutView';
import GroupSuccessView from './GroupSuccessView';
import GroupPaymentModal from './GroupPaymentModal';
import GroupMovieVote from './GroupMovieVote';
import GroupMemberList from './GroupMemberList';
import CountdownTimer from './CountdownTimer';
import PaymentMethodVoteView from './PaymentMethodVoteView';
import PairRequestModal from './PairRequestModal';
import PairsSummaryView from './PairsSummaryView';
import PaymentFailureVoteModal from './PaymentFailureVoteModal';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import type { HubConnection } from '@microsoft/signalr';

type MobileTab = 'seats' | 'chat' | 'vote';

export default function SocialBookingPage() {
  const { t } = useTranslation();
  const { groupCode } = useParams<{ groupCode: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [groupState, setGroupState] = useState<GroupBookingState | null>(null);
  const [copied, setCopied] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAction, setPaymentAction] = useState<GroupPaymentActionResponse | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [voteState, setVoteState] = useState<MovieVoteState | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [mobileTab, setMobileTab] = useState<MobileTab>('seats');
  const connectionRef = useRef<HubConnection | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const [mobileChatInput, setMobileChatInput] = useState('');
  const [paymentMethodVoteState, setPaymentMethodVoteState] = useState<PaymentMethodVoteState | null>(null);
  const [showPairModal, setShowPairModal] = useState(false);
  const [failureVoteState, setFailureVoteState] = useState<PaymentFailureVoteState | null>(null);

  const currentUserId = JSON.parse(localStorage.getItem('user_info') || '{}').userId;
  const isHost = groupState?.members?.some(m => m.isHost && m.userId === currentUserId);
  const currentMember = groupState?.members?.find(m => m.userId === currentUserId);
  const currentMemberRemaining = Math.max((currentMember?.amountToPay || 0) - (currentMember?.amountPaid || 0), 0);
  const canPay =
    (isHost && (groupState?.status === 'Paying' || groupState?.status === 'PayingAll')) ||
    ((groupState?.status === 'PayingIndividual' || groupState?.status === 'PaymentFailedPartial') &&
      currentMember?.status !== 'Paid' &&
      currentMember?.status !== 'PaymentFailed' &&
      currentMemberRemaining > 0);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  useEffect(() => {
    if (!groupCode) {
      setError('No group code provided');
      setLoading(false);
      return;
    }
    joinOrLoadGroup();
  }, [groupCode]);

  useEffect(() => {
    if (!groupState?.groupSessionId) return;
    let cancelled = false;
    const connection = signalrClient.createGroupConnection(groupState.groupSessionId);
    connectionRef.current = connection;

    const handleGroupState = (data: any) => {
      if (data?.state) {
        setGroupState(data.state);
        if (data.state.failureVoteState) {
          setFailureVoteState(data.state.failureVoteState);
        }
      }
    };

    const handleChatMessage = (data: any) => {
      if (data?.chatMessage) {
        setChatMessages(prev => {
          if (prev.some(m => m.messageId === data.chatMessage.messageId)) return prev;
          return [...prev.filter(m => !m.messageId.startsWith('temp-')), data.chatMessage];
        });
      }
    };

    const handleVoteUpdate = (data: any) => {
      if (data?.voteState) setVoteState(data.voteState);
    };

    const handlePaymentAction = (data: any) => {
      if (data?.paymentAction) {
        setPaymentAction(data.paymentAction);
        setShowPaymentModal(true);
      }
    };

    const handlePaymentMethodVoteUpdate = (data: any) => {
      if (data?.voteState) setPaymentMethodVoteState(data.voteState);
      if (data?.paymentMethodVoteState) setPaymentMethodVoteState(data.paymentMethodVoteState);
    };

    const handlePairUpdate = () => refreshGroupState();

    const handlePaymentFailureVoteUpdate = (data: any) => {
      if (data?.failureVoteState) setFailureVoteState(data.failureVoteState);
    };

    const handleRaiseHandUpdate = (data: any) => {
      if (data?.raiseHands) {
        setFailureVoteState(prev => prev ? { ...prev, raiseHands: data.raiseHands } : null);
      }
    };

    connection.on('initial-state', handleGroupState);
    connection.on('group-update', handleGroupState);
    connection.on('chat-message', handleChatMessage);
    connection.on('vote-update', handleVoteUpdate);
    connection.on('payment-action', handlePaymentAction);
    connection.on('payment-method-vote-update', handlePaymentMethodVoteUpdate);
    connection.on('pair-update', handlePairUpdate);
    connection.on('payment-failure-vote-update', handlePaymentFailureVoteUpdate);
    connection.on('raise-hand-update', handleRaiseHandUpdate);

    connection.start().catch((err) => {
      if (!cancelled) console.error('[Group SignalR] Connection error', err);
    });

    return () => {
      cancelled = true;
      connection.off('initial-state', handleGroupState);
      connection.off('group-update', handleGroupState);
      connection.off('chat-message', handleChatMessage);
      connection.off('vote-update', handleVoteUpdate);
      connection.off('payment-action', handlePaymentAction);
      connection.off('payment-method-vote-update', handlePaymentMethodVoteUpdate);
      connection.off('pair-update', handlePairUpdate);
      connection.off('payment-failure-vote-update', handlePaymentFailureVoteUpdate);
      connection.off('raise-hand-update', handleRaiseHandUpdate);
      stopConnection(connection).catch(() => {});
      if (connectionRef.current === connection) {
        connectionRef.current = null;
      }
    };
  }, [groupState?.groupSessionId]);

  useEffect(() => {
    if (!groupState?.groupSessionId) return;
    const loadChat = async () => {
      try {
        const res = await socialBookingApi.getChatMessages(groupState.groupSessionId);
        if (res.isSuccess && res.data && res.data.length > 0) {
          setChatMessages(res.data.reverse());
        }
      } catch { /* ignore */ }
    };
    loadChat();
  }, [groupState?.groupSessionId]);

  useEffect(() => {
    if (!groupState?.groupSessionId) return;

    const shouldLoadPaymentVote =
      groupState.status === 'Confirming' ||
      groupState.status === 'VotingPaymentMethod' ||
      groupState.voteStatus === 'Voting' ||
      groupState.voteStatus === 'Completed';

    if (!shouldLoadPaymentVote) {
      setPaymentMethodVoteState(null);
      return;
    }

    let cancelled = false;
    const loadPaymentVoteState = async () => {
      try {
        const res = await socialBookingApi.getPaymentMethodVoteState(groupState.groupSessionId);
        if (!cancelled && res.isSuccess && res.data) {
          setPaymentMethodVoteState(res.data);
        }
      } catch {
        // Ignore transient reconnect errors; the next group update will retry.
      }
    };

    loadPaymentVoteState();
    return () => { cancelled = true; };
  }, [groupState?.groupSessionId, groupState?.status, groupState?.voteStatus, groupState?.voteExpiresAt]);

  useEffect(() => {
    if (location.state?.autoShowQR && groupState) {
      setShowQrModal(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state, groupState?.groupSessionId]);

  // Handle group cancelled by host — kick all members out
  useEffect(() => {
    if (groupState?.status === 'Cancelled') {
      showError(t('socialBooking.error.groupCancelledByHost', 'Phòng đặt đã bị hủy bởi chủ phòng.'));
      const timer = setTimeout(() => {
        navigate(groupState?.scheduleId ? `/booking/${groupState.scheduleId}` : '/');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [groupState?.status]);

  // Auto-scroll mobile chat to bottom on new messages
  useEffect(() => {
    if (mobileTab === 'chat') {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, mobileTab]);

  const joinOrLoadGroup = async () => {
    try {
      setLoading(true);
      const user = await verifyAuthAndGetUser();
      if (!user || !user.userId) {
        navigate(`/login?redirect=/group-booking/${groupCode}`);
        return;
      }

      // Retry logic: first join may fail due to post-join broadcast/fetch errors
      let joinResult;
      let lastError: string | null = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          joinResult = await socialBookingApi.joinGroup({ groupCode: groupCode! });
          if (joinResult.isSuccess) break;
          lastError = joinResult.message || 'Failed to join group';
        } catch (err: any) {
          lastError = err?.response?.data?.message || 'Network error';
        }
        if (attempt < 2) await new Promise(r => setTimeout(r, 1000));
      }

      if (joinResult?.isSuccess && joinResult.data) {
        setGroupState(joinResult.data as any);
        setVoteState(null);
      } else {
        setError(lastError || 'Failed to join group');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load group');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyInviteLink = () => {
    if (groupState) {
      navigator.clipboard.writeText(`${window.location.origin}/group-booking/${groupState.groupCode}`);
      setCopied(true);
      showSuccess(t('socialBooking.header.linkCopied', 'Đã sao chép link邀约!'));
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSendChat = async (content: string) => {
    if (!groupState?.groupSessionId) return;
    const currentUserName = JSON.parse(localStorage.getItem('user_info') || '{}').username || 'You';
    const tempId = `temp-${Date.now()}`;
    setChatMessages(prev => [...prev, {
      messageId: tempId, senderId: currentUserId, senderName: currentUserName,
      content, messageType: 'Text', createdAt: new Date().toISOString(),
    }]);
    await socialBookingApi.sendChat(groupState.groupSessionId, { content });
  };

  const refreshGroupState = async () => {
    if (!groupState?.groupSessionId) return;
    try {
      const res = await socialBookingApi.getGroupState(groupState.groupSessionId);
      if (res.isSuccess && res.data) setGroupState(res.data);
    } catch { /* ignore */ }
  };

  const handleVotePaymentMethod = async (method: PaymentMethodType) => {
    if (!groupState?.groupSessionId) return;
    const res = await socialBookingApi.votePaymentMethod(groupState.groupSessionId, { paymentMethod: method });
    if (res.isSuccess && res.data) setPaymentMethodVoteState(res.data);
  };

  const handleCreatePair = async (targetMemberId: string) => {
    if (!groupState?.groupSessionId) return;
    await socialBookingApi.createPair(groupState.groupSessionId, { targetMemberId });
  };

  const handleVoteFailureOption = async (option: number) => {
    if (!groupState?.groupSessionId) return;
    const res = await socialBookingApi.voteFailureOption(groupState.groupSessionId, { option });
    if (res.isSuccess && res.data) setFailureVoteState(res.data);
  };

  const handleRaiseHand = async (failedMemberId: string, isRaise: boolean) => {
    if (!groupState?.groupSessionId) return;
    const res = await socialBookingApi.raiseHand(groupState.groupSessionId, { failedMemberId, isRaiseHand: isRaise });
    if (res.isSuccess && res.data) setFailureVoteState(res.data);
  };

  const handleVote = async (scheduleId: string) => {
    if (!groupState?.groupSessionId) return;
    const result = await socialBookingApi.voteMovie(groupState.groupSessionId, { voteScheduleId: scheduleId });
    if (result.isSuccess && result.data) setVoteState(result.data);
  };

  const handlePaymentAction = async (action: 'Cover' | 'TakeOverAll' | 'CancelGroup') => {
    if (!groupState?.groupSessionId) return;
    const result = await socialBookingApi.handlePaymentAction(groupState.groupSessionId, { action });
    if (result.isSuccess && result.data) {
      setPaymentAction(result.data);
      if (result.data.paymentUrl) {
        window.location.href = result.data.paymentUrl;
      } else {
        showSuccess(result.data.message);
        setShowPaymentModal(false);
        joinOrLoadGroup();
      }
    }
  };

  const handlePayGroup = async (failedMemberId?: string) => {
    if (!groupState?.groupSessionId || isProcessingPayment) return;

    let amount = currentMemberRemaining;
    let confirmMessage = t('socialBooking.payment.confirmPayOwn', 'Bạn muốn thanh toán phần của mình? Tổng: ');

    if (failedMemberId && failureVoteState) {
      const target = failureVoteState.failedMembers.find(fm => fm.failedMemberId === failedMemberId);
      if (target) {
        amount = target.failedAmount;
        confirmMessage = t('socialBooking.payment.confirmPayFor', 'Bạn muốn thanh toán hộ cho {{name}}? Tổng: ').replace('{{name}}', target.failedMemberName);
      }
    } else if (groupState.status !== 'PayingIndividual' && groupState.status !== 'PaymentFailedPartial') {
      amount = groupState.totalGroupAmount;
      confirmMessage = t('socialBooking.payment.confirmPayAll', 'Bạn muốn thanh toán cho cả nhóm? Tổng: ');
    }

    const confirmed = window.confirm(confirmMessage + amount.toLocaleString() + 'đ');
    if (!confirmed) return;
    setIsProcessingPayment(true);
    try {
      const result = await socialBookingApi.payGroup(groupState.groupSessionId, failedMemberId);
      if (result.isSuccess && result.data) {
        window.location.href = result.data.paymentUrl;
      } else {
         showError(result.message || t('socialBooking.payment.errorCreatePaymentUrl', 'Không thể tạo liên kết thanh toán. Vui lòng thử lại.'));
      }
    } catch (err: any) {
      showError(err?.response?.data?.message || t('socialBooking.payment.errorGeneric', 'Có lỗi xảy ra khi thanh toán'));
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleLeaveGroup = async () => {
    if (!groupState?.groupSessionId) return;
    const confirmMessage = isHost
      ? t('socialBooking.leave.confirmHost', 'Bạn là chủ phòng. Nếu rời phòng đặt chung, phòng sẽ bị hủy hoàn toàn. Bạn có chắc chắn muốn rời?')
      : t('socialBooking.leave.confirmMember', 'Bạn có chắc chắn muốn rời khỏi phòng đặt chung này?');
    if (!window.confirm(confirmMessage)) return;
    try {
      const res = await socialBookingApi.leaveGroup(groupState.groupSessionId);
      if (res.isSuccess) {
        showSuccess(res.message || t('socialBooking.leave.success', 'Đã rời phòng đặt chung thành công.'));
        navigate(`/booking/${groupState.scheduleId}`);
      } else {
        showError(res.message || t('socialBooking.leave.errorGeneric', 'Không thể rời phòng.'));
      }
    } catch (err: any) {
      showError(err?.response?.data?.message || t('socialBooking.leave.errorLeaving', 'Có lỗi xảy ra khi rời phòng.'));
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
          <button onClick={() => navigate('/')} className="mt-4 px-6 py-2 bg-[#ff9500] text-[#4b2800] rounded-xl font-bold hover:bg-[#ffbd7f] transition-colors">
            {t('socialBooking.common.backToHome', 'Về trang chủ')}
          </button>
        </div>
      </div>
    );
  }

  const statusLabel = {
    Open: t('socialBooking.status.open', 'Đang chờ thành viên chọn ghế'),
    SeatsSelected: t('socialBooking.status.seatsSelected', 'Đã chọn ghế - Chờ xác nhận'),
    Confirming: t('socialBooking.status.confirming', 'Tất cả đã xác nhận - Chờ bình chọn'),
    VotingPaymentMethod: t('socialBooking.status.votingPaymentMethod', 'Đang bình chọn phương thức thanh toán'),
    Pairing: t('socialBooking.status.pairing', 'Đang ghép đôi'),
    PayingAll: t('socialBooking.status.payingAll', 'Chủ nhóm đang thanh toán cho tất cả'),
    PayingIndividual: t('socialBooking.status.payingIndividual', 'Mỗi người tự thanh toán phần của mình'),
    PayingPair: t('socialBooking.status.payingPair', 'Các cặp đang thanh toán'),
    PaymentFailed: t('socialBooking.status.paymentFailed', 'Thanh toán thất bại'),
    PaymentFailedPartial: t('socialBooking.status.paymentFailedPartial', 'Một số thành viên thanh toán thất bại'),
    Completed: t('socialBooking.status.completed', 'Thanh toán thành công!'),
    Cancelled: t('socialBooking.status.cancelled', 'Phòng đã bị hủy'),
  }[groupState.status] || '';

  const statusDotColor = {
    Open: 'bg-white/30', SeatsSelected: 'bg-[#ffbd7f]', Confirming: 'bg-[#34C759]',
    VotingPaymentMethod: 'bg-[#5E9EFF] animate-pulse', Pairing: 'bg-[#A78BFA] animate-pulse',
    PayingAll: 'bg-[#ff9500] animate-pulse', PayingIndividual: 'bg-[#34C759] animate-pulse',
    PayingPair: 'bg-[#5E9EFF] animate-pulse',
    PaymentFailed: 'bg-red-400', PaymentFailedPartial: 'bg-red-400',
    Completed: 'bg-[#34C759]', Cancelled: 'bg-red-400',
  }[groupState.status] || 'bg-white/30';

  return (
    <div className="min-h-screen" style={{ background: '#121317' }}>
      {/* Header */}
      <header className="fixed top-0 w-full z-40 flex justify-between items-center px-4 md:px-8 py-3 bg-[#121317]/80 backdrop-blur-xl border-b border-[#554334]/20 shadow-lg shadow-black/10">
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <h1 className="text-[14px] md:text-[18px] font-bold text-[#ffbd7f] tracking-tight leading-tight">{groupState.groupName}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="bg-[#ff9500]/20 text-[#ffbd7f] text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest font-mono">
                {groupState.groupCode}
              </span>
              <span className="text-[11px] text-[#dbc2ad]/60 hidden md:block font-medium truncate max-w-[200px]">
                {groupState.movieName}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 md:gap-2.5">
          {canPay && (
            <button
              onClick={() => handlePayGroup()}
              disabled={isProcessingPayment}
              className="flex items-center gap-1.5 bg-[#ff9500] text-[#4b2800] px-3.5 py-2 rounded-xl font-bold text-xs hover:bg-[#ffbd7f] transition-all duration-200 disabled:opacity-60 shadow-md shadow-[#ff9500]/10 hover:scale-[1.02]"
            >
              {isProcessingPayment ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CreditCard className="w-3.5 h-3.5" />}
              <span className="hidden md:inline">{t('socialBooking.header.pay', 'Thanh toán')}</span>
              <span className="md:hidden">{t('socialBooking.header.payMobile', 'Pay')}</span>
            </button>
          )}

          <button 
            onClick={() => setShowQrModal(true)} 
            className="flex items-center gap-1.5 bg-[#292a2e]/80 border border-[#554334]/15 px-3 py-2 rounded-xl hover:bg-[#343539] hover:border-[#ff9500]/30 transition-all duration-200"
            title="QR Code"
          >
            <QrCode className="w-3.5 h-3.5 text-[#ff9500]" />
            <span className="text-xs font-bold text-[#e3e2e7] hidden md:block">{t('socialBooking.header.qr', 'QR')}</span>
          </button>

          <button 
            onClick={handleCopyInviteLink} 
            className="flex items-center gap-1.5 bg-[#292a2e]/80 border border-[#554334]/15 px-3 py-2 rounded-xl hover:bg-[#343539] hover:border-[#ff9500]/30 transition-all duration-200 min-w-[70px] justify-center"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#34C759]" /> : <Copy className="w-3.5 h-3.5 text-[#dbc2ad]" />}
            <span className="text-xs font-bold text-[#e3e2e7] hidden md:block">
              {copied ? t('socialBooking.header.copied', 'Đã copy!') : t('socialBooking.header.copyLink', 'Sao chép link')}
            </span>
          </button>

          <button 
            onClick={handleLeaveGroup} 
            className="p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all duration-200"
            title={t('socialBooking.header.leave', 'Rời phòng')}
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>

          <div className="w-px h-5 bg-[#554334]/20 mx-0.5" />

          <LanguageSwitcher />

          {groupState.status !== 'Cancelled' && groupState.status !== 'Completed' && (
            <CountdownTimer
              expiresAt={groupState.paymentDeadlineAt || groupState.expiresAt}
              onExpire={() => refreshGroupState()}
            />
          )}
        </div>
      </header>

      {/* Main Layout */}
      <main className="flex h-screen pt-[68px] pb-20 md:pb-0 overflow-hidden">
        {/* Center Content */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 flex flex-col items-center seat-grid-container" style={{ scrollbarWidth: 'none' }}>
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

          {/* Stage 2: Confirming → Vote Payment Method */}
          {groupState.status === 'Confirming' && (
            <PaymentMethodVoteView
              voteState={paymentMethodVoteState}
              onVote={handleVotePaymentMethod}
              isHost={!!isHost}
            />
          )}

          {/* Stage 3: Voting Payment Method */}
          {groupState.status === 'VotingPaymentMethod' && (
            <PaymentMethodVoteView
              voteState={paymentMethodVoteState}
              onVote={handleVotePaymentMethod}
              isHost={!!isHost}
            />
          )}

          {/* Stage 4: Pairing - ask if want to pair */}
          {groupState.status === 'Pairing' && (
            <div className="w-full max-w-lg mx-auto text-center py-8">
              <p className="text-[#e3e2e7] text-lg font-bold mb-2">{t('socialBooking.pairing.title', 'Ghép đôi để thanh toán')}</p>
              <p className="text-[#dbc2ad]/50 text-sm mb-6">{t('socialBooking.pairing.question', 'Bạn có muốn ghép đôi với ai để trả chung không?')}</p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setShowPairModal(true)}
                  className="px-6 py-2.5 bg-[#ff9500] text-[#4b2800] rounded-xl font-bold text-sm hover:bg-[#ffbd7f] transition-colors"
                >
                  {t('socialBooking.pairing.yesPairUp', 'Có, ghép đôi!')}
                </button>
                <button
                  onClick={async () => {
                    if (!groupState?.groupSessionId) return;
                    await socialBookingApi.votePaymentMethod(groupState.groupSessionId, { paymentMethod: 'IndividualPay' });
                    refreshGroupState();
                  }}
                  className="px-6 py-2.5 bg-[#343539]/60 text-[#dbc2ad]/60 rounded-xl font-bold text-sm hover:bg-[#343539] transition-colors"
                >
                  {t('socialBooking.pairing.noPaySeparately', 'Không, trả riêng')}
                </button>
              </div>
            </div>
          )}

          {/* Stage 5: Paying - show pairs summary (bao gồm PaymentFailedPartial để danh sách không biến mất) */}
          {(groupState.status === 'PayingAll' || groupState.status === 'PayingIndividual' || groupState.status === 'PayingPair' || groupState.status === 'PaymentFailedPartial') && (
            <PairsSummaryView
              pairs={groupState.pairs || []}
              members={groupState.members}
              isHost={!!isHost}
              status={groupState.status}
              currentUserId={currentUserId}
              onPay={() => handlePayGroup()}
              isPaying={isProcessingPayment}
            />
          )}

          {/* Payment Failed — inline bottom-sheet, hiển thị bên dưới pairs summary */}
          {(groupState.status === 'PaymentFailed' || groupState.status === 'PaymentFailedPartial') && failureVoteState && (
            <div className="w-full max-w-lg mx-auto mt-6">
              <PaymentFailureVoteModal
                failureState={failureVoteState}
                onVote={handleVoteFailureOption}
                onRaiseHand={handleRaiseHand}
                onExpire={() => refreshGroupState()}
                onPayVolunteer={(mid) => handlePayGroup(mid)}
                currentUserId={currentUserId}
                currentMemberId={currentMember?.memberId}
              />
            </div>
          )}

          {/* Fallback: old checkout view for backward compatibility */}
          {groupState.status === 'Paying' && (
            <GroupCheckoutView
              groupState={groupState}
              scheduleId={groupState.scheduleId}
              isHost={!!isHost}
              onPay={() => handlePayGroup()}
              isPaying={isProcessingPayment}
            />
          )}

          {/* Stage 3: Success */}
          {groupState.status === 'Completed' && (
            <GroupSuccessView groupState={groupState} />
          )}

          {/* Cancelled: Room closed by host */}
          {groupState.status === 'Cancelled' && (
            <div className="text-center py-16">
              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8 max-w-md mx-auto">
                <p className="text-red-400 text-lg font-bold">{t('socialBooking.cancelled.title', 'Phòng đặt đã bị hủy')}</p>
                <p className="text-[#dbc2ad]/50 text-sm mt-2">{t('socialBooking.cancelled.redirecting', 'Chủ phòng đã đóng phòng. Đang trở về trang đặt vé...')}</p>
                <button
                  onClick={() => navigate(groupState?.scheduleId ? `/booking/${groupState.scheduleId}` : '/')}
                  className="mt-6 px-6 py-2 bg-[#ff9500] text-[#4b2800] rounded-xl font-bold hover:bg-[#ffbd7f] transition-colors"
                >
                  {t('socialBooking.cancelled.backToBooking', 'Về Trang Đặt Vé')}
                </button>
              </div>
            </div>
          )}

          {/* Mobile Chat Tab - Inline full content area */}
          {mobileTab === 'chat' && (
            <div className="w-full max-w-2xl md:hidden flex flex-col h-[calc(100vh-140px)]">
              {/* Chat header */}
              <div className="flex items-center gap-2 px-1 py-3">
                <div className="w-8 h-8 rounded-full bg-[#ff9500]/20 flex items-center justify-center">
                  <MessageCircle className="w-4 h-4 text-[#ff9500]" />
                </div>
                <h3 className="font-semibold text-[#e3e2e7] text-sm">{t('socialBooking.chat.title', 'Nhóm Chat')}</h3>
                <span className="text-[11px] text-[#dbc2ad]/40 ml-1">{chatMessages.filter(m => m.messageType === 'Text').length} {t('socialBooking.chat.messageCount', 'tin nhắn')}</span>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-2 py-2 space-y-3" style={{ scrollbarWidth: 'none' }}>
                {chatMessages.length === 0 && (
                  <div className="text-center text-[#dbc2ad]/40 py-12 text-sm">
                    {t('socialBooking.chat.empty', 'Chưa có tin nhắn. Bắt đầu chat nào!')}
                  </div>
                )}
                {chatMessages.map((msg) => {
                  const isMe = msg.senderId === currentUserId;
                  const isSystem = msg.messageType !== 'Text';

                  if (isSystem) {
                    return (
                      <div key={msg.messageId} className="text-center">
                        <span className="text-[10px] text-[#dbc2ad]/40 bg-[#343539]/60 px-3 py-1 rounded-full">
                          {msg.content}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div key={msg.messageId} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className="max-w-[80%]">
                        {!isMe && (
                          <div className="flex items-center gap-1.5 mb-1 ml-1">
                            <span className="text-[11px] text-[#ffbd7f] font-semibold">{msg.senderName}</span>
                          </div>
                        )}
                        <div
                          className={`px-3.5 py-2 rounded-2xl text-[13px] leading-relaxed ${
                            isMe
                              ? 'bg-[#ff9500] text-[#4b2800] rounded-br-md font-medium'
                              : 'bg-[#343539]/80 text-[#e3e2e7] rounded-bl-md'
                          }`}
                        >
                          {msg.content}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={chatBottomRef} />
              </div>

              {/* Input */}
              <div className="px-2 py-3 border-t border-[#554334]/20">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={mobileChatInput}
                    onChange={(e) => setMobileChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if (mobileChatInput.trim()) {
                          handleSendChat(mobileChatInput.trim());
                          setMobileChatInput('');
                        }
                      }
                    }}
                    placeholder={t('socialBooking.chat.placeholder', 'Nhập tin nhắn...')}
                    className="flex-1 bg-[#343539]/60 border border-[#554334]/30 rounded-xl px-4 py-2.5 text-[#e3e2e7] text-sm placeholder-[#dbc2ad]/30 focus:outline-none focus:border-[#ff9500]/50 transition-colors"
                  />
                  <button
                    onClick={() => {
                      if (mobileChatInput.trim()) {
                        handleSendChat(mobileChatInput.trim());
                        setMobileChatInput('');
                      }
                    }}
                    disabled={!mobileChatInput.trim()}
                    className="w-10 h-10 bg-[#ff9500] text-[#4b2800] rounded-xl flex items-center justify-center hover:bg-[#ffbd7f] transition-colors disabled:opacity-40"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Desktop Sidebar: Members */}
        <aside className="hidden md:flex flex-col fixed right-0 top-0 h-full w-[300px] z-30 bg-[#1a1b1f]/90 backdrop-blur-2xl border-l border-[#554334]/20 pt-[68px] shadow-md">
          <div className="flex-1 overflow-y-auto px-4 py-4" style={{ scrollbarWidth: 'none' }}>
            <GroupMemberList members={groupState.members} maxMembers={groupState.maxMembers} />
          </div>
        </aside>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-40 flex justify-around items-center h-[72px] px-4 pb-safe bg-[#343539]/60 backdrop-blur-lg border-t border-[#554334]/50 rounded-t-xl">
        {[
          { key: 'seats' as MobileTab, icon: LayoutGrid, label: t('socialBooking.nav.seats', 'Ghế') },
          { key: 'chat' as MobileTab, icon: MessageCircle, label: t('socialBooking.nav.chat', 'Chat') },
          { key: 'vote' as MobileTab, icon: ThumbsUp, label: t('socialBooking.nav.vote', 'Bầu chọn') },
        ].map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            onClick={() => setMobileTab(key)}
            className={`flex flex-col items-center justify-center transition-colors relative ${
              mobileTab === key
                ? 'bg-[#ff9500] text-[#4b2800] rounded-full px-6 py-1 scale-105'
                : 'text-[#dbc2ad]/60 hover:text-[#ffbd7f]'
            }`}
          >
            <Icon className="w-5 h-5" />
            {key === 'chat' && mobileTab !== 'chat' && chatMessages.filter(m => m.messageType === 'Text').length > 0 && (
              <div className="absolute -top-0.5 right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-[8px] font-bold text-white">{chatMessages.filter(m => m.messageType === 'Text').length > 9 ? '9+' : chatMessages.filter(m => m.messageType === 'Text').length}</span>
              </div>
            )}
            <span className="text-[9px] font-bold uppercase mt-0.5">{label}</span>
          </button>
        ))}
      </nav>

      {/* Chat FAB (Desktop) */}
      <button
        onClick={() => setShowChat(true)}
        className="hidden md:flex fixed bottom-8 right-[320px] z-50 w-14 h-14 bg-[#ff9500] text-[#4b2800] rounded-full shadow-2xl items-center justify-center hover:scale-110 active:scale-95 transition-all"
      >
        <MessageCircle className="w-6 h-6" />
        {chatMessages.length > 0 && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center border-2 border-[#121317]">
            <span className="text-[10px] font-bold text-white">{chatMessages.filter(m => m.messageType === 'Text').length}</span>
          </div>
        )}
      </button>

      {/* Chat Slide-Over Panel (Desktop only) */}
      <div className="hidden md:block">
        <GroupChatPanel
          messages={chatMessages}
          onSend={handleSendChat}
          members={groupState.members}
          isOpen={showChat}
          onClose={() => setShowChat(false)}
        />
      </div>

      {/* Payment Modal */}
      {showPaymentModal && paymentAction && (
        <GroupPaymentModal
          paymentAction={paymentAction}
          isHost={!!isHost}
          onAction={handlePaymentAction}
          onClose={() => setShowPaymentModal(false)}
        />
      )}

      {/* Pair Request Modal */}
      {showPairModal && (
        <PairRequestModal
          members={groupState.members}
          currentUserId={currentUserId}
          onCreatePair={handleCreatePair}
          onClose={() => setShowPairModal(false)}
        />
      )}

      {/* QR Code Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setShowQrModal(false)} />
          <div className="relative bg-[#1a1b1f]/95 backdrop-blur-2xl border border-[#554334]/30 rounded-2xl w-full max-w-sm p-6 text-center shadow-2xl flex flex-col items-center gap-4">
            <h3 className="text-[17px] font-bold text-[#e3e2e7]">{t('socialBooking.qr.title', 'Quét Mã QR Tham Gia')}</h3>
            <p className="text-[12px] text-[#dbc2ad]/50">{t('socialBooking.qr.subtitle', 'Chia sẻ mã này với bạn bè để họ cùng vào đặt vé')}</p>
            <div className="bg-white p-4 rounded-xl mt-2">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(`${window.location.origin}/group-booking/${groupState.groupCode}`)}`}
                alt="Invite QR Code"
                className="w-[180px] h-[180px]"
              />
            </div>
            <div className="w-full flex flex-col gap-2 mt-4">
              <button onClick={handleCopyInviteLink} className="w-full py-2.5 bg-[#343539]/80 rounded-xl text-[13px] font-semibold text-[#e3e2e7] hover:bg-[#343539] transition-colors flex items-center justify-center gap-2">
                {copied ? <Check className="w-4 h-4 text-[#34C759]" /> : <Copy className="w-4 h-4" />}
                {copied ? t('socialBooking.qr.copied', 'Đã sao chép!') : t('socialBooking.qr.copyLink', 'Sao Chép Đường Dẫn')}
              </button>
              <button onClick={() => setShowQrModal(false)} className="w-full py-2.5 bg-[#ff9500] rounded-xl text-[13px] font-bold text-[#4b2800] hover:bg-[#ffbd7f] transition-colors">
                {t('socialBooking.common.close', 'Đóng')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Background Decoration */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#ff9500]/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#ff9500]/5 rounded-full blur-[120px]"></div>
      </div>
    </div>
  );
}
