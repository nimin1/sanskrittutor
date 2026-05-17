import type { OcrProvider, SpeakProvider, TranscriptionProvider, TutorModelProvider } from "@/lib/ai/types";
import { DeepSeekProvider } from "@/lib/ai/providers/deepseek";
import { GeminiProvider } from "@/lib/ai/providers/gemini";
import { GeminiTranscriptionProvider } from "@/lib/ai/providers/geminiTranscribe";
import { GeminiOcrProvider } from "@/lib/ai/providers/geminiOcr";
import { OpenAICompatibleProvider } from "@/lib/ai/providers/openaiCompatible";
import { OpenAIOcrProvider } from "@/lib/ai/providers/openaiOcr";
import { OpenAISpeakProvider } from "@/lib/ai/providers/openaiSpeak";
import { OpenAITranscriptionProvider } from "@/lib/ai/providers/openaiTranscribe";
import { FallbackOcrProvider, FallbackSpeakProvider, FallbackTranscriptionProvider } from "@/lib/ai/providerRouter";
import { SarvamOcrProvider } from "@/lib/ai/providers/sarvamOcr";
import { SarvamSpeakProvider } from "@/lib/ai/providers/sarvamSpeak";
import { SarvamTranscriptionProvider } from "@/lib/ai/providers/sarvamTranscribe";

export function getTutorProvider(hasImage: boolean = false): TutorModelProvider {
  // Direct image tutoring is retained only as a legacy fallback. The primary
  // photo flow now performs OCR first, then sends extracted text to DeepSeek.
  if (hasImage) {
    return new GeminiProvider({
      apiKey: process.env.GEMINI_API_KEY || process.env.AI_API_KEY || "",
      model: "gemini-2.5-flash",
      baseUrl: process.env.AI_BASE_URL,
    });
  }

  const deepSeekKey = process.env.DEEPSEEK_API_KEY || process.env.AI_API_KEY || "";
  if (deepSeekKey) {
    return new DeepSeekProvider({
      apiKey: deepSeekKey,
      model: process.env.DEEPSEEK_MODEL || "deepseek-chat",
      baseUrl: process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com",
    });
  }

  return new OpenAICompatibleProvider({
    apiKey: process.env.OPENAI_API_KEY || "",
    model: process.env.OPENAI_TUTOR_MODEL || "gpt-4o-mini",
    baseUrl: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
  });
}

export function getDeepSeekTutorProvider(): TutorModelProvider {
  return new DeepSeekProvider({
    apiKey: process.env.DEEPSEEK_API_KEY || process.env.AI_API_KEY || "",
    model: process.env.DEEPSEEK_MODEL || "deepseek-chat",
    baseUrl: process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com",
  });
}

export function getTranscriptionProvider(): TranscriptionProvider {
  return new FallbackTranscriptionProvider([
    {
      name: "sarvam",
      provider: new SarvamTranscriptionProvider({
        apiKey: process.env.SARVAM_API_KEY || "",
        model: process.env.SARVAM_STT_MODEL || "saaras:v3",
        baseUrl: process.env.SARVAM_BASE_URL,
      }),
    },
    {
      name: "gemini",
      provider: new GeminiTranscriptionProvider({
        apiKey: process.env.GEMINI_API_KEY || process.env.AI_API_KEY || "",
        model: process.env.TRANSCRIBE_MODEL || "gemini-2.5-flash",
        baseUrl: process.env.AI_BASE_URL,
      }),
    },
    {
      name: "openai",
      provider: new OpenAITranscriptionProvider({
        apiKey: process.env.OPENAI_API_KEY || "",
        model: process.env.OPENAI_TRANSCRIBE_MODEL || "gpt-4o-mini-transcribe",
        baseUrl: process.env.OPENAI_BASE_URL,
      }),
    },
  ]);
}

export function getOcrProvider(): OcrProvider {
  return new FallbackOcrProvider([
    {
      name: "sarvam",
      provider: new SarvamOcrProvider({
        apiKey: process.env.SARVAM_API_KEY || "",
        baseUrl: process.env.SARVAM_BASE_URL,
      }),
    },
    {
      name: "gemini",
      provider: new GeminiOcrProvider({
        apiKey: process.env.GEMINI_API_KEY || process.env.AI_API_KEY || "",
        model: process.env.GEMINI_OCR_MODEL || "gemini-2.5-flash-lite",
        baseUrl: process.env.AI_BASE_URL,
      }),
    },
    {
      name: "openai",
      provider: new OpenAIOcrProvider({
        apiKey: process.env.OPENAI_API_KEY || "",
        model: process.env.OPENAI_VISION_MODEL || "gpt-4o-mini",
        baseUrl: process.env.OPENAI_BASE_URL,
      }),
    },
  ]);
}

export function getSpeakProvider(): SpeakProvider {
  return new FallbackSpeakProvider([
    {
      name: "sarvam",
      provider: new SarvamSpeakProvider({
        apiKey: process.env.SARVAM_API_KEY || "",
        model: process.env.SARVAM_TTS_MODEL || "bulbul:v3",
        speaker: process.env.SARVAM_TTS_SPEAKER || "ishita",
        baseUrl: process.env.SARVAM_BASE_URL,
      }),
    },
    {
      name: "openai",
      provider: new OpenAISpeakProvider({
        apiKey: process.env.OPENAI_API_KEY || "",
        model: process.env.OPENAI_TTS_MODEL || "gpt-4o-mini-tts",
        voice: process.env.OPENAI_TTS_VOICE || "coral",
        baseUrl: process.env.OPENAI_BASE_URL,
      }),
    },
  ]);
}
