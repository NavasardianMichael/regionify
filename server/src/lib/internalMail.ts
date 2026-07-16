import { env } from '@/config/env.js';
import { logger } from '@/lib/logger.js';

const APP_ID = 'regionify';

interface MailApiResponse {
  success: boolean;
  message: string;
  messageId?: string;
}

interface MailApiErrorResponse {
  success: false;
  error: string;
}

export type InternalMailPayload = {
  subject: string;
  body: string;
  senderEmail?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  details?: Record<string, string>;
};

/** POST to the internal Mail API — recipient is resolved externally based on `appId`. */
export async function sendInternalMail(payload: InternalMailPayload): Promise<MailApiResponse> {
  const response = await fetch(`${env.MAIL_API_URL}/mail/internal/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': env.MAIL_API_KEY,
    },
    body: JSON.stringify({ website: '', appId: APP_ID, ...payload }),
  });

  const data = (await response.json()) as MailApiResponse | MailApiErrorResponse;

  if (!response.ok || !data.success) {
    const errorMessage = 'error' in data ? data.error : 'Failed to send email';
    logger.error({ response: data, statusCode: response.status }, 'Mail API error');
    throw new Error(errorMessage);
  }

  return data;
}
