"use client";

import { useState } from "react";
import {
  enableSharing,
  disableSharing,
  regenerateShareToken,
} from "@/app/games/[id]/share-actions";

type Props = {
  gameId: string;
  shareToken: string | null;
  shareEnabled: boolean;
  isPro: boolean;
  origin: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  slot?: "button" | "popover";
};

export default function SharePanel({
  gameId,
  shareToken,
  shareEnabled,
  isPro,
  origin,
  open: openProp,
  onOpenChange,
  slot,
}: Props) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp : internalOpen;
  const setOpen = (v: boolean) => {
    if (isControlled) onOpenChange?.(v);
    else setInternalOpen(v);
  };
  const [copied, setCopied] = useState(false);

  if (!isPro) {
    const lockedButton = (
      <a
        href="/upgrade"
        className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-stone-500 hover:bg-stone-600 rounded-md min-w-[120px] justify-center"
        title="Sharing is a Pro feature"
      >
        🔒 Share
      </a>
    );
    if (slot === "popover") return null;
    return lockedButton;
  }

  const url = shareToken ? `${origin}/share/${shareToken}` : null;

  const button = (
    <button
      type="button"
      onClick={() => setOpen(!open)}
      className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-stone-900 hover:bg-black rounded-md min-w-[120px] justify-center"
    >
      🔗 Share {shareEnabled ? "(on)" : ""}
    </button>
  );

  const popover = open && (
    <div className="w-full max-w-md flex flex-col gap-3">
      <div className="p-4 pr-10 bg-stone-50 border border-stone-200 rounded-lg shadow-sm relative">
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close share panel"
          title="Close"
          className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full text-stone-500 hover:text-stone-900 hover:bg-stone-200 text-xl leading-none"
        >
          ×
        </button>
        {!shareEnabled ? (
          <form action={enableSharing}>
            <input type="hidden" name="game_id" value={gameId} />
            <p className="text-sm text-stone-700 mb-3">
              Generate a public link your assistant coaches can open without
              signing in. They&apos;ll see the lineup and can leave comments.
            </p>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded"
            >
              Enable sharing
            </button>
          </form>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-stone-700">
              Sharing is <strong>on</strong>. Copy the link below to send to
              your assistant coaches.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <form action={disableSharing}>
                <input type="hidden" name="game_id" value={gameId} />
                <button
                  type="submit"
                  className="px-3 py-1.5 text-xs font-semibold border border-stone-300 bg-white hover:bg-stone-100 rounded"
                >
                  Disable sharing
                </button>
              </form>
              <form action={regenerateShareToken}>
                <input type="hidden" name="game_id" value={gameId} />
                <button
                  type="submit"
                  className="px-3 py-1.5 text-xs font-semibold border border-amber-300 text-amber-800 bg-amber-50 hover:bg-amber-100 rounded"
                  title="Invalidates the old link"
                >
                  Regenerate link
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {shareEnabled && url && (
        <div className="p-4 bg-white border border-stone-200 rounded-lg shadow-sm">
          <label className="block text-xs font-semibold text-stone-600 mb-1.5 uppercase tracking-wider">
            Public link
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              readOnly
              value={url}
              onClick={(e) => (e.target as HTMLInputElement).select()}
              className="flex-1 min-w-0 px-3 py-2 border border-stone-300 rounded text-xs bg-stone-50 font-mono"
            />
            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(url);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                } catch {
                  // fallthrough
                }
              }}
              className="px-3 py-2 bg-stone-900 hover:bg-stone-800 text-white text-sm font-semibold rounded shrink-0"
            >
              {copied ? "✓ Copied" : "Copy link"}
            </button>
          </div>
          <p className="text-xs text-stone-500 mt-2">
            Anyone with this link can view + comment. Don&apos;t share publicly
            if you don&apos;t want that.
          </p>
        </div>
      )}
    </div>
  );

  if (slot === "button") return button;
  if (slot === "popover") return popover || null;
  return (
    <>
      {button}
      {popover}
    </>
  );
}
