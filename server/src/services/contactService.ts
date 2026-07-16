import { type ContactInput } from '@regionify/shared';
import { logger } from '@/lib/logger.js';
import { sendInternalMail } from '@/lib/internalMail.js';

export const contactService = {
  async sendContactForm(input: ContactInput): Promise<{ success: boolean; message: string }> {
    const { firstName, lastName, email, body, subject, phoneNumber, details } = input;

    try {
      const data = await sendInternalMail({
        subject: subject?.trim() || 'No Subject Provided',
        body,
        senderEmail: email,
        firstName,
        lastName,
        phoneNumber,
        details,
      });

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
