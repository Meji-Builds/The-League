import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Competition, GlobalSponsor } from "@/types/database";

// ─── Local interfaces ──────────────────────────────────────────────────────

interface SiteSettings {
  hero_title:    string | null;
  hero_subtitle: string | null;
}

interface LivestreamRow {
  id:    string;
  url:   string;
  title: string;
}

interface AnnouncementRow {
  id:           string;
  title:        string;
  slug:         string;
  image_url:    string | null;
  published_at: string;
}

interface ClubPostRow {
  id:           string;
  title:        string;
  image_url:    string | null;
  published_at: string;
  club:         { name: string } | null;
}

interface NewsItem {
  id:           string;
  title:        string;
  image_url:    string | null;
  published_at: string;
  href:         string;
  source:       string;
}

interface ClubRow {
  id:         string;
  name:       string;
  slug:       string;
  faculty:    string;
  department: string;
}

interface PlayerRow {
  id:        string;
  gamer_tag: string;
  position:  string | null;
  stats:     { matches_played: number; wins: number; losses: number };
  club:      { name: string; slug: string } | null;
}

interface FixtureRow {
  id:              string;
  stage:           string;
  status:          string;
  scheduled_at:    string | null;
  confirmed_score: { score_a: number; score_b: number } | null;
  club_a:          { id: string; name: string; slug: string } | null;
  club_b:          { id: string; name: string; slug: string } | null;
  competition:     { name: string; slug: string } | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────

const AVATAR_PALETTE = ["#5B72FF", "#B4FF00", "#10B981", "#EF4444", "#8B5CF6", "#F59E0B"];

function avatarColor(name: string): string {
  return AVATAR_PALETTE[name.charCodeAt(0) % AVATAR_PALETTE.length];
}

function nameInitials(name: string): string {
  return name.split(" ").map((w) => w[0] ?? "").join("").slice(0, 2).toUpperCase();
}

function youtubeEmbedId(url: string): string | null {
  const match = url.match(/(?:v=|youtu\.be\/|\/live\/|\/embed\/)([a-zA-Z0-9_-]{11})/);
  return match?.[1] ?? null;
}

const FORMAT_LABEL: Record<string, string> = {
  funnel_pyramid: "Funnel Pyramid",
  knockout:       "Knockout",
  group_stage:    "Group Stage",
  league:         "League",
};

const COMPETITION_STATUS_LABEL: Record<string, string> = {
  upcoming:          "Upcoming",
  registration_open: "Reg. Open",
  in_progress:       "In Progress",
  completed:         "Completed",
};

const statusPill: Record<string, string> = {
  scheduled: "bg-cobalt/15 text-cobalt",
  reported:  "bg-gold/15 text-gold",
  disputed:  "bg-danger/15 text-danger",
  confirmed: "bg-success/15 text-success",
};

const statusLabel: Record<string, string> = {
  scheduled: "Scheduled",
  reported:  "Reported",
  disputed:  "Disputed",
  confirmed: "FT",
};

// ─── Data fetching ────────────────────────────────────────────────────────

function settled<T>(result: PromiseSettledResult<{ data: T | null }>): T | null {
  return result.status === "fulfilled" ? result.value.data : null;
}

async function getPageData() {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const [
    rCompetitions,
    rSiteSettings,
    rAnnouncements,
    rFixtures,
    rTopClubs,
    rPlayers,
    rSponsors,
    rLivestreams,
    rClubPosts,
  ] = await Promise.allSettled([
    db.from("competitions")
      .select("*")
      .in("status", ["registration_open", "in_progress"])
      .order("created_at", { ascending: false })
      .limit(4),
    db.from("site_settings").select("*").eq("id", 1).single(),
    db.from("announcements")
      .select("id, title, slug, image_url, published_at")
      .order("published_at", { ascending: false })
      .limit(6),
    db.from("fixtures")
      .select("id, stage, status, scheduled_at, confirmed_score, club_a:clubs!club_a_id(id, name, slug), club_b:clubs!club_b_id(id, name, slug), competition:competitions(name, slug)")
      .order("scheduled_at", { ascending: false })
      .limit(6),
    db.from("clubs")
      .select("id, name, slug, faculty, department")
      .eq("status", "approved")
      .order("created_at", { ascending: true })
      .limit(5),
    db.from("players")
      .select("id, gamer_tag, position, stats, club:clubs(name, slug)")
      .limit(20),
    db.from("global_sponsors")
      .select("*")
      .order("display_order", { ascending: true }),
    db.from("livestreams")
      .select("id, url, title")
      .eq("is_active", true)
      .order("created_at", { ascending: true }),
    db.from("club_posts")
      .select("id, title, image_url, published_at, club:clubs(name)")
      .eq("status", "approved")
      .order("published_at", { ascending: false })
      .limit(10),
  ]);

  const players = settled<PlayerRow[]>(rPlayers as PromiseSettledResult<{ data: PlayerRow[] | null }>) ?? [];
  const topPlayers = [...players]
    .sort((a, b) => (b.stats?.wins ?? 0) - (a.stats?.wins ?? 0))
    .slice(0, 5);

  const announcements = (settled<AnnouncementRow[]>(rAnnouncements as PromiseSettledResult<{ data: AnnouncementRow[] | null }>) ?? []) as AnnouncementRow[];
  const clubPosts     = (settled<ClubPostRow[]>(rClubPosts as PromiseSettledResult<{ data: ClubPostRow[] | null }>) ?? []) as ClubPostRow[];

  const newsItems: NewsItem[] = [
    ...announcements.map((a) => ({
      id:           a.id,
      title:        a.title,
      image_url:    a.image_url,
      published_at: a.published_at,
      href:         `/news/${a.slug}`,
      source:       "News",
    })),
    ...clubPosts.map((p) => ({
      id:           p.id,
      title:        p.title,
      image_url:    p.image_url,
      published_at: p.published_at,
      href:         `/news/club/${p.id}`,
      source:       p.club?.name ?? "Club Update",
    })),
  ]
    .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime())
    .slice(0, 4);

