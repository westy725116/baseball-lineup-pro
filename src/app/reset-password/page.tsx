import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { setNewPassword } from "./actions";

type SearchParams = Promise<{ error?: string }>;

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { error } = await searchParams;

  // Must be in a recovery session (the auth callback puts us here)
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/forgot-password");

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-stone-100 flex flex-col">
      <nav className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">⚾</span>
          <span className="font-bold text-lg tracking-tight">Lineup Pro</span>
        </Link>
      </nav>

      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm">
          <div className="bg-white p-7 rounded-2xl shadow-lg border border-stone-200">
            <h1 className="text-2xl font-bold mb-1 text-center">
              Set a new password
            </h1>
            <p className="text-sm text-stone-500 text-center mb-6">
              Choose a new password for{" "}
              <span className="font-semibold text-stone-700">{user.email}</span>.
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-800 text-sm rounded border border-red-200">
                {error}
              </div>
            )}

            <form action={setNewPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1.5 uppercase tracking-wider">
                  New password
                </label>
                <input
                  name="password"
                  type="password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="w-full px-3 py-2.5 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1.5 uppercase tracking-wider">
                  Confirm password
                </label>
                <input
                  name="confirm"
                  type="password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="w-full px-3 py-2.5 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-red-700 hover:bg-red-800 text-white font-semibold py-2.5 rounded-md text-sm shadow-sm"
              >
                Update password
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
