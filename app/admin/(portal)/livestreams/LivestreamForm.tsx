"use client";

import { useActionState } from "react";
import { createLivestream } from "./actions";

export function LivestreamForm() {
  const [state, action, isPending] = useActionState(createLivestream, null);

  return (
    <form action={action} className="border border-border bg-white rounded p-5 space-y-4">
      <h3 className="text-navy font-semibold text-sm">Add stream</h3>

      {"error" in (state ?? {}) && (
        <div className="bg-danger/5 border border-danger/30 text-danger text-xs px-3 py-2 rounded">
          {(state as { error: string }).error}
        </div>
      )}
      {"success" in (state ?? {}) && (
        <div className="bg-success/5 border border-success/30 text-success text-xs px-3 py-2 rounded">
          Stream added.
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-navy text-xs font-semibold mb-1 uppercase tracking-wide">
            YouTube / Stream URL <span className="text-danger">*</span>
          </label>
          <input
            name="url"
            type="url"
            required
            placeholder="https://www.youtube.com/watch?v=..."
            className="w-full border border-border bg-white text-navy text-sm px-3 py-2 rounded focus:outline-none focus:border-cobalt transition-colors"
          />
        </div>
        <div>
          <label className="block text-navy text-xs font-semibold mb-1 uppercase tracking-wide">
            Title
          </label>
          <input
            name="title"
            type="text"
            placeholder="e.g. Season 1 — Grand Finals"
            className="w-full border border-border bg-white text-navy text-sm px-3 py-2 rounded focus:outline-none focus:border-cobalt transition-colors"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="bg-gold text-navy font-semibold text-sm px-5 py-2 rounded hover:bg-gold/90 transition-colors disabled:opacity-60"
      >
        {isPending ? "Adding..." : "Go live"}
      </button>
    </form>
  );
}
