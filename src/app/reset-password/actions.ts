"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function setNewPassword(formData: FormData) {
  const password = formData.get("password") as string;
  const confirm = formData.get("confirm") as string;

  if (!password || password.length < 6) {
    redirect(
      "/reset-password?error=" +
        encodeURIComponent("Password must be at least 6 characters.")
    );
  }
  if (password !== confirm) {
    redirect(
      "/reset-password?error=" + encodeURIComponent("Passwords don't match.")
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(
      "/login?error=" +
        encodeURIComponent("Reset link expired. Please request a new one.")
    );
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    redirect("/reset-password?error=" + encodeURIComponent(error.message));
  }

  redirect("/games");
}
