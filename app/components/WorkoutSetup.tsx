"use client";

import { useState } from "react";
import Link from "next/link";
import { Exercise, WorkoutConfig, Tempo } from "../types";
import { saveWorkout } from "@/app/actions/workouts";

interface Props {
  onStart: (config: WorkoutConfig, name: string) => void;
}

const DEFAULT_EXERCISE: Omit<Exercise, "id"> = {
  name: "",
  mode: "reps",
  sets: 3,
  reps: 10,
  timerSeconds: 30,
  tempo: { phase1: 3, hold1: 1, phase2: 2, hold2: 0 },
  restSeconds: 120,
};

function generateId() {
  return Math.random().toString(36).slice(2);
}

function TempoInput({
  tempo,
  onChange,
}: {
  tempo: Tempo;
  onChange: (t: Tempo) => void;
}) {
  const fields: { key: keyof Tempo; label: string }[] = [
    { key: "phase1", label: "Down" },
    { key: "hold1", label: "Hold↓" },
    { key: "phase2", label: "Up" },
    { key: "hold2", label: "Hold↑" },
  ];
  return (
    <div className="flex gap-2 items-end">
      {fields.map(({ key, label }) => (
        <div key={key} className="flex flex-col items-center gap-1">
          <span className="text-xs text-gray-400">{label}</span>
          <input
            type="number"
            min={0}
            max={10}
            value={tempo[key]}
            onChange={(e) =>
              onChange({ ...tempo, [key]: Number(e.target.value) })
            }
            className="w-14 text-center bg-gray-800 border border-gray-600 rounded-lg p-2 text-white focus:outline-none focus:border-orange-500"
          />
        </div>
      ))}
      <span className="text-gray-400 text-sm mb-2 ml-1">sec</span>
    </div>
  );
}

