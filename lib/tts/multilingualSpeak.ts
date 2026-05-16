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
const HARD_PAUSE_RE = /[.!?।॥]/;
const SOFT_PAUSE_RE = /[,;:]/;
const SHORT_SCRIPT_PAUSE_MS = 160;
const SOFT_PAUSE_MS = 320;
const HARD_PAUSE_MS = 620;

type ScriptKind = "devanagari" | "malayalam" | "neutral";

function detectScript(char: string): ScriptKind {
  if (DEVANAGARI_RE.test(char)) return "devanagari";
  if (MALAYALAM_RE.test(char)) return "malayalam";
  return "neutral";
}

interface SpeechSegment {
  kind: "speech";
  text: string;
  script: ScriptKind;
}

interface PauseSegment {
  kind: "pause";
  duration: number;
}

type TextSegment = SpeechSegment | PauseSegment;

/**
 * Split text into speakable phrases. We preserve punctuation as pauses
 * instead of sending it to the voice engine, because several browser voices
 * read punctuation aloud in Malayalam/Sanskrit.
 */
function splitByScript(text: string): TextSegment[] {
  const segments: TextSegment[] = [];
  let current = "";
  let currentScript: ScriptKind = "neutral";

  function pushSpeech(nextScript: ScriptKind = "malayalam") {
    const speakable = cleanSegmentText(current);
    if (speakable) {
      segments.push({
        kind: "speech",
        text: speakable,
        script: currentScript === "neutral" ? nextScript : currentScript,
      });
    }
    current = "";
  }

  function pushPause(duration: number) {
    const previous = segments[segments.length - 1];
    if (previous?.kind === "pause") {
      previous.duration = Math.max(previous.duration, duration);
      return;
    }
    if (segments.length > 0) {
      segments.push({ kind: "pause", duration });
    }
  }

  for (const char of text) {
    const s = detectScript(char);

    if (char === "\n") {
      pushSpeech();
      pushPause(HARD_PAUSE_MS);
      currentScript = "neutral";
      continue;
    }

    if (HARD_PAUSE_RE.test(char)) {
      pushSpeech();
      pushPause(HARD_PAUSE_MS);
      currentScript = "neutral";
      continue;
    }

    if (SOFT_PAUSE_RE.test(char)) {
      pushSpeech();
      pushPause(SOFT_PAUSE_MS);
      currentScript = "neutral";
      continue;
    }

    if (s === "neutral") {
      // Neutral chars stick with whatever segment is active
      current += char;
      continue;
    }

    if (s === currentScript) {
      current += char;
    } else {
      pushSpeech(s);
      pushPause(SHORT_SCRIPT_PAUSE_MS);
      current = char;
      currentScript = s;
    }
  }

  pushSpeech();

  return segments;
}

/**
 * Clean the full text while keeping sentence punctuation for pause detection.
 */
function cleanForTTS(text: string): string {
  return text
    .replace(/<\/?speak>/gi, " ")
    // Remove emojis
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, "")
    // Remove markdown bold/italic markers
    .replace(/[*_`#>]/g, " ")
    .replace(/[()[\]{}"“”'‘’]/g, " ")
    .replace(/[—–-]/g, ", ")
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function cleanSegmentText(text: string): string {
  return text
    .replace(/[.,?।॥:;!]/g, " ")
    .replace(/[^\p{L}\p{M}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function wait(ms: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, ms));
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
  const preferred = voices
    .filter((voice) => voice.lang.toLowerCase().startsWith("ml") || voice.name.toLowerCase().includes("malayalam"))
    .sort(compareVoiceQuality);

  return (
    preferred[0] ||
    voices.find((v) => v.name.toLowerCase().includes("lekha")) ||
    null
  );
}

function findSanskritVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  // Sanskrit voices are rare; Hindi voices read Devanagari perfectly.
  const preferred = voices
    .filter((voice) => {
      const name = voice.name.toLowerCase();
      const lang = voice.lang.toLowerCase();
      return lang.startsWith("sa") || lang.startsWith("hi") || name.includes("sanskrit") || name.includes("hindi");
    })
    .sort(compareVoiceQuality);

  return (
    preferred.find((v) => v.lang.toLowerCase().startsWith("sa")) ||
    preferred[0] ||
    null
  );
}

function compareVoiceQuality(a: SpeechSynthesisVoice, b: SpeechSynthesisVoice) {
  return voiceScore(b) - voiceScore(a);
}

function voiceScore(voice: SpeechSynthesisVoice) {
  const name = voice.name.toLowerCase();
  let score = 0;

  if (voice.localService) score += 2;
  if (name.includes("enhanced") || name.includes("premium")) score += 6;
  if (name.includes("google") || name.includes("microsoft") || name.includes("apple")) score += 4;
  if (name.includes("lekha")) score += 5;
  if (name.includes("compact")) score -= 4;

  return score;
}

// ── Public API ───────────────────────────────────────────────────────

export interface MultiSpeakOptions {
  /** Called when all segments finish speaking */
  onEnd?: () => void;
  /** Called on error */
  onError?: () => void;
  /** Speech rate (default 0.78) */
  rate?: number;
}

/**
 * Speak mixed Malayalam + Sanskrit text with correct voices for each script.
 * Returns a cancel function.
 */
export function multilingualSpeak(rawText: string, options: MultiSpeakOptions = {}): () => void {
  const { onEnd, onError, rate = 0.78 } = options;

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

      if (seg.kind === "pause") {
        await wait(seg.duration);
        continue;
      }

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
