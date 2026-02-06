import { AUTH_ENDPOINTS } from './endpoints';
import type {
  AuthApiResponse,
  AuthErrorResponse,
  ForgotPasswordPayload,
  LoginPayload,
  RegisterPayload,
  ResetPasswordPayload,
  UserPublic,
} from './types';

/**
 * Extract error message from API error response
 */
const getErrorMessage = (data: unknown, fallback: string): string => {
  if (typeof data === 'object' && data !== null) {
    const errorData = data as AuthErrorResponse;
    if (errorData.error?.message) {
      return errorData.error.message;
    }
  }
  return fallback;
};

/**
 * Login with email and password
 */
export const login = async (payload: LoginPayload): Promise<AuthApiResponse> => {
  const response = await fetch(AUTH_ENDPOINTS.login, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(getErrorMessage(data, 'Failed to login'));
  }

  return data as AuthApiResponse;
};

/**
 * Register a new user
 */
export const register = async (payload: RegisterPayload): Promise<AuthApiResponse> => {
  const response = await fetch(AUTH_ENDPOINTS.register, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(getErrorMessage(data, 'Failed to register'));
  }

  return data;
};

/**
 * Logout the current user
 */
export const logout = async (): Promise<void> => {
  const response = await fetch(AUTH_ENDPOINTS.logout, {
    method: 'POST',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to logout');
  }
};

/**
 * Request password reset email
 */
export const forgotPassword = async (payload: ForgotPasswordPayload): Promise<void> => {
  const response = await fetch(AUTH_ENDPOINTS.forgotPassword, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(getErrorMessage(data, 'Failed to send reset email'));
  }
};

/**
 * Reset password with token
 */
export const resetPassword = async (payload: ResetPasswordPayload): Promise<void> => {
  const response = await fetch(AUTH_ENDPOINTS.resetPassword, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(getErrorMessage(data, 'Failed to reset password'));
  }
};

/**
 * Get current authenticated user
 * Returns null if not authenticated (no error thrown)
 */
export const getCurrentUser = async (): Promise<UserPublic | null> => {
  try {
    const response = await fetch(AUTH_ENDPOINTS.me, {
      credentials: 'include',
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as { success: boolean; data: { user: UserPublic | null } };
    return data.data?.user ?? null;
  } catch {
    return null;
  }
};
