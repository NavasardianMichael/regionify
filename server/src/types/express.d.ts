import { type UserPublic } from '@regionify/shared';

declare module 'express-session' {
  interface SessionData {
    userId?: string;
  }
}

declare global {
  namespace Express {
    interface User extends UserPublic {}
  }
}

export {};
