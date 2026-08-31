"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { uploadPlayerPhoto } from "./actions";
import { directUploadPlayerPhoto } from "@/lib/direct-upload";

interface Props {
  playerId: string;
  currentPhotoUrl: string | null;
  currentStatus: string;
}

export function PlayerPhotoForm({ playerId, currentPhotoUrl, currentStatus }: Props) {
  const [state, formAction, isPending] = useActionState(uploadPlayerPhoto, null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setUploadError(null);

    const file = fileRef.current?.files?.[0];
    if (!file || file.size === 0) {
      setUploadError("Choose a photo first.");
      return;
    }

    setUploading(true);
    const publicUrl = await directUploadPlayerPhoto(file);
    setUploading(false);

    if (!publicUrl) {
      setUploadError("Upload failed. Please try again.");
      return;
    }

    const fd = new FormData();
    fd.set("player_id", playerId);
    fd.set("photo_url", publicUrl);
    startTransition(() => formAction(fd));
  }

  const busy = isPending || uploading;

  const STATUS_COLOR: Record<string, string> = {
    none:     "text-white/30",
    pending:  "text-warning",
    approved: "text-success",
    rejected: "text-danger",
  };

  return (
    <div className="mt-2">
      {currentPhotoUrl && currentStatus !== "rejected" && (
        <div className="mb-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentPhotoUrl}
            alt="Player photo"
            className="h-12 w-12 object-cover border border-white/10"
          />
          <span className={`text-[10px] font-semibold uppercase tracking-wide ${STATUS_COLOR[currentStatus] ?? "text-white/30"}`}>
            {currentStatus}
          </span>
        </div>
      )}

      {(uploadError || state?.error) && (
        <p className="text-danger text-[11px] mb-1">{uploadError ?? state?.error}</p>
      )}

      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          disabled={busy}
          className="text-[11px] text-white/50 file:mr-2 file:text-[10px] file:font-semibold file:bg-white/10 file:text-white file:border file:border-white/20 file:px-2 file:py-1 hover:file:bg-white/20 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={busy}
          className="text-[11px] font-semibold px-3 py-1 bg-cobalt/20 text-cobalt hover:bg-cobalt/30 transition-colors disabled:opacity-50 shrink-0"
        >
          {uploading ? "Uploading..." : isPending ? "Saving..." : "Upload photo"}
        </button>
      </form>
    </div>
  );
}
