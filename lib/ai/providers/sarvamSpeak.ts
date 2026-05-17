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

// Sarvam TTS rejects very long inputs. Keep each request well under the limit
// so that long Malayalam answers (which often run several paragraphs) are
// fully spoken instead of being cut off at ~2400 chars.
const MAX_CHARS_PER_REQUEST = 1400;

export class SarvamSpeakProvider implements SpeakProvider {
  constructor(private readonly config: Config) {}

  async speak(input: SpeakRequest): Promise<SpeakResult> {
    if (!this.config.apiKey) {
      throw new ProviderUnavailableError("Sarvam API key is not configured.");
    }

    const chunks = splitForTTS(input.text, MAX_CHARS_PER_REQUEST);
    if (chunks.length === 0) {
      throw new Error("Sarvam TTS received empty text.");
    }

    const buffers: Buffer[] = [];
    for (const chunk of chunks) {
      const audios = await this.requestChunk(chunk, input.languageHint);
      for (const b64 of audios) {
        buffers.push(Buffer.from(b64, "base64"));
      }
    }

    if (buffers.length === 0) {
      throw new Error("Sarvam TTS returned no audio.");
    }

    return {
      audio: Buffer.concat(buffers),
      mimeType: "audio/mpeg",
    };
  }

  private async requestChunk(text: string, languageHint?: string): Promise<string[]> {
    const response = await fetch(`${this.config.baseUrl || "https://api.sarvam.ai"}/text-to-speech`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-subscription-key": this.config.apiKey,
      },
      body: JSON.stringify({
        text,
        target_language_code: languageHint || "ml-IN",
        model: this.config.model || "bulbul:v3",
        speaker: this.config.speaker || "kavitha",
        pace: 0.9,
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
    const audios = json.audios?.filter((a) => typeof a === "string" && a.length > 0) ?? [];
    if (audios.length === 0) {
      throw new Error("Sarvam TTS returned no audio.");
    }
    return audios;
  }
}

// Split text into chunks at sentence boundaries, falling back to whitespace
// when a single sentence exceeds the budget. Preserves the original characters
// so pronunciation stays natural.
function splitForTTS(rawText: string, maxChars: number): string[] {
  const text = rawText.trim();
  if (!text) return [];
  if (text.length <= maxChars) return [text];

  const sentenceRe = /[^.!?।॥\n]+[.!?।॥\n]?/g;
  const sentences = text.match(sentenceRe) ?? [text];

  const chunks: string[] = [];
  let current = "";

  for (const raw of sentences) {
    const sentence = raw.trim();
    if (!sentence) continue;

    if (sentence.length > maxChars) {
      if (current) {
        chunks.push(current);
        current = "";
      }
      for (const piece of splitByWhitespace(sentence, maxChars)) {
        chunks.push(piece);
      }
      continue;
    }

    if (current.length + sentence.length + 1 > maxChars) {
      chunks.push(current);
      current = sentence;
    } else {
      current = current ? `${current} ${sentence}` : sentence;
    }
  }

  if (current) chunks.push(current);
  return chunks;
}

function splitByWhitespace(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/);
  const chunks: string[] = [];
  let current = "";
  for (const word of words) {
    if (!word) continue;
    if (word.length > maxChars) {
      if (current) { chunks.push(current); current = ""; }
      for (let i = 0; i < word.length; i += maxChars) {
        chunks.push(word.slice(i, i + maxChars));
      }
      continue;
    }
    if (current.length + word.length + 1 > maxChars) {
      chunks.push(current);
      current = word;
    } else {
      current = current ? `${current} ${word}` : word;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}
