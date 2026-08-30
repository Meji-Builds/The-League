"use client";

import { useActionState } from "react";
import { createSponsor } from "./actions";

export function SponsorForm() {
  const [state, action, isPending] = useActionState(createSponsor, null);

  return (
    <form action={action} className="border border-border bg-white rounded p-5 space-y-4">
      <h3 className="text-navy font-semibold text-sm">Add sponsor</h3>

      {"error" in (state ?? {}) && (
        <div className="bg-danger/5 border border-danger/30 text-danger text-xs px-3 py-2 rounded">
          {(state as { error: string }).error}
        </div>
      )}
      {"success" in (state ?? {}) && (
        <div className="bg-success/5 border border-success/30 text-success text-xs px-3 py-2 rounded">
          Sponsor added.
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-navy text-xs font-semibold mb-1 uppercase tracking-wide">
            Name <span className="text-danger">*</span>
          </label>
          <input
            name="name"
            type="text"
            required
            placeholder="e.g. Acme Corp"
            className="w-full border border-border bg-white text-navy text-sm px-3 py-2 rounded focus:outline-none focus:border-cobalt transition-colors"
          />
        </div>

        <div>
          <label className="block text-navy text-xs font-semibold mb-1 uppercase tracking-wide">
            Tier <span className="text-danger">*</span>
          </label>
          <select
            name="tier"
            required
            defaultValue=""
            className="w-full border border-border bg-white text-navy text-sm px-3 py-2 rounded focus:outline-none focus:border-cobalt transition-colors"
          >
            <option value="" disabled>Select tier</option>
            <option value="title">Title</option>
            <option value="gold">Gold</option>
            <option value="silver">Silver</option>
            <option value="bronze">Bronze</option>
          </select>
        </div>

        <div>
          <label className="block text-navy text-xs font-semibold mb-1 uppercase tracking-wide">
            Logo URL <span className="text-danger">*</span>
          </label>
          <input
            name="logo_url"
            type="url"
            required
            placeholder="https://..."
            className="w-full border border-border bg-white text-navy text-sm px-3 py-2 rounded focus:outline-none focus:border-cobalt transition-colors"
          />
        </div>

        <div>
          <label className="block text-navy text-xs font-semibold mb-1 uppercase tracking-wide">
            Website URL <span className="text-muted font-normal normal-case">(optional)</span>
          </label>
          <input
            name="website_url"
            type="url"
            placeholder="https://..."
            className="w-full border border-border bg-white text-navy text-sm px-3 py-2 rounded focus:outline-none focus:border-cobalt transition-colors"
          />
        </div>

        <div>
          <label className="block text-navy text-xs font-semibold mb-1 uppercase tracking-wide">
            Display order
          </label>
          <input
            name="display_order"
            type="number"
            min="0"
            defaultValue="0"
            className="w-full border border-border bg-white text-navy text-sm px-3 py-2 rounded focus:outline-none focus:border-cobalt transition-colors"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="bg-gold text-navy font-semibold text-sm px-5 py-2 rounded hover:bg-gold/90 transition-colors disabled:opacity-60"
      >
        {isPending ? "Adding..." : "Add sponsor"}
      </button>
    </form>
  );
}
