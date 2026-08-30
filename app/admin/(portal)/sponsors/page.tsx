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
  title:  "bg-gold/10 text-gold",
  gold:   "bg-amber-100 text-amber-700",
  silver: "bg-zinc-100 text-zinc-500",
  bronze: "bg-orange-100 text-orange-700",
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
      <h1 className="text-2xl font-bold text-navy mb-8">Sponsors</h1>

      <div className="mb-10">
        <SponsorForm />
      </div>

      {sponsors.length === 0 ? (
        <div className="border border-border bg-white rounded p-10 text-center">
          <p className="text-muted text-sm">No sponsors yet. Add the first one above.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {sponsors.map((s) => (
            <div key={s.id} className="border border-border bg-white rounded p-4 flex items-center gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={s.logo_url}
                alt={s.name}
                className="h-10 w-20 object-contain shrink-0 border border-border bg-surface p-1"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-navy text-sm">{s.name}</p>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${TIER_COLOR[s.tier] ?? ""}`}>
                    {TIER_LABEL[s.tier] ?? s.tier}
                  </span>
                </div>
                {s.website_url && (
                  <a
                    href={s.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-cobalt hover:underline mt-0.5 inline-block"
                  >
                    {s.website_url}
                  </a>
                )}
                <p className="text-xs text-muted mt-0.5">Order: {s.display_order}</p>
              </div>
              <DeleteButton action={deleteSponsor} id={s.id} confirm={`Delete ${s.name}?`} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
