import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
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

const statusStyle: Record<string, string> = {
  in_progress:       "bg-success/10 text-success",
  registration_open: "bg-gold/10 text-gold",
  upcoming:          "bg-cobalt/10 text-cobalt",
  completed:         "bg-white/5 text-dim",
};

export default async function CompetitionsPage() {
  const competitions = await getCompetitions();

  const active    = competitions.filter((c) => c.status === "in_progress" || c.status === "registration_open");
  const upcoming  = competitions.filter((c) => c.status === "upcoming");
  const completed = competitions.filter((c) => c.status === "completed");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10">
        <h1 className="font-display text-4xl font-bold text-white uppercase tracking-tight">Competitions</h1>
        <p className="text-dim text-sm mt-2 max-w-lg">
          Multiple competitions run concurrently — from the flagship
          University Championship to standalone cups.
        </p>
      </div>

      {competitions.length === 0 && (
        <div className="border border-rim bg-card px-8 py-14 text-center rounded">
          <p className="text-white font-semibold">No competitions yet.</p>
          <p className="text-dim text-sm mt-2">Check back once Season 1 kicks off.</p>
        </div>
      )}

      {[
        { title: "Active",    items: active },
        { title: "Upcoming",  items: upcoming },
        { title: "Completed", items: completed },
      ].map(({ title, items }) =>
        items.length > 0 ? (
          <section key={title} className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <p className="text-xs font-semibold text-dim uppercase tracking-wider">{title}</p>
              <div className="flex-1 h-px bg-rim" />
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((c) => (
                <Link
                  key={c.id}
                  href={`/competitions/${c.slug}`}
                  className="block bg-card border border-rim p-6 hover:border-cobalt/50 transition-all group rounded"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <span className="text-xs text-gold font-bold uppercase tracking-wider">
                      {typeLabel[c.type]}
                    </span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusStyle[c.status] ?? "bg-white/5 text-dim"}`}>
                      {statusLabel[c.status]}
                    </span>
                  </div>
                  <p className="font-bold text-white group-hover:text-gold transition-colors leading-snug">
                    {c.name}
                  </p>
                  <p className="text-dim text-xs mt-1">{c.edition}</p>
                  {c.description && (
                    <p className="text-dim text-sm mt-3 leading-relaxed line-clamp-2">
                      {c.description}
                    </p>
                  )}
                  {c.entry_fee > 0 && (
                    <p className="text-xs text-white font-semibold mt-4 border-t border-rim pt-4">
                      {"₦"}{c.entry_fee.toLocaleString()} entry fee
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </section>
        ) : null
      )}
    </div>
  );
}
