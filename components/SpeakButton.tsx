"use client";

import { useEffect, useRef, useState } from "react";
import { IconVolume, IconVolumeOff } from "@/components/Icons";
import { ml } from "@/lib/i18n/ml";
import { multilingualSpeak, stopSpeaking } from "@/lib/tts/multilingualSpeak";

type Status = "idle" | "loading" | "playing";

export function SpeakButton({ text }: { text: string }) {
  const [supported, setSupported] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const cancelRef = useRef<(() => void) | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const requestRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setSupported(typeof window !== "undefined");
    return () => { stopPlayback(); };
  }, []);

  if (!supported || !text.trim()) return null;

  async function speak() {
    if (status !== "idle") {
      stopPlayback();
      setStatus("idle");
      return;
    }
    setStatus("loading");
    try {
      const controller = new AbortController();
      requestRef.current = controller;
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
        signal: controller.signal,
      });
      const data = (await response.json().catch(() => ({}))) as { audioBase64?: string; mimeType?: string };
      if (!response.ok || !data.audioBase64) throw new Error("TTS API unavailable");

      const audio = new Audio(`data:${data.mimeType || "audio/mpeg"};base64,${data.audioBase64}`);
      audioRef.current = audio;
      audio.onended = () => setStatus("idle");
      audio.onerror = () => fallbackSpeak();
      await audio.play();
      setStatus("playing");
    } catch (err) {
      if ((err as { name?: string } | null)?.name !== "AbortError") {
        fallbackSpeak();
      }
    }
  }

  function fallbackSpeak() {
    setStatus("playing");
    const cancel = multilingualSpeak(text, {
      rate: 0.78,
      onEnd: () => setStatus("idle"),
      onError: () => setStatus("idle"),
    });
    cancelRef.current = cancel;
  }

  function stopPlayback() {
    requestRef.current?.abort();
    requestRef.current = null;
    audioRef.current?.pause();
    if (audioRef.current) audioRef.current.currentTime = 0;
    audioRef.current = null;
    cancelRef.current?.();
    cancelRef.current = null;
    stopSpeaking();
  }

  const loading = status === "loading";
  const playing = status === "playing";

  return (
    <button className="btn btn--sm btn--ghost" type="button" onClick={speak} aria-busy={loading}>
      {loading ? (
        <span className="speak-spinner" aria-hidden />
      ) : playing ? (
        <IconVolumeOff size={14} />
      ) : (
        <IconVolume size={14} />
      )}
      {loading ? ml.common.preparing : playing ? ml.common.stop : ml.common.listen}
    </button>
  );
}
