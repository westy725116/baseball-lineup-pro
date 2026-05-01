"use client";

import { useState, useTransition } from "react";
import { updateGameNotes } from "@/app/games/[id]/notes-actions";

export default function GameNotes({
  gameId,
  initial,
}: {
  gameId: string;
  initial: string;
}) {
  const [draft, setDraft] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [pending, startTransition] = useTransition();
  const isDirty = draft !== saved;

  function save() {
    if (!isDirty) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", gameId);
      fd.set("notes", draft);
      await updateGameNotes(fd);
      setSaved(draft);
    });
  }

  return (
    <section className="mt-6 bg-white border border-stone-200 rounded-lg p-5 print:hidden">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-bold uppercase tracking-wider text-stone-500">
          Game Notes
        </h2>
        {pending ? (
          <span className="text-xs text-stone-500">Saving…</span>
        ) : isDirty ? (
          <button
            type="button"
            onClick={save}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded"
          >
            Save
          </button>
        ) : (
          saved && (
            <span className="text-xs text-emerald-600 font-semibold">
              ✓ Saved
            </span>
          )
        )}
      </div>
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={save}
        rows={4}
        maxLength={5000}
        placeholder="Scouting report, parents to follow up with, things to remember…"
        className="w-full px-3 py-2 border border-stone-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
      />
      <p className="text-xs text-stone-500 mt-1">
        Saves automatically when you click outside the box.
      </p>
    </section>
  );
}
