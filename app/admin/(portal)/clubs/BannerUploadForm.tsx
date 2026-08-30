"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { updateClubBanner } from "./bannerActions";
import { directUpload } from "@/lib/direct-upload";

interface Props {
  clubId: string;
  currentBannerUrl: string | null;
}

export function BannerUploadForm({ clubId, currentBannerUrl }: Props) {
  const [state, formAction, isPending] = useActionState(updateClubBanner, null);
  const [url, setUrl] = useState(currentBannerUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setUploadError(null);

    const file = fileRef.current?.files?.[0];
    let finalUrl = url;

    if (file && file.size > 0) {
      setUploading(true);
      const uploaded = await directUpload(file, `clubs/${clubId}/banner`);
      setUploading(false);
      if (!uploaded) {
        setUploadError("Upload failed. Try again.");
        return;
      }
      finalUrl = uploaded;
      setUrl(uploaded);
    }

    const fd = new FormData();
    fd.set("club_id", clubId);
    fd.set("banner_image_url", finalUrl);
    startTransition(() => formAction(fd));
  }

  const busy = isPending || uploading;

  return (
    <form onSubmit={handleSubmit} className="mt-3 pt-3 border-t border-border">
      <p className="text-xs font-semibold text-navy uppercase tracking-wide mb-2">Club Banner Image</p>

      {(uploadError || (state && "error" in state)) && (
        <p className="text-xs text-danger mb-2">
          {uploadError ?? (state && "error" in state ? state.error : "")}
        </p>
      )}
      {"success" in (state ?? {}) && (
        <p className="text-xs text-success mb-2">Banner saved.</p>
      )}

      {url && (
        <div className="mb-2 relative w-full h-20 bg-navy/5 border border-border rounded overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => { setUrl(""); if (fileRef.current) fileRef.current.value = ""; }}
            className="absolute top-1 right-1 bg-danger text-white text-[10px] font-semibold px-1.5 py-0.5 rounded"
          >
            Remove
          </button>
        </div>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          disabled={busy}
          className="text-xs text-muted file:mr-2 file:text-xs file:font-semibold file:bg-navy file:text-white file:border-0 file:px-2.5 file:py-1 file:rounded file:cursor-pointer hover:file:bg-navy/80 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={busy}
          className="text-xs font-semibold px-3 py-1.5 rounded bg-cobalt/10 text-cobalt hover:bg-cobalt/20 transition-colors disabled:opacity-60 shrink-0"
        >
          {uploading ? "Uploading..." : isPending ? "Saving..." : "Save banner"}
        </button>
      </div>
    </form>
  );
}
