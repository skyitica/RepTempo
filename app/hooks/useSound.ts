"use client";

import { useCallback, useRef } from "react";

function getCtx(ref: React.MutableRefObject<AudioContext | null>): AudioContext {
  if (!ref.current || ref.current.state === "closed") {
    ref.current = new AudioContext();
  }
  // Resume if suspended (browser autoplay policy)
  if (ref.current.state === "suspended") {
    ref.current.resume();
  }
  return ref.current;
}

type OscType = "sine" | "square" | "triangle" | "sawtooth";

function playTone(
  ctx: AudioContext,
  freq: number,
  duration: number,
  type: OscType = "sine",
  gain = 0.4,
  delay = 0
) {
  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();
  osc.connect(gainNode);
  gainNode.connect(ctx.destination);

  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);

  gainNode.gain.setValueAtTime(0, ctx.currentTime + delay);
  gainNode.gain.linearRampToValueAtTime(gain, ctx.currentTime + delay + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);

  osc.start(ctx.currentTime + delay);
  osc.stop(ctx.currentTime + delay + duration + 0.05);
}

export function useSound() {
  const ctxRef = useRef<AudioContext | null>(null);

  // Phase transition: going down (low thud)
  const phaseDown = useCallback(() => {
    const ctx = getCtx(ctxRef);
    playTone(ctx, 220, 0.15, "sine", 0.35);
  }, []);

  // Phase transition: hold (neutral click)
  const phaseHold = useCallback(() => {
    const ctx = getCtx(ctxRef);
    playTone(ctx, 440, 0.08, "triangle", 0.25);
  }, []);

  // Phase transition: going up (higher, energetic)
  const phaseUp = useCallback(() => {
    const ctx = getCtx(ctxRef);
    playTone(ctx, 550, 0.15, "sine", 0.35);
  }, []);

  // Rep completed: satisfying double-ping
  const repDone = useCallback(() => {
    const ctx = getCtx(ctxRef);
    playTone(ctx, 660, 0.12, "sine", 0.4);
    playTone(ctx, 880, 0.12, "sine", 0.3, 0.1);
  }, []);

  // Set completed: ascending 3-note chime
  const setDone = useCallback(() => {
    const ctx = getCtx(ctxRef);
    playTone(ctx, 523, 0.18, "sine", 0.4);        // C5
    playTone(ctx, 659, 0.18, "sine", 0.4, 0.18);  // E5
    playTone(ctx, 784, 0.25, "sine", 0.45, 0.36); // G5
  }, []);

  // Rest starting: low warm gong
  const restStart = useCallback(() => {
    const ctx = getCtx(ctxRef);
    playTone(ctx, 196, 0.6, "sine", 0.45);
    playTone(ctx, 294, 0.4, "sine", 0.2, 0.05);
  }, []);

  // Rest almost over (last 3 seconds): urgent beeps
  const restWarning = useCallback(() => {
    const ctx = getCtx(ctxRef);
    playTone(ctx, 880, 0.08, "square", 0.2);
  }, []);

  // Rest over: two rising tones → go!
  const restOver = useCallback(() => {
    const ctx = getCtx(ctxRef);
    playTone(ctx, 440, 0.1, "sine", 0.4);
    playTone(ctx, 660, 0.1, "sine", 0.45, 0.12);
    playTone(ctx, 880, 0.2, "sine", 0.5, 0.25);
  }, []);

  // Workout complete: victory fanfare
  const workoutDone = useCallback(() => {
    const ctx = getCtx(ctxRef);
    const notes = [523, 659, 784, 1047]; // C E G C octave
    notes.forEach((freq, i) => {
      playTone(ctx, freq, 0.25, "sine", 0.5, i * 0.2);
    });
  }, []);

  return {
    phaseDown,
    phaseHold,
    phaseUp,
    repDone,
    setDone,
    restStart,
    restWarning,
    restOver,
    workoutDone,
  };
}
