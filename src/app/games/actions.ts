"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createGame(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const game = {
    user_id: user.id,
    home_team: (formData.get("home_team") as string)?.trim(),
    away_team: (formData.get("away_team") as string)?.trim(),
    location: ((formData.get("location") as string) || "").trim() || null,
    game_date: formData.get("game_date") as string,
  };

  const { data, error } = await supabase
    .from("games")
    .insert(game)
    .select()
    .single();

  if (error) {
    redirect("/games/new?error=" + encodeURIComponent(error.message));
  }
  revalidatePath("/games");
  redirect(`/games/${data.id}`);
}

export async function deleteGame(formData: FormData) {
  const id = formData.get("id") as string;
  const supabase = await createClient();
  await supabase.from("games").delete().eq("id", id);
  revalidatePath("/games");
}
