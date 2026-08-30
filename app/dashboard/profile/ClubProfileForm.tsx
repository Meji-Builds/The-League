"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { updateClubProfile } from "./actions";
import { directUpload } from "@/lib/direct-upload";

interface Props {
  name:      string;
  faculty:   string;
  bio:       string | null;
  logo_url:  string | null;
  badge_url: string | null;
}

export function ClubProfileForm({ name, faculty, bio, logo_url, badge_url }: Props) {
  const [state, formAction, isPending] = useActionState(updateClubProfile, null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const logoRef  = useRef<HTMLInputElement>(null);
  const badgeRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setUploadError(null);
    const fd = new FormData(e.currentTarget);

    const logoFile  = logoRef.current?.files?.[0];
    const badgeFile = badgeRef.current?.files?.[0];

    if (logoFile?.size || badgeFile?.size) {
      setUploading(true);
      const [logoUrl, badgeUrl] = await Promise.all([
        logoFile?.size  ? directUpload(logoFile,  "clubs") : Promise.resolve(null),
        badgeFile?.size ? directUpload(badgeFile, "clubs") : Promise.resolve(null),
      ]);
      setUploading(false);

      if ((logoFile?.size && !logoUrl) || (badgeFile?.size && !badgeUrl)) {
        setUploadError("Image upload failed. Please try again.");
        return;
      }
      if (logoUrl)  { fd.delete("logo");  fd.set("logo_url",  logoUrl); }
      if (badgeUrl) { fd.delete("badge"); fd.set("badge_url", badgeUrl); }
    }

    startTransition(() => formAction(fd));
  }

  const busy = isPending || uploading;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {(uploadError || (state && "error" in state)) && (
        <div className="bg-danger/5 border border-danger/30 text-danger text-sm px-4 py-3 rounded">
          {uploadError ?? (state as { error: string }).error}
        </div>
      )}
      {state && "success" in state && (
        <div className="bg-success/5 border border-success/30 text-success text-sm px-4 py-3 rounded">
          Profile saved.
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <label className="block text-navy text-xs font-semibold mb-1.5 uppercase tracking-wide">
            Club name <span className="text-danger">*</span>
          </label>
          <input
            name="name"
            type="text"
            required
            defaultValue={name}
            className="w-full border border-border bg-white text-navy text-sm px-3 py-2.5 rounded focus:outline-none focus:border-cobalt transition-colors"
          />
        </div>

        <div>
          <label className="block text-navy text-xs font-semibold mb-1.5 uppercase tracking-wide">
            Faculty <span className="text-danger">*</span>
          </label>
          <input
            name="faculty"
            type="text"
            required
            defaultValue={faculty}
            className="w-full border border-border bg-white text-navy text-sm px-3 py-2.5 rounded focus:outline-none focus:border-cobalt transition-colors"
          />
        </div>
      </div>

      <div>
        <label className="block text-navy text-xs font-semibold mb-1.5 uppercase tracking-wide">
          Bio <span className="text-muted font-normal normal-case">(optional)</span>
        </label>
        <textarea
          name="bio"
          rows={3}
          defaultValue={bio ?? ""}
          placeholder="A short description of your club..."
          className="w-full border border-border bg-white text-navy text-sm px-3 py-2.5 rounded focus:outline-none focus:border-cobalt transition-colors resize-none"
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <label className="block text-navy text-xs font-semibold mb-1.5 uppercase tracking-wide">
            Logo <span className="text-muted font-normal normal-case">(optional — replaces current)</span>
          </label>
          {logo_url && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={logo_url} alt="Current logo" className="h-14 w-24 object-contain border border-border bg-surface p-1 mb-2 rounded" />
          )}
          <input
            ref={logoRef}
            name="logo"
            type="file"
            accept="image/*"
            className="w-full text-sm text-muted file:mr-3 file:py-1.5 file:px-4 file:rounded file:border file:border-border file:text-xs file:font-semibold file:text-navy file:bg-white hover:file:bg-surface transition-colors"
          />
        </div>

        <div>
          <label className="block text-navy text-xs font-semibold mb-1.5 uppercase tracking-wide">
            Badge / Cover photo <span className="text-muted font-normal normal-case">(optional — replaces current)</span>
          </label>
          {badge_url && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={badge_url} alt="Current badge" className="h-14 w-24 object-contain border border-border bg-surface p-1 mb-2 rounded" />
          )}
          <input
            ref={badgeRef}
            name="badge"
            type="file"
            accept="image/*"
            className="w-full text-sm text-muted file:mr-3 file:py-1.5 file:px-4 file:rounded file:border file:border-border file:text-xs file:font-semibold file:text-navy file:bg-white hover:file:bg-surface transition-colors"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={busy}
        className="bg-gold text-navy font-semibold text-sm px-5 py-2.5 rounded hover:bg-gold/90 transition-colors disabled:opacity-60"
      >
        {uploading ? "Uploading images..." : isPending ? "Saving..." : "Save profile"}
      </button>
    </form>
  );
}
