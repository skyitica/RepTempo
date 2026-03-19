import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { logout } from "@/app/actions/auth";
import { deleteWorkout } from "@/app/actions/workouts";
import { SavedWorkout, WorkoutLog } from "@/app/types";

export default async function Dashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: workouts }, { data: logs }] = await Promise.all([
    supabase
      .from("workouts")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("workout_logs")
      .select("*")
      .order("completed_at", { ascending: false })
      .limit(10),
  ]);

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-orange-500">RepTempo</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-500 text-sm hidden sm:block">
              {user.email}
            </span>
            <form action={logout}>
              <button
                type="submit"
                className="text-sm text-gray-500 hover:text-white transition-colors"
              >
                Log out
              </button>
            </form>
          </div>
        </div>

        {/* New Workout CTA */}
        <Link
          href="/workout"
          className="block w-full py-4 bg-orange-500 hover:bg-orange-600 rounded-2xl text-white font-bold text-lg text-center transition-colors mb-8"
        >
          + New Workout
        </Link>

        {/* Saved Workouts */}
        {workouts && workouts.length > 0 && (
          <section className="mb-8">
            <h2 className="text-base font-semibold text-gray-400 uppercase tracking-wider mb-4">
              Saved Workouts
            </h2>
            <div className="space-y-3">
              {(workouts as SavedWorkout[]).map((w) => (
                <div
                  key={w.id}
                  className="bg-gray-900 rounded-xl p-4 border border-gray-800 flex items-center justify-between"
                >
                  <div>
                    <p className="font-semibold">{w.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {w.exercises.length} exercise
                      {w.exercises.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="flex gap-4 items-center">
                    <Link
                      href={`/workout?id=${w.id}`}
                      className="text-sm font-medium text-orange-400 hover:text-orange-300 transition-colors"
                    >
                      Start
                    </Link>
                    <form
                      action={async () => {
                        "use server";
                        await deleteWorkout(w.id);
                      }}
                    >
                      <button
                        type="submit"
                        className="text-sm text-gray-600 hover:text-red-400 transition-colors"
                      >
                        Delete
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Recent Sessions */}
        {logs && logs.length > 0 && (
          <section>
            <h2 className="text-base font-semibold text-gray-400 uppercase tracking-wider mb-4">
              Recent Sessions
            </h2>
            <div className="space-y-3">
              {(logs as WorkoutLog[]).map((log) => (
                <div
                  key={log.id}
                  className="bg-gray-900 rounded-xl p-4 border border-gray-800"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{log.workout_name}</p>
                    <span className="text-xs text-gray-500">
                      {new Date(log.completed_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  {log.duration_seconds && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      {Math.round(log.duration_seconds / 60)} min
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Empty state */}
        {(!workouts || workouts.length === 0) &&
          (!logs || logs.length === 0) && (
            <div className="text-center py-20 text-gray-600">
              <p className="text-2xl mb-2">💪</p>
              <p className="text-lg font-medium">No workouts yet</p>
              <p className="text-sm mt-1">
                Create your first workout to get started
              </p>
            </div>
          )}
      </div>
    </main>
  );
}
