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
  voice?: string;
};

export class OpenAISpeakProvider implements SpeakProvider {
  constructor(private readonly config: Config) {}

  async speak(input: SpeakRequest): Promise<SpeakResult> {
    if (!this.config.apiKey) {
      throw new ProviderUnavailableError("OpenAI API key is not configured.");
    }

    const response = await fetch(`${this.config.baseUrl || "https://api.openai.com/v1"}/audio/speech`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model || "gpt-4o-mini-tts",
        voice: this.config.voice || "coral",
        input: input.text.slice(0, 2400),
        response_format: "mp3",
        instructions: "Speak slowly and clearly for an older Malayalam learner. Keep Sanskrit terms careful and unhurried.",
      }),
    });

    if (response.status === 429) {
      throw new ProviderRateLimitError("OpenAI TTS rate limit reached.");
    }

    if (!response.ok) {
      throw new Error(`OpenAI TTS failed with status ${response.status}`);
    }

    return {
      audio: Buffer.from(await response.arrayBuffer()),
      mimeType: "audio/mpeg",
    };
  }
}
