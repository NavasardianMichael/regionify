export type ContactPayload = {
  firstName: string;
  lastName: string;
  email: string;
  body: string;
  subject?: string;
  phoneNumber?: string;
  details?: Record<string, string>;
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
