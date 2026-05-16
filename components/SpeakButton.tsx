"use client";

import { useEffect, useRef, useState } from "react";
import { IconVolume, IconVolumeOff } from "@/components/Icons";
import { ml } from "@/lib/i18n/ml";
import { multilingualSpeak, stopSpeaking } from "@/lib/tts/multilingualSpeak";

export function SpeakButton({ text }: { text: string }) {
  const [supported, setSupported] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const cancelRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "speechSynthesis" in window);
    return () => { cancelRef.current?.(); };
  }, []);

  if (!supported || !text.trim()) return null;

  function speak() {
    if (speaking) {
      cancelRef.current?.();
      stopSpeaking();
      setSpeaking(false);
      return;
    }
    setSpeaking(true);
    const cancel = multilingualSpeak(text, {
      rate: 0.88,
      onEnd: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
    cancelRef.current = cancel;
  }

  return (
    <button className="btn btn--sm btn--ghost" type="button" onClick={speak}>
      {speaking ? <IconVolumeOff size={14} /> : <IconVolume size={14} />}
      {speaking ? ml.common.stop : ml.common.listen}
    </button>
  );
}
