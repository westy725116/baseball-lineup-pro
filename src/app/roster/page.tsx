import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { addTeamPlayer } from "./actions";
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

      <section className="bg-white border border-stone-200 rounded-lg p-5 mb-4">
        <h2 className="font-semibold text-sm mb-3 text-stone-700">
          Add player
        </h2>
        <form
          action={addTeamPlayer}
          className="grid grid-cols-1 sm:grid-cols-[1fr_100px_auto] gap-2"
        >
          <input
            name="name"
            type="text"
            required
            placeholder="Player name"
            maxLength={60}
            className="px-3 py-2 border border-stone-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            name="jersey_number"
            type="text"
            placeholder="#"
            maxLength={6}
            className="px-3 py-2 border border-stone-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded"
          >
            Add
          </button>
        </form>
      </section>

      {players && players.length > 0 ? (
        <>
          <p className="text-xs text-stone-500 mb-2 px-1">
            Drag the ⋮⋮ handle to reorder.
          </p>
          <RosterList
            initial={players.map((p) => ({
              id: p.id,
              name: p.name,
              jersey_number: p.jersey_number,
            }))}
          />
        </>
      ) : !error ? (
        <div className="bg-white border border-dashed border-stone-300 rounded-lg p-8 text-center text-stone-500">
          <p className="mb-1">No players yet.</p>
          <p className="text-xs">
            Add your team above. Then in any game, click{" "}
            <strong>Load roster</strong> to drop them all in.
          </p>
        </div>
      ) : null}
    </div>
  );
}
