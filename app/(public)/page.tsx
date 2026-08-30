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

const FIXTURE_STATUS_LABEL: Record<string, string> = {
  scheduled: "Scheduled",
  reported:  "Reported",
  confirmed: "Confirmed",
  disputed:  "Disputed",
};

// ─── Icons ────────────────────────────────────────────────────────────────

function TrophyIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M19 5h-2V3H7v2H5C3.9 5 3 5.9 3 7v1c0 2.55 1.92 4.63 4.39 4.94A5.01 5.01 0 0 0 11 15.9V18H9v2h6v-2h-2v-2.1a5.01 5.01 0 0 0 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.86 10.4 5 9.3 5 8zm14 0c0 1.3-.86 2.4-2 2.82V7h2v1z" />
    </svg>
  );
}

// ─── Data fetching ────────────────────────────────────────────────────────

function settled<T>(result: PromiseSettledResult<{ data: T | null }>): T | null {
  return result.status === "fulfilled" ? result.value.data : null;
}

function settledCount(result: PromiseSettledResult<{ count: number | null }>): number {
  return result.status === "fulfilled" ? (result.value.count ?? 0) : 0;
}

async function getPageData() {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const [
    rCompetitions,
    rClubCount,
    rPlayerCount,
    rCompetitionCount,
    rFixtureCount,
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
    supabase.from("clubs").select("*", { count: "exact", head: true }).eq("status", "approved"),
    supabase.from("players").select("*", { count: "exact", head: true }),
    supabase.from("competitions").select("*", { count: "exact", head: true }),
    supabase.from("fixtures").select("*", { count: "exact", head: true }),
    db.from("site_settings").select("*").eq("id", 1).single(),
    db.from("announcements")
      .select("id, title, slug, image_url, published_at")
      .order("published_at", { ascending: false })
      .limit(4),
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
    summary: {
      clubs:        settledCount(rClubCount        as PromiseSettledResult<{ count: number | null }>),
      players:      settledCount(rPlayerCount       as PromiseSettledResult<{ count: number | null }>),
      competitions: settledCount(rCompetitionCount  as PromiseSettledResult<{ count: number | null }>),
      fixtures:     settledCount(rFixtureCount      as PromiseSettledResult<{ count: number | null }>),
    },
    siteSettings: (rSiteSettings.status === "fulfilled" ? rSiteSettings.value.data : null) as SiteSettings | null,
    newsItems,
    fixtures:     (settled<FixtureRow[]>(rFixtures as PromiseSettledResult<{ data: FixtureRow[] | null }>) ?? []) as FixtureRow[],
    topClubs:     (settled<ClubRow[]>(rTopClubs as PromiseSettledResult<{ data: ClubRow[] | null }>) ?? []) as ClubRow[],
    topPlayers,
    sponsors:     (settled<GlobalSponsor[]>(rSponsors as PromiseSettledResult<{ data: GlobalSponsor[] | null }>) ?? []) as GlobalSponsor[],
    livestreams:  (settled<LivestreamRow[]>(rLivestreams as PromiseSettledResult<{ data: LivestreamRow[] | null }>) ?? []) as LivestreamRow[],
  };
}

// ─── Shared UI ────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-2">
      <div className="w-5 h-0.5 bg-gold shrink-0" />
      <p className="text-gold text-xs font-bold uppercase tracking-[0.25em]">{children}</p>
    </div>
  );
}

const gridBg: React.CSSProperties = {
  backgroundImage:
    "linear-gradient(rgba(255,255,255,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.06) 1px, transparent 1px)",
  backgroundSize: "64px 64px",
};

