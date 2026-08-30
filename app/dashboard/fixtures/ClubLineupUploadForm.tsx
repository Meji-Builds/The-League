"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { uploadClubLineup } from "./actions";
import { directUpload } from "@/lib/direct-upload";

interface Props {
  fixtureId: string;
  hasLineup: boolean;
}

export function ClubLineupUploadForm({ fixtureId, hasLineup }: Props) {
  const [state, formAction, isPending] = useActionState(uploadClubLineup, null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setUploadError(null);
    const file = fileRef.current?.files?.[0];

    if (!file || file.size === 0) {
      setUploadError("Please select an image to upload.");
      return;
    }

    setUploading(true);
    const url = await directUpload(file, `lineups/${fixtureId}`);
    setUploading(false);

    if (!url) {
      setUploadError("Image upload failed. Check your connection and try again.");
      return;
    }

    const fd = new FormData();
    fd.set("fixture_id", fixtureId);
    fd.set("lineup_image_url", url);
    startTransition(() => formAction(fd));
  }

  const busy = isPending || uploading;

  return (
    <form onSubmit={handleSubmit} className="mt-3 pt-3 border-t border-border">
      <p className="text-xs font-semibold text-navy uppercase tracking-wide mb-2">
        Lineup Graphic {hasLineup && <span className="normal-case font-normal text-success">(uploaded)</span>}
      </p>

      {(uploadError || (state && "error" in state)) && (
        <p className="text-xs text-danger mb-2">
          {uploadError ?? (state && "error" in state ? state.error : "")}
        </p>
      )}

      {state === null && !isPending && !uploading && hasLineup && !uploadError && (
        <p className="text-xs text-success mb-2">Lineup saved.</p>
      )}

      <div className="flex items-center gap-3 flex-wrap">
        <input
          ref={fileRef}
          name="lineup_image"
          type="file"
          accept="image/*"
          className="text-xs text-muted file:mr-2 file:text-xs file:font-semibold file:bg-navy file:text-white file:border-0 file:px-2.5 file:py-1 file:rounded file:cursor-pointer hover:file:bg-navy/80"
        />
        <button
          type="submit"
          disabled={busy}
          className="text-xs font-semibold px-4 py-1.5 rounded bg-cobalt/10 text-cobalt hover:bg-cobalt/20 transition-colors disabled:opacity-60 shrink-0"
        >
          {uploading ? "Uploading..." : isPending ? "Saving..." : hasLineup ? "Replace" : "Upload"}
        </button>
      </div>
    </form>
  );
}
