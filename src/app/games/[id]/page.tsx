import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import LineupBuilder from "@/components/LineupBuilder";

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
    <div className="max-w-6xl mx-auto p-4 sm:p-6 w-full">
      <header className="mb-5 print:hidden">
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

      {/* Print header */}
      <div className="hidden print:block mb-3">
        <h1 className="text-xl font-bold text-center">
          {game.home_team} vs {game.away_team}
        </h1>
        <div className="text-xs text-center text-stone-600">
          {new Date(game.game_date).toLocaleDateString(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
          {game.location ? ` • ${game.location}` : ""}
        </div>
      </div>

      <LineupBuilder gameId={game.id} initialData={game.lineup_data} />
    </div>
  );
}
