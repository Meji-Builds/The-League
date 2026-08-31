"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { uploadLineupImages } from "./actions";
import { directUpload } from "@/lib/direct-upload";

interface Props {
  fixtureId: string;
  clubAName: string;
  clubBName: string;
  hasLineupA: boolean;
  hasLineupB: boolean;
}

export function LineupUploadForm({ fixtureId, clubAName, clubBName, hasLineupA, hasLineupB }: Props) {
  const [state, formAction, isPending] = useActionState(uploadLineupImages, null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const fileARef = useRef<HTMLInputElement>(null);
  const fileBRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setUploadError(null);

    const fileA = fileARef.current?.files?.[0];
    const fileB = fileBRef.current?.files?.[0];

    if ((!fileA || fileA.size === 0) && (!fileB || fileB.size === 0)) {
      setUploadError("Please select at least one image.");
      return;
    }

    setUploading(true);
    const folder = `lineups/${fixtureId}`;
    const [urlA, urlB] = await Promise.all([
      fileA && fileA.size > 0 ? directUpload(fileA, folder) : Promise.resolve(null),
      fileB && fileB.size > 0 ? directUpload(fileB, folder) : Promise.resolve(null),
    ]);
    setUploading(false);

    if ((fileA && fileA.size > 0 && !urlA) || (fileB && fileB.size > 0 && !urlB)) {
      setUploadError("Image upload failed. Check your connection and try again.");
      return;
    }

    const fd = new FormData();
    fd.set("fixture_id", fixtureId);
    if (urlA) fd.set("lineup_image_a_url", urlA);
    if (urlB) fd.set("lineup_image_b_url", urlB);
    startTransition(() => formAction(fd));
  }

  const busy = isPending || uploading;

  return (
    <form onSubmit={handleSubmit} className="mt-3 pt-3 border-t border-white/6">
      <p className="text-xs font-semibold text-white/70 uppercase tracking-wide mb-2">Lineup Graphics</p>

      {(uploadError || (state && "error" in state)) && (
        <p className="text-xs text-danger mb-2">
          {uploadError ?? (state && "error" in state ? state.error : "")}
        </p>
      )}

      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-white/50 mb-1">
            {clubAName} lineup {hasLineupA && <span className="text-success">(uploaded)</span>}
          </label>
          <input
            ref={fileARef}
            name="lineup_image_a"
            type="file"
            accept="image/*"
            className="w-full text-xs text-white/50 file:mr-2 file:text-xs file:font-semibold file:bg-white/10 file:text-white file:border file:border-white/20 file:px-2.5 file:py-1 file:cursor-pointer hover:file:bg-white/20"
          />
        </div>
        <div>
          <label className="block text-xs text-white/50 mb-1">
            {clubBName} lineup {hasLineupB && <span className="text-success">(uploaded)</span>}
          </label>
          <input
            ref={fileBRef}
            name="lineup_image_b"
            type="file"
            accept="image/*"
            className="w-full text-xs text-white/50 file:mr-2 file:text-xs file:font-semibold file:bg-white/10 file:text-white file:border file:border-white/20 file:px-2.5 file:py-1 file:cursor-pointer hover:file:bg-white/20"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={busy}
        className="mt-2 text-xs font-semibold px-4 py-1.5 rounded bg-cobalt/10 text-cobalt hover:bg-cobalt/20 transition-colors disabled:opacity-60"
      >
        {uploading ? "Uploading..." : isPending ? "Saving..." : "Upload Lineups"}
      </button>
    </form>
  );
}
