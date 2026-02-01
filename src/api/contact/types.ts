export type ContactPayload = {
  appId: string;
  subject?: string;
  body?: string;
  senderEmail?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  details?: Record<string, unknown>;
};

export type ContactResponse = {
  success: boolean;
  message: string;
  messageId?: string;
};

export type ContactErrorResponse = {
  success: false;
  message: string;
  errors?: Array<{ field: string; message: string }>;
};
