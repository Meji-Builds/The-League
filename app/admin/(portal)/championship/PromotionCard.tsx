"use client";

import { useActionState } from "react";
import { setDivisionPromotions } from "./actions";

interface Club { id: string; name: string; }
interface Promotion { id: string; clubId: string; clubName: string; position: number; }

interface Props {
  divisionId:   string;
  divisionName: string;
  facultyName:  string;
  top2:         Club[];       // current top 2 from live standings
  allClubs:     Club[];       // all clubs assigned to the division
  promotions:   Promotion[];  // already confirmed promotions (0 or 2)
  season:       string;
}

export function PromotionCard({
  divisionId, divisionName, facultyName, top2, allClubs, promotions, season,
}: Props) {
  const [result, action, pending] = useActionState(setDivisionPromotions, null);

  const sortedPromos = [...promotions].sort((a, b) => a.position - b.position);
  const confirmed    = promotions.length === 2;

  return (
    <div className={`border bg-card p-5 ${confirmed ? "border-success/25" : "border-white/6"}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-4">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.5em] text-dim mb-0.5">{facultyName}</p>
          <h3 className="font-display font-black text-[13px] text-white uppercase leading-tight">{divisionName}</h3>
        </div>
        {confirmed && (
          <span className="text-[8px] font-bold uppercase tracking-[0.15em] text-success border border-success/30 px-2 py-0.5 shrink-0">
            Confirmed
          </span>
        )}
      </div>

      {/* Show confirmed clubs */}
      {confirmed && (
        <div className="mb-4 space-y-1.5 pb-4 border-b border-white/5">
          {sortedPromos.map((promo) => (
            <div key={promo.id} className="flex items-center gap-2">
              <span className="text-[9px] text-gold font-mono w-3 shrink-0">{promo.position}</span>
              <span className="text-[12px] text-white/70">{promo.clubName}</span>
            </div>
          ))}
        </div>
      )}

      {/* Form */}
      {allClubs.length < 2 ? (
        <p className="text-[11px] text-white/25 italic">
          {allClubs.length === 0 ? "No clubs assigned to this division." : "Needs at least 2 clubs."}
        </p>
      ) : (
        <form action={action} className="space-y-2.5">
          <input type="hidden" name="division_id" value={divisionId} />
          <input type="hidden" name="season"      value={season} />

          <div>
            <label className="block text-[9px] text-dim uppercase tracking-[0.3em] mb-1">1st Place</label>
            <select
              name="club1_id"
              defaultValue={sortedPromos[0]?.clubId ?? top2[0]?.id ?? ""}
              className="w-full bg-navy border border-white/10 text-white/80 text-xs px-2 py-1.5 outline-none focus:border-white/30 cursor-pointer"
            >
              <option value="">— Select club —</option>
              {allClubs.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[9px] text-dim uppercase tracking-[0.3em] mb-1">2nd Place</label>
            <select
              name="club2_id"
              defaultValue={sortedPromos[1]?.clubId ?? top2[1]?.id ?? ""}
              className="w-full bg-navy border border-white/10 text-white/80 text-xs px-2 py-1.5 outline-none focus:border-white/30 cursor-pointer"
            >
              <option value="">— Select club —</option>
              {allClubs.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={pending}
            className={`w-full text-[11px] font-black uppercase tracking-[0.2em] px-4 py-2 transition-colors disabled:opacity-40 ${
              confirmed
                ? "bg-white/8 text-white/70 hover:bg-white/12"
                : "bg-success text-navy hover:brightness-105"
            }`}
          >
            {pending ? "Saving…" : confirmed ? "Update" : "Confirm Promotion"}
          </button>

          {result?.error && (
            <p className="text-[11px] text-danger">{result.error}</p>
          )}
        </form>
      )}
    </div>
  );
}
