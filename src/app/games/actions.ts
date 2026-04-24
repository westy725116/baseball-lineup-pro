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

  const teamId = (formData.get("team_id") as string)?.trim() || null;
  const game = {
    user_id: user.id,
    team_id: teamId,
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

// Duplicates a game (lineup_data + team) so the user can quickly set up a
// new game with the same roster + position assignments, then tweak details.
export async function copyGame(formData: FormData) {
  const sourceId = formData.get("id") as string;
  if (!sourceId) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: source, error } = await supabase
    .from("games")
    .select("home_team, away_team, location, lineup_data, team_id")
    .eq("id", sourceId)
    .single();
  if (error || !source) return;

  const today = new Date().toISOString().slice(0, 10);
  const { data: created } = await supabase
    .from("games")
    .insert({
      user_id: user.id,
      team_id: source.team_id,
      home_team: source.home_team,
      away_team: source.away_team,
      location: source.location,
      game_date: today,
      lineup_data: source.lineup_data ?? {},
    })
    .select("id")
    .single();

  revalidatePath("/games");
  if (created) redirect(`/games/${created.id}`);
}

// Edits the metadata on the detail page (teams, date, location, team).
export async function updateGameInfo(formData: FormData) {
  const id = formData.get("id") as string;
  if (!id) return;
  const supabase = await createClient();
  await supabase
    .from("games")
    .update({
      home_team: ((formData.get("home_team") as string) || "").trim(),
      away_team: ((formData.get("away_team") as string) || "").trim(),
      location: ((formData.get("location") as string) || "").trim() || null,
      game_date: formData.get("game_date") as string,
      team_id: ((formData.get("team_id") as string) || "").trim() || null,
    })
    .eq("id", id);
  revalidatePath(`/games/${id}`);
  revalidatePath("/games");
}
