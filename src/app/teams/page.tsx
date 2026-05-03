import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { listTeamsAndEnsureDefault } from "@/lib/teams";
import { createTeam, updateTeam, deleteTeam } from "./actions";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ error?: string }>;

export default async function TeamsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { error: errorMsg } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const teams = await listTeamsAndEnsureDefault();

  // Stats per team: # players, # games
  const ids = teams.map((t) => t.id);
  const [{ data: tpRows }, { data: gameRows }] = await Promise.all([
    supabase.from("team_players").select("team_id").in("team_id", ids),
    supabase.from("games").select("team_id").in("team_id", ids),
  ]);
  const playerCount = new Map<string, number>();
  (tpRows ?? []).forEach((r) =>
    playerCount.set(r.team_id, (playerCount.get(r.team_id) ?? 0) + 1)
  );
  const gameCount = new Map<string, number>();
  (gameRows ?? []).forEach((r) =>
    gameCount.set(r.team_id, (gameCount.get(r.team_id) ?? 0) + 1)
  );

  const thisYear = new Date().getFullYear();

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 w-full">
      <header className="mb-6">
        <Link
          href="/games"
          className="text-sm text-stone-500 hover:text-stone-800"
        >
          ← Games
        </Link>
        <h1 className="text-2xl font-bold mt-1">Teams</h1>
        <p className="text-sm text-stone-500">
          One team per season usually. Each has its own roster, games, and
          history.
        </p>
      </header>

      {errorMsg && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 text-sm rounded">
          {errorMsg}
        </div>
      )}

      <section className="bg-white border border-stone-200 rounded-lg p-5 mb-4">
        <h2 className="font-semibold text-sm mb-3 text-stone-700">
          Add team
        </h2>
        <form
          action={createTeam}
          className="grid grid-cols-1 sm:grid-cols-[1fr_120px_auto] gap-2"
        >
          <input
            name="name"
            type="text"
            required
            placeholder='Team name (e.g. "Tigers 12U")'
            maxLength={60}
            className="px-3 py-2 border border-stone-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            name="season_year"
            type="number"
            placeholder="Season year"
            defaultValue={thisYear}
            min={1900}
            max={2100}
            className="px-3 py-2 border border-stone-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded"
          >
            Add team
          </button>
        </form>
      </section>

      <ul className="space-y-2">
        {teams.map((t) => (
          <li
            key={t.id}
            className="bg-white border border-stone-200 rounded-lg p-4"
          >
            <form action={updateTeam} className="space-y-2 mb-2">
              <input type="hidden" name="id" value={t.id} />
              <div className="flex items-center gap-2">
                <input
                  name="name"
                  defaultValue={t.name}
                  className="flex-1 px-2 py-1 border border-stone-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                />
                <input
                  name="season_year"
                  type="number"
                  defaultValue={t.season_year ?? ""}
                  placeholder="Year"
                  min={1900}
                  max={2100}
                  className="w-24 px-2 py-1 border border-stone-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded px-3 py-1"
                >
                  Save
                </button>
              </div>
              <details className="text-xs text-stone-600">
                <summary className="cursor-pointer select-none hover:text-stone-900">
                  GameChanger schedule integration{" "}
                  {t.gc_widget_id && <span className="text-emerald-700">✓ connected</span>}
                </summary>
                <div className="mt-2 pl-2 space-y-1">
                  <input
                    name="gc_widget_id"
                    defaultValue={t.gc_widget_id ?? ""}
                    placeholder="GC schedule widget ID (e.g. b6eb9e18-2a72-4796-…)"
                    className="w-full px-2 py-1 border border-stone-300 rounded font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-[11px] text-stone-500">
                    Paste the <code>widgetId</code> from your GameChanger team
                    schedule embed code. We&apos;ll show the live schedule on
                    your <strong>Games</strong> page when this team is
                    selected.{" "}
                    <a
                      href="https://gc.com"
                      target="_blank"
                      rel="noopener"
                      className="underline"
                    >
                      Find on GC →
                    </a>
                  </p>
                </div>
              </details>
            </form>
            <div className="flex items-center justify-between text-sm">
              <div className="flex gap-3 text-stone-600">
                <Link
                  href={`/roster?team=${t.id}`}
                  className="hover:text-blue-700 hover:underline"
                >
                  📋 {playerCount.get(t.id) ?? 0} players
                </Link>
                <Link
                  href={`/games?team=${t.id}`}
                  className="hover:text-blue-700 hover:underline"
                >
                  ⚾ {gameCount.get(t.id) ?? 0} games
                </Link>
                <Link
                  href={`/players?team=${t.id}`}
                  className="hover:text-blue-700 hover:underline"
                >
                  📊 history
                </Link>
              </div>
              <form action={deleteTeam}>
                <input type="hidden" name="id" value={t.id} />
                <button
                  type="submit"
                  className="text-xs text-stone-400 hover:text-red-600"
                  title="Delete team (also deletes its roster; games stay but become unassigned)"
                >
                  Delete team
                </button>
              </form>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
