const BASE_URL = import.meta.env.VITE_MAIL_API_URL as string;

export const CONTACT_ENDPOINTS = {
  send: `${BASE_URL}/mail/send`,
} as const;
