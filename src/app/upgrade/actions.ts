"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { stripe, PRICE_MONTHLY, PRICE_ANNUAL } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

async function getOrCreateCustomerId(
  userId: string,
  email: string
): Promise<string> {
  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing?.stripe_customer_id) return existing.stripe_customer_id;

  const customer = await stripe.customers.create({
    email,
    metadata: { user_id: userId },
  });

  await admin.from("subscriptions").upsert(
    {
      user_id: userId,
      stripe_customer_id: customer.id,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  return customer.id;
}

export async function startCheckout(formData: FormData) {
  const plan = formData.get("plan") as "monthly" | "annual";
  if (plan !== "monthly" && plan !== "annual") {
    redirect("/upgrade?error=invalid-plan");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email) redirect("/login");

  const customerId = await getOrCreateCustomerId(user.id, user.email);
  const headersList = await headers();
  const origin =
    headersList.get("origin") ||
    `https://${headersList.get("host")}` ||
    "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [
      {
        price: plan === "monthly" ? PRICE_MONTHLY : PRICE_ANNUAL,
        quantity: 1,
      },
    ],
    success_url: `${origin}/upgrade/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/upgrade?canceled=1`,
    allow_promotion_codes: true,
    subscription_data: {
      metadata: { user_id: user.id },
    },
  });

  redirect(session.url!);
}

export async function openCustomerPortal() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();
  const { data: sub } = await admin
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!sub?.stripe_customer_id) {
    redirect("/upgrade");
  }

  const headersList = await headers();
  const origin =
    headersList.get("origin") ||
    `https://${headersList.get("host")}` ||
    "http://localhost:3000";

  const portal = await stripe.billingPortal.sessions.create({
    customer: sub.stripe_customer_id,
    return_url: `${origin}/games`,
  });

  redirect(portal.url);
}
