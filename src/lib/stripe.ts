import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-04-22.dahlia",
});

// In newer Stripe API versions, current_period_end lives on each Subscription Item,
// not on the Subscription itself. This helper grabs it from the first item.
export function getCurrentPeriodEnd(sub: Stripe.Subscription): number | null {
  const item = sub.items.data[0];
  return item?.current_period_end ?? null;
}

export const PRICE_MONTHLY = process.env.STRIPE_PRICE_MONTHLY!;
export const PRICE_ANNUAL = process.env.STRIPE_PRICE_ANNUAL!;

export function planFromPriceId(priceId: string): "monthly" | "annual" | null {
  if (priceId === PRICE_MONTHLY) return "monthly";
  if (priceId === PRICE_ANNUAL) return "annual";
  return null;
}
