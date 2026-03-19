"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { WorkoutConfig, TempoPhase, Exercise } from "../types";
import { useSound } from "../hooks/useSound";

interface Props {
  workout: WorkoutConfig;
  onFinish: () => void;
}

const PHASE_ORDER: TempoPhase[] = ["phase1", "hold1", "phase2", "hold2"];

const PHASE_LABELS: Record<TempoPhase, string> = {
  phase1: "Going Down",
  hold1: "Hold",
  phase2: "Going Up",
  hold2: "Hold",
};

const PHASE_COLORS: Record<TempoPhase, string> = {
  phase1: "text-blue-400",
  hold1: "text-yellow-400",
  phase2: "text-green-400",
  hold2: "text-yellow-400",
};

const PHASE_BG: Record<TempoPhase, string> = {
  phase1: "bg-blue-500",
  hold1: "bg-yellow-500",
  phase2: "bg-green-500",
  hold2: "bg-yellow-500",
};

function getPhaseSeconds(ex: Exercise, phase: TempoPhase): number {
  return ex.tempo[phase];
}

function getNextActivePhase(
  ex: Exercise,
  current: TempoPhase
): { phase: TempoPhase; isNewRep: boolean } | null {
  const idx = PHASE_ORDER.indexOf(current);
  for (let i = 1; i <= PHASE_ORDER.length; i++) {
    const next = PHASE_ORDER[(idx + i) % PHASE_ORDER.length];
    const isWrapped = (idx + i) >= PHASE_ORDER.length;
    if (getPhaseSeconds(ex, next) > 0) {
      return { phase: next, isNewRep: isWrapped };
    }
  }
  return null;
}

