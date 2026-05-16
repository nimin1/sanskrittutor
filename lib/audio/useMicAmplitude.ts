"use client";

import { useEffect, useRef } from "react";

type AudioContextCtor = typeof AudioContext;

/**
 * Drives the CSS custom property `--mic-amp` (0..1) on the given element each
 * animation frame, based on real-time amplitude of the supplied MediaStream.
 * Pass `null` for either argument to teardown — the hook handles its own cleanup.
 */
export function useMicAmplitude(
  stream: MediaStream | null,
  target: HTMLElement | null,
) {
  const ctxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);
  const smoothedRef = useRef(0);

  useEffect(() => {
    if (!stream || !target) return;

    const Ctor: AudioContextCtor | undefined =
      typeof window !== "undefined"
        ? window.AudioContext ||
          (window as unknown as { webkitAudioContext?: AudioContextCtor }).webkitAudioContext
        : undefined;
    if (!Ctor) return;

    const ctx = new Ctor();
    ctxRef.current = ctx;

    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.6;
    source.connect(analyser);

    const buffer = new Uint8Array(analyser.frequencyBinCount);

    function tick() {
      analyser.getByteFrequencyData(buffer);
      let sum = 0;
      for (const v of buffer) sum += v * v;
      const rms = Math.sqrt(sum / buffer.length) / 255;
      const eased = Math.min(1, Math.max(0, rms * 2.2));
      smoothedRef.current = smoothedRef.current * 0.6 + eased * 0.4;
      target!.style.setProperty("--mic-amp", smoothedRef.current.toFixed(3));
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      target.style.setProperty("--mic-amp", "0");
      try { source.disconnect(); } catch { /* ignore */ }
      try { analyser.disconnect(); } catch { /* ignore */ }
      try { void ctx.close(); } catch { /* ignore */ }
      ctxRef.current = null;
      smoothedRef.current = 0;
    };
  }, [stream, target]);
}
