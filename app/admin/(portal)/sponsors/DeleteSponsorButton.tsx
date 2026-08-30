"use client";

import { deleteSponsor } from "./actions";

export function DeleteSponsorButton({ id, name }: { id: string; name: string }) {
  return (
    <form
      action={deleteSponsor}
      onSubmit={(e) => {
        if (!confirm(`Delete ${name}?`)) e.preventDefault();
      }}
      className="shrink-0"
    >
      <input type="hidden" name="id" value={id} />
      <button type="submit" className="text-xs text-danger hover:text-danger/70 transition-colors">
        Delete
      </button>
    </form>
  );
}
