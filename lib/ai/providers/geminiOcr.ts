import {
  ProviderRateLimitError,
  ProviderUnavailableError,
  type OcrProvider,
  type OcrRequest,
  type OcrResult,
} from "@/lib/ai/types";

type Config = {
  apiKey: string;
  model?: string;
  baseUrl?: string;
};

export class GeminiOcrProvider implements OcrProvider {
  constructor(private readonly config: Config) {}

  async extractText(input: OcrRequest): Promise<OcrResult> {
    if (!this.config.apiKey) {
      throw new ProviderUnavailableError("Gemini API key is not configured.");
    }

    const response = await fetch(
      `${this.config.baseUrl || "https://generativelanguage.googleapis.com/v1beta"}/models/${this.config.model || "gemini-2.5-flash-lite"}:generateContent?key=${this.config.apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text:
                    "Extract all the visible Indian-language text from this page. " +
                    "Write Sanskrit content in Devanagari script (देवनागरी) and Malayalam content in Malayalam script (മലയാളം), exactly as written. " +
                    "If the page mixes both languages, keep each portion in its own script. " +
                    "Preserve line breaks. Do not transliterate to Roman/English letters. " +
                    "If part of the page is unclear, return only what is clear. Do not translate, do not explain.",
                },
                {
                  inlineData: {
                    mimeType: imageMimeType(input.imageBase64),
                    data: stripDataUrl(input.imageBase64),
                  },
                },
              ],
            },
          ],
          generationConfig: { temperature: 0, maxOutputTokens: 1200 },
        }),
      },
    );

    if (response.status === 429) {
      throw new ProviderRateLimitError("Gemini OCR rate limit reached.");
    }

    if (!response.ok) {
      throw new Error(`Gemini OCR failed with status ${response.status}`);
    }

    const json = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text = json.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("") || "";

    return {
      provider: "gemini",
      text: text.trim(),
    };
  }
}

function stripDataUrl(value: string): string {
  return value.includes(",") ? value.split(",")[1] : value;
}

function imageMimeType(value: string): string {
  const match = value.match(/^data:(.*?);base64,/);
  return match?.[1] || "image/jpeg";
}
