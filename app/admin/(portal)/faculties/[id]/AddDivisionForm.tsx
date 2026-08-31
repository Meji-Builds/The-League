"use client";

import { useActionState } from "react";
import { createDivision } from "../actions";
import { ImageUploadField } from "@/app/admin/_components/ImageUploadField";

export function AddDivisionForm({ facultyId }: { facultyId: string }) {
  const [state, action, isPending] = useActionState(createDivision, null);

  return (
    <form action={action} className="border border-white/6 bg-card p-4 space-y-3">
      <h4 className="text-white font-semibold text-sm">Add division</h4>

      {state?.error && (
        <div className="bg-danger/5 border border-danger/30 text-danger text-xs px-3 py-2">{state.error}</div>
      )}

      <input type="hidden" name="faculty_id" value={facultyId} />

      <div className="grid sm:grid-cols-3 gap-3">
        <div className="sm:col-span-1">
          <label className="block text-xs font-semibold text-white/70 uppercase tracking-wide mb-1">
            Name <span className="text-danger">*</span>
          </label>
          <input
            name="name"
            type="text"
            required
            placeholder="e.g. Division A"
            className="w-full border border-white/10 bg-navy/50 text-white text-sm px-3 py-2 focus:outline-none focus:border-cobalt transition-colors placeholder:text-white/20"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-white/70 uppercase tracking-wide mb-1">
            Slug <span className="text-white/40 font-normal normal-case">(auto)</span>
          </label>
          <input
            name="slug"
            type="text"
            placeholder="e.g. division-a"
            className="w-full border border-white/10 bg-navy/50 text-white text-sm px-3 py-2 focus:outline-none focus:border-cobalt transition-colors placeholder:text-white/20"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-white/70 uppercase tracking-wide mb-1">Order</label>
          <input
            name="display_order"
            type="number"
            min="0"
            defaultValue="0"
            className="w-full border border-white/10 bg-navy/50 text-white text-sm px-3 py-2 focus:outline-none focus:border-cobalt transition-colors"
          />
        </div>
      </div>

      <ImageUploadField name="logo_url" folder="faculties/divisions" label="Logo (optional)" aspectHint="square" />

      <button
        type="submit"
        disabled={isPending}
        className="bg-cobalt/10 text-cobalt font-semibold text-xs px-4 py-1.5 rounded hover:bg-cobalt/20 transition-colors disabled:opacity-60"
      >
        {isPending ? "Adding..." : "Add division"}
      </button>
    </form>
  );
}
