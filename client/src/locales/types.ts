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
    editProfile: string;
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
