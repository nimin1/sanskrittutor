import { getSpeakProvider } from "@/lib/ai";
import { cacheKey, getCached, setCached } from "@/lib/cache/serverCache";
import { ml } from "@/lib/i18n/ml";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { text?: string };
    const text = body.text?.trim() || "";

    if (!text) {
      return json({ error: ml.errors.ttsUnavailable }, 400);
    }

    const key = cacheKey("tts", text);
    const cached = getCached<{ audioBase64: string; mimeType: string }>(key);
    if (cached) {
      return json(cached);
    }

    const result = await getSpeakProvider().speak({
      text,
      languageHint: "ml-IN",
    });

    const payload = {
      audioBase64: result.audio.toString("base64"),
      mimeType: result.mimeType,
    };
    setCached(key, payload, 7 * 24 * 60 * 60 * 1000);

    return json(payload);
  } catch {
    return json({ error: ml.errors.ttsUnavailable }, 503);
  }
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}
