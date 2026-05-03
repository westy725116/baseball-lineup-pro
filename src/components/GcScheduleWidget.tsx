"use client";

import { useEffect, useRef, useState } from "react";

// Loads the GameChanger SDK once and renders a team's schedule widget.
// Documented embed snippet:
//   <div id="gc-schedule-widget-XXX"></div>
//   <script src="https://widgets.gc.com/static/js/sdk.v1.js"></script>
//   <script>window.GC.team.schedule.init({ target: "#gc-schedule-widget-XXX",
//                                         widgetId: "...",
//                                         maxVerticalGamesVisible: 4 })</script>
declare global {
  interface Window {
    GC?: {
      team?: {
        schedule?: {
          init?: (opts: {
            target: string;
            widgetId: string;
            maxVerticalGamesVisible?: number;
          }) => void;
        };
      };
    };
  }
}

const SCRIPT_SRC = "https://widgets.gc.com/static/js/sdk.v1.js";

function loadScriptOnce(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") return reject();
    if (window.GC?.team?.schedule?.init) return resolve();
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${SCRIPT_SRC}"]`
    );
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject());
      return;
    }
    const s = document.createElement("script");
    s.src = SCRIPT_SRC;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject();
    document.body.appendChild(s);
  });
}

export default function GcScheduleWidget({ widgetId }: { widgetId: string }) {
  // Use the exact ID format from GC's documented embed snippet
  const shortHash = widgetId.replace(/[^a-z0-9]/gi, "").slice(0, 4);
  const targetId = `gc-schedule-widget-${shortHash}`;
  const initRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initRef.current) return;
    let cancelled = false;
    (async () => {
      try {
        await loadScriptOnce();
        if (cancelled) return;
        const init = window.GC?.team?.schedule?.init;
        if (typeof init !== "function") {
          setError(
            "GameChanger SDK loaded but team.schedule.init isn't available."
          );
          return;
        }
        try {
          init({
            target: `#${targetId}`,
            widgetId,
            maxVerticalGamesVisible: 4,
          });
          initRef.current = true;
        } catch (e) {
          setError(`GC widget error: ${(e as Error).message}`);
        }
      } catch {
        setError("Couldn't load the GameChanger SDK script.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [widgetId, targetId]);

  return (
    <div className="bg-white border border-stone-200 rounded-lg p-3 mb-3">
      <div className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2 flex items-center justify-between">
        <span>📅 GameChanger Schedule</span>
        <a
          href="https://gc.com"
          target="_blank"
          rel="noopener"
          className="text-stone-400 hover:text-stone-700 text-[10px] normal-case tracking-normal"
        >
          via gc.com
        </a>
      </div>
      {error && (
        <div className="mb-2 p-2 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded">
          {error} (Widget ID: <code className="font-mono">{widgetId}</code>)
        </div>
      )}
      <div id={targetId} />
    </div>
  );
}
