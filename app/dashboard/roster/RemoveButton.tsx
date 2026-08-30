"use client";

import { useActionState } from "react";
import { removePlayer } from "./actions";

export function RemoveButton({ playerId }: { playerId: string }) {
  const [, action, isPending] = useActionState(removePlayer, null);

  return (
    <form action={action}>
      <input type="hidden" name="player_id" value={playerId} />
      <button
        type="submit"
        disabled={isPending}
        className="text-danger/60 hover:text-danger text-xs font-medium transition-colors disabled:opacity-40"
      >
        {isPending ? "Removing..." : "Remove"}
      </button>
    </form>
  );
}
