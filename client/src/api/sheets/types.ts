export type FetchSheetPayload = {
  url: string;
  sheetName?: string;
};

export type FetchSheetResponse = {
  success: boolean;
  data: {
    csv: string;
  };
  error?: {
    code: string;
    message: string;
  };
};
