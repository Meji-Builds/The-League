"use client";

import { useActionState } from "react";
import { updateFeeSettings } from "./actions";

interface Props {
  currentFee: number;
  maxPlayers: number;
}

export function FeeForm({ currentFee, maxPlayers }: Props) {
  const [state, action, isPending] = useActionState(updateFeeSettings, null);

  return (
    <form action={action} className="space-y-4">
      {"error" in (state ?? {}) && (
        <div className="bg-danger/5 border border-danger/30 text-danger text-xs px-3 py-2">
          {(state as { error: string }).error}
        </div>
      )}
      {"success" in (state ?? {}) && (
        <div className="bg-success/5 border border-success/30 text-success text-xs px-3 py-2">
          Settings saved.
        </div>
      )}

      <div>
        <label className="block text-white/70 text-xs font-semibold mb-1 uppercase tracking-wide">
          Owner registration fee (NGN)
        </label>
        <input
          name="owner_registration_fee"
          type="number"
          min="0"
          step="100"
          required
          defaultValue={currentFee}
          className="w-48 border border-white/10 bg-navy/50 text-white text-sm px-3 py-2 focus:outline-none focus:border-cobalt transition-colors"
        />
        <p className="text-white/40 text-xs mt-1">
          The one-time fee club owners pay to register. Set to 0 for free registration.
        </p>
      </div>

      <div>
        <label className="block text-white/70 text-xs font-semibold mb-1 uppercase tracking-wide">
          Max players per club
        </label>
        <input
          name="max_players_per_club"
          type="number"
          min="1"
          step="1"
          required
          defaultValue={maxPlayers}
          className="w-48 border border-white/10 bg-navy/50 text-white text-sm px-3 py-2 focus:outline-none focus:border-cobalt transition-colors"
        />
        <p className="text-white/40 text-xs mt-1">
          Roster cap per club. Club owners cannot add more players than this limit.
        </p>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="bg-gold text-navy font-semibold text-sm px-5 py-2 hover:bg-gold/90 transition-colors disabled:opacity-60"
      >
        {isPending ? "Saving..." : "Save settings"}
      </button>
    </form>
  );
}
