import { CONTACT_ENDPOINTS } from './endpoints';
import type { ContactPayload, ContactResponse } from './types';

const API_KEY = import.meta.env.VITE_MAIL_API_KEY as string;

/**
 * Sends a contact form message via the mail engine API
 */
export const sendContactMessage = async (payload: ContactPayload): Promise<ContactResponse> => {
  const response = await fetch(CONTACT_ENDPOINTS.send, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json()) as ContactResponse;

  if (!response.ok) {
    throw new Error(data.message || 'Failed to send message');
  }

  return data;
};

export * from './processors';
export * from './types';
