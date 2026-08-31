"use client";

import { useActionState } from "react";
import { resolveDispute } from "./actions";

interface Props {
  fixtureId: string;
  clubAId: string;
  clubBId: string;
  clubAName: string;
  clubBName: string;
}

export function ResolveForm({ fixtureId, clubAId, clubBId, clubAName, clubBName }: Props) {
  const [state, action, isPending] = useActionState(resolveDispute, null);

  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="fixture_id" value={fixtureId} />
      <input type="hidden" name="club_a_id" value={clubAId} />
      <input type="hidden" name="club_b_id" value={clubBId} />

      {state?.error && (
        <p className="w-full text-danger text-xs">{state.error}</p>
      )}

      <div>
        <label className="block text-white/70 text-xs font-semibold mb-1 uppercase tracking-wide">
          {clubAName} score
        </label>
        <input
          name="score_a"
          type="number"
          min="0"
          required
          placeholder="0"
          className="w-20 border border-white/10 bg-navy/50 text-white text-sm px-3 py-2 focus:outline-none focus:border-cobalt transition-colors"
        />
      </div>

      <div>
        <label className="block text-white/70 text-xs font-semibold mb-1 uppercase tracking-wide">
          {clubBName} score
        </label>
        <input
          name="score_b"
          type="number"
          min="0"
          required
          placeholder="0"
          className="w-20 border border-white/10 bg-navy/50 text-white text-sm px-3 py-2 focus:outline-none focus:border-cobalt transition-colors"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="bg-white/10 text-white font-semibold text-sm px-5 py-2 hover:bg-white/20 transition-colors disabled:opacity-60"
      >
        {isPending ? "Saving..." : "Set official score"}
      </button>
    </form>
  );
}
