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

export class OpenAIOcrProvider implements OcrProvider {
  constructor(private readonly config: Config) {}

  async extractText(input: OcrRequest): Promise<OcrResult> {
    if (!this.config.apiKey) {
      throw new ProviderUnavailableError("OpenAI API key is not configured.");
    }

    const response = await fetch(`${this.config.baseUrl || "https://api.openai.com/v1"}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model || "gpt-4o-mini",
        temperature: 0,
        max_tokens: 1200,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text:
                  "Extract only the visible Sanskrit/Devanagari text from this textbook page. Preserve line breaks. If unclear, return only what is clear. Do not explain.",
              },
              {
                type: "image_url",
                image_url: { url: input.imageBase64 },
              },
            ],
          },
        ],
      }),
    });

    if (response.status === 429) {
      throw new ProviderRateLimitError("OpenAI OCR rate limit reached.");
    }

    if (!response.ok) {
      throw new Error(`OpenAI OCR failed with status ${response.status}`);
    }

    const json = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    return {
      provider: "openai",
      text: (json.choices?.[0]?.message?.content || "").trim(),
    };
  }
}
