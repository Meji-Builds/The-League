"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { updateFixture, deleteFixture } from "./actions";

interface Club       { id: string; name: string; faculty: string }
interface Competition { id: string; name: string; edition: string }

interface Props {
  fixture: {
    id:             string;
    stage:          string;
    group_name:     string;
    matchday:       number;
    status:         string;
    scheduled_at:   string | null;
    competition_id: string;
    club_a:         { id: string; name: string } | null;
    club_b:         { id: string; name: string } | null;
  };
  clubs:        Club[];
  competitions: Competition[];
}

const STAGES = ["N/A", "Department", "Faculty", "University"];

export function EditFixtureForm({ fixture, clubs, competitions }: Props) {
  const [open,         setOpen]         = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [updateState, updateAction, isUpdating] = useActionState(updateFixture, null);
  const [deleteState, deleteAction, isDeleting] = useActionState(deleteFixture, null);
  const submitted = useRef(false);

  useEffect(() => {
    if (submitted.current && !isUpdating && updateState === null) {
      setOpen(false);
      submitted.current = false;
    }
  }, [isUpdating, updateState]);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs font-semibold px-3 py-1 rounded border border-white/10 text-white/50 hover:text-white hover:border-white/25 transition-colors"
      >
        Edit
      </button>
    );
  }

  const scheduledValue = fixture.scheduled_at
    ? new Date(fixture.scheduled_at).toISOString().slice(0, 16)
    : "";

  return (
    <div className="mt-3 pt-3 border-t border-white/6">
      {/* ── Update form ── */}
      <form
        action={updateAction}
        onSubmit={() => { submitted.current = true; }}
        className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3"
      >
        <input type="hidden" name="fixture_id" value={fixture.id} />

        {updateState?.error && (
          <p className="sm:col-span-2 lg:col-span-3 text-xs text-danger">{updateState.error}</p>
        )}

        {/* Competition */}
        <div className="sm:col-span-2 lg:col-span-3">
          <label className="block text-xs font-semibold text-white/70 uppercase tracking-wide mb-1">Competition</label>
          <select
            name="competition_id"
            defaultValue={fixture.competition_id}
            className="w-full border border-white/10 bg-navy/50 text-white text-sm px-3 py-2 focus:outline-none focus:border-cobalt transition-colors [&>option]:bg-navy [&>option]:text-white"
          >
            {competitions.map((c) => (
              <option key={c.id} value={c.id}>{c.name} — {c.edition}</option>
            ))}
          </select>
        </div>

        {/* Club A */}
        <div>
          <label className="block text-xs font-semibold text-white/70 uppercase tracking-wide mb-1">Club A (home)</label>
          <select
            name="club_a_id"
            defaultValue={fixture.club_a?.id ?? ""}
            className="w-full border border-white/10 bg-navy/50 text-white text-sm px-3 py-2 focus:outline-none focus:border-cobalt transition-colors [&>option]:bg-navy [&>option]:text-white"
          >
            <option value="">— select —</option>
            {clubs.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Club B */}
        <div>
          <label className="block text-xs font-semibold text-white/70 uppercase tracking-wide mb-1">Club B (away)</label>
          <select
            name="club_b_id"
            defaultValue={fixture.club_b?.id ?? ""}
            className="w-full border border-white/10 bg-navy/50 text-white text-sm px-3 py-2 focus:outline-none focus:border-cobalt transition-colors [&>option]:bg-navy [&>option]:text-white"
          >
            <option value="">— select —</option>
            {clubs.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Stage */}
        <div>
          <label className="block text-xs font-semibold text-white/70 uppercase tracking-wide mb-1">Stage</label>
          <select
            name="stage"
            defaultValue={fixture.stage}
            className="w-full border border-white/10 bg-navy/50 text-white text-sm px-3 py-2 focus:outline-none focus:border-cobalt transition-colors [&>option]:bg-navy [&>option]:text-white"
          >
            {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Group name */}
        <div>
          <label className="block text-xs font-semibold text-white/70 uppercase tracking-wide mb-1">Group name</label>
          <input
            name="group_name"
            type="text"
            defaultValue={fixture.group_name}
            className="w-full border border-white/10 bg-navy/50 text-white text-sm px-3 py-2 focus:outline-none focus:border-cobalt transition-colors"
          />
        </div>

        {/* Matchday */}
        <div>
          <label className="block text-xs font-semibold text-white/70 uppercase tracking-wide mb-1">Matchday</label>
          <input
            name="matchday"
            type="number"
            min="1"
            defaultValue={fixture.matchday}
            className="w-full border border-white/10 bg-navy/50 text-white text-sm px-3 py-2 focus:outline-none focus:border-cobalt transition-colors"
          />
        </div>

        {/* Scheduled date */}
        <div>
          <label className="block text-xs font-semibold text-white/70 uppercase tracking-wide mb-1">Date &amp; time</label>
          <input
            name="scheduled_at"
            type="datetime-local"
            defaultValue={scheduledValue}
            className="w-full border border-white/10 bg-navy/50 text-white text-sm px-3 py-2 focus:outline-none focus:border-cobalt transition-colors"
          />
        </div>

        {/* Status */}
        <div>
          <label className="block text-xs font-semibold text-white/70 uppercase tracking-wide mb-1">Status</label>
          <select
            name="status"
            defaultValue={fixture.status}
            className="w-full border border-white/10 bg-navy/50 text-white text-sm px-3 py-2 focus:outline-none focus:border-cobalt transition-colors [&>option]:bg-navy [&>option]:text-white"
          >
            <option value="scheduled">Scheduled</option>
            <option value="reported">Reported</option>
            <option value="disputed">Disputed</option>
            <option value="confirmed">Confirmed</option>
          </select>
        </div>

        {/* Actions row */}
        <div className="sm:col-span-2 lg:col-span-3 flex items-center gap-2 flex-wrap">
          <button
            type="submit"
            disabled={isUpdating}
            className="bg-gold text-navy font-semibold text-xs px-4 py-1.5 rounded hover:bg-gold/90 transition-colors disabled:opacity-60"
          >
            {isUpdating ? "Saving..." : "Save changes"}
          </button>
          <button
            type="button"
            onClick={() => { setOpen(false); setConfirmDelete(false); }}
            className="text-xs font-semibold px-4 py-1.5 rounded border border-white/10 text-white/50 hover:text-white transition-colors"
          >
            Cancel
          </button>

          {/* Delete with inline confirm */}
          <div className="ml-auto flex items-center gap-2">
            {!confirmDelete ? (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="text-xs font-semibold px-3 py-1.5 rounded text-danger/70 hover:text-danger hover:bg-danger/10 transition-colors"
              >
                Delete fixture
              </button>
            ) : (
              <>
                <span className="text-xs text-white/50">Delete this fixture permanently?</span>
                <form action={deleteAction} className="flex items-center gap-1.5">
                  <input type="hidden" name="fixture_id" value={fixture.id} />
                  {deleteState?.error && (
                    <span className="text-xs text-danger">{deleteState.error}</span>
                  )}
                  <button
                    type="submit"
                    disabled={isDeleting}
                    className="text-xs font-bold px-3 py-1.5 rounded bg-danger/10 text-danger hover:bg-danger/20 transition-colors disabled:opacity-60"
                  >
                    {isDeleting ? "Deleting..." : "Yes, delete"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="text-xs font-semibold px-3 py-1.5 rounded border border-white/10 text-white/40 hover:text-white transition-colors"
                  >
                    No
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
