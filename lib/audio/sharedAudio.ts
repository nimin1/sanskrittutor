// iOS Safari only allows audio playback from an HTMLAudioElement that was
// activated inside a user gesture. The activation does NOT transfer to other
// audio elements created later. So we keep ONE shared element alive for the
// whole session, prime it on the Send click, and reuse the same element to
// play the AI's response when it arrives.

// A short valid silent MP3 that iOS Safari accepts as a real playback target.
const SILENT_MP3 =
  "data:audio/mpeg;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaWdTb3VuZEJhbmsuY29tIC8gTGFTb25vdGhlcXVlLm9yZwBURU5DAAAAHQAAA1N3aXRjaCBQbHVzIMKpIE5DSCBTb2Z0d2FyZQBUSVQyAAAABgAAAzIyMzUAVFNTRQAAAA8AAANMYXZmNTcuODMuMTAwAAAAAAAAAAAAAAD/80DEAAAAA0gAAAAATEFNRTMuMTAwVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV";

let element: HTMLAudioElement | null = null;
let primed = false;

function getElement(): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  if (!element) {
    element = new Audio();
    element.preload = "auto";
  }
  return element;
}

// Call this synchronously inside a click handler. It activates the shared
// audio element so future src changes can play without a fresh gesture.
export function primeAudio(): void {
  const audio = getElement();
  if (!audio) return;
  if (primed) return;
  audio.muted = true;
  audio.src = SILENT_MP3;
  const p = audio.play();
  if (p && typeof p.then === "function") {
    p.then(() => {
      audio.pause();
      audio.muted = false;
      primed = true;
    }).catch(() => {
      // Browser refused even the silent prime — likely no recent gesture.
      // We'll try again on the next click.
    });
  } else {
    primed = true;
  }
}

// Play arbitrary audio through the shared (already-activated) element.
// Returns the element so callers can attach onended / onerror / pause it.
export async function playOnSharedAudio(src: string): Promise<HTMLAudioElement> {
  const audio = getElement();
  if (!audio) throw new Error("Audio not supported in this environment.");
  audio.muted = false;
  audio.src = src;
  audio.currentTime = 0;
  await audio.play();
  return audio;
}

export function stopSharedAudio(): void {
  if (!element) return;
  try {
    element.pause();
    element.currentTime = 0;
  } catch {
    // ignore
  }
}
