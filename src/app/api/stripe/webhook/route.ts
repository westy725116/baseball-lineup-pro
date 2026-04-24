import { NextResponse, type NextRequest } from "next/server";
import Stripe from "stripe";
import { stripe, planFromPriceId, getCurrentPeriodEnd } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

// Stripe webhook handler. Verifies signature, then upserts the subscriptions table.
export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !secret) {
    return new NextResponse("Missing signature or secret", { status: 400 });
  }

  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch (err) {
    return new NextResponse(`Bad signature: ${(err as Error).message}`, {
      status: 400,
    });
  }

  const admin = createAdminClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === "subscription" && session.subscription) {
          const sub = await stripe.subscriptions.retrieve(
            session.subscription as string
          );
          await syncSubscription(admin, sub);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await syncSubscription(admin, sub);
        break;
      }
      default:
        // Ignore unrelated events
        break;
    }
  } catch (err) {
    console.error("Webhook handler failed:", err);
    return new NextResponse("handler error", { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function syncSubscription(
  admin: ReturnType<typeof createAdminClient>,
  sub: Stripe.Subscription
) {
  // Find the user_id either from sub.metadata, or by looking up customer
  let userId = sub.metadata?.user_id as string | undefined;

  if (!userId) {
    const customerId =
      typeof sub.customer === "string" ? sub.customer : sub.customer.id;
    const { data: existing } = await admin
      .from("subscriptions")
      .select("user_id")
      .eq("stripe_customer_id", customerId)
      .maybeSingle();
    userId = existing?.user_id;
  }

  if (!userId) {
    console.warn(
      "Webhook: could not resolve user_id for subscription",
      sub.id
    );
    return;
  }

  const priceId = sub.items.data[0]?.price.id ?? null;
  const plan = priceId ? planFromPriceId(priceId) : null;
  const customerId =
    typeof sub.customer === "string" ? sub.customer : sub.customer.id;

  const periodEnd = getCurrentPeriodEnd(sub);
  const willCancel =
    sub.cancel_at_period_end === true || sub.cancel_at != null;
  const cancelOrPeriodEnd =
    sub.cancel_at != null ? sub.cancel_at : periodEnd;
  await admin.from("subscriptions").upsert(
    {
      user_id: userId,
      stripe_customer_id: customerId,
      stripe_subscription_id: sub.id,
      stripe_price_id: priceId,
      status: sub.status,
      plan,
      current_period_end: cancelOrPeriodEnd
        ? new Date(cancelOrPeriodEnd * 1000).toISOString()
        : null,
      cancel_at_period_end: willCancel,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );
}
