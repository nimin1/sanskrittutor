"use client";

import { useEffect, useRef, useState } from "react";
import { IconMic, IconStop } from "@/components/Icons";
import { ml } from "@/lib/i18n/ml";

type SpeechRecognitionLike = {
  lang: string; interimResults: boolean; continuous: boolean;
  start: () => void; stop: () => void;
  onresult: ((event: { resultIndex?: number; results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal?: boolean }> }) => void) | null;
  onend: (() => void) | null;
  onerror: ((event?: { error?: string }) => void) | null;
};
type SpeechWindow = Window & {
  SpeechRecognition?: new () => SpeechRecognitionLike;
  webkitSpeechRecognition?: new () => SpeechRecognitionLike;
};

export function VoiceInput({ onText }: { onText: (text: string) => void }) {
  const [supported, setSupported] = useState(true);
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState("");
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const transcriptRef = useRef("");

  useEffect(() => {
    setSupported(Boolean(getRecognition()));
    return () => recognitionRef.current?.stop();
  }, []);

  function startListening() {
    setError("");
    const R = getRecognition();
    if (!R) { setSupported(false); return; }
    const rec = new R();
    rec.lang = "ml-IN";
    rec.interimResults = true;
    rec.continuous = true;
    transcriptRef.current = "";

    let finalTranscript = "";
    rec.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex ?? 0; i < e.results.length; ++i) {
        if (e.results[i].isFinal) finalTranscript += e.results[i][0].transcript + " ";
        else interim += e.results[i][0].transcript;
      }
      transcriptRef.current = (finalTranscript + interim).trim();
    };

    rec.onerror = (e) => {
      setRecording(false);
      setError(e?.error === "not-allowed" ? ml.voice.permissionError : ml.voice.unsupported);
    };
    rec.onend = () => setRecording(false);
    recognitionRef.current = rec;
    try { setRecording(true); rec.start(); } catch { setRecording(false); setError(ml.voice.unsupported); }
  }

  function handleStop() {
    recognitionRef.current?.stop();
    setRecording(false);
    if (transcriptRef.current) onText(transcriptRef.current);
  }

  return (
    <div className="stack stack--sm">
      <button
        className={`btn ${recording ? "btn--danger" : "btn--secondary"}`}
        type="button"
        onClick={recording ? handleStop : startListening}
        disabled={!supported}
      >
        {recording ? <IconStop size={16} /> : <IconMic size={16} />}
        {recording ? ml.voice.stop : ml.voice.start}
      </button>
      {error ? <p className="meta" style={{ color: "var(--iron)" }}>{error}</p> : null}
      {!supported ? <p className="meta">{ml.voice.unsupported}</p> : null}
    </div>
  );
}

function getRecognition() {
  if (typeof window === "undefined") return undefined;
  const w = window as SpeechWindow;
  return w.SpeechRecognition || w.webkitSpeechRecognition;
}
