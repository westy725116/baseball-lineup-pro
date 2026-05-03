import Link from "next/link";
import { signup } from "../login/actions";

type SearchParams = Promise<{ error?: string; message?: string }>;

export default async function SignupPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { error, message } = await searchParams;

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-stone-100 flex flex-col">
      <nav className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">⚾</span>
          <span className="font-bold text-lg tracking-tight">Lineup Pro</span>
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-stone-700 bg-white border border-stone-300 rounded-md hover:bg-stone-50 hover:border-stone-400"
        >
          ← Home
        </Link>
      </nav>

      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm">
          <div className="bg-white p-7 rounded-2xl shadow-lg border border-stone-200">
            <h1 className="text-2xl font-bold mb-1 text-center">
              Create your free account
            </h1>
            <p className="text-sm text-stone-500 text-center mb-6">
              Set up your team in 2 minutes. No credit card needed.
            </p>

            {message && (
              <div className="mb-4 p-3 bg-emerald-50 text-emerald-800 text-sm rounded border border-emerald-200">
                {message}
              </div>
            )}
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-800 text-sm rounded border border-red-200">
                {error}
              </div>
            )}

            <form action={signup} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1.5 uppercase tracking-wider">
                  Email
                </label>
                <input
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="coach@example.com"
                  className="w-full px-3 py-2.5 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1.5 uppercase tracking-wider">
                  Choose a password
                </label>
                <input
                  name="password"
                  type="password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  placeholder="At least 6 characters"
                  className="w-full px-3 py-2.5 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-md text-base shadow-sm"
              >
                Create my account →
              </button>
            </form>
          </div>

          <p className="text-center text-sm text-stone-600 mt-5">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-red-600 hover:text-red-700 underline"
            >
              Log in
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
