"use client";

import { useState } from "react";
import { enterCompetition } from "./actions";

interface Props {
  competitionId: string;
  competitionName: string;
  entryFee: number;
  disabled: boolean;
}

export function EnterButton({ competitionId, competitionName, entryFee, disabled }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    const result = await enterCompetition(competitionId);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
    // On success the server action redirects, so no further client action needed.
  }

  return (
    <div className="text-right">
      {error && <p className="text-danger text-xs mb-2">{error}</p>}
      <button
        onClick={handleClick}
        disabled={disabled || loading}
        title={disabled ? "Pay registration fee first" : `Enter ${competitionName}`}
        className="bg-gold text-navy font-semibold text-sm px-5 py-2 rounded hover:bg-gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading
          ? "Processing..."
          : entryFee > 0
          ? `Enter — NGN ${entryFee.toLocaleString()}`
          : "Enter (Free)"}
      </button>
    </div>
  );
}
