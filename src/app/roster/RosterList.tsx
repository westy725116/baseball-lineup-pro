"use client";

import { useState, useTransition } from "react";
import {
  addTeamPlayer,
  reorderTeamPlayers,
  deleteTeamPlayer,
  updateTeamPlayer,
  updateTeamPlayerExtras,
  setPlayerPhotoUrl,
} from "./actions";
import { createClient } from "@/lib/supabase/client";

const ALL_POSITIONS = ["P", "C", "1B", "2B", "3B", "SS", "LF", "CF", "RF"] as const;

type Player = {
  id: string;
  name: string;
  jersey_number: string | null;
  notes: string;
  photo_url: string | null;
  preferred_positions: string[];
  avoid_positions: string[];
};

export default function RosterList({
  initial,
  teamId,
}: {
  initial: Player[];
  teamId: string;
}) {
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
    fd.set("team_id", teamId);
    const res = await addTeamPlayer(fd);
    setName("");
    setJersey("");
    if (res?.id) {
      setPlayers((prev) => [
        ...prev,
        {
          id: res.id,
          name: res.name,
          jersey_number: res.jersey_number,
          notes: "",
          photo_url: null,
          preferred_positions: [],
          avoid_positions: [],
        },
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

  async function handleSaveExtras(
    p: Player,
    notes: string,
    preferred: string[],
    avoid: string[]
  ) {
    const fd = new FormData();
    fd.set("id", p.id);
    fd.set("notes", notes);
    preferred.forEach((pos) => fd.append("preferred[]", pos));
    avoid.forEach((pos) => fd.append("avoid[]", pos));
    await updateTeamPlayerExtras(fd);
    setPlayers((prev) =>
      prev.map((x) =>
        x.id === p.id
          ? {
              ...x,
              notes,
              preferred_positions: preferred,
              avoid_positions: avoid,
            }
          : x
      )
    );
  }

  async function handleSetPhoto(p: Player, photoUrl: string | null) {
    const fd = new FormData();
    fd.set("id", p.id);
    if (photoUrl) fd.set("photo_url", photoUrl);
    await setPlayerPhotoUrl(fd);
    setPlayers((prev) =>
      prev.map((x) => (x.id === p.id ? { ...x, photo_url: photoUrl } : x))
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
          Drag the ⋮⋮ handle to reorder. Click <strong>Notes &amp;
          positions</strong> to add a photo, notes, or preferred positions for
          smart auto-fill.
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
            onSaveExtras={(notes, pref, avoid) =>
              handleSaveExtras(p, notes, pref, avoid)
            }
            onSetPhoto={(url) => handleSetPhoto(p, url)}
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
  onSaveExtras,
  onSetPhoto,
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
  onSaveExtras: (notes: string, preferred: string[], avoid: string[]) => void;
  onSetPhoto: (url: string | null) => void;
  onDelete: () => void;
}) {
  const [draftName, setDraftName] = useState(player.name);
  const [draftJersey, setDraftJersey] = useState(player.jersey_number ?? "");
  const [expanded, setExpanded] = useState(false);
  const [draftNotes, setDraftNotes] = useState(player.notes);
  const [draftPreferred, setDraftPreferred] = useState<string[]>(
    player.preferred_positions
  );
  const [draftAvoid, setDraftAvoid] = useState<string[]>(player.avoid_positions);
  const [photoStatus, setPhotoStatus] = useState<string | null>(null);

  const isDirty =
    draftName.trim() !== player.name ||
    draftJersey.trim() !== (player.jersey_number ?? "");

  const isExtrasDirty =
    draftNotes !== player.notes ||
    !sameSet(draftPreferred, player.preferred_positions) ||
    !sameSet(draftAvoid, player.avoid_positions);

  function togglePreferred(pos: string) {
    setDraftPreferred((cur) =>
      cur.includes(pos) ? cur.filter((p) => p !== pos) : [...cur, pos]
    );
    setDraftAvoid((cur) => cur.filter((p) => p !== pos));
  }
  function toggleAvoid(pos: string) {
    setDraftAvoid((cur) =>
      cur.includes(pos) ? cur.filter((p) => p !== pos) : [...cur, pos]
    );
    setDraftPreferred((cur) => cur.filter((p) => p !== pos));
  }

  async function handlePhotoFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setPhotoStatus("Please pick an image file.");
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setPhotoStatus("File too large (max 3 MB).");
      return;
    }
    setPhotoStatus("Uploading…");
    try {
      const sb = createClient();
      const {
        data: { user },
      } = await sb.auth.getUser();
      if (!user) {
        setPhotoStatus("Not signed in.");
        return;
      }
      // Stable per-player path so re-uploads replace the old photo
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = `${user.id}/${player.id}.${ext}`;
      const { error: upErr } = await sb.storage
        .from("player-photos")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) {
        setPhotoStatus(`Upload failed: ${upErr.message}`);
        return;
      }
      // Cache-bust by appending the timestamp so the new image shows immediately
      const { data: urlData } = sb.storage
        .from("player-photos")
        .getPublicUrl(path);
      const finalUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      await onSetPhoto(finalUrl);
      setPhotoStatus("✓ Saved");
      setTimeout(() => setPhotoStatus(null), 2000);
    } catch (e) {
      setPhotoStatus(`Error: ${(e as Error).message}`);
    }
  }

  async function handleRemovePhoto() {
    await onSetPhoto(null);
  }

  // Indicators when collapsed
  const hasNotes = !!(player.notes && player.notes.trim().length > 0);
  const hasPrefs =
    player.preferred_positions.length + player.avoid_positions.length > 0;
  const hasPhoto = !!player.photo_url;

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
      className={`bg-white border rounded-lg ${
        isDragOver ? "border-blue-500 ring-2 ring-blue-100" : "border-stone-200"
      } ${isDragging ? "opacity-40" : ""}`}
    >
      <div className="p-3 flex items-center gap-3 flex-wrap">
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
        {/* Avatar / placeholder */}
        {player.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={player.photo_url}
            alt={player.name}
            className="w-10 h-10 rounded-full object-cover border border-stone-300"
          />
        ) : (
          <div
            className="w-10 h-10 rounded-full border border-stone-200 bg-stone-100 flex items-center justify-center text-xs font-bold text-stone-500"
            title="No photo yet"
          >
            {player.name.slice(0, 1).toUpperCase()}
          </div>
        )}
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
          className="flex-1 min-w-[120px] px-2 py-1 border border-stone-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          onClick={() => setExpanded((v) => !v)}
          className={`text-xs font-semibold rounded px-3 py-1.5 border ${
            expanded
              ? "bg-stone-900 text-white border-stone-900"
              : "bg-white text-stone-700 border-stone-300 hover:bg-stone-100"
          }`}
          aria-expanded={expanded}
        >
          Notes &amp; positions {expanded ? "▴" : "▾"}
        </button>
        {!expanded && (hasNotes || hasPrefs || hasPhoto) && (
          <span className="text-[10px] text-stone-500 flex gap-1">
            {hasPhoto && <span title="Has photo">📷</span>}
            {hasNotes && <span title="Has notes">📝</span>}
            {hasPrefs && <span title="Has position prefs">⭐</span>}
          </span>
        )}
        <button
          type="button"
          onClick={onDelete}
          className="text-stone-400 hover:text-red-600 text-lg px-2"
          title="Remove from team"
        >
          ×
        </button>
      </div>

      {expanded && (
        <div className="border-t border-stone-100 p-4 space-y-4 bg-stone-50">
          {/* Photo */}
          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-2 uppercase tracking-wider">
              Photo
            </label>
            <div className="flex items-center gap-3">
              {player.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={player.photo_url}
                  alt={player.name}
                  className="w-20 h-20 rounded-full object-cover border-2 border-stone-300"
                />
              ) : (
                <div className="w-20 h-20 rounded-full border-2 border-dashed border-stone-300 bg-white flex items-center justify-center text-stone-400 text-xs">
                  No photo
                </div>
              )}
              <div className="flex flex-col gap-2">
                <label className="cursor-pointer px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded inline-block">
                  {player.photo_url ? "Replace photo" : "Upload photo"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handlePhotoFile(f);
                      e.target.value = ""; // allow re-selecting same file
                    }}
                  />
                </label>
                {player.photo_url && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="px-3 py-1.5 text-xs font-semibold text-red-700 border border-red-200 rounded hover:bg-red-50"
                  >
                    Remove
                  </button>
                )}
                {photoStatus && (
                  <span className="text-xs text-stone-600">{photoStatus}</span>
                )}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1 uppercase tracking-wider">
              Coach&apos;s notes
            </label>
            <textarea
              value={draftNotes}
              onChange={(e) => setDraftNotes(e.target.value)}
              rows={3}
              maxLength={2000}
              placeholder="Player development, attendance, evaluations…"
              className="w-full px-3 py-2 border border-stone-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>

          {/* Preferred positions */}
          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1 uppercase tracking-wider">
              Preferred / strong positions
              <span className="ml-1 text-[10px] text-stone-400 font-normal normal-case tracking-normal">
                (smart auto-fill picks these first)
              </span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {ALL_POSITIONS.map((pos) => {
                const on = draftPreferred.includes(pos);
                return (
                  <button
                    key={pos}
                    type="button"
                    onClick={() => togglePreferred(pos)}
                    className={`px-2.5 py-1 text-xs font-bold rounded ${
                      on
                        ? "bg-emerald-600 text-white border border-emerald-600"
                        : "bg-white text-stone-700 border border-stone-300 hover:bg-stone-100"
                    }`}
                  >
                    {pos}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Avoid */}
          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1 uppercase tracking-wider">
              Avoid (won&apos;t play)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {ALL_POSITIONS.map((pos) => {
                const on = draftAvoid.includes(pos);
                return (
                  <button
                    key={pos}
                    type="button"
                    onClick={() => toggleAvoid(pos)}
                    className={`px-2.5 py-1 text-xs font-bold rounded ${
                      on
                        ? "bg-red-600 text-white border border-red-600"
                        : "bg-white text-stone-700 border border-stone-300 hover:bg-stone-100"
                    }`}
                  >
                    {pos}
                  </button>
                );
              })}
            </div>
          </div>

          {isExtrasDirty && (
            <button
              type="button"
              onClick={() =>
                onSaveExtras(draftNotes, draftPreferred, draftAvoid)
              }
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded"
            >
              Save notes + positions
            </button>
          )}
        </div>
      )}
    </li>
  );
}

function sameSet(a: string[], b: string[]) {
  if (a.length !== b.length) return false;
  const setA = new Set(a);
  for (const x of b) if (!setA.has(x)) return false;
  return true;
}
