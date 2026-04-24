import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe, planFromPriceId, getCurrentPeriodEnd } from "@/lib/stripe";

export type Subscription = {
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  status: string | null;
  plan: "monthly" | "annual" | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean | null;
};

export async function getSubscription(): Promise<Subscription | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  return (data as Subscription) ?? null;
}

// Fetches the latest state from Stripe and writes it back to our DB.
// Use on pages where it's important to be in sync (e.g. /upgrade) so the
// app stays correct even if a webhook event was missed.
export async function syncSubscriptionFromStripe(): Promise<Subscription | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  const customerId = existing?.stripe_customer_id;
  if (!customerId) return (existing as Subscription) ?? null;

  try {
    const subs = await stripe.subscriptions.list({
      customer: customerId,
      status: "all",
      limit: 1,
    });
    const sub = subs.data[0];
    if (!sub) return (existing as Subscription) ?? null;

    const priceId = sub.items.data[0]?.price.id ?? null;
    const periodEnd = getCurrentPeriodEnd(sub);
    // A scheduled cancellation can be reported in either of two fields,
    // depending on Stripe portal config. Treat either as "will cancel".
    const willCancel =
      sub.cancel_at_period_end === true || sub.cancel_at != null;
    const cancelOrPeriodEnd =
      sub.cancel_at != null ? sub.cancel_at : periodEnd;
    const row = {
      user_id: user.id,
      stripe_customer_id: customerId,
      stripe_subscription_id: sub.id,
      stripe_price_id: priceId,
      status: sub.status,
      plan: priceId ? planFromPriceId(priceId) : null,
      current_period_end: cancelOrPeriodEnd
        ? new Date(cancelOrPeriodEnd * 1000).toISOString()
        : null,
      cancel_at_period_end: willCancel,
      updated_at: new Date().toISOString(),
    };
    await admin
      .from("subscriptions")
      .upsert(row, { onConflict: "user_id" });
    return row as Subscription;
  } catch (e) {
    console.error("syncSubscriptionFromStripe failed:", e);
    return (existing as Subscription) ?? null;
  }
}

export function isPro(sub: Subscription | null): boolean {
  if (!sub) return false;
  return sub.status === "active" || sub.status === "trialing";
}

export function subStatusLabel(sub: Subscription | null): string | null {
  if (!sub || !isPro(sub)) return null;
  const planLabel = sub.plan === "annual" ? "Annual" : "Monthly";
  if (sub.cancel_at_period_end && sub.current_period_end) {
    const d = new Date(sub.current_period_end);
    return `${planLabel} • cancels ${d.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
  }
  if (sub.current_period_end) {
    const d = new Date(sub.current_period_end);
    return `${planLabel} • renews ${d.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
  }
  return planLabel;
}

export const FREE_INNINGS = 2;
