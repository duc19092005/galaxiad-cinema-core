export interface CreateGroupBookingRequest {
  scheduleId: string;
  groupName?: string;
  maxMembers?: number;
  inviteUserIds?: string[];
  inviteEmails?: string[];
}

export interface CreateGroupBookingResponse {
  groupSessionId: string;
  groupCode: string;
  inviteLink: string;
  groupName: string;
  movieName: string;
  movieImageUrl: string;
  cinemaName: string;
  auditoriumNumber: string;
  formatName: string;
  startTime: string;
  endedTime: string;
  maxMembers: number;
  expiresAt: string;
}

export interface JoinGroupBookingRequest {
  groupCode: string;
}

export interface JoinGroupBookingResponse {
  groupSessionId: string;
  scheduleId: string;
  groupCode: string;
  groupName: string;
  movieName: string;
  movieImageUrl: string;
  cinemaName: string;
  auditoriumNumber: string;
  formatName: string;
  startTime: string;
  endedTime: string;
  hostName: string;
  memberCount: number;
  maxMembers: number;
  status: string;
  expiresAt: string;
  members: GroupMemberDto[];
}

export interface GroupMemberDto {
  memberId: string;
  userId: string;
  userName: string;
  avatarUrl?: string;
  isHost: boolean;
  status: string;
  amountToPay: number;
  amountPaid: number;
  pairId?: string;
  selectedSeats: GroupSeatDto[];
}

export interface GroupSeatDto {
  seatId: string;
  seatNumber: string;
  colIndex: number;
  rowIndex: number;
  priceEach: number;
  isConfirmed: boolean;
  memberId?: string;
  memberName?: string;
}

export interface GroupBookingState {
  groupSessionId: string;
  scheduleId: string;
  groupCode: string;
  groupName: string;
  status: string;
  movieName: string;
  movieImageUrl: string;
  cinemaName: string;
  auditoriumNumber: string;
  formatName: string;
  startTime: string;
  endedTime: string;
  maxMembers: number;
  expiresAt?: string;
  paymentDeadlineAt?: string;
  totalGroupAmount: number;
  collectedAmount: number;
  paymentMethod?: string;
  voteStatus?: string;
  voteExpiresAt?: string;
  members: GroupMemberDto[];
  allGroupSeats: GroupSeatDto[];
  pairs: GroupPairDto[];
  failureVoteState?: PaymentFailureVoteState;
}

export interface SelectGroupSeatsRequest {
  seatSelections: { seatId: string; userSegmentId: string }[];
}

export interface SendChatRequest {
  content: string;
}

export interface ChatMessage {
  messageId: string;
  senderId?: string;
  senderName: string;
  senderAvatarUrl?: string;
  content: string;
  messageType: string;
  createdAt: string;
}

export interface VoteMovieRequest {
  voteScheduleId: string;
}

export interface MovieVoteOption {
  scheduleId: string;
  movieName: string;
  movieImageUrl: string;
  startTime: string;
  voteCount: number;
  voterNames: string[];
}

export interface MovieVoteState {
  options: MovieVoteOption[];
  winnerScheduleId?: string;
}

export interface GroupPaymentActionRequest {
  action: 'Cover' | 'TakeOverAll' | 'CancelGroup';
}

export interface GroupPaymentActionResponse {
  action: string;
  message: string;
  paymentUrl?: string;
  amount: number;
  isSuccess: boolean;
}

export interface GroupBookingSseEvent {
  eventType: string;
  groupCode?: string;
  status?: string;
  member?: GroupMemberDto;
  seat?: GroupSeatDto;
  chatMessage?: ChatMessage;
  voteState?: MovieVoteState;
  paymentAction?: GroupPaymentActionResponse;
  totalGroupAmount?: number;
  collectedAmount?: number;
  paymentDeadlineAt?: string;
}

export interface ConfirmGroupSeatsResponse {
  isAllConfirmed: boolean;
  confirmedCount: number;
  totalMembers: number;
  sessionStatus: string;
}

export interface PayGroupBookingResponse {
  paymentUrl: string;
  amount: number;
}

// ==========================================
// PAYMENT METHOD VOTING
// ==========================================

export type PaymentMethodType = 'HostPayAll' | 'IndividualPay' | 'PairPay';

export interface VotePaymentMethodRequest {
  paymentMethod: PaymentMethodType;
}

export interface PaymentMethodVoteDto {
  userId: string;
  userName: string;
  paymentMethod: PaymentMethodType;
  votedAt: string;
}

export interface PaymentMethodVoteState {
  voteStatus: string;
  resultMethod?: PaymentMethodType;
  votes: PaymentMethodVoteDto[];
  totalMembers: number;
  votedCount: number;
  hasVoted: boolean;
  voteCounts: Record<PaymentMethodType, number>;
  voteExpiresAt?: string;
}

// ==========================================
// PAIR SYSTEM
// ==========================================

export interface CreatePairRequest {
  targetMemberId: string;
}

export interface RespondPairRequest {
  accept: boolean;
}

export interface GroupPairDto {
  pairId: string;
  member1: GroupMemberDto;
  member2: GroupMemberDto;
  status: string;
  totalAmount: number;
  seatCount: number;
}

// ==========================================
// PAYMENT FAILURE VOTING
// ==========================================

export type FailureVoteAction = 'CancelFailedOrder' | 'VolunteerToPay' | 'CancelFailMemberOrder';

export interface VotePaymentFailureRequest {
  failedMemberId: string;
  action: FailureVoteAction;
}

export interface FailedMemberVolunteersDto {
  failedMemberId: string;
  failedMemberName: string;
  failedAmount: number;
  volunteers: { userId: string; userName: string }[];
}

export interface GroupFailureOptionVoteDto {
  voterUserId: string;
  voterUserName: string;
  option: number;
}

export interface PaymentFailureVoteState {
  phase: string; // 'Selection' | 'Discussion' | 'Completed'
  expiresAt?: string;
  failedMembers: FailedMemberVolunteersDto[];
  optionVotes: GroupFailureOptionVoteDto[];
  resolutionAction?: string; // 'VolunteerToPay' | 'CancelOrder' | 'ProceedWithoutUnsponsored'
  
  // For backward compatibility
  failedMemberId?: string;
  failedMemberName?: string;
  failedAmount?: number;
  votedCount?: number;
  totalMembers?: number;
  raiseHands?: any[];
  votes?: any[];
  resultAction?: FailureVoteAction | null;
  volunteerWinnerName?: string | null;
}

export interface RaiseHandRequest {
  failedMemberId: string;
  isRaiseHand: boolean;
}
