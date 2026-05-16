import type { TutorModelProvider, TutorRequest } from "@/lib/ai/types";
import { SANSKRIT_TUTOR_SYSTEM_PROMPT } from "@/lib/prompts/sanskritTutor";

type OpenAICompatibleConfig = {
  apiKey: string;
  model: string;
  baseUrl?: string;
};

type StreamChunk = {
  choices?: Array<{
    delta?: {
      content?: string;
    };
  }>;
};

export class OpenAICompatibleProvider implements TutorModelProvider {
  constructor(private readonly config: OpenAICompatibleConfig) {}

  async *streamTutorResponse(input: TutorRequest): AsyncIterable<string> {
    const url = `${this.config.baseUrl || "https://api.openai.com/v1"}/chat/completions`;
    const messages = [
      { role: "system", content: SANSKRIT_TUTOR_SYSTEM_PROMPT },
      ...input.history.filter((message) => message.role !== "system"),
      buildLatestUserMessage(input),
    ].filter(Boolean);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model,
        messages,
        stream: true,
        temperature: 0.35,
      }),
    });

    if (!response.ok || !response.body) {
      throw new Error(`OpenAI-compatible request failed with status ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        const parsed = JSON.parse(payload) as StreamChunk;
        const text = parsed.choices?.[0]?.delta?.content;
        if (text) yield text;
      }
    }
  }
}

function buildLatestUserMessage(input: TutorRequest) {
  if (!input.userText && !input.imageBase64) return null;

  if (!input.imageBase64) {
    return { role: "user", content: input.userText || "" };
  }

  return {
    role: "user",
    content: [
      {
        type: "text",
        text: input.userText || "ഈ പേജ് വായിച്ച് മലയാളത്തിൽ ലളിതമായി വിശദീകരിക്കൂ.",
      },
      {
        type: "image_url",
        image_url: { url: input.imageBase64 },
      },
    ],
  };
}
