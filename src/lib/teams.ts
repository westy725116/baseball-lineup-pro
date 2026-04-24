import { createClient } from "@/lib/supabase/server";

export type Team = {
  id: string;
  user_id: string;
  name: string;
  season_year: number | null;
  sort_order: number;
  created_at: string;
};

// Lists the user's teams. Auto-creates a default team and links any orphan
// roster players + games to it, so existing single-team users see no breakage.
export async function listTeamsAndEnsureDefault(): Promise<Team[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: existing } = await supabase
    .from("teams")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("season_year", { ascending: false, nullsFirst: false })
    .order("name");

  if (existing && existing.length > 0) return existing as Team[];

  // Create a default team
  const { data: created } = await supabase
    .from("teams")
    .insert({
      user_id: user.id,
      name: "My Team",
      season_year: new Date().getFullYear(),
    })
    .select("*")
    .single();

  if (!created) return [];

  // Link any orphan team_players to this team
  await supabase
    .from("team_players")
    .update({ team_id: created.id })
    .eq("user_id", user.id)
    .is("team_id", null);

  // Link any orphan games to this team
  await supabase
    .from("games")
    .update({ team_id: created.id })
    .eq("user_id", user.id)
    .is("team_id", null);

  return [created as Team];
}

// Pick the "active" team given a URL param. Falls back to the first team.
export function pickActiveTeam(
  teams: Team[],
  requestedId?: string | null
): Team | null {
  if (teams.length === 0) return null;
  if (requestedId) {
    const found = teams.find((t) => t.id === requestedId);
    if (found) return found;
  }
  return teams[0];
}
