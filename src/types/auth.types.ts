// src/types/auth.types.ts

// =============================================
// REQUEST TYPES
// =============================================

/** POST /api/v1/IdentityAccess/regular-register */
export interface RegisterRequest {
  userEmail: string;
  userPassword: string;
  userRepassword: string;
  userName: string;
  identityCode: string;
  phoneNumber: string;
  dateOfBirth: string; // ISO String format
}

/** POST /api/v1/IdentityAccess/regular-login */
export interface LoginRequest {
  email: string;
  password: string;
}

/** POST /api/v1/IdentityAccess/change-password */
export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
  renewPassword: string;
}

// =============================================
// RESPONSE TYPES
// =============================================

/** Base success response wrapper - BaseResponse<T> */
export interface ApiSuccessResponse<T = null> {
  isSuccess: boolean;
  message: string;
  data: T;
}

/** Error response format from server */
export interface ApiErrorResponse {
  statusCode: number;
  errorCode: string;
  message: string;
  errors: string[];
  timestamp: string;
}

/** Logout response */
export interface LogoutResponse {
  message: string;
}

/** Data returned on successful login */
export interface UserLoginData {
  userId: string;
  username: string;
  userName?: string; // Backend actually sends userName instead of username
  roles: string[];
  accessToken?: string;
}

/** Data returned from get-profile */
export interface UserProfileData {
  userId: string;
  username: string;
  dateOfBirth: string;
  phoneNumber: string;
  roles: string[];
}