import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Competition, GlobalSponsor } from "@/types/database";

// ─── Local interfaces ──────────────────────────────────────────────────────

interface SiteSettings {
  site_name:               string | null;
  current_season:          string | null;
  hero_title:              string | null;
  hero_subtitle:           string | null;
  hero_bg_image_url:       string | null;
  about_text:              string | null;
  home_cta_eyebrow:        string | null;
  home_cta_headline:       string | null;
  home_cta_description:    string | null;
  home_cta_primary_btn:    string | null;
  home_cta_secondary_link: string | null;
  empty_competitions_heading: string | null;
  empty_competitions_text:    string | null;
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
  id:          string;
  name:        string;
  slug:        string;
  faculty:     string;
  department:  string;
  logo_url:    string | null;
  logo_status: string | null;
}

interface PlayerRow {
  id:                     string;
  gamer_tag:              string;
  position:               string | null;
  stats:                  { matches_played: number; wins: number; losses: number };
  club:                   { name: string; slug: string } | null;
  profile_picture_url:    string | null;
  profile_picture_status: string | null;
}

interface FixtureRow {
  id:              string;
  stage:           string;
  status:          string;
  scheduled_at:    string | null;
  confirmed_score: { score_a: number; score_b: number } | null;
  club_a:          { id: string; name: string; slug: string; logo_url: string | null; logo_status: string | null } | null;
  club_b:          { id: string; name: string; slug: string; logo_url: string | null; logo_status: string | null } | null;
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

const STATUS_DOT: Record<string, string> = {
  scheduled: "bg-cobalt",
  reported:  "bg-gold",
  disputed:  "bg-danger",
  confirmed: "bg-success",
};

const statusLabel: Record<string, string> = {
  scheduled: "Upcoming",
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
      .select("id, stage, status, scheduled_at, confirmed_score, club_a:clubs!club_a_id(id, name, slug, logo_url, logo_status), club_b:clubs!club_b_id(id, name, slug, logo_url, logo_status), competition:competitions(name, slug)")
      .order("scheduled_at", { ascending: false })
      .limit(6),
    db.from("clubs")
      .select("id, name, slug, faculty, department, logo_url, logo_status")
      .eq("status", "approved")
      .order("created_at", { ascending: true })
      .limit(5),
    db.from("players")
      .select("id, gamer_tag, position, stats, profile_picture_url, profile_picture_status, club:clubs(name, slug)")
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

  const heroBg       = siteSettings?.hero_bg_image_url;
  const heroTitle    = siteSettings?.hero_title ?? "The League";
  const heroSub      = siteSettings?.hero_subtitle ?? "University esports competitions — from department qualifiers to the championship final.";
  const currentSeason = siteSettings?.current_season ?? "Season 2026";
  const siteName     = siteSettings?.site_name ?? "The League";
  const ctaEyebrow   = siteSettings?.home_cta_eyebrow ?? "Join The League";
  const ctaHeadline  = siteSettings?.home_cta_headline ?? "Represent Your University";
  const ctaDesc      = siteSettings?.home_cta_description ?? "Register your club, compete for your department and faculty, and represent your university at the championship level.";
  const ctaPrimary   = siteSettings?.home_cta_primary_btn ?? "Register Your Club";
  const ctaSecondary = siteSettings?.home_cta_secondary_link ?? "Sponsor The League";
  const emptyCompsHeading = siteSettings?.empty_competitions_heading ?? "Season 1 is getting ready.";
  const emptyCompsText    = siteSettings?.empty_competitions_text ?? "Competitions will appear here once registration opens.";

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative min-h-[88vh] flex flex-col justify-end bg-navy overflow-hidden">
        {/* Ambient light blobs */}
        {!heroBg && (
          <>
            <div className="absolute top-0 right-0 w-[55%] h-[65%] bg-cobalt/[0.04] blur-[130px] pointer-events-none" />
            <div className="absolute bottom-1/4 left-[-10%] w-[45%] h-[45%] bg-gold/[0.025] blur-[110px] pointer-events-none" />
          </>
        )}

        {/* Background image */}
        {heroBg && (
          <>
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${heroBg})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/70 to-navy/20" />
          </>
        )}

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 pt-32 w-full">
          <p className="text-[11px] font-bold uppercase tracking-[0.4em] text-white/60 mb-10">
            {siteName} &nbsp;&middot;&nbsp; {currentSeason}
          </p>

