"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { updateCompetition, deleteCompetition } from "./actions";

interface Props {
  competition: {
    id:          string;
    name:        string;
    type:        string;
    format:      string;
    cycle:       string;
    edition:     string;
    entry_fee:   number;
    status:      string;
    description: string | null;
  };
}

export function EditCompetitionForm({ competition }: Props) {
  const [open,          setOpen]          = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [updateState, updateAction, isUpdating] = useActionState(updateCompetition, null);
  const [deleteState, deleteAction, isDeleting] = useActionState(deleteCompetition, null);
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

  return (
    <div className="mt-3 pt-3 border-t border-white/6">
      <form
        action={updateAction}
        onSubmit={() => { submitted.current = true; }}
        className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3"
      >
        <input type="hidden" name="competition_id" value={competition.id} />

        {updateState?.error && (
          <p className="sm:col-span-2 lg:col-span-3 text-xs text-danger">{updateState.error}</p>
        )}

        {/* Name */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-white/70 uppercase tracking-wide mb-1">Name</label>
          <input
            name="name"
            type="text"
            required
            defaultValue={competition.name}
            className="w-full border border-white/10 bg-navy/50 text-white text-sm px-3 py-2 focus:outline-none focus:border-cobalt transition-colors"
          />
        </div>

        {/* Edition */}
        <div>
          <label className="block text-xs font-semibold text-white/70 uppercase tracking-wide mb-1">Edition</label>
          <input
            name="edition"
            type="text"
            required
            defaultValue={competition.edition}
            className="w-full border border-white/10 bg-navy/50 text-white text-sm px-3 py-2 focus:outline-none focus:border-cobalt transition-colors"
          />
        </div>

        {/* Type */}
        <div>
          <label className="block text-xs font-semibold text-white/70 uppercase tracking-wide mb-1">Type</label>
          <select
            name="type"
            defaultValue={competition.type}
            className="w-full border border-white/10 bg-navy/50 text-white text-sm px-3 py-2 focus:outline-none focus:border-cobalt transition-colors [&>option]:bg-navy [&>option]:text-white"
          >
            <option value="flagship">Flagship</option>
            <option value="cup">Cup</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Format */}
        <div>
          <label className="block text-xs font-semibold text-white/70 uppercase tracking-wide mb-1">Format</label>
          <select
            name="format"
            defaultValue={competition.format}
            className="w-full border border-white/10 bg-navy/50 text-white text-sm px-3 py-2 focus:outline-none focus:border-cobalt transition-colors [&>option]:bg-navy [&>option]:text-white"
          >
            <option value="funnel_pyramid">Funnel / Pyramid</option>
            <option value="knockout">Knockout</option>
            <option value="group_stage">Group Stage</option>
            <option value="league">League</option>
          </select>
        </div>

        {/* Cycle */}
        <div>
          <label className="block text-xs font-semibold text-white/70 uppercase tracking-wide mb-1">Cycle</label>
          <select
            name="cycle"
            defaultValue={competition.cycle}
            className="w-full border border-white/10 bg-navy/50 text-white text-sm px-3 py-2 focus:outline-none focus:border-cobalt transition-colors [&>option]:bg-navy [&>option]:text-white"
          >
            <option value="annual">Annual</option>
            <option value="biennial">Biennial</option>
            <option value="one-off">One-off</option>
          </select>
        </div>

        {/* Status */}
        <div>
          <label className="block text-xs font-semibold text-white/70 uppercase tracking-wide mb-1">Status</label>
          <select
            name="status"
            defaultValue={competition.status}
            className="w-full border border-white/10 bg-navy/50 text-white text-sm px-3 py-2 focus:outline-none focus:border-cobalt transition-colors [&>option]:bg-navy [&>option]:text-white"
          >
            <option value="upcoming">Upcoming</option>
            <option value="registration_open">Registration open</option>
            <option value="in_progress">In progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {/* Entry fee */}
        <div>
          <label className="block text-xs font-semibold text-white/70 uppercase tracking-wide mb-1">Entry fee (NGN)</label>
          <input
            name="entry_fee"
            type="number"
            min="0"
            step="100"
            defaultValue={competition.entry_fee}
            className="w-full border border-white/10 bg-navy/50 text-white text-sm px-3 py-2 focus:outline-none focus:border-cobalt transition-colors"
          />
        </div>

        {/* Description */}
        <div className="sm:col-span-2 lg:col-span-3">
          <label className="block text-xs font-semibold text-white/70 uppercase tracking-wide mb-1">Description</label>
          <textarea
            name="description"
            rows={2}
            defaultValue={competition.description ?? ""}
            className="w-full border border-white/10 bg-navy/50 text-white text-sm px-3 py-2 focus:outline-none focus:border-cobalt transition-colors resize-none"
          />
        </div>

        {/* Save / Cancel */}
        <div className="sm:col-span-2 lg:col-span-3 flex items-center gap-2">
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
        </div>
      </form>

      {/* ── Delete form — separate sibling, never nested ── */}
      <div className="pt-2 border-t border-white/6 flex items-center gap-2 flex-wrap">
        {!confirmDelete ? (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="text-xs font-semibold px-3 py-1.5 rounded text-danger/70 hover:text-danger hover:bg-danger/10 transition-colors"
          >
            Delete competition
          </button>
        ) : (
          <>
            <span className="text-xs text-white/50">Delete permanently? This cannot be undone.</span>
            {deleteState?.error && (
              <span className="text-xs text-danger">{deleteState.error}</span>
            )}
            <form action={deleteAction} className="flex items-center gap-1.5">
              <input type="hidden" name="competition_id" value={competition.id} />
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
  );
}
