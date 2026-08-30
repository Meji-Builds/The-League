"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { updateFixture } from "./actions";

interface Props {
  fixture: {
    id: string;
    stage: string;
    group_name: string;
    matchday: number;
    scheduled_at: string | null;
  };
}

const STAGES = ["N/A", "Department", "Faculty", "University"];

export function EditFixtureForm({ fixture }: Props) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(updateFixture, null);
  const submitted = useRef(false);

  useEffect(() => {
    if (submitted.current && !isPending && state === null) {
      setOpen(false);
      submitted.current = false;
    }
  }, [isPending, state]);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs font-semibold px-3 py-1 rounded border border-border text-muted hover:text-navy transition-colors"
      >
        Edit
      </button>
    );
  }

  const scheduledValue = fixture.scheduled_at
    ? new Date(fixture.scheduled_at).toISOString().slice(0, 16)
    : "";

  return (
    <form
      action={formAction}
      onSubmit={() => { submitted.current = true; }}
      className="mt-3 pt-3 border-t border-border grid sm:grid-cols-2 lg:grid-cols-4 gap-3"
    >
      <input type="hidden" name="fixture_id" value={fixture.id} />

      {state?.error && (
        <p className="sm:col-span-2 lg:col-span-4 text-xs text-danger">{state.error}</p>
      )}

      <div>
        <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1">Stage</label>
        <select
          name="stage"
          defaultValue={fixture.stage}
          className="w-full border border-border bg-white text-navy text-sm px-3 py-2 rounded focus:outline-none focus:border-cobalt transition-colors"
        >
          {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1">Group name</label>
        <input
          name="group_name"
          type="text"
          defaultValue={fixture.group_name}
          className="w-full border border-border bg-white text-navy text-sm px-3 py-2 rounded focus:outline-none focus:border-cobalt transition-colors"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1">Matchday</label>
        <input
          name="matchday"
          type="number"
          min="1"
          defaultValue={fixture.matchday}
          className="w-full border border-border bg-white text-navy text-sm px-3 py-2 rounded focus:outline-none focus:border-cobalt transition-colors"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1">Scheduled date & time</label>
        <input
          name="scheduled_at"
          type="datetime-local"
          defaultValue={scheduledValue}
          className="w-full border border-border bg-white text-navy text-sm px-3 py-2 rounded focus:outline-none focus:border-cobalt transition-colors"
        />
      </div>

      <div className="sm:col-span-2 lg:col-span-4 flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="bg-gold text-navy font-semibold text-xs px-4 py-1.5 rounded hover:bg-gold/90 transition-colors disabled:opacity-60"
        >
          {isPending ? "Saving..." : "Save"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs font-semibold px-4 py-1.5 rounded border border-border text-muted hover:text-navy transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
