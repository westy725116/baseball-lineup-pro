"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  POSITIONS,
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
};

type SaveStatus = "idle" | "saving" | "saved" | "error";

export default function LineupBuilder({ gameId, initialData }: Props) {
  const [data, setData] = useState<LineupData>(() =>
    normalize(initialData ?? defaultLineupData())
  );
  const [playerInput, setPlayerInput] = useState("");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [dragOverPos, setDragOverPos] = useState<string | null>(null);
  const [dragOverBat, setDragOverBat] = useState<number | null>(null);
  const [dragOverPitch, setDragOverPitch] = useState<number | null>(null);

  const supabase = useRef(createClient()).current;
  const isFirstRender = useRef(true);

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
        <div className="flex items-center gap-3 mb-3 text-xs">
          <button
            onClick={() => window.print()}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded"
          >
            🖨 Print
          </button>
          <span
            className={
              saveStatus === "error"
                ? "text-red-600 font-semibold"
                : saveStatus === "saving"
                  ? "text-stone-500"
                  : saveStatus === "saved"
                    ? "text-emerald-600"
                    : "text-stone-400"
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
                return (
                  <li
                    key={p.id}
                    className={`${styles.player} ${placed ? styles.placed : ""}`}
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
                    <span className={styles.name}>{p.name}</span>
                    {placed && <span className={styles.posTag}>{placed}</span>}
                    <span
                      className={styles.removeX}
                      onClick={() => removePlayer(p.id)}
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
          </section>

          {/* Field */}
          <section className={styles.panel}>
            <div className={styles.fieldHeader}>
              <h2>Defensive Lineup</h2>
              <div className={styles.inningTabs}>
                {Array.from({ length: data.numInnings }, (_, k) => k + 1).map((i) => {
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
                {data.numInnings < MAX_INNINGS && (
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
              </div>
              <div className={styles.inningActions}>
                <button
                  onClick={copyFromPreviousInning}
                  className="border border-stone-300 rounded bg-white hover:bg-stone-50"
                  title="Copy previous inning's lineup"
                >
                  ⧉ Copy prev
                </button>
                <button
                  onClick={clearCurrentInning}
                  className="border border-red-200 text-red-600 rounded bg-white hover:bg-red-50"
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

              {POSITIONS.map((pos) => {
                const playerId = lineup[pos.id];
                const player = getPlayer(playerId);
                const isOver = dragOverPos === pos.id;
                return (
                  <div
                    key={pos.id}
                    className={`${styles.slot} ${player ? styles.slotFilled : ""} ${isOver ? styles.slotOver : ""}`}
                    style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
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
                    <div className="pos">{pos.id}</div>
                    {player ? (
                      <>
                        <div className="who">{player.name}</div>
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
                      <div className="label">{pos.label}</div>
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
                className="border border-stone-300 rounded bg-white hover:bg-stone-50 text-[11px] font-semibold px-2 py-0.5 normal-case tracking-normal"
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
                    className={`${styles.batItem} ${player ? "" : styles.empty} ${isOver ? styles.over : ""}`}
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
              className="mt-2 w-full border border-stone-300 rounded bg-white hover:bg-stone-50 text-xs font-semibold py-1.5"
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
                  Drag a player here to set the starter
                </li>
              )}
            </ol>
          </section>
          </div>
        </div>

        {/* Player summary spans full width */}
        <section className={`${styles.panel} mt-4`}>
          <h2 className={styles.panelTitle}>
            Player Summary
            <span className="font-normal normal-case tracking-normal text-stone-400 text-[11px]">
              positions per inning
            </span>
          </h2>
          <div className={styles.summaryWrap}>
            <SummaryTable data={data} />
          </div>
        </section>
      </div>

      {/* Print-only view: 6 mini-fields */}
      <PrintInnings data={data} />
    </>
  );
}

function SummaryTable({ data }: { data: LineupData }) {
  if (data.players.length === 0) {
    return (
      <p className="text-sm text-stone-500 italic p-2">
        Add players to see the summary.
      </p>
    );
  }

  return (
    <table className={styles.summaryTable}>
      <thead>
        <tr>
          <th className={styles.summaryPlayer}>Player</th>
          <th>Innings</th>
          {Array.from({ length: data.numInnings }, (_, k) => k + 1).map((i) => (
            <th key={i}>{i}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.players.map((p) => {
          const positionsByInning = Array.from(
            { length: data.numInnings },
            (_, k) => positionInInning(data, p.id, k + 1)
          );
          const playedCount = positionsByInning.filter(Boolean).length;
          return (
            <tr key={p.id}>
              <td className={styles.summaryPlayer}>{p.name}</td>
              <td className={styles.summaryCount}>
                {playedCount}/{data.numInnings}
              </td>
              {positionsByInning.map((pos, i) => (
                <td
                  key={i}
                  className={pos ? styles.summaryPos : styles.summaryBench}
                >
                  {pos ?? "—"}
                </td>
              ))}
            </tr>
          );
        })}
      </tbody>
    </table>
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

function PrintInnings({ data }: { data: LineupData }) {
  return (
    <div className={`${styles.printOnly} ${styles.printInnings}`}>
      {Array.from({ length: data.numInnings }, (_, k) => k + 1).map((i) => {
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
              {POSITIONS.map((pos) => {
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

