import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

export default async function GameDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: game, error } = await supabase
    .from("games")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !game) notFound();

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 w-full">
      <header className="mb-6">
        <Link
          href="/games"
          className="text-sm text-stone-500 hover:text-stone-800"
        >
          ← Back to games
        </Link>
        <h1 className="text-2xl font-bold mt-2">
          {game.home_team} <span className="text-stone-400">vs</span>{" "}
          {game.away_team}
        </h1>
        <div className="text-sm text-stone-500 mt-1">
          {new Date(game.game_date).toLocaleDateString(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
          {game.location ? ` • ${game.location}` : ""}
        </div>
      </header>

      <div className="bg-white border border-dashed border-stone-300 rounded-lg p-8 text-center text-stone-500">
        <p className="font-semibold text-stone-700 mb-1">
          Lineup builder coming next
        </p>
        <p className="text-sm">
          Roster, 6-inning defensive lineups, batting order, and player summary
          will live here.
        </p>
      </div>
    </div>
  );
}
