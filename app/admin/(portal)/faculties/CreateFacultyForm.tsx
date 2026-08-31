"use client";

import { useActionState } from "react";
import { createFaculty } from "./actions";
import { ImageUploadField } from "@/app/admin/_components/ImageUploadField";

export function CreateFacultyForm() {
  const [state, action, isPending] = useActionState(createFaculty, null);

  return (
    <form action={action} className="border border-white/6 bg-card p-5 space-y-4">
      <h3 className="text-white font-semibold text-sm">Add faculty</h3>

      {state?.error && (
        <div className="bg-danger/5 border border-danger/30 text-danger text-xs px-3 py-2">{state.error}</div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-white/70 text-xs font-semibold mb-1 uppercase tracking-wide">
            Full name <span className="text-danger">*</span>
          </label>
          <input
            name="name"
            type="text"
            required
            placeholder="e.g. Faculty of Science"
            className="w-full border border-white/10 bg-navy/50 text-white text-sm px-3 py-2 focus:outline-none focus:border-cobalt transition-colors placeholder:text-white/20"
          />
        </div>

        <div>
          <label className="block text-white/70 text-xs font-semibold mb-1 uppercase tracking-wide">
            Short name <span className="text-danger">*</span>
          </label>
          <input
            name="short_name"
            type="text"
            required
            placeholder="e.g. FOS"
            className="w-full border border-white/10 bg-navy/50 text-white text-sm px-3 py-2 focus:outline-none focus:border-cobalt transition-colors placeholder:text-white/20"
          />
        </div>

        <div>
          <label className="block text-white/70 text-xs font-semibold mb-1 uppercase tracking-wide">
            Slug <span className="text-white/40 font-normal normal-case">(auto from short name)</span>
          </label>
          <input
            name="slug"
            type="text"
            placeholder="e.g. fos"
            className="w-full border border-white/10 bg-navy/50 text-white text-sm px-3 py-2 focus:outline-none focus:border-cobalt transition-colors placeholder:text-white/20"
          />
        </div>

        <div>
          <label className="block text-white/70 text-xs font-semibold mb-1 uppercase tracking-wide">
            Display order
          </label>
          <input
            name="display_order"
            type="number"
            min="0"
            defaultValue="0"
            className="w-full border border-white/10 bg-navy/50 text-white text-sm px-3 py-2 focus:outline-none focus:border-cobalt transition-colors"
          />
        </div>
      </div>

      <ImageUploadField name="logo_url" folder="faculties" label="Logo (optional)" aspectHint="square" />

      <button
        type="submit"
        disabled={isPending}
        className="bg-gold text-navy font-semibold text-sm px-5 py-2 rounded hover:bg-gold/90 transition-colors disabled:opacity-60"
      >
        {isPending ? "Adding..." : "Add faculty"}
      </button>
    </form>
  );
}
