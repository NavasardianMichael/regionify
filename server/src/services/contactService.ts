import { type ContactInput } from '@regionify/shared';

import { env } from '../config/env.js';
import { logger } from '../lib/index.js';

const MAIL_API_URL = 'https://api-mail-engine.mnavasardian.com/mail/send';
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

export const contactService = {
  async sendContactForm(input: ContactInput): Promise<{ success: boolean; message: string }> {
    const { firstName, lastName, email, body, subject, phoneNumber, details } = input;

    const payload = {
      website: '', // Honeypot field - must be empty
      appId: APP_ID,
      subject: subject ?? 'Contact Form Submission',
      body,
      senderEmail: email,
      firstName,
      lastName,
      phoneNumber,
      details,
    };

    try {
      const response = await fetch(MAIL_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(env.MAIL_API_KEY && { 'x-api-key': env.MAIL_API_KEY }),
        },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as MailApiResponse | MailApiErrorResponse;

      if (!response.ok || !data.success) {
        const errorMessage = 'error' in data ? data.error : 'Failed to send email';
        logger.error({ response: data, statusCode: response.status }, 'Mail API error');
        throw new Error(errorMessage);
      }

      logger.info({ messageId: data.messageId, email }, 'Contact form email sent successfully');

      return {
        success: true,
        message: 'Your message has been sent successfully. We will get back to you soon!',
      };
    } catch (error) {
      logger.error({ error, email }, 'Failed to send contact form email');

      if (error instanceof Error) {
        throw error;
      }

      throw new Error('Failed to send message. Please try again later.');
    }
  },
};
