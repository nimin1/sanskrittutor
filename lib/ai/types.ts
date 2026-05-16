export type TutorMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type TutorRequest = {
  userText?: string;
  imageBase64?: string;
  history: TutorMessage[];
};

export interface TutorModelProvider {
  streamTutorResponse(input: TutorRequest): AsyncIterable<string>;
}

export type TranscriptionRequest = {
  audioBase64: string;
  mimeType: string;
  languageHint?: string;
};

export interface TranscriptionProvider {
  transcribe(input: TranscriptionRequest): Promise<string>;
}

export type SpeakRequest = {
  text: string;
  languageHint?: string;
};

export type SpeakResult = {
  audio: Buffer;
  mimeType: string;
};

export interface SpeakProvider {
  speak(input: SpeakRequest): Promise<SpeakResult>;
}

export type OcrRequest = {
  imageBase64: string;
  languageHint?: string;
};

export type OcrResult = {
  text: string;
  provider: string;
  confidence?: number;
};

export interface OcrProvider {
  extractText(input: OcrRequest): Promise<OcrResult>;
}

export class ProviderUnavailableError extends Error {
  constructor(message = "Provider is not configured.") {
    super(message);
    this.name = "ProviderUnavailableError";
  }
}

export class ProviderRateLimitError extends Error {
  constructor(message = "Provider rate limit reached.") {
    super(message);
    this.name = "ProviderRateLimitError";
  }
}

export function isProviderRateLimitError(error: unknown): error is ProviderRateLimitError {
  return error instanceof ProviderRateLimitError;
}
