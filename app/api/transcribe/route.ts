import { getTranscriptionProvider } from "@/lib/ai";
import { isProviderRateLimitError } from "@/lib/ai/types";
import { cacheKey, getCached, setCached } from "@/lib/cache/serverCache";
import { ml } from "@/lib/i18n/ml";

export const runtime = "nodejs";
/* Audio uploads are small (typically < 1 MB) but we want generous headroom. */
export const maxDuration = 30;

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB hard cap

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return json({ error: ml.errors.aiFailed }, 400);
    }

    const form = await request.formData();
    const file = form.get("audio");

    if (!(file instanceof Blob)) {
      return json({ error: ml.errors.aiFailed }, 400);
    }
    if (file.size === 0) {
      return json({ text: "" });
    }
    if (file.size > MAX_BYTES) {
      return json({ error: ml.errors.aiFailed }, 413);
    }

    const mimeType = file.type || "audio/webm";
    const buffer = Buffer.from(await file.arrayBuffer());
    const key = cacheKey("stt", buffer);
    const cached = getCached<string>(key);
    if (cached) {
      return json({ text: cached });
    }

    const audioBase64 = buffer.toString("base64");

    const provider = getTranscriptionProvider();
    /* No languageHint: the learner may speak Malayalam OR Sanskrit and we
       want providers to auto-detect, so the transcript comes back in the
       matching script (Malayalam → Malayalam script, Sanskrit → Devanagari). */
    const text = await provider.transcribe({
      audioBase64,
      mimeType,
    });
    if (text.trim()) {
      setCached(key, text.trim(), 24 * 60 * 60 * 1000);
    }

    return json({ text: text.trim() });
  } catch (err) {
    if (isProviderRateLimitError(err)) {
      return json({ error: ml.home.transcribeLimitReached }, 429);
    }

    const message = err instanceof Error ? err.message : String(err);
    /* Never expose stack/key material — just log server-side & return canonical message. */
    console.error("[/api/transcribe]", message);
    return json({ error: ml.errors.aiFailed }, 500);
  }
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}
