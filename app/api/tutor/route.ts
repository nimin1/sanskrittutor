import { getTutorProvider } from "@/lib/ai";
import type { TutorRequest } from "@/lib/ai/types";
import { ml } from "@/lib/i18n/ml";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as TutorRequest;
    const provider = getTutorProvider(Boolean(body.imageBase64));
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of provider.streamTutorResponse({
            userText: body.userText,
            imageBase64: body.imageBase64,
            history: Array.isArray(body.history) ? body.history : [],
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
