"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateGameNotes(formData: FormData) {
  const id = formData.get("id") as string;
  const notes = ((formData.get("notes") as string) || "").trim() || null;
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("games").update({ notes }).eq("id", id);
  revalidatePath(`/games/${id}`);
}
