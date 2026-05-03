import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import LineupBuilder from "@/components/LineupBuilder";
import SharePanel from "@/components/SharePanel";
import EditGameInfo from "@/components/EditGameInfo";
import HelpPanel from "@/components/HelpPanel";
import GameNotes from "@/components/GameNotes";
import { getSubscription, isPro, FREE_INNINGS } from "@/lib/subscription";
import { listTeamsAndEnsureDefault } from "@/lib/teams";
import { deleteComment } from "./share-actions";

export const dynamic = "force-dynamic";

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

  const sub = await getSubscription();
  const pro = isPro(sub);
  const teams = await listTeamsAndEnsureDefault();

  // Fetch comments (RLS only returns them for the owner)
  const { data: comments } = await supabase
    .from("game_comments")
    .select("id, author_name, body, created_at")
    .eq("game_id", game.id)
    .order("created_at", { ascending: false });

  // Compute origin for the share URL
  const headersList = await headers();
  const host = headersList.get("host");
  const proto = headersList.get("x-forwarded-proto") ?? "https";
  const origin = host ? `${proto}://${host}` : "";

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 w-full">
      <header className="mb-5 print:hidden">
        <Link
          href="/games"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-stone-700 bg-white border border-stone-300 rounded-md hover:bg-stone-50 hover:border-stone-400"
        >
          ← Back to games
        </Link>
        <div className="flex items-start justify-between gap-3 mt-2 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold">
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
          </div>
          <div className="flex flex-wrap gap-2">
            <EditGameInfo
              game={{
                id: game.id,
                home_team: game.home_team,
                away_team: game.away_team,
                location: game.location ?? null,
                game_date: game.game_date,
                team_id: game.team_id ?? null,
              }}
              teams={teams.map((t) => ({
                id: t.id,
                name: t.name,
                season_year: t.season_year,
              }))}
            />
            <SharePanel
              gameId={game.id}
              shareToken={game.share_token ?? null}
              shareEnabled={!!game.share_enabled}
              isPro={pro}
              origin={origin}
            />
          </div>
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

      {!pro && (
        <div className="mb-3 print:hidden flex items-center justify-between bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 text-sm">
          <span className="text-amber-900">
            <strong>Free plan:</strong> innings 1–{FREE_INNINGS} only.
          </span>
          <Link
            href="/upgrade"
            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded"
          >
            Unlock all 9 →
          </Link>
        </div>
      )}

      <HelpPanel />

      <LineupBuilder
        gameId={game.id}
        initialData={game.lineup_data}
        isPro={pro}
        freeInnings={FREE_INNINGS}
        teamId={game.team_id ?? null}
      />

      <GameNotes gameId={game.id} initial={game.notes ?? ""} />

      {comments && comments.length > 0 && (
        <section className="mt-6 bg-white border border-stone-200 rounded-lg p-5 print:hidden">
          <h2 className="text-sm font-bold uppercase tracking-wider text-stone-500 mb-3">
            Comments from your shared link ({comments.length})
          </h2>
          <ul className="space-y-3">
            {comments.map((c) => (
              <li
                key={c.id}
                className="border-b border-stone-100 last:border-b-0 pb-3 last:pb-0"
              >
                <div className="flex items-baseline justify-between gap-2 mb-0.5">
                  <div className="flex items-baseline gap-2">
                    <span className="font-semibold text-sm">
                      {c.author_name || "Anonymous"}
                    </span>
                    <span className="text-xs text-stone-400">
                      {new Date(c.created_at).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <form action={deleteComment}>
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="game_id" value={game.id} />
                    <button
                      type="submit"
                      className="text-stone-400 hover:text-red-600 text-xs"
                      title="Delete comment"
                    >
                      ✕
                    </button>
                  </form>
                </div>
                <p className="text-sm text-stone-700 whitespace-pre-wrap">
                  {c.body}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
