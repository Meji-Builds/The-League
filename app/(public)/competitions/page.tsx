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

export default async function CompetitionsPage() {
  const competitions = await getCompetitions();

  const active    = competitions.filter((c) => c.status === "in_progress" || c.status === "registration_open");
  const upcoming  = competitions.filter((c) => c.status === "upcoming");
  const completed = competitions.filter((c) => c.status === "completed");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-navy mb-2">Competitions</h1>
      <p className="text-muted text-sm mb-10">
        The League runs multiple competitions concurrently — from the flagship
        University Championship to standalone cups.
      </p>

      {competitions.length === 0 && (
        <div className="border border-border bg-white px-8 py-14 text-center">
          <p className="text-navy font-semibold">No competitions yet.</p>
          <p className="text-muted text-sm mt-2">Check back once Season 1 kicks off.</p>
        </div>
      )}

      {[
        { title: "Active",    items: active },
        { title: "Upcoming",  items: upcoming },
        { title: "Completed", items: completed },
      ].map(({ title, items }) =>
        items.length > 0 ? (
          <section key={title} className="mb-12">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted mb-4">
              {title}
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((c) => (
                <Link
                  key={c.id}
                  href={`/competitions/${c.slug}`}
                  className="block bg-white border border-border p-6 hover:border-cobalt transition-colors group"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <span className="text-xs text-cobalt font-semibold uppercase tracking-wider">
                      {typeLabel[c.type]}
                    </span>
                    <span className="text-xs border border-border text-muted px-2 py-0.5">
                      {statusLabel[c.status]}
                    </span>
                  </div>
                  <p className="font-bold text-navy group-hover:text-cobalt transition-colors">
                    {c.name}
                  </p>
                  <p className="text-muted text-xs mt-1">{c.edition}</p>
                  {c.description && (
                    <p className="text-muted text-sm mt-3 leading-relaxed line-clamp-2">
                      {c.description}
                    </p>
                  )}
                  {c.entry_fee > 0 && (
                    <p className="text-xs text-navy font-semibold mt-4">
                      Entry fee: ₦{c.entry_fee.toLocaleString()}
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
