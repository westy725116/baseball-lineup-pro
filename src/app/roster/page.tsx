import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import RosterList from "./RosterList";

export const dynamic = "force-dynamic";

export default async function RosterPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: players, error } = await supabase
    .from("team_players")
    .select("id, name, jersey_number, sort_order")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 w-full">
      <header className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <div>
          <Link
            href="/games"
            className="text-sm text-stone-500 hover:text-stone-800"
          >
            ← Games
          </Link>
          <h1 className="text-2xl font-bold mt-1">Team Roster</h1>
          <p className="text-sm text-stone-500">
            Save players once. Pull them into any game with one click.
          </p>
        </div>
      </header>

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
          initial={(players ?? []).map((p) => ({
            id: p.id,
            name: p.name,
            jersey_number: p.jersey_number,
          }))}
        />
      )}
    </div>
  );
}
