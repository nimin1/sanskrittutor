import type { TutorModelProvider, TutorRequest } from "@/lib/ai/types";
import { SANSKRIT_TUTOR_SYSTEM_PROMPT } from "@/lib/prompts/sanskritTutor";

type GeminiConfig = {
  apiKey: string;
  model: string;
  baseUrl?: string;
};

type GeminiPart = { text: string } | { inlineData: { mimeType: string; data: string } };
type GeminiContent = { role: "user" | "model"; parts: GeminiPart[] };

export class GeminiProvider implements TutorModelProvider {
  constructor(private readonly config: GeminiConfig) {}

  async *streamTutorResponse(input: TutorRequest): AsyncIterable<string> {
    let currentModel = this.config.model;
    let url = `${this.config.baseUrl || "https://generativelanguage.googleapis.com/v1beta"}/models/${currentModel}:streamGenerateContent?alt=sse&key=${this.config.apiKey}`;
    
    const contents: GeminiContent[] = input.history
      .filter((message) => message.role !== "system")
      .map((message) => ({
        role: message.role === "assistant" ? "model" : "user",
        parts: [{ text: message.content }],
      }));

    const latestParts: GeminiPart[] = [];
    if (input.userText?.trim()) {
      latestParts.push({ text: input.userText.trim() });
    } else if (input.imageBase64) {
      latestParts.push({ text: "ഈ പേജ് വായിച്ച് മലയാളത്തിൽ ലളിതമായി വിശദീകരിക്കൂ." });
    }

    if (input.imageBase64) {
      latestParts.push({
        inlineData: {
          mimeType: imageMimeType(input.imageBase64),
          data: stripDataUrl(input.imageBase64),
        },
      });
    }

    if (latestParts.length > 0) {
      contents.push({ role: "user", parts: latestParts });
    }

    const requestPayload = {
      systemInstruction: { parts: [{ text: SANSKRIT_TUTOR_SYSTEM_PROMPT }] },
      contents,
      generationConfig: {
        temperature: 0.25,
        maxOutputTokens: 1400,
      },
    };

    let response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestPayload),
    });

    // --- Automatic Fallback Mechanism ---
    // If we hit the rate limit (429) on a Pro model (free tier exhausted), fallback to Flash
    if (response.status === 429 && currentModel.includes("pro")) {
      console.warn(`[AI Tutor] ${currentModel} free quota exhausted (429). Seamlessly falling back to gemini-2.5-flash.`);
      currentModel = "gemini-2.5-flash";
      url = `${this.config.baseUrl || "https://generativelanguage.googleapis.com/v1beta"}/models/${currentModel}:streamGenerateContent?alt=sse&key=${this.config.apiKey}`;
      
      response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestPayload),
      });
    }

    if (!response.ok || !response.body) {
      throw new Error(`Gemini request failed with status ${response.status}`);
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
        const parsed = JSON.parse(payload) as {
          candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
        };
        const text = parsed.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("");
        if (text) yield text;
      }
    }
  }
}

function stripDataUrl(value: string): string {
  return value.includes(",") ? value.split(",")[1] : value;
}

function imageMimeType(value: string): string {
  const match = value.match(/^data:(.*?);base64,/);
  return match?.[1] || "image/jpeg";
}
