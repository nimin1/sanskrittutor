import { ProviderRateLimitError, type TranscriptionProvider, type TranscriptionRequest } from "@/lib/ai/types";

type Config = {
  apiKey: string;
  model: string;
  baseUrl?: string;
};

/**
 * Gemini transcription via generateContent with inline audio.
 * Works on any browser that can record audio — including iOS PWA —
 * because the device only needs getUserMedia + MediaRecorder, not
 * Web Speech API.
 *
 * The model is asked to detect whether the speaker is using Malayalam or
 * Sanskrit and return the verbatim transcript in the matching script:
 *  - Malayalam speech → Malayalam script (മലയാളം)
 *  - Sanskrit speech  → Devanagari script (देवनागरी)
 * A code-mixed sentence keeps each language in its own script.
 */
export class GeminiTranscriptionProvider implements TranscriptionProvider {
  constructor(private readonly config: Config) {}

  async transcribe(input: TranscriptionRequest): Promise<string> {
    const url = `${this.config.baseUrl || "https://generativelanguage.googleapis.com/v1beta"}/models/${this.config.model}:generateContent?key=${this.config.apiKey}`;

    const instruction =
      "Transcribe this audio verbatim. The speaker is either speaking Malayalam (മലയാളം) or Sanskrit (संस्कृतम्). " +
      "Detect which language they are using and write the transcript in the matching script: " +
      "Malayalam speech → Malayalam script; Sanskrit speech → Devanagari (देवनागरी) script. " +
      "If the speaker mixes both languages in one sentence, keep each portion in its own script. " +
      "NEVER write Sanskrit in Malayalam script and NEVER write Malayalam in Devanagari. " +
      "NEVER use Roman/English transliteration. " +
      "Return ONLY the transcript — no quotation marks, no preamble, no translation, no commentary. " +
      "If the audio contains no clear speech, return an empty string.";

    const body = {
      contents: [
        {
          role: "user",
          parts: [
            { text: instruction },
            {
              inlineData: {
                mimeType: input.mimeType,
                data: input.audioBase64,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0,
        maxOutputTokens: 1024,
      },
    };

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.status === 429) {
      throw new ProviderRateLimitError("Gemini transcription rate limit reached.");
    }

    if (!res.ok) {
      const errText = await safeReadText(res);
      throw new Error(`Gemini transcription failed (${res.status}): ${errText.slice(0, 200)}`);
    }

    const json = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text = json.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") || "";
    return text.trim();
  }
}

async function safeReadText(res: Response): Promise<string> {
  try { return await res.text(); } catch { return ""; }
}
