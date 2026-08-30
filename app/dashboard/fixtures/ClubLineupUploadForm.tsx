"use client";

import { useActionState } from "react";
import { uploadClubLineup } from "./actions";

interface Props {
  fixtureId: string;
  hasLineup: boolean;
}

export function ClubLineupUploadForm({ fixtureId, hasLineup }: Props) {
  const [state, action, isPending] = useActionState(uploadClubLineup, null);

  return (
    <form action={action} className="mt-3 pt-3 border-t border-border">
      <input type="hidden" name="fixture_id" value={fixtureId} />
      <p className="text-xs font-semibold text-navy uppercase tracking-wide mb-2">
        Lineup Graphic {hasLineup && <span className="normal-case font-normal text-success">(uploaded)</span>}
      </p>

      {state && "error" in state && (
        <p className="text-xs text-danger mb-2">{state.error}</p>
      )}

      <div className="flex items-center gap-3 flex-wrap">
        <input
          name="lineup_image"
          type="file"
          accept="image/*"
          className="text-xs text-muted file:mr-2 file:text-xs file:font-semibold file:bg-navy file:text-white file:border-0 file:px-2.5 file:py-1 file:rounded file:cursor-pointer hover:file:bg-navy/80"
        />
        <button
          type="submit"
          disabled={isPending}
          className="text-xs font-semibold px-4 py-1.5 rounded bg-cobalt/10 text-cobalt hover:bg-cobalt/20 transition-colors disabled:opacity-60 shrink-0"
        >
          {isPending ? "Uploading..." : hasLineup ? "Replace" : "Upload"}
        </button>
      </div>
    </form>
  );
}