// ─── Page ─────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const {
    competitions, summary, siteSettings, newsItems,
    fixtures, topClubs, topPlayers, sponsors, livestreams,
  } = await getPageData();

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="bg-navy text-white relative overflow-hidden min-h-[64vh] flex items-center">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute inset-0" style={gridBg} />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-36 w-full">
          <SectionLabel>University Esports</SectionLabel>
          <h1 className="font-display text-6xl sm:text-7xl md:text-8xl font-bold leading-none tracking-tight uppercase mt-4 max-w-4xl whitespace-pre-line">
            {siteSettings?.hero_title ?? "The League.\nWhere Champions\nAre Made."}
          </h1>
          <p className="mt-6 text-white/45 text-base max-w-lg leading-relaxed">
            {siteSettings?.hero_subtitle
              ? siteSettings.hero_subtitle
              : "University esports competitions — from department qualifiers to the championship final."}
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-3">
            <Link
              href="/register"
              className="inline-block bg-gold text-navy font-bold text-sm px-7 py-3.5 rounded hover:brightness-110 transition-all text-center uppercase tracking-wider"
            >
              Register Your Club
            </Link>
            <Link
              href="/competitions"
              className="inline-block border border-white/15 text-white font-medium text-sm px-7 py-3.5 rounded hover:border-white/30 hover:bg-white/5 transition-colors text-center"
            >
              View Competitions
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats ────────────────────────────────────────────────────── */}
      <section className="bg-panel border-t border-rim">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 sm:gap-0 sm:divide-x sm:divide-rim">
            {[
              { value: summary.clubs,        label: "Registered Clubs" },
              { value: summary.players,      label: "Active Players" },
              { value: summary.competitions, label: "Competitions" },
              { value: summary.fixtures,     label: "Fixtures Played" },
            ].map(({ value, label }) => (
              <div key={label} className="sm:px-8 first:pl-0 last:pr-0">
                <p className="font-display text-5xl font-bold text-gold leading-none">{value}</p>
                <p className="text-dim text-xs uppercase tracking-wider mt-2">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Livestreams ──────────────────────────────────────────────── */}
      {livestreams.length > 0 && (
        <section className="bg-navy border-t border-rim">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex items-center gap-3 mb-6">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-danger opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-danger" />
              </span>
              <p className="text-white font-bold text-sm uppercase tracking-widest">Live Now</p>
            </div>
            <div className={`grid gap-6 ${livestreams.length > 1 ? "sm:grid-cols-2" : ""}`}>
              {livestreams.map((stream) => {
                const embedId = youtubeEmbedId(stream.url);
                return (
                  <div key={stream.id}>
                    {embedId ? (
                      <div className="relative w-full bg-black rounded overflow-hidden" style={{ paddingTop: "56.25%" }}>
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
                        className="block bg-card border border-rim px-5 py-4 text-sm text-cobalt hover:text-gold transition-colors rounded"
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
      <section className="py-16 bg-panel border-t border-rim">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <SectionLabel>Competitions</SectionLabel>
              <h2 className="font-display text-4xl font-bold text-white uppercase tracking-tight">
                Active Competitions
              </h2>
            </div>
            <Link href="/competitions" className="text-sm text-dim hover:text-white transition-colors font-medium">
              All competitions
            </Link>
          </div>

          {competitions.length === 0 ? (
            <div className="border border-rim bg-card px-8 py-14 text-center rounded">
              <p className="text-white font-semibold">Season 1 is getting ready.</p>
              <p className="text-dim text-sm mt-2">
                Competitions will appear here once registration opens.
              </p>
              <Link
                href="/register"
                className="mt-6 inline-block bg-gold text-navy text-sm font-bold px-5 py-2.5 rounded hover:brightness-110 transition-all uppercase tracking-wide"
              >
                Register your club now
              </Link>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {competitions.map((c) => (
                <Link
                  key={c.id}
                  href={`/competitions/${c.slug}`}
                  className="bg-card border border-rim hover:border-cobalt/50 transition-all group p-5 block rounded"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 bg-gold/10 flex items-center justify-center shrink-0 mt-0.5 rounded">
                        <TrophyIcon className="w-4 h-4 text-gold" />
                      </div>
                      <div>
                        <p className="font-semibold text-white group-hover:text-gold transition-colors leading-snug">
                          {c.name}
                        </p>
                        <p className="text-dim text-xs mt-0.5">{c.edition}</p>
                      </div>
                    </div>
                    <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${
                      c.status === "in_progress"
                        ? "bg-success/10 text-success"
                        : "bg-gold/10 text-gold"
                    }`}>
                      {COMPETITION_STATUS_LABEL[c.status]}
                    </span>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-rim pt-4">
                    <span className="text-xs text-dim font-medium uppercase tracking-wider">
                      {FORMAT_LABEL[c.format] ?? c.format}
                    </span>
                    {c.entry_fee > 0 && (
                      <span className="text-xs text-white font-semibold">
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
        <section className="py-16 bg-navy border-t border-rim">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-8">
              <div>
                <SectionLabel>Schedule</SectionLabel>
                <h2 className="font-display text-4xl font-bold text-white uppercase tracking-tight">
                  Recent Fixtures
                </h2>
              </div>
              <Link href="/fixtures" className="text-sm text-dim hover:text-white transition-colors font-medium">
                All fixtures
              </Link>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              {fixtures.map((f) => (
                <div key={f.id} className="bg-card border border-rim p-4 rounded">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-dim truncate mr-2">
                      {f.competition?.name ?? ""}
                    </span>
                    <span className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      f.status === "confirmed" ? "bg-success/10 text-success" :
                      f.status === "disputed"  ? "bg-danger/10 text-danger"   :
                      f.status === "reported"  ? "bg-gold/10 text-gold"       :
                      "bg-cobalt/10 text-cobalt"
                    }`}>
                      {FIXTURE_STATUS_LABEL[f.status]}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
                      <div
                        className="w-10 h-10 rounded flex items-center justify-center text-navy text-xs font-bold shrink-0"
                        style={{ backgroundColor: avatarColor(f.club_a?.name ?? "A") }}
                      >
                        {nameInitials(f.club_a?.name ?? "A")}
                      </div>
                      <p className="text-xs font-semibold text-white text-center leading-tight line-clamp-2">
                        {f.club_a?.name ?? "TBA"}
                      </p>
                    </div>
                    <div className="text-center px-1 shrink-0">
                      {f.confirmed_score ? (
                        <p className="font-display text-2xl font-bold text-white tabular-nums leading-none">
                          {f.confirmed_score.score_a}&nbsp;&ndash;&nbsp;{f.confirmed_score.score_b}
                        </p>
                      ) : (
                        <p className="text-xs font-bold text-dim tracking-widest">VS</p>
                      )}
                      {f.scheduled_at && (
                        <p className="text-[10px] text-dim mt-1">
                          {new Date(f.scheduled_at).toLocaleDateString("en-GB", {
                            day: "numeric", month: "short",
                          })}
                        </p>
                      )}
                    </div>
                    <div className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
                      <div
                        className="w-10 h-10 rounded flex items-center justify-center text-navy text-xs font-bold shrink-0"
                        style={{ backgroundColor: avatarColor(f.club_b?.name ?? "B") }}
                      >
                        {nameInitials(f.club_b?.name ?? "B")}
                      </div>
                      <p className="text-xs font-semibold text-white text-center leading-tight line-clamp-2">
                        {f.club_b?.name ?? "TBA"}
                      </p>
                    </div>
                  </div>
                  {f.stage && (
                    <p className="text-[10px] text-dim text-center mt-2 uppercase tracking-wider border-t border-rim pt-2">
                      {f.stage}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Top Clubs + Season Leaders ────────────────────────────────── */}
      {(topClubs.length > 0 || topPlayers.length > 0) && (
        <section className="py-16 bg-panel border-t border-rim">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-12 md:gap-12">

              {topClubs.length > 0 && (
                <div>
                  <SectionLabel>Rankings</SectionLabel>
                  <div className="flex items-end justify-between mb-5">
                    <h2 className="font-display text-4xl font-bold text-white uppercase tracking-tight">Top Clubs</h2>
                    <Link href="/clubs" className="text-sm text-dim hover:text-white transition-colors font-medium">
                      All clubs
                    </Link>
                  </div>
                  <div className="divide-y divide-rim bg-card border border-rim rounded overflow-hidden">
                    {topClubs.map((club, i) => (
                      <Link
                        key={club.id}
                        href={`/clubs/${club.slug}`}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors group"
                      >
                        <span className="font-display text-base font-bold text-gold w-5 text-right shrink-0">
                          {i + 1}
                        </span>
                        <div
                          className="w-8 h-8 rounded flex items-center justify-center shrink-0 text-navy text-xs font-bold"
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
                  <SectionLabel>Season</SectionLabel>
                  <div className="flex items-end justify-between mb-5">
                    <h2 className="font-display text-4xl font-bold text-white uppercase tracking-tight">Season Leaders</h2>
                    <Link href="/players" className="text-sm text-dim hover:text-white transition-colors font-medium">
                      All players
                    </Link>
                  </div>
                  <div className="divide-y divide-rim bg-card border border-rim rounded overflow-hidden">
                    {topPlayers.map((player, i) => (
                      <div key={player.id} className="flex items-center gap-3 px-4 py-3">
                        <span className="font-display text-base font-bold text-gold w-5 text-right shrink-0">
                          {i + 1}
                        </span>
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-navy text-xs font-bold"
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
                          <p className="font-display text-xl font-bold text-gold">{player.stats.wins}</p>
                          <p className="text-xs text-dim">wins</p>
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
        <section className="py-16 bg-navy border-t border-rim">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-8">
              <div>
                <SectionLabel>Updates</SectionLabel>
                <h2 className="font-display text-4xl font-bold text-white uppercase tracking-tight">
                  Latest News
                </h2>
              </div>
              <Link href="/news" className="text-sm text-dim hover:text-white transition-colors font-medium">
                All news
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {newsItems.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="flex items-start gap-4 bg-card border border-rim hover:border-cobalt/40 transition-all group p-4 rounded"
                >
                  {item.image_url ? (
                    <div className="w-20 h-16 shrink-0 overflow-hidden rounded bg-panel">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.image_url}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-20 h-16 shrink-0 bg-gold/5 border border-rim flex items-center justify-center rounded">
                      <span className="text-gold text-[9px] font-bold uppercase tracking-wider">News</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0 py-0.5">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[10px] font-bold text-gold uppercase tracking-wider">{item.source}</span>
                      <span className="text-dim text-[10px]">
                        {new Date(item.published_at).toLocaleDateString("en-GB", {
                          day: "numeric", month: "short", year: "numeric",
                        })}
                      </span>
                    </div>
                    <h3 className="font-semibold text-white text-sm leading-snug group-hover:text-gold transition-colors line-clamp-2">
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
        <section className="py-12 bg-panel border-t border-rim">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-center text-dim text-xs uppercase tracking-[0.25em] mb-8">Our Sponsors</p>
            <div className="flex flex-wrap items-center justify-center gap-10">
              {sponsors.map((s) =>
                s.website_url ? (
                  <a
                    key={s.id}
                    href={s.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="opacity-35 hover:opacity-70 transition-opacity"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={s.logo_url} alt={s.name} className="h-8 object-contain brightness-0 invert" />
                  </a>
                ) : (
                  <div key={s.id} className="opacity-35">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={s.logo_url} alt={s.name} className="h-8 object-contain brightness-0 invert" />
                  </div>
                )
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA ──────────────────────────────────────────────────────── */}
      <section className="bg-navy border-t border-rim relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute inset-0" style={gridBg} />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <SectionLabel>Join The League</SectionLabel>
          <h2 className="font-display text-5xl sm:text-6xl font-bold text-white uppercase tracking-tight mt-4 max-w-2xl leading-none">
            Represent Your University
          </h2>
          <p className="text-white/40 mt-5 max-w-md text-sm leading-relaxed">
            Register your club, compete for your department and faculty, and
            represent your university at the championship level.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-3">
            <Link
              href="/register"
              className="inline-block bg-gold text-navy font-bold text-sm px-7 py-3.5 rounded hover:brightness-110 transition-all text-center uppercase tracking-wider"
            >
              Register Your Club
            </Link>
            <Link
              href="/sponsors"
              className="inline-block border border-white/15 text-white font-medium text-sm px-7 py-3.5 rounded hover:border-white/30 hover:bg-white/5 transition-colors text-center"
            >
              Sponsor The League
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
