import type { TutorModelProvider } from "@/lib/ai/types";
import { DeepSeekProvider } from "@/lib/ai/providers/deepseek";
import { GeminiProvider } from "@/lib/ai/providers/gemini";
import { OpenAICompatibleProvider } from "@/lib/ai/providers/openaiCompatible";

export function getTutorProvider(hasImage: boolean = false): TutorModelProvider {
  // --- INTELLIGENT ROUTER ---
  // DeepSeek does not support reading images. If the user snaps a photo, we MUST force Gemini.
  if (hasImage) {
    return new GeminiProvider({
      apiKey: process.env.GEMINI_API_KEY || process.env.AI_API_KEY || "",
      model: "gemini-2.5-flash",
      baseUrl: process.env.AI_BASE_URL,
    });
  }

  // For normal text chat, use DeepSeek as requested
  return new DeepSeekProvider({
    apiKey: process.env.DEEPSEEK_API_KEY || process.env.AI_API_KEY || "",
    model: "deepseek-chat",
    baseUrl: process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com",
  });
}
