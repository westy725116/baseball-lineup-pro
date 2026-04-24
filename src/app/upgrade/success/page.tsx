import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { stripe, planFromPriceId, getCurrentPeriodEnd } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

type SearchParams = Promise<{ session_id?: string }>;

// After Stripe Checkout succeeds, the user lands here.
// We retrieve the session and sync the subscription row immediately for fast UX.
// (The webhook will also fire and keep things consistent long-term.)
export default async function UpgradeSuccessPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { session_id } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  if (session_id) {
    try {
      const session = await stripe.checkout.sessions.retrieve(session_id, {
        expand: ["subscription"],
      });

      if (
        session.subscription &&
        typeof session.subscription !== "string" &&
        session.customer
      ) {
        const sub = session.subscription;
        const priceId = sub.items.data[0]?.price.id ?? null;
        const plan = priceId ? planFromPriceId(priceId) : null;

        const admin = createAdminClient();
        await admin.from("subscriptions").upsert(
          {
            user_id: user.id,
            stripe_customer_id:
              typeof session.customer === "string"
                ? session.customer
                : session.customer.id,
            stripe_subscription_id: sub.id,
            stripe_price_id: priceId,
            status: sub.status,
            plan,
            current_period_end: (() => {
              const e = getCurrentPeriodEnd(sub);
              return e ? new Date(e * 1000).toISOString() : null;
            })(),
            cancel_at_period_end: sub.cancel_at_period_end,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );
      }
    } catch (e) {
      // Non-fatal — the webhook will still sync things even if this fails
      console.error("Failed to sync subscription from success page:", e);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-stone-100 flex items-center justify-center px-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg border border-stone-200 max-w-md text-center">
        <div className="text-5xl mb-3">🎉</div>
        <h1 className="text-2xl font-bold mb-2">Welcome to Pro</h1>
        <p className="text-stone-600 mb-6">
          All innings, unlimited games, and every Pro feature are now unlocked.
        </p>
        <Link
          href="/games"
          className="inline-block px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded"
        >
          Back to games →
        </Link>
      </div>
    </div>
  );
}
