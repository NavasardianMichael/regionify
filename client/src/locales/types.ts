/**
 * Single source of truth for translation keys.
 * Every locale file must satisfy this type so missing keys are caught by TypeScript.
 */
export type CommonNs = {
  appName: string;
  nav: {
    home: string;
    projects: string;
    contact: string;
    billing: string;
    about: string;
    login: string;
    account: string;
    security: string;
    logout: string;
    deleteAccount: string;
    cancel: string;
    logoutError: string;
  };
  deleteAccountModal: {
    title: string;
    content: string;
    ok: string;
    error: string;
  };
  home: {
    title: string;
    welcome: string;
  };
  about: {
    title: string;
    description: string;
  };
  billing: {
    title: string;
    subtitle: string;
    paymentNote: string;
    checkoutError: string;
    currentPlan: string;
    bestChoice: string;
  };
  account: {
    title: string;
    subtitle: string;
    name: string;
    email: string;
    emailNote: string;
    language: string;
    saveProfile: string;
    profileUpdated: string;
    updateError: string;
    backToProjects: string;
  };
  security: {
    title: string;
    subtitle: string;
    changePassword: string;
    changePasswordDescription: string;
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
    passwordUpdated: string;
    updateError: string;
    securityInfo: {
      title: string;
      passwordHashing: string;
      sessionSecurity: string;
      rateLimiting: string;
      dataEncryption: string;
    };
    googleAccountNote: string;
    backToProjects: string;
  };
  contact: {
    title: string;
    subtitle: string;
    success: string;
    error: string;
    firstName: string;
    lastName: string;
    email: string;
    message: string;
    firstNameRequired: string;
    lastNameRequired: string;
    emailRequired: string;
    messageRequired: string;
    submit: string;
  };
  projects: {
    title: string;
    searchPlaceholder: string;
    newProject: string;
    empty: string;
    emptyFiltered: string;
  };
  common: {
    loading: string;
    save: string;
    cancel: string;
    delete: string;
    error: string;
    language: string;
  };
};
