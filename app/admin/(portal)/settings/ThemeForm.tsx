"use client";

import { useActionState, useState } from "react";
import { updateTheme, revertTheme } from "./actions";

interface ThemeSnapshot {
  gold:   string | null;
  cobalt: string | null;
  navy:   string | null;
  saved_at?: string;
}

interface Props {
  current: { theme_gold: string | null; theme_cobalt: string | null; theme_navy: string | null } | null;
  history: ThemeSnapshot[];
}

const PRESETS = [
  { label: "Default",   gold: "#B4FF00", cobalt: "#5B72FF", navy: "#07070F" },
  { label: "Crimson",   gold: "#FF4444", cobalt: "#FF8C00", navy: "#0A0000" },
  { label: "Ocean",     gold: "#00E5FF", cobalt: "#0066CC", navy: "#020810" },
  { label: "Forest",    gold: "#22FF88", cobalt: "#00A878", navy: "#030F05" },
  { label: "Royal",     gold: "#FFD700", cobalt: "#9B59B6", navy: "#07060F" },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function ThemeForm({ current, history }: Props) {
  const [applyState, applyAction, applyPending] = useActionState(updateTheme, null);
  const [revertState, revertAction, revertPending] = useActionState(revertTheme, null);

  const [gold,   setGold]   = useState(current?.theme_gold   ?? "#B4FF00");
  const [cobalt, setCobalt] = useState(current?.theme_cobalt ?? "#5B72FF");
  const [navy,   setNavy]   = useState(current?.theme_navy   ?? "#07070F");

  function applyPreset(p: typeof PRESETS[0]) {
    setGold(p.gold);
    setCobalt(p.cobalt);
    setNavy(p.navy);
  }

  const busy = applyPending || revertPending;

  return (
    <div className="space-y-5">
      {(applyState && "error" in applyState) && (
        <p className="text-xs text-danger bg-danger/5 border border-danger/30 px-3 py-2 rounded">
          {applyState.error}
        </p>
      )}
      {(applyState && "success" in applyState) && (
        <p className="text-xs text-success bg-success/5 border border-success/30 px-3 py-2 rounded">
          Theme applied. Public pages will reflect the new colours.
        </p>
      )}
      {(revertState && "error" in revertState) && (
        <p className="text-xs text-danger bg-danger/5 border border-danger/30 px-3 py-2 rounded">
          {revertState.error}
        </p>
      )}

      {/* Presets */}
      <div>
        <p className="text-navy text-xs font-semibold uppercase tracking-wide mb-2">Presets</p>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => applyPreset(p)}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 border border-border rounded hover:border-navy transition-colors bg-white"
            >
              <span className="flex gap-1">
                <span className="w-3 h-3 rounded-sm inline-block border border-black/10" style={{ backgroundColor: p.gold }} />
                <span className="w-3 h-3 rounded-sm inline-block border border-black/10" style={{ backgroundColor: p.cobalt }} />
                <span className="w-3 h-3 rounded-sm inline-block border border-black/10" style={{ backgroundColor: p.navy }} />
              </span>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom pickers */}
      <div>
        <p className="text-navy text-xs font-semibold uppercase tracking-wide mb-2">Custom colours</p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Accent / Gold", value: gold,   set: setGold,   name: "theme_gold" },
            { label: "Link / Cobalt", value: cobalt, set: setCobalt, name: "theme_cobalt" },
            { label: "Background",    value: navy,   set: setNavy,   name: "theme_navy" },
          ].map(({ label, value, set, name }) => (
            <div key={name}>
              <label className="block text-navy text-[10px] font-semibold uppercase tracking-wide mb-1">{label}</label>
              <div className="flex items-center gap-1.5">
                <input
                  type="color"
                  value={value}
                  onChange={(e) => set(e.target.value)}
                  className="w-8 h-8 rounded border border-border cursor-pointer p-0.5 bg-white"
                />
                <input
                  type="text"
                  name={name}
                  value={value}
                  onChange={(e) => set(e.target.value)}
                  maxLength={7}
                  className="w-full border border-border text-navy text-xs px-2 py-1.5 rounded font-mono focus:outline-none focus:border-cobalt"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Preview bar */}
      <div className="flex rounded overflow-hidden h-6 border border-border">
        <div className="flex-1" style={{ backgroundColor: navy }} />
        <div className="w-12" style={{ backgroundColor: cobalt }} />
        <div className="w-12" style={{ backgroundColor: gold }} />
      </div>

      {/* Apply button — hidden form inputs carry the state values */}
      <form action={applyAction}>
        <input type="hidden" name="theme_gold"   value={gold} />
        <input type="hidden" name="theme_cobalt" value={cobalt} />
        <input type="hidden" name="theme_navy"   value={navy} />
        <button
          type="submit"
          disabled={busy}
          className="bg-navy text-white text-xs font-semibold px-4 py-2 rounded hover:bg-navy/80 transition-colors disabled:opacity-60"
        >
          {applyPending ? "Applying..." : "Apply theme"}
        </button>
      </form>

      {/* History */}
      {history.length > 0 && (
        <div>
          <p className="text-navy text-xs font-semibold uppercase tracking-wide mb-2">Previous themes</p>
          <div className="flex flex-col gap-2">
            {history.map((snap, i) => (
              <div key={i} className="flex items-center gap-3 border border-border rounded px-3 py-2 bg-surface">
                <div className="flex gap-1">
                  <span className="w-4 h-4 rounded-sm border border-black/10" style={{ backgroundColor: snap.navy   ?? "#07070F" }} />
                  <span className="w-4 h-4 rounded-sm border border-black/10" style={{ backgroundColor: snap.cobalt ?? "#5B72FF" }} />
                  <span className="w-4 h-4 rounded-sm border border-black/10" style={{ backgroundColor: snap.gold   ?? "#B4FF00" }} />
                </div>
                {snap.saved_at && (
                  <span className="text-[10px] text-muted flex-1">{formatDate(snap.saved_at)}</span>
                )}
                <form action={revertAction}>
                  <input type="hidden" name="index" value={i} />
                  <button
                    type="submit"
                    disabled={busy}
                    className="text-[10px] font-semibold text-cobalt hover:text-navy transition-colors disabled:opacity-60"
                  >
                    Restore
                  </button>
                </form>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
