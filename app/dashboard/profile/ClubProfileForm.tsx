"use client";

import { useActionState } from "react";
import { updateClubProfile } from "./actions";

interface Props {
  name:      string;
  faculty:   string;
  bio:       string | null;
  logo_url:  string | null;
  badge_url: string | null;
}

export function ClubProfileForm({ name, faculty, bio, logo_url, badge_url }: Props) {
  const [state, action, isPending] = useActionState(updateClubProfile, null);

  return (
    <form action={action} className="space-y-6">
      {"error" in (state ?? {}) && (
        <div className="bg-danger/5 border border-danger/30 text-danger text-sm px-4 py-3 rounded">
          {(state as { error: string }).error}
        </div>
      )}
      {"success" in (state ?? {}) && (
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
            name="badge"
            type="file"
            accept="image/*"
            className="w-full text-sm text-muted file:mr-3 file:py-1.5 file:px-4 file:rounded file:border file:border-border file:text-xs file:font-semibold file:text-navy file:bg-white hover:file:bg-surface transition-colors"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="bg-gold text-navy font-semibold text-sm px-5 py-2.5 rounded hover:bg-gold/90 transition-colors disabled:opacity-60"
      >
        {isPending ? "Saving..." : "Save profile"}
      </button>
    </form>
  );
}
