import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/admin";
import {
  confirmUser,
  generateRecoveryLink,
  generateMagicLink,
  deleteUser,
} from "./actions";
import AdminLinkBanner from "./AdminLinkBanner";

export const dynamic = "force-dynamic";

type SubRow = {
  user_id: string;
  status: string | null;
  plan: "monthly" | "annual" | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean | null;
};

type SearchParams = Promise<{
  notice?: string;
  for?: string;
  link?: string;
  kind?: string;
}>;

export default async function AdminPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { notice, for: forEmail, link, kind } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!(await isAdmin())) redirect("/games");

  const admin = createAdminClient();

  // 1. List users (first 1000 — paginate later if needed)
  const { data: usersResp } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  const users = usersResp?.users ?? [];

  // 2. Fetch all subscriptions
  const { data: subs } = await admin.from("subscriptions").select("*");
  const subByUser = new Map<string, SubRow>();
  (subs ?? []).forEach((s) => subByUser.set(s.user_id, s as SubRow));

  // 3. Game counts per user
  const { data: gameRows } = await admin
    .from("games")
    .select("user_id, updated_at");
  const gameCount = new Map<string, number>();
  const lastActivity = new Map<string, string>();
  (gameRows ?? []).forEach((g) => {
    gameCount.set(g.user_id, (gameCount.get(g.user_id) ?? 0) + 1);
    const prev = lastActivity.get(g.user_id);
    if (!prev || g.updated_at > prev) lastActivity.set(g.user_id, g.updated_at);
  });

  // 4. Team-player counts per user
  const { data: tpRows } = await admin.from("team_players").select("user_id");
  const tpCount = new Map<string, number>();
  (tpRows ?? []).forEach((r) =>
    tpCount.set(r.user_id, (tpCount.get(r.user_id) ?? 0) + 1)
  );

  // Summary
  const totalUsers = users.length;
  let proCount = 0;
  let monthlyMrr = 0;
  for (const u of users) {
    const s = subByUser.get(u.id);
    if (s && (s.status === "active" || s.status === "trialing")) {
      proCount++;
      if (s.plan === "monthly") monthlyMrr += 10;
      else if (s.plan === "annual") monthlyMrr += 99 / 12;
    }
  }
  const conversionPct =
    totalUsers > 0 ? Math.round((proCount / totalUsers) * 100) : 0;

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 w-full">
      <header className="mb-6 flex items-start justify-between flex-wrap gap-3">
        <div>
          <Link
            href="/games"
            className="text-sm text-stone-500 hover:text-stone-800"
          >
            ← Back to app
          </Link>
          <h1 className="text-2xl font-bold mt-1">⚙ Admin</h1>
          <p className="text-sm text-stone-500">
            All users + subscription data. You can see this because your email
            is in the <code>ADMIN_EMAILS</code> allowlist.
          </p>
        </div>
      </header>

      {notice && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 text-blue-900 text-sm rounded">
          {notice}
        </div>
      )}
      {link && forEmail && (
        <AdminLinkBanner
          link={link}
          forEmail={forEmail}
          kind={kind === "magic" ? "magic" : "reset"}
        />
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <SummaryCard label="Total users" value={totalUsers.toString()} />
        <SummaryCard
          label="Pro users"
          value={`${proCount} (${conversionPct}%)`}
        />
        <SummaryCard
          label="Est. MRR"
          value={`$${monthlyMrr.toFixed(0)}`}
        />
        <SummaryCard
          label="Total games"
          value={(gameRows?.length ?? 0).toString()}
        />
      </div>

      <div className="bg-white border border-stone-200 rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 text-xs uppercase tracking-wider text-stone-500">
            <tr>
              <th className="text-left px-4 py-2.5">User</th>
              <th className="text-left px-4 py-2.5">Joined</th>
              <th className="text-left px-4 py-2.5">Plan</th>
              <th className="text-left px-4 py-2.5">Sub</th>
              <th className="text-center px-4 py-2.5">Games</th>
              <th className="text-center px-4 py-2.5">Roster</th>
              <th className="text-left px-4 py-2.5">Last activity</th>
              <th className="text-right px-4 py-2.5">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users
              .slice()
              .sort((a, b) =>
                (b.created_at ?? "").localeCompare(a.created_at ?? "")
              )
              .map((u) => {
                const s = subByUser.get(u.id);
                const isPro = s?.status === "active" || s?.status === "trialing";
                const planLabel = !isPro
                  ? "Free"
                  : s?.plan === "annual"
                    ? "Annual"
                    : "Monthly";
                const last = lastActivity.get(u.id);
                const confirmed = !!u.email_confirmed_at;
                return (
                  <tr key={u.id} className="border-t border-stone-100 align-top">
                    <td className="px-4 py-3 font-mono text-xs">
                      <div>{u.email ?? "—"}</div>
                      {!confirmed && (
                        <span
                          className="inline-block mt-1 text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded"
                          title="Email not confirmed — they cannot log in until they click the confirm link or you confirm them here"
                        >
                          Unconfirmed
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-stone-500">
                      {fmtDate(u.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded ${
                          isPro
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-stone-100 text-stone-600"
                        }`}
                      >
                        {planLabel}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {!s ? (
                        <span className="text-stone-400">—</span>
                      ) : s.cancel_at_period_end && s.current_period_end ? (
                        <span className="text-amber-700">
                          Cancels {fmtDate(s.current_period_end)}
                        </span>
                      ) : s.current_period_end ? (
                        <span className="text-stone-600">
                          Renews {fmtDate(s.current_period_end)}
                        </span>
                      ) : (
                        <span className="text-stone-500">{s.status ?? "—"}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {gameCount.get(u.id) ?? 0}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {tpCount.get(u.id) ?? 0}
                    </td>
                    <td className="px-4 py-3 text-xs text-stone-500">
                      {last ? fmtDate(last) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right text-xs">
                      <div className="inline-flex flex-wrap gap-1 justify-end">
                        {!confirmed && (
                          <form action={confirmUser}>
                            <input type="hidden" name="user_id" value={u.id} />
                            <input type="hidden" name="email" value={u.email ?? ""} />
                            <button
                              type="submit"
                              className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded"
                              title="Mark email as confirmed"
                            >
                              Confirm
                            </button>
                          </form>
                        )}
                        <form action={generateRecoveryLink}>
                          <input type="hidden" name="email" value={u.email ?? ""} />
                          <button
                            type="submit"
                            className="px-2 py-1 border border-stone-300 bg-white hover:bg-stone-50 font-semibold rounded"
                            title="Generate a password-reset link (no email sent)"
                          >
                            Reset link
                          </button>
                        </form>
                        <form action={generateMagicLink}>
                          <input type="hidden" name="email" value={u.email ?? ""} />
                          <button
                            type="submit"
                            className="px-2 py-1 border border-stone-300 bg-white hover:bg-stone-50 font-semibold rounded"
                            title="Generate a one-time login link (no email sent)"
                          >
                            Magic link
                          </button>
                        </form>
                        <form action={deleteUser}>
                          <input type="hidden" name="user_id" value={u.id} />
                          <input type="hidden" name="email" value={u.email ?? ""} />
                          <button
                            type="submit"
                            className="px-2 py-1 text-red-600 hover:bg-red-50 font-semibold rounded"
                            title="Permanently delete this user and all their data"
                          >
                            Delete
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white border border-stone-200 rounded-lg p-4">
      <div className="text-xs uppercase tracking-wider text-stone-500 mb-1">
        {label}
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}

function fmtDate(iso: string | undefined | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "2-digit",
  });
}
