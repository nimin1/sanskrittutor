import { getOcrProvider, getTutorProvider } from "@/lib/ai";
import type { TutorRequest } from "@/lib/ai/types";
import { cacheKey, getCached, setCached } from "@/lib/cache/serverCache";
import { ml } from "@/lib/i18n/ml";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as TutorRequest;
    const prepared = await prepareTutorRequest(body);
    const provider = getTutorProvider(false);
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of provider.streamTutorResponse({
            userText: prepared.userText,
            history: prepared.history,
          })) {
            controller.enqueue(encoder.encode(chunk));
          }
          controller.close();
        } catch {
          controller.enqueue(encoder.encode(ml.errors.aiFailed));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return new Response(ml.errors.aiFailed, { status: 500 });
  }
}

async function prepareTutorRequest(body: TutorRequest): Promise<TutorRequest> {
  const history = Array.isArray(body.history) ? body.history : [];
  const userText = body.userText?.trim() || "";

  if (!body.imageBase64 || !shouldExtractImageText(userText, history.length)) {
    return {
      userText,
      history,
    };
  }

  try {
    const key = cacheKey("ocr", body.imageBase64);
    /* No languageHint: the page might be Sanskrit, Malayalam, or a mix.
       Let the OCR providers auto-detect and return each script as-is. */
    const ocr = getCached<{ text: string; provider: string }>(key) ||
      await getOcrProvider().extractText({
        imageBase64: body.imageBase64,
      });
    setCached(key, ocr, 7 * 24 * 60 * 60 * 1000);

    if (!hasEnoughIndicText(ocr.text)) {
      return {
        userText: `「അറിയില്ല」 ${ml.errors.photoTooUnclear}`,
        history,
      };
    }

    /* The system prompt already owns the direction logic (Malayalam → Sanskrit
       or Sanskrit → Malayalam) based on the script of the input. We just hand
       the OCR text over as the learner's "message" with a short note that it
       came from a photo, and the don't-invent reminder for unclear portions. */
    return {
      history,
      userText:
        `(ഈ വാചകം പുസ്തക പേജിന്റെ ഫോട്ടോയിൽ നിന്ന് വായിച്ചതാണ്. OCR ഉറവിടം: ${ocr.provider}. ` +
        `വാചകത്തിൽ ഇല്ലാത്തത് കൂട്ടിച്ചേർക്കരുത്; വ്യക്തമല്ലാത്ത ഭാഗങ്ങൾ 「അറിയില്ല」 എന്ന് പറയൂ.)\n\n` +
        ocr.text,
    };
  } catch {
    if (userText && !isGenericPageReadRequest(userText)) {
      return { userText, history };
    }
    return { userText: ml.snap.photoLimitReached, history };
  }
}

/**
 * Accept the OCR text if it has enough Devanagari OR Malayalam characters to
 * plausibly be real page content. A blurry-photo OCR misfire returns near-zero
 * Indic characters; this stops the tutor from confidently explaining garbage.
 */
function hasEnoughIndicText(text: string): boolean {
  if (!text) return false;
  const indic = text.match(/[ऀ-ॿഀ-ൿ]/g);
  return (indic?.length ?? 0) >= 15;
}

function shouldExtractImageText(userText: string, historyLength: number) {
  return historyLength === 0 || isGenericPageReadRequest(userText);
}

function isGenericPageReadRequest(text: string) {
  return !text || text === "ഈ പേജ് വായിച്ച് മലയാളത്തിൽ ലളിതമായി വിശദീകരിക്കൂ.";
}
