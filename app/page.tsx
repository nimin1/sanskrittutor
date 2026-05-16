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

type SpeechRecognitionLike = {
  lang: string; interimResults: boolean; continuous: boolean;
  start: () => void; stop: () => void;
  onresult: ((e: { resultIndex?: number; results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal?: boolean }> }) => void) | null;
  onend: (() => void) | null;
  onerror: ((e?: { error?: string }) => void) | null;
};
type SpeechWindow = Window & {
  SpeechRecognition?: new () => SpeechRecognitionLike;
  webkitSpeechRecognition?: new () => SpeechRecognitionLike;
};

type Phase = "idle" | "recording" | "review";

export default function HomePage() {
  const [messages, setMessages] = useState<TutorChatMessage[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [voiceSupported, setVoiceSupported] = useState(true);

  /* Voice flow state */
  const [phase, setPhase] = useState<Phase>("idle");
  const [transcript, setTranscript] = useState("");
  const transcriptRef = useRef("");

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const reviewFieldRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setVoiceSupported(Boolean(getRecognition()));
    return () => recognitionRef.current?.stop();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, phase]);

  /* Auto-grow the review textarea */
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

  function startRecording() {
    const R = getRecognition();
    if (!R) { setVoiceSupported(false); return; }
    setError("");
    updateTranscript("");
    setPhase("recording");

    const rec = new R();
    rec.lang = "ml-IN";
    rec.interimResults = true;
    rec.continuous = true;

    let finalT = "";
    rec.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex ?? 0; i < e.results.length; ++i) {
        if (e.results[i].isFinal) finalT += e.results[i][0].transcript + " ";
        else interim += e.results[i][0].transcript;
      }
      updateTranscript((finalT + interim).trim());
    };
    rec.onerror = () => {
      // If we caught some text, still let her review it
      setPhase(transcriptRef.current.trim() ? "review" : "idle");
    };
    rec.onend = () => {
      // Don't change phase here — stopRecording owns the transition
    };

    recognitionRef.current = rec;
    try { rec.start(); } catch { setPhase("idle"); }
  }

  function stopRecording() {
    recognitionRef.current?.stop();
    /* No auto-send. Go to review if there's anything to review. */
    setPhase(transcriptRef.current.trim() ? "review" : "idle");
  }

  function reRecord() {
    updateTranscript("");
    startRecording();
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
  const reviewing = phase === "review";

  /* ── IDLE / RECORDING / REVIEW — single voice stage ──────── */
  if (!inChat) {
    return (
      <section className="stage">
        {reviewing ? (
          <>
            <ReviewCard
              text={transcript}
              fieldRef={reviewFieldRef}
              onChange={updateTranscript}
              onSubmit={submitFromReview}
              onReRecord={reRecord}
              onCancel={cancelReview}
              busy={busy}
            />
          </>
        ) : (
          <>
            <p className="stage__greeting">{ml.home.greeting}</p>

            <button
              type="button"
              className={`stage__mic ${recording ? "stage__mic--recording" : ""}`}
              onClick={recording ? stopRecording : startRecording}
              disabled={!voiceSupported}
              aria-label={recording ? ml.voice.stop : ml.voice.start}
            >
              {recording ? <IconStop size={52} /> : <IconMic size={56} />}
            </button>

            <p className={`stage__hint ${recording ? "stage__hint--recording" : ""}`}>
              {recording ? ml.home.micTapToStop : ml.home.micIdle}
            </p>

            {recording ? (
              <div className={`transcript-live ${transcript ? "" : "transcript-live--empty"}`}>
                {transcript || ml.home.waitingForSpeech}
              </div>
            ) : (
              <>
                <div className="stage__divider">{ml.home.orDivider}</div>
                <Link href="/snap" className="stage__secondary">
                  <IconCamera size={20} /> {ml.home.snapAction}
                </Link>
              </>
            )}
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
            {recording ? (
              <div className={`transcript-live transcript-live--inline ${transcript ? "" : "transcript-live--empty"}`}>
                {transcript || ml.home.waitingForSpeech}
              </div>
            ) : null}
            <button
              type="button"
              className={`chat-mic ${recording ? "chat-mic--recording" : ""}`}
              onClick={recording ? stopRecording : startRecording}
              disabled={busy || !voiceSupported}
              aria-label={recording ? ml.voice.stop : ml.voice.start}
            >
              {recording ? <IconStop size={30} /> : <IconMic size={32} />}
            </button>
            <p className="meta" style={{ marginTop: 2 }}>
              {recording ? ml.home.micTapToStop : ml.home.micIdle}
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

function makeMsg(role: "user" | "assistant", content: string): TutorChatMessage {
  return { id: crypto.randomUUID(), role, type: "text", content, createdAt: new Date().toISOString() };
}
function toHistory(msgs: TutorChatMessage[]): TutorMessage[] {
  return msgs.map((m) => ({ role: m.role, content: m.content }));
}
function getRecognition() {
  if (typeof window === "undefined") return undefined;
  const w = window as SpeechWindow;
  return w.SpeechRecognition || w.webkitSpeechRecognition;
}
