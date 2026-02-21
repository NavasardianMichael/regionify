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
  messages: {
    projectSaved: string;
    projectSaveFailed: string;
    projectCreated: string;
    projectCreateFailed: string;
    projectDeleted: string;
    projectDeleteFailed: string;
    projectRenamed: string;
    projectRenameFailed: string;
    projectsLoadFailed: string;
    mapExportedAs: string;
    exportFailed: string;
    importHistoricalFirst: string;
    loggedInSuccess: string;
    enterEmail: string;
    resendVerificationFailed: string;
    feedbackThankYou: string;
    noDataToDownload: string;
    downloadDataFailed: string;
    switchedToStatic: string;
    switchedToDynamic: string;
    switchToStaticConfirm: string;
    switchToDynamicConfirm: string;
    switch: string;
    importedRegions: string;
    importedRowsPeriods: string;
    timeSeriesDetected: string;
    noTimeColumnDetected: string;
    datasetMustIncludeId: string;
    dataFormatMismatch: string;
    failedParseExcel: string;
    failedParseFile: string;
    noValidDataExcel: string;
    noValidDataFile: string;
    downloadSampleFailed: string;
    downloadSample: string;
    close: string;
    deleteProjectTitle: string;
    deleteProjectContent: string;
    deleteProjectOk: string;
  };
};
