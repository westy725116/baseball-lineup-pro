import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { listTeamsAndEnsureDefault, pickActiveTeam } from "@/lib/teams";
import { createGame } from "../actions";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ error?: string; team?: string }>;

export default async function NewGamePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { error, team: requestedTeamId } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const teams = await listTeamsAndEnsureDefault();
  if (teams.length === 0) {
    redirect("/teams");
  }
  const active = pickActiveTeam(teams, requestedTeamId);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="max-w-md mx-auto p-4 sm:p-6 w-full">
      <header className="mb-6">
        <Link
          href="/games"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-stone-700 bg-white border border-stone-300 rounded-md hover:bg-stone-50 hover:border-stone-400"
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
            Team
          </label>
          <select
            name="team_id"
            required
            defaultValue={active?.id}
            className="w-full px-3 py-2 border border-stone-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
                {t.season_year ? ` (${t.season_year})` : ""}
              </option>
            ))}
          </select>
        </div>
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
        <label className="flex items-center gap-2 px-3 py-2 border border-stone-300 rounded bg-stone-50 cursor-pointer">
          <input
            name="is_home"
            type="checkbox"
            defaultChecked
            className="w-4 h-4 accent-emerald-600"
          />
          <span className="text-sm font-semibold text-stone-700">
            We&apos;re the home team for this game
          </span>
        </label>
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
