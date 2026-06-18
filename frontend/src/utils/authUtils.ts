// src/utils/authUtils.ts

export interface DecodedToken {
  email?: string;
  userId?: string;
  name?: string;
  role?: string;
  roles?: string[];
  permissions?: string[];
  exp?: number;
  nbf?: number;
  iss?: string;
  aud?: string;
}

/**
 * Lưu ý: Cookie là HttpOnly nên không thể đọc từ JavaScript
 * Token sẽ tự động được gửi với mọi request nhờ withCredentials: true
 * Chúng ta verify authentication bằng cách gọi API thay vì đọc cookie
 */

/**
 * Decode JWT token (không verify signature, chỉ decode payload)
 */
export const decodeJWT = (token: string): DecodedToken | null => {
  try {
    // JWT format: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    // Decode payload (base64url)
    const payload = parts[1];
    // Replace base64url characters
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    // Add padding if needed
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    
    // Decode base64
    const decoded = atob(padded);
    const parsed = JSON.parse(decoded) as DecodedToken;

    // Map claims to user-friendly format
    const result: DecodedToken = {
      exp: parsed.exp,
      nbf: parsed.nbf,
      iss: parsed.iss,
      aud: parsed.aud,
    };

    // Extract email
    const emailClaim = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress';
    if (parsed[emailClaim as keyof typeof parsed]) {
      result.email = parsed[emailClaim as keyof typeof parsed] as string;
    }

    // Extract name
    const nameClaim = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name';
    if (parsed[nameClaim as keyof typeof parsed]) {
      result.name = parsed[nameClaim as keyof typeof parsed] as string;
    }

    // Extract userId (sid)
    const sidClaim = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/sid';
    if (parsed[sidClaim as keyof typeof parsed]) {
      result.userId = parsed[sidClaim as keyof typeof parsed] as string;
    }

    // Extract role(s)
    const roleClaim = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';
    const roleValue = parsed[roleClaim as keyof typeof parsed];
    
    if (roleValue) {
      if (Array.isArray(roleValue)) {
        result.roles = roleValue;
      } else {
        result.role = roleValue as string;
        result.roles = [roleValue as string];
      }
    }

    const permissionValue = (parsed as Record<string, unknown>).permission;
    if (permissionValue) {
      result.permissions = Array.isArray(permissionValue)
        ? permissionValue.map(String)
        : [String(permissionValue)];
    }

    // Check if token is expired
    if (result.exp && result.exp < Date.now() / 1000) {
      return null; // Token expired
    }

    return result;
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
};

/**
 * Lấy user info từ localStorage (đã được lưu từ login response)
 */
export const getUserInfoFromStorage = (): { userId: string; username: string; roles: string[]; permissions?: string[]; portraitImageUrl?: string | null } | null => {
  try {
    const stored = localStorage.getItem('user_info');
    if (!stored) return null;
    
    const userInfo = JSON.parse(stored);
    if (userInfo && userInfo.userId && userInfo.roles) {
      return userInfo;
    }
    return null;
  } catch (error) {
    console.error('Error reading user info from storage:', error);
    return null;
  }
};

/**
 * Tạo user info object từ token để lưu vào localStorage (tương thích với format hiện tại)
 */
export const createUserInfoFromToken = (decoded: DecodedToken): { userId: string; username: string; roles: string[]; permissions?: string[]; portraitImageUrl?: string | null } | null => {
  if (!decoded.userId || !decoded.roles || decoded.roles.length === 0) {
    return null;
  }

  return {
    userId: decoded.userId,
    // Ưu tiên name, sau đó email, cuối cùng là userId
    username: decoded.name || decoded.email || decoded.userId,
    roles: decoded.roles,
    permissions: decoded.permissions,
  };
};

export const hasPermission = (requiredPermission: string): boolean => {
  try {
    const stored = localStorage.getItem('user_info');
    if (!stored) return false;
    const userInfo = JSON.parse(stored) as { permissions?: string[]; roles?: string[] };
    return Boolean(userInfo.roles?.includes('Admin') || userInfo.permissions?.includes(requiredPermission));
  } catch {
    return false;
  }
};
