"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function requestPasswordReset(formData: FormData) {
  const email = (formData.get("email") as string)?.trim();
  if (!email) {
    redirect(
      "/forgot-password?error=" + encodeURIComponent("Email is required.")
    );
  }

  const supabase = await createClient();
  const headersList = await headers();
  const origin =
    headersList.get("origin") ||
    `https://${headersList.get("host")}` ||
    "http://localhost:3000";

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  });

  if (error) {
    redirect("/forgot-password?error=" + encodeURIComponent(error.message));
  }

  redirect(
    "/forgot-password?message=" +
      encodeURIComponent(
        "If an account exists for that email, a reset link is on its way."
      )
  );
}
