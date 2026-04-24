import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  POSITIONS,
  normalize,
  pitcherRoleLabel,
  type LineupData,
} from "@/lib/lineup";
import styles from "@/components/LineupBuilder.module.css";
import { addCommentByToken } from "./actions";

export const dynamic = "force-dynamic";

type Params = Promise<{ token: string }>;

export default async function SharedGamePage({
  params,
}: {
  params: Params;
}) {
  const { token } = await params;
  const admin = createAdminClient();

  const { data: game } = await admin
    .from("games")
    .select(
      "id, home_team, away_team, location, game_date, lineup_data, share_enabled"
    )
    .eq("share_token", token)
    .maybeSingle();

  if (!game || !game.share_enabled) notFound();

  const data: LineupData = normalize(game.lineup_data);

  const { data: comments } = await admin
    .from("game_comments")
    .select("id, author_name, body, created_at")
    .eq("game_id", game.id)
    .order("created_at", { ascending: false });

  const getName = (id: string | null | undefined) =>
    id ? data.players.find((p) => p.id === id)?.name ?? null : null;

  const battingRows = data.battingOrder
    .map((id, i) => ({ idx: i, name: getName(id) }))
    .filter((r) => r.name);

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-white border-b border-stone-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚾</span>
            <span className="font-bold tracking-tight">Lineup Pro</span>
          </div>
          <a
            href="/"
            className="text-xs text-stone-500 hover:text-stone-800"
          >
            getlineuppro.com →
          </a>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-extrabold">
            {game.home_team}{" "}
            <span className="text-stone-400 font-normal">vs</span>{" "}
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
          <div className="text-xs text-stone-400 mt-2">
            👀 You&apos;re viewing a coach&apos;s shared lineup. Leave feedback
            below.
          </div>
        </div>

        {/* 6 (or up to 9) inning mini-fields */}
        <section className="mb-8">
          <h2 className="text-sm font-bold uppercase tracking-wider text-stone-500 mb-3">
            Defensive Rotation
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 12,
            }}
          >
            {Array.from({ length: data.numInnings }, (_, k) => k + 1).map(
              (i) => {
                const lineup = data.lineups[i] || {};
                return (
                  <div key={i}>
                    <div className={styles.printInningTitle}>Inning {i}</div>
                    <div className={styles.printMiniField}>
                      <svg
                        className={styles.diamondSvg}
                        viewBox="0 0 100 100"
                        preserveAspectRatio="none"
                      >
                        <circle
                          cx="50"
                          cy="68"
                          r="22"
                          fill="#eee"
                          stroke="#999"
                          strokeWidth=".3"
                        />
                        <polygon
                          points="50,57 62,68 50,79 38,68"
                          fill="white"
                          stroke="#999"
                          strokeWidth=".3"
                        />
                        <line
                          x1="50"
                          y1="79"
                          x2="5"
                          y2="34"
                          stroke="#999"
                          strokeWidth=".4"
                        />
                        <line
                          x1="50"
                          y1="79"
                          x2="95"
                          y2="34"
                          stroke="#999"
                          strokeWidth=".4"
                        />
                      </svg>
                      {POSITIONS.map((pos) => {
                        const playerId = lineup[pos.id];
                        const player = playerId
                          ? data.players.find((p) => p.id === playerId)
                          : undefined;
                        return (
                          <div
                            key={pos.id}
                            className={`${styles.slot} ${player ? styles.slotFilled : ""}`}
                            style={{
                              left: `${pos.x}%`,
                              top: `${pos.y}%`,
                            }}
                          >
                            <div className="pos">{pos.id}</div>
                            {player && <div className="who">{player.name}</div>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </section>

        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          <section className="bg-white border border-stone-200 rounded-lg p-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-stone-500 mb-2">
              Batting Order
            </h2>
            {battingRows.length === 0 ? (
              <p className="text-sm text-stone-400 italic">(none set)</p>
            ) : (
              <ol className="space-y-1.5">
                {battingRows.map((r) => (
                  <li key={r.idx} className="flex gap-3 text-sm">
                    <span className="font-bold text-red-600 w-5 text-right">
                      {r.idx + 1}.
                    </span>
                    <span className="font-semibold">{r.name}</span>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section className="bg-white border border-stone-200 rounded-lg p-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-stone-500 mb-2">
              Pitching Plan
            </h2>
            {data.pitchers.length === 0 ? (
              <p className="text-sm text-stone-400 italic">(none set)</p>
            ) : (
              <ol className="space-y-1.5">
                {data.pitchers.map((id, i) => {
                  const name = getName(id);
                  if (!name) return null;
                  return (
                    <li key={`${id}-${i}`} className="flex gap-3 text-sm">
                      <span className="font-bold text-red-600 w-5 text-right">
                        {i + 1}.
                      </span>
                      <span className="font-semibold flex-1">{name}</span>
                      <span className="text-xs text-stone-500 italic">
                        {pitcherRoleLabel(i)}
                      </span>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>
        </div>

        {/* Comments / feedback */}
        <section className="bg-white border border-stone-200 rounded-lg p-5 mb-8">
          <h2 className="text-sm font-bold uppercase tracking-wider text-stone-500 mb-3">
            Feedback for the head coach
          </h2>

          <form action={addCommentByToken} className="space-y-2 mb-5">
            <input type="hidden" name="token" value={token} />
            <input
              type="text"
              name="author_name"
              placeholder="Your name (optional)"
              maxLength={60}
              className="w-full px-3 py-2 border border-stone-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <textarea
              name="body"
              required
              maxLength={2000}
              rows={3}
              placeholder="Suggestions, swaps, or just a 👍?"
              className="w-full px-3 py-2 border border-stone-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded"
            >
              Post comment
            </button>
          </form>

          {comments && comments.length > 0 ? (
            <ul className="space-y-3 border-t border-stone-100 pt-4">
              {comments.map((c) => (
                <li key={c.id}>
                  <div className="flex items-baseline gap-2 mb-0.5">
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
                  <p className="text-sm text-stone-700 whitespace-pre-wrap">
                    {c.body}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-stone-400 italic">
              No comments yet. Be the first.
            </p>
          )}
        </section>

        <footer className="text-center text-xs text-stone-400 pb-8">
          ⚾ Lineup Pro · <a href="/" className="hover:text-stone-600 underline">getlineuppro.com</a>
        </footer>
      </main>
    </div>
  );
}
