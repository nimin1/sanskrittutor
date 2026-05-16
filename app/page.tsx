"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChatTranscript } from "@/components/ChatTranscript";
import { ErrorMessage } from "@/components/ErrorMessage";
import { IconCamera, IconMic, IconPlus, IconSend, IconStop } from "@/components/Icons";
import { LoadingMessage } from "@/components/LoadingMessage";
import type { TutorMessage } from "@/lib/ai/types";
import type { TutorChatMessage } from "@/lib/db";
import { ml } from "@/lib/i18n/ml";

type Phase = "idle" | "recording" | "transcribing" | "review";

export default function HomePage() {
  const [messages, setMessages] = useState<TutorChatMessage[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [voiceSupported, setVoiceSupported] = useState(true);

  /* Voice flow state */
  const [phase, setPhase] = useState<Phase>("idle");
  const [transcript, setTranscript] = useState("");
  const transcriptRef = useRef("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const reviewFieldRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setVoiceSupported(isMicCapable());
    return () => {
      cleanupStream();
    };
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, phase]);

  useEffect(() => {
    const el = reviewFieldRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 280) + "px";
  }, [transcript, phase]);

  function updateTranscript(text: string) {
    transcriptRef.current = text;
    setTranscript(text);
  }

  function cleanupStream() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    mediaRecorderRef.current = null;
    chunksRef.current = [];
  }

  async function startRecording() {
    setError("");

    if (typeof window !== "undefined" && !window.isSecureContext) {
      setError(ml.home.httpsRequired);
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError(ml.home.micUnavailable);
      setVoiceSupported(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

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
        cleanupStream();
        if (blob.size === 0) {
          setPhase("idle");
          return;
        }
        void uploadForTranscription(blob);
      };
      recorder.onerror = () => {
        cleanupStream();
        setError(ml.home.transcribeFailed);
        setPhase("idle");
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setPhase("recording");
    } catch (err) {
      cleanupStream();
      setError(messageForMediaError(err));
      setPhase("idle");
    }
  }

  function stopRecording() {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;
    if (recorder.state === "inactive") return;
    setPhase("transcribing");
    try { recorder.stop(); } catch {
      cleanupStream();
      setPhase("idle");
    }
  }

  async function uploadForTranscription(blob: Blob) {
    try {
      const form = new FormData();
      form.append("audio", blob, `audio.${extFor(blob.type)}`);
      const res = await fetch("/api/transcribe", { method: "POST", body: form });
      const data = (await res.json().catch(() => ({}))) as { text?: string; error?: string };
      if (!res.ok || data.error) throw new Error(data.error || "transcribe failed");

      const text = (data.text || "").trim();
      if (!text) {
        setError(ml.home.transcribeFailed);
        setPhase("idle");
        return;
      }
      updateTranscript(text);
      setPhase("review");
    } catch {
      setError(ml.home.transcribeFailed);
      setPhase("idle");
    }
  }

  function reRecord() {
    updateTranscript("");
    void startRecording();
  }

  function cancelReview() {
    updateTranscript("");
    setPhase("idle");
  }

  async function submitFromReview() {
    const q = transcript.trim();
    if (!q || busy) return;
    setPhase("idle");
    updateTranscript("");
    await sendQuestion(q);
  }

  async function sendQuestion(text: string) {
    const q = text.trim();
    if (!q) return;
    const userMsg = makeMsg("user", q);
    const assistantMsg = makeMsg("assistant", "");
    const next = [...messages, userMsg];
    setMessages([...next, assistantMsg]);
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userText: q, history: toHistory(messages) }),
      });
      if (!res.ok || !res.body) throw new Error("fail");
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let full = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        full += dec.decode(value, { stream: true });
        setMessages([...next, { ...assistantMsg, content: full }]);
      }
    } catch {
      setError(ml.errors.aiFailed);
    } finally {
      setBusy(false);
    }
  }

  function resetChat() {
    setMessages([]);
    updateTranscript("");
    setPhase("idle");
    setError("");
  }

  const inChat = messages.length > 0;
  const recording = phase === "recording";
  const transcribing = phase === "transcribing";
  const reviewing = phase === "review";

  /* ── IDLE / RECORDING / TRANSCRIBING / REVIEW ─────────────── */
  if (!inChat) {
    return (
      <section className="stage">
        {reviewing ? (
          <ReviewCard
            text={transcript}
            fieldRef={reviewFieldRef}
            onChange={updateTranscript}
            onSubmit={submitFromReview}
            onReRecord={reRecord}
            onCancel={cancelReview}
            busy={busy}
          />
        ) : (
          <>
            <p className="stage__greeting">{ml.home.greeting}</p>
            <div style={{ marginBottom: 24, width: "100%", maxWidth: 400 }}>
              <ErrorMessage message={error} />
            </div>

            <button
              type="button"
              className={`stage__mic ${recording ? "stage__mic--recording" : ""}`}
              onClick={recording ? stopRecording : startRecording}
              disabled={!voiceSupported || transcribing}
              aria-label={recording ? ml.voice.stop : ml.voice.start}
            >
              {recording ? <IconStop size={52} /> : <IconMic size={56} />}
            </button>

            <p className={`stage__hint ${recording ? "stage__hint--recording" : ""}`}>
              {recording
                ? ml.home.micTapToStop
                : transcribing
                ? ml.home.transcribing
                : ml.home.micIdle}
            </p>

            {transcribing ? (
              <div className="thinking" style={{ marginTop: 18 }}>
                <span className="thinking__pen" aria-hidden />
              </div>
            ) : null}

            {!recording && !transcribing ? (
              <>
                <div className="stage__divider">{ml.home.orDivider}</div>
                <Link href="/snap" className="stage__secondary">
                  <IconCamera size={20} /> {ml.home.snapAction}
                </Link>
              </>
            ) : null}
          </>
        )}
      </section>
    );
  }

  /* ── CONVERSATION VIEW ────────────────────────────────────── */
  return (
    <>
      <header className="page-head">
        <div className="row--between">
          <h1 className="headline" style={{ fontSize: 24 }}>{ml.home.conversationTitle}</h1>
          <button className="btn btn--ghost btn--sm" onClick={resetChat}>
            <IconPlus size={14} /> {ml.home.newConversation}
          </button>
        </div>
        <div className="page-head__rule" />
      </header>

      <ErrorMessage message={error} />
      <ChatTranscript messages={messages} />
      {busy ? <div style={{ marginTop: 12 }}><LoadingMessage message={ml.common.pleaseWait} /></div> : null}
      <div ref={chatEndRef} />

      <div className="chat-foot">
        {reviewing ? (
          <ReviewCard
            text={transcript}
            fieldRef={reviewFieldRef}
            onChange={updateTranscript}
            onSubmit={submitFromReview}
            onReRecord={reRecord}
            onCancel={cancelReview}
            busy={busy}
          />
        ) : (
          <>
            <button
              type="button"
              className={`chat-mic ${recording ? "chat-mic--recording" : ""}`}
              onClick={recording ? stopRecording : startRecording}
              disabled={busy || !voiceSupported || transcribing}
              aria-label={recording ? ml.voice.stop : ml.voice.start}
            >
              {recording ? <IconStop size={30} /> : <IconMic size={32} />}
            </button>
            <p className="meta" style={{ marginTop: 2 }}>
              {recording
                ? ml.home.micTapToStop
                : transcribing
                ? ml.home.transcribing
                : ml.home.micIdle}
            </p>
          </>
        )}
      </div>
    </>
  );
}

