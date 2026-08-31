"use client";

import { useActionState } from "react";
import { submitResult } from "./actions";

interface Props {
  fixtureId: string;
  clubId: string;
  isClubA: boolean;
  opponentName: string;
  hasSubmitted: boolean;
}

export function SubmitResultForm({ fixtureId, clubId, isClubA, opponentName, hasSubmitted: initiallySubmitted }: Props) {
  const [state, action, isPending] = useActionState(submitResult, null);

  if (initiallySubmitted) {
    return (
      <p className="text-sm text-white/50">
        Result submitted. Waiting for <span className="font-medium text-white">{opponentName}</span> to report their score.
        If scores match, the result will be confirmed automatically.
      </p>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="fixture_id" value={fixtureId} />
      <input type="hidden" name="is_club_a" value={String(isClubA)} />

      {state?.error && (
        <div className="bg-danger/5 border border-danger/30 text-danger text-xs px-3 py-2">
          {state.error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-white/70 text-xs font-semibold mb-1 uppercase tracking-wide">
            Your score
          </label>
          <input
            name="score_own"
            type="number"
            min="0"
            required
            placeholder="0"
            className="w-full border border-white/10 bg-navy/50 text-white text-sm px-3 py-2 focus:outline-none focus:border-cobalt transition-colors"
          />
        </div>
        <div>
          <label className="block text-white/70 text-xs font-semibold mb-1 uppercase tracking-wide">
            {opponentName}&apos;s score
          </label>
          <input
            name="score_opp"
            type="number"
            min="0"
            required
            placeholder="0"
            className="w-full border border-white/10 bg-navy/50 text-white text-sm px-3 py-2 focus:outline-none focus:border-cobalt transition-colors"
          />
        </div>
      </div>

      <div>
        <label className="block text-white/70 text-xs font-semibold mb-1 uppercase tracking-wide">
          Proof URL <span className="text-white/40 font-normal normal-case">(screenshot link)</span>
        </label>
        <input
          name="proof_url"
          type="url"
          required
          placeholder="https://drive.google.com/... or https://x.com/..."
          className="w-full border border-white/10 bg-navy/50 text-white text-sm px-3 py-2 focus:outline-none focus:border-cobalt transition-colors placeholder:text-white/20"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="bg-gold text-navy font-semibold text-sm px-5 py-2 hover:bg-gold/90 transition-colors disabled:opacity-60"
      >
        {isPending ? "Submitting..." : "Submit result"}
      </button>
    </form>
  );
}
