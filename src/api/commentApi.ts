import { identityAxios, API_BASE_URL } from './axiosClient';
import type { ApiSuccessResponse } from '../types/auth.types';
import type {
  CommentEligibility,
  MovieComment,
  MovieCommentsSummary,
  TrendingMovie,
  UserNotification,
} from '../types/comment.types';

export const commentApi = {
  getMovieComments: async (movieId: string): Promise<ApiSuccessResponse<MovieCommentsSummary>> => {
    const response = await identityAxios.get<ApiSuccessResponse<MovieCommentsSummary>>(`/comments/movies/${movieId}`);
    return response.data;
  },

  getEligibility: async (movieId: string): Promise<ApiSuccessResponse<CommentEligibility>> => {
    const response = await identityAxios.get<ApiSuccessResponse<CommentEligibility>>(`/comments/movies/${movieId}/eligibility`);
    return response.data;
  },

  createComment: async (movieId: string, payload: { content: string; rating: number }): Promise<ApiSuccessResponse<MovieComment>> => {
    const response = await identityAxios.post<ApiSuccessResponse<MovieComment>>(`/comments/movies/${movieId}`, payload);
    return response.data;
  },

  createReply: async (parentCommentId: string, payload: { content: string }): Promise<ApiSuccessResponse<MovieComment>> => {
    const response = await identityAxios.post<ApiSuccessResponse<MovieComment>>(`/comments/${parentCommentId}/replies`, payload);
    return response.data;
  },

  deleteComment: async (commentId: string): Promise<ApiSuccessResponse<boolean>> => {
    const response = await identityAxios.delete<ApiSuccessResponse<boolean>>(`/comments/${commentId}`);
    return response.data;
  },

  getTrendingMovies: async (params: { days?: number; take?: number; cinemaId?: string; city?: string } = {}): Promise<ApiSuccessResponse<TrendingMovie[]>> => {
    const response = await identityAxios.get<ApiSuccessResponse<TrendingMovie[]>>('/comments/movies/trending', { params });
    return response.data;
  },

  getTopRatedMovies: async (params: { take?: number; cinemaId?: string } = {}): Promise<ApiSuccessResponse<TrendingMovie[]>> => {
    const response = await identityAxios.get<ApiSuccessResponse<TrendingMovie[]>>('/comments/movies/top-rated', { params });
    return response.data;
  },

  trackMovieView: async (movieId: string): Promise<void> => {
    await identityAxios.post(`/comments/movies/${movieId}/view`);
  },
};

export const notificationApi = {
  getNotifications: async (): Promise<ApiSuccessResponse<UserNotification[]>> => {
    const response = await identityAxios.get<ApiSuccessResponse<UserNotification[]>>('/notifications');
    return response.data;
  },

  markAsRead: async (notificationId: string): Promise<ApiSuccessResponse<boolean>> => {
    const response = await identityAxios.patch<ApiSuccessResponse<boolean>>(`/notifications/${notificationId}/read`);
    return response.data;
  },

  getNotificationsSseUrl: (): string => `${API_BASE_URL}/api/v1/notifications/sse`,
};

