// Shared types and constants for the lineup builder

export type Position = {
  id: string;
  label: string;
  x: number; // percent across the field box
  y: number; // percent down the field box
};

export const POSITIONS: Position[] = [
  { id: "P", label: "Pitcher", x: 50, y: 68 },
  { id: "C", label: "Catcher", x: 50, y: 91 },
  { id: "1B", label: "First Base", x: 65, y: 68 },
  { id: "2B", label: "Second Base", x: 57, y: 56 },
  { id: "3B", label: "Third Base", x: 35, y: 68 },
  { id: "SS", label: "Shortstop", x: 43, y: 56 },
  { id: "LF", label: "Left Field", x: 22, y: 30 },
  { id: "CF", label: "Center Field", x: 50, y: 18 },
  { id: "RF", label: "Right Field", x: 78, y: 30 },
];

export const NUM_INNINGS = 6;
export const DEFAULT_BATTING_SLOTS = 12;

export type Player = { id: string; name: string };
export type InningLineup = Record<string, string>; // positionId -> playerId
export type LineupData = {
  players: Player[];
  lineups: Record<number, InningLineup>;
  battingOrder: (string | null)[];
  currentInning: number;
};

export function emptyLineups(): Record<number, InningLineup> {
  const o: Record<number, InningLineup> = {};
  for (let i = 1; i <= NUM_INNINGS; i++) o[i] = {};
  return o;
}

export function defaultLineupData(): LineupData {
  return {
    players: [],
    lineups: emptyLineups(),
    battingOrder: new Array(DEFAULT_BATTING_SLOTS).fill(null),
    currentInning: 1,
  };
}

// Coerce arbitrary JSON from Supabase into a valid LineupData shape
export function normalize(raw: unknown): LineupData {
  const d = defaultLineupData();
  if (!raw || typeof raw !== "object") return d;
  const data = raw as Partial<LineupData> & {
    assignments?: InningLineup;
  };

  if (Array.isArray(data.players)) {
    d.players = data.players.filter(
      (p): p is Player =>
        !!p && typeof p === "object" && typeof p.id === "string" && typeof p.name === "string"
    );
  }

  if (data.lineups && typeof data.lineups === "object") {
    for (let i = 1; i <= NUM_INNINGS; i++) {
      const inning = (data.lineups as Record<number, InningLineup>)[i];
      if (inning && typeof inning === "object") {
        d.lineups[i] = { ...inning };
      }
    }
  } else if (data.assignments && typeof data.assignments === "object") {
    // Migrate legacy single-inning shape
    d.lineups[1] = { ...data.assignments };
  }

  if (Array.isArray(data.battingOrder)) {
    d.battingOrder = data.battingOrder.map((v) =>
      typeof v === "string" ? v : null
    );
    if (d.battingOrder.length === 0) {
      d.battingOrder = new Array(DEFAULT_BATTING_SLOTS).fill(null);
    }
  }

  if (typeof data.currentInning === "number" && data.currentInning >= 1 && data.currentInning <= NUM_INNINGS) {
    d.currentInning = data.currentInning;
  }

  return d;
}

export function uid() {
  return Math.random().toString(36).slice(2, 9);
}