  return {
    competitions: (settled<Competition[]>(rCompetitions as PromiseSettledResult<{ data: Competition[] | null }>) ?? []) as Competition[],
    siteSettings: (rSiteSettings.status === "fulfilled" ? rSiteSettings.value.data : null) as SiteSettings | null,
    newsItems,
    fixtures:     (settled<FixtureRow[]>(rFixtures as PromiseSettledResult<{ data: FixtureRow[] | null }>) ?? []) as FixtureRow[],
    topClubs:     (settled<ClubRow[]>(rTopClubs as PromiseSettledResult<{ data: ClubRow[] | null }>) ?? []) as ClubRow[],
    topPlayers,
    sponsors:     (settled<GlobalSponsor[]>(rSponsors as PromiseSettledResult<{ data: GlobalSponsor[] | null }>) ?? []) as GlobalSponsor[],
    livestreams:  (settled<LivestreamRow[]>(rLivestreams as PromiseSettledResult<{ data: LivestreamRow[] | null }>) ?? []) as LivestreamRow[],
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const {
    competitions, siteSettings, newsItems,
    fixtures, topClubs, topPlayers, sponsors, livestreams,
  } = await getPageData();

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="bg-navy text-white relative overflow-hidden min-h-[56vh] flex items-center">
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden="true"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.04) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-gradient-to-l from-cobalt/5 to-transparent pointer-events-none" aria-hidden="true" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32 w-full">
          <p className="text-cobalt text-xs font-semibold uppercase tracking-[0.3em] mb-5">
            University Esports
          </p>
          <h1 className="font-display text-6xl sm:text-7xl md:text-8xl font-bold leading-none tracking-tight uppercase max-w-4xl whitespace-pre-line">
            {siteSettings?.hero_title ?? "The League.\nWhere Champions\nAre Made."}
          </h1>
          <p className="mt-5 text-white/40 text-sm max-w-md leading-relaxed">
            {siteSettings?.hero_subtitle
              ? siteSettings.hero_subtitle
              : "University esports competitions — from department qualifiers to the championship final."}
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Link
              href="/register"
              className="inline-block bg-gold text-navy font-bold text-sm px-6 py-3 hover:brightness-110 transition-all text-center uppercase tracking-wider"
            >
              Register Your Club
            </Link>
            <Link
              href="/competitions"
              className="inline-block border border-white/12 text-white/70 text-sm px-6 py-3 hover:text-white hover:border-white/25 transition-colors text-center"
            >
              View Competitions
            </Link>
          </div>
        </div>
      </section>

