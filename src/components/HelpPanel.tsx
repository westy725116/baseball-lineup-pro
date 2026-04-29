"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "lineup-pro-help-dismissed";

// Expandable "How to use" panel.
// Defaults to expanded the first time a user lands here, then collapsed thereafter.
export default function HelpPanel() {
  const [open, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem(STORAGE_KEY);
      setOpen(!dismissed);
    } catch {
      setOpen(true);
    }
    setHydrated(true);
  }, []);

  function toggle() {
    setOpen((prev) => {
      const next = !prev;
      try {
        if (next) {
          localStorage.removeItem(STORAGE_KEY);
        } else {
          localStorage.setItem(STORAGE_KEY, "1");
        }
      } catch {
        // ignore
      }
      return next;
    });
  }

  // Don't flash the wrong state during hydration
  if (!hydrated) return null;

  return (
    <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg overflow-hidden print:hidden">
      <button
        type="button"
        onClick={toggle}
        className="w-full flex items-center justify-between gap-2 px-4 py-2 text-left text-sm font-semibold text-amber-900 hover:bg-amber-100"
        aria-expanded={open}
      >
        <span>💡 How to use the lineup builder</span>
        <span className="text-xs">{open ? "Hide ▴" : "Show ▾"}</span>
      </button>

      {open && (
        <div className="px-4 pb-4 pt-1 text-sm text-amber-900 space-y-3">
          <Section title="1. Add your players">
            Type names into the <strong>Roster</strong> panel, or click{" "}
            <strong>↓ Load roster</strong> to pull from your saved Team Roster.
            Use <strong>↑ Save to team</strong> to remember new players for next
            game.
          </Section>

          <Section title="2. Place players on the field">
            <strong>On a phone or tablet:</strong> tap a player to select them
            (a blue banner appears), then tap a position on the diamond.
            <br />
            <strong>On a computer:</strong> drag a player from the roster onto
            a position. Both methods work side-by-side.
          </Section>

          <Section title="3. Plan all the innings">
            Click the inning tabs (<strong>1, 2, 3…</strong>) above the field
            to set up each inning&apos;s defense.{" "}
            <strong>⧉ Copy prev</strong> duplicates the last inning so you only
            tweak swaps. The dashed <strong>+</strong> tab adds a 7th, 8th, or
            9th inning (Pro only).
          </Section>

          <Section title="4. Build the batting order">
            Tap or drag players into the <strong>Batting Order</strong> on the
            right. Click <strong>Auto-fill</strong> to pull everyone fielded
            this inning, in standard order. Use <strong>+ Add slot</strong> /{" "}
            <strong>×</strong> to grow or shrink the order (10 vs 12 batters,
            etc.).
          </Section>

          <Section title="5. Pitching plan">
            Tap a player, then tap the <strong>+ Add as Reliever</strong>{" "}
            button to assign them. First pitcher = Starter, then Reliever 1,
            Reliever 2, and so on.
          </Section>

          <Section title="6. Print or share">
            <strong>🖨 Print</strong> generates a clean dugout sheet with all
            innings, batting order, and pitching plan.
            <br />
            <strong>🔗 Share</strong> generates a public link your assistant
            coaches can open without an account — they can leave comments
            you&apos;ll see at the bottom of this page.
          </Section>

          <Section title="Tip: Player Summary">
            Below the lineup, the Player Summary table shows who&apos;s playing
            where in each inning at a glance — handy for spotting who hasn&apos;t
            played enough.
          </Section>

          <button
            type="button"
            onClick={toggle}
            className="mt-2 text-xs font-semibold text-amber-900 underline"
          >
            Got it — hide this
          </button>
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="font-bold text-amber-950">{title}</div>
      <div className="mt-0.5">{children}</div>
    </div>
  );
}
