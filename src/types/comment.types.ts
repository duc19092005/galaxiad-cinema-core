export type MovieCommentStatus = 'PendingModeration' | 'Visible' | 'Rejected' | 'Deleted';

export type CommentEligibilityStatus =
  | 'NotLoggedIn'
  | 'NotCustomer'
  | 'NoPaidTicket'
  | 'ShowtimeNotFinished'
  | 'AlreadyReviewed'
  | 'Allowed';

export interface MovieComment {
  commentId: string;
  movieId: string;
  userId: string;
  userName: string;
  userAvatarUrl?: string | null;
  parentCommentId?: string | null;
  rating?: number | null;
  content: string;
  status: MovieCommentStatus;
  createdAt: string;
  updatedAt?: string | null;
  replies: MovieComment[];
}

export interface MovieCommentsSummary {
  averageRating: number;
  reviewCount: number;
  comments: MovieComment[];
}

export interface CommentEligibility {
  status: CommentEligibilityStatus;
  canComment: boolean;
  message: string;
  orderId?: string | null;
}

export interface UserNotification {
  notificationId: string;
  title: string;
  message: string;
  type: string;
  relatedCommentId?: string | null;
  relatedMovieId?: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface TrendingMovie {
  movieId: string;
  movieName: string;
  movieImageUrl: string;
  movieDescription: string;
  movieDuration: number;
  movieRequiredAgeSymbol: string;
  paidTicketCount: number;
  viewCount: number;
  averageRating: number;
  trendingScore: number;
}

