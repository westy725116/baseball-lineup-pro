"use client";

import { useState, useTransition } from "react";
import {
  addTeamPlayer,
  reorderTeamPlayers,
  deleteTeamPlayer,
  updateTeamPlayer,
} from "./actions";

type Player = {
  id: string;
  name: string;
  jersey_number: string | null;
};

export default function RosterList({ initial }: { initial: Player[] }) {
  const [players, setPlayers] = useState<Player[]>(initial);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [jersey, setJersey] = useState("");
  const [pending, startTransition] = useTransition();

  function reorderLocally(fromIdx: number, toIdx: number) {
    if (fromIdx === toIdx) return;
    const next = [...players];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    setPlayers(next);
    startTransition(async () => {
      await reorderTeamPlayers(next.map((p) => p.id));
    });
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;
    const fd = new FormData();
    fd.set("name", trimmedName);
    fd.set("jersey_number", jersey.trim());
    const res = await addTeamPlayer(fd);
    setName("");
    setJersey("");
    if (res?.id) {
      setPlayers((prev) => [
        ...prev,
        { id: res.id, name: res.name, jersey_number: res.jersey_number },
      ]);
    }
  }

  async function handleDelete(id: string) {
    setPlayers((prev) => prev.filter((p) => p.id !== id));
    const fd = new FormData();
    fd.set("id", id);
    await deleteTeamPlayer(fd);
  }

  async function handleSave(p: Player, draftName: string, draftJersey: string) {
    const trimmedName = draftName.trim();
    if (!trimmedName) return;
    const fd = new FormData();
    fd.set("id", p.id);
    fd.set("name", trimmedName);
    fd.set("jersey_number", draftJersey.trim());
    await updateTeamPlayer(fd);
    setPlayers((prev) =>
      prev.map((x) =>
        x.id === p.id
          ? { ...x, name: trimmedName, jersey_number: draftJersey.trim() || null }
          : x
      )
    );
  }

  return (
    <div>
      <section className="bg-white border border-stone-200 rounded-lg p-5 mb-4">
        <h2 className="font-semibold text-sm mb-3 text-stone-700">
          Add player
        </h2>
        <form
          onSubmit={handleAdd}
          className="grid grid-cols-1 sm:grid-cols-[1fr_100px_auto] gap-2"
        >
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            type="text"
            required
            placeholder="Player name"
            maxLength={60}
            className="px-3 py-2 border border-stone-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            value={jersey}
            onChange={(e) => setJersey(e.target.value)}
            type="text"
            placeholder="#"
            maxLength={6}
            className="px-3 py-2 border border-stone-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={pending || !name.trim()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-stone-300 text-white font-semibold text-sm rounded"
          >
            Add
          </button>
        </form>
      </section>

      {players.length > 0 && (
        <p className="text-xs text-stone-500 mb-2 px-1">
          Drag the ⋮⋮ handle to reorder. Click into a field to edit; Save appears
          when you change something.
        </p>
      )}

      <ul className="space-y-2">
        {players.map((p, i) => (
          <PlayerRow
            key={p.id}
            player={p}
            isDragOver={dragOverId === p.id && dragId !== p.id}
            isDragging={dragId === p.id}
            onDragStart={() => setDragId(p.id)}
            onDragEnd={() => {
              setDragId(null);
              setDragOverId(null);
            }}
            onDragOverRow={() => {
              if (!dragId) return;
              setDragOverId(p.id);
            }}
            onDragLeaveRow={() => setDragOverId(null)}
            onDropRow={(fromId) => {
              setDragOverId(null);
              if (!fromId) return;
              const fromIdx = players.findIndex((x) => x.id === fromId);
              if (fromIdx === -1) return;
              reorderLocally(fromIdx, i);
            }}
            onSave={(name, jersey) => handleSave(p, name, jersey)}
            onDelete={() => handleDelete(p.id)}
          />
        ))}
      </ul>
    </div>
  );
}

function PlayerRow({
  player,
  isDragOver,
  isDragging,
  onDragStart,
  onDragEnd,
  onDragOverRow,
  onDragLeaveRow,
  onDropRow,
  onSave,
  onDelete,
}: {
  player: Player;
  isDragOver: boolean;
  isDragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDragOverRow: () => void;
  onDragLeaveRow: () => void;
  onDropRow: (fromId: string) => void;
  onSave: (name: string, jersey: string) => void;
  onDelete: () => void;
}) {
  const [draftName, setDraftName] = useState(player.name);
  const [draftJersey, setDraftJersey] = useState(player.jersey_number ?? "");
  const isDirty =
    draftName.trim() !== player.name ||
    draftJersey.trim() !== (player.jersey_number ?? "");

  return (
    <li
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        onDragOverRow();
      }}
      onDragLeave={onDragLeaveRow}
      onDrop={(e) => {
        e.preventDefault();
        const fromId = e.dataTransfer.getData("text/plain");
        onDropRow(fromId);
      }}
      className={`bg-white border rounded-lg p-3 flex items-center gap-3 ${
        isDragOver ? "border-blue-500 ring-2 ring-blue-100" : "border-stone-200"
      } ${isDragging ? "opacity-40" : ""}`}
    >
      <span
        draggable
        onDragStart={(e) => {
          e.dataTransfer.effectAllowed = "move";
          e.dataTransfer.setData("text/plain", player.id);
          onDragStart();
        }}
        onDragEnd={onDragEnd}
        className="cursor-grab text-stone-400 hover:text-stone-700 px-1 select-none"
        title="Drag to reorder"
      >
        ⋮⋮
      </span>
      <input
        value={draftJersey}
        onChange={(e) => setDraftJersey(e.target.value)}
        placeholder="#"
        className="w-14 px-2 py-1 border border-stone-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
      />
      <input
        value={draftName}
        onChange={(e) => setDraftName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && isDirty) {
            e.preventDefault();
            onSave(draftName, draftJersey);
          }
        }}
        className="flex-1 px-2 py-1 border border-stone-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {isDirty && (
        <button
          type="button"
          onClick={() => onSave(draftName, draftJersey)}
          className="text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded px-3 py-1"
          title="Save changes"
        >
          Save
        </button>
      )}
      <button
        type="button"
        onClick={onDelete}
        className="text-stone-400 hover:text-red-600 text-lg px-2"
        title="Remove from team"
      >
        ×
      </button>
    </li>
  );
}
