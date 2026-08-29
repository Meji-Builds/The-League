import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Competition } from "@/types/database";

async function getActiveCompetitions(): Promise<Competition[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("competitions")
      .select("*")
      .in("status", ["registration_open", "in_progress"])
      .order("created_at", { ascending: false })
      .limit(4);
    return data ?? [];
  } catch {
    return [];
  }
}

async function getSiteSummary() {
  try {
    const supabase = await createClient();
    const [{ count: clubCount }, { count: playerCount }, { count: competitionCount }] =
      await Promise.all([
        supabase.from("clubs").select("*", { count: "exact", head: true }).eq("status", "approved"),
        supabase.from("players").select("*", { count: "exact", head: true }),
        supabase.from("competitions").select("*", { count: "exact", head: true }),
      ]);
    return { clubs: clubCount ?? 0, players: playerCount ?? 0, competitions: competitionCount ?? 0 };
  } catch {
    return { clubs: 0, players: 0, competitions: 0 };
  }
}

const competitionStatusLabel: Record<string, string> = {
  upcoming:          "Upcoming",
  registration_open: "Registration Open",
  in_progress:       "In Progress",
  completed:         "Completed",
};

export default async function HomePage() {
  const [competitions, summary] = await Promise.all([
    getActiveCompetitions(),
    getSiteSummary(),
  ]);

  return (
    <>
      {/* Hero */}
      <section className="bg-navy text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <p className="text-gold text-xs font-semibold uppercase tracking-[0.2em] mb-4">
            Season 1 — Now Live
          </p>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight tracking-tight max-w-2xl">
            University Esports,<br />Officially Organized.
          </h1>
          <p className="mt-6 text-white/60 text-lg max-w-xl leading-relaxed">
            The League governs university esports competitions — from department
            qualifiers to the University Championship final.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-3">
            <Link
              href="/register"
              className="inline-block bg-gold text-navy font-semibold text-sm px-6 py-3 hover:bg-gold/90 transition-colors text-center"
            >
              Register Your Club
            </Link>
            <Link
              href="/competitions"
              className="inline-block border border-white/20 text-white font-medium text-sm px-6 py-3 hover:border-white/40 hover:bg-white/5 transition-colors text-center"
            >
              View Competitions
            </Link>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="bg-cobalt text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-3 divide-x divide-white/20 text-center">
            <div className="px-4">
              <p className="text-3xl font-bold text-gold">{summary.clubs}</p>
              <p className="text-xs text-white/60 mt-1 uppercase tracking-wider">Clubs</p>
            </div>
            <div className="px-4">
              <p className="text-3xl font-bold text-gold">{summary.players}</p>
              <p className="text-xs text-white/60 mt-1 uppercase tracking-wider">Players</p>
            </div>
            <div className="px-4">
              <p className="text-3xl font-bold text-gold">{summary.competitions}</p>
              <p className="text-xs text-white/60 mt-1 uppercase tracking-wider">Competitions</p>
            </div>
          </div>
        </div>
      </section>

      {/* Active competitions */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-bold text-navy">Active Competitions</h2>
          <Link href="/competitions" className="text-sm text-cobalt hover:underline font-medium">
            All competitions
          </Link>
        </div>

        {competitions.length === 0 ? (
          <div className="border border-border bg-white px-8 py-14 text-center">
            <p className="text-navy font-semibold">Season 1 is getting ready.</p>
            <p className="text-muted text-sm mt-2">
              Competitions will be listed here once registration opens.
            </p>
            <Link
              href="/register"
              className="mt-6 inline-block bg-gold text-navy text-sm font-semibold px-5 py-2 hover:bg-gold/90 transition-colors"
            >
              Register your club now
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {competitions.map((c) => (
              <Link
                key={c.id}
                href={`/competitions/${c.slug}`}
                className="block border border-border bg-white p-6 hover:border-cobalt transition-colors group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-navy group-hover:text-cobalt transition-colors">
                      {c.name}
                    </p>
                    <p className="text-muted text-xs mt-1">{c.edition}</p>
                  </div>
                  <span
                    className={`shrink-0 text-xs font-medium px-2 py-1 border ${
                      c.status === "in_progress"
                        ? "border-success text-success"
                        : "border-gold text-gold"
                    }`}
                  >
                    {competitionStatusLabel[c.status]}
                  </span>
                </div>
                {c.description && (
                  <p className="text-muted text-sm mt-3 leading-relaxed line-clamp-2">
                    {c.description}
                  </p>
                )}
                <p className="text-xs text-cobalt font-medium mt-4 uppercase tracking-wider">
                  {c.format.replace("_", " ")}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Sponsor CTA */}
      <section className="bg-navy text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <p className="text-gold text-xs font-semibold uppercase tracking-[0.15em] mb-2">
              Partner with us
            </p>
            <h2 className="text-2xl font-bold">Sponsor The League</h2>
            <p className="text-white/50 text-sm mt-2 max-w-md">
              Reach university students across faculties. See our sponsorship tiers
              and audience numbers.
            </p>
          </div>
          <Link
            href="/sponsors"
            className="shrink-0 border border-gold text-gold text-sm font-semibold px-6 py-3 hover:bg-gold hover:text-navy transition-colors"
          >
            View Sponsorship Tiers
          </Link>
        </div>
      </section>
    </>
  );
}
