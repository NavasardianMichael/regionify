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

export type UserPublic = {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  provider: AuthProvider;
  createdAt: string;
};
