import { env } from '@/config/env.js';
import { logger } from '@/lib/logger.js';

const MAIL_APP_ID = 'regionify';

type MailApiFieldError = { field: string; message: string };

export type MailApiResponse = {
  success: boolean;
  message: string;
  messageId?: string;
  errors?: MailApiFieldError[];
};

type MailApiPath = '/mail/internal/send' | '/mail/external/send';

/** POST to the Mail Engine; throws with its `message` (and per-field `errors` on 400) when not sent. */
export async function postMailApi(
  path: MailApiPath,
  payload: Record<string, unknown>,
): Promise<MailApiResponse> {
  const response = await fetch(`${env.MAIL_API_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': env.MAIL_API_KEY,
    },
    body: JSON.stringify({ appId: MAIL_APP_ID, ...payload }),
  });

  const data = (await response.json().catch(() => null)) as MailApiResponse | null;

  if (response.ok && data?.success) return data;

  const fieldErrors = data?.errors?.map(({ field, message }) => `${field}: ${message}`).join('; ');
  const errorMessage = [data?.message ?? 'Failed to send email', fieldErrors]
    .filter(Boolean)
    .join(' — ');

  logger.error(
    {
      path,
      statusCode: response.status,
      message: data?.message,
      errors: data?.errors,
      rateLimitReset: response.headers.get('RateLimit-Reset'),
    },
    'Mail API error',
  );
  throw new Error(`Mail API ${response.status}: ${errorMessage}`);
}
