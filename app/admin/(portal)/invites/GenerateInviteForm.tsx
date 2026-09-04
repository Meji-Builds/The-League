"use client";

import { useActionState, useRef, useState } from "react";
import { generateInvite } from "./actions";

export function GenerateInviteForm() {
  const [state, action, pending] = useActionState(generateInvite, null);
  const [copied, setCopied]      = useState(false);
  const urlRef                   = useRef<HTMLInputElement>(null);

  const inviteUrl = state && "inviteUrl" in state ? state.inviteUrl : null;

  function copyUrl() {
    if (!inviteUrl) return;
    navigator.clipboard.writeText(inviteUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div>
      <form action={action} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="expected_name" className="block text-white/70 text-xs font-medium mb-1.5">
              Expected name <span className="text-danger">*</span>
            </label>
            <input
              id="expected_name" name="expected_name" type="text" required
              placeholder="e.g. Chukwuemeka Obi"
              className="w-full bg-white/5 border border-white/15 text-white text-sm px-3 py-2 rounded placeholder:text-white/30 focus:outline-none focus:border-gold transition-colors"
            />
          </div>
          <div>
            <label htmlFor="expected_club_name" className="block text-white/70 text-xs font-medium mb-1.5">
              Expected club name <span className="text-danger">*</span>
            </label>
            <input
              id="expected_club_name" name="expected_club_name" type="text" required
              placeholder="e.g. Phoenix FC"
              className="w-full bg-white/5 border border-white/15 text-white text-sm px-3 py-2 rounded placeholder:text-white/30 focus:outline-none focus:border-gold transition-colors"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="expected_email" className="block text-white/70 text-xs font-medium mb-1.5">
              Expected email <span className="text-white/30 font-normal">(optional)</span>
            </label>
            <input
              id="expected_email" name="expected_email" type="email"
              placeholder="their@email.com"
              className="w-full bg-white/5 border border-white/15 text-white text-sm px-3 py-2 rounded placeholder:text-white/30 focus:outline-none focus:border-gold transition-colors"
            />
          </div>
          <div>
            <label htmlFor="expiry_days" className="block text-white/70 text-xs font-medium mb-1.5">
              Expires in (days)
            </label>
            <input
              id="expiry_days" name="expiry_days" type="number" min="1" max="30" defaultValue="7"
              className="w-full bg-white/5 border border-white/15 text-white text-sm px-3 py-2 rounded focus:outline-none focus:border-gold transition-colors"
            />
          </div>
        </div>

        <div>
          <label htmlFor="note" className="block text-white/70 text-xs font-medium mb-1.5">
            Note <span className="text-white/30 font-normal">(optional)</span>
          </label>
          <input
            id="note" name="note" type="text"
            placeholder="e.g. Sent via WhatsApp on 4 Sep"
            className="w-full bg-white/5 border border-white/15 text-white text-sm px-3 py-2 rounded placeholder:text-white/30 focus:outline-none focus:border-gold transition-colors"
          />
        </div>

        {state && "error" in state && (
          <p className="text-danger text-xs">{state.error}</p>
        )}

        <button
          type="submit" disabled={pending}
          className="bg-gold text-navy font-semibold text-sm px-5 py-2 rounded hover:bg-gold/90 transition-colors disabled:opacity-60"
        >
          {pending ? "Generating…" : "Generate invite link"}
        </button>
      </form>

      {inviteUrl && (
        <div className="mt-5 bg-success/5 border border-success/20 rounded p-4">
          <p className="text-success text-xs font-semibold uppercase tracking-wider mb-2">Invite link ready</p>
          <div className="flex items-center gap-2">
            <input
              ref={urlRef}
              readOnly
              value={inviteUrl}
              className="flex-1 bg-white/5 border border-white/10 text-white text-xs px-3 py-2 rounded font-mono min-w-0"
              onFocus={(e) => e.target.select()}
            />
            <button
              type="button"
              onClick={copyUrl}
              className="shrink-0 bg-white/10 hover:bg-white/15 text-white text-xs font-semibold px-3 py-2 rounded transition-colors"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <p className="text-white/40 text-[11px] mt-2">
            Send this link on WhatsApp. It is single-use and expires as configured above.
          </p>
        </div>
      )}
    </div>
  );
}
