import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { listTeamsAndEnsureDefault, pickActiveTeam } from "@/lib/teams";
import RosterList from "./RosterList";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ team?: string }>;

export default async function RosterPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { team: requestedTeamId } = await searchParams;
  const teams = await listTeamsAndEnsureDefault();
  const active = pickActiveTeam(teams, requestedTeamId);

  if (!active) {
    redirect("/teams");
  }

  const { data: players, error } = await supabase
    .from("team_players")
    .select(
      "id, name, jersey_number, sort_order, notes, photo_url, preferred_positions, avoid_positions"
    )
    .eq("team_id", active.id)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 w-full">
      <header className="mb-6">
        <Link
          href="/games"
          className="text-sm text-stone-500 hover:text-stone-800"
        >
          ← Games
        </Link>
        <h1 className="text-2xl font-bold mt-1">Roster</h1>
        <p className="text-sm text-stone-500">
          Players on{" "}
          <strong>{active.name}</strong>
          {active.season_year ? ` (${active.season_year})` : ""}.
        </p>
      </header>

      {teams.length > 1 && (
        <div className="flex items-center gap-2 mb-4 text-sm">
          <span className="text-stone-500">Team:</span>
          <div className="flex flex-wrap gap-1">
            {teams.map((t) => (
              <Link
                key={t.id}
                href={`/roster?team=${t.id}`}
                className={`px-3 py-1 rounded font-medium ${
                  t.id === active.id
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
            <Link
              href="/teams"
              className="px-3 py-1 rounded font-medium bg-white border border-dashed border-stone-300 text-stone-500 hover:bg-stone-50"
            >
              + Manage teams
            </Link>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 text-sm rounded">
          <strong>Database error:</strong> {error.message}
          <div className="mt-1 text-xs">
            (You may need to re-run <code>supabase/schema.sql</code>.)
          </div>
        </div>
      )}

      {!error && (
        <RosterList
          teamId={active.id}
          initial={(players ?? []).map((p) => ({
            id: p.id,
            name: p.name,
            jersey_number: p.jersey_number,
            notes: p.notes ?? "",
            photo_url: p.photo_url ?? null,
            preferred_positions: p.preferred_positions ?? [],
            avoid_positions: p.avoid_positions ?? [],
          }))}
        />
      )}
    </div>
  );
}
