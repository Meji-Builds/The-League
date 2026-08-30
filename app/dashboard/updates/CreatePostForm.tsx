"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { createClubPost } from "./actions";
import { directUpload } from "@/lib/direct-upload";

export function CreatePostForm({ clubId }: { clubId: string }) {
  const [state, formAction, isPending] = useActionState(createClubPost, null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state && "success" in state) formRef.current?.reset();
  }, [state]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setUploadError(null);
    const fd = new FormData(e.currentTarget);
    const file = fileRef.current?.files?.[0];

    if (file && file.size > 0) {
      setUploading(true);
      const url = await directUpload(file, `club-posts/${clubId}`);
      setUploading(false);
      if (!url) {
        setUploadError("Image upload failed. Check your connection and try again.");
        return;
      }
      fd.delete("image");
      fd.set("image_url", url);
    }

    startTransition(() => formAction(fd));
  }

  const busy = isPending || uploading;

  return (
    <div className="bg-white border border-border rounded p-5">
      <h2 className="font-bold text-navy text-base mb-4">Post a Club Update</h2>

      {state && "success" in state && (
        <div className="bg-success/10 border border-success/30 text-success text-xs px-3 py-2 rounded mb-4">
          Update submitted — an admin will review it before it goes public.
        </div>
      )}
      {(uploadError || (state && "error" in state)) && (
        <div className="bg-danger/5 border border-danger/30 text-danger text-xs px-3 py-2 rounded mb-4">
          {uploadError ?? (state && "error" in state ? state.error : "")}
        </div>
      )}

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-navy text-xs font-semibold mb-1 uppercase tracking-wide">
            Title <span className="text-danger">*</span>
          </label>
          <input
            name="title"
            type="text"
            required
            maxLength={120}
            placeholder="e.g. We're in the quarter-finals!"
            className="w-full border border-border bg-white text-navy text-sm px-3 py-2 rounded focus:outline-none focus:border-cobalt transition-colors placeholder:text-muted/50"
          />
        </div>

        <div>
          <label className="block text-navy text-xs font-semibold mb-1 uppercase tracking-wide">
            Message <span className="text-muted font-normal normal-case">(optional)</span>
          </label>
          <textarea
            name="body"
            rows={4}
            maxLength={1000}
            placeholder="Share a match recap, a shoutout, or any news from your club..."
            className="w-full border border-border bg-white text-navy text-sm px-3 py-2 rounded focus:outline-none focus:border-cobalt transition-colors placeholder:text-muted/50 resize-y"
          />
        </div>

        <div>
          <label className="block text-navy text-xs font-semibold mb-1 uppercase tracking-wide">
            Image <span className="text-muted font-normal normal-case">(optional)</span>
          </label>
          <input
            ref={fileRef}
            name="image"
            type="file"
            accept="image/*"
            className="w-full text-sm text-muted file:mr-3 file:text-xs file:font-semibold file:bg-navy file:text-white file:border-0 file:px-3 file:py-1.5 file:rounded file:cursor-pointer hover:file:bg-navy/80"
          />
        </div>

        <button
          type="submit"
          disabled={busy}
          className="bg-gold text-navy font-semibold text-sm px-5 py-2 rounded hover:bg-gold/90 transition-colors disabled:opacity-60"
        >
          {uploading ? "Uploading image..." : isPending ? "Submitting..." : "Submit for review"}
        </button>
      </form>
    </div>
  );
}
