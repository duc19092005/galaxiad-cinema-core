import { bookingAxios, API_BASE_URL } from './axiosClient';
import type { ApiSuccessResponse } from '../types/auth.types';
import type {
  CreateGroupBookingRequest,
  CreateGroupBookingResponse,
  JoinGroupBookingRequest,
  JoinGroupBookingResponse,
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

  joinGroup: async (data: JoinGroupBookingRequest): Promise<ApiSuccessResponse<JoinGroupBookingResponse>> => {
    const response = await bookingAxios.post('/group/join', data);
    return normalizeSuccessResponse<JoinGroupBookingResponse>(response);
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

  payGroup: async (groupSessionId: string): Promise<ApiSuccessResponse<PayGroupBookingResponse>> => {
    const response = await bookingAxios.post(`/group/pay/${groupSessionId}`);
    return normalizeSuccessResponse<PayGroupBookingResponse>(response);
  },

  getGroupWsUrl: (groupSessionId: string): string => {
    const base = API_BASE_URL || window.location.origin;
    const wsBase = base.replace(/^http/, 'ws');
    return `${wsBase}/api/v1/booking/group/ws/${groupSessionId}`;
  },
};
