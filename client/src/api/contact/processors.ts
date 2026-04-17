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

type AccountDetails = {
  name: string;
  email: string;
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
 * Transforms account deletion feedback form data into API payload format.
 * Includes original account details in the `details` field when available.
 */
export const processAccountDeletionFeedback = (
  formData: AccountDeletionFeedbackData,
  accountDetails?: AccountDetails,
): ContactPayload => ({
  subject: 'Regionify / Account Deletion Feedback',
  body: formData.message,
  email: formData.email,
  firstName: formData.firstName.trim(),
  lastName: formData.lastName.trim(),
  ...(accountDetails && {
    details: {
      'Account Name': accountDetails.name,
      'Account Email': accountDetails.email,
    },
  }),
});

/**
 * Extracts user-friendly error message from API response
 */
export const processContactError = (response: ContactResponse): string => {
  return response.message || 'Failed to send message. Please try again.';
};
