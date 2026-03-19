"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import WorkoutSetup from "@/app/components/WorkoutSetup";
import WorkoutSession from "@/app/components/WorkoutSession";
import { WorkoutConfig } from "@/app/types";
import { createClient } from "@/lib/supabase/client";
import { logWorkout } from "@/app/actions/workouts";

function WorkoutPage() {
  const searchParams = useSearchParams();
  const workoutId = searchParams.get("id");

  const [workout, setWorkout] = useState<WorkoutConfig | null>(null);
  const [workoutName, setWorkoutName] = useState("My Workout");
  const [startTime, setStartTime] = useState<number | null>(null);
  const [loading, setLoading] = useState(!!workoutId);

  useEffect(() => {
    if (!workoutId) return;
    const supabase = createClient();
    supabase
      .from("workouts")
      .select("*")
      .eq("id", workoutId)
      .single()
      .then(({ data }) => {
        if (data) {
          setWorkout({ exercises: data.exercises });
          setWorkoutName(data.name);
        }
        setLoading(false);
      });
  }, [workoutId]);

  async function handleStart(config: WorkoutConfig, name: string) {
    setWorkout(config);
    setWorkoutName(name || "My Workout");
    setStartTime(Date.now());
  }

  async function handleFinish() {
    if (startTime && workout) {
      const duration = Math.round((Date.now() - startTime) / 1000);
      await logWorkout(workoutName, workout.exercises, duration);
    }
    setWorkout(null);
    setStartTime(null);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-orange-500 text-lg">Loading…</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      {!workout ? (
        <WorkoutSetup onStart={handleStart} />
      ) : (
        <WorkoutSession workout={workout} onFinish={handleFinish} />
      )}
    </main>
  );
}

export default function WorkoutPageWrapper() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-gray-950 flex items-center justify-center">
          <div className="text-orange-500 text-lg">Loading…</div>
        </main>
      }
    >
      <WorkoutPage />
    </Suspense>
  );
}