      {/* ── Livestreams ──────────────────────────────────────────────── */}
      {livestreams.length > 0 && (
        <section className="bg-navy border-t border-rim">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="flex items-center gap-2.5 mb-5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-danger opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-danger" />
              </span>
              <p className="text-white text-xs font-semibold uppercase tracking-widest">Live Now</p>
            </div>
            <div className={`grid gap-6 ${livestreams.length > 1 ? "sm:grid-cols-2" : ""}`}>
              {livestreams.map((stream) => {
                const embedId = youtubeEmbedId(stream.url);
                return (
                  <div key={stream.id}>
                    {embedId ? (
                      <div className="relative w-full bg-black overflow-hidden" style={{ paddingTop: "56.25%" }}>
                        <iframe
                          className="absolute inset-0 w-full h-full"
                          src={`https://www.youtube.com/embed/${embedId}?autoplay=0`}
                          title={stream.title}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    ) : (
                      <a
                        href={stream.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block bg-card border border-rim px-5 py-4 text-sm text-cobalt hover:text-gold transition-colors"
                      >
                        {stream.url}
                      </a>
                    )}
                    {livestreams.length > 1 && (
                      <p className="text-dim text-xs mt-2 truncate">{stream.title}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── Active Competitions ───────────────────────────────────────── */}
      <section className="py-14 bg-panel border-t border-rim">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-2xl font-bold text-white uppercase tracking-tight">
              Active Competitions
            </h2>
            <Link href="/competitions" className="text-xs text-dim hover:text-white transition-colors">
              View all
            </Link>
          </div>

          {competitions.length === 0 ? (
            <div className="border border-rim bg-card px-8 py-12 text-center">
              <p className="text-white font-semibold text-sm">Season 1 is getting ready.</p>
              <p className="text-dim text-xs mt-2">Competitions will appear here once registration opens.</p>
              <Link
                href="/register"
                className="mt-5 inline-block bg-gold text-navy text-xs font-bold px-5 py-2.5 hover:brightness-110 transition-all uppercase tracking-wide"
              >
                Register your club now
              </Link>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {competitions.map((c) => (
                <Link
                  key={c.id}
                  href={`/competitions/${c.slug}`}
                  className="bg-card border border-rim hover:bg-white/[0.03] transition-colors group p-5 block"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-semibold text-white text-sm leading-snug group-hover:text-gold transition-colors">
                        {c.name}
                      </p>
                      <p className="text-dim text-xs mt-1">{c.edition}</p>
                    </div>
                    <span className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      c.status === "in_progress"
                        ? "bg-success/15 text-success"
                        : "bg-gold/15 text-gold"
                    }`}>
                      {COMPETITION_STATUS_LABEL[c.status]}
                    </span>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-rim pt-3">
                    <span className="text-xs text-dim">
                      {FORMAT_LABEL[c.format] ?? c.format}
                    </span>
                    {c.entry_fee > 0 && (
                      <span className="text-xs text-white/60">
                        {"₦"}{c.entry_fee.toLocaleString()} entry
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Recent Fixtures ───────────────────────────────────────────── */}
      {fixtures.length > 0 && (
        <section className="py-14 bg-navy border-t border-rim">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-2xl font-bold text-white uppercase tracking-tight">
                Recent Fixtures
              </h2>
              <Link href="/fixtures" className="text-xs text-dim hover:text-white transition-colors">
                All fixtures
              </Link>
            </div>

            <div className="bg-card border border-rim divide-y divide-rim">
              {fixtures.map((f) => (
                <Link
                  key={f.id}
                  href={`/fixtures/${f.id}`}
                  className="flex items-center gap-3 sm:gap-4 px-4 py-3 hover:bg-white/[0.035] transition-colors group"
                >
                  {/* Club A side */}
                  <div className="flex items-center gap-2 flex-1 justify-end min-w-0">
                    <p className="text-[13px] font-medium text-white group-hover:text-gold transition-colors truncate text-right">
                      {f.club_a?.name ?? "TBA"}
                    </p>
                    <div
                      className="w-7 h-7 shrink-0 flex items-center justify-center text-navy text-[9px] font-bold"
                      style={{ backgroundColor: avatarColor(f.club_a?.name ?? "A") }}
                    >
                      {nameInitials(f.club_a?.name ?? "A")}
                    </div>
                  </div>

                  {/* Score / VS */}
                  <div className="w-24 text-center shrink-0">
                    {f.confirmed_score ? (
                      <span className="font-display text-base font-bold text-white tabular-nums">
                        {f.confirmed_score.score_a}&nbsp;&ndash;&nbsp;{f.confirmed_score.score_b}
                      </span>
                    ) : (
                      <span className="text-xs text-dim font-medium tracking-widest">vs</span>
                    )}
                  </div>

                  {/* Club B side */}
                  <div className="flex items-center gap-2 flex-1 justify-start min-w-0">
                    <div
                      className="w-7 h-7 shrink-0 flex items-center justify-center text-navy text-[9px] font-bold"
                      style={{ backgroundColor: avatarColor(f.club_b?.name ?? "B") }}
                    >
                      {nameInitials(f.club_b?.name ?? "B")}
                    </div>
                    <p className="text-[13px] font-medium text-white truncate">
                      {f.club_b?.name ?? "TBA"}
                    </p>
                  </div>

                  {/* Meta */}
                  <div className="hidden sm:flex items-center gap-3 shrink-0">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 ${statusPill[f.status] ?? "bg-cobalt/15 text-cobalt"}`}>
                      {statusLabel[f.status]}
                    </span>
                    {f.scheduled_at && (
                      <span className="text-[11px] text-dim w-14 text-right">
                        {new Date(f.scheduled_at).toLocaleDateString("en-GB", {
                          day: "numeric", month: "short",
                        })}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Top Clubs + Season Leaders ────────────────────────────────── */}
      {(topClubs.length > 0 || topPlayers.length > 0) && (
        <section className="py-14 bg-panel border-t border-rim">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-10 md:gap-12">

              {topClubs.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="font-display text-2xl font-bold text-white uppercase tracking-tight">Clubs</h2>
                    <Link href="/clubs" className="text-xs text-dim hover:text-white transition-colors">
                      All clubs
                    </Link>
                  </div>
                  <div className="divide-y divide-rim border border-rim">
                    {topClubs.map((club, i) => (
                      <Link
                        key={club.id}
                        href={`/clubs/${club.slug}`}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors group"
                      >
                        <span className="text-dim text-xs w-4 text-right shrink-0">{i + 1}</span>
                        <div
                          className="w-7 h-7 shrink-0 flex items-center justify-center text-navy text-[9px] font-bold"
                          style={{ backgroundColor: avatarColor(club.name) }}
                        >
                          {nameInitials(club.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-white group-hover:text-gold transition-colors truncate">
                            {club.name}
                          </p>
                          <p className="text-xs text-dim truncate">{club.faculty}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {topPlayers.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="font-display text-2xl font-bold text-white uppercase tracking-tight">Season Leaders</h2>
                    <Link href="/players" className="text-xs text-dim hover:text-white transition-colors">
                      All players
                    </Link>
                  </div>
                  <div className="divide-y divide-rim border border-rim">
                    {topPlayers.map((player, i) => (
                      <div key={player.id} className="flex items-center gap-3 px-4 py-3">
                        <span className="text-dim text-xs w-4 text-right shrink-0">{i + 1}</span>
                        <div
                          className="w-7 h-7 shrink-0 flex items-center justify-center text-navy text-[9px] font-bold"
                          style={{ backgroundColor: avatarColor(player.gamer_tag) }}
                        >
                          {nameInitials(player.gamer_tag)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-white truncate">{player.gamer_tag}</p>
                          <p className="text-xs text-dim truncate">
                            {player.club?.name ?? "—"}
                            {player.position ? ` · ${player.position}` : ""}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-display text-lg font-bold text-gold leading-none">{player.stats.wins}</p>
                          <p className="text-[10px] text-dim">wins</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── Latest News ───────────────────────────────────────────────── */}
      {newsItems.length > 0 && (
        <section className="py-14 bg-navy border-t border-rim">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-2xl font-bold text-white uppercase tracking-tight">
                Latest News
              </h2>
              <Link href="/news" className="text-xs text-dim hover:text-white transition-colors">
                All news
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 gap-px bg-rim border border-rim">
              {newsItems.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="flex items-start gap-4 bg-card hover:bg-white/[0.035] transition-colors group p-4"
                >
                  {item.image_url ? (
                    <div className="w-20 h-16 shrink-0 overflow-hidden bg-panel">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.image_url}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ) : (
                    <div className="w-20 h-16 shrink-0 bg-panel border border-rim flex items-center justify-center">
                      <span className="text-dim text-[9px] font-semibold uppercase tracking-wider">No image</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0 py-0.5">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[10px] font-semibold text-gold">{item.source}</span>
                      <span className="text-dim text-[10px]">
                        {new Date(item.published_at).toLocaleDateString("en-GB", {
                          day: "numeric", month: "short",
                        })}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-white leading-snug group-hover:text-gold transition-colors line-clamp-2">
                      {item.title}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Sponsors ─────────────────────────────────────────────────── */}
      {sponsors.length > 0 && (
        <section className="py-10 bg-panel border-t border-rim">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-center text-dim text-[10px] uppercase tracking-[0.3em] mb-7">Partners &amp; Sponsors</p>
            <div className="flex flex-wrap items-center justify-center gap-10">
              {sponsors.map((s) =>
                s.website_url ? (
                  <a
                    key={s.id}
                    href={s.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="opacity-30 hover:opacity-60 transition-opacity"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={s.logo_url} alt={s.name} className="h-7 object-contain brightness-0 invert" />
                  </a>
                ) : (
                  <div key={s.id} className="opacity-30">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={s.logo_url} alt={s.name} className="h-7 object-contain brightness-0 invert" />
                  </div>
                )
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA ──────────────────────────────────────────────────────── */}
      <section className="bg-navy border-t border-rim relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden="true"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.04) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <p className="text-cobalt text-xs font-semibold uppercase tracking-[0.3em] mb-4">Join The League</p>
          <h2 className="font-display text-5xl sm:text-6xl font-bold text-white uppercase tracking-tight max-w-2xl leading-none">
            Represent Your University
          </h2>
          <p className="text-white/35 mt-4 max-w-md text-sm leading-relaxed">
            Register your club, compete for your department and faculty, and
            represent your university at the championship level.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Link
              href="/register"
              className="inline-block bg-gold text-navy font-bold text-sm px-6 py-3 hover:brightness-110 transition-all text-center uppercase tracking-wider"
            >
              Register Your Club
            </Link>
            <Link
              href="/sponsors"
              className="inline-block border border-white/12 text-white/60 text-sm px-6 py-3 hover:text-white hover:border-white/25 transition-colors text-center"
            >
              Sponsor The League
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
