import type { ContactPayload, ContactResponse } from './types';

const APP_ID = 'regionify';

type ContactFormData = {
  firstName: string;
  lastName: string;
  email: string;
  message: string;
};

/**
 * Transforms contact form data into API payload format
 */
export const processContactFormData = (formData: ContactFormData): ContactPayload => {
  return {
    appId: APP_ID,
    subject: 'Contact Form Submission',
    body: formData.message,
    senderEmail: formData.email,
    firstName: formData.firstName.trim(),
    lastName: formData.lastName.trim(),
  };
};

/**
 * Extracts user-friendly error message from API response
 */
export const processContactError = (response: ContactResponse): string => {
  return response.message || 'Failed to send message. Please try again.';
};
