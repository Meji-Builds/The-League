import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Competition } from "@/types/database";

interface SiteSettings {
  livestream_url:   string | null;
  livestream_title: string;
}

interface Announcement {
  id: string;
  title: string;
  slug: string;
  image_url: string | null;
  published_at: string;
}

function youtubeEmbedId(url: string): string | null {
  const match = url.match(/(?:v=|youtu\.be\/|\/live\/|\/embed\/)([a-zA-Z0-9_-]{11})/);
  return match?.[1] ?? null;
}

async function getPageData() {
  try {
    const supabase = await createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    const [
      { data: competitions },
      { count: clubCount },
      { count: playerCount },
      { count: competitionCount },
      { data: siteSettings },
      { data: announcements },
    ] = await Promise.all([
      db.from("competitions")
        .select("*")
        .in("status", ["registration_open", "in_progress"])
        .order("created_at", { ascending: false })
        .limit(4),
      supabase.from("clubs").select("*", { count: "exact", head: true }).eq("status", "approved"),
      supabase.from("players").select("*", { count: "exact", head: true }),
      supabase.from("competitions").select("*", { count: "exact", head: true }),
      db.from("site_settings").select("livestream_url, livestream_title").eq("id", 1).single(),
      db.from("announcements")
        .select("id, title, slug, image_url, published_at")
        .order("published_at", { ascending: false })
        .limit(3),
    ]);

    return {
      competitions: (competitions ?? []) as Competition[],
      summary: { clubs: clubCount ?? 0, players: playerCount ?? 0, competitions: competitionCount ?? 0 },
      siteSettings: (siteSettings ?? null) as SiteSettings | null,
      announcements: (announcements ?? []) as Announcement[],
    };
  } catch {
    return {
      competitions: [],
      summary: { clubs: 0, players: 0, competitions: 0 },
      siteSettings: null,
      announcements: [],
    };
  }
}

const competitionStatusLabel: Record<string, string> = {
  upcoming:          "Upcoming",
  registration_open: "Registration Open",
  in_progress:       "In Progress",
  completed:         "Completed",
};

export default async function HomePage() {
  const { competitions, summary, siteSettings, announcements } = await getPageData();

  const streamEmbedId = siteSettings?.livestream_url
    ? youtubeEmbedId(siteSettings.livestream_url)
    : null;

  return (
    <>
      {/* Hero */}
      <section className="bg-navy text-white relative overflow-hidden">
        {/* Subtle geometric accent */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute -right-32 top-0 w-[500px] h-[500px] border border-white/5 rotate-12" />
          <div className="absolute -right-16 top-10 w-[500px] h-[500px] border border-white/5 rotate-12" />
          <div className="absolute right-40 -top-20 w-[300px] h-[300px] bg-cobalt/10 rotate-12 blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
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
              className="inline-block bg-gold text-navy font-semibold text-sm px-6 py-3 rounded hover:bg-gold/90 transition-colors text-center"
            >
              Register Your Club
            </Link>
            <Link
              href="/competitions"
              className="inline-block border border-white/20 text-white font-medium text-sm px-6 py-3 rounded hover:border-white/40 hover:bg-white/5 transition-colors text-center"
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

      {/* Livestream — only shown when a URL is configured */}
      {streamEmbedId && (
        <section className="bg-navy">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="flex items-center gap-3 mb-4">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-danger opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-danger" />
              </span>
              <p className="text-white font-bold text-sm uppercase tracking-widest">
                {siteSettings?.livestream_title ?? "Live Now"}
              </p>
            </div>
            <div className="relative w-full bg-black" style={{ paddingTop: "56.25%" }}>
              <iframe
                className="absolute inset-0 w-full h-full"
                src={`https://www.youtube.com/embed/${streamEmbedId}?autoplay=0`}
                title={siteSettings?.livestream_title ?? "Live stream"}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </section>
      )}

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
              className="mt-6 inline-block bg-gold text-navy text-sm font-semibold px-5 py-2 rounded hover:bg-gold/90 transition-colors"
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

      {/* Latest news */}
      {announcements.length > 0 && (
        <section className="bg-surface border-t border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold text-navy">Latest News</h2>
              <Link href="/news" className="text-sm text-cobalt hover:underline font-medium">
                All news
              </Link>
            </div>
            <div className="grid sm:grid-cols-3 gap-6">
              {announcements.map((post) => (
                <Link
                  key={post.id}
                  href={`/news/${post.slug}`}
                  className="block bg-white border border-border hover:border-cobalt transition-colors group"
                >
                  {post.image_url && (
                    <div className="relative w-full h-40 overflow-hidden bg-surface">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={post.image_url} alt={post.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="p-4">
                    <p className="text-xs text-muted mb-1">
                      {new Date(post.published_at).toLocaleDateString("en-GB", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </p>
                    <h3 className="font-semibold text-navy text-sm leading-snug group-hover:text-cobalt transition-colors">
                      {post.title}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

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
            className="shrink-0 border border-gold text-gold text-sm font-semibold px-6 py-3 rounded hover:bg-gold hover:text-navy transition-colors"
          >
            View Sponsorship Tiers
          </Link>
        </div>
      </section>
    </>
  );
}
