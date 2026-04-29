import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

// Shows env-var prefixes (admin-only) so we can verify what the running
// server is actually reading. Useful when Vercel's UI shows stale values.
export default async function DebugPage() {
  if (!(await isAdmin())) redirect("/games");

  const vars: Array<[string, string | undefined]> = [
    ["NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL],
    ["NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY", process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY],
    ["STRIPE_SECRET_KEY", process.env.STRIPE_SECRET_KEY],
    ["STRIPE_PRICE_MONTHLY", process.env.STRIPE_PRICE_MONTHLY],
    ["STRIPE_PRICE_ANNUAL", process.env.STRIPE_PRICE_ANNUAL],
    ["STRIPE_WEBHOOK_SECRET", process.env.STRIPE_WEBHOOK_SECRET],
    ["SUPABASE_SERVICE_ROLE_KEY", process.env.SUPABASE_SERVICE_ROLE_KEY],
    ["ADMIN_EMAILS", process.env.ADMIN_EMAILS],
  ];

  function preview(v: string | undefined): string {
    if (!v) return "❌ NOT SET";
    if (v.length < 16) return v; // short values shown in full
    return `${v.slice(0, 12)}…${v.slice(-4)} (${v.length} chars)`;
  }

  function expected(key: string, v: string | undefined): string {
    if (!v) return "missing";
    if (key === "STRIPE_PRICE_MONTHLY" || key === "STRIPE_PRICE_ANNUAL") {
      return v.startsWith("price_") ? "✓ price_" : "❌ should start with price_";
    }
    if (key === "STRIPE_SECRET_KEY") {
      return v.startsWith("sk_test_") || v.startsWith("sk_live_")
        ? "✓ sk_*"
        : "❌ should start with sk_";
    }
    if (key === "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY") {
      return v.startsWith("pk_test_") || v.startsWith("pk_live_")
        ? "✓ pk_*"
        : "❌ should start with pk_";
    }
    if (key === "STRIPE_WEBHOOK_SECRET") {
      return v.startsWith("whsec_") ? "✓ whsec_" : "❌ should start with whsec_";
    }
    return "—";
  }

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 w-full">
      <header className="mb-6">
        <Link
          href="/admin"
          className="text-sm text-stone-500 hover:text-stone-800"
        >
          ← Admin
        </Link>
        <h1 className="text-2xl font-bold mt-1">Env Var Debug</h1>
        <p className="text-sm text-stone-500">
          Source of truth — what the running server actually reads. If a value
          here doesn&apos;t match Vercel&apos;s UI, redeploy.
        </p>
      </header>

      <div className="bg-white border border-stone-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 text-xs uppercase tracking-wider text-stone-500">
            <tr>
              <th className="text-left px-4 py-2.5">Key</th>
              <th className="text-left px-4 py-2.5">Value (preview)</th>
              <th className="text-left px-4 py-2.5">Looks right?</th>
            </tr>
          </thead>
          <tbody>
            {vars.map(([k, v]) => (
              <tr key={k} className="border-t border-stone-100">
                <td className="px-4 py-3 font-mono text-xs">{k}</td>
                <td className="px-4 py-3 font-mono text-xs">{preview(v)}</td>
                <td className="px-4 py-3 text-xs">{expected(k, v)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-stone-500 mt-4">
        Only the first 12 + last 4 characters are shown. Full values are never
        rendered. Admin-only page.
      </p>
    </div>
  );
}
