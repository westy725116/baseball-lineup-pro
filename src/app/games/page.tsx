import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { logout } from "../login/actions";
import { deleteGame } from "./actions";
import { syncSubscriptionFromStripe, isPro, subStatusLabel } from "@/lib/subscription";

export const dynamic = "force-dynamic";

export default async function GamesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: games, error } = await supabase
    .from("games")
    .select("*")
    .order("game_date", { ascending: false });

  const sub = await syncSubscriptionFromStripe();
  const pro = isPro(sub);
  const statusLabel = subStatusLabel(sub);

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 w-full">
      <header className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <h1 className="text-2xl font-bold">⚾ Lineup Pro</h1>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-stone-500 hidden sm:inline">{user.email}</span>
          <Link
            href="/upgrade"
            className={
              pro
                ? "px-3 py-1.5 text-sm border border-emerald-300 bg-emerald-50 text-emerald-800 rounded hover:bg-emerald-100"
                : "px-3 py-1.5 text-sm bg-red-600 hover:bg-red-700 text-white font-semibold rounded"
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
          href="/roster"
          className="px-3 py-1.5 text-stone-700 hover:bg-stone-100 rounded font-medium"
        >
          Team Roster
        </Link>
        <Link
          href="/players"
          className="px-3 py-1.5 text-stone-700 hover:bg-stone-100 rounded font-medium"
        >
          Player History
        </Link>
      </nav>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Games</h2>
        <Link
          href="/games/new"
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
        <ul className="space-y-2">
          {games.map((g) => (
            <li
              key={g.id}
              className="bg-white border border-stone-200 rounded-lg p-4 flex items-center justify-between hover:shadow-sm"
            >
              <Link href={`/games/${g.id}`} className="flex-1 min-w-0">
                <div className="font-semibold">
                  {g.home_team} <span className="text-stone-400">vs</span>{" "}
                  {g.away_team}
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
    </div>
  );
}
