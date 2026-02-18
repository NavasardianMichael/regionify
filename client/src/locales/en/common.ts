import type { CommonNs } from '../types';

const en: CommonNs = {
  appName: 'Region Map',
  nav: {
    home: 'Home',
    projects: 'Projects',
    contact: 'Contact',
    billing: 'Billing',
    about: 'About',
    login: 'Login',
    editProfile: 'Edit profile',
    logout: 'Logout',
    deleteAccount: 'Delete Account',
    cancel: 'Cancel',
    logoutError: 'Logout failed. Please try again.',
  },
  deleteAccountModal: {
    title: 'Delete Account',
    content:
      'Are you sure you want to delete your account? All your data, including projects, will be permanently removed. This action cannot be undone.',
    ok: 'Delete Account',
    error: 'Failed to delete account',
  },
  home: {
    title: 'Home',
    welcome: 'Welcome to the Region Map application.',
  },
  about: {
    title: 'About',
    description: 'Learn more about this application.',
  },
  contact: {
    title: 'Contact Us',
    subtitle: 'Have a question? We are here to help.',
    success: 'Message sent successfully! We will get in touch with you soon.',
    error: 'Failed to send message',
    firstName: 'First Name',
    lastName: 'Last Name',
    email: 'Email',
    message: 'Message',
    firstNameRequired: 'Please enter your first name',
    lastNameRequired: 'Please enter your last name',
    emailRequired: 'Please enter your email',
    messageRequired: 'Please enter your message',
    submit: 'Send Message',
  },
  projects: {
    title: 'My Projects',
    searchPlaceholder: 'Search projects...',
    newProject: 'New Project',
    empty: 'No projects yet. Create your first map visualization!',
    emptyFiltered: 'No projects match your search.',
  },
  common: {
    loading: 'Loading...',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    error: 'Something went wrong',
    language: 'Language',
  },
};

export default en;
