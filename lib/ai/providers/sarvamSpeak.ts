import {
  ProviderRateLimitError,
  ProviderUnavailableError,
  type SpeakProvider,
  type SpeakRequest,
  type SpeakResult,
} from "@/lib/ai/types";

type Config = {
  apiKey: string;
  model?: string;
  baseUrl?: string;
  speaker?: string;
};

type SarvamSpeakResponse = {
  audios?: string[];
};

export class SarvamSpeakProvider implements SpeakProvider {
  constructor(private readonly config: Config) {}

  async speak(input: SpeakRequest): Promise<SpeakResult> {
    if (!this.config.apiKey) {
      throw new ProviderUnavailableError("Sarvam API key is not configured.");
    }

    const response = await fetch(`${this.config.baseUrl || "https://api.sarvam.ai"}/text-to-speech`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-subscription-key": this.config.apiKey,
      },
      body: JSON.stringify({
        text: input.text.slice(0, 2400),
        target_language_code: input.languageHint || "ml-IN",
        model: this.config.model || "bulbul:v3",
        speaker: this.config.speaker || "kavitha",
        pace: 0.82,
        output_audio_codec: "mp3",
        speech_sample_rate: 24000,
      }),
    });

    if (response.status === 429) {
      throw new ProviderRateLimitError("Sarvam TTS rate limit reached.");
    }

    if (!response.ok) {
      throw new Error(`Sarvam TTS failed with status ${response.status}`);
    }

    const json = (await response.json()) as SarvamSpeakResponse;
    const audio = json.audios?.[0];
    if (!audio) {
      throw new Error("Sarvam TTS returned no audio.");
    }

    return {
      audio: Buffer.from(audio, "base64"),
      mimeType: "audio/mpeg",
    };
  }
}
