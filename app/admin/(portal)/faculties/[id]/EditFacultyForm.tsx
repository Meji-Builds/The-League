"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { updateFaculty, deleteFaculty } from "../actions";
import { ImageUploadField } from "@/app/admin/_components/ImageUploadField";

interface Faculty {
  id: string;
  name: string;
  short_name: string;
  slug: string;
  logo_url: string | null;
  display_order: number;
}

export function EditFacultyForm({ faculty }: { faculty: Faculty }) {
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [updateState, updateAction, isUpdating] = useActionState(updateFaculty, null);
  const [deleteState, deleteAction, isDeleting] = useActionState(deleteFaculty, null);
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
    <div className="mt-4 border border-white/8 bg-card p-5 space-y-4">
      <p className="text-white font-semibold text-sm">Edit faculty</p>

      <form
        action={updateAction}
        onSubmit={() => { submitted.current = true; }}
        className="space-y-4"
      >
        <input type="hidden" name="faculty_id" value={faculty.id} />

        {updateState?.error && (
          <div className="bg-danger/5 border border-danger/30 text-danger text-xs px-3 py-2">{updateState.error}</div>
        )}

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-white/70 uppercase tracking-wide mb-1">
              Full name <span className="text-danger">*</span>
            </label>
            <input
              name="name"
              type="text"
              required
              defaultValue={faculty.name}
              className="w-full border border-white/10 bg-navy/50 text-white text-sm px-3 py-2 focus:outline-none focus:border-cobalt transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-white/70 uppercase tracking-wide mb-1">
              Short name <span className="text-danger">*</span>
            </label>
            <input
              name="short_name"
              type="text"
              required
              defaultValue={faculty.short_name}
              className="w-full border border-white/10 bg-navy/50 text-white text-sm px-3 py-2 focus:outline-none focus:border-cobalt transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-white/70 uppercase tracking-wide mb-1">Slug</label>
            <input
              name="slug"
              type="text"
              defaultValue={faculty.slug}
              className="w-full border border-white/10 bg-navy/50 text-white text-sm px-3 py-2 focus:outline-none focus:border-cobalt transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-white/70 uppercase tracking-wide mb-1">Display order</label>
            <input
              name="display_order"
              type="number"
              min="0"
              defaultValue={faculty.display_order}
              className="w-full border border-white/10 bg-navy/50 text-white text-sm px-3 py-2 focus:outline-none focus:border-cobalt transition-colors"
            />
          </div>
        </div>

        <ImageUploadField
          name="logo_url"
          folder="faculties"
          label="Logo"
          currentUrl={faculty.logo_url}
          aspectHint="square"
        />

        <div className="flex items-center gap-2">
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

      <div className="pt-3 border-t border-white/6 flex items-center gap-2 flex-wrap">
        {!confirmDelete ? (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="text-xs font-semibold px-3 py-1.5 rounded text-danger/70 hover:text-danger hover:bg-danger/10 transition-colors"
          >
            Delete faculty
          </button>
        ) : (
          <>
            <span className="text-xs text-white/50">Delete this faculty and all its divisions? This cannot be undone.</span>
            {deleteState?.error && <span className="text-xs text-danger">{deleteState.error}</span>}
            <form action={deleteAction} className="flex items-center gap-1.5">
              <input type="hidden" name="faculty_id" value={faculty.id} />
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
