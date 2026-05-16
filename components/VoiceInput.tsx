"use client";

import { useEffect, useRef, useState } from "react";
import { IconMic, IconStop } from "@/components/Icons";
import { useMicAmplitude } from "@/lib/audio/useMicAmplitude";
import { ml } from "@/lib/i18n/ml";



type State = "idle" | "recording" | "transcribing";

/**
 * Voice → server-side STT. Used by Snap, Ask and Quiz.
 * Records audio via MediaRecorder and posts to /api/transcribe.
 * Works on every mobile browser including iOS PWA standalone mode.
 *
 * The parent gets the transcript via onText() and decides what to do
 * with it (typically: prefill an editable textarea so the user can
 * review before sending).
 */
export function VoiceInput({ onText }: { onText: (text: string) => void }) {
  const [supported, setSupported] = useState(true);
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState("");

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [liveStream, setLiveStream] = useState<MediaStream | null>(null);
  useMicAmplitude(liveStream, buttonRef.current);

  useEffect(() => {
    setSupported(isMicCapable());
    return () => cleanup();
  }, []);

  function cleanup() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    recorderRef.current = null;
    chunksRef.current = [];
    setLiveStream(null);
  }

  async function startListening() {
    setError("");
    if (typeof window !== "undefined" && !window.isSecureContext) {
      setError(ml.home.httpsRequired);
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError(ml.home.micUnavailable);
      setSupported(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setLiveStream(stream);

      const mimeType = pickMimeType();
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const type = recorder.mimeType || mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type });
        cleanup();
        if (blob.size === 0) { setState("idle"); return; }
        void transcribe(blob);
      };
      recorder.onerror = () => {
        cleanup();
        setError(ml.home.transcribeFailed);
        setState("idle");
      };

      recorderRef.current = recorder;
      recorder.start();
      setState("recording");
    } catch (err) {
      cleanup();
      setError(messageForMediaError(err));
      setState("idle");
    }
  }

  function handleStop() {
    const r = recorderRef.current;
    if (!r || r.state === "inactive") { setState("idle"); return; }
    setState("transcribing");
    try { r.stop(); } catch { cleanup(); setState("idle"); }
  }

  async function transcribe(blob: Blob) {
    try {
      const form = new FormData();
      form.append("audio", blob, `audio.${extFor(blob.type)}`);
      const res = await fetch("/api/transcribe", { method: "POST", body: form });
      const data = (await res.json().catch(() => ({}))) as { text?: string; error?: string };
      if (!res.ok || data.error) throw new Error(data.error || "transcribe failed");
      const text = (data.text || "").trim();
      if (text) onText(text);
      else setError(ml.home.transcribeFailed);
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : ml.home.transcribeFailed);
    } finally {
      setState("idle");
    }
  }

  const recording = state === "recording";
  const transcribing = state === "transcribing";

  return (
    <div className="stack stack--sm">
      <button
        ref={buttonRef}
        className={`btn ${recording ? "btn--danger btn--listening" : "btn--secondary"}`}
        type="button"
        onClick={recording ? handleStop : startListening}
        disabled={!supported || transcribing}
      >
        {recording ? <IconStop size={16} /> : <IconMic size={16} />}
        {recording ? ml.voice.stop : transcribing ? ml.home.transcribing : ml.voice.start}
      </button>
      {error ? <p className="meta" style={{ color: "var(--iron)" }}>{error}</p> : null}
      {!supported ? <p className="meta">{ml.home.micUnavailable}</p> : null}
    </div>
  );
}

function isMicCapable(): boolean {
  if (typeof window === "undefined") return false;
  if (!window.isSecureContext) return false;
  if (!navigator.mediaDevices?.getUserMedia) return false;
  if (typeof MediaRecorder === "undefined") return false;
  return true;
}

function pickMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "";
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4;codecs=mp4a.40.2",
    "audio/mp4",
    "audio/ogg;codecs=opus",
  ];
  for (const c of candidates) {
    if (MediaRecorder.isTypeSupported(c)) return c;
  }
  return "";
}

function extFor(mime: string): string {
  if (mime.includes("mp4")) return "m4a";
  if (mime.includes("ogg")) return "ogg";
  return "webm";
}

function messageForMediaError(err: unknown): string {
  const name = (err as { name?: string } | null | undefined)?.name;
  if (name === "NotAllowedError" || name === "SecurityError") return ml.home.micPermissionDenied;
  if (name === "NotFoundError" || name === "OverconstrainedError") return ml.home.micUnavailable;
  return ml.home.transcribeFailed;
}
