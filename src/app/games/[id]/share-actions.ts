"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { randomBytes } from "crypto";

function newToken() {
  // 24 random bytes → 32-char base64url, plenty unguessable
  return randomBytes(24)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function enableSharing(formData: FormData) {
  const gameId = formData.get("game_id") as string;
  if (!gameId) return;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Get current token (if any); generate one only if missing
  const { data: existing } = await supabase
    .from("games")
    .select("share_token")
    .eq("id", gameId)
    .single();

  const update: { share_enabled: boolean; share_token?: string } = {
    share_enabled: true,
  };
  if (!existing?.share_token) update.share_token = newToken();

  await supabase.from("games").update(update).eq("id", gameId);
  revalidatePath(`/games/${gameId}`);
}

export async function disableSharing(formData: FormData) {
  const gameId = formData.get("game_id") as string;
  if (!gameId) return;
  const supabase = await createClient();
  await supabase
    .from("games")
    .update({ share_enabled: false })
    .eq("id", gameId);
  revalidatePath(`/games/${gameId}`);
}

export async function regenerateShareToken(formData: FormData) {
  const gameId = formData.get("game_id") as string;
  if (!gameId) return;
  const supabase = await createClient();
  await supabase
    .from("games")
    .update({ share_token: newToken(), share_enabled: true })
    .eq("id", gameId);
  revalidatePath(`/games/${gameId}`);
}

export async function deleteComment(formData: FormData) {
  const id = formData.get("id") as string;
  const gameId = formData.get("game_id") as string;
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("game_comments").delete().eq("id", id);
  if (gameId) revalidatePath(`/games/${gameId}`);
}
