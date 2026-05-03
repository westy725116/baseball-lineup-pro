import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { logout } from "../login/actions";
import { deleteGame, copyGame } from "./actions";
import { syncSubscriptionFromStripe, isPro, subStatusLabel } from "@/lib/subscription";
import { isAdmin } from "@/lib/admin";
import { listTeamsAndEnsureDefault, pickActiveTeam } from "@/lib/teams";
import GcScheduleWidget from "@/components/GcScheduleWidget";
import Logo from "@/components/Logo";

type SearchParams = Promise<{ team?: string }>;

export const dynamic = "force-dynamic";

export default async function GamesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { team: requestedTeamId } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const teams = await listTeamsAndEnsureDefault();
  // "all" means no filter; otherwise an actual team_id
  const filterAll = requestedTeamId === "all";
  const active = filterAll ? null : pickActiveTeam(teams, requestedTeamId);

  const gameQuery = supabase
    .from("games")
    .select("*")
    .order("game_date", { ascending: false });
  const { data: games, error } = active
    ? await gameQuery.eq("team_id", active.id)
    : await gameQuery;

  const sub = await syncSubscriptionFromStripe();
  const pro = isPro(sub);
  const statusLabel = subStatusLabel(sub);
  const admin = await isAdmin();

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 w-full">
      <header className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <Link href="/games">
          <Logo height={64} />
        </Link>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-stone-500 hidden sm:inline">{user.email}</span>
          {admin && (
            <Link
              href="/admin"
              className="px-3 py-1.5 text-sm border border-stone-900 bg-stone-900 text-white rounded hover:bg-stone-800"
              title="Admin dashboard"
            >
              ⚙ Admin
            </Link>
          )}
          <Link
            href="/upgrade"
            className={
              pro
                ? "px-3 py-1.5 text-sm border border-emerald-300 bg-emerald-50 text-emerald-800 rounded hover:bg-emerald-100"
                : "px-3 py-1.5 text-sm bg-red-700 hover:bg-red-800 text-white font-semibold rounded"
            }
            title={statusLabel ?? undefined}
          >
            {pro ? `✓ Pro` : "Upgrade"}
          </Link>
          {pro && statusLabel && (
            <span className="hidden sm:inline text-xs text-stone-500">
              {statusLabel.replace("Annual • ", "").replace("Monthly • ", "")}
            </span>
          )}
          <form action={logout}>
            <button className="px-3 py-1.5 text-sm border border-stone-300 rounded hover:bg-stone-100">
              Log out
            </button>
          </form>
        </div>
      </header>

      <nav className="flex items-center gap-1 mb-4 text-sm">
        <Link
          href="/games"
          className="px-3 py-1.5 bg-stone-900 text-white rounded font-medium"
        >
          Games
        </Link>
        <Link
          href="/teams"
          className="px-3 py-1.5 text-stone-700 hover:bg-stone-100 rounded font-medium"
        >
          Teams
        </Link>
        <Link
          href={active ? `/roster?team=${active.id}` : "/roster"}
          className="px-3 py-1.5 text-stone-700 hover:bg-stone-100 rounded font-medium"
        >
          Roster
        </Link>
        <Link
          href={active ? `/players?team=${active.id}` : "/players"}
          className="px-3 py-1.5 text-stone-700 hover:bg-stone-100 rounded font-medium"
        >
          Player History
        </Link>
      </nav>

      {teams.length > 1 && (
        <div className="flex items-center gap-2 mb-3 text-sm flex-wrap">
          <span className="text-stone-500">Team:</span>
          <Link
            href="/games?team=all"
            className={`px-3 py-1 rounded font-medium ${
              filterAll
                ? "bg-stone-900 text-white"
                : "bg-white border border-stone-300 text-stone-700 hover:bg-stone-50"
            }`}
          >
            All
          </Link>
          {teams.map((t) => (
            <Link
              key={t.id}
              href={`/games?team=${t.id}`}
              className={`px-3 py-1 rounded font-medium ${
                t.id === active?.id
                  ? "bg-stone-900 text-white"
                  : "bg-white border border-stone-300 text-stone-700 hover:bg-stone-50"
              }`}
            >
              {t.name}
              {t.season_year ? (
                <span className="ml-1 text-xs opacity-70">{t.season_year}</span>
              ) : null}
            </Link>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">
          Games{" "}
          {active && (
            <span className="text-stone-500 font-normal text-base">
              · {active.name}
              {active.season_year ? ` ${active.season_year}` : ""}
            </span>
          )}
        </h2>
        <Link
          href={active ? `/games/new?team=${active.id}` : "/games/new"}
          className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded font-medium"
        >
          + New Game
        </Link>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 text-sm rounded">
          <strong>Database error:</strong> {error.message}
          <div className="mt-1 text-xs">
            (Most likely the <code>games</code> table hasn&apos;t been created
            in Supabase yet.)
          </div>
        </div>
      )}

      {games && games.length > 0 ? (
        <GamesByYear
          games={games.map((g) => ({
            ...g,
            isHome: g.is_home ?? true,
          }))}
        />
      ) : !error ? (
        <div className="bg-white border border-dashed border-stone-300 rounded-lg p-8 text-center text-stone-500">
          <p className="mb-3">No games yet.</p>
          <Link
            href="/games/new"
            className="text-blue-600 hover:text-blue-700 underline text-sm"
          >
            Create your first game →
          </Link>
        </div>
      ) : null}

      {active?.gc_widget_id && (
        <div className="mt-6">
          <GcScheduleWidget widgetId={active.gc_widget_id} />
        </div>
      )}
    </div>
  );
}

type GameRow = {
  id: string;
  home_team: string;
  away_team: string;
  game_date: string;
  location: string | null;
  home_score: number | null;
  away_score: number | null;
  isHome: boolean;
};

function GamesByYear({ games }: { games: GameRow[] }) {
  // Group by calendar year of the game date, newest first.
  // Default-open the current year; older years collapse to one line.
  const currentYear = new Date().getFullYear();
  const groups = new Map<number, GameRow[]>();
  for (const g of games) {
    const y = new Date(g.game_date).getUTCFullYear();
    if (!groups.has(y)) groups.set(y, []);
    groups.get(y)!.push(g);
  }
  const sortedYears = [...groups.keys()].sort((a, b) => b - a);

  return (
    <div className="space-y-3">
      {sortedYears.map((year) => {
        const list = groups.get(year)!;
        return (
          <details
            key={year}
            open={year === currentYear || sortedYears.length === 1}
            className="bg-stone-50 border border-stone-200 rounded-lg overflow-hidden group"
          >
            <summary className="cursor-pointer select-none px-4 py-2 flex items-center justify-between bg-white hover:bg-stone-50 font-semibold text-sm">
              <span>
                {year}{" "}
                <span className="text-stone-500 font-normal">
                  ({list.length} game{list.length === 1 ? "" : "s"})
                </span>
              </span>
              <span className="text-stone-400 text-xs group-open:hidden">
                ▾
              </span>
              <span className="text-stone-400 text-xs hidden group-open:inline">
                ▴
              </span>
            </summary>
            <ul className="space-y-2 p-3">
              {list.map((g) => (
                <li
                  key={g.id}
                  className={`border border-stone-200 rounded-lg p-4 flex items-center justify-between hover:shadow-sm ${
                    g.isHome ? "bg-white" : "bg-stone-100"
                  }`}
                  title={g.isHome ? "Home game" : "Away game"}
                >
                  <Link href={`/games/${g.id}`} className="flex-1 min-w-0">
                    <div className="font-semibold flex items-center gap-2">
                      <span>
                        {g.home_team}{" "}
                        <span className="text-stone-400">vs</span>{" "}
                        {g.away_team}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                          g.isHome
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-stone-200 text-stone-600"
                        }`}
                      >
                        {g.isHome ? "Home" : "Away"}
                      </span>
                    </div>
                    <div className="text-xs text-stone-500 mt-0.5">
                      {new Date(g.game_date).toLocaleDateString(undefined, {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                      {g.location ? ` • ${g.location}` : ""}
                      {g.home_score != null && g.away_score != null
                        ? ` • Final: ${g.home_score}–${g.away_score}`
                        : ""}
                    </div>
                  </Link>
                  <form action={copyGame}>
                    <input type="hidden" name="id" value={g.id} />
                    <button
                      className="text-stone-400 hover:text-blue-600 text-sm px-2"
                      title="Duplicate this game (same lineup + roster, today's date)"
                      type="submit"
                    >
                      ⧉
                    </button>
                  </form>
                  <form action={deleteGame}>
                    <input type="hidden" name="id" value={g.id} />
                    <button
                      className="text-stone-400 hover:text-red-600 text-sm px-2"
                      title="Delete game"
                      type="submit"
                    >
                      ✕
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          </details>
        );
      })}
    </div>
  );
}
