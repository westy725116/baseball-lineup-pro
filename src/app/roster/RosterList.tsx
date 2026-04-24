"use client";

import { useState } from "react";
import { reorderTeamPlayers, deleteTeamPlayer, updateTeamPlayer } from "./actions";

type Player = {
  id: string;
  name: string;
  jersey_number: string | null;
};

export default function RosterList({ initial }: { initial: Player[] }) {
  const [players, setPlayers] = useState<Player[]>(initial);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  function reorderLocally(fromIdx: number, toIdx: number) {
    if (fromIdx === toIdx) return;
    const next = [...players];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    setPlayers(next);
    reorderTeamPlayers(next.map((p) => p.id));
  }

  return (
    <ul className="space-y-2">
      {players.map((p, i) => {
        const isOver = dragOverId === p.id && dragId !== p.id;
        return (
          <li
            key={p.id}
            draggable
            onDragStart={(e) => {
              setDragId(p.id);
              e.dataTransfer.effectAllowed = "move";
              e.dataTransfer.setData("text/plain", p.id);
            }}
            onDragEnd={() => {
              setDragId(null);
              setDragOverId(null);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
              setDragOverId(p.id);
            }}
            onDragLeave={() => setDragOverId(null)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOverId(null);
              const fromId = e.dataTransfer.getData("text/plain");
              if (!fromId) return;
              const fromIdx = players.findIndex((x) => x.id === fromId);
              if (fromIdx === -1) return;
              reorderLocally(fromIdx, i);
            }}
            className={`bg-white border rounded-lg p-3 flex items-center gap-3 ${
              isOver
                ? "border-blue-500 ring-2 ring-blue-100"
                : "border-stone-200"
            } ${dragId === p.id ? "opacity-40" : ""}`}
          >
            <span
              className="cursor-grab text-stone-400 hover:text-stone-700 px-1 select-none"
              title="Drag to reorder"
            >
              ⋮⋮
            </span>
            <form
              action={updateTeamPlayer}
              className="flex-1 flex items-center gap-2"
            >
              <input type="hidden" name="id" value={p.id} />
              <input
                name="jersey_number"
                defaultValue={p.jersey_number ?? ""}
                placeholder="#"
                className="w-14 px-2 py-1 border border-transparent hover:border-stone-300 focus:border-blue-500 rounded text-sm focus:outline-none text-center"
              />
              <input
                name="name"
                defaultValue={p.name}
                className="flex-1 px-2 py-1 border border-transparent hover:border-stone-300 focus:border-blue-500 rounded text-sm focus:outline-none"
              />
              <button
                type="submit"
                className="text-xs text-blue-600 hover:text-blue-800 px-2"
                title="Save changes"
              >
                Save
              </button>
            </form>
            <form action={deleteTeamPlayer}>
              <input type="hidden" name="id" value={p.id} />
              <button
                type="submit"
                className="text-stone-400 hover:text-red-600 text-lg px-2"
                title="Remove from team"
              >
                ×
              </button>
            </form>
          </li>
        );
      })}
    </ul>
  );
}
