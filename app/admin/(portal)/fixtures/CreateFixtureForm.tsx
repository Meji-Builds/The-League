"use client";

import { useActionState } from "react";
import { createFixture } from "./actions";

interface Competition {
  id: string;
  name: string;
  edition: string;
}

interface Club {
  id: string;
  name: string;
  faculty: string;
}

interface Props {
  competitions: Competition[];
  clubs: Club[];
}

export function CreateFixtureForm({ competitions, clubs }: Props) {
  const [state, action, isPending] = useActionState(createFixture, null);

  return (
    <form action={action} className="border border-white/6 bg-card p-5 space-y-4">
      <h3 className="text-white font-semibold text-sm">Schedule a fixture</h3>

      {state?.error && (
        <div className="bg-danger/5 border border-danger/30 text-danger text-xs px-3 py-2">
          {state.error}
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-white/70 text-xs font-semibold mb-1 uppercase tracking-wide">
            Competition <span className="text-danger">*</span>
          </label>
          <select
            name="competition_id"
            required
            defaultValue=""
            className="w-full border border-white/10 bg-navy/50 text-white text-sm px-3 py-2 focus:outline-none focus:border-cobalt transition-colors [&>option]:bg-navy [&>option]:text-white"
          >
            <option value="" disabled>Select competition</option>
            {competitions.map((c) => (
              <option key={c.id} value={c.id}>{c.name} ({c.edition})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-white/70 text-xs font-semibold mb-1 uppercase tracking-wide">
            Stage <span className="text-danger">*</span>
          </label>
          <select
            name="stage"
            required
            defaultValue="N/A"
            className="w-full border border-white/10 bg-navy/50 text-white text-sm px-3 py-2 focus:outline-none focus:border-cobalt transition-colors [&>option]:bg-navy [&>option]:text-white"
          >
            <option value="N/A">N/A</option>
            <option value="Department">Department</option>
            <option value="Faculty">Faculty</option>
            <option value="University">University</option>
          </select>
        </div>

        <div>
          <label className="block text-white/70 text-xs font-semibold mb-1 uppercase tracking-wide">
            Club A <span className="text-danger">*</span>
          </label>
          <select
            name="club_a_id"
            required
            defaultValue=""
            className="w-full border border-white/10 bg-navy/50 text-white text-sm px-3 py-2 focus:outline-none focus:border-cobalt transition-colors [&>option]:bg-navy [&>option]:text-white"
          >
            <option value="" disabled>Select club</option>
            {clubs.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-white/70 text-xs font-semibold mb-1 uppercase tracking-wide">
            Club B <span className="text-danger">*</span>
          </label>
          <select
            name="club_b_id"
            required
            defaultValue=""
            className="w-full border border-white/10 bg-navy/50 text-white text-sm px-3 py-2 focus:outline-none focus:border-cobalt transition-colors [&>option]:bg-navy [&>option]:text-white"
          >
            <option value="" disabled>Select club</option>
            {clubs.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-white/70 text-xs font-semibold mb-1 uppercase tracking-wide">
            Group name
          </label>
          <input
            name="group_name"
            type="text"
            placeholder="Open"
            defaultValue="Open"
            className="w-full border border-white/10 bg-navy/50 text-white text-sm px-3 py-2 focus:outline-none focus:border-cobalt transition-colors placeholder:text-white/20"
          />
        </div>

        <div>
          <label className="block text-white/70 text-xs font-semibold mb-1 uppercase tracking-wide">
            Matchday
          </label>
          <input
            name="matchday"
            type="number"
            min="1"
            defaultValue="1"
            className="w-full border border-white/10 bg-navy/50 text-white text-sm px-3 py-2 focus:outline-none focus:border-cobalt transition-colors"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-white/70 text-xs font-semibold mb-1 uppercase tracking-wide">
            Scheduled date & time <span className="text-white/40 font-normal normal-case">(optional)</span>
          </label>
          <input
            name="scheduled_at"
            type="datetime-local"
            className="w-full border border-white/10 bg-navy/50 text-white text-sm px-3 py-2 focus:outline-none focus:border-cobalt transition-colors"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="bg-gold text-navy font-semibold text-sm px-5 py-2 rounded hover:bg-gold/90 transition-colors disabled:opacity-60"
      >
        {isPending ? "Scheduling..." : "Schedule fixture"}
      </button>
    </form>
  );
}
