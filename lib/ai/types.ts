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
