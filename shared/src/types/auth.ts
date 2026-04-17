export type AuthProvider = 'local' | 'google';

export type LoginCredentials = {
  email: string;
  password: string;
};

export type RegisterCredentials = {
  email: string;
  password: string;
  name: string;
};

export type AuthSession = {
  userId: string;
  email: string;
  name: string;
  provider: AuthProvider;
  createdAt: string;
  expiresAt: string;
};

export type AuthResponse = {
  user: UserPublic;
  message: string;
};

export type RegisterResponse = {
  message: string;
};

import type { Locale } from './locale.js';
import type { Badge } from './badge.js';

export type UserPublic = {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  provider: AuthProvider;
  badge: Badge;
  locale: Locale;
  createdAt: string;
};
