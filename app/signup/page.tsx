"use client";

import { useActionState } from "react";
import { signup } from "@/app/actions/auth";
import Link from "next/link";

const initialState = { error: undefined as string | undefined };

export default function SignupPage() {
  const [state, formAction, pending] = useActionState(signup, initialState);

  return (
    <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-4xl font-bold text-orange-500 mb-2 text-center">
          RepTempo
        </h1>
        <p className="text-gray-400 text-center mb-8">Create your account</p>

        <form action={formAction} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Email</label>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Password</label>
            <input
              name="password"
              type="password"
              required
              autoComplete="new-password"
              minLength={6}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-orange-500"
            />
            <p className="text-xs text-gray-600 mt-1">At least 6 characters</p>
          </div>

          {state?.error && (
            <p className="text-red-400 text-sm">{state.error}</p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 rounded-xl text-white font-bold transition-colors"
          >
            {pending ? "Creating account…" : "Create Account"}
          </button>
        </form>

        <p className="text-center text-gray-500 text-sm mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-orange-400 hover:text-orange-300">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
