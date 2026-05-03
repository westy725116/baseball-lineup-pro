"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  POSITIONS,
  POSITIONS_PRINT,
  MAX_INNINGS,
  type LineupData,
  defaultLineupData,
  normalize,
  uid,
  pitcherRoleLabel,
} from "@/lib/lineup";
import styles from "./LineupBuilder.module.css";

type Props = {
  gameId: string;
  initialData: unknown;
  isPro: boolean;
  freeInnings: number;
  teamId: string | null;
};

type SaveStatus = "idle" | "saving" | "saved" | "error";

export default function LineupBuilder({
  gameId,
  initialData,
  isPro,
  freeInnings,
  teamId,
}: Props) {
  const visibleInningCap = isPro ? MAX_INNINGS : freeInnings;
  const [data, setData] = useState<LineupData>(() =>
    normalize(initialData ?? defaultLineupData())
  );
  const [playerInput, setPlayerInput] = useState("");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [dragOverPos, setDragOverPos] = useState<string | null>(null);
  const [dragOverBat, setDragOverBat] = useState<number | null>(null);
  const [dragOverPitch, setDragOverPitch] = useState<number | null>(null);
  const [rosterMsg, setRosterMsg] = useState<string | null>(null);
  // Tap-to-place: one tap selects a player, next tap places them on a slot.
  // Works alongside drag-drop. Critical for mobile where dragging across the
  // page (roster at top → field below) is essentially unusable.
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  // Use the spread-out positions everywhere — they prevent infielder
  // circles from overlapping even when the field column is narrow.
  const fieldPositions = POSITIONS_PRINT;

  const supabase = useRef(createClient()).current;
  const isFirstRender = useRef(true);

  // If a free user lands on a locked inning, snap them back to the cap.
  useEffect(() => {
    if (data.currentInning > visibleInningCap) {
      setData((d) => ({ ...d, currentInning: visibleInningCap }));
    }
  }, [data.currentInning, visibleInningCap]);

  // Sync the latest photos from the team roster into this game's inline players
  // (so a photo uploaded after this game's roster was loaded shows up).
  useEffect(() => {
    if (!teamId) return;
    let cancelled = false;
    (async () => {
      const { data: tp } = await supabase
        .from("team_players")
        .select("id, photo_url, name")
        .eq("team_id", teamId);
      if (cancelled || !tp) return;
      const photoByTpId = new Map(tp.map((t) => [t.id, t.photo_url]));
      setData((prev) => {
        let changed = false;
        const players = prev.players.map((p) => {
          if (!p.team_player_id || !photoByTpId.has(p.team_player_id)) return p;
          const fresh = photoByTpId.get(p.team_player_id) ?? undefined;
          if (fresh === p.photo_url) return p;
          changed = true;
          return { ...p, photo_url: fresh };
        });
        return changed ? { ...prev, players } : prev;
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [teamId, supabase]);

  // Persist to Supabase whenever data changes (debounced)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setSaveStatus("saving");
    const t = setTimeout(async () => {
      const { error } = await supabase
        .from("games")
        .update({ lineup_data: data, updated_at: new Date().toISOString() })
        .eq("id", gameId);
      setSaveStatus(error ? "error" : "saved");
      if (!error) {
        setTimeout(() => setSaveStatus("idle"), 1500);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [data, gameId, supabase]);

  // ----- Helpers -----
  const currentLineup = () => data.lineups[data.currentInning] || {};
  const getPlayer = (id: string | null | undefined) =>
    id ? data.players.find((p) => p.id === id) : undefined;

  const getPlayerPositionInInning = (playerId: string, inning: number) => {
    const lineup = data.lineups[inning];
    if (!lineup) return null;
    for (const [pos, pid] of Object.entries(lineup)) {
      if (pid === playerId) return pos;
    }
    return null;
  };
  const getPlayerPosition = (playerId: string) =>
    getPlayerPositionInInning(playerId, data.currentInning);

  // ----- Mutations -----
  const addPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    const name = playerInput.trim();
    if (!name) return;
    setData({ ...data, players: [...data.players, { id: uid(), name }] });
    setPlayerInput("");
  };

  const removePlayer = (id: string) => {
    const player = data.players.find((p) => p.id === id);
    const name = player?.name || "this player";
    if (
      !confirm(
        `Remove ${name} from this game's roster?\n\nThey'll be removed from any positions they're playing and from the batting order in this game. They stay on your team roster.`
      )
    ) {
      return;
    }
    const lineups: typeof data.lineups = {};
    for (let i = 1; i <= MAX_INNINGS; i++) {
      const inn = { ...data.lineups[i] };
      for (const pos in inn) if (inn[pos] === id) delete inn[pos];
      lineups[i] = inn;
    }
    setData({
      ...data,
      players: data.players.filter((p) => p.id !== id),
      lineups,
      battingOrder: data.battingOrder.map((pid) => (pid === id ? null : pid)),
    });
  };

  const setCurrentInning = (i: number) =>
    setData({ ...data, currentInning: i });

  const assignPlayerToPosition = (
    playerId: string,
    targetPos: string,
    fromPos: string | null
  ) => {
    const inning = { ...currentLineup() };
    const currentlyHere = inning[targetPos];
    for (const p in inning) {
      if (inning[p] === playerId) delete inning[p];
    }
    if (currentlyHere && fromPos && currentlyHere !== playerId) {
      inning[fromPos] = currentlyHere;
    }
    inning[targetPos] = playerId;
    setData({
      ...data,
      lineups: { ...data.lineups, [data.currentInning]: inning },
    });
  };

  const clearSlot = (pos: string) => {
    const inning = { ...currentLineup() };
    delete inning[pos];
    setData({
      ...data,
      lineups: { ...data.lineups, [data.currentInning]: inning },
    });
  };

  const copyFromPreviousInning = () => {
    if (data.currentInning <= 1) {
      alert("No previous inning to copy from.");
      return;
    }
    const prev = data.lineups[data.currentInning - 1] || {};
    setData({
      ...data,
      lineups: { ...data.lineups, [data.currentInning]: { ...prev } },
    });
  };

  const clearCurrentInning = () => {
    if (!confirm(`Clear all positions for inning ${data.currentInning}?`))
      return;
    setData({
      ...data,
      lineups: { ...data.lineups, [data.currentInning]: {} },
    });
  };

  // Batting order
  const reorderBatting = (from: number, to: number) => {
    if (from === to) return;
    const arr = [...data.battingOrder];
    while (arr.length <= Math.max(from, to)) arr.push(null);
    const [moved] = arr.splice(from, 1);
    arr.splice(to, 0, moved);
    setData({ ...data, battingOrder: arr });
  };
  const placeInBattingSlot = (playerId: string, idx: number) => {
    const arr = [...data.battingOrder];
    while (arr.length <= idx) arr.push(null);
    for (let i = 0; i < arr.length; i++) {
      if (arr[i] === playerId && i !== idx) arr[i] = null;
    }
    arr[idx] = playerId;
    setData({ ...data, battingOrder: arr });
  };
  const removeBattingSlot = (idx: number) => {
    const arr = [...data.battingOrder];
    arr.splice(idx, 1);
    setData({ ...data, battingOrder: arr });
  };
  const addBattingSlot = () =>
    setData({ ...data, battingOrder: [...data.battingOrder, null] });

  // Load all team_players the user has saved into the current game's roster.
  // Skips any already present (matched by team_player_id, then by name).
  const loadFromTeamRoster = async () => {
    setRosterMsg("Loading…");
    const baseQuery = supabase
      .from("team_players")
      .select("id, name, photo_url")
      .order("sort_order")
      .order("name");
    const { data: tp, error } = teamId
      ? await baseQuery.eq("team_id", teamId)
      : await baseQuery;
    if (error) {
      setRosterMsg("Failed to load.");
      return;
    }
    if (!tp || tp.length === 0) {
      setRosterMsg("No team roster yet — add players in /roster.");
      return;
    }
    const existingByTpId = new Set(
      data.players.map((p) => p.team_player_id).filter(Boolean) as string[]
    );
    const existingByName = new Set(
      data.players.map((p) => p.name.trim().toLowerCase())
    );
    const toAdd = tp
      .filter(
        (t) =>
          !existingByTpId.has(t.id) &&
          !existingByName.has(t.name.trim().toLowerCase())
      )
      .map((t) => ({
        id: uid(),
        name: t.name,
        team_player_id: t.id,
        ...(t.photo_url ? { photo_url: t.photo_url } : {}),
      }));
    if (toAdd.length === 0) {
      setRosterMsg("Roster already loaded.");
      return;
    }
    setData({ ...data, players: [...data.players, ...toAdd] });
    setRosterMsg(`Added ${toAdd.length} player${toAdd.length === 1 ? "" : "s"}.`);
    setTimeout(() => setRosterMsg(null), 3000);
  };

  // Smart auto-fill the current inning's defense based on each player's
  // preferred + avoid positions (set on /roster page).
  const smartAutoFillDefense = async () => {
    if (!teamId) {
      setRosterMsg("This game isn't linked to a team yet.");
      setTimeout(() => setRosterMsg(null), 3000);
      return;
    }
    setRosterMsg("Smart-filling…");

    const { data: tp, error } = await supabase
      .from("team_players")
      .select("id, preferred_positions, avoid_positions")
      .eq("team_id", teamId);
    if (error || !tp) {
      setRosterMsg("Failed to fetch team preferences.");
      setTimeout(() => setRosterMsg(null), 3000);
      return;
    }

    // Map team_player_id -> inline player id (only those in the game's roster)
    const tpMap = new Map<
      string,
      { inlineId: string; preferred: string[]; avoid: string[] }
    >();
    for (const p of data.players) {
      if (!p.team_player_id) continue;
      const meta = tp.find((t) => t.id === p.team_player_id);
      tpMap.set(p.team_player_id, {
        inlineId: p.id,
        preferred: meta?.preferred_positions ?? [],
        avoid: meta?.avoid_positions ?? [],
      });
    }

    if (tpMap.size === 0) {
      setRosterMsg("No team-linked players in this game. Click ↓ Load roster first.");
      setTimeout(() => setRosterMsg(null), 4000);
      return;
    }

    const candidates = [...tpMap.values()];
    const newLineup: Record<string, string> = {};
    const used = new Set<string>();

    // Pass 1: assign each position to a player who PREFERS it.
    // Pick the most "specialized" candidate (fewest preferred positions)
    // so versatile players stay available to fill gaps.
    for (const pos of POSITIONS) {
      const preferring = candidates.filter(
        (c) => !used.has(c.inlineId) && c.preferred.includes(pos.id)
      );
      if (preferring.length > 0) {
        preferring.sort((a, b) => a.preferred.length - b.preferred.length);
        newLineup[pos.id] = preferring[0].inlineId;
        used.add(preferring[0].inlineId);
      }
    }

    // Pass 2: fill any remaining positions with anyone who doesn't AVOID it.
    let unfilled = 0;
    for (const pos of POSITIONS) {
      if (newLineup[pos.id]) continue;
      const available = candidates.filter(
        (c) => !used.has(c.inlineId) && !c.avoid.includes(pos.id)
      );
      if (available.length > 0) {
        newLineup[pos.id] = available[0].inlineId;
        used.add(available[0].inlineId);
      } else {
        unfilled++;
      }
    }

    setData({
      ...data,
      lineups: { ...data.lineups, [data.currentInning]: newLineup },
    });
    const note =
      unfilled > 0
        ? `Filled inning ${data.currentInning} (${unfilled} positions need coverage — set more preferences in Roster).`
        : `Smart-filled inning ${data.currentInning}.`;
    setRosterMsg(note);
    setTimeout(() => setRosterMsg(null), 4000);
  };

  // Push any roster players that aren't yet linked to a team_player into team_players.
  const saveRosterToTeam = async () => {
    if (!teamId) {
      setRosterMsg("This game isn't linked to a team yet.");
      setTimeout(() => setRosterMsg(null), 3000);
      return;
    }
    const candidates = data.players.filter((p) => !p.team_player_id);
    if (candidates.length === 0) {
      setRosterMsg("All players are already saved to your team.");
      setTimeout(() => setRosterMsg(null), 3000);
      return;
    }
    setRosterMsg("Saving…");
    // Look up existing team_players (in this team) by name to avoid duplicates
    const { data: existingTp } = await supabase
      .from("team_players")
      .select("id, name")
      .eq("team_id", teamId);
    const existingByName = new Map<string, string>();
    (existingTp ?? []).forEach((tp) =>
      existingByName.set(tp.name.trim().toLowerCase(), tp.id)
    );

    const newPlayers = data.players.slice();
    let added = 0;
    let linked = 0;

    for (let i = 0; i < newPlayers.length; i++) {
      const p = newPlayers[i];
      if (p.team_player_id) continue;
      const key = p.name.trim().toLowerCase();
      if (existingByName.has(key)) {
        newPlayers[i] = { ...p, team_player_id: existingByName.get(key)! };
        linked++;
        continue;
      }
      const { data: inserted, error } = await supabase
        .from("team_players")
        .insert({ name: p.name, team_id: teamId })
        .select("id")
        .single();
      if (!error && inserted) {
        newPlayers[i] = { ...p, team_player_id: inserted.id };
        added++;
      }
    }

    setData({ ...data, players: newPlayers });
    const parts: string[] = [];
    if (added) parts.push(`saved ${added} new`);
    if (linked) parts.push(`linked ${linked} existing`);
    setRosterMsg(parts.length ? parts.join(", ") + "." : "Done.");
    setTimeout(() => setRosterMsg(null), 3000);
  };

  // ---- Tap-to-place handlers ----
  const togglePlayerSelection = (playerId: string) => {
    setSelectedPlayerId((prev) => (prev === playerId ? null : playerId));
  };
  const handleSlotTap = (posId: string) => {
    if (selectedPlayerId) {
      assignPlayerToPosition(selectedPlayerId, posId, null);
      setSelectedPlayerId(null);
    } else {
      // No selection? Tapping a filled slot picks up that player so you can move them.
      const placed = currentLineup()[posId];
      if (placed) setSelectedPlayerId(placed);
    }
  };
  const handleBattingSlotTap = (idx: number) => {
    if (selectedPlayerId) {
      placeInBattingSlot(selectedPlayerId, idx);
      setSelectedPlayerId(null);
    }
  };
  const handlePitcherListTap = () => {
    if (selectedPlayerId) {
      addPitcher(selectedPlayerId);
      setSelectedPlayerId(null);
    }
  };

  const selectedPlayer = selectedPlayerId
    ? data.players.find((p) => p.id === selectedPlayerId)
    : null;

  const autoFillBattingOrder = () => {
    const lineup = currentLineup();
    const fielded = POSITIONS.map((p) => lineup[p.id]).filter(Boolean) as string[];
    const seen = new Set(fielded);
    const remaining = data.players.map((p) => p.id).filter((id) => !seen.has(id));
    setData({ ...data, battingOrder: [...fielded, ...remaining] });
  };

  // Pitcher rotation
  const addPitcher = (playerId: string, atIndex?: number) => {
    const arr = data.pitchers.filter((id) => id !== playerId);
    const idx = atIndex === undefined ? arr.length : Math.min(atIndex, arr.length);
    arr.splice(idx, 0, playerId);
    setData({ ...data, pitchers: arr });
  };
  const removePitcher = (idx: number) => {
    const arr = [...data.pitchers];
    arr.splice(idx, 1);
    setData({ ...data, pitchers: arr });
  };
  const reorderPitchers = (from: number, to: number) => {
    if (from === to) return;
    const arr = [...data.pitchers];
    const [moved] = arr.splice(from, 1);
    arr.splice(to, 0, moved);
    setData({ ...data, pitchers: arr });
  };

  // ----- Render -----
  const lineup = currentLineup();

  return (
    <>
      <div className={styles.screenOnly}>
        {selectedPlayer && (
          <div className="sticky top-0 z-30 mb-3 px-3 py-2 bg-blue-600 text-white rounded shadow-lg flex items-center justify-between gap-3">
            <span className="text-sm">
              <strong>{selectedPlayer.name}</strong> selected — tap a position
              or batting slot
            </span>
            <button
              type="button"
              onClick={() => setSelectedPlayerId(null)}
              className="px-2 py-1 text-xs font-semibold bg-blue-700 hover:bg-blue-800 rounded"
            >
              Cancel
            </button>
          </div>
        )}

        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={() => window.print()}
            className="px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded"
          >
            🖨 Print
          </button>
          <span
            className={
              "text-sm " +
              (saveStatus === "error"
                ? "text-red-600 font-semibold"
                : saveStatus === "saving"
                  ? "text-stone-500"
                  : saveStatus === "saved"
                    ? "text-emerald-700 font-semibold"
                    : "text-stone-400")
            }
          >
            {saveStatus === "saving"
              ? "Saving…"
              : saveStatus === "saved"
                ? "✓ Saved"
                : saveStatus === "error"
                  ? "Save failed"
                  : ""}
          </span>
        </div>

        <div className={styles.grid}>
          {/* Roster */}
          <section className={styles.panel}>
            <h2 className={styles.panelTitle}>
              Roster
              <span className="text-stone-400 font-normal text-[11px] normal-case tracking-normal">
                {data.players.length ? `(${data.players.length})` : ""}
              </span>
            </h2>
            <div className="flex gap-1.5 mb-2">
              <button
                type="button"
                onClick={loadFromTeamRoster}
                className="flex-1 text-sm font-semibold text-stone-800 border border-stone-300 bg-white hover:bg-stone-50 rounded px-3 py-1.5"
                title="Pull players from your saved team roster"
              >
                ↓ Load roster
              </button>
              <button
                type="button"
                onClick={saveRosterToTeam}
                className="flex-1 text-sm font-semibold text-stone-800 border border-stone-300 bg-white hover:bg-stone-50 rounded px-3 py-1.5"
                title="Save these players to your team roster"
              >
                ↑ Save to team
              </button>
            </div>
            {rosterMsg && (
              <div className="text-xs text-stone-600 mb-2 px-1">
                {rosterMsg}
              </div>
            )}
            <form onSubmit={addPlayer} className={styles.rosterInput}>
              <input
                type="text"
                value={playerInput}
                onChange={(e) => setPlayerInput(e.target.value)}
                placeholder="Player name"
                maxLength={40}
                autoComplete="off"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded"
              >
                Add
              </button>
            </form>
            <ul className={styles.rosterList}>
              {data.players.map((p) => {
                const placed = getPlayerPosition(p.id);
                const isSelected = selectedPlayerId === p.id;
                return (
                  <li
                    key={p.id}
                    onClick={() => togglePlayerSelection(p.id)}
                    className={`${styles.player} ${placed ? styles.placed : ""} ${isSelected ? styles.selected : ""}`}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/player-id", p.id);
                      e.dataTransfer.effectAllowed = "move";
                      e.currentTarget.classList.add(styles.dragging);
                    }}
                    onDragEnd={(e) =>
                      e.currentTarget.classList.remove(styles.dragging)
                    }
                  >
                    {p.photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.photo_url}
                        alt=""
                        className={styles.playerPhoto}
                      />
                    ) : (
                      <span className={styles.playerInitial}>
                        {p.name.slice(0, 1).toUpperCase()}
                      </span>
                    )}
                    <span className={styles.name}>{p.name}</span>
                    {placed && <span className={styles.posTag}>{placed}</span>}
                    <span
                      className={styles.removeX}
                      onClick={(e) => {
                        e.stopPropagation();
                        removePlayer(p.id);
                      }}
                      title="Remove from roster"
                    >
                      ×
                    </span>
                  </li>
                );
              })}
            </ul>
            {data.players.length === 0 && (
              <p className={styles.hint}>Add players to get started.</p>
            )}
            {data.players.length > 0 && (
              <p className={styles.hint}>
                Tap a player to select, then tap a position. Drag also works on
                desktop.
              </p>
            )}
          </section>

          {/* Field */}
          <section className={styles.panel}>
            <div className={styles.fieldHeader}>
              <h2>Defensive Lineup</h2>
              <div className={styles.inningTabs}>
                {Array.from(
                  { length: Math.min(data.numInnings, visibleInningCap) },
                  (_, k) => k + 1
                ).map((i) => {
                  const filledCount = Object.values(data.lineups[i] || {}).filter(
                    Boolean
                  ).length;
                  return (
                    <button
                      key={i}
                      className={`${styles.inningTab} ${i === data.currentInning ? styles.inningTabActive : ""}`}
                      onClick={() => setCurrentInning(i)}
                      title={`Inning ${i}`}
                    >
                      {i}
                      {filledCount > 0 && <span className={styles.dot} />}
                    </button>
                  );
                })}
                {/* "+ Add inning" — pro only */}
                {isPro && data.numInnings < MAX_INNINGS && (
                  <button
                    className={styles.inningTab}
                    onClick={() =>
                      setData({ ...data, numInnings: data.numInnings + 1 })
                    }
                    title="Add another inning"
                    style={{
                      borderStyle: "dashed",
                      color: "#9ca3af",
                      fontWeight: 400,
                    }}
                  >
                    +
                  </button>
                )}
                {/* Locked tabs for free users */}
                {!isPro && visibleInningCap < MAX_INNINGS && (
                  <a
                    href="/upgrade"
                    className={styles.inningTab}
                    style={{
                      borderStyle: "dashed",
                      color: "#b91c1c",
                      fontWeight: 700,
                      textDecoration: "none",
                      paddingLeft: 8,
                      paddingRight: 8,
                      width: "auto",
                      whiteSpace: "nowrap",
                    }}
                    title={`Unlock innings ${freeInnings + 1}–9 with Pro`}
                  >
                    🔒 Pro
                  </a>
                )}
              </div>
              <div className={styles.inningActions}>
                <button
                  onClick={smartAutoFillDefense}
                  className="text-xs font-semibold text-emerald-800 border border-emerald-300 rounded bg-emerald-50 hover:bg-emerald-100 px-2 py-1"
                  title="Auto-fill positions based on each player's preferred + avoid settings (set in Roster)"
                >
                  ✨ Smart fill
                </button>
                <button
                  onClick={copyFromPreviousInning}
                  className="text-xs font-semibold text-stone-700 border border-stone-300 rounded bg-white hover:bg-stone-50 px-2 py-1"
                  title="Copy previous inning's lineup"
                >
                  ⧉ Copy prev
                </button>
                <button
                  onClick={clearCurrentInning}
                  className="text-xs font-semibold text-red-700 border border-red-200 rounded bg-white hover:bg-red-50 px-2 py-1"
                  title="Clear this inning"
                >
                  Clear inning
                </button>
              </div>
            </div>

            <div className={styles.field}>
              <svg
                className={styles.diamondSvg}
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                <path
                  d="M 5 70 Q 50 -10 95 70 L 95 95 L 5 95 Z"
                  fill="#3d7a31"
                  opacity=".55"
                />
                <circle cx="50" cy="68" r="22" fill="#b9874a" />
                <polygon points="50,57 62,68 50,79 38,68" fill="#4a8b3b" />
                <rect x="48.5" y="77.5" width="3" height="3" fill="#fff" stroke="#333" strokeWidth=".3" />
                <rect x="60.5" y="66.5" width="3" height="3" fill="#fff" stroke="#333" strokeWidth=".3" />
                <rect x="48.5" y="55.5" width="3" height="3" fill="#fff" stroke="#333" strokeWidth=".3" />
                <rect x="36.5" y="66.5" width="3" height="3" fill="#fff" stroke="#333" strokeWidth=".3" />
                <circle cx="50" cy="68" r="2.5" fill="#d4a06a" />
                <line x1="50" y1="79" x2="5" y2="34" stroke="#fff" strokeWidth=".4" />
                <line x1="50" y1="79" x2="95" y2="34" stroke="#fff" strokeWidth=".4" />
              </svg>

              {fieldPositions.map((pos) => {
                const playerId = lineup[pos.id];
                const player = getPlayer(playerId);
                const isOver = dragOverPos === pos.id;
                const isTapTarget = !!selectedPlayerId;
                const hasPhoto = !!player?.photo_url;
                return (
                  <div
                    key={pos.id}
                    onClick={() => handleSlotTap(pos.id)}
                    className={`${styles.slot} ${player ? styles.slotFilled : ""} ${hasPhoto ? styles.slotPhoto : ""} ${isOver || isTapTarget ? styles.slotOver : ""}`}
                    style={{
                      left: `${pos.x}%`,
                      top: `${pos.y}%`,
                      ...(hasPhoto && player?.photo_url
                        ? { backgroundImage: `url("${player.photo_url}")` }
                        : {}),
                    }}
                    draggable={!!player}
                    onDragStart={
                      player
                        ? (e) => {
                            e.dataTransfer.setData("text/player-id", player.id);
                            e.dataTransfer.setData("text/from-position", pos.id);
                            e.dataTransfer.effectAllowed = "move";
                          }
                        : undefined
                    }
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = "move";
                      setDragOverPos(pos.id);
                    }}
                    onDragLeave={() => setDragOverPos(null)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOverPos(null);
                      const playerId = e.dataTransfer.getData("text/player-id");
                      const fromPosition = e.dataTransfer.getData("text/from-position");
                      if (!playerId) return;
                      assignPlayerToPosition(playerId, pos.id, fromPosition || null);
                    }}
                  >
                    {player ? (
                      <>
                        {!hasPhoto && <PlayerSilhouette />}
                        <div className={styles.posPill}>{pos.id}</div>
                        <div className={styles.whoPill}>{player.name}</div>
                        <div
                          className="clear"
                          onClick={(e) => {
                            e.stopPropagation();
                            clearSlot(pos.id);
                          }}
                          title="Remove from position"
                        >
                          ×
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="pos">{pos.id}</div>
                        <div className="label">{pos.label}</div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
            <p className={styles.hint}>
              Drag a player onto a position. Drop on an occupied slot to swap.
            </p>
          </section>

          {/* Right column: batting + pitching stacked */}
          <div className="flex flex-col gap-4 min-w-0">
          {/* Batting order */}
          <section className={styles.panel}>
            <h2 className={styles.panelTitle}>
              Batting Order
              <button
                onClick={autoFillBattingOrder}
                className="border border-stone-300 rounded bg-white hover:bg-stone-50 text-xs font-semibold text-stone-700 px-2 py-1 normal-case tracking-normal"
              >
                Auto-fill
              </button>
            </h2>
            <ol className={styles.battingList}>
              {data.battingOrder.map((playerId, i) => {
                const player = getPlayer(playerId);
                const posTag = player ? getPlayerPosition(player.id) : null;
                const isOver = dragOverBat === i;
                return (
                  <li
                    key={i}
                    onClick={() => handleBattingSlotTap(i)}
                    className={`${styles.batItem} ${player ? "" : styles.empty} ${isOver || (selectedPlayerId && !player) ? styles.over : ""}`}
                    draggable={!!player}
                    onDragStart={
                      player
                        ? (e) => {
                            e.dataTransfer.setData("text/bat-index", String(i));
                            e.dataTransfer.setData("text/player-id", player.id);
                            e.dataTransfer.effectAllowed = "move";
                            e.currentTarget.classList.add(styles.dragging);
                          }
                        : undefined
                    }
                    onDragEnd={(e) =>
                      e.currentTarget.classList.remove(styles.dragging)
                    }
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = "move";
                      setDragOverBat(i);
                    }}
                    onDragLeave={() => setDragOverBat(null)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOverBat(null);
                      const fromIdxRaw = e.dataTransfer.getData("text/bat-index");
                      const playerId = e.dataTransfer.getData("text/player-id");
                      if (fromIdxRaw !== "") {
                        reorderBatting(parseInt(fromIdxRaw, 10), i);
                      } else if (playerId) {
                        placeInBattingSlot(playerId, i);
                      }
                    }}
                  >
                    <span className={styles.num}>{i + 1}</span>
                    <span className={styles.name}>
                      {player ? player.name : "— empty —"}
                    </span>
                    {posTag && <span className={styles.posTag}>{posTag}</span>}
                    <span
                      className={styles.removeX}
                      onClick={(e) => {
                        e.stopPropagation();
                        removeBattingSlot(i);
                      }}
                      title="Remove this slot"
                    >
                      ×
                    </span>
                  </li>
                );
              })}
            </ol>
            <button
              onClick={addBattingSlot}
              className="mt-2 w-full border border-stone-300 rounded bg-white hover:bg-stone-50 text-sm font-semibold text-stone-700 py-2"
            >
              + Add slot
            </button>
          </section>

          {/* Pitching plan */}
          <section className={styles.panel}>
            <h2 className={styles.panelTitle}>
              Pitching Plan
              <span className="font-normal normal-case tracking-normal text-stone-400 text-[11px]">
                starter + relievers
              </span>
            </h2>
            <ol
              className={styles.battingList}
              onClick={() => {
                // Allow tap-to-add when the list is empty (the row below is the only target)
                if (data.pitchers.length === 0) handlePitcherListTap();
              }}
              onDragOver={(e) => {
                if (data.pitchers.length === 0) {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                }
              }}
              onDrop={(e) => {
                if (data.pitchers.length === 0) {
                  e.preventDefault();
                  const playerId = e.dataTransfer.getData("text/player-id");
                  if (playerId) addPitcher(playerId);
                }
              }}
            >
              {data.pitchers.map((playerId, i) => {
                const player = getPlayer(playerId);
                const isOver = dragOverPitch === i;
                return (
                  <li
                    key={`${playerId}-${i}`}
                    className={`${styles.batItem} ${player ? "" : styles.empty} ${isOver ? styles.over : ""}`}
                    draggable={!!player}
                    onDragStart={
                      player
                        ? (e) => {
                            e.dataTransfer.setData("text/pitcher-index", String(i));
                            e.dataTransfer.setData("text/player-id", player.id);
                            e.dataTransfer.effectAllowed = "move";
                            e.currentTarget.classList.add(styles.dragging);
                          }
                        : undefined
                    }
                    onDragEnd={(e) =>
                      e.currentTarget.classList.remove(styles.dragging)
                    }
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = "move";
                      setDragOverPitch(i);
                    }}
                    onDragLeave={() => setDragOverPitch(null)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOverPitch(null);
                      const fromIdxRaw = e.dataTransfer.getData("text/pitcher-index");
                      const droppedPlayerId = e.dataTransfer.getData("text/player-id");
                      if (fromIdxRaw !== "") {
                        reorderPitchers(parseInt(fromIdxRaw, 10), i);
                      } else if (droppedPlayerId) {
                        addPitcher(droppedPlayerId, i);
                      }
                    }}
                  >
                    <span className={styles.num}>{i + 1}</span>
                    <span className={styles.name}>
                      {player ? player.name : "(removed player)"}
                    </span>
                    <span className={styles.posTag}>
                      {pitcherRoleLabel(i)}
                    </span>
                    <span
                      className={styles.removeX}
                      onClick={(e) => {
                        e.stopPropagation();
                        removePitcher(i);
                      }}
                      title="Remove from pitching plan"
                    >
                      ×
                    </span>
                  </li>
                );
              })}
              {data.pitchers.length === 0 && (
                <li className={`${styles.batItem} ${styles.empty}`}>
                  {selectedPlayerId
                    ? "Tap here to set as starter"
                    : "Drag (or tap-select) a player to set the starter"}
                </li>
              )}
            </ol>
            {selectedPlayer && data.pitchers.length > 0 && (
              <button
                onClick={handlePitcherListTap}
                className="mt-2 w-full border border-blue-300 rounded bg-blue-50 hover:bg-blue-100 text-sm font-semibold text-blue-800 py-2"
              >
                + Add {selectedPlayer.name} as Reliever {data.pitchers.length}
              </button>
            )}
          </section>
          </div>
        </div>

        {/* Dugout grid: Excel-style printable lineup table */}
        <section className={`${styles.panel} mt-4`}>
          <h2 className={styles.panelTitle}>
            Dugout Grid
            <span className="font-normal normal-case tracking-normal text-stone-400 text-[11px]">
              batting order × positions per inning · prints with notes column
            </span>
          </h2>
          <div className={styles.summaryWrap}>
            <SummaryTable data={data} cap={visibleInningCap} />
          </div>
        </section>
      </div>

      {/* Print-only view: mini-fields + batting + pitching */}
      <PrintInnings data={data} cap={visibleInningCap} />
      <PrintBattingPitching data={data} />
    </>
  );
}

