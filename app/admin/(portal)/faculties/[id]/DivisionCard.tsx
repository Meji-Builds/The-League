"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { updateDivision, deleteDivision, addClubToDivision, removeClubFromDivision } from "../actions";
import { ImageUploadField } from "@/app/admin/_components/ImageUploadField";

interface Club {
  id: string;
  name: string;
  faculty: string;
}

interface AssignedClub {
  id: string;
  name: string;
}

interface Division {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  display_order: number;
}

interface Props {
  division: Division;
  facultyId: string;
  facultyClubs: Club[];
  assignedClubs: AssignedClub[];
  allAssignedClubIds: Set<string>;
}

export function DivisionCard({ division, facultyId, facultyClubs, assignedClubs, allAssignedClubIds }: Props) {
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [updateState, updateAction, isUpdating] = useActionState(updateDivision, null);
  const [deleteState, deleteAction, isDeleting] = useActionState(deleteDivision, null);
  const submitted = useRef(false);

  useEffect(() => {
    if (submitted.current && !isUpdating && updateState === null) {
      setEditOpen(false);
      submitted.current = false;
    }
  }, [isUpdating, updateState]);

  const unassignedClubs = facultyClubs.filter((c) => !allAssignedClubIds.has(c.id));

  return (
    <div className="border border-white/6 bg-card">
      {/* Division header */}
      <div className="flex items-center gap-3 p-4">
        {division.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={division.logo_url} alt={division.name} className="w-8 h-8 object-contain shrink-0" />
        ) : (
          <div className="w-8 h-8 bg-white/5 border border-white/10 shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-white text-sm">{division.name}</p>
          <p className="text-[11px] text-white/40">/{division.slug} &middot; order {division.display_order} &middot; {assignedClubs.length} club{assignedClubs.length !== 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={() => setEditOpen((o) => !o)}
          className="text-xs font-semibold px-3 py-1 rounded border border-white/10 text-white/50 hover:text-white hover:border-white/25 transition-colors"
        >
          {editOpen ? "Close" : "Edit"}
        </button>
      </div>

      {/* Edit form */}
      {editOpen && (
        <div className="border-t border-white/6 p-4 space-y-4">
          <form
            action={updateAction}
            onSubmit={() => { submitted.current = true; }}
            className="space-y-3"
          >
            <input type="hidden" name="division_id" value={division.id} />
            <input type="hidden" name="faculty_id" value={facultyId} />

            {updateState?.error && (
              <div className="bg-danger/5 border border-danger/30 text-danger text-xs px-3 py-2">{updateState.error}</div>
            )}

            <div className="grid sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-white/70 uppercase tracking-wide mb-1">Name</label>
                <input
                  name="name"
                  type="text"
                  required
                  defaultValue={division.name}
                  className="w-full border border-white/10 bg-navy/50 text-white text-sm px-3 py-2 focus:outline-none focus:border-cobalt transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-white/70 uppercase tracking-wide mb-1">Slug</label>
                <input
                  name="slug"
                  type="text"
                  defaultValue={division.slug}
                  className="w-full border border-white/10 bg-navy/50 text-white text-sm px-3 py-2 focus:outline-none focus:border-cobalt transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-white/70 uppercase tracking-wide mb-1">Order</label>
                <input
                  name="display_order"
                  type="number"
                  min="0"
                  defaultValue={division.display_order}
                  className="w-full border border-white/10 bg-navy/50 text-white text-sm px-3 py-2 focus:outline-none focus:border-cobalt transition-colors"
                />
              </div>
            </div>

            <ImageUploadField
              name="logo_url"
              folder="faculties/divisions"
              label="Logo"
              currentUrl={division.logo_url}
              aspectHint="square"
            />

            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={isUpdating}
                className="bg-gold text-navy font-semibold text-xs px-4 py-1.5 rounded hover:bg-gold/90 transition-colors disabled:opacity-60"
              >
                {isUpdating ? "Saving..." : "Save"}
              </button>
            </div>
          </form>

          {/* Delete */}
          <div className="pt-3 border-t border-white/6 flex items-center gap-2 flex-wrap">
            {!confirmDelete ? (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="text-xs font-semibold px-3 py-1.5 rounded text-danger/70 hover:text-danger hover:bg-danger/10 transition-colors"
              >
                Delete division
              </button>
            ) : (
              <>
                <span className="text-xs text-white/50">Delete this division permanently?</span>
                {deleteState?.error && <span className="text-xs text-danger">{deleteState.error}</span>}
                <form action={deleteAction} className="flex items-center gap-1.5">
                  <input type="hidden" name="division_id" value={division.id} />
                  <input type="hidden" name="faculty_id" value={facultyId} />
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
      )}

      {/* Club assignments */}
      <div className="border-t border-white/6 p-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/30 mb-3">Clubs in this division</p>

        {assignedClubs.length > 0 ? (
          <div className="space-y-1.5 mb-4">
            {assignedClubs.map((club) => (
              <div key={club.id} className="flex items-center gap-2">
                <span className="flex-1 text-xs text-white/70">{club.name}</span>
                <form action={removeClubFromDivision}>
                  <input type="hidden" name="division_id" value={division.id} />
                  <input type="hidden" name="club_id" value={club.id} />
                  <input type="hidden" name="faculty_id" value={facultyId} />
                  <button
                    type="submit"
                    className="text-[10px] font-semibold px-2 py-0.5 rounded text-danger/60 hover:text-danger hover:bg-danger/10 transition-colors"
                  >
                    Remove
                  </button>
                </form>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-white/25 mb-3">No clubs assigned yet.</p>
        )}

        {unassignedClubs.length > 0 && (
          <form action={addClubToDivision} className="flex items-center gap-2">
            <input type="hidden" name="division_id" value={division.id} />
            <input type="hidden" name="faculty_id" value={facultyId} />
            <select
              name="club_id"
              required
              defaultValue=""
              className="flex-1 border border-white/10 bg-navy/50 text-white text-xs px-2 py-1.5 focus:outline-none focus:border-cobalt [&>option]:bg-navy [&>option]:text-white"
            >
              <option value="" disabled>Add a club…</option>
              {unassignedClubs.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <button
              type="submit"
              className="text-xs font-semibold px-3 py-1.5 rounded bg-success/10 text-success hover:bg-success/20 transition-colors shrink-0"
            >
              Add
            </button>
          </form>
        )}

        {unassignedClubs.length === 0 && facultyClubs.length > 0 && assignedClubs.length === facultyClubs.length && (
          <p className="text-xs text-white/25">All faculty clubs are assigned to this division.</p>
        )}

        {facultyClubs.length === 0 && (
          <p className="text-xs text-white/25">No approved clubs in this faculty yet.</p>
        )}
      </div>
    </div>
  );
}
