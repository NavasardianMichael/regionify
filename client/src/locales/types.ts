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
    plans: string;
    about: string;
    login: string;
    account: string;
    security: string;
    logout: string;
    deleteAccount: string;
    cancel: string;
    logoutError: string;
    /** Accessible name for the locale combobox in the nav */
    languageSelectAriaLabel: string;
    /** Accessible label for the hamburger menu button */
    openMenu: string;
    /** Drawer title for the mobile navigation menu */
    mainMenu: string;
    /** Accessible label for the drawer close control */
    closeMenu: string;
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
    heroHeadline: string;
    heroSubheadline: string;
    ctaStart: string;
    ctaPlans: string;
    featuresTitle: string;
    featureImportTitle: string;
    featureImportDesc: string;
    featureCustomizeTitle: string;
    featureCustomizeDesc: string;
    featureExportTitle: string;
    featureExportDesc: string;
    featureTimeSeriesTitle: string;
    featureTimeSeriesDesc: string;
    mapsTitle: string;
    mapsSubtitle: string;
    ctaBottomTitle: string;
    ctaBottomSubtitle: string;
  };
  about: {
    title: string;
    description: string;
  };
  plans: {
    title: string;
    subtitle: string;
    paymentNote: string;
    checkoutError: string;
    currentPlan: string;
    bestChoice: string;
    priceFree: string;
    priceOneTime: string;
    paymentPendingNote: string;
    verifyErrorNote: string;
    backToPlans: string;
    goToPlans: string;
    rows: {
      projectsLimited: string;
      projectsUnlimited: string;
      imageExport: string;
      advancedStyles: string;
      watermark: string;
      noWatermark: string;
      timeSeries: string;
      animationExport: string;
      publicEmbed: string;
    };
    items: {
      observer: {
        name: string;
        description: string;
        buttonText: string;
      };
      explorer: {
        name: string;
        description: string;
        buttonText: string;
      };
      chronographer: {
        name: string;
        description: string;
        buttonText: string;
      };
    };
  };
  auth: {
    login: {
      title: string;
      subtitle: string;
      continueGoogle: string;
      dividerEmail: string;
      password: string;
      emailPlaceholder: string;
      passwordPlaceholder: string;
      forgotPassword: string;
      signIn: string;
      noAccount: string;
      signUpLink: string;
      resendVerification: string;
    };
    signUp: {
      title: string;
      subtitle: string;
      verifyTitle: string;
      verifyBody: string;
      verifyNote: string;
      goToLogin: string;
      continueGoogle: string;
      dividerEmail: string;
      fullName: string;
      fullNamePlaceholder: string;
      password: string;
      createPasswordPlaceholder: string;
      confirmPassword: string;
      confirmPasswordPlaceholder: string;
      createAccount: string;
      alreadyHaveAccount: string;
      signInLink: string;
      forgotPassword: string;
    };
  };
  visualizer: {
    mapAreaTitle: string;
    /** Mobile layout: tab labels for Data / Map / Styles sections */
    tabData: string;
    tabMap: string;
    tabStyles: string;
    saveModalTitle: string;
    saveModalPrompt: string;
    saveModalPlaceholder: string;
    saveModalCreate: string;
    saveLoginToSave: string;
    save: string;
    saveAs: string;
    export: string;
    loginToExport: string;
    resetStyles: string;
    randomStylesPack: string;
    defaultLegendTitle: string;
    done: string;
    newLegendRangeName: string;
    region: {
      sectionTitle: string;
      placeholder: string;
      ariaLabel: string;
      changeConfirmTitle: string;
      changeConfirmBody: string;
      changeOk: string;
    };
    importData: {
      sectionTitle: string;
      downloadTooltipEmpty: string;
      downloadTooltip: string;
      downloadAria: string;
      manualTooltip: string;
      manualTooltipNoCountry: string;
      manualAria: string;
      switchToStatic: string;
      switchToDynamic: string;
      selectCountryFirst: string;
      switchAriaToStatic: string;
      switchAriaToDynamic: string;
      segmentedAria: string;
      regionIdsNote: string;
      downloadLink: string;
      downloadTooltipNoCountry: string;
      sampleNoteSuffix: string;
      expectedFormat: string;
      enterManually: string;
      connectSheets: string;
      chooseCsv: string;
      chooseExcel: string;
      chooseJson: string;
      format: {
        csv: string;
        excel: string;
        json: string;
        sheets: string;
        manual: string;
      };
    };
    importFormatTooltip: {
      id: string;
      label: string;
      value: string;
      labelsOnMap: string;
    };
    importFormatExamples: {
      excelColumnsStatic: string;
      excelColumnsTime: string;
      sheetsColumnsStatic: string;
      sheetsColumnsTime: string;
      manualStatic: string;
      manualHistorical: string;
    };
    switchMode: {
      body: string;
      hint: string;
    };
    googleSheets: {
      title: string;
      intro: string;
      placeholder: string;
      howToShare: string;
      stepOpen: string;
      stepShare: string;
      stepAnyone: string;
      stepPaste: string;
      syncButton: string;
      importOnceButton: string;
      fetching: string;
      fetchFailed: string;
    };
    embed: {
      title: string;
      modalTitle: string;
      openButton: string;
      intro: string;
      publicToggle: string;
      seoTitle: string;
      titleMax: string;
      titleRequired: string;
      titleInitialHint: string;
      seoDescription: string;
      descriptionMax: string;
      descriptionRequired: string;
      seoKeywords: string;
      keywordsHint: string;
      keywordPlaceholder: string;
      titlePlaceholder: string;
      descriptionPlaceholder: string;
      defaultMetaDescription: string;
      saveSuccess: string;
      saveFailed: string;
      shareUrl: string;
      shareLinkHint: string;
      openInNewTab: string;
      copyUrl: string;
      iframe: string;
      copyIframe: string;
      copied: string;
      copyFailed: string;
      planRequired: string;
      tagSelectNoData: string;
      /** Map block: embed is Chronographer-only; shown with upgrade link */
      tooltipChronographerBody: string;
      upgradePlansLink: string;
      tooltipNeedSavedProject: string;
      tooltipSelectCountry: string;
    };
    exportModal: {
      upgradeToExplorer: string;
      singleFormatHintAfterLink: string;
      qualityLimited: string;
      qualityFullHint: string;
    };
    manualEntry: {
      title: string;
      clearAll: string;
      addRow: string;
      addMissingRow: string;
      showOnChart: string;
      hideFromChart: string;
      duplicateRowsStatic: string;
      duplicateRowsTimeline: string;
      placeholderRegionId: string;
      placeholderLabel: string;
      colIndex: string;
      colId: string;
      colLabel: string;
      colValue: string;
      colTime: string;
    };
    legendConfig: {
      sectionTitle: string;
      sortAscending: string;
      sortDescending: string;
      expandEdit: string;
      expandEditAria: string;
      addRange: string;
      addRangeAria: string;
      collapseRanges: string;
      collapseTheme: string;
      paletteSuggestions: string;
      applyPalette: string;
      paletteGroups: {
        smooth: string;
        creative: string;
        highContrast: string;
      };
    };
    legendModal: {
      title: string;
      sortAscending: string;
      sortDescending: string;
      addRange: string;
    };
    legendColumns: {
      name: string;
      min: string;
      max: string;
      minLong: string;
      maxLong: string;
      color: string;
    };
    mapStyles: {
      sectionTitle: string;
      collapseBackground: string;
      collapseBorder: string;
      collapseShadow: string;
      collapseControls: string;
      collapseRegionLabels: string;
      freePlanNote: string;
      upgradePlanLink: string;
      transparent: string;
      color: string;
      showBorder: string;
      width: string;
      showShadow: string;
      blur: string;
      offsetX: string;
      offsetY: string;
      showControls: string;
      tooltipZoomIn: string;
      tooltipZoomOut: string;
      tooltipResetMapAndLabels: string;
      tooltipEnableLabelDragging: string;
      tooltipDisableLabelDragging: string;
      showLabels: string;
      fontSize: string;
    };
    legendStyles: {
      sectionTitle: string;
      collapseTitle: string;
      collapseLabels: string;
      collapsePosition: string;
      showTitle: string;
      titleField: string;
      titlePlaceholder: string;
      textColor: string;
      fontSize: string;
      noDataColor: string;
      positionFloating: string;
      positionBottom: string;
      positionHidden: string;
      floatingHint: string;
    };
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
    projectLoadFailed: string;
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
    loginFailed: string;
    signUpFailed: string;
  };
};
