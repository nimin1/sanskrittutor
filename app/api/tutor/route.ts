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
    const ocr = getCached<{ text: string; provider: string }>(key) ||
      await getOcrProvider().extractText({
        imageBase64: body.imageBase64,
        languageHint: "sa-IN",
      });
    setCached(key, ocr, 7 * 24 * 60 * 60 * 1000);

    if (!hasSufficientDevanagari(ocr.text)) {
      return {
        userText: `「അറിയില്ല」 ${ml.errors.photoTooUnclear}`,
        history,
      };
    }

    return {
      history,
      userText:
        `ഈ പേജിൽ നിന്ന് വായിച്ച സംസ്കൃത വാചകം താഴെ കൊടുക്കുന്നു. ` +
        `ഇത് മലയാളത്തിൽ ലളിതമായി പഠിപ്പിക്കൂ. OCR ഉറവിടം: ${ocr.provider}. ` +
        `പ്രധാനം: ഈ വാചകത്തിൽ ഇല്ലാത്ത ഒന്നും കൂട്ടിച്ചേർക്കരുത്. ` +
        `വ്യക്തമല്ലാത്ത ഭാഗങ്ങൾ അനുമാനിക്കരുത് — 「അറിയില്ല」 എന്ന് പറയൂ.\n\n${ocr.text}`,
    };
  } catch {
    if (userText && !isGenericPageReadRequest(userText)) {
      return { userText, history };
    }
    return { userText: ml.snap.photoLimitReached, history };
  }
}

/**
 * Reject OCR output that has too little Devanagari to be a real Sanskrit page.
 * This stops the tutor from confidently explaining garbage extracted from a
 * blurry photo. Threshold of 15 is intentionally low — most real shlokas have
 * many more Devanagari characters; a typical OCR misfire returns near-zero.
 */
function hasSufficientDevanagari(text: string): boolean {
  if (!text) return false;
  const devanagari = text.match(/[ऀ-ॿ]/g);
  return (devanagari?.length ?? 0) >= 15;
}

function shouldExtractImageText(userText: string, historyLength: number) {
  return historyLength === 0 || isGenericPageReadRequest(userText);
}

function isGenericPageReadRequest(text: string) {
  return !text || text === "ഈ പേജ് വായിച്ച് മലയാളത്തിൽ ലളിതമായി വിശദീകരിക്കൂ.";
}
