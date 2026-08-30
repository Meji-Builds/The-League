"use client";

import { useState, useRef } from "react";
import { directUpload } from "@/lib/direct-upload";

interface Props {
  name: string;
  folder: string;
  label: string;
  currentUrl?: string | null;
  aspectHint?: string; // e.g. "16:9 recommended"
}

export function ImageUploadField({ name, folder, label, currentUrl, aspectHint }: Props) {
  const [url, setUrl] = useState(currentUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    const result = await directUpload(file, folder);
    setUploading(false);
    if (!result) {
      setError("Upload failed. Check your connection and try again.");
      return;
    }
    setUrl(result);
  }

  return (
    <div>
      <label className="block text-navy text-xs font-semibold mb-1 uppercase tracking-wide">
        {label}
        {aspectHint && <span className="ml-1 text-muted font-normal normal-case">({aspectHint})</span>}
      </label>

      <input type="hidden" name={name} value={url} />

      {url && (
        <div className="mb-2 relative w-full h-28 bg-navy/5 border border-border rounded overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => { setUrl(""); if (fileRef.current) fileRef.current.value = ""; }}
            className="absolute top-1.5 right-1.5 bg-danger text-white text-[10px] font-semibold px-2 py-0.5 rounded hover:bg-danger/80 transition-colors"
          >
            Remove
          </button>
        </div>
      )}

      <div className="flex items-center gap-2">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={handleChange}
          disabled={uploading}
          className="text-xs text-muted file:mr-2 file:text-xs file:font-semibold file:bg-navy file:text-white file:border-0 file:px-2.5 file:py-1 file:rounded file:cursor-pointer hover:file:bg-navy/80 disabled:opacity-60"
        />
        {uploading && <span className="text-xs text-muted">Uploading...</span>}
      </div>
      {error && <p className="text-xs text-danger mt-1">{error}</p>}
    </div>
  );
}
