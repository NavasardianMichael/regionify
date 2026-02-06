// Validation constants - Single source of truth for client and server

export const AUTH_VALIDATION = {
  email: {
    maxLength: 255,
    messages: {
      required: 'Please enter your email',
      invalid: 'Please enter a valid email',
    },
  },
  password: {
    minLength: 8,
    maxLength: 128,
    patterns: {
      lowercase: /[a-z]/,
      uppercase: /[A-Z]/,
      number: /[0-9]/,
    },
    messages: {
      required: 'Please enter your password',
      minLength: 'Password must be at least 8 characters',
      maxLength: 'Password must be at most 128 characters',
      lowercase: 'Password must contain at least one lowercase letter',
      uppercase: 'Password must contain at least one uppercase letter',
      number: 'Password must contain at least one number',
    },
  },
  name: {
    minLength: 2,
    maxLength: 100,
    pattern: /^[a-zA-Z\s'-]+$/,
    messages: {
      required: 'Please enter your name',
      minLength: 'Name must be at least 2 characters',
      maxLength: 'Name must be at most 100 characters',
      pattern: 'Name can only contain letters, spaces, hyphens, and apostrophes',
    },
  },
  confirmPassword: {
    messages: {
      required: 'Please confirm your password',
      mismatch: 'Passwords do not match',
    },
  },
  token: {
    messages: {
      required: 'Token is required',
    },
  },
} as const;
