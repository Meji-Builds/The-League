"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { createSponsor } from "./actions";
import { directUpload } from "@/lib/direct-upload";

export function SponsorForm() {
  const [state, formAction, isPending] = useActionState(createSponsor, null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setUploadError(null);
    const fd = new FormData(e.currentTarget);
    const file = fileRef.current?.files?.[0];

    if (!file || file.size === 0) {
      setUploadError("Logo image is required.");
      return;
    }

    setUploading(true);
    const url = await directUpload(file, "sponsors");
    setUploading(false);

    if (!url) {
      setUploadError("Logo upload failed. Please try again.");
      return;
    }

    fd.delete("logo");
    fd.set("logo_url", url);
    startTransition(() => formAction(fd));
  }

  const busy = isPending || uploading;

  return (
    <form onSubmit={handleSubmit} className="border border-border bg-white rounded p-5 space-y-4">
      <h3 className="text-navy font-semibold text-sm">Add sponsor</h3>

      {(uploadError || (state && "error" in state)) && (
        <div className="bg-danger/5 border border-danger/30 text-danger text-xs px-3 py-2 rounded">
          {uploadError ?? (state as { error: string }).error}
        </div>
      )}
      {state && "success" in state && (
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
            Logo <span className="text-danger">*</span>
          </label>
          <input
            ref={fileRef}
            name="logo"
            type="file"
            accept="image/*"
            className="w-full text-sm text-muted file:mr-3 file:py-1.5 file:px-4 file:rounded file:border file:border-border file:text-xs file:font-semibold file:text-navy file:bg-white hover:file:bg-surface transition-colors"
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
        disabled={busy}
        className="bg-gold text-navy font-semibold text-sm px-5 py-2 rounded hover:bg-gold/90 transition-colors disabled:opacity-60"
      >
        {uploading ? "Uploading logo..." : isPending ? "Adding..." : "Add sponsor"}
      </button>
    </form>
  );
}
