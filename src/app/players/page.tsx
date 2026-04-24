import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { normalize, type LineupData } from "@/lib/lineup";

export const dynamic = "force-dynamic";

type Stats = {
  games: number;
  innings: number;
  positions: Map<string, number>;
};

export default async function PlayersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: teamPlayers, error: tpErr }, { data: games }] =
    await Promise.all([
      supabase
        .from("team_players")
        .select("id, name, jersey_number")
        .order("name"),
      supabase
        .from("games")
        .select("id, home_team, away_team, game_date, lineup_data")
        .order("game_date", { ascending: false }),
    ]);

  // Aggregate stats per team_player_id
  const stats = new Map<string, Stats>();

  for (const g of games ?? []) {
    const data: LineupData = normalize(g.lineup_data);
    // Map team_player_id -> inline player id (this game)
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
      <header className="mb-6">
        <Link
          href="/games"
          className="text-sm text-stone-500 hover:text-stone-800"
        >
          ← Games
        </Link>
        <h1 className="text-2xl font-bold mt-1">Player History</h1>
        <p className="text-sm text-stone-500">
          Lifetime stats for everyone on your team roster.
        </p>
      </header>

      {tpErr && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 text-sm rounded">
          <strong>Database error:</strong> {tpErr.message}
        </div>
      )}

      {(!teamPlayers || teamPlayers.length === 0) && !tpErr && (
        <div className="bg-white border border-dashed border-stone-300 rounded-lg p-8 text-center text-stone-500">
          <p className="mb-2">No players on your team yet.</p>
          <Link
            href="/roster"
            className="text-blue-600 hover:text-blue-800 underline text-sm"
          >
            Add players to your team roster →
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
                    <td className="text-center px-4 py-3">
                      {s?.games ?? 0}
                    </td>
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

      {games && games.length === 0 && teamPlayers && teamPlayers.length > 0 && (
        <p className="text-xs text-stone-500 mt-4 text-center">
          Stats fill in as you save games with these players on the field.
        </p>
      )}
    </div>
  );
}
