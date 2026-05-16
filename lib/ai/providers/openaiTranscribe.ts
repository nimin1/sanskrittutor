import {
  ProviderRateLimitError,
  ProviderUnavailableError,
  type TranscriptionProvider,
  type TranscriptionRequest,
} from "@/lib/ai/types";

type Config = {
  apiKey: string;
  model?: string;
  baseUrl?: string;
};

type OpenAITranscriptionResponse = {
  text?: string;
};

export class OpenAITranscriptionProvider implements TranscriptionProvider {
  constructor(private readonly config: Config) {}

  async transcribe(input: TranscriptionRequest): Promise<string> {
    if (!this.config.apiKey) {
      throw new ProviderUnavailableError("OpenAI API key is not configured.");
    }

    const form = new FormData();
    form.append("file", base64ToBlob(input.audioBase64, input.mimeType), `audio.${extFor(input.mimeType)}`);
    form.append("model", this.config.model || "gpt-4o-mini-transcribe");
    form.append("language", input.languageHint || "ml");
    form.append(
      "prompt",
      "The speaker is asking Sanskrit study questions in Malayalam. Return Malayalam script, and keep Sanskrit terms in Devanagari when clear.",
    );

    const response = await fetch(`${this.config.baseUrl || "https://api.openai.com/v1"}/audio/transcriptions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: form,
    });

    if (response.status === 429) {
      throw new ProviderRateLimitError("OpenAI transcription rate limit reached.");
    }

    if (!response.ok) {
      throw new Error(`OpenAI transcription failed with status ${response.status}`);
    }

    const json = (await response.json()) as OpenAITranscriptionResponse;
    return (json.text || "").trim();
  }
}

function base64ToBlob(base64: string, mimeType: string) {
  const bytes = Buffer.from(base64, "base64");
  return new Blob([bytes], { type: mimeType });
}

function extFor(mime: string) {
  if (mime.includes("mp4")) return "m4a";
  if (mime.includes("ogg")) return "ogg";
  if (mime.includes("wav")) return "wav";
  return "webm";
}
