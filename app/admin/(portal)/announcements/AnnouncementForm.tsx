"use client";

import { useActionState } from "react";
import { createAnnouncement } from "./actions";

export function AnnouncementForm() {
  const [state, action, isPending] = useActionState(createAnnouncement, null);

  return (
    <form action={action} className="border border-border bg-white rounded p-5 space-y-4">
      <h3 className="text-navy font-semibold text-sm">New announcement</h3>

      {"error" in (state ?? {}) && (
        <div className="bg-danger/5 border border-danger/30 text-danger text-xs px-3 py-2 rounded">
          {(state as { error: string }).error}
        </div>
      )}
      {"success" in (state ?? {}) && (
        <div className="bg-success/5 border border-success/30 text-success text-xs px-3 py-2 rounded">
          Announcement published.
        </div>
      )}

      <div>
        <label className="block text-navy text-xs font-semibold mb-1 uppercase tracking-wide">
          Title <span className="text-danger">*</span>
        </label>
        <input
          name="title"
          type="text"
          required
          placeholder="e.g. Season 1 Registration Now Open"
          className="w-full border border-border bg-white text-navy text-sm px-3 py-2 rounded focus:outline-none focus:border-cobalt transition-colors"
        />
      </div>

      <div>
        <label className="block text-navy text-xs font-semibold mb-1 uppercase tracking-wide">
          Body <span className="text-danger">*</span>
        </label>
        <textarea
          name="body"
          rows={6}
          required
          placeholder="Write your announcement here. Separate paragraphs with a blank line."
          className="w-full border border-border bg-white text-navy text-sm px-3 py-2 rounded focus:outline-none focus:border-cobalt transition-colors resize-y"
        />
      </div>

      <div>
        <label className="block text-navy text-xs font-semibold mb-1 uppercase tracking-wide">
          Cover image <span className="text-muted font-normal normal-case">(optional)</span>
        </label>
        <input
          name="image"
          type="file"
          accept="image/*"
          className="w-full text-sm text-muted file:mr-3 file:py-1.5 file:px-4 file:rounded file:border file:border-border file:text-xs file:font-semibold file:text-navy file:bg-white hover:file:bg-surface transition-colors"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="bg-gold text-navy font-semibold text-sm px-5 py-2 rounded hover:bg-gold/90 transition-colors disabled:opacity-60"
      >
        {isPending ? "Publishing..." : "Publish announcement"}
      </button>
    </form>
  );
}
