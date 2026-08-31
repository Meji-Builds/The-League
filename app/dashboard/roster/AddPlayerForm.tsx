"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { addPlayer } from "./actions";
import { directUploadIdCard } from "@/lib/direct-upload";

export function AddPlayerForm({ cap, count }: { cap: number; count: number }) {
  const [state, formAction, isPending] = useActionState(addPlayer, null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state === null) {
      formRef.current?.reset();
      setUploadError(null);
    }
  }, [state]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setUploadError(null);
    const fd = new FormData(e.currentTarget);
    const file = fileRef.current?.files?.[0];

    if (!file || file.size === 0) {
      setUploadError("Student ID card image is required.");
      return;
    }

    setUploading(true);
    const storagePath = await directUploadIdCard(file);
    setUploading(false);

    if (!storagePath) {
      setUploadError("ID card upload failed. Please try again.");
      return;
    }

    fd.delete("id_card");
    fd.set("id_card_url", storagePath);
    startTransition(() => formAction(fd));
  }

  const busy = isPending || uploading;
  const atCap = count >= cap;

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="border border-white/6 bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold text-sm">Add a player</h3>
        <span className="text-[11px] text-white/40">{count} / {cap} players</span>
      </div>

      {atCap && (
        <div className="bg-warning/5 border border-warning/30 text-warning text-xs px-3 py-2 mb-4">
          Roster cap reached. Remove a player to add another.
        </div>
      )}

      {(uploadError || state?.error) && (
        <div className="bg-danger/5 border border-danger/30 text-danger text-xs px-3 py-2 mb-4">
          {uploadError ?? state?.error}
        </div>
      )}

      <div className="grid sm:grid-cols-3 gap-3 mb-4">
        <div>
          <label htmlFor="gamer_tag" className="block text-white/70 text-xs font-semibold mb-1 uppercase tracking-wide">
            Gamer tag <span className="text-danger">*</span>
          </label>
          <input
            id="gamer_tag"
            name="gamer_tag"
            type="text"
            required
            disabled={atCap}
            placeholder="xX_Player_Xx"
            className="w-full border border-white/10 bg-navy/50 text-white text-sm px-3 py-2 focus:outline-none focus:border-cobalt transition-colors placeholder:text-white/20 disabled:opacity-50"
          />
        </div>

        <div>
          <label htmlFor="full_name" className="block text-white/70 text-xs font-semibold mb-1 uppercase tracking-wide">
            Full name <span className="text-white/40 font-normal normal-case">(optional)</span>
          </label>
          <input
            id="full_name"
            name="full_name"
            type="text"
            disabled={atCap}
            placeholder="Real name"
            className="w-full border border-white/10 bg-navy/50 text-white text-sm px-3 py-2 focus:outline-none focus:border-cobalt transition-colors placeholder:text-white/20 disabled:opacity-50"
          />
        </div>

        <div>
          <label htmlFor="position" className="block text-white/70 text-xs font-semibold mb-1 uppercase tracking-wide">
            Position <span className="text-white/40 font-normal normal-case">(optional)</span>
          </label>
          <input
            id="position"
            name="position"
            type="text"
            disabled={atCap}
            placeholder="e.g. Striker, Support"
            className="w-full border border-white/10 bg-navy/50 text-white text-sm px-3 py-2 focus:outline-none focus:border-cobalt transition-colors placeholder:text-white/20 disabled:opacity-50"
          />
        </div>
      </div>

      <div className="mb-4">
        <label htmlFor="id_card" className="block text-white/70 text-xs font-semibold mb-1 uppercase tracking-wide">
          Student ID card <span className="text-danger">*</span>
        </label>
        <p className="text-white/40 text-xs mb-2">
          Upload a clear photo of the player&apos;s student ID card. Admin will verify they are from your faculty.
        </p>
        <input
          ref={fileRef}
          id="id_card"
          name="id_card"
          type="file"
          accept="image/*"
          disabled={atCap}
          className="w-full text-sm text-white/50 file:mr-3 file:py-1.5 file:px-4 file:border file:border-white/20 file:text-xs file:font-semibold file:text-white file:bg-white/10 hover:file:bg-white/20 transition-colors disabled:opacity-50"
        />
      </div>

      <button
        type="submit"
        disabled={busy || atCap}
        className="bg-gold text-navy font-semibold text-sm px-5 py-2 hover:bg-gold/90 transition-colors disabled:opacity-60"
      >
        {uploading ? "Uploading ID card..." : isPending ? "Adding..." : "Add player"}
      </button>
    </form>
  );
}