function PrintBattingPitching({ data }: { data: LineupData }) {
  const getName = (id: string | null | undefined) =>
    id ? data.players.find((p) => p.id === id)?.name ?? null : null;

  const battingRows = data.battingOrder
    .map((id, i) => ({ idx: i, name: getName(id) }))
    .filter((r) => r.name); // hide empty slots in print

  return (
    <div className={`${styles.printOnly} ${styles.printExtras}`}>
      <div className={styles.printExtraCard}>
        <div className={styles.printExtraTitle}>Batting Order</div>
        {battingRows.length === 0 ? (
          <p style={{ textAlign: "center", color: "#9ca3af", margin: "4px 0" }}>
            (none set)
          </p>
        ) : (
          <ol className={styles.printExtraList}>
            {battingRows.map((r) => (
              <li key={r.idx} className={styles.printExtraRow}>
                <span className="num">{r.idx + 1}.</span>
                <span className="who">{r.name}</span>
                <span></span>
              </li>
            ))}
          </ol>
        )}
      </div>

      <div className={styles.printExtraCard}>
        <div className={styles.printExtraTitle}>Pitching Plan</div>
        {data.pitchers.length === 0 ? (
          <p style={{ textAlign: "center", color: "#9ca3af", margin: "4px 0" }}>
            (none set)
          </p>
        ) : (
          <ol className={styles.printExtraList}>
            {data.pitchers.map((id, i) => {
              const name = getName(id);
              if (!name) return null;
              return (
                <li key={`${id}-${i}`} className={styles.printExtraRow}>
                  <span className="num">{i + 1}.</span>
                  <span className="who">{name}</span>
                  <span className="tag">
                    {pitcherRoleLabel(i)}
                  </span>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}

function SummaryTable({ data, cap }: { data: LineupData; cap: number }) {
  const inningCount = Math.min(data.numInnings, cap);
  if (data.players.length === 0) {
    return (
      <p className="text-sm text-stone-500 italic p-2">
        Add players to see the dugout grid.
      </p>
    );
  }

  // Map playerId -> 1-based batting order spot for the Bat column.
  const batSpotById = new Map<string, number>();
  data.battingOrder.forEach((id, i) => {
    if (id) batSpotById.set(id, i + 1);
  });

  // Order rows by batting spot. Players not in the batting order go last.
  const rows = data.players
    .map((p) => ({ player: p, batSpot: batSpotById.get(p.id) }))
    .sort((a, b) => {
      if (a.batSpot && b.batSpot) return a.batSpot - b.batSpot;
      if (a.batSpot) return -1;
      if (b.batSpot) return 1;
      return 0;
    });

  // For each row, compute their position per inning (or "EH" if they're a
  // batter not on the field that inning, or "—" if not in batting order).
  type Cell = { kind: "pos" | "EH" | "off"; value: string };
  const cellsByPlayer = new Map<string, Cell[]>();
  for (const { player, batSpot } of rows) {
    const cells: Cell[] = [];
    for (let i = 1; i <= inningCount; i++) {
      const pos = positionInInning(data, player.id, i);
      if (pos) cells.push({ kind: "pos", value: pos });
      else if (batSpot) cells.push({ kind: "EH", value: "EH" });
      else cells.push({ kind: "off", value: "—" });
    }
    cellsByPlayer.set(player.id, cells);
  }

  // Bottom summary rows
  const fieldCounts: number[] = [];
  const ehCounts: number[] = [];
  for (let i = 0; i < inningCount; i++) {
    let f = 0;
    let e = 0;
    for (const cells of cellsByPlayer.values()) {
      if (cells[i].kind === "pos") f++;
      if (cells[i].kind === "EH") e++;
    }
    fieldCounts.push(f);
    ehCounts.push(e);
  }
  const totalAssigned = rows.length;

  return (
    <table className={styles.summaryTable}>
      <thead>
        <tr>
          <th className={styles.summaryBat}>Bat #</th>
          <th className={styles.summaryPlayer} style={{ textAlign: "left" }}>
            Player
          </th>
          {Array.from({ length: inningCount }, (_, k) => k + 1).map((i) => (
            <th key={i}>Inn {i}</th>
          ))}
          <th className={styles.summaryNotes}>Notes / Swap</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(({ player, batSpot }) => {
          const cells = cellsByPlayer.get(player.id) ?? [];
          return (
            <tr key={player.id}>
              <td className={styles.summaryBat}>
                {batSpot ?? <span className="text-stone-300">—</span>}
              </td>
              <td className={styles.summaryPlayer}>{player.name}</td>
              {cells.map((c, i) => (
                <td
                  key={i}
                  className={
                    c.kind === "pos"
                      ? styles.summaryPos
                      : c.kind === "EH"
                        ? styles.summaryEH
                        : styles.summaryBench
                  }
                >
                  {c.value}
                </td>
              ))}
              <td className={styles.summaryNotes}></td>
            </tr>
          );
        })}
      </tbody>
      <tfoot>
        <tr>
          <td colSpan={2} style={{ textAlign: "right", fontWeight: 700 }}>
            Field players (need 9):
          </td>
          {fieldCounts.map((c, i) => (
            <td
              key={i}
              className={
                c === 9 ? styles.summaryFootGood : styles.summaryFootBad
              }
            >
              {c}
            </td>
          ))}
          <td></td>
        </tr>
        <tr>
          <td colSpan={2} style={{ textAlign: "right", fontWeight: 700 }}>
            EH (sitting batters):
          </td>
          {ehCounts.map((c, i) => (
            <td key={i} className={styles.summaryFootEH}>
              {c}
            </td>
          ))}
          <td></td>
        </tr>
        <tr>
          <td colSpan={2} style={{ textAlign: "right", fontWeight: 700 }}>
            Total assigned:
          </td>
          {Array.from({ length: inningCount }, (_, i) => (
            <td key={i} className={styles.summaryFoot}>
              {fieldCounts[i] + ehCounts[i]}
            </td>
          ))}
          <td className={styles.summaryFoot} style={{ fontWeight: 800 }}>
            {totalAssigned}
          </td>
        </tr>
      </tfoot>
    </table>
  );
}

// Default player avatar used when a player hasn't uploaded a photo yet.
// File lives in /public/ — webp with a png fallback.
function PlayerSilhouette() {
  return (
    <picture>
      <source srcSet="/avatar.webp" type="image/webp" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/avatar.png" alt="" className="silhouette" />
    </picture>
  );
}

function positionInInning(
  data: LineupData,
  playerId: string,
  inning: number
): string | null {
  const lineup = data.lineups[inning];
  if (!lineup) return null;
  for (const [pos, pid] of Object.entries(lineup)) {
    if (pid === playerId) return pos;
  }
  return null;
}

function PrintInnings({ data, cap }: { data: LineupData; cap: number }) {
  const inningCount = Math.min(data.numInnings, cap);
  return (
    <div className={`${styles.printOnly} ${styles.printInnings}`}>
      {Array.from({ length: inningCount }, (_, k) => k + 1).map((i) => {
        const lineup = data.lineups[i] || {};
        return (
          <div key={i} className={styles.printInningCard}>
            <div className={styles.printInningTitle}>Inning {i}</div>
            <div className={styles.printMiniField}>
              <svg className={styles.diamondSvg} viewBox="0 0 100 100" preserveAspectRatio="none">
                <circle cx="50" cy="68" r="22" fill="#eee" stroke="#999" strokeWidth=".3" />
                <polygon points="50,57 62,68 50,79 38,68" fill="white" stroke="#999" strokeWidth=".3" />
                <line x1="50" y1="79" x2="5" y2="34" stroke="#999" strokeWidth=".4" />
                <line x1="50" y1="79" x2="95" y2="34" stroke="#999" strokeWidth=".4" />
              </svg>
              {POSITIONS_PRINT.map((pos) => {
                const playerId = lineup[pos.id];
                const player = playerId
                  ? data.players.find((p) => p.id === playerId)
                  : undefined;
                return (
                  <div
                    key={pos.id}
                    className={`${styles.slot} ${player ? styles.slotFilled : ""}`}
                    style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                  >
                    <div className="pos">{pos.id}</div>
                    {player && <div className="who">{player.name}</div>}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

