import { type AuthProvider } from './auth.js';

export type User = {
  id: string;
  email: string;
  name: string;
  passwordHash: string | null;
  avatarUrl: string | null;
  provider: AuthProvider;
  googleId: string | null;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type UserCreate = {
  email: string;
  name: string;
  passwordHash?: string | null;
  avatarUrl?: string | null;
  provider: AuthProvider;
  googleId?: string | null;
  emailVerified?: boolean;
};

export type UserUpdate = Partial<Omit<User, 'id' | 'createdAt'>>;
