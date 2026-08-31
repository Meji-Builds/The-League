import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getSiteSettings } from "@/lib/site-settings";
import type { Competition } from "@/types/database";

export const metadata = { title: "Competitions" };

async function getCompetitions(): Promise<Competition[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("competitions")
      .select("*")
      .order("created_at", { ascending: false });
    return data ?? [];
  } catch {
    return [];
  }
}

const typeLabel: Record<string, string> = {
  flagship: "Championship",
  cup:      "Cup",
  other:    "Tournament",
};

const statusLabel: Record<string, string> = {
  upcoming:          "Upcoming",
  registration_open: "Registration Open",
  in_progress:       "In Progress",
  completed:         "Completed",
};

const statusAccent: Record<string, string> = {
  in_progress:       "bg-success",
  registration_open: "bg-gold",
  upcoming:          "bg-cobalt",
  completed:         "bg-white/20",
};

const statusText: Record<string, string> = {
  in_progress:       "text-success",
  registration_open: "text-gold",
  upcoming:          "text-cobalt",
  completed:         "text-white/35",
};

export default async function CompetitionsPage() {
  const [competitions, siteSettings] = await Promise.all([getCompetitions(), getSiteSettings()]);
  const currentSeason = siteSettings.current_season;

  const active    = competitions.filter((c) => c.status === "in_progress" || c.status === "registration_open");
  const upcoming  = competitions.filter((c) => c.status === "upcoming");
  const completed = competitions.filter((c) => c.status === "completed");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="mb-14">
        <p className="text-[9px] font-bold uppercase tracking-[0.5em] text-dim mb-4">{currentSeason}</p>
        <h1 className="font-display font-black text-[3rem] text-white uppercase leading-none">Competitions</h1>
        <p className="text-white/35 text-[15px] mt-4 max-w-lg leading-relaxed">
          Multiple competitions run concurrently — from the flagship
          University Championship to standalone cups.
        </p>
      </div>

      {competitions.length === 0 && (
        <div className="border border-white/8 bg-card px-8 py-16 text-center">
          <p className="text-white font-semibold">No competitions yet.</p>
          <p className="text-white/35 text-sm mt-2">Check back once Season 1 kicks off.</p>
        </div>
      )}

      {[
        { title: "Active",    subtitle: "Running now",  items: active },
        { title: "Upcoming",  subtitle: "Coming soon",  items: upcoming },
        { title: "Completed", subtitle: "Past seasons", items: completed },
      ].map(({ title, subtitle, items }) =>
        items.length > 0 ? (
          <section key={title} className="mb-14">
            <div className="flex items-center gap-4 mb-6">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-dim">{subtitle}</p>
                <p className="text-lg font-display font-black text-white uppercase mt-0.5">{title}</p>
              </div>
              <div className="flex-1 h-px bg-white/5" />
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-white/5 border border-white/5">
              {items.map((c) => (
                <Link
                  key={c.id}
                  href={`/competitions/${c.slug}`}
                  className="block bg-card hover:bg-white/[0.03] transition-colors group relative overflow-hidden"
                >
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {(c as any).banner_image_url ? (
                    <div className="relative w-full h-36 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        src={(c as any).banner_image_url}
                        alt={c.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
                    </div>
                  ) : null}

                  <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${statusAccent[c.status] ?? "bg-white/20"}`} />

                  <div className="p-6 pl-7">
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-white/35">
                        {typeLabel[c.type]}
                      </span>
                      <span className={`text-[9px] font-bold uppercase tracking-[0.15em] ${statusText[c.status] ?? "text-white/35"}`}>
                        {statusLabel[c.status]}
                      </span>
                    </div>
                    <p className="font-display font-black text-xl text-white group-hover:text-gold transition-colors uppercase leading-tight">
                      {c.name}
                    </p>
                    <p className="text-white/30 text-xs mt-1">{c.edition}</p>
                    {c.description && (
                      <p className="text-white/40 text-sm mt-3 leading-relaxed line-clamp-2">
                        {c.description}
                      </p>
                    )}
                    {c.entry_fee > 0 && (
                      <p className="text-xs text-white/30 mt-4 pt-4 border-t border-white/5">
                        {"₦"}{c.entry_fee.toLocaleString()} entry fee
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : null
      )}
    </div>
  );
}
