import type { TutorModelProvider, TutorRequest } from "@/lib/ai/types";
import { SANSKRIT_TUTOR_SYSTEM_PROMPT } from "@/lib/prompts/sanskritTutor";

type DeepSeekConfig = {
  apiKey: string;
  model: string;
  baseUrl?: string;
};

type DeepSeekMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type DeepSeekStreamChunk = {
  choices?: Array<{
    delta?: {
      content?: string | null;
      reasoning_content?: string | null;
    };
  }>;
};

export class DeepSeekProvider implements TutorModelProvider {
  constructor(private readonly config: DeepSeekConfig) {}

  async *streamTutorResponse(input: TutorRequest): AsyncIterable<string> {
    if (input.imageBase64) {
      yield "DeepSeek ഉപയോഗിച്ച് ഫോട്ടോ നേരിട്ട് വായിക്കാൻ ഇപ്പോൾ കഴിയില്ല. പേജിലെ സംസ്കൃത വാചകം ടൈപ്പ് ചെയ്താൽ ഞാൻ മലയാളത്തിൽ വിശദീകരിക്കാം.";
      return;
    }

    const response = await fetch(`${this.config.baseUrl || "https://api.deepseek.com"}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model || "deepseek-chat",
        messages: buildDeepSeekMessages(input),
        stream: true,
        temperature: 0.35,
        max_tokens: 1400,
      }),
    });

    if (!response.ok || !response.body) {
      throw new Error(`DeepSeek request failed with status ${response.status}`);
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
        const parsed = JSON.parse(payload) as DeepSeekStreamChunk;
        const text = parsed.choices?.[0]?.delta?.content;
        if (text) yield text;
      }
    }
  }
}

function buildDeepSeekMessages(input: TutorRequest): DeepSeekMessage[] {
  const messages: DeepSeekMessage[] = [
    { role: "system", content: SANSKRIT_TUTOR_SYSTEM_PROMPT },
    ...input.history
      .filter((message): message is DeepSeekMessage => message.role !== "system")
      .map((message) => ({ role: message.role, content: message.content })),
  ];

  if (input.userText?.trim()) {
    messages.push({ role: "user", content: input.userText.trim() });
  }

  return messages;
}
