import { createClient } from "@/lib/supabase/server";

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

export function isPro(sub: Subscription | null): boolean {
  if (!sub) return false;
  return sub.status === "active" || sub.status === "trialing";
}

export const FREE_INNINGS = 2;
