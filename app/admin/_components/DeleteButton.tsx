"use client";

import type { ReactNode } from "react";

interface Props {
  action: (formData: FormData) => Promise<void>;
  id:     string;
  confirm: string;
  children?: ReactNode;
  className?: string;
}

export function DeleteButton({ action, id, confirm: msg, children = "Delete", className }: Props) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(msg)) e.preventDefault();
      }}
      className="shrink-0"
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className={className ?? "text-xs text-danger hover:text-danger/70 transition-colors"}
      >
        {children}
      </button>
    </form>
  );
}
