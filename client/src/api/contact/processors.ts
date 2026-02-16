import type { ContactPayload, ContactResponse } from './types';

type ContactFormData = {
  firstName: string;
  lastName: string;
  email: string;
  message: string;
};

type AccountDeletionFeedbackData = {
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
    subject: 'Regionify / Contact',
    body: formData.message,
    email: formData.email,
    firstName: formData.firstName.trim(),
    lastName: formData.lastName.trim(),
  };
};

/**
 * Transforms account deletion feedback form data into API payload format
 */
export const processAccountDeletionFeedback = (
  formData: AccountDeletionFeedbackData,
): ContactPayload => {
  return {
    subject: 'Regionify / Account Deletion Feedback',
    body: formData.message,
    email: formData.email,
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
