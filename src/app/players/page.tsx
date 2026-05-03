import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { normalize, type LineupData } from "@/lib/lineup";
import { listTeamsAndEnsureDefault, pickActiveTeam } from "@/lib/teams";

export const dynamic = "force-dynamic";

type Stats = {
  games: number;
  innings: number;
  positions: Map<string, number>;
};

type SearchParams = Promise<{ team?: string; year?: string }>;

export default async function PlayersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { team: requestedTeamId, year: requestedYear } = await searchParams;
  const teams = await listTeamsAndEnsureDefault();

  // "all" means cross-team; otherwise a specific team_id (default to first team)
  const filterAllTeams = requestedTeamId === "all";
  const active = filterAllTeams ? null : pickActiveTeam(teams, requestedTeamId);

  // Roster source
  const teamPlayerQuery = supabase
    .from("team_players")
    .select("id, name, jersey_number, team_id")
    .order("name");
  const { data: teamPlayers, error: tpErr } = active
    ? await teamPlayerQuery.eq("team_id", active.id)
    : await teamPlayerQuery;

  // Games source
  const gameQuery = supabase
    .from("games")
    .select("id, home_team, away_team, game_date, lineup_data, team_id")
    .order("game_date", { ascending: false });
  const { data: gamesAll } = active
    ? await gameQuery.eq("team_id", active.id)
    : await gameQuery;

  // Year filtering
  const allYears = new Set<number>();
  (gamesAll ?? []).forEach((g) => {
    if (g.game_date) allYears.add(new Date(g.game_date).getUTCFullYear());
  });
  const yearOptions = [...allYears].sort((a, b) => b - a);
  const filteredYear = requestedYear ? parseInt(requestedYear, 10) : null;

  const games = (gamesAll ?? []).filter((g) => {
    if (filteredYear == null) return true;
    if (!g.game_date) return false;
    return new Date(g.game_date).getUTCFullYear() === filteredYear;
  });

  // Aggregate stats per team_player_id
  const stats = new Map<string, Stats>();

  for (const g of games) {
    const data: LineupData = normalize(g.lineup_data);
    const tpToInline = new Map<string, string>();
    for (const p of data.players) {
      if (p.team_player_id) tpToInline.set(p.team_player_id, p.id);
    }

    for (const [tpId, inlineId] of tpToInline.entries()) {
      const s =
        stats.get(tpId) ??
        ({ games: 0, innings: 0, positions: new Map() } as Stats);
      s.games += 1;
      for (let i = 1; i <= data.numInnings; i++) {
        const inning = data.lineups[i] ?? {};
        for (const [pos, pid] of Object.entries(inning)) {
          if (pid === inlineId) {
            s.innings += 1;
            s.positions.set(pos, (s.positions.get(pos) ?? 0) + 1);
          }
        }
      }
      stats.set(tpId, s);
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 w-full">
      <header className="mb-4">
        <Link
          href="/games"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-stone-700 bg-white border border-stone-300 rounded-md hover:bg-stone-50 hover:border-stone-400"
        >
          ← Games
        </Link>
        <h1 className="text-2xl font-bold mt-1">Player History</h1>
        <p className="text-sm text-stone-500">
          Lifetime stats across saved games.
        </p>
      </header>

      <div className="space-y-2 mb-4">
        {teams.length > 1 && (
          <div className="flex items-center gap-2 text-sm flex-wrap">
            <span className="text-stone-500">Team:</span>
            <Link
              href={`/players?team=all${requestedYear ? `&year=${requestedYear}` : ""}`}
              className={`px-3 py-1 rounded font-medium ${
                filterAllTeams
                  ? "bg-stone-900 text-white"
                  : "bg-white border border-stone-300 text-stone-700 hover:bg-stone-50"
              }`}
            >
              All
            </Link>
            {teams.map((t) => (
              <Link
                key={t.id}
                href={`/players?team=${t.id}${requestedYear ? `&year=${requestedYear}` : ""}`}
                className={`px-3 py-1 rounded font-medium ${
                  t.id === active?.id
                    ? "bg-stone-900 text-white"
                    : "bg-white border border-stone-300 text-stone-700 hover:bg-stone-50"
                }`}
              >
                {t.name}
                {t.season_year ? (
                  <span className="ml-1 text-xs opacity-70">
                    {t.season_year}
                  </span>
                ) : null}
              </Link>
            ))}
          </div>
        )}

        {yearOptions.length > 1 && (
          <div className="flex items-center gap-2 text-sm flex-wrap">
            <span className="text-stone-500">Year:</span>
            <Link
              href={`/players?team=${requestedTeamId ?? (active?.id ?? "all")}`}
              className={`px-3 py-1 rounded font-medium ${
                !filteredYear
                  ? "bg-stone-900 text-white"
                  : "bg-white border border-stone-300 text-stone-700 hover:bg-stone-50"
              }`}
            >
              All years
            </Link>
            {yearOptions.map((y) => (
              <Link
                key={y}
                href={`/players?team=${requestedTeamId ?? (active?.id ?? "all")}&year=${y}`}
                className={`px-3 py-1 rounded font-medium ${
                  filteredYear === y
                    ? "bg-stone-900 text-white"
                    : "bg-white border border-stone-300 text-stone-700 hover:bg-stone-50"
                }`}
              >
                {y}
              </Link>
            ))}
          </div>
        )}
      </div>

      {tpErr && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 text-sm rounded">
          <strong>Database error:</strong> {tpErr.message}
        </div>
      )}

      {(!teamPlayers || teamPlayers.length === 0) && !tpErr && (
        <div className="bg-white border border-dashed border-stone-300 rounded-lg p-8 text-center text-stone-500">
          <p className="mb-2">No players on this team yet.</p>
          <Link
            href={active ? `/roster?team=${active.id}` : "/roster"}
            className="text-blue-600 hover:text-blue-800 underline text-sm"
          >
            Add players to the roster →
          </Link>
        </div>
      )}

      {teamPlayers && teamPlayers.length > 0 && (
        <div className="bg-white border border-stone-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 text-xs uppercase tracking-wider text-stone-500">
              <tr>
                <th className="text-left px-4 py-2.5">Player</th>
                <th className="text-center px-4 py-2.5">Games</th>
                <th className="text-center px-4 py-2.5">Innings played</th>
                <th className="text-left px-4 py-2.5">Top positions</th>
              </tr>
            </thead>
            <tbody>
              {teamPlayers.map((p) => {
                const s = stats.get(p.id);
                const top = s
                  ? [...s.positions.entries()]
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 4)
                  : [];
                return (
                  <tr key={p.id} className="border-t border-stone-100">
                    <td className="px-4 py-3 font-semibold">
                      {p.jersey_number && (
                        <span className="text-stone-400 mr-2">
                          #{p.jersey_number}
                        </span>
                      )}
                      {p.name}
                    </td>
                    <td className="text-center px-4 py-3">{s?.games ?? 0}</td>
                    <td className="text-center px-4 py-3">
                      {s?.innings ?? 0}
                    </td>
                    <td className="px-4 py-3">
                      {top.length === 0 ? (
                        <span className="text-stone-400 italic text-xs">
                          —
                        </span>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {top.map(([pos, count]) => (
                            <span
                              key={pos}
                              className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-800 text-xs font-semibold rounded"
                            >
                              {pos}
                              <span className="text-red-500 font-normal">
                                ×{count}
                              </span>
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
