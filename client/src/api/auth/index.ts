import { AUTH_ENDPOINTS } from './endpoints';
import type {
  AuthApiResponse,
  AuthErrorResponse,
  ChangePasswordPayload,
  ForgotPasswordPayload,
  LoginPayload,
  RegisterApiResponse,
  RegisterPayload,
  ResetPasswordPayload,
  UpdateProfilePayload,
  VerifyEmailPayload,
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
export const register = async (payload: RegisterPayload): Promise<RegisterApiResponse> => {
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

  return data.data as RegisterApiResponse;
};

/**
 * Get current user (requires session). Used e.g. after payment return to refresh plan.
 */
type GetMeResponse = { success: true; data: { user: AuthApiResponse['user'] } };

export const getMe = async (): Promise<AuthApiResponse> => {
  const response = await fetch(AUTH_ENDPOINTS.me, {
    method: 'GET',
    credentials: 'include',
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(getErrorMessage(data, 'Failed to get current user'));
  }
  const typed = data as GetMeResponse;
  return { user: typed.data.user, message: '' };
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

type DeleteAccountResponse = {
  success: boolean;
  data: { message: string };
};

/**
 * Delete the current user's account
 */
export const deleteAccount = async (): Promise<void> => {
  const response = await fetch(AUTH_ENDPOINTS.deleteAccount, {
    method: 'DELETE',
    credentials: 'include',
  });

  const data = (await response.json()) as DeleteAccountResponse;

  if (!response.ok || !data.success) {
    throw new Error(getErrorMessage(data, 'Failed to delete account'));
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
 * Verify email with token
 */
export const verifyEmail = async (payload: VerifyEmailPayload): Promise<void> => {
  const response = await fetch(AUTH_ENDPOINTS.verifyEmail, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(getErrorMessage(data, 'Failed to verify email'));
  }
};

export const resendVerificationEmail = async (email: string): Promise<{ message: string }> => {
  const response = await fetch(AUTH_ENDPOINTS.resendVerificationEmail, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(getErrorMessage(data, 'Failed to resend verification email'));
  }
  return data;
};

type UpdateProfileResponse = {
  success: boolean;
  data: { user: AuthApiResponse['user'] };
};

export const updateProfile = async (
  payload: UpdateProfilePayload,
): Promise<UpdateProfileResponse['data']> => {
  const response = await fetch(AUTH_ENDPOINTS.profile, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  const data = (await response.json()) as UpdateProfileResponse | AuthErrorResponse;
  if (!response.ok || !('success' in data) || !data.success) {
    throw new Error(getErrorMessage(data, 'Failed to update profile'));
  }
  return data.data;
};

export const changePassword = async (
  payload: ChangePasswordPayload,
): Promise<{ message: string }> => {
  const response = await fetch(AUTH_ENDPOINTS.changePassword, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(getErrorMessage(data, 'Failed to change password'));
  }
  return (data as { success: boolean; data: { message: string } }).data;
};
