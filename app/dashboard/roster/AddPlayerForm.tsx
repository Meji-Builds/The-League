"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { addPlayer } from "./actions";
import { directUploadIdCard } from "@/lib/direct-upload";

export function AddPlayerForm() {
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

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="border border-border bg-white rounded p-5">
      <h3 className="text-navy font-semibold text-sm mb-4">Add a player</h3>

      {(uploadError || state?.error) && (
        <div className="bg-danger/5 border border-danger/30 text-danger text-xs px-3 py-2 mb-4 rounded">
          {uploadError ?? state?.error}
        </div>
      )}

      <div className="grid sm:grid-cols-3 gap-3 mb-4">
        <div>
          <label htmlFor="gamer_tag" className="block text-navy text-xs font-semibold mb-1 uppercase tracking-wide">
            Gamer tag <span className="text-danger">*</span>
          </label>
          <input
            id="gamer_tag"
            name="gamer_tag"
            type="text"
            required
            placeholder="xX_Player_Xx"
            className="w-full border border-border bg-white text-navy text-sm px-3 py-2 rounded focus:outline-none focus:border-cobalt transition-colors placeholder:text-muted/50"
          />
        </div>

        <div>
          <label htmlFor="full_name" className="block text-navy text-xs font-semibold mb-1 uppercase tracking-wide">
            Full name <span className="text-muted font-normal normal-case">(optional)</span>
          </label>
          <input
            id="full_name"
            name="full_name"
            type="text"
            placeholder="Real name"
            className="w-full border border-border bg-white text-navy text-sm px-3 py-2 rounded focus:outline-none focus:border-cobalt transition-colors placeholder:text-muted/50"
          />
        </div>

        <div>
          <label htmlFor="position" className="block text-navy text-xs font-semibold mb-1 uppercase tracking-wide">
            Position <span className="text-muted font-normal normal-case">(optional)</span>
          </label>
          <input
            id="position"
            name="position"
            type="text"
            placeholder="e.g. Striker, Support"
            className="w-full border border-border bg-white text-navy text-sm px-3 py-2 rounded focus:outline-none focus:border-cobalt transition-colors placeholder:text-muted/50"
          />
        </div>
      </div>

      <div className="mb-4">
        <label htmlFor="id_card" className="block text-navy text-xs font-semibold mb-1 uppercase tracking-wide">
          Student ID card <span className="text-danger">*</span>
        </label>
        <p className="text-muted text-xs mb-2">
          Upload a clear photo of the player&apos;s student ID card. Admin will verify they are from your faculty.
        </p>
        <input
          ref={fileRef}
          id="id_card"
          name="id_card"
          type="file"
          accept="image/*"
          className="w-full text-sm text-muted file:mr-3 file:py-1.5 file:px-4 file:rounded file:border file:border-border file:text-xs file:font-semibold file:text-navy file:bg-white hover:file:bg-surface transition-colors"
        />
      </div>

      <button
        type="submit"
        disabled={busy}
        className="bg-gold text-navy font-semibold text-sm px-5 py-2 rounded hover:bg-gold/90 transition-colors disabled:opacity-60"
      >
        {uploading ? "Uploading ID card..." : isPending ? "Adding..." : "Add player"}
      </button>
    </form>
  );
}
