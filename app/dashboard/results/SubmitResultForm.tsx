"use client";

import { useActionState } from "react";
import { submitResult } from "./actions";

interface Props {
  fixtureId: string;
  clubId: string;
  isClubA: boolean;
  opponentName: string;
  currentStatus: string;
}

export function SubmitResultForm({ fixtureId, clubId, isClubA, opponentName, currentStatus }: Props) {
  const [state, action, isPending] = useActionState(submitResult, null);

  // Success state: form submitted (state null after revalidation means page reloaded fresh data).
  if (currentStatus === "reported" && !state) {
    return (
      <p className="text-sm text-muted">
        Result submitted. Waiting for <span className="font-medium text-navy">{opponentName}</span> to report their score.
        If scores match, the result will be confirmed automatically.
      </p>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="fixture_id" value={fixtureId} />
      <input type="hidden" name="is_club_a" value={String(isClubA)} />

      {state?.error && (
        <div className="bg-danger/5 border border-danger/30 text-danger text-xs px-3 py-2 rounded">
          {state.error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-navy text-xs font-semibold mb-1 uppercase tracking-wide">
            Your score
          </label>
          <input
            name="score_own"
            type="number"
            min="0"
            required
            placeholder="0"
            className="w-full border border-border bg-white text-navy text-sm px-3 py-2 rounded focus:outline-none focus:border-cobalt transition-colors"
          />
        </div>
        <div>
          <label className="block text-navy text-xs font-semibold mb-1 uppercase tracking-wide">
            {opponentName}&apos;s score
          </label>
          <input
            name="score_opp"
            type="number"
            min="0"
            required
            placeholder="0"
            className="w-full border border-border bg-white text-navy text-sm px-3 py-2 rounded focus:outline-none focus:border-cobalt transition-colors"
          />
        </div>
      </div>

      <div>
        <label className="block text-navy text-xs font-semibold mb-1 uppercase tracking-wide">
          Proof URL <span className="text-muted font-normal normal-case">(screenshot link)</span>
        </label>
        <input
          name="proof_url"
          type="url"
          required
          placeholder="https://drive.google.com/... or https://x.com/..."
          className="w-full border border-border bg-white text-navy text-sm px-3 py-2 rounded focus:outline-none focus:border-cobalt transition-colors placeholder:text-muted/50"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="bg-gold text-navy font-semibold text-sm px-5 py-2 rounded hover:bg-gold/90 transition-colors disabled:opacity-60"
      >
        {isPending ? "Submitting..." : "Submit result"}
      </button>
    </form>
  );
}
