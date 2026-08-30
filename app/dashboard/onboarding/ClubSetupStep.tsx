"use client";

import { useActionState } from "react";
import { setupClub } from "./actions";

export function ClubSetupStep() {
  const [state, action, isPending] = useActionState(setupClub, null);

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <span className="text-xs font-semibold text-gold uppercase tracking-widest">Step 1 of 2</span>
        <h2 className="text-navy text-xl font-bold mt-1">Set up your club profile</h2>
        <p className="text-muted text-sm mt-1">
          This information will be visible on your club&apos;s public page after approval.
        </p>
      </div>

      {state?.error && (
        <div className="bg-danger/5 border border-danger/30 text-danger text-sm px-4 py-3 mb-6 rounded">
          {state.error}
        </div>
      )}

      <form action={action} className="space-y-5">
        <div>
          <label htmlFor="name" className="block text-navy text-xs font-semibold mb-1.5 uppercase tracking-wide">
            Club name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder="e.g. Lagos FC Esports"
            className="w-full border border-border bg-white text-navy text-sm px-3 py-2.5 rounded focus:outline-none focus:border-cobalt transition-colors placeholder:text-muted/50"
          />
        </div>

        <div>
          <label htmlFor="faculty" className="block text-navy text-xs font-semibold mb-1.5 uppercase tracking-wide">
            Faculty
          </label>
          <input
            id="faculty"
            name="faculty"
            type="text"
            required
            placeholder="e.g. Faculty of Science"
            className="w-full border border-border bg-white text-navy text-sm px-3 py-2.5 rounded focus:outline-none focus:border-cobalt transition-colors placeholder:text-muted/50"
          />
        </div>

        <div>
          <label htmlFor="bio" className="block text-navy text-xs font-semibold mb-1.5 uppercase tracking-wide">
            Club bio <span className="text-muted font-normal normal-case">(optional)</span>
          </label>
          <textarea
            id="bio"
            name="bio"
            rows={3}
            placeholder="A short description of your club..."
            className="w-full border border-border bg-white text-navy text-sm px-3 py-2.5 rounded focus:outline-none focus:border-cobalt transition-colors resize-none placeholder:text-muted/50"
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-gold text-navy font-semibold text-sm px-4 py-2.5 rounded hover:bg-gold/90 transition-colors disabled:opacity-60"
        >
          {isPending ? "Saving..." : "Save and continue"}
        </button>
      </form>
    </div>
  );
}
