// Server-only Supabase client using the service-role key.
// Bypasses RLS — use only in trusted server code (route handlers, server actions
// that intentionally need elevated privileges, e.g. the Stripe webhook).
import { createClient } from "@supabase/supabase-js";

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
