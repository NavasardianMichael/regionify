import type { ContactPayload, ContactResponse } from './types';

const APP_ID = 'regionify';

type ContactFormData = {
  name: string;
  email: string;
  message: string;
};

/**
 * Transforms contact form data into API payload format
 */
export const processContactFormData = (formData: ContactFormData): ContactPayload => {
  const nameParts = formData.name.trim().split(/\s+/);
  const firstName = nameParts[0] || 'Anonymous';
  const lastName = nameParts.slice(1).join(' ') || '';

  return {
    appId: APP_ID,
    subject: 'Contact Form Submission',
    body: formData.message,
    senderEmail: formData.email,
    firstName,
    lastName,
  };
};

/**
 * Extracts user-friendly error message from API response
 */
export const processContactError = (response: ContactResponse): string => {
  return response.message || 'Failed to send message. Please try again.';
};
