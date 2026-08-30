"use client";

import { useActionState } from "react";
import { createHighlight } from "./actions";

interface Competition {
  id:   string;
  name: string;
}

export function HighlightForm({ competitions }: { competitions: Competition[] }) {
  const [state, action, isPending] = useActionState(createHighlight, null);

  return (
    <form action={action} className="border border-border bg-white rounded p-5 space-y-4">
      <h3 className="text-navy font-semibold text-sm">Add highlight</h3>

      {"error" in (state ?? {}) && (
        <div className="bg-danger/5 border border-danger/30 text-danger text-xs px-3 py-2 rounded">
          {(state as { error: string }).error}
        </div>
      )}
      {"success" in (state ?? {}) && (
        <div className="bg-success/5 border border-success/30 text-success text-xs px-3 py-2 rounded">
          Highlight added.
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-navy text-xs font-semibold mb-1 uppercase tracking-wide">
            Title <span className="text-danger">*</span>
          </label>
          <input
            name="title"
            type="text"
            required
            placeholder="e.g. Department Finals — Best Plays"
            className="w-full border border-border bg-white text-navy text-sm px-3 py-2 rounded focus:outline-none focus:border-cobalt transition-colors"
          />
        </div>

        <div>
          <label className="block text-navy text-xs font-semibold mb-1 uppercase tracking-wide">
            Competition <span className="text-muted font-normal normal-case">(optional)</span>
          </label>
          <select
            name="competition_id"
            className="w-full border border-border bg-white text-navy text-sm px-3 py-2 rounded focus:outline-none focus:border-cobalt transition-colors"
          >
            <option value="">— None —</option>
            {competitions.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-navy text-xs font-semibold mb-1 uppercase tracking-wide">
            YouTube / Video URL <span className="text-danger">*</span>
          </label>
          <input
            name="video_url"
            type="url"
            required
            placeholder="https://www.youtube.com/watch?v=..."
            className="w-full border border-border bg-white text-navy text-sm px-3 py-2 rounded focus:outline-none focus:border-cobalt transition-colors"
          />
        </div>

        <div>
          <label className="block text-navy text-xs font-semibold mb-1 uppercase tracking-wide">
            Thumbnail URL <span className="text-muted font-normal normal-case">(optional)</span>
          </label>
          <input
            name="thumbnail_url"
            type="url"
            placeholder="https://..."
            className="w-full border border-border bg-white text-navy text-sm px-3 py-2 rounded focus:outline-none focus:border-cobalt transition-colors"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="bg-gold text-navy font-semibold text-sm px-5 py-2 rounded hover:bg-gold/90 transition-colors disabled:opacity-60"
      >
        {isPending ? "Adding..." : "Add highlight"}
      </button>
    </form>
  );
}
