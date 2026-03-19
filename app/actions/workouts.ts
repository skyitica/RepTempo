"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { Exercise } from "@/app/types";

export async function saveWorkout(name: string, exercises: Exercise[]) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data, error } = await supabase
    .from("workouts")
    .insert({ user_id: user.id, name, exercises })
    .select()
    .single();

  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  return { data };
}

export async function deleteWorkout(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("workouts").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  return { success: true };
}

export async function logWorkout(
  workoutName: string,
  exercises: Exercise[],
  durationSeconds: number
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("workout_logs").insert({
    user_id: user.id,
    workout_name: workoutName,
    exercises,
    duration_seconds: durationSeconds,
  });

  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  return { success: true };
}
