const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

export const PAYMENT_ENDPOINTS = {
  createOrder: `${BASE_URL}/payments/create-order`,
  capture: `${BASE_URL}/payments/capture`,
} as const;
