"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { createAnnouncement } from "./actions";
import { directUpload } from "@/lib/direct-upload";

export function AnnouncementForm() {
  const [state, formAction, isPending] = useActionState(createAnnouncement, null);
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
      const url = await directUpload(file, "announcements");
      setUploading(false);
      if (!url) {
        setUploadError("Cover image upload failed. Try again.");
        return;
      }
      fd.delete("image");
      fd.set("image_url", url);
    }

    startTransition(() => formAction(fd));
  }

  const busy = isPending || uploading;

  return (
    <form onSubmit={handleSubmit} className="border border-border bg-white rounded p-5 space-y-4">
      <h3 className="text-navy font-semibold text-sm">New announcement</h3>

      {(uploadError || (state && "error" in state)) && (
        <div className="bg-danger/5 border border-danger/30 text-danger text-xs px-3 py-2 rounded">
          {uploadError ?? (state as { error: string }).error}
        </div>
      )}
      {state && "success" in state && (
        <div className="bg-success/5 border border-success/30 text-success text-xs px-3 py-2 rounded">
          Announcement published.
        </div>
      )}

      <div>
        <label className="block text-navy text-xs font-semibold mb-1 uppercase tracking-wide">
          Title <span className="text-danger">*</span>
        </label>
        <input
          name="title"
          type="text"
          required
          placeholder="e.g. Season 1 Registration Now Open"
          className="w-full border border-border bg-white text-navy text-sm px-3 py-2 rounded focus:outline-none focus:border-cobalt transition-colors"
        />
      </div>

      <div>
        <label className="block text-navy text-xs font-semibold mb-1 uppercase tracking-wide">
          Body <span className="text-danger">*</span>
        </label>
        <textarea
          name="body"
          rows={6}
          required
          placeholder="Write your announcement here. Separate paragraphs with a blank line."
          className="w-full border border-border bg-white text-navy text-sm px-3 py-2 rounded focus:outline-none focus:border-cobalt transition-colors resize-y"
        />
      </div>

      <div>
        <label className="block text-navy text-xs font-semibold mb-1 uppercase tracking-wide">
          Cover image <span className="text-muted font-normal normal-case">(optional)</span>
        </label>
        <input
          ref={fileRef}
          name="image"
          type="file"
          accept="image/*"
          className="w-full text-sm text-muted file:mr-3 file:py-1.5 file:px-4 file:rounded file:border file:border-border file:text-xs file:font-semibold file:text-navy file:bg-white hover:file:bg-surface transition-colors"
        />
      </div>

      <button
        type="submit"
        disabled={busy}
        className="bg-gold text-navy font-semibold text-sm px-5 py-2 rounded hover:bg-gold/90 transition-colors disabled:opacity-60"
      >
        {uploading ? "Uploading image..." : isPending ? "Publishing..." : "Publish announcement"}
      </button>
    </form>
  );
}
