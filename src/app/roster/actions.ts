"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function addTeamPlayer(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const name = (formData.get("name") as string)?.trim();
  const jersey = ((formData.get("jersey_number") as string) || "").trim();
  const teamId = (formData.get("team_id") as string)?.trim() || null;
  if (!name) return null;

  // Place new player at the end of the manual sort order *within this team*
  const max = teamId
    ? await supabase
        .from("team_players")
        .select("sort_order")
        .eq("team_id", teamId)
        .order("sort_order", { ascending: false })
        .limit(1)
        .maybeSingle()
    : await supabase
        .from("team_players")
        .select("sort_order")
        .eq("user_id", user.id)
        .order("sort_order", { ascending: false })
        .limit(1)
        .maybeSingle();
  const nextOrder = ((max.data?.sort_order as number | undefined) ?? 0) + 10;

  const { data: inserted } = await supabase
    .from("team_players")
    .insert({
      user_id: user.id,
      team_id: teamId,
      name,
      jersey_number: jersey || null,
      sort_order: nextOrder,
    })
    .select("id, name, jersey_number")
    .single();

  revalidatePath("/roster");
  return inserted;
}

export async function reorderTeamPlayers(orderedIds: string[]) {
  if (!Array.isArray(orderedIds) || orderedIds.length === 0) return;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  // Update each player's sort_order in step-of-10 increments so future
  // single inserts can sit between without renumbering everything.
  await Promise.all(
    orderedIds.map((id, i) =>
      supabase
        .from("team_players")
        .update({ sort_order: (i + 1) * 10 })
        .eq("id", id)
        .eq("user_id", user.id)
    )
  );
  revalidatePath("/roster");
}

export async function deleteTeamPlayer(formData: FormData) {
  const id = formData.get("id") as string;
  const supabase = await createClient();
  await supabase.from("team_players").delete().eq("id", id);
  revalidatePath("/roster");
}

export async function updateTeamPlayer(formData: FormData) {
  const id = formData.get("id") as string;
  const name = (formData.get("name") as string)?.trim();
  const jersey = ((formData.get("jersey_number") as string) || "").trim();
  if (!id || !name) return;
  const supabase = await createClient();
  await supabase
    .from("team_players")
    .update({ name, jersey_number: jersey || null })
    .eq("id", id);
  revalidatePath("/roster");
}
