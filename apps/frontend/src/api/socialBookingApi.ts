import { bookingAxios } from './axiosClient';
import type { ApiSuccessResponse } from '../types/auth.types';
import type {
  CreateGroupBookingRequest,
  CreateGroupBookingResponse,
  JoinGroupBookingRequest,
  GroupBookingState,
  SelectGroupSeatsRequest,
  SendChatRequest,
  ChatMessage,
  VoteMovieRequest,
  MovieVoteState,
  GroupPaymentActionRequest,
  GroupPaymentActionResponse,
  ConfirmGroupSeatsResponse,
  PayGroupBookingResponse,
  VotePaymentMethodRequest,
  PaymentMethodVoteState,
  CreatePairRequest,
  RespondPairRequest,
  GroupPairDto,
  VotePaymentFailureRequest,
  PaymentFailureVoteState,
  RaiseHandRequest,
} from '../types/socialBooking.types';

const normalizeSuccessResponse = <T = any>(response: any): ApiSuccessResponse<T> => ({
  isSuccess: response.data?.isSuccess ?? response.data?.IsSuccess ?? (response.status >= 200 && response.status < 300),
  message: response.data?.message ?? response.data?.Message ?? 'Success',
  data: response.data?.data ?? response.data?.Data,
});

export const socialBookingApi = {
  createGroup: async (data: CreateGroupBookingRequest): Promise<ApiSuccessResponse<CreateGroupBookingResponse>> => {
    const response = await bookingAxios.post('/group/create', data);
    return normalizeSuccessResponse<CreateGroupBookingResponse>(response);
  },

  joinGroup: async (data: JoinGroupBookingRequest): Promise<ApiSuccessResponse<GroupBookingState>> => {
    const response = await bookingAxios.post('/group/join', data);
    return normalizeSuccessResponse<GroupBookingState>(response);
  },

  getGroupState: async (groupSessionId: string): Promise<ApiSuccessResponse<GroupBookingState>> => {
    const response = await bookingAxios.get(`/group/state/${groupSessionId}`);
    return normalizeSuccessResponse<GroupBookingState>(response);
  },

  selectSeats: async (groupSessionId: string, data: SelectGroupSeatsRequest): Promise<ApiSuccessResponse<GroupBookingState>> => {
    const response = await bookingAxios.post(`/group/seats/${groupSessionId}`, data);
    return normalizeSuccessResponse<GroupBookingState>(response);
  },

  sendChat: async (groupSessionId: string, data: SendChatRequest): Promise<ApiSuccessResponse<ChatMessage>> => {
    const response = await bookingAxios.post(`/group/chat/${groupSessionId}`, data);
    return normalizeSuccessResponse<ChatMessage>(response);
  },

  getChatMessages: async (groupSessionId: string, limit = 50, before?: string): Promise<ApiSuccessResponse<ChatMessage[]>> => {
    const response = await bookingAxios.get(`/group/chat/${groupSessionId}`, { params: { limit, before } });
    return normalizeSuccessResponse<ChatMessage[]>(response);
  },

  voteMovie: async (groupSessionId: string, data: VoteMovieRequest): Promise<ApiSuccessResponse<MovieVoteState>> => {
    const response = await bookingAxios.post(`/group/vote/${groupSessionId}`, data);
    return normalizeSuccessResponse<MovieVoteState>(response);
  },

  handlePaymentAction: async (groupSessionId: string, data: GroupPaymentActionRequest): Promise<ApiSuccessResponse<GroupPaymentActionResponse>> => {
    const response = await bookingAxios.post(`/group/payment-action/${groupSessionId}`, data);
    return normalizeSuccessResponse<GroupPaymentActionResponse>(response);
  },

  leaveGroup: async (groupSessionId: string): Promise<ApiSuccessResponse<any>> => {
    const response = await bookingAxios.post(`/group/leave/${groupSessionId}`);
    return normalizeSuccessResponse<any>(response);
  },

  confirmSeats: async (groupSessionId: string, seatIds: string[]): Promise<ApiSuccessResponse<ConfirmGroupSeatsResponse>> => {
    const response = await bookingAxios.post(`/group/confirm/${groupSessionId}`, { seatIds });
    return normalizeSuccessResponse<ConfirmGroupSeatsResponse>(response);
  },

  payGroup: async (groupSessionId: string, failedMemberId?: string): Promise<ApiSuccessResponse<PayGroupBookingResponse>> => {
    const url = failedMemberId ? `/group/pay/${groupSessionId}?failedMemberId=${failedMemberId}` : `/group/pay/${groupSessionId}`;
    const response = await bookingAxios.post(url);
    return normalizeSuccessResponse<PayGroupBookingResponse>(response);
  },

  // Payment Method Voting
  votePaymentMethod: async (groupSessionId: string, data: VotePaymentMethodRequest): Promise<ApiSuccessResponse<PaymentMethodVoteState>> => {
    const response = await bookingAxios.post(`/group/vote-payment-method/${groupSessionId}`, data);
    return normalizeSuccessResponse<PaymentMethodVoteState>(response);
  },

  getPaymentMethodVoteState: async (groupSessionId: string): Promise<ApiSuccessResponse<PaymentMethodVoteState>> => {
    const response = await bookingAxios.get(`/group/payment-method-vote/${groupSessionId}`);
    return normalizeSuccessResponse<PaymentMethodVoteState>(response);
  },

  // Pair System
  createPair: async (groupSessionId: string, data: CreatePairRequest): Promise<ApiSuccessResponse<boolean>> => {
    const response = await bookingAxios.post(`/group/pair/${groupSessionId}`, data);
    return normalizeSuccessResponse<boolean>(response);
  },

  respondPair: async (groupSessionId: string, pairId: string, data: RespondPairRequest): Promise<ApiSuccessResponse<boolean>> => {
    const response = await bookingAxios.post(`/group/pair/${groupSessionId}/respond/${pairId}`, data);
    return normalizeSuccessResponse<boolean>(response);
  },

  getGroupPairs: async (groupSessionId: string): Promise<ApiSuccessResponse<GroupPairDto[]>> => {
    const response = await bookingAxios.get(`/group/pairs/${groupSessionId}`);
    return normalizeSuccessResponse<GroupPairDto[]>(response);
  },

  // Payment Failure Voting
  votePaymentFailure: async (groupSessionId: string, data: VotePaymentFailureRequest): Promise<ApiSuccessResponse<PaymentFailureVoteState>> => {
    const response = await bookingAxios.post(`/group/vote-payment-failure/${groupSessionId}`, data);
    return normalizeSuccessResponse<PaymentFailureVoteState>(response);
  },

  raiseHand: async (groupSessionId: string, data: RaiseHandRequest): Promise<ApiSuccessResponse<PaymentFailureVoteState>> => {
    const response = await bookingAxios.post(`/group/raise-hand/${groupSessionId}`, data);
    return normalizeSuccessResponse<PaymentFailureVoteState>(response);
  },

  voteFailureOption: async (groupSessionId: string, data: { option: number }): Promise<ApiSuccessResponse<PaymentFailureVoteState>> => {
    const response = await bookingAxios.post(`/group/vote-failure-option/${groupSessionId}`, data);
    return normalizeSuccessResponse<PaymentFailureVoteState>(response);
  },
};