function getFirstActivePhase(ex: Exercise): TempoPhase {
  for (const p of PHASE_ORDER) {
    if (getPhaseSeconds(ex, p) > 0) return p;
  }
  return "phase1";
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function phaseSound(
  phase: TempoPhase,
  sound: ReturnType<typeof useSound>
) {
  if (phase === "phase1") sound.phaseDown();
  else if (phase === "phase2") sound.phaseUp();
  else sound.phaseHold();
}

function CircleProgress({
  value,
  max,
  phase,
  label,
  center,
}: {
  value: number;
  max: number;
  phase: TempoPhase;
  label: string;
  center: React.ReactNode;
}) {
  const r = 80;
  const circ = 2 * Math.PI * r;
  const progress = max > 0 ? (value / max) : 0;
  const offset = circ * (1 - progress);

  const colorMap: Record<TempoPhase, string> = {
    phase1: "#60a5fa",
    hold1: "#facc15",
    phase2: "#4ade80",
    hold2: "#facc15",
  };

  return (
    <div className="relative flex items-center justify-center w-52 h-52">
      <svg className="absolute inset-0 -rotate-90" width="208" height="208">
        <circle cx="104" cy="104" r={r} fill="none" stroke="#1f2937" strokeWidth="12" />
        <circle
          cx="104"
          cy="104"
          r={r}
          fill="none"
          stroke={colorMap[phase]}
          strokeWidth="12"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.25s linear, stroke 0.3s" }}
        />
      </svg>
      <div className="z-10 flex flex-col items-center">
        <span className={`text-sm font-semibold ${PHASE_COLORS[phase]} uppercase tracking-wider`}>
          {label}
        </span>
        {center}
      </div>
    </div>
  );
}

export default function WorkoutSession({ workout, onFinish }: Props) {
  const { exercises } = workout;
  const sound = useSound();

  const [exerciseIdx, setExerciseIdx] = useState(0);
  const [setIdx, setSetIdx] = useState(0);
  const [repIdx, setRepIdx] = useState(0);
  const [phase, setPhase] = useState<TempoPhase>(() =>
    getFirstActivePhase(exercises[0])
  );
  const [phaseTime, setPhaseTime] = useState(() => {
    const p = getFirstActivePhase(exercises[0]);
    return getPhaseSeconds(exercises[0], p);
  });
  const [isResting, setIsResting] = useState(false);
  const [restTime, setRestTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [listenMode, setListenMode] = useState(false);
  const [soundOn, setSoundOn] = useState(true);

  // Use ref so advance closure always sees latest value without re-creating
  const soundOnRef = useRef(soundOn);
  useEffect(() => { soundOnRef.current = soundOn; }, [soundOn]);

  const ex = exercises[exerciseIdx];
  const totalSets = ex.sets;
  const totalReps = ex.reps;
  const phaseMax = getPhaseSeconds(ex, phase);

  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  const s = useRef(sound);
  useEffect(() => { s.current = sound; }, [sound]);

  // --- Timer logic ---
  const advance = useCallback(() => {
    const snd = soundOnRef.current ? s.current : null;

    if (isResting) {
      setRestTime((t) => {
        const next = t - 1;
        if (next <= 0) {
          snd?.restOver();
          setIsResting(false);
          return 0;
        }
        if (next <= 3) snd?.restWarning();
        return next;
      });
      return;
    }

    setPhaseTime((t) => {
      if (t > 1) return t - 1;

      // Phase done — move to next
      const next = getNextActivePhase(ex, phase);
      if (!next) return 0;

      const { phase: nextPhase, isNewRep } = next;

      if (isNewRep) {
        setRepIdx((r) => {
          const newRep = r + 1;
          if (newRep >= totalReps) {
            setSetIdx((s) => {
              const newSet = s + 1;
              if (newSet >= totalSets) {
                setExerciseIdx((ei) => {
                  const newEi = ei + 1;
                  if (newEi >= exercises.length) {
                    snd?.workoutDone();
                    setIsComplete(true);
                    setIsRunning(false);
                    return ei;
                  }
                  snd?.setDone();
                  const nextEx = exercises[newEi];
                  const fp = getFirstActivePhase(nextEx);
                  setPhase(fp);
                  setPhaseTime(getPhaseSeconds(nextEx, fp));
                  setIsResting(true);
                  setRestTime(ex.restSeconds);
                  snd?.restStart();
                  return newEi;
                });
                return 0;
              }
              snd?.setDone();
              setIsResting(true);
              setRestTime(ex.restSeconds);
              snd?.restStart();
              return newSet;
            });
            return 0;
          }
          snd?.repDone();
          setPhase(nextPhase);
          return newRep;
        });
      } else {
        phaseSound(nextPhase, s.current);
        setPhase(nextPhase);
      }

      return getPhaseSeconds(ex, nextPhase);
    });
  }, [ex, exercises, isResting, phase, totalReps, totalSets]);

  useEffect(() => {
    if (isRunning && !isComplete) {
      tickRef.current = setInterval(advance, 1000);
    } else {
      if (tickRef.current) clearInterval(tickRef.current);
    }
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [isRunning, isComplete, advance]);

  // Reset phase/time when exercise changes
  useEffect(() => {
    if (!isResting) {
      const fp = getFirstActivePhase(ex);
      setPhase(fp);
      setPhaseTime(getPhaseSeconds(ex, fp));
    }
  }, [exerciseIdx]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fire phase sound on first tick when starting
  function handleStartStop() {
    const next = !isRunning;
    if (next && soundOn && !isResting) {
      phaseSound(phase, sound);
    }
    setIsRunning(next);
  }

  // --- Voice control ---
  function toggleListen() {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      alert("Voice control not supported in this browser. Try Chrome.");
      return;
    }
    if (listenMode) {
      recognitionRef.current?.stop();
      setListenMode(false);
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = false;
    rec.lang = "en-US";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (e: any) => {
      const transcript = e.results[e.results.length - 1][0].transcript.toLowerCase().trim();
      if (transcript.includes("start") || transcript.includes("go") || transcript.includes("begin")) {
        setIsRunning(true);
      } else if (transcript.includes("stop") || transcript.includes("pause")) {
        setIsRunning(false);
      } else if (transcript.includes("skip") || transcript.includes("next")) {
        setIsResting(false);
      }
    };
    rec.onend = () => { if (listenMode) rec.start(); };
    rec.start();
    recognitionRef.current = rec;
    setListenMode(true);
  }

  if (isComplete) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-6 px-4">
        <div className="text-6xl">🏆</div>
        <h1 className="text-4xl font-bold text-orange-500">Workout Complete!</h1>
        <p className="text-gray-400 text-lg">Great work. All sets done.</p>
        <button
          onClick={onFinish}
          className="mt-4 px-8 py-3 bg-orange-500 hover:bg-orange-600 rounded-xl font-bold text-lg transition-colors"
        >
          New Workout
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8 flex flex-col items-center gap-6">
      {/* Header */}
      <div className="w-full flex items-center justify-between">
        <button onClick={onFinish} className="text-gray-500 hover:text-white transition-colors text-sm">
          ← Exit
        </button>
        <h1 className="text-orange-500 font-bold text-xl">RepTempo</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setSoundOn((v) => !v)}
            className={`text-sm px-3 py-1 rounded-full border transition-colors ${
              soundOn ? "border-orange-500 text-orange-400 bg-orange-500/10" : "border-gray-700 text-gray-600"
            }`}
            title={soundOn ? "Mute sounds" : "Enable sounds"}
          >
            {soundOn ? "🔊" : "🔇"}
          </button>
          <button
            onClick={toggleListen}
            className={`text-sm px-3 py-1 rounded-full border transition-colors ${
              listenMode ? "border-green-500 text-green-400 bg-green-500/10" : "border-gray-600 text-gray-400"
            }`}
          >
            {listenMode ? "🎙 On" : "🎙"}
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Exercise {exerciseIdx + 1}/{exercises.length}</span>
          <span>Set {setIdx + 1}/{totalSets}</span>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-1.5">
          <div
            className="bg-orange-500 h-1.5 rounded-full transition-all"
            style={{
              width: `${((exerciseIdx * totalSets + setIdx) / (exercises.length * totalSets)) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Exercise name */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white">{ex.name}</h2>
        <p className="text-gray-400 text-sm mt-1">
          {ex.tempo.phase1}-{ex.tempo.hold1}-{ex.tempo.phase2}-{ex.tempo.hold2} tempo
        </p>
      </div>

      {/* Main display */}
      {isResting ? (
        <div className="flex flex-col items-center gap-4">
          <div className="relative flex items-center justify-center w-52 h-52">
            <svg className="absolute inset-0 -rotate-90" width="208" height="208">
              <circle cx="104" cy="104" r="80" fill="none" stroke="#1f2937" strokeWidth="12" />
              <circle
                cx="104" cy="104" r="80" fill="none"
                stroke={restTime <= 3 ? "#ef4444" : "#f97316"}
                strokeWidth="12"
                strokeDasharray={2 * Math.PI * 80}
                strokeDashoffset={2 * Math.PI * 80 * (1 - restTime / ex.restSeconds)}
                strokeLinecap="round"
                style={{ transition: "stroke-dashoffset 0.25s linear, stroke 0.3s" }}
              />
            </svg>
            <div className="z-10 flex flex-col items-center">
              <span className={`text-sm font-semibold uppercase tracking-wider ${restTime <= 3 ? "text-red-400" : "text-orange-400"}`}>
                {restTime <= 3 && restTime > 0 ? "Get Ready!" : "Rest"}
              </span>
              <span className="text-5xl font-bold text-white">{formatTime(restTime)}</span>
            </div>
          </div>
          <button
            onClick={() => { sound.restOver(); setIsResting(false); }}
            className="px-6 py-2 border border-gray-600 rounded-xl text-gray-400 hover:text-white hover:border-white transition-colors text-sm"
          >
            Skip Rest
          </button>
        </div>
      ) : (
        <CircleProgress
          value={phaseTime}
          max={phaseMax}
          phase={phase}
          label={PHASE_LABELS[phase]}
          center={
            <>
              <span className="text-5xl font-bold text-white">{phaseTime}</span>
              <span className="text-gray-400 text-xs">seconds</span>
            </>
          }
        />
      )}

      {/* Rep / Set counter */}
      <div className="flex gap-8 text-center">
        <div>
          <div className="text-4xl font-bold text-white">{repIdx + 1}</div>
          <div className="text-xs text-gray-500 uppercase tracking-wider">Rep</div>
        </div>
        <div className="w-px bg-gray-800" />
        <div>
          <div className="text-4xl font-bold text-white">{totalReps}</div>
          <div className="text-xs text-gray-500 uppercase tracking-wider">Target</div>
        </div>
        <div className="w-px bg-gray-800" />
        <div>
          <div className="text-4xl font-bold text-white">{setIdx + 1}</div>
          <div className="text-xs text-gray-500 uppercase tracking-wider">Set</div>
        </div>
      </div>

      {/* Phase dots */}
      {!isResting && (
        <div className="flex gap-3">
          {PHASE_ORDER.map((p) => {
            const sec = getPhaseSeconds(ex, p);
            if (sec === 0) return null;
            return (
              <div key={p} className="flex flex-col items-center gap-1">
                <div className={`w-3 h-3 rounded-full transition-all ${phase === p ? PHASE_BG[p] + " scale-125" : "bg-gray-700"}`} />
                <span className="text-xs text-gray-500">{PHASE_LABELS[p]}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Sound legend */}
      {soundOn && !isResting && (
        <div className="flex gap-4 text-xs text-gray-600">
          <span className="text-blue-500/60">↓ low tone</span>
          <span className="text-yellow-500/60">◆ click</span>
          <span className="text-green-500/60">↑ high tone</span>
          <span className="text-white/40">✓ ping = rep</span>
        </div>
      )}

      {/* Control button */}
      <button
        onClick={handleStartStop}
        className={`w-full py-4 rounded-2xl font-bold text-xl transition-colors ${
          isRunning ? "bg-gray-700 hover:bg-gray-600 text-white" : "bg-orange-500 hover:bg-orange-600 text-white"
        }`}
      >
        {isRunning ? "⏸ Pause" : isResting ? "▶ Resume Rest" : "▶ Start"}
      </button>

      {listenMode && (
        <p className="text-xs text-gray-500 text-center">
          Say <span className="text-green-400">"start"</span> / <span className="text-red-400">"stop"</span> / <span className="text-yellow-400">"skip"</span>
        </p>
      )}

      {exerciseIdx + 1 < exercises.length && (
        <div className="w-full bg-gray-900 rounded-xl p-3 border border-gray-800">
          <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">Up next</p>
          <p className="text-gray-300 font-medium">{exercises[exerciseIdx + 1].name}</p>
          <p className="text-xs text-gray-500">
            {exercises[exerciseIdx + 1].sets} sets × {exercises[exerciseIdx + 1].reps} reps
          </p>
        </div>
      )}
    </div>
  );
}
