import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { HubConnection } from '@microsoft/signalr';
import { socialBookingApi } from '../../../api/socialBookingApi';
import { signalrClient, stopConnection } from '../../../api/signalrClient';
import { verifyAuthAndGetUser } from '../../../utils/authHelpers';
import { showSuccess, showError } from '../../../utils/ToastUtils';
import type {
  GroupBookingState,
  ChatMessage,
  MovieVoteState,
  GroupPaymentActionResponse,
  PaymentMethodVoteState,
  PaymentFailureVoteState,
  PaymentMethodType,
} from '../../../types/socialBooking.types';

export function useSocialBookingSession(groupCode: string | undefined) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [groupState, setGroupState] = useState<GroupBookingState | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAction, setPaymentAction] = useState<GroupPaymentActionResponse | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [voteState, setVoteState] = useState<MovieVoteState | null>(null);
  const [paymentMethodVoteState, setPaymentMethodVoteState] = useState<PaymentMethodVoteState | null>(null);
  const [failureVoteState, setFailureVoteState] = useState<PaymentFailureVoteState | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const connectionRef = useRef<HubConnection | null>(null);

  const currentUserId = typeof window !== 'undefined'
    ? JSON.parse(localStorage.getItem('user_info') || '{}').userId
    : undefined;

  const joinOrLoadGroup = useCallback(async () => {
    if (!groupCode) {
      setError('No group code provided');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const user = await verifyAuthAndGetUser();
      if (!user || !user.userId) {
        navigate(`/login?redirect=/group-booking/${groupCode}`);
        return;
      }

      let joinResult;
      let lastError: string | null = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          joinResult = await socialBookingApi.joinGroup({ groupCode });
          if (joinResult.isSuccess) break;
          lastError = joinResult.message || 'Failed to join group';
        } catch (err: any) {
          lastError = err?.response?.data?.message || 'Network error';
        }
        if (attempt < 2) await new Promise((r) => setTimeout(r, 1000));
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
  }, [groupCode, navigate]);

  useEffect(() => {
    joinOrLoadGroup();
  }, [joinOrLoadGroup]);

  // SignalR connection for group updates
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
        setChatMessages((prev) => {
          if (prev.some((m) => m.messageId === data.chatMessage.messageId)) return prev;
          return [...prev.filter((m) => !m.messageId.startsWith('temp-')), data.chatMessage];
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
        setFailureVoteState((prev) => (prev ? { ...prev, raiseHands: data.raiseHands } : null));
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

  // Load chat messages
  useEffect(() => {
    if (!groupState?.groupSessionId) return;
    const loadChat = async () => {
      try {
        const res = await socialBookingApi.getChatMessages(groupState.groupSessionId);
        if (res.isSuccess && res.data && res.data.length > 0) {
          setChatMessages(res.data.reverse());
        }
      } catch {
        // ignore
      }
    };
    loadChat();
  }, [groupState?.groupSessionId]);

  // Load payment vote state
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
        // Ignore transient reconnect errors
      }
    };

    loadPaymentVoteState();
    return () => {
      cancelled = true;
    };
  }, [groupState?.groupSessionId, groupState?.status, groupState?.voteStatus, groupState?.voteExpiresAt]);

  const refreshGroupState = async () => {
    if (!groupState?.groupSessionId) return;
    try {
      const res = await socialBookingApi.getGroupState(groupState.groupSessionId);
      if (res.isSuccess && res.data) setGroupState(res.data);
    } catch {
      // ignore
    }
  };

  const handleSendChat = async (content: string) => {
    if (!groupState?.groupSessionId) return;
    const currentUserName = JSON.parse(localStorage.getItem('user_info') || '{}').username || 'You';
    const tempId = `temp-${Date.now()}`;
    setChatMessages((prev) => [
      ...prev,
      {
        messageId: tempId,
        senderId: currentUserId || '',
        senderName: currentUserName,
        content,
        messageType: 'Text',
        createdAt: new Date().toISOString(),
      },
    ]);
    await socialBookingApi.sendChat(groupState.groupSessionId, { content });
  };

  const handleVotePaymentMethod = async (method: PaymentMethodType) => {
    if (!groupState?.groupSessionId) return;
    const res = await socialBookingApi.votePaymentMethod(groupState.groupSessionId, {
      paymentMethod: method,
    });
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
    const res = await socialBookingApi.raiseHand(groupState.groupSessionId, {
      failedMemberId,
      isRaiseHand: isRaise,
    });
    if (res.isSuccess && res.data) setFailureVoteState(res.data);
  };

  const handleVote = async (scheduleId: string) => {
    if (!groupState?.groupSessionId) return;
    const result = await socialBookingApi.voteMovie(groupState.groupSessionId, {
      voteScheduleId: scheduleId,
    });
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

  const handleLeaveGroup = async () => {
    if (!groupState?.groupSessionId) return;
    if (!window.confirm(t('socialBooking.leaveConfirm', 'Bạn có chắc chắn muốn rời nhóm?'))) return;
    try {
      await socialBookingApi.leaveGroup(groupState.groupSessionId);
      navigate('/');
    } catch {
      showError(t('socialBooking.leaveFailed', 'Rời nhóm thất bại'));
    }
  };

  return {
    loading,
    error,
    groupState,
    setGroupState,
    currentUserId,
    chatMessages,
    voteState,
    paymentMethodVoteState,
    failureVoteState,
    paymentAction,
    showPaymentModal,
    setShowPaymentModal,
    isProcessingPayment,
    setIsProcessingPayment,
    refreshGroupState,
    handleSendChat,
    handleVotePaymentMethod,
    handleCreatePair,
    handleVoteFailureOption,
    handleRaiseHand,
    handleVote,
    handlePaymentAction,
    handleLeaveGroup,
    joinOrLoadGroup,
  };
}

