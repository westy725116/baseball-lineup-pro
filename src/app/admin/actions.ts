"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { isAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";

async function requireAdmin() {
  if (!(await isAdmin())) redirect("/games");
}

// Mark a user's email as confirmed so they can log in immediately,
// without needing to click a confirmation link.
export async function confirmUser(formData: FormData) {
  await requireAdmin();
  const userId = formData.get("user_id") as string;
  const email = (formData.get("email") as string) || "";
  if (!userId) return;

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(userId, {
    email_confirm: true,
  });
  if (error) {
    redirect(`/admin?notice=${encodeURIComponent(`Couldn't confirm ${email}: ${error.message}`)}`);
  }
  revalidatePath("/admin");
  redirect(`/admin?notice=${encodeURIComponent(`✓ ${email} marked as confirmed.`)}`);
}

// Generates a password recovery link directly (no email sent).
// Bypasses Supabase's built-in email rate limit.
export async function generateRecoveryLink(formData: FormData) {
  await requireAdmin();
  const email = (formData.get("email") as string) || "";
  if (!email) return;

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.generateLink({
    type: "recovery",
    email,
  });
  if (error) {
    redirect(`/admin?notice=${encodeURIComponent(`Couldn't generate link: ${error.message}`)}`);
  }
  const link = data?.properties?.action_link ?? "";
  redirect(
    `/admin?for=${encodeURIComponent(email)}&link=${encodeURIComponent(link)}&kind=reset`
  );
}

// Generates a passwordless magic-link login URL (no email sent).
export async function generateMagicLink(formData: FormData) {
  await requireAdmin();
  const email = (formData.get("email") as string) || "";
  if (!email) return;

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
  });
  if (error) {
    redirect(`/admin?notice=${encodeURIComponent(`Couldn't generate link: ${error.message}`)}`);
  }
  const link = data?.properties?.action_link ?? "";
  redirect(
    `/admin?for=${encodeURIComponent(email)}&link=${encodeURIComponent(link)}&kind=magic`
  );
}

// Permanently delete a user (cascades to their games, roster, etc.).
export async function deleteUser(formData: FormData) {
  await requireAdmin();
  const userId = formData.get("user_id") as string;
  const email = (formData.get("email") as string) || "";
  if (!userId) return;

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) {
    redirect(`/admin?notice=${encodeURIComponent(`Couldn't delete ${email}: ${error.message}`)}`);
  }
  revalidatePath("/admin");
  redirect(`/admin?notice=${encodeURIComponent(`✓ Deleted ${email} and all their data.`)}`);
}