export default function WorkoutSetup({ onStart }: Props) {
  const [workoutName, setWorkoutName] = useState("");
  const [exercises, setExercises] = useState<Exercise[]>([
    { ...DEFAULT_EXERCISE, id: generateId() },
  ]);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle");

  function addExercise() {
    setExercises((prev) => [
      ...prev,
      { ...DEFAULT_EXERCISE, tempo: { ...DEFAULT_EXERCISE.tempo }, id: generateId() },
    ]);
  }

  function removeExercise(id: string) {
    setExercises((prev) => prev.filter((e) => e.id !== id));
  }

  function updateExercise(id: string, updates: Partial<Exercise>) {
    setExercises((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...updates } : e))
    );
  }

  function validate() {
    return exercises.every((e) => e.name.trim());
  }

  function handleStart() {
    if (!validate()) {
      alert("Please give each exercise a name.");
      return;
    }
    onStart({ exercises }, workoutName || "My Workout");
  }

  async function handleSave() {
    if (!validate()) {
      alert("Please give each exercise a name.");
      return;
    }
    const name = workoutName.trim() || "My Workout";
    setSaving(true);
    setSaveStatus("idle");
    const result = await saveWorkout(name, exercises);
    setSaving(false);
    if (result?.error) {
      setSaveStatus("error");
    } else {
      setSaveStatus("saved");
      setWorkoutName(name);
      setTimeout(() => setSaveStatus("idle"), 2500);
    }
  }

  function formatRestLabel(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}m ${s > 0 ? s + "s" : ""}` : `${s}s`;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-orange-500">RepTempo</h1>
          <p className="text-gray-400 text-sm mt-1">
            Set up your workout and let the app count for you
          </p>
        </div>
        <Link
          href="/dashboard"
          className="text-sm text-gray-500 hover:text-white transition-colors"
        >
          ← Dashboard
        </Link>
      </div>

      {/* Workout Name */}
      <div className="mb-6">
        <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider">
          Workout Name
        </label>
        <input
          type="text"
          placeholder="e.g. Push Day, Leg Day…"
          value={workoutName}
          onChange={(e) => setWorkoutName(e.target.value)}
          className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-orange-500 text-lg font-medium"
        />
      </div>

      <div className="space-y-6">
        {exercises.map((ex, i) => (
          <div
            key={ex.id}
            className="bg-gray-900 rounded-2xl p-5 border border-gray-800"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-orange-400 font-semibold text-sm uppercase tracking-wider">
                Exercise {i + 1}
              </span>
              {exercises.length > 1 && (
                <button
                  onClick={() => removeExercise(ex.id)}
                  className="text-gray-500 hover:text-red-400 text-sm transition-colors"
                >
                  Remove
                </button>
              )}
            </div>

            <div className="space-y-4">
              <input
                type="text"
                placeholder="Exercise name (e.g. Bench Press)"
                value={ex.name}
                onChange={(e) => updateExercise(ex.id, { name: e.target.value })}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
              />

              {/* Mode toggle */}
              <div className="flex rounded-lg overflow-hidden border border-gray-700 w-fit">
                <button
                  type="button"
                  onClick={() => updateExercise(ex.id, { mode: "reps" })}
                  className={`px-5 py-2 text-sm font-semibold transition-colors ${
                    ex.mode === "reps"
                      ? "bg-orange-500 text-white"
                      : "bg-gray-800 text-gray-400 hover:text-white"
                  }`}
                >
                  Reps
                </button>
                <button
                  type="button"
                  onClick={() => updateExercise(ex.id, { mode: "timer" })}
                  className={`px-5 py-2 text-sm font-semibold transition-colors ${
                    ex.mode === "timer"
                      ? "bg-orange-500 text-white"
                      : "bg-gray-800 text-gray-400 hover:text-white"
                  }`}
                >
                  Timer
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Sets</label>
                  <input
                    type="number"
                    min={1}
                    value={ex.sets}
                    onChange={(e) =>
                      updateExercise(ex.id, { sets: Number(e.target.value) })
                    }
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
                {ex.mode === "reps" ? (
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Reps</label>
                    <input
                      type="number"
                      min={1}
                      value={ex.reps}
                      onChange={(e) =>
                        updateExercise(ex.id, { reps: Number(e.target.value) })
                      }
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Duration (sec)</label>
                    <input
                      type="number"
                      min={5}
                      step={5}
                      value={ex.timerSeconds}
                      onChange={(e) =>
                        updateExercise(ex.id, { timerSeconds: Number(e.target.value) })
                      }
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Rest (sec)</label>
                  <input
                    type="number"
                    min={10}
                    step={15}
                    value={ex.restSeconds}
                    onChange={(e) =>
                      updateExercise(ex.id, {
                        restSeconds: Number(e.target.value),
                      })
                    }
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {ex.mode === "reps" && (
                <div>
                  <label className="block text-xs text-gray-400 mb-2">
                    Tempo (seconds per phase)
                  </label>
                  <TempoInput
                    tempo={ex.tempo}
                    onChange={(tempo) => updateExercise(ex.id, { tempo })}
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    {ex.tempo.phase1}-{ex.tempo.hold1}-{ex.tempo.phase2}-
                    {ex.tempo.hold2} ·{" "}
                    {ex.tempo.phase1 +
                      ex.tempo.hold1 +
                      ex.tempo.phase2 +
                      ex.tempo.hold2}
                    s per rep · Rest: {formatRestLabel(ex.restSeconds)}
                  </p>
                </div>
              )}
              {ex.mode === "timer" && (
                <p className="text-xs text-gray-500">
                  {ex.sets} set{ex.sets !== 1 ? "s" : ""} × {formatRestLabel(ex.timerSeconds)} · Rest: {formatRestLabel(ex.restSeconds)}
                </p>
              )}
            </div>
          </div>
        ))}

        <button
          onClick={addExercise}
          className="w-full py-3 border-2 border-dashed border-gray-700 rounded-2xl text-gray-500 hover:border-orange-500 hover:text-orange-400 transition-colors"
        >
          + Add Exercise
        </button>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 border border-orange-500 rounded-2xl text-orange-400 hover:bg-orange-500 hover:text-white font-semibold transition-colors disabled:opacity-50"
        >
          {saving
            ? "Saving…"
            : saveStatus === "saved"
            ? "✓ Saved to dashboard"
            : saveStatus === "error"
            ? "Error saving — try again"
            : "Save Workout"}
        </button>

        <button
          onClick={handleStart}
          className="w-full py-4 bg-orange-500 hover:bg-orange-600 rounded-2xl text-white font-bold text-lg transition-colors"
        >
          Start Workout
        </button>
      </div>
    </div>
  );
}
