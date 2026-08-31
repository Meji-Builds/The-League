import { createClient } from "@/lib/supabase/server";
import { SponsorForm } from "./SponsorForm";
import { deleteSponsor } from "./actions";
import { DeleteButton } from "@/app/admin/_components/DeleteButton";

export const metadata = { title: "Admin — Sponsors" };

interface Sponsor {
  id:            string;
  name:          string;
  logo_url:      string;
  tier:          string;
  website_url:   string | null;
  display_order: number;
}

const TIER_LABEL: Record<string, string> = {
  title:  "Title",
  gold:   "Gold",
  silver: "Silver",
  bronze: "Bronze",
};

const TIER_COLOR: Record<string, string> = {
  title:  "text-gold",
  gold:   "text-amber-400",
  silver: "text-zinc-400",
  bronze: "text-orange-400",
};

export default async function AdminSponsorsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = (await createClient()) as any;

  const { data } = await db
    .from("global_sponsors")
    .select("*")
    .order("display_order");

  const sponsors = (data ?? []) as Sponsor[];

  return (
    <div>
      <div className="mb-10">
        <p className="text-[9px] font-bold uppercase tracking-[0.5em] text-dim mb-3">Admin</p>
        <h1 className="font-display font-black text-[2rem] text-white uppercase leading-none">Sponsors</h1>
      </div>

      <div className="mb-10">
        <SponsorForm />
      </div>

      {sponsors.length === 0 ? (
        <div className="border border-white/6 bg-card px-8 py-12 text-center">
          <p className="text-white/40 text-[13px]">No sponsors yet. Add the first one above.</p>
        </div>
      ) : (
        <div className="border border-white/6 divide-y divide-white/5">
          {sponsors.map((s) => (
            <div key={s.id} className="flex items-center gap-4 px-4 py-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={s.logo_url}
                alt={s.name}
                className="h-16 w-28 object-contain shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-white text-sm">{s.name}</p>
                  <span className={`text-[10px] font-bold uppercase tracking-[0.2em] ${TIER_COLOR[s.tier] ?? "text-white/30"}`}>
                    {TIER_LABEL[s.tier] ?? s.tier}
                  </span>
                </div>
                {s.website_url && (
                  <a
                    href={s.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-cobalt hover:text-white transition-colors mt-0.5 inline-block"
                  >
                    {s.website_url}
                  </a>
                )}
                <p className="text-[11px] text-white/25 mt-0.5">Order: {s.display_order}</p>
              </div>
              <DeleteButton action={deleteSponsor} id={s.id} confirm={`Delete ${s.name}?`} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
