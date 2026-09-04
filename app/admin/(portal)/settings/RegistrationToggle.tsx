"use client";

import { useActionState, useOptimistic, useTransition } from "react";
import { toggleRegistration } from "./actions";

interface Props {
  enabled: boolean;
}

export function RegistrationToggle({ enabled }: Props) {
  const [state, action] = useActionState(toggleRegistration, null);
  const [, startTransition] = useTransition();
  const [optimisticEnabled, setOptimistic] = useOptimistic(enabled);

  function handleToggle() {
    startTransition(() => {
      setOptimistic(!optimisticEnabled);
      const fd = new FormData();
      fd.set("enabled", String(!optimisticEnabled));
      action(fd);
    });
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-white text-sm font-medium">
          {optimisticEnabled ? "Open — public registration is on" : "Closed — invite-only mode active"}
        </p>
        <p className="text-white/40 text-[11px] mt-0.5">
          {optimisticEnabled
            ? "Anyone can visit /register and create a club account."
            : "The /register page is locked. Only people with a valid invite link can sign up."}
        </p>
        {state && "error" in state && (
          <p className="text-danger text-xs mt-1">{state.error}</p>
        )}
      </div>

      <button
        type="button"
        onClick={handleToggle}
        aria-label={optimisticEnabled ? "Close registration" : "Open registration"}
        className={`relative w-11 h-6 rounded-full transition-colors shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 ${
          optimisticEnabled ? "bg-success" : "bg-white/15"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
            optimisticEnabled ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}
