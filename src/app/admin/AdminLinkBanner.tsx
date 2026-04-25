"use client";

import { useState } from "react";

export default function AdminLinkBanner({
  link,
  forEmail,
  kind,
}: {
  link: string;
  forEmail: string;
  kind: "reset" | "magic";
}) {
  const [copied, setCopied] = useState(false);
  const label =
    kind === "reset"
      ? "Password-reset link for"
      : "One-time login (magic) link for";

  return (
    <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded">
      <div className="text-sm text-emerald-900 mb-2">
        <strong>{label}</strong>{" "}
        <span className="font-mono">{forEmail}</span>:
      </div>
      <div className="flex gap-2">
        <input
          readOnly
          value={link}
          onClick={(e) => (e.target as HTMLInputElement).select()}
          className="flex-1 px-3 py-2 bg-white border border-stone-300 rounded text-xs font-mono"
        />
        <button
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(link);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            } catch {
              // ignore
            }
          }}
          className="px-3 py-2 bg-stone-900 hover:bg-stone-800 text-white text-sm font-semibold rounded"
        >
          {copied ? "✓ Copied" : "Copy"}
        </button>
      </div>
      <p className="text-xs text-emerald-800 mt-2">
        Send this to the user via your own channel (email, text, Slack). It
        works for ~1 hour and can only be used once.
      </p>
    </div>
  );
}
