"use client";

import { useState } from "react";

export function CopyButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="text-[11px] font-medium px-3 py-1.5 bg-white/8 text-white/60 hover:bg-white/12 rounded transition-colors"
    >
      {copied ? "Copied!" : "Copy link"}
    </button>
  );
}
