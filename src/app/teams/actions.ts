"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createTeam(formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  const yearRaw = (formData.get("season_year") as string)?.trim();
  const seasonYear = yearRaw ? parseInt(yearRaw, 10) : null;
  if (!name) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Place at the end
  const { data: max } = await supabase
    .from("teams")
    .select("sort_order")
    .eq("user_id", user.id)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextOrder = ((max?.sort_order as number | undefined) ?? 0) + 10;

  await supabase.from("teams").insert({
    user_id: user.id,
    name,
    season_year: seasonYear ?? null,
    sort_order: nextOrder,
  });
  revalidatePath("/teams");
  revalidatePath("/games");
}

export async function updateTeam(formData: FormData) {
  const id = formData.get("id") as string;
  const name = (formData.get("name") as string)?.trim();
  const yearRaw = (formData.get("season_year") as string)?.trim();
  if (!id || !name) return;
  const supabase = await createClient();
  await supabase
    .from("teams")
    .update({
      name,
      season_year: yearRaw ? parseInt(yearRaw, 10) : null,
    })
    .eq("id", id);
  revalidatePath("/teams");
  revalidatePath("/games");
}

export async function deleteTeam(formData: FormData) {
  const id = formData.get("id") as string;
  if (!id) return;
  const supabase = await createClient();
  // Cascade rules in the schema delete this team's players;
  // games belonging to this team have team_id set to null (they remain visible).
  await supabase.from("teams").delete().eq("id", id);
  revalidatePath("/teams");
  revalidatePath("/games");
  revalidatePath("/roster");
}
