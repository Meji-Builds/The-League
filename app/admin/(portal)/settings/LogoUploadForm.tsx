"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { updateLogoUrl } from "./actions";
import { directUpload } from "@/lib/direct-upload";

interface Props {
  currentLogoUrl: string | null;
}

export function LogoUploadForm({ currentLogoUrl }: Props) {
  const [state, formAction, isPending] = useActionState(updateLogoUrl, null);
  const [url, setUrl] = useState(currentLogoUrl ?? "");
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
      const uploaded = await directUpload(file, "site/logo");
      setUploading(false);
      if (!uploaded) {
        setUploadError("Upload failed. Try again.");
        return;
      }
      finalUrl = uploaded;
      setUrl(uploaded);
    }

    const fd = new FormData();
    fd.set("logo_url", finalUrl);
    startTransition(() => formAction(fd));
  }

  const busy = isPending || uploading;

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {(uploadError || (state && "error" in state)) && (
        <p className="text-xs text-danger">
          {uploadError ?? (state && "error" in state ? state.error : "")}
        </p>
      )}
      {state && "success" in state && (
        <p className="text-xs text-success">Logo saved.</p>
      )}

      {url && (
        <div className="mb-2 flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="Platform logo" className="h-10 max-w-[160px] object-contain" />
          <button
            type="button"
            onClick={() => { setUrl(""); if (fileRef.current) fileRef.current.value = ""; }}
            className="text-[10px] font-semibold text-danger hover:text-danger/80 transition-colors"
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
          {uploading ? "Uploading..." : isPending ? "Saving..." : "Save logo"}
        </button>
      </div>

      <p className="text-white/30 text-[11px]">
        Recommended: PNG or SVG with transparent background, at least 120&times;40 px.
        When set, this replaces the text wordmark in the nav.
      </p>
    </form>
  );
}
