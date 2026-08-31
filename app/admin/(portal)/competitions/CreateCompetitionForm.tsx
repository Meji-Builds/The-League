"use client";

import { useActionState } from "react";
import { createCompetition } from "./actions";

export function CreateCompetitionForm() {
  const [state, action, isPending] = useActionState(createCompetition, null);

  return (
    <form action={action} className="border border-white/6 bg-card p-5 space-y-4">
      <h3 className="text-white font-semibold text-sm">New competition</h3>

      {state?.error && (
        <div className="bg-danger/5 border border-danger/30 text-danger text-xs px-3 py-2">
          {state.error}
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-white/70 text-xs font-semibold mb-1 uppercase tracking-wide">
            Name <span className="text-danger">*</span>
          </label>
          <input
            name="name"
            type="text"
            required
            placeholder="e.g. The League Season 1"
            className="w-full border border-white/10 bg-navy/50 text-white text-sm px-3 py-2 focus:outline-none focus:border-cobalt transition-colors placeholder:text-white/20"
          />
        </div>

        <div>
          <label className="block text-white/70 text-xs font-semibold mb-1 uppercase tracking-wide">
            Edition <span className="text-danger">*</span>
          </label>
          <input
            name="edition"
            type="text"
            required
            placeholder="e.g. 2025"
            className="w-full border border-white/10 bg-navy/50 text-white text-sm px-3 py-2 focus:outline-none focus:border-cobalt transition-colors placeholder:text-white/20"
          />
        </div>

        <div>
          <label className="block text-white/70 text-xs font-semibold mb-1 uppercase tracking-wide">
            Type <span className="text-danger">*</span>
          </label>
          <select
            name="type"
            required
            defaultValue=""
            className="w-full border border-white/10 bg-navy/50 text-white text-sm px-3 py-2 focus:outline-none focus:border-cobalt transition-colors [&>option]:bg-navy [&>option]:text-white"
          >
            <option value="" disabled>Select type</option>
            <option value="flagship">Flagship</option>
            <option value="cup">Cup</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-white/70 text-xs font-semibold mb-1 uppercase tracking-wide">
            Format <span className="text-danger">*</span>
          </label>
          <select
            name="format"
            required
            defaultValue=""
            className="w-full border border-white/10 bg-navy/50 text-white text-sm px-3 py-2 focus:outline-none focus:border-cobalt transition-colors [&>option]:bg-navy [&>option]:text-white"
          >
            <option value="" disabled>Select format</option>
            <option value="funnel_pyramid">Funnel / Pyramid</option>
            <option value="knockout">Knockout</option>
            <option value="group_stage">Group Stage</option>
            <option value="league">League</option>
          </select>
        </div>

        <div>
          <label className="block text-white/70 text-xs font-semibold mb-1 uppercase tracking-wide">
            Cycle <span className="text-danger">*</span>
          </label>
          <select
            name="cycle"
            required
            defaultValue=""
            className="w-full border border-white/10 bg-navy/50 text-white text-sm px-3 py-2 focus:outline-none focus:border-cobalt transition-colors [&>option]:bg-navy [&>option]:text-white"
          >
            <option value="" disabled>Select cycle</option>
            <option value="annual">Annual</option>
            <option value="biennial">Biennial</option>
            <option value="one-off">One-off</option>
          </select>
        </div>

        <div>
          <label className="block text-white/70 text-xs font-semibold mb-1 uppercase tracking-wide">
            Status <span className="text-danger">*</span>
          </label>
          <select
            name="status"
            required
            defaultValue="upcoming"
            className="w-full border border-white/10 bg-navy/50 text-white text-sm px-3 py-2 focus:outline-none focus:border-cobalt transition-colors [&>option]:bg-navy [&>option]:text-white"
          >
            <option value="upcoming">Upcoming</option>
            <option value="registration_open">Registration open</option>
            <option value="in_progress">In progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <div>
          <label className="block text-white/70 text-xs font-semibold mb-1 uppercase tracking-wide">
            Entry fee (NGN)
          </label>
          <input
            name="entry_fee"
            type="number"
            min="0"
            step="100"
            defaultValue="0"
            placeholder="0"
            className="w-full border border-white/10 bg-navy/50 text-white text-sm px-3 py-2 focus:outline-none focus:border-cobalt transition-colors"
          />
        </div>
      </div>

      <div>
        <label className="block text-white/70 text-xs font-semibold mb-1 uppercase tracking-wide">
          Description <span className="text-white/40 font-normal normal-case">(optional)</span>
        </label>
        <textarea
          name="description"
          rows={2}
          placeholder="Brief description of the competition..."
          className="w-full border border-white/10 bg-navy/50 text-white text-sm px-3 py-2 focus:outline-none focus:border-cobalt transition-colors resize-none placeholder:text-white/20"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="bg-gold text-navy font-semibold text-sm px-5 py-2 hover:bg-gold/90 transition-colors disabled:opacity-60"
      >
        {isPending ? "Creating..." : "Create competition"}
      </button>
    </form>
  );
}
