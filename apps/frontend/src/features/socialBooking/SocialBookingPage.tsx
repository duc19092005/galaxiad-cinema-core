import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { socialBookingApi } from '../../api/socialBookingApi';
import { verifyAuthAndGetUser } from '../../utils/authHelpers';
import { showSuccess, showError } from '../../utils/ToastUtils';
import { Loader2, MessageCircle, ThumbsUp, Copy, Check, QrCode, LogOut, CreditCard, LayoutGrid, Armchair, ChevronRight } from 'lucide-react';
import type { GroupBookingState, ChatMessage, MovieVoteState, GroupPaymentActionResponse } from '../../types/socialBooking.types';
import GroupChatPanel from './GroupChatPanel';
import GroupSeatGrid from './GroupSeatGrid';
import GroupCheckoutView from './GroupCheckoutView';
import GroupSuccessView from './GroupSuccessView';
import GroupPaymentModal from './GroupPaymentModal';
import GroupMovieVote from './GroupMovieVote';
import GroupMemberList from './GroupMemberList';
import CountdownTimer from './CountdownTimer';

type MobileTab = 'seats' | 'chat' | 'vote';

export default function SocialBookingPage() {
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
  const wsRef = useRef<WebSocket | null>(null);

  const currentUserId = JSON.parse(localStorage.getItem('user_info') || '{}').userId;
  const isHost = groupState?.members?.some(m => m.isHost && m.userId === currentUserId);
  const canPay = isHost && groupState?.status === 'Confirming';
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
    const wsUrl = socialBookingApi.getGroupWsUrl(groupState.groupSessionId);
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => console.log('[WS] Connected to', wsUrl);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'initial-state' || data.type === 'group-update') {
          if (data.state) setGroupState(data.state);
        } else if (data.type === 'chat-message') {
          if (data.chatMessage) {
            setChatMessages(prev => {
              if (prev.some(m => m.messageId === data.chatMessage.messageId)) return prev;
              return [...prev.filter(m => !m.messageId.startsWith('temp-')), data.chatMessage];
            });
          }
        } else if (data.type === 'vote-update') {
          if (data.voteState) setVoteState(data.voteState);
        } else if (data.type === 'payment-action') {
          if (data.paymentAction) {
            setPaymentAction(data.paymentAction);
            setShowPaymentModal(true);
          }
        }
      } catch (err) {
        console.error('[WS] Failed to parse message', err);
      }
    };

    ws.onerror = (err) => console.error('[WS] Connection error', err);
    ws.onclose = () => console.log('[WS] Connection closed');
    wsRef.current = ws;

    return () => { ws.close(); wsRef.current = null; };
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
    if (location.state?.autoShowQR && groupState) {
      setShowQrModal(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state, groupState?.groupSessionId]);

  const joinOrLoadGroup = async () => {
    try {
      setLoading(true);
      const user = await verifyAuthAndGetUser();
      if (!user || !user.userId) {
        navigate(`/login?redirect=/group-booking/${groupCode}`);
        return;
      }
      const joinResult = await socialBookingApi.joinGroup({ groupCode: groupCode! });
      if (joinResult.isSuccess && joinResult.data) {
        setGroupState(joinResult.data as any);
        setVoteState(null);
      } else {
        setError(joinResult.message || 'Failed to join group');
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
      showSuccess('Link da sao chep!');
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

  const handlePayGroup = async () => {
    if (!groupState?.groupSessionId || isProcessingPayment) return;
    const confirmed = window.confirm('Ban muon thanh toan cho ca nhom? Tong: ' + groupState.totalGroupAmount.toLocaleString() + 'd');
    if (!confirmed) return;
    setIsProcessingPayment(true);
    try {
      const result = await socialBookingApi.payGroup(groupState.groupSessionId);
      if (result.isSuccess && result.data) {
        window.location.href = result.data.paymentUrl;
      } else {
        showError(result.message || 'Khong the tao lien ket thanh toan');
      }
    } catch (err: any) {
      showError(err?.response?.data?.message || 'Co loi xay ra khi thanh toan');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleLeaveGroup = async () => {
    if (!groupState?.groupSessionId) return;
    const confirmMessage = isHost
      ? 'Ban la chu phong. Neu roi phong dat chung, phong se bi huy hoan toan. Ban co chac chan muon roi?'
      : 'Ban co chac chan muon roi khoi phong dat chung nay?';
    if (!window.confirm(confirmMessage)) return;
    try {
      const res = await socialBookingApi.leaveGroup(groupState.groupSessionId);
      if (res.isSuccess) {
        showSuccess(res.message || 'Da roi phong dat chung thanh cong.');
        navigate(`/booking/${groupState.scheduleId}`);
      } else {
        showError(res.message || 'Khong the roi phong.');
      }
    } catch (err: any) {
      showError(err?.response?.data?.message || 'Co loi xay ra khi roi phong.');
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
            Ve Trang Chu
          </button>
        </div>
      </div>
    );
  }

  const statusLabel = {
    Open: 'Dang cho thanh vien chon ghe',
    SeatsSelected: 'Dang chon ghe',
    Confirming: 'Tat ca da xac nhan - Cho thanh toan',
    Paying: 'Dang xu ly thanh toan...',
    PaymentFailed: 'Thanh toan that bai',
    Completed: 'Thanh cong!',
  }[groupState.status] || '';

  const statusDotColor = {
    Open: 'bg-white/30', SeatsSelected: 'bg-[#ffbd7f]', Confirming: 'bg-[#34C759]',
    Paying: 'bg-yellow-400 animate-pulse', PaymentFailed: 'bg-red-400', Completed: 'bg-[#34C759]',
  }[groupState.status] || 'bg-white/30';

  return (
    <div className="min-h-screen" style={{ background: '#121317' }}>
      {/* Header */}
      <header className="fixed top-0 w-full z-40 flex justify-between items-center px-4 md:px-12 py-2 bg-[#121317]/80 backdrop-blur-xl border-b border-[#554334]/30">
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <h1 className="text-[15px] md:text-[20px] font-bold text-[#ffbd7f] tracking-tight leading-none">{groupState.groupName}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="bg-[#ff9500]/20 text-[#ffbd7f] text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest">
                {groupState.groupCode}
              </span>
              <span className="text-[12px] text-[#dbc2ad] hidden md:block">
                {groupState.movieName}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          {canPay && (
            <button
              onClick={handlePayGroup}
              disabled={isProcessingPayment}
              className="flex items-center gap-2 bg-[#ff9500] text-[#4b2800] px-4 py-2 rounded-full font-bold text-[11px] hover:bg-[#ffbd7f] transition-colors disabled:opacity-60"
            >
              {isProcessingPayment ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
              <span className="hidden md:inline">Thanh Toan</span>
              <span className="md:hidden">Pay</span>
            </button>
          )}
          <button onClick={() => setShowQrModal(true)} className="flex items-center gap-2 bg-[#292a2e] px-3 py-2 rounded-full hover:bg-[#343539] transition-colors">
            <QrCode className="w-4 h-4 text-[#ff9500]" />
            <span className="text-[10px] font-bold text-[#e3e2e7] hidden md:block">QR</span>
          </button>
          <button onClick={handleCopyInviteLink} className="flex items-center gap-2 bg-[#292a2e] px-3 py-2 rounded-full hover:bg-[#343539] transition-colors">
            {copied ? <Check className="w-4 h-4 text-[#34C759]" /> : <Copy className="w-4 h-4 text-[#dbc2ad]" />}
            <span className="text-[10px] font-bold text-[#e3e2e7] hidden md:block uppercase">{copied ? 'Copied!' : 'Copy Link'}</span>
          </button>
          <button onClick={handleLeaveGroup} className="p-2 rounded-full bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
          <CountdownTimer expiresAt={groupState.paymentDeadlineAt || groupState.expiresAt} />
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
                  <span>Chon ghe</span>
                </div>
                <ChevronRight className="w-4 h-4 text-[#554334]" />
                <div className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-[#343539]/60 text-[#dbc2ad]/50 text-[11px] font-bold uppercase tracking-wider">
                  <CreditCard className="w-4 h-4" />
                  <span>Thanh toan</span>
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

          {/* Stage 2 & 3: Checkout / Payment */}
          {(groupState.status === 'Confirming' || groupState.status === 'Paying' || groupState.status === 'PaymentFailed') && (
            <GroupCheckoutView
              groupState={groupState}
              scheduleId={groupState.scheduleId}
              isHost={!!isHost}
              onPay={handlePayGroup}
              isPaying={isProcessingPayment}
            />
          )}

          {/* Stage 3: Success */}
          {groupState.status === 'Completed' && (
            <GroupSuccessView groupState={groupState} />
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
          { key: 'seats' as MobileTab, icon: LayoutGrid, label: 'Ghe' },
          { key: 'chat' as MobileTab, icon: MessageCircle, label: 'Chat' },
          { key: 'vote' as MobileTab, icon: ThumbsUp, label: 'Bau chon' },
        ].map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            onClick={() => key === 'chat' ? setShowChat(true) : setMobileTab(key)}
            className={`flex flex-col items-center justify-center transition-colors ${
              mobileTab === key && key !== 'chat'
                ? 'bg-[#ff9500] text-[#4b2800] rounded-full px-6 py-1 scale-105'
                : 'text-[#dbc2ad]/60 hover:text-[#ffbd7f]'
            }`}
          >
            <Icon className="w-5 h-5" />
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

      {/* Chat Slide-Over Panel */}
      <GroupChatPanel
        messages={chatMessages}
        onSend={handleSendChat}
        members={groupState.members}
        isOpen={showChat}
        onClose={() => setShowChat(false)}
      />

      {/* Payment Modal */}
      {showPaymentModal && paymentAction && (
        <GroupPaymentModal
          paymentAction={paymentAction}
          isHost={!!isHost}
          onAction={handlePaymentAction}
          onClose={() => setShowPaymentModal(false)}
        />
      )}

      {/* QR Code Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setShowQrModal(false)} />
          <div className="relative bg-[#1a1b1f]/95 backdrop-blur-2xl border border-[#554334]/30 rounded-2xl w-full max-w-sm p-6 text-center shadow-2xl flex flex-col items-center gap-4">
            <h3 className="text-[17px] font-bold text-[#e3e2e7]">Quet Ma QR Tham Gia</h3>
            <p className="text-[12px] text-[#dbc2ad]/50">Chia se ma nay voi ban be de ho cung vao dat ve</p>
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
                {copied ? 'Da sao chep!' : 'Sao Chep Duong Dan'}
              </button>
              <button onClick={() => setShowQrModal(false)} className="w-full py-2.5 bg-[#ff9500] rounded-xl text-[13px] font-bold text-[#4b2800] hover:bg-[#ffbd7f] transition-colors">
                Dong
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
