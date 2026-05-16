import type { OcrProvider, OcrRequest, OcrResult, SpeakProvider, SpeakRequest, SpeakResult, TranscriptionProvider, TranscriptionRequest } from "@/lib/ai/types";
import { isProviderRateLimitError, ProviderUnavailableError } from "@/lib/ai/types";

type ProviderAttempt<T> = {
  name: string;
  run: () => Promise<T>;
};

const cooldownUntil = new Map<string, number>();
const DEFAULT_COOLDOWN_MS = 10 * 60 * 1000;

export class FallbackTranscriptionProvider implements TranscriptionProvider {
  constructor(private readonly providers: Array<{ name: string; provider: TranscriptionProvider }>) {}

  transcribe(input: TranscriptionRequest): Promise<string> {
    return runWithFallback(
      this.providers.map(({ name, provider }) => ({
        name: `stt:${name}`,
        run: () => provider.transcribe(input),
      })),
    );
  }
}

export class FallbackSpeakProvider implements SpeakProvider {
  constructor(private readonly providers: Array<{ name: string; provider: SpeakProvider }>) {}

  speak(input: SpeakRequest): Promise<SpeakResult> {
    return runWithFallback(
      this.providers.map(({ name, provider }) => ({
        name: `tts:${name}`,
        run: () => provider.speak(input),
      })),
    );
  }
}

export class FallbackOcrProvider implements OcrProvider {
  constructor(private readonly providers: Array<{ name: string; provider: OcrProvider }>) {}

  async extractText(input: OcrRequest): Promise<OcrResult> {
    const result = await runWithFallback(
      this.providers.map(({ name, provider }) => ({
        name: `ocr:${name}`,
        run: () => provider.extractText(input),
      })),
    );
    if (!result.text.trim()) {
      throw new Error("OCR providers returned empty text.");
    }
    return result;
  }
}

async function runWithFallback<T>(attempts: Array<ProviderAttempt<T>>): Promise<T> {
  const errors: string[] = [];

  for (const attempt of attempts) {
    if (isCoolingDown(attempt.name)) continue;

    try {
      return await attempt.run();
    } catch (err) {
      errors.push(`${attempt.name}: ${err instanceof Error ? err.message : String(err)}`);
      if (isProviderRateLimitError(err)) {
        cooldownUntil.set(attempt.name, Date.now() + DEFAULT_COOLDOWN_MS);
      }
      if (err instanceof ProviderUnavailableError) {
        cooldownUntil.set(attempt.name, Date.now() + 60 * 1000);
      }
    }
  }

  throw new Error(errors.join(" | ") || "No provider available.");
}

function isCoolingDown(name: string) {
  const until = cooldownUntil.get(name) || 0;
  if (until <= Date.now()) {
    cooldownUntil.delete(name);
    return false;
  }
  return true;
}
