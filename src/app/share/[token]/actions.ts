"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

// Anyone with the share link can submit a comment.
// We use the admin client (service role) and gate by token validity.
export async function addCommentByToken(formData: FormData) {
  const token = (formData.get("token") as string)?.trim();
  const author = ((formData.get("author_name") as string) || "").trim();
  const body = ((formData.get("body") as string) || "").trim();
  if (!token || !body) return;
  if (body.length > 2000) return;

  const admin = createAdminClient();

  const { data: game } = await admin
    .from("games")
    .select("id, share_enabled")
    .eq("share_token", token)
    .maybeSingle();

  if (!game || !game.share_enabled) return;

  await admin.from("game_comments").insert({
    game_id: game.id,
    author_name: author || "Anonymous",
    body,
  });

  revalidatePath(`/share/${token}`);
}
