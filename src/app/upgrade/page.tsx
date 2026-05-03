import Link from "next/link";
import Logo from "@/components/Logo";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { syncSubscriptionFromStripe, isPro } from "@/lib/subscription";
import { startCheckout, openCustomerPortal } from "./actions";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ canceled?: string; error?: string }>;

export default async function UpgradePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { canceled, error } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/upgrade");

  // Sync from Stripe so the displayed status is always current,
  // even if a webhook event was missed.
  const sub = await syncSubscriptionFromStripe();
  const pro = isPro(sub);

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-stone-100">
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between">
        <Link href="/games" className="flex items-center gap-2">
          <Logo height={64} />
        </Link>
        <Link
          href="/games"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-stone-700 bg-white border border-stone-300 rounded-md hover:bg-stone-50 hover:border-stone-400"
        >
          ← Back to games
        </Link>
      </nav>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        {pro ? (
          <div className="bg-white border border-emerald-200 p-6 rounded-xl mb-8">
            <h1 className="text-2xl font-bold mb-1">You&apos;re on Pro 🎉</h1>
            <div className="text-stone-700 mb-1">
              Plan:{" "}
              <strong>
                {sub?.plan === "annual" ? "Annual ($99/yr)" : "Monthly ($10/mo)"}
              </strong>
            </div>
            {sub?.cancel_at_period_end && sub.current_period_end && (
              <div className="text-amber-700 text-sm mb-4">
                ⏳ Cancels on{" "}
                <strong>
                  {new Date(sub.current_period_end).toLocaleDateString(undefined, {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </strong>
                . You&apos;ll keep Pro access until then.
              </div>
            )}
            {!sub?.cancel_at_period_end && sub?.current_period_end && (
              <div className="text-stone-500 text-sm mb-4">
                Renews on{" "}
                <strong>
                  {new Date(sub.current_period_end).toLocaleDateString(undefined, {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </strong>
                .
              </div>
            )}
            <form action={openCustomerPortal}>
              <button className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-sm font-semibold rounded">
                Manage subscription
              </button>
            </form>
          </div>
        ) : (
          <h1 className="text-3xl font-bold text-center mb-2">
            Unlock the full lineup
          </h1>
        )}

        {!pro && (
          <p className="text-center text-stone-600 mb-8">
            Free is great for trying it out. Pro is built for the season.
          </p>
        )}

        {canceled && (
          <div className="mb-4 p-3 bg-amber-50 text-amber-800 text-sm rounded border border-amber-200">
            Checkout canceled — no charge.
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-800 text-sm rounded border border-red-200">
            {error}
          </div>
        )}

        {!pro && (
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl border border-stone-200">
              <div className="text-sm font-semibold uppercase text-stone-500 tracking-wider mb-1">
                Monthly
              </div>
              <div className="text-3xl font-bold mb-1">
                $10<span className="text-base font-normal text-stone-500">/mo</span>
              </div>
              <p className="text-xs text-stone-500 mb-4">
                Cancel anytime, prorated.
              </p>
              <form action={startCheckout}>
                <input type="hidden" name="plan" value="monthly" />
                <button className="w-full bg-stone-900 hover:bg-stone-800 text-white font-semibold py-2.5 rounded">
                  Choose Monthly
                </button>
              </form>
            </div>
            <div className="bg-stone-900 text-white p-6 rounded-xl border-2 border-red-600 relative">
              <span className="absolute -top-3 right-4 px-2 py-0.5 text-xs font-bold bg-red-600 rounded-full">
                BEST VALUE
              </span>
              <div className="text-sm font-semibold uppercase text-red-400 tracking-wider mb-1">
                Annual
              </div>
              <div className="text-3xl font-bold mb-1">
                $99<span className="text-base font-normal text-stone-400">/yr</span>
              </div>
              <p className="text-xs text-stone-400 mb-4">
                Save ~17% vs monthly.
              </p>
              <form action={startCheckout}>
                <input type="hidden" name="plan" value="annual" />
                <button className="w-full bg-red-700 hover:bg-red-800 text-white font-semibold py-2.5 rounded">
                  Choose Annual
                </button>
              </form>
            </div>
          </div>
        )}

        <div className="mt-10 text-center text-xs text-stone-500">
          You&apos;ll be redirected to Stripe to enter payment details. Subscription
          state syncs back automatically.
        </div>
      </main>
    </div>
  );
}
