import { type MailApiResponse, postMailApi } from '@/lib/mailApi.js';

export type InternalMailPayload = {
  subject: string;
  body: string;
  senderEmail?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  details?: Record<string, string>;
};

/** POST to the internal Mail API — the Mail Engine always delivers it to the owner's mailbox. */
export async function sendInternalMail(payload: InternalMailPayload): Promise<MailApiResponse> {
  return postMailApi('/mail/internal/send', { website: '', ...payload });
}