/* ── Review card ─────────────────────────────────────────────
   Pauses the voice flow so the user verifies the transcript
   before it goes to the AI.
   ────────────────────────────────────────────────────────── */
function ReviewCard({
  text, fieldRef, onChange, onSubmit, onReRecord, onCancel, busy,
}: {
  text: string;
  fieldRef: React.RefObject<HTMLTextAreaElement | null>;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onReRecord: () => void;
  onCancel: () => void;
  busy: boolean;
}) {
  return (
    <div className="review" role="group" aria-label={ml.home.reviewLabel}>
      <div className="row--between" style={{ marginBottom: 12 }}>
        <span className="review__label">{ml.home.reviewLabel}</span>
        <button type="button" className="btn btn--ghost btn--sm" onClick={onCancel} aria-label={ml.common.cancel}>
          {ml.common.cancel}
        </button>
      </div>
      <textarea
        ref={fieldRef}
        className="review__field"
        value={text}
        rows={3}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSubmit(); }
        }}
        placeholder={ml.home.composerPlaceholder}
      />
      <p className="review__edit-hint">{ml.home.reviewEditHint}</p>
      <div className="review__actions">
        <button
          type="button"
          className="btn btn--primary btn--lg btn--block"
          onClick={onSubmit}
          disabled={!text.trim() || busy}
        >
          <IconSend size={18} /> {ml.common.send}
        </button>
        <button
          type="button"
          className="btn btn--ghost btn--block"
          onClick={onReRecord}
          disabled={busy}
        >
          <IconMic size={16} /> {ml.home.reRecord}
        </button>
      </div>
    </div>
  );
}

/* ── Helpers ─────────────────────────────────────────────── */

function makeMsg(role: "user" | "assistant", content: string): TutorChatMessage {
  return { id: crypto.randomUUID(), role, type: "text", content, createdAt: new Date().toISOString() };
}

function toHistory(msgs: TutorChatMessage[]): TutorMessage[] {
  return msgs.map((m) => ({ role: m.role, content: m.content }));
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
