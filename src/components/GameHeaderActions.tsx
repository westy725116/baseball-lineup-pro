"use client";

import { useState } from "react";
import EditGameInfo from "./EditGameInfo";
import SharePanel from "./SharePanel";

type Team = { id: string; name: string; season_year: number | null };
type Game = {
  id: string;
  home_team: string;
  away_team: string;
  location: string | null;
  game_date: string;
  team_id: string | null;
  is_home: boolean;
  home_score: number | null;
  away_score: number | null;
};

type Props = {
  game: Game;
  teams: Team[];
  shareToken: string | null;
  shareEnabled: boolean;
  isPro: boolean;
  origin: string;
};

export default function GameHeaderActions({
  game,
  teams,
  shareToken,
  shareEnabled,
  isPro,
  origin,
}: Props) {
  const [editOpen, setEditOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap gap-2 justify-end">
        <EditGameInfo
          game={game}
          teams={teams}
          open={editOpen}
          onOpenChange={setEditOpen}
          slot="button"
        />
        <SharePanel
          gameId={game.id}
          shareToken={shareToken}
          shareEnabled={shareEnabled}
          isPro={isPro}
          origin={origin}
          open={shareOpen}
          onOpenChange={setShareOpen}
          slot="button"
        />
      </div>
      <EditGameInfo
        game={game}
        teams={teams}
        open={editOpen}
        onOpenChange={setEditOpen}
        slot="popover"
      />
      <SharePanel
        gameId={game.id}
        shareToken={shareToken}
        shareEnabled={shareEnabled}
        isPro={isPro}
        origin={origin}
        open={shareOpen}
        onOpenChange={setShareOpen}
        slot="popover"
      />
    </div>
  );
}
