export interface Tempo {
  phase1: number; // seconds (e.g., eccentric/going down)
  hold1: number;  // seconds (hold at bottom)
  phase2: number; // seconds (concentric/going up)
  hold2: number;  // seconds (hold at top, optional)
}

export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: number;
  tempo: Tempo;
  restSeconds: number; // rest between sets in seconds
}

export interface WorkoutConfig {
  exercises: Exercise[];
}

export type TempoPhase = "phase1" | "hold1" | "phase2" | "hold2";

export interface SessionState {
  exerciseIndex: number;
  setIndex: number;
  repIndex: number;
  phase: TempoPhase;
  phaseTimeLeft: number;
  isResting: boolean;
  restTimeLeft: number;
  isRunning: boolean;
  isComplete: boolean;
}

export interface SavedWorkout {
  id: string;
  name: string;
  exercises: Exercise[];
  created_at: string;
}

export interface WorkoutLog {
  id: string;
  workout_name: string;
  exercises: Exercise[];
  completed_at: string;
  duration_seconds: number | null;
}
