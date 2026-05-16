/**
 * Multilingual Text-to-Speech engine for Malayalam + Sanskrit content.
 *
 * The AI response contains mixed scripts:
 *   - Malayalam script (U+0D00–U+0D7F) for explanations
 *   - Devanagari script (U+0900–U+097F) for Sanskrit shlokas/terms
 *
 * This module splits the text into segments by script, selects the correct
 * voice for each segment, and speaks them sequentially so the listener hears
 * natural pronunciation in both languages.
 */

// ── Script detection regex ──────────────────────────────────────────
const DEVANAGARI_RE = /[\u0900-\u097F]/;
const MALAYALAM_RE = /[\u0D00-\u0D7F]/;

type ScriptKind = "devanagari" | "malayalam" | "neutral";

function detectScript(char: string): ScriptKind {
  if (DEVANAGARI_RE.test(char)) return "devanagari";
  if (MALAYALAM_RE.test(char)) return "malayalam";
  return "neutral";
}

interface TextSegment {
  text: string;
  script: ScriptKind;
}

/**
 * Split text into contiguous segments of the same script.
 * Neutral chars (spaces, punctuation, numbers) are merged into the
 * preceding segment so we don't create tiny pauses between words.
 */
function splitByScript(text: string): TextSegment[] {
  const segments: TextSegment[] = [];
  let current = "";
  let currentScript: ScriptKind = "neutral";

  for (const char of text) {
    const s = detectScript(char);

    if (s === "neutral") {
      // Neutral chars stick with whatever segment is active
      current += char;
      continue;
    }

    if (s === currentScript) {
      current += char;
    } else {
      // Script changed — push the previous segment
      if (current.trim()) {
        segments.push({ text: current.trim(), script: currentScript === "neutral" ? s : currentScript });
      }
      current = char;
      currentScript = s;
    }
  }

  // Push the final segment
  if (current.trim()) {
    segments.push({ text: current.trim(), script: currentScript });
  }

  return segments;
}

/**
 * Clean text for TTS: strip emojis, markdown artifacts, and excess punctuation.
 */
function cleanForTTS(text: string): string {
  return text
    // Remove emojis
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, "")
    // Remove markdown bold/italic markers
    .replace(/\*{1,3}/g, "")
    // Replace ALL punctuation that the TTS might read out loud (including periods) with spaces
    .replace(/[.,?।॥\-—:;!]/g, " ")
    // STRICT: Keep ONLY letters, combining marks (vowels/viramas), numbers, and whitespace. No punctuation at all.
    .replace(/[^\p{L}\p{M}\p{N}\s]/gu, " ")
    // Collapse spaces
    .replace(/\s+/g, " ")
    .trim();
}

// ── Voice caching ───────────────────────────────────────────────────
let cachedVoices: SpeechSynthesisVoice[] = [];
let voicesLoaded = false;

function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  if (typeof window === "undefined" || !window.speechSynthesis) return Promise.resolve([]);

  // Voices may already be available
  const v = window.speechSynthesis.getVoices();
  if (v.length > 0) {
    cachedVoices = v;
    voicesLoaded = true;
    return Promise.resolve(v);
  }

  if (voicesLoaded) return Promise.resolve(cachedVoices);

  return new Promise((resolve) => {
    window.speechSynthesis.onvoiceschanged = () => {
      cachedVoices = window.speechSynthesis.getVoices();
      voicesLoaded = true;
      resolve(cachedVoices);
    };
    // Timeout fallback in case onvoiceschanged never fires
    setTimeout(() => {
      cachedVoices = window.speechSynthesis.getVoices();
      voicesLoaded = true;
      resolve(cachedVoices);
    }, 500);
  });
}

// ── Voice selection ─────────────────────────────────────────────────

function findMalayalamVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  return (
    voices.find((v) => v.name.toLowerCase().includes("lekha")) || // macOS Malayalam
    voices.find((v) => v.name.toLowerCase().includes("malayalam")) ||
    voices.find((v) => v.lang === "ml-IN") ||
    voices.find((v) => v.lang.startsWith("ml")) ||
    null
  );
}

function findSanskritVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  // Sanskrit voices are rare; Hindi voices read Devanagari perfectly.
  return (
    voices.find((v) => v.lang === "sa-IN") || // Sanskrit (unlikely but ideal)
    voices.find((v) => v.name.toLowerCase().includes("sanskrit")) ||
    voices.find((v) => v.name.toLowerCase().includes("lekha") === false && v.lang === "hi-IN") || // Hindi
    voices.find((v) => v.lang === "hi-IN") ||
    voices.find((v) => v.lang.startsWith("hi")) ||
    null
  );
}

// ── Public API ───────────────────────────────────────────────────────

export interface MultiSpeakOptions {
  /** Called when all segments finish speaking */
  onEnd?: () => void;
  /** Called on error */
  onError?: () => void;
  /** Speech rate (default 0.88) */
  rate?: number;
}

/**
 * Speak mixed Malayalam + Sanskrit text with correct voices for each script.
 * Returns a cancel function.
 */
export function multilingualSpeak(rawText: string, options: MultiSpeakOptions = {}): () => void {
  const { onEnd, onError, rate = 0.88 } = options;

  if (!rawText.trim() || typeof window === "undefined" || !window.speechSynthesis) {
    onEnd?.();
    return () => {};
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const cleaned = cleanForTTS(rawText);
  if (!cleaned) {
    onEnd?.();
    return () => {};
  }

  const segments = splitByScript(cleaned);
  if (segments.length === 0) {
    onEnd?.();
    return () => {};
  }

  let cancelled = false;

  async function speakSequentially() {
    const voices = await loadVoices();
    const mlVoice = findMalayalamVoice(voices);
    const saVoice = findSanskritVoice(voices);

    for (let i = 0; i < segments.length; i++) {
      if (cancelled) break;
      const seg = segments[i];

      await new Promise<void>((resolve, reject) => {
        if (cancelled) { resolve(); return; }

        const utterance = new SpeechSynthesisUtterance(seg.text);

        if (seg.script === "devanagari") {
          utterance.voice = saVoice;
          utterance.lang = saVoice?.lang || "hi-IN";
        } else {
          utterance.voice = mlVoice;
          utterance.lang = mlVoice?.lang || "ml-IN";
        }

        utterance.rate = rate;
        utterance.pitch = 1.0;

        utterance.onend = () => resolve();
        utterance.onerror = (e) => {
          // "interrupted" is expected when cancel() is called
          if (e?.error === "interrupted" || e?.error === "canceled") {
            resolve();
          } else {
            reject(e);
          }
        };

        window.speechSynthesis.speak(utterance);
      }).catch(() => {
        onError?.();
      });
    }

    if (!cancelled) {
      onEnd?.();
    }
  }

  speakSequentially();

  return () => {
    cancelled = true;
    window.speechSynthesis.cancel();
  };
}

/**
 * Stop any ongoing speech.
 */
export function stopSpeaking() {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}
