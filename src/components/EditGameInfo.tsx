"use client";

import { useState } from "react";
import { updateGameInfo } from "@/app/games/actions";

type Team = { id: string; name: string; season_year: number | null };
type Game = {
  id: string;
  home_team: string;
  away_team: string;
  location: string | null;
  game_date: string;
  team_id: string | null;
  is_home: boolean;
};

export default function EditGameInfo({
  game,
  teams,
}: {
  game: Game;
  teams: Team[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="px-3 py-2 text-sm font-semibold text-stone-800 border border-stone-300 bg-white hover:bg-stone-50 rounded"
        title="Edit teams, date, location"
      >
        ✎ Edit info
      </button>

      {open && (
        <form
          action={async (fd) => {
            await updateGameInfo(fd);
            setOpen(false);
          }}
          className="mt-3 p-4 bg-white border border-stone-200 rounded-lg shadow-sm w-full max-w-2xl space-y-3"
        >
          <input type="hidden" name="id" value={game.id} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1 uppercase tracking-wider">
                Home team
              </label>
              <input
                name="home_team"
                defaultValue={game.home_team}
                required
                maxLength={60}
                className="w-full px-3 py-2 border border-stone-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1 uppercase tracking-wider">
                Away team
              </label>
              <input
                name="away_team"
                defaultValue={game.away_team}
                required
                maxLength={60}
                className="w-full px-3 py-2 border border-stone-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1 uppercase tracking-wider">
                Location
              </label>
              <input
                name="location"
                defaultValue={game.location ?? ""}
                maxLength={100}
                className="w-full px-3 py-2 border border-stone-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1 uppercase tracking-wider">
                Date
              </label>
              <input
                name="game_date"
                type="date"
                defaultValue={game.game_date.slice(0, 10)}
                required
                className="w-full px-3 py-2 border border-stone-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {teams.length > 0 && (
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-stone-600 mb-1 uppercase tracking-wider">
                  Team
                </label>
                <select
                  name="team_id"
                  defaultValue={game.team_id ?? ""}
                  className="w-full px-3 py-2 border border-stone-300 rounded text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                      {t.season_year ? ` (${t.season_year})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <label className="sm:col-span-2 flex items-center gap-2 px-3 py-2 border border-stone-300 rounded bg-stone-50 cursor-pointer">
              <input
                name="is_home"
                type="checkbox"
                defaultChecked={game.is_home}
                className="w-4 h-4 accent-emerald-600"
              />
              <span className="text-sm font-semibold text-stone-700">
                We&apos;re the home team for this game
              </span>
            </label>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded"
            >
              Save changes
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-4 py-2 border border-stone-300 bg-white hover:bg-stone-50 font-semibold text-sm rounded"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </>
  );
}
