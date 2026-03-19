"use client";

import { useState } from "react";
import WorkoutSetup from "./components/WorkoutSetup";
import WorkoutSession from "./components/WorkoutSession";
import { WorkoutConfig } from "./types";

export default function Home() {
  const [workout, setWorkout] = useState<WorkoutConfig | null>(null);

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      {!workout ? (
        <WorkoutSetup onStart={setWorkout} />
      ) : (
        <WorkoutSession workout={workout} onFinish={() => setWorkout(null)} />
      )}
    </main>
  );
}
