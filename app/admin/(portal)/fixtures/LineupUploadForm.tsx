"use client";

import { useActionState } from "react";
import { uploadLineupImages } from "./actions";

interface Props {
  fixtureId: string;
  clubAName: string;
  clubBName: string;
  hasLineupA: boolean;
  hasLineupB: boolean;
}

export function LineupUploadForm({ fixtureId, clubAName, clubBName, hasLineupA, hasLineupB }: Props) {
  const [state, action, isPending] = useActionState(uploadLineupImages, null);

  return (
    <form action={action} className="mt-3 pt-3 border-t border-border">
      <input type="hidden" name="fixture_id" value={fixtureId} />
      <p className="text-xs font-semibold text-navy uppercase tracking-wide mb-2">Lineup Graphics</p>

      {state && "error" in state && (
        <p className="text-xs text-danger mb-2">{state.error}</p>
      )}
      {state === null && isPending === false && hasLineupA && (
        <p className="text-xs text-success mb-2">Lineups saved.</p>
      )}

      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-muted mb-1">
            {clubAName} lineup {hasLineupA && <span className="text-success">(uploaded)</span>}
          </label>
          <input
            name="lineup_image_a"
            type="file"
            accept="image/*"
            className="w-full text-xs text-muted file:mr-2 file:text-xs file:font-semibold file:bg-navy file:text-white file:border-0 file:px-2.5 file:py-1 file:rounded file:cursor-pointer hover:file:bg-navy/80"
          />
        </div>
        <div>
          <label className="block text-xs text-muted mb-1">
            {clubBName} lineup {hasLineupB && <span className="text-success">(uploaded)</span>}
          </label>
          <input
            name="lineup_image_b"
            type="file"
            accept="image/*"
            className="w-full text-xs text-muted file:mr-2 file:text-xs file:font-semibold file:bg-navy file:text-white file:border-0 file:px-2.5 file:py-1 file:rounded file:cursor-pointer hover:file:bg-navy/80"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="mt-2 text-xs font-semibold px-4 py-1.5 rounded bg-cobalt/10 text-cobalt hover:bg-cobalt/20 transition-colors disabled:opacity-60"
      >
        {isPending ? "Uploading..." : "Upload Lineups"}
      </button>
    </form>
  );
}
