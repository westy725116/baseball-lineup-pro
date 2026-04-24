import Link from "next/link";
import { createGame } from "../actions";

type SearchParams = Promise<{ error?: string }>;

export default async function NewGamePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { error } = await searchParams;
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="max-w-md mx-auto p-4 sm:p-6 w-full">
      <header className="mb-6">
        <Link
          href="/games"
          className="text-sm text-stone-500 hover:text-stone-800"
        >
          ← Back to games
        </Link>
        <h1 className="text-2xl font-bold mt-2">New Game</h1>
      </header>

      {error && (
        <div className="mb-4 p-2 bg-red-50 text-red-800 text-sm rounded border border-red-200">
          {error}
        </div>
      )}

      <form
        action={createGame}
        className="bg-white p-5 rounded-lg shadow-sm border border-stone-200 space-y-4"
      >
        <div>
          <label className="block text-xs font-semibold text-stone-600 mb-1">
            Home team
          </label>
          <input
            name="home_team"
            type="text"
            required
            maxLength={60}
            className="w-full px-3 py-2 border border-stone-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-stone-600 mb-1">
            Away team
          </label>
          <input
            name="away_team"
            type="text"
            required
            maxLength={60}
            className="w-full px-3 py-2 border border-stone-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-stone-600 mb-1">
            Location <span className="text-stone-400 font-normal">(optional)</span>
          </label>
          <input
            name="location"
            type="text"
            maxLength={100}
            className="w-full px-3 py-2 border border-stone-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-stone-600 mb-1">
            Date
          </label>
          <input
            name="game_date"
            type="date"
            required
            defaultValue={today}
            className="w-full px-3 py-2 border border-stone-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded text-sm"
          >
            Create
          </button>
          <Link
            href="/games"
            className="flex-1 text-center bg-white border border-stone-300 hover:bg-stone-50 text-stone-800 font-medium py-2 rounded text-sm"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
