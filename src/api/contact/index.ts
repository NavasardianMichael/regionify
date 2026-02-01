import { CONTACT_ENDPOINTS } from './endpoints';
import type { ContactPayload, ContactResponse } from './types';

/**
 * Sends a contact form message via the mail engine API
 */
export const sendContactMessage = async (payload: ContactPayload): Promise<ContactResponse> => {
  const response = await fetch(CONTACT_ENDPOINTS.send, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
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
