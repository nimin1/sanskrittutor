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

type SarvamTranscriptionResponse = {
  transcript?: string;
};

export class SarvamTranscriptionProvider implements TranscriptionProvider {
  constructor(private readonly config: Config) {}

  async transcribe(input: TranscriptionRequest): Promise<string> {
    if (!this.config.apiKey) {
      throw new ProviderUnavailableError("Sarvam API key is not configured.");
    }

    const form = new FormData();
    form.append("file", base64ToBlob(input.audioBase64, input.mimeType), `audio.${extFor(input.mimeType)}`);
    form.append("model", this.config.model || "saaras:v3");
    /* The speaker may use Malayalam OR Sanskrit. "unknown" lets Sarvam
       auto-detect rather than forcing Malayalam, which would otherwise
       corrupt Sanskrit speech by trying to render it in Malayalam script. */
    form.append("language_code", input.languageHint || "unknown");
    form.append("mode", "transcribe");

    const response = await fetch(`${this.config.baseUrl || "https://api.sarvam.ai"}/speech-to-text`, {
      method: "POST",
      headers: {
        "api-subscription-key": this.config.apiKey,
      },
      body: form,
    });

    if (response.status === 429) {
      throw new ProviderRateLimitError("Sarvam transcription rate limit reached.");
    }

    if (!response.ok) {
      throw new Error(`Sarvam transcription failed with status ${response.status}`);
    }

    const json = (await response.json()) as SarvamTranscriptionResponse;
    return (json.transcript || "").trim();
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
