"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { createHighlight } from "./actions";
import { directUpload } from "@/lib/direct-upload";

interface Competition {
  id:   string;
  name: string;
}

export function HighlightForm({ competitions }: { competitions: Competition[] }) {
  const [state, formAction, isPending] = useActionState(createHighlight, null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setUploadError(null);
    const fd = new FormData(e.currentTarget);
    const file = fileRef.current?.files?.[0];

    if (file && file.size > 0) {
      setUploading(true);
      const url = await directUpload(file, "highlights");
      setUploading(false);
      if (!url) {
        setUploadError("Thumbnail upload failed. Try again.");
        return;
      }
      fd.delete("thumbnail");
      fd.set("thumbnail_url", url);
    }

    startTransition(() => formAction(fd));
  }

  const busy = isPending || uploading;

  return (
    <form onSubmit={handleSubmit} className="border border-border bg-white rounded p-5 space-y-4">
      <h3 className="text-navy font-semibold text-sm">Add highlight</h3>

      {(uploadError || (state && "error" in state)) && (
        <div className="bg-danger/5 border border-danger/30 text-danger text-xs px-3 py-2 rounded">
          {uploadError ?? (state as { error: string }).error}
        </div>
      )}
      {state && "success" in state && (
        <div className="bg-success/5 border border-success/30 text-success text-xs px-3 py-2 rounded">
          Highlight added.
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-navy text-xs font-semibold mb-1 uppercase tracking-wide">
            Title <span className="text-danger">*</span>
          </label>
          <input
            name="title"
            type="text"
            required
            placeholder="e.g. Department Finals — Best Plays"
            className="w-full border border-border bg-white text-navy text-sm px-3 py-2 rounded focus:outline-none focus:border-cobalt transition-colors"
          />
        </div>

        <div>
          <label className="block text-navy text-xs font-semibold mb-1 uppercase tracking-wide">
            Competition <span className="text-muted font-normal normal-case">(optional)</span>
          </label>
          <select
            name="competition_id"
            className="w-full border border-border bg-white text-navy text-sm px-3 py-2 rounded focus:outline-none focus:border-cobalt transition-colors"
          >
            <option value="">— None —</option>
            {competitions.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-navy text-xs font-semibold mb-1 uppercase tracking-wide">
            YouTube / Video URL <span className="text-danger">*</span>
          </label>
          <input
            name="video_url"
            type="url"
            required
            placeholder="https://www.youtube.com/watch?v=..."
            className="w-full border border-border bg-white text-navy text-sm px-3 py-2 rounded focus:outline-none focus:border-cobalt transition-colors"
          />
        </div>

        <div>
          <label className="block text-navy text-xs font-semibold mb-1 uppercase tracking-wide">
            Thumbnail <span className="text-muted font-normal normal-case">(optional)</span>
          </label>
          <input
            ref={fileRef}
            name="thumbnail"
            type="file"
            accept="image/*"
            className="w-full text-sm text-muted file:mr-3 file:py-1.5 file:px-4 file:rounded file:border file:border-border file:text-xs file:font-semibold file:text-navy file:bg-white hover:file:bg-surface transition-colors"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={busy}
        className="bg-gold text-navy font-semibold text-sm px-5 py-2 rounded hover:bg-gold/90 transition-colors disabled:opacity-60"
      >
        {uploading ? "Uploading thumbnail..." : isPending ? "Adding..." : "Add highlight"}
      </button>
    </form>
  );
}
