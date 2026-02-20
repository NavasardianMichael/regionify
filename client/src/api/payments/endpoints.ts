const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

export const PAYMENT_ENDPOINTS = {
  createCheckout: `${BASE_URL}/payments/create-checkout`,
} as const;
