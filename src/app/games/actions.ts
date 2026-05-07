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
    is_home: formData.get("is_home") === "on",
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

// Edits the metadata on the detail page (teams, date, location, team, home/away, score).
export async function updateGameInfo(formData: FormData) {
  const id = formData.get("id") as string;
  if (!id) return;
  const parseScore = (raw: FormDataEntryValue | null): number | null => {
    const s = ((raw as string) ?? "").trim();
    if (s === "") return null;
    const n = Number(s);
    return Number.isFinite(n) && n >= 0 ? Math.floor(n) : null;
  };
  const supabase = await createClient();
  await supabase
    .from("games")
    .update({
      home_team: ((formData.get("home_team") as string) || "").trim(),
      away_team: ((formData.get("away_team") as string) || "").trim(),
      location: ((formData.get("location") as string) || "").trim() || null,
      game_date: formData.get("game_date") as string,
      team_id: ((formData.get("team_id") as string) || "").trim() || null,
      is_home: formData.get("is_home") === "on",
      home_score: parseScore(formData.get("home_score")),
      away_score: parseScore(formData.get("away_score")),
    })
    .eq("id", id);
  revalidatePath(`/games/${id}`);
  revalidatePath("/games");
}
