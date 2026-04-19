export type AiParsePayload = {
  text: string;
  mapRegionIds: string[];
};

export type AiGeneratePayload = {
  prompt: string;
  mapRegionIds: string[];
  countryName?: string;
};

type AiRemainingData = {
  remaining: number;
};

export type AiRemainingResponse = {
  success: boolean;
  data: AiRemainingData;
  error?: {
    code: string;
    message: string;
  };
};
