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
 * The model is asked to return ONLY the verbatim transcript in
 * Malayalam script (with Devanagari pass-through for Sanskrit terms).
 */
export class GeminiTranscriptionProvider implements TranscriptionProvider {
  constructor(private readonly config: Config) {}

  async transcribe(input: TranscriptionRequest): Promise<string> {
    const url = `${this.config.baseUrl || "https://generativelanguage.googleapis.com/v1beta"}/models/${this.config.model}:generateContent?key=${this.config.apiKey}`;

    const instruction =
      "Transcribe this audio verbatim. The speaker is speaking Malayalam (മലയാളം). " +
      "If they use Sanskrit terms, keep them in Devanagari (देवनागरी). " +
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