          <h1
            className="font-display font-black uppercase leading-[0.85] text-white"
            style={{ fontSize: "clamp(4rem, 13vw, 11.5rem)" }}
          >
            {heroTitle}
          </h1>

          <div className="mt-8 flex flex-col sm:flex-row sm:items-end justify-between gap-8 max-w-5xl">
            <p className="text-white/45 text-[15px] leading-relaxed max-w-sm">
              {heroSub}
            </p>
            <div className="flex items-center gap-5 shrink-0">
              <Link
                href="/register"
                className="text-[11px] font-black uppercase tracking-[0.15em] bg-gold text-navy px-7 py-3.5 rounded hover:brightness-105 transition-all"
              >
                Register Club
              </Link>
              <Link
                href="/competitions"
                className="text-white/45 text-sm hover:text-white transition-colors flex items-center gap-2 group"
              >
                View Season
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="group-hover:translate-x-0.5 transition-transform">
                  <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Livestreams ──────────────────────────────────────────────── */}
      {livestreams.length > 0 && (
        <section className="bg-navy border-t border-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex items-center gap-3 mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-danger opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-danger" />
              </span>
              <p className="text-[10px] font-bold uppercase tracking-[0.45em] text-white/70">Live Now</p>
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
                        className="flex items-center gap-3 bg-card border border-white/8 px-5 py-4 text-sm text-cobalt hover:text-gold hover:border-white/12 transition-colors"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" strokeLinecap="round" strokeLinejoin="round" /></svg>
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
      <section className="py-20 bg-panel border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.5em] text-dim mb-3">{currentSeason}</p>
              <h2 className="font-display font-black text-[2.5rem] text-white uppercase leading-none">
                Active Competitions
              </h2>
            </div>
            <Link href="/competitions" className="text-xs text-white/35 hover:text-white transition-colors pb-1">
              View all
            </Link>
          </div>

          {competitions.length === 0 ? (
            <div className="border border-white/8 bg-card px-8 py-14 text-center">
              <p className="text-white font-semibold">{emptyCompsHeading}</p>
              <p className="text-dim text-sm mt-2">{emptyCompsText}</p>
              <Link
                href="/register"
                className="mt-6 inline-block text-[11px] font-black uppercase tracking-[0.15em] bg-gold text-navy px-6 py-3 rounded hover:brightness-105 transition-all"
              >
                Register your club
              </Link>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-px bg-white/5 border border-white/5">
              {competitions.map((c) => (
                <Link
                  key={c.id}
                  href={`/competitions/${c.slug}`}
                  className="bg-card hover:bg-white/[0.025] transition-colors group p-6 block relative"
                >
                  {/* status accent */}
                  <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${
                    c.status === "in_progress" ? "bg-success" : "bg-gold/60"
                  }`} />
                  <div className="pl-4">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <p className="font-display font-black text-xl text-white group-hover:text-gold transition-colors leading-tight uppercase">
                        {c.name}
                      </p>
                      <span className={`shrink-0 text-[9px] font-bold uppercase tracking-[0.15em] px-2.5 py-1 ${
                        c.status === "in_progress"
                          ? "bg-success/10 text-success"
                          : "bg-gold/10 text-gold"
                      }`}>
                        {COMPETITION_STATUS_LABEL[c.status]}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-dim">{c.edition}</span>
                      <span className="text-white/10">·</span>
                      <span className="text-xs text-dim">{FORMAT_LABEL[c.format] ?? c.format}</span>
                      {c.entry_fee > 0 && (
                        <>
                          <span className="text-white/10">·</span>
                          <span className="text-xs text-white/40">{"₦"}{c.entry_fee.toLocaleString()}</span>
                        </>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Recent Fixtures ───────────────────────────────────────────── */}
      {fixtures.length > 0 && (
        <section className="py-20 bg-navy border-t border-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.5em] text-dim mb-3">Results &amp; Upcoming</p>
                <h2 className="font-display font-black text-[2.5rem] text-white uppercase leading-none">
                  Fixtures
                </h2>
              </div>
              <Link href="/fixtures" className="text-xs text-white/35 hover:text-white transition-colors pb-1">
                All fixtures
              </Link>
            </div>

            <div className="border border-white/6 divide-y divide-white/5">
              {fixtures.map((f) => (
                <Link
                  key={f.id}
                  href={`/fixtures/${f.id}`}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.03] transition-colors group"
                >
                  {/* Club A */}
                  <div className="flex items-center gap-2.5 flex-1 justify-end min-w-0">
                    <p className="text-[13px] font-medium text-white/80 group-hover:text-white transition-colors truncate text-right">
                      {f.club_a?.name ?? "TBA"}
                    </p>
                    {f.club_a?.logo_status === "approved" && f.club_a?.logo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={f.club_a.logo_url} alt={f.club_a.name} className="w-9 h-9 shrink-0 object-contain" />
                    ) : (
                      <div
                        className="w-9 h-9 shrink-0 flex items-center justify-center text-navy text-[10px] font-black"
                        style={{ backgroundColor: avatarColor(f.club_a?.name ?? "A") }}
                      >
                        {nameInitials(f.club_a?.name ?? "A")}
                      </div>
                    )}
                  </div>

                  {/* Score */}
                  <div className="w-28 text-center shrink-0">
                    {f.confirmed_score ? (
                      <span className="font-display font-black text-xl text-gold tabular-nums leading-none">
                        {f.confirmed_score.score_a}&nbsp;&ndash;&nbsp;{f.confirmed_score.score_b}
                      </span>
                    ) : (
                      <span className="text-[11px] text-white/20 font-bold tracking-[0.3em]">vs</span>
                    )}
                  </div>

                  {/* Club B */}
                  <div className="flex items-center gap-2.5 flex-1 justify-start min-w-0">
                    {f.club_b?.logo_status === "approved" && f.club_b?.logo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={f.club_b.logo_url} alt={f.club_b.name} className="w-9 h-9 shrink-0 object-contain" />
                    ) : (
                      <div
                        className="w-9 h-9 shrink-0 flex items-center justify-center text-navy text-[10px] font-black"
                        style={{ backgroundColor: avatarColor(f.club_b?.name ?? "B") }}
                      >
                        {nameInitials(f.club_b?.name ?? "B")}
                      </div>
                    )}
                    <p className="text-[13px] font-medium text-white/80 group-hover:text-white transition-colors truncate">
                      {f.club_b?.name ?? "TBA"}
                    </p>
                  </div>

                  {/* Meta */}
                  <div className="hidden sm:flex items-center gap-3 shrink-0 pl-2">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[f.status] ?? "bg-cobalt"}`} />
                      <span className="text-[11px] text-white/30">{statusLabel[f.status] ?? f.status}</span>
                    </div>
                    {f.scheduled_at && (
                      <span className="text-[11px] text-white/20 w-14 text-right tabular-nums">
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

      {/* ── Clubs + Season Leaders ────────────────────────────────── */}
      {(topClubs.length > 0 || topPlayers.length > 0) && (
        <section className="py-20 bg-panel border-t border-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16">

              {topClubs.length > 0 && (
                <div>
                  <div className="flex items-end justify-between mb-8">
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-[0.5em] text-dim mb-3">Directory</p>
                      <h2 className="font-display font-black text-[2rem] text-white uppercase leading-none">Clubs</h2>
                    </div>
                    <Link href="/clubs" className="text-xs text-white/35 hover:text-white transition-colors pb-0.5">
                      All clubs
                    </Link>
                  </div>
                  <div className="border border-white/6 divide-y divide-white/5">
                    {topClubs.map((club, i) => (
                      <Link
                        key={club.id}
                        href={`/clubs/${club.slug}`}
                        className="flex items-center gap-4 px-4 py-3.5 hover:bg-white/[0.03] transition-colors group"
                      >
                        <span className="text-white/15 text-xs w-5 text-right shrink-0 tabular-nums font-mono">{i + 1}</span>
                        {club.logo_status === "approved" && club.logo_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={club.logo_url} alt={club.name} className="w-10 h-10 shrink-0 object-contain" />
                        ) : (
                          <div
                            className="w-10 h-10 shrink-0 flex items-center justify-center text-navy text-xs font-black"
                            style={{ backgroundColor: avatarColor(club.name) }}
                          >
                            {nameInitials(club.name)}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-white group-hover:text-gold transition-colors truncate">
                            {club.name}
                          </p>
                          <p className="text-xs text-white/30 truncate">{club.faculty}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {topPlayers.length > 0 && (
                <div>
                  <div className="flex items-end justify-between mb-8">
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-[0.5em] text-dim mb-3">Performance</p>
                      <h2 className="font-display font-black text-[2rem] text-white uppercase leading-none">Season Leaders</h2>
                    </div>
                    <Link href="/players" className="text-xs text-white/35 hover:text-white transition-colors pb-0.5">
                      All players
                    </Link>
                  </div>
                  <div className="border border-white/6 divide-y divide-white/5">
                    {topPlayers.map((player, i) => (
                      <div key={player.id} className="flex items-center gap-4 px-4 py-3.5">
                        <span className="text-white/15 text-xs w-5 text-right shrink-0 tabular-nums font-mono">{i + 1}</span>
                        {player.profile_picture_status === "approved" && player.profile_picture_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={player.profile_picture_url}
                            alt={player.gamer_tag}
                            className="w-7 h-7 shrink-0 rounded-full object-cover"
                          />
                        ) : (
                          <div
                            className="w-7 h-7 shrink-0 flex items-center justify-center text-navy text-[9px] font-black rounded-full"
                            style={{ backgroundColor: avatarColor(player.gamer_tag) }}
                          >
                            {nameInitials(player.gamer_tag)}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-white truncate">{player.gamer_tag}</p>
                          <p className="text-xs text-white/30 truncate">
                            {player.club?.name ?? "—"}
                            {player.position ? ` · ${player.position}` : ""}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-display font-black text-xl text-gold leading-none">{player.stats.wins}</p>
                          <p className="text-[9px] text-white/25 uppercase tracking-wider mt-0.5">wins</p>
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
        <section className="py-20 bg-navy border-t border-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.5em] text-dim mb-3">Latest</p>
                <h2 className="font-display font-black text-[2.5rem] text-white uppercase leading-none">News</h2>
              </div>
              <Link href="/news" className="text-xs text-white/35 hover:text-white transition-colors pb-1">
                All news
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 gap-px bg-white/5 border border-white/5">
              {newsItems.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="flex items-start gap-4 bg-card hover:bg-white/[0.03] transition-colors group p-5"
                >
                  {item.image_url ? (
                    <div className="w-20 h-16 shrink-0 overflow-hidden bg-panel">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.image_url}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  ) : (
                    <div className="w-20 h-16 shrink-0 bg-panel border border-white/6 flex items-center justify-center">
                      <span className="text-white/15 text-[8px] font-bold uppercase tracking-widest">No image</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0 py-0.5">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-gold/70">{item.source}</span>
                      <span className="text-white/20 text-[9px]">
                        {new Date(item.published_at).toLocaleDateString("en-GB", {
                          day: "numeric", month: "short",
                        })}
                      </span>
                    </div>
                    <h3 className="text-[13px] font-semibold text-white/80 leading-snug group-hover:text-white transition-colors line-clamp-2">
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
        <section className="py-14 bg-panel border-t border-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-center text-[9px] font-bold uppercase tracking-[0.5em] text-white/15 mb-10">
              Partners &amp; Sponsors
            </p>
            <div className="flex flex-wrap items-center justify-center gap-12">
              {sponsors.map((s) =>
                s.website_url ? (
                  <a
                    key={s.id}
                    href={s.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="opacity-70 hover:opacity-100 transition-opacity"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={s.logo_url} alt={s.name} className="h-14 object-contain" />
                  </a>
                ) : (
                  <div key={s.id} className="opacity-70">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={s.logo_url} alt={s.name} className="h-14 object-contain" />
                  </div>
                )
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── About Us ─────────────────────────────────────────────────── */}
      {siteSettings?.about_text && (
        <section className="py-20 bg-navy border-t border-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <p className="text-[9px] font-bold uppercase tracking-[0.5em] text-dim mb-5">About Us</p>
              <p className="text-white/55 text-[15px] leading-relaxed">{siteSettings.about_text}</p>
            </div>
          </div>
        </section>
      )}

      {/* ── CTA ──────────────────────────────────────────────────────── */}
      <section className="border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <p className="text-[9px] font-bold uppercase tracking-[0.5em] text-dim mb-6">{ctaEyebrow}</p>
          <h2
            className="font-display font-black text-white uppercase leading-[0.85]"
            style={{ fontSize: "clamp(3rem, 9vw, 8rem)" }}
          >
            {ctaHeadline}
          </h2>
          <p className="text-white/30 mt-6 max-w-md text-[15px] leading-relaxed">
            {ctaDesc}
          </p>
          <div className="mt-10 flex items-center gap-6">
            <Link
              href="/register"
              className="text-[11px] font-black uppercase tracking-[0.15em] bg-gold text-navy px-8 py-4 rounded hover:brightness-105 transition-all"
            >
              {ctaPrimary}
            </Link>
            <Link
              href="/sponsors"
              className="text-white/35 text-sm hover:text-white transition-colors"
            >
              {ctaSecondary}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
