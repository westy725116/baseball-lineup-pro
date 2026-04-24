import { login, signup } from "./actions";

type SearchParams = Promise<{ error?: string; message?: string }>;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { error, message } = await searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white p-6 rounded-lg shadow-sm border border-stone-200">
        <h1 className="text-2xl font-bold mb-1">⚾ Lineup Pro</h1>
        <p className="text-sm text-stone-500 mb-5">
          Sign in or create an account to manage your lineups.
        </p>

        {message && (
          <div className="mb-4 p-2 bg-emerald-50 text-emerald-800 text-sm rounded border border-emerald-200">
            {message}
          </div>
        )}
        {error && (
          <div className="mb-4 p-2 bg-red-50 text-red-800 text-sm rounded border border-red-200">
            {error}
          </div>
        )}

        <form className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1">
              Email
            </label>
            <input
              name="email"
              type="email"
              required
              className="w-full px-3 py-2 border border-stone-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1">
              Password
            </label>
            <input
              name="password"
              type="password"
              required
              minLength={6}
              className="w-full px-3 py-2 border border-stone-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button
              formAction={login}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded text-sm"
            >
              Log in
            </button>
            <button
              formAction={signup}
              className="flex-1 bg-white border border-stone-300 hover:bg-stone-50 text-stone-800 font-medium py-2 rounded text-sm"
            >
              Sign up
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
