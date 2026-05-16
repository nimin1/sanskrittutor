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
