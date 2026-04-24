import { createClient } from "@/lib/supabase/server";

export async function isAdmin(): Promise<boolean> {
  const allowed = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (allowed.length === 0) return false;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email) return false;
  return allowed.includes(user.email.toLowerCase());
}
