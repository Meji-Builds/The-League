"use client";

import { useActionState } from "react";
import { confirmResult } from "./actions";

interface Props {
  fixtureId: string;
  clubAId:   string;
  clubBId:   string;
  clubAName: string;
  clubBName: string;
  defaultA?: number;
  defaultB?: number;
}

export function ConfirmResultForm({ fixtureId, clubAId, clubBId, clubAName, clubBName, defaultA = 0, defaultB = 0 }: Props) {
  const [state, action, isPending] = useActionState(confirmResult, null);

  return (
    <form action={action} className="flex flex-wrap items-end gap-3 mt-4 pt-4 border-t border-white/6">
      <input type="hidden" name="fixture_id" value={fixtureId} />
      <input type="hidden" name="club_a_id"  value={clubAId} />
      <input type="hidden" name="club_b_id"  value={clubBId} />

      {state?.error && (
        <p className="w-full text-xs text-danger">{state.error}</p>
      )}

      <div className="flex items-center gap-2">
        <label className="text-xs text-white/50 w-28 text-right truncate">{clubAName}</label>
        <input
          name="score_a"
          type="number"
          min="0"
          defaultValue={defaultA}
          className="w-14 border border-white/10 bg-navy/50 text-white text-sm px-2 py-1.5 focus:outline-none focus:border-cobalt transition-colors text-center"
        />
        <span className="text-white/40 text-xs font-bold">-</span>
        <input
          name="score_b"
          type="number"
          min="0"
          defaultValue={defaultB}
          className="w-14 border border-white/10 bg-navy/50 text-white text-sm px-2 py-1.5 focus:outline-none focus:border-cobalt transition-colors text-center"
        />
        <label className="text-xs text-white/50 w-28 truncate">{clubBName}</label>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="bg-success/10 text-success font-semibold text-xs px-4 py-1.5 rounded hover:bg-success/20 transition-colors disabled:opacity-60"
      >
        {isPending ? "Confirming..." : "Confirm result"}
      </button>
    </form>
  );
}
