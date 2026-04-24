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
  if (!name) return;

  await supabase.from("team_players").insert({
    user_id: user.id,
    name,
    jersey_number: jersey || null,
  });
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
